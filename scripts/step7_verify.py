from __future__ import annotations

import base64
import json
import os
import random
import shutil
import socket
import struct
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

from verify_artifacts import proof_path, write_named_json_report

ROOT_DIR = Path(__file__).resolve().parents[1]
APP_URL = "http://127.0.0.1:9999/"
CDP_PORT = int(os.getenv("ONEUL_CDP_PORT", "9223"))
BROWSER_PATH = Path(
    os.getenv(
        "ONEUL_BROWSER_PATH",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        if Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe").exists()
        else r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    )
)
BROWSER_HEADLESS = os.getenv("ONEUL_BROWSER_HEADLESS", "1").strip() not in {"0", "false", "False"}
BROWSER_EXISTING = os.getenv("ONEUL_CDP_EXISTING", "0").strip() in {"1", "true", "True"}
PROFILE_DIR = ROOT_DIR / ".tmp_edge_step7_profile"


def http_json(url: str, *, method: str = "GET", data: dict | None = None) -> dict:
    payload = None
    headers = {}
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=payload, method=method, headers=headers)
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.load(response)


def wait_for_debug_target(port: int, timeout: float = 60.0) -> str:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=2) as response:
                version_info = json.load(response)
            browser_ws_url = version_info.get("webSocketDebuggerUrl", "")
            if browser_ws_url:
                return browser_ws_url
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError("debug target not found")


def open_websocket(ws_url: str) -> socket.socket:
    parsed = urlparse(ws_url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 80
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"

    sock = socket.create_connection((host, port), timeout=5)
    key = base64.b64encode(os.urandom(16)).decode("ascii")
    request = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "\r\n"
    )
    sock.sendall(request.encode("ascii"))
    response = b""
    while b"\r\n\r\n" not in response:
        chunk = sock.recv(4096)
        if not chunk:
            break
        response += chunk
    header = response.decode("latin1", errors="ignore")
    if " 101 " not in header:
        raise RuntimeError(f"websocket handshake failed: {header}")
    return sock


