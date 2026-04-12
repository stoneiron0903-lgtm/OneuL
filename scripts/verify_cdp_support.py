from __future__ import annotations

import os
import socket
from contextlib import contextmanager
from typing import Iterator

from step7_verify import CdpSession, open_websocket, wait_for_debug_target, wait_until


APP_URL = os.getenv("ONEUL_APP_URL", "http://127.0.0.1:9999/")
CDP_PORT = int(os.getenv("ONEUL_CDP_PORT", "9224"))


@contextmanager
def open_browser_connection(port: int = CDP_PORT) -> Iterator[tuple[socket.socket, CdpSession]]:
    browser_sock = open_websocket(wait_for_debug_target(port))
    browser_sock.settimeout(5)
    try:
        yield browser_sock, CdpSession(browser_sock)
    finally:
        try:
            browser_sock.close()
        except Exception:
            pass


def attach_new_page(
    browser_session: CdpSession,
    url: str = APP_URL,
    *,
    width: int = 1280,
    height: int = 960,
) -> CdpSession:
    result = browser_session.call("Target.createTarget", {"url": "about:blank"}, timeout=10.0)
    target_id = str(result.get("targetId") or "").strip()
    if not target_id:
        raise RuntimeError("Target.createTarget did not return a targetId")
    page_session = CdpSession(browser_session.sock)
    page_session.attach_to_target(target_id)
    page_session.call_session("Page.enable")
    page_session.call_session("Runtime.enable")
    page_session.call_session(
        "Emulation.setDeviceMetricsOverride",
        {
            "width": width,
            "height": height,
            "deviceScaleFactor": 1,
            "mobile": False,
        },
    )
    page_session.call_session("Page.navigate", {"url": url}, timeout=20.0)
    return page_session


def wait_for_app_ready(
    session: CdpSession,
    *,
    required_ids: tuple[str, ...],
    timeout: float = 30.0,
    interval: float = 0.2,
) -> None:
    checks = " && ".join(f'document.getElementById("{item}")' for item in required_ids)
    ok = wait_until(
        session,
        f"""
        (async () => {{
          if (document.readyState !== "complete") return false;
          return Boolean({checks});
        }})()
        """,
        timeout=timeout,
        interval=interval,
    )
    if not ok:
        raise RuntimeError("page did not finish loading")

