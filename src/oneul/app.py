import sys
import subprocess
import datetime as _dt
from pathlib import Path

from PySide6.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QLabel, QHBoxLayout
from PySide6.QtCore import Qt, QTimer, QObject, QEvent, Signal

from .widgets import TimeLineWidget, DragScrollArea


class ClickableLabel(QLabel):
    clicked = Signal()

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.clicked.emit()
            event.accept()
            return
        super().mousePressEvent(event)


def main() -> None:
    app = QApplication(sys.argv)
    window = QMainWindow()
    window.setWindowTitle("Oneul")

    container = QWidget()
    container.setObjectName("content")
    layout = QVBoxLayout(container)
    layout.setContentsMargins(12, 12, 12, 12)
    layout.setSpacing(8)

    header_row = QHBoxLayout()
    header_row.setContentsMargins(0, 0, 0, 0)

    date_label = ClickableLabel("")
    date_label.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)
    date_label.setStyleSheet("font-size: 14px; font-weight: 600; color: rgba(240, 240, 240, 128);")

    title = QLabel("")
    title.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
    title.setStyleSheet("font-size: 14px; font-weight: 600; color: rgba(240, 240, 240, 128);")

    header_row.addWidget(date_label, 1)
    header_row.addWidget(title, 0)
    layout.addLayout(header_row)

    timeline = TimeLineWidget()
    scroll = DragScrollArea()
    scroll.setObjectName("timelineScroll")
    scroll.setWidgetResizable(True)
    scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
    scroll.setWidget(timeline)
    layout.addWidget(scroll)

    window.setCentralWidget(container)
    window.resize(480, 720)

    app.setStyleSheet(
        """
        QMainWindow { background: #121212; }
        QWidget#content { background: #121212; }
        QScrollArea#timelineScroll { background: #121212; border: none; }
        QScrollBar:vertical { background: #121212; width: 10px; margin: 0; }
        QScrollBar::handle:vertical { background: #2a2a2a; border-radius: 4px; min-height: 24px; }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }
        QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical { background: none; }
        """
    )
    window.show()

    _install_auto_reload(app)

    timeline.bind_scroll_area(scroll)
    _install_title_clock(app, title, date_label, scroll, timeline)
    date_label.clicked.connect(timeline.scroll_to_now)
    _install_sticky_header(scroll, timeline)

    sys.exit(app.exec())


def _install_auto_reload(app: QApplication) -> None:
    root = Path(__file__).resolve().parents[2]
    watch_paths = [root / "run.py"]
    watch_paths.extend((root / "src" / "oneul").rglob("*.py"))
    watch_paths = [path for path in watch_paths if "__pycache__" not in path.parts]
    mtimes = {}
    for path in watch_paths:
        try:
            mtimes[path] = path.stat().st_mtime
        except FileNotFoundError:
            mtimes[path] = None

    timer = QTimer(app)
    timer.setInterval(600)
    restarting = {"active": False}

    def _restart() -> None:
        if restarting["active"]:
            return
        restarting["active"] = True
        timer.stop()
        subprocess.Popen([sys.executable, str(root / "run.py")], cwd=str(root))
        app.quit()

    def _check() -> None:
        for path in watch_paths:
            try:
                mtime = path.stat().st_mtime
            except FileNotFoundError:
                mtime = None
            if mtimes.get(path) != mtime:
                _restart()
                return

    timer.timeout.connect(_check)
    timer.start()


def _install_title_clock(
    app: QApplication,
    time_label: QLabel,
    date_label: QLabel,
    scroll: DragScrollArea,
    timeline: TimeLineWidget,
) -> None:
    def _tick() -> None:
        now = _dt.datetime.now()
        time_text = _format_now_kr_short(now)
        scroll_y = scroll.verticalScrollBar().value()
        minutes = timeline.minutes_for_y(scroll_y + timeline.sticky_top_offset + 1)
        day_offset = int(minutes // (24 * 60))
        shown_date = timeline.start_date + _dt.timedelta(days=day_offset)
        if shown_date != now.date():
            date_label.setText(_format_today_kr(now))
        else:
            date_label.setText("")
        time_label.setText(time_text)

    timer = QTimer(app)
    timer.setInterval(100)
    timer.timeout.connect(_tick)
    _tick()
    timer.start()


def _format_now_kr() -> str:
    return _format_now_kr_short(_dt.datetime.now())


def _format_now_kr_short(now: _dt.datetime) -> str:
    hour_12 = now.hour % 12
    if hour_12 == 0:
        hour_12 = 12
    ampm = "AM" if now.hour < 12 else "PM"
    return f"{ampm} {hour_12}:{now.minute:02d}"


def _format_today_kr(now: _dt.datetime) -> str:
    weekday_kr = ["월", "화", "수", "목", "금", "토", "일"][now.weekday()]
    return f"{now.month:02d}-{now.day:02d} {weekday_kr}"

def _format_now_kr_long() -> str:
    now = _dt.datetime.now()
    weekday_en = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][now.weekday()]
    hour_12 = now.hour % 12
    if hour_12 == 0:
        hour_12 = 12
    ampm = "AM" if now.hour < 12 else "PM"
    return f"{now.year:04d}-{now.month:02d}-{now.day:02d} ({weekday_en}) {ampm} {hour_12}:{now.minute:02d}"

class _ViewportWatcher(QObject):
    def __init__(self, on_resize):
        super().__init__()
        self._on_resize = on_resize

    def eventFilter(self, obj, event):
        if event.type() == QEvent.Resize:
            self._on_resize()
        return False


def _install_sticky_header(scroll: DragScrollArea, timeline: TimeLineWidget) -> None:
    timeline.set_sticky_top_offset(0)

    def _update() -> None:
        timeline.update()

    watcher = _ViewportWatcher(_update)
    scroll.viewport().installEventFilter(watcher)
    timeline._watcher = watcher

    scroll.verticalScrollBar().valueChanged.connect(_update)
    _update()