def send_text(sock: socket.socket, text: str) -> None:
    payload = text.encode("utf-8")
    mask = os.urandom(4)
    frame = bytearray()
    frame.append(0x81)
    length = len(payload)
    if length < 126:
        frame.append(0x80 | length)
    elif length < 65536:
        frame.append(0x80 | 126)
        frame.extend(struct.pack("!H", length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack("!Q", length))
    frame.extend(mask)
    frame.extend(bytes(payload[i] ^ mask[i % 4] for i in range(length)))
    sock.sendall(frame)


def recv_message(sock: socket.socket) -> dict:
    while True:
        try:
            head = sock.recv(2)
        except TimeoutError:
            raise
        except socket.timeout as exc:
            raise TimeoutError from exc
        if len(head) < 2:
            raise RuntimeError("socket closed")
        opcode = head[0] & 0x0F
        masked = (head[1] & 0x80) != 0
        length = head[1] & 0x7F
        if length == 126:
            length = struct.unpack("!H", sock.recv(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", sock.recv(8))[0]
        mask = sock.recv(4) if masked else b""
        payload = b""
        while len(payload) < length:
            chunk = sock.recv(length - len(payload))
            if not chunk:
                raise RuntimeError("socket closed during payload")
            payload += chunk
        if masked:
            payload = bytes(payload[i] ^ mask[i % 4] for i in range(length))
        if opcode == 0x8:
            raise RuntimeError("websocket closed")
        if opcode == 0x9:
            pong = bytearray([0x8A, len(payload)])
            pong.extend(payload)
            sock.sendall(pong)
            continue
        if opcode == 0x1:
            return json.loads(payload.decode("utf-8", errors="replace"))


class CdpSession:
    def __init__(self, sock: socket.socket) -> None:
        self.sock = sock
        self.session_id: str | None = None

    def attach_to_target(self, target_id: str, timeout: float = 10.0) -> str:
        result = self.call(
            "Target.attachToTarget",
            {"targetId": target_id},
            timeout=timeout,
        )
        session_id = str(result.get("sessionId") or "").strip()
        if not session_id:
            raise RuntimeError("Target.attachToTarget did not return a sessionId")
        self.session_id = session_id
        return session_id

    def call(self, method: str, params: dict | None = None, timeout: float = 10.0) -> dict:
        message_id = random.randint(1, 1_000_000)
        send_text(
            self.sock,
            json.dumps({"id": message_id, "method": method, "params": params or {}}),
        )
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                data = recv_message(self.sock)
            except TimeoutError:
                continue
            if data.get("id") == message_id:
                if "error" in data:
                    raise RuntimeError(f"{method} failed: {data['error']}")
                return data.get("result", {})
        raise RuntimeError(f"{method} timed out")

    def call_session(self, method: str, params: dict | None = None, timeout: float = 10.0) -> dict:
        if not self.session_id:
            raise RuntimeError("session is not attached")
        outer_id = random.randint(1, 1_000_000)
        inner_id = random.randint(1, 1_000_000)
        send_text(
            self.sock,
            json.dumps(
                {
                    "id": outer_id,
                    "method": "Target.sendMessageToTarget",
                    "params": {
                        "sessionId": self.session_id,
                        "message": json.dumps(
                            {"id": inner_id, "method": method, "params": params or {}}
                        ),
                    },
                }
            ),
        )
        deadline = time.time() + timeout
        outer_ack_seen = False
        while time.time() < deadline:
            try:
                data = recv_message(self.sock)
            except TimeoutError:
                continue
            if data.get("id") == outer_id:
                if "error" in data:
                    raise RuntimeError(f"{method} failed: {data['error']}")
                outer_ack_seen = True
                continue
            if data.get("method") != "Target.receivedMessageFromTarget":
                continue
            params_payload = data.get("params")
            if not isinstance(params_payload, dict):
                continue
            if params_payload.get("sessionId") != self.session_id:
                continue
            raw_message = params_payload.get("message")
            if not isinstance(raw_message, str):
                continue
            try:
                inner = json.loads(raw_message)
            except json.JSONDecodeError:
                continue
            if inner.get("id") != inner_id:
                continue
            if "error" in inner:
                raise RuntimeError(f"{method} failed: {inner['error']}")
            return inner.get("result", {})
        suffix = "" if outer_ack_seen else " before outer ack"
        raise RuntimeError(f"{method} timed out{suffix}")

    def evaluate(
        self,
        expression: str,
        *,
        await_promise: bool = True,
        timeout: float = 30.0,
    ):
        result = self.call_session(
            "Runtime.evaluate",
            {
                "expression": expression,
                "awaitPromise": await_promise,
                "returnByValue": True,
            },
            timeout=timeout,
        )
        payload = result.get("result", {})
        if "value" in payload:
            return payload["value"]
        if payload.get("type") == "undefined":
            return None
        return payload

    def screenshot(self, path: Path) -> None:
        result = self.call_session(
            "Page.captureScreenshot",
            {"format": "png", "fromSurface": True, "captureBeyondViewport": False},
            timeout=45.0,
        )
        path.write_bytes(base64.b64decode(result["data"]))


def wait_for_page_target(session: CdpSession, target_url: str = "", timeout: float = 60.0) -> str:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            result = session.call("Target.getTargets", timeout=5.0)
            target_infos = result.get("targetInfos")
            if isinstance(target_infos, list):
                for target in target_infos:
                    if not isinstance(target, dict):
                        continue
                    if target.get("type") != "page":
                        continue
                    url = str(target.get("url") or "")
                    target_id = str(target.get("targetId") or "").strip()
                    if target_url and not url.startswith(target_url):
                        continue
                    if target_id:
                        return target_id
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError("page target not found")


def wait_until(session: CdpSession, expression: str, *, timeout: float = 8.0, interval: float = 0.1) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            result = session.evaluate(expression, await_promise=True, timeout=max(1.0, interval + 0.5))
            if result:
                return True
        except Exception:
            pass
        time.sleep(interval)
    return False


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def restore_alarm_items(items: list[dict]) -> None:
    http_json(f"{APP_URL}api/alarms", method="PUT", data={"items": items})


def load_alarm_items() -> list[dict]:
    payload = http_json(f"{APP_URL}api/alarms")
    items = payload.get("items")
    return items if isinstance(items, list) else []


def launch_browser() -> subprocess.Popen:
    if not BROWSER_PATH.exists():
        raise FileNotFoundError(f"browser not found: {BROWSER_PATH}")
    if PROFILE_DIR.exists():
        shutil.rmtree(PROFILE_DIR, ignore_errors=True)
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    args = [
        str(BROWSER_PATH),
        "--disable-gpu",
        "--disable-extensions",
        "--no-first-run",
        "--no-default-browser-check",
        f"--remote-debugging-port={CDP_PORT}",
        f"--user-data-dir={PROFILE_DIR}",
        "about:blank",
    ]
    if BROWSER_HEADLESS:
        args.insert(1, "--headless=new")
    return subprocess.Popen(
        args,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def install_page(session: CdpSession) -> None:
    session.call_session("Page.enable")
    session.call_session("Runtime.enable")
    session.call_session("Emulation.setDeviceMetricsOverride", {
        "width": 1280,
        "height": 960,
        "deviceScaleFactor": 1,
        "mobile": False,
    })
    session.call_session("Page.navigate", {"url": APP_URL}, timeout=20.0)
    ok = wait_until(
        session,
        """
        (async () => {
          if (document.readyState !== "complete") return false;
          const statusBar = document.getElementById("statusBar");
          const timelineWrap = document.getElementById("timelineWrap");
          return Boolean(statusBar && timelineWrap);
        })()
        """,
        timeout=60.0,
        interval=0.2,
    )
    if not ok:
        raise RuntimeError("page did not finish loading")
    time.sleep(1.2)


def click_modal_confirm(session: CdpSession) -> None:
    time.sleep(0.35)
    session.evaluate(
        """
        (() => {
          const buttons = Array.from(document.querySelectorAll(".modal-btn"));
          const target = buttons.find((btn) => btn.classList.contains("primary")) || buttons[0];
          if (target) target.click();
          return true;
        })()
        """
    )


def set_modal_input_and_confirm(session: CdpSession, value: str) -> None:
    escaped = js_string(value)
    time.sleep(0.35)
    session.evaluate(
        f"""
        (() => {{
          const input = document.querySelector(".modal-input");
          if (!input) return false;
          input.focus();
          input.value = {escaped};
          input.dispatchEvent(new Event("input", {{ bubbles: true }}));
          return true;
        }})()
        """
    )
    click_modal_confirm(session)


def maybe_complete_wake_setup(session: CdpSession) -> bool:
    wake_time_configured = """
        (() => {
          const wakeBtn = document.getElementById("statusWakeTimeBtn");
          const text = wakeBtn && wakeBtn.textContent ? wakeBtn.textContent.trim() : "";
          return /^\\d{2}:\\d{2}$/.test(text);
        })()
    """
    modal_open = '(() => Boolean(document.querySelector(".modal-overlay.open")))()'
    modal_input_open = '(() => Boolean(document.querySelector(".modal-overlay.open .modal-input")))()'

    if session.evaluate(wake_time_configured):
        return True

    init_modal = wait_until(session, modal_open, timeout=2.0, interval=0.1)
    if not init_modal:
        session.evaluate(
            """
            (() => {
              const wakeBtn = document.getElementById("statusWakeTimeBtn");
              if (wakeBtn) wakeBtn.click();
              return true;
            })()
            """
        )
        wait_until(session, modal_open, timeout=5.0, interval=0.1)
    else:
        click_modal_confirm(session)

    if wait_until(session, wake_time_configured, timeout=1.0, interval=0.1):
        return True
    if not wait_until(session, modal_input_open, timeout=5.0, interval=0.1):
        return False

    set_modal_input_and_confirm(session, "07:10")
    if wait_until(session, wake_time_configured, timeout=1.0, interval=0.1):
        return True
    if not wait_until(session, modal_input_open, timeout=5.0, interval=0.1):
        return False

    set_modal_input_and_confirm(session, "8:15")
    if not wait_until(
        session,
        '(() => !document.querySelector(".modal-overlay.open"))()',
        timeout=5.0,
        interval=0.1,
    ):
        return False

    return bool(wait_until(session, wake_time_configured, timeout=5.0, interval=0.1))

def press_escape(session: CdpSession) -> None:
    session.evaluate(
        """
        (() => {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          return true;
        })()
        """
    )


def open_day_stack(session: CdpSession) -> bool:
    session.evaluate(
        """
        (() => {
          const btn = document.getElementById("statusNowBtn");
          if (btn) btn.click();
          return true;
        })()
        """
    )
    opened = wait_until(
        session,
        '(() => document.getElementById("dayStackLayer")?.classList.contains("open") || false)()',
        timeout=5.0,
        interval=0.1,
    )
    if opened:
        time.sleep(0.6)
    return opened


def close_modal(session: CdpSession) -> None:
    session.evaluate(
        """
        (() => {
          if (typeof hideModal === "function") {
            hideModal();
          }
          return true;
        })()
        """
    )


def dispatch_mouse_long_press(session: CdpSession, x: float, y: float, hold: float = 0.45) -> None:
    session.call_session("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x, "y": y}, timeout=15.0)
    session.call_session(
        "Input.dispatchMouseEvent",
        {
            "type": "mousePressed",
            "x": x,
            "y": y,
            "button": "left",
            "buttons": 1,
            "clickCount": 1,
        },
        timeout=15.0,
    )
    time.sleep(hold)
    session.call_session(
        "Input.dispatchMouseEvent",
        {
            "type": "mouseReleased",
            "x": x,
            "y": y,
            "button": "left",
            "buttons": 0,
            "clickCount": 1,
        },
        timeout=15.0,
    )


def ensure_sleep_window_preferences(session: CdpSession) -> dict:
    return session.evaluate(
        """
        (() => {
          try {
            localStorage.setItem("oneul:wake-time", "07:00");
            localStorage.setItem("oneul:sleep-duration-minutes", "480");
            localStorage.setItem("oneul:wake-setup-prompted", "1");
          } catch (_) {}
          if (typeof userWakeTimePreference !== "undefined") {
            userWakeTimePreference = "07:00";
          }
          if (typeof userSleepDurationMinutes !== "undefined") {
            userSleepDurationMinutes = 480;
          }
          if (typeof updateWakeTimeButton === "function") {
            updateWakeTimeButton();
          }
          if (typeof refreshSleepWindowDisplays === "function") {
            refreshSleepWindowDisplays();
          }
          if (typeof hideModal === "function") {
            hideModal();
          }
          return {
            timelineCount: document.querySelectorAll(".sleep-window").length,
            dayStackCount: document.querySelectorAll(".dayStackSleepWindow").length,
            wakeText: document.getElementById("statusWakeTimeBtn")?.textContent || ""
          };
        })()
        """
    )


def sleep_window_pointer_target(session: CdpSession, selector: str) -> dict:
    escaped_selector = js_string(selector)
    return session.evaluate(
        f"""
        ((selector) => {{
          const nodes = Array.from(document.querySelectorAll(selector));
          const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
          const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
          const visibleInfo = (node) => {{
            const rect = node.getBoundingClientRect();
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(viewportHeight, rect.bottom);
            const visibleLeft = Math.max(0, rect.left);
            const visibleRight = Math.min(viewportWidth, rect.right);
            return {{
              node,
              rect,
              visibleTop,
              visibleBottom,
              visibleLeft,
              visibleRight,
              visibleHeight: Math.max(0, visibleBottom - visibleTop),
              visibleWidth: Math.max(0, visibleRight - visibleLeft)
            }};
          }};
          let info = nodes.map(visibleInfo).find((item) => item.visibleHeight > 8 && item.visibleWidth > 8);
          let scrolled = false;
          if (!info && nodes.length) {{
            nodes[0].scrollIntoView({{ block: "center", inline: "nearest" }});
            scrolled = true;
            info = visibleInfo(nodes[0]);
          }}
          const node = info ? info.node : null;
          if (!node) return {{ exists: false }};
          const rect = info.rect;
          const x = info.visibleLeft + info.visibleWidth / 2;
          const y = info.visibleTop + info.visibleHeight / 2;
          const topNode = document.elementFromPoint(x, y);
          const hitSleepWindow = Boolean(topNode && topNode.closest && topNode.closest(selector));
          return {{
            exists: true,
            x,
            y,
            hitSleepWindow,
            scrolled,
            visibleWidth: info.visibleWidth,
            visibleHeight: info.visibleHeight,
            width: rect.width,
            height: rect.height,
            topClassName: topNode ? String(topNode.className || "") : ""
          }};
        }})({escaped_selector})
        """
    )


def stable_sleep_window_pointer_target(session: CdpSession, selector: str) -> dict:
    target = sleep_window_pointer_target(session, selector)
    for _ in range(3):
        time.sleep(0.3)
        next_target = sleep_window_pointer_target(session, selector)
        if target.get("exists") and next_target.get("exists"):
            same_x = abs(float(target.get("x", 0)) - float(next_target.get("x", 0))) <= 1
            same_y = abs(float(target.get("y", 0)) - float(next_target.get("y", 0))) <= 1
            if same_x and same_y and not next_target.get("scrolled"):
                return next_target
        target = next_target
    return target


def verify_sleep_window_long_press(session: CdpSession, selector: str, screenshot_path: Path) -> dict:
    close_modal(session)
    prefs = ensure_sleep_window_preferences(session)
    target = stable_sleep_window_pointer_target(session, selector)
    if target.get("scrolled"):
        time.sleep(0.3)
        target = stable_sleep_window_pointer_target(session, selector)
    if not target.get("exists") or not target.get("hitSleepWindow"):
        return {"ok": False, "prefs": prefs, "target": target}

    time.sleep(0.2)
    try:
        dispatch_mouse_long_press(session, float(target["x"]), float(target["y"]))
    except RuntimeError as exc:
        close_modal(session)
        return {"ok": False, "prefs": prefs, "target": target, "error": str(exc)}
    opened = wait_until(
        session,
        """
        (() => {
          const overlay = document.querySelector(".modal-overlay.open");
          const title = overlay?.querySelector(".modal-title")?.textContent || "";
          const input = overlay?.querySelector(".modal-input");
          return Boolean(input && title.includes("기상 시간"));
        })()
        """,
        timeout=5.0,
        interval=0.1,
    )
    if opened:
        session.screenshot(screenshot_path)
    close_modal(session)
    return {"ok": bool(opened), "prefs": prefs, "target": target}


def verify_step7(session: CdpSession, original_alarm_items: list[dict]) -> dict:
    results: dict[str, object] = {
        "pass": False,
        "issues": [],
        "proof_files": [],
    }

    screenshots = {
        "home": proof_path("verify-step7-home.png"),
        "today_focus": proof_path("verify-step7-today-focus.png"),
        "day_stack": proof_path("verify-step7-day-stack.png"),
        "month_toggle": proof_path("verify-step7-month-toggle.png"),
        "context_back": proof_path("verify-step7-context-back.png"),
        "alarm_roundtrip": proof_path("verify-step7-alarm-roundtrip.png"),
        "sleep_long_press_timeline": proof_path("verify-step7-sleep-long-press-timeline.png"),
        "sleep_long_press_day_stack": proof_path("verify-step7-sleep-long-press-day-stack.png"),
    }

    wake_ok = maybe_complete_wake_setup(session)
    if not wake_ok:
        results["issues"].append("wake_sleep_setup_failed")

    home_summary = session.evaluate(
        """
        (() => ({
          title: document.title,
          statusDateText: document.getElementById("statusDateText")?.textContent || "",
          statusTimeText: document.getElementById("statusTimeText")?.textContent || "",
          weatherText: document.getElementById("statusWeatherTickerText")?.textContent || "",
          wakeText: document.getElementById("statusWakeTimeBtn")?.textContent || "",
          googleText: document.getElementById("statusGoogleBtn")?.textContent || "",
          timelineExists: Boolean(document.getElementById("timelineWrap")),
          dayStackOpen: document.getElementById("dayStackLayer")?.classList.contains("open") || false,
          todayFocusActive: document.getElementById("statusTodayFeatureBtn")?.classList.contains("is-active") || false
        }))()
        """
    )
    session.screenshot(screenshots["home"])
    results["proof_files"].append(screenshots["home"].name)

    session.evaluate(
        """
        (() => {
          const btn = document.getElementById("statusTodayFeatureBtn");
          if (btn) btn.click();
          return true;
        })()
        """
    )
    if not wait_until(
        session,
        '(() => document.getElementById("statusTodayFeatureBtn")?.classList.contains("is-active") || false)()',
        timeout=5.0,
        interval=0.1,
    ):
        results["issues"].append("today_focus_enter_failed")
    session.screenshot(screenshots["today_focus"])
    results["proof_files"].append(screenshots["today_focus"].name)

    sleep_timeline_result = verify_sleep_window_long_press(
        session,
        ".sleep-window",
        screenshots["sleep_long_press_timeline"],
    )
    if sleep_timeline_result.get("ok"):
        results["proof_files"].append(screenshots["sleep_long_press_timeline"].name)
    else:
        results["issues"].append("sleep_window_long_press_timeline_failed")

    session.call_session("Page.reload", {"ignoreCache": True}, timeout=20.0)
    if not wait_until(
        session,
        """
        (async () => {
          if (document.readyState !== "complete") return false;
          return Boolean(document.getElementById("statusTodayFeatureBtn"));
        })()
        """,
        timeout=20.0,
        interval=0.2,
    ):
        results["issues"].append("reload_failed")

    refresh_persist_ok = wait_until(
        session,
        '(() => document.getElementById("statusTodayFeatureBtn")?.classList.contains("is-active") || false)()',
        timeout=5.0,
        interval=0.1,
    )
    if not refresh_persist_ok:
        results["issues"].append("refresh_persistence_failed")

    session.evaluate(
        """
        (() => {
          const wrap = document.getElementById("timelineWrap");
          if (!wrap) return false;
          const rect = wrap.getBoundingClientRect();
          const x = rect.left + Math.min(rect.width * 0.5, rect.width - 40);
          const y = rect.top + Math.min(rect.height * 0.5, rect.height - 40);
          const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            button: 2,
            buttons: 2,
            clientX: x,
            clientY: y,
          });
          wrap.dispatchEvent(event);
          return true;
        })()
        """
    )
    if not wait_until(
        session,
        """
        (() => {
          const stackOpen = document.getElementById("dayStackLayer")?.classList.contains("open") || false;
          const todayFocus = document.getElementById("statusTodayFeatureBtn")?.classList.contains("is-active") || false;
          return stackOpen && !todayFocus;
        })()
        """,
        timeout=5.0,
        interval=0.1,
    ):
        results["issues"].append("context_back_failed")
    session.screenshot(screenshots["context_back"])
    results["proof_files"].append(screenshots["context_back"].name)

    press_escape(session)
    if not wait_until(
        session,
        '(() => !(document.getElementById("dayStackLayer")?.classList.contains("open") || false))()',
        timeout=5.0,
        interval=0.1,
    ):
        results["issues"].append("day_stack_close_failed")

    if not open_day_stack(session):
        results["issues"].append("day_stack_open_failed")
    session.screenshot(screenshots["day_stack"])
    results["proof_files"].append(screenshots["day_stack"].name)

    sleep_day_stack_result = verify_sleep_window_long_press(
        session,
        ".dayStackSleepWindow",
        screenshots["sleep_long_press_day_stack"],
    )
    if sleep_day_stack_result.get("ok"):
        results["proof_files"].append(screenshots["sleep_long_press_day_stack"].name)
    else:
        results["issues"].append("sleep_window_long_press_day_stack_failed")

    month_toggle_ok = session.evaluate(
        """
        (async () => {
          const firstRail = document.querySelector(".dayStackMonthRail");
          if (!firstRail) return false;
          firstRail.click();
          await new Promise((resolve) => setTimeout(resolve, 700));
          const openedRail = document.querySelector(".dayStackMonthRail");
          const opened = openedRail && openedRail.getAttribute("aria-expanded") === "true";
          if (!openedRail) return false;
          openedRail.click();
          await new Promise((resolve) => setTimeout(resolve, 700));
          const closedRail = document.querySelector(".dayStackMonthRail");
          const closed = closedRail && closedRail.getAttribute("aria-expanded") === "false";
          return opened && closed;
        })()
        """
    )
    if not month_toggle_ok:
        results["issues"].append("month_toggle_failed")

    session.evaluate(
        """
        (() => {
          const rail = document.querySelector('.dayStackMonthRail');
          if (rail) rail.click();
          return true;
        })()
        """
    )
    time.sleep(0.5)
    session.screenshot(screenshots["month_toggle"])
    results["proof_files"].append(screenshots["month_toggle"].name)

    press_escape(session)
    wait_until(
        session,
        '(() => !(document.getElementById("dayStackLayer")?.classList.contains("open") || false))()',
        timeout=5.0,
        interval=0.1,
    )

    created_ok = session.evaluate(
        """
        (async () => {
          const now = new Date();
          now.setHours(Math.min(23, now.getHours() + 1), 15, 0, 0);
          promptAlarmCreation(now);
          return true;
        })()
        """
    )
    if not created_ok:
        results["issues"].append("alarm_create_prompt_failed")
    click_modal_confirm(session)
    if not wait_until(
        session,
        '(() => Boolean(document.querySelector(".modal-overlay.open .modal-input")))()',
        timeout=5.0,
        interval=0.1,
    ):
        results["issues"].append("alarm_create_input_failed")
    set_modal_input_and_confirm(session, "Step7 Alarm")
    time.sleep(0.8)

    alarms_after_create = load_alarm_items()
    created_alarm = next((item for item in alarms_after_create if item.get("title") == "Step7 Alarm"), None)
    if not created_alarm:
        results["issues"].append("alarm_create_save_failed")

    edited_ok = session.evaluate(
        """
        (async () => {
          const index = alarms.findIndex((item) => item && item.title === "Step7 Alarm");
          if (index < 0) return false;
          promptTodayFocusAlarmEdit({ alarmIndex: index, title: "Step7 Alarm" });
          return true;
        })()
        """
    )
    if not edited_ok:
        results["issues"].append("alarm_edit_prompt_failed")
    if not wait_until(
        session,
        '(() => Boolean(document.querySelector(".modal-overlay.open .modal-input")))()',
        timeout=5.0,
        interval=0.1,
    ):
        results["issues"].append("alarm_edit_input_failed")
    set_modal_input_and_confirm(session, "Step7 Alarm Edited")
    time.sleep(0.8)

    alarms_after_edit = load_alarm_items()
    edited_alarm = next((item for item in alarms_after_edit if item.get("title") == "Step7 Alarm Edited"), None)
    if not edited_alarm:
        results["issues"].append("alarm_edit_save_failed")

    session.evaluate(
        """
        (async () => {
          const index = alarms.findIndex((item) => item && item.title === "Step7 Alarm Edited");
          if (index < 0) return false;
          alarms.splice(index, 1);
          markLocalAlarmStoreDirty();
          await requestLocalAlarmStoreSave();
          renderAllAlarmViews();
          return true;
        })()
        """
    )
    time.sleep(0.8)

    alarms_after_delete = load_alarm_items()
    if any(item.get("title") == "Step7 Alarm Edited" for item in alarms_after_delete):
        results["issues"].append("alarm_delete_save_failed")

    session.evaluate(
        """
        (() => {
          const line = Array.from(document.querySelectorAll(".alarm-line"))
            .find((node) => (node.textContent || "").includes("Step7 Alarm"));
          if (line) {
            line.scrollIntoView({ block: "center" });
          }
          return true;
        })()
        """
    )
    time.sleep(0.4)
    session.screenshot(screenshots["alarm_roundtrip"])
    results["proof_files"].append(screenshots["alarm_roundtrip"].name)

    restore_alarm_items(original_alarm_items)

    summary = {
        "home": home_summary,
        "refresh_persistence_ok": refresh_persist_ok,
        "wake_setup_ok": wake_ok,
        "sleep_long_press_timeline": sleep_timeline_result,
        "sleep_long_press_day_stack": sleep_day_stack_result,
        "alarm_count_before": len(original_alarm_items),
        "alarm_count_after_restore": len(load_alarm_items()),
    }
    results["summary"] = summary
    results["pass"] = len(results["issues"]) == 0
    return results


def main() -> int:
    original_alarm_items = load_alarm_items()
    browser = None
    sock = None
    try:
        if not BROWSER_EXISTING:
            browser = launch_browser()
        ws_url = wait_for_debug_target(CDP_PORT)
        sock = open_websocket(ws_url)
        sock.settimeout(5)
        session = CdpSession(sock)
        target_id = wait_for_page_target(session)
        session.attach_to_target(target_id)
        install_page(session)
        results = verify_step7(session, original_alarm_items)
        write_named_json_report("step7_verify", results)
        print(json.dumps(results, ensure_ascii=True, indent=2))
        return 0 if results.get("pass") else 1
    finally:
        try:
            restore_alarm_items(original_alarm_items)
        except Exception:
            pass
        if sock is not None:
            try:
                sock.close()
            except Exception:
                pass
        if browser is not None:
            try:
                browser.terminate()
                browser.wait(timeout=5)
            except Exception:
                try:
                    browser.kill()
                except Exception:
                    pass


if __name__ == "__main__":
    raise SystemExit(main())

