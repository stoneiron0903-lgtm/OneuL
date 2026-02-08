import datetime as _dt
from PySide6.QtCore import QTimer, QRectF, QSize, Qt, QElapsedTimer
from PySide6.QtGui import QPainter, QPen, QFont, QColor
from PySide6.QtWidgets import QWidget, QScrollArea


class DragScrollArea(QScrollArea):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._drag_active = False
        self._drag_start_pos = None
        self._drag_start_value = 0
        self._velocity = 0.0
        self._last_pos = None
        self._last_ms = None
        self._drag_timer = QElapsedTimer()
        self._inertia_timer = QTimer(self)
        self._inertia_timer.setInterval(16)
        self._inertia_timer.timeout.connect(self._on_inertia_tick)
        self._decel = 0.0028

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self._drag_active = True
            self._drag_start_pos = event.position().toPoint()
            self._drag_start_value = self.verticalScrollBar().value()
            self._last_pos = self._drag_start_pos
            self._drag_timer.restart()
            self._last_ms = 0
            self._velocity = 0.0
            if self._inertia_timer.isActive():
                self._inertia_timer.stop()
            self.setCursor(Qt.ClosedHandCursor)
            event.accept()
            return
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if self._drag_active and self._drag_start_pos is not None:
            pos = event.position().toPoint()
            delta = pos.y() - self._drag_start_pos.y()
            self.verticalScrollBar().setValue(self._drag_start_value - delta)
            if self._last_pos is not None and self._last_ms is not None:
                now_ms = self._drag_timer.elapsed()
                dt_ms = max(1, now_ms - self._last_ms)
                dy = pos.y() - self._last_pos.y()
                inst_v = -dy / dt_ms
                self._velocity = self._velocity * 0.6 + inst_v * 0.4
                self._last_ms = now_ms
                self._last_pos = pos
            event.accept()
            return
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        if self._drag_active and event.button() == Qt.LeftButton:
            self._drag_active = False
            self._drag_start_pos = None
            self._last_pos = None
            self._last_ms = None
            self.setCursor(Qt.ArrowCursor)
            if abs(self._velocity) > 0.02:
                if not self._inertia_timer.isActive():
                    self._inertia_timer.start()
            event.accept()
            return
        super().mouseReleaseEvent(event)

    def _on_inertia_tick(self) -> None:
        if abs(self._velocity) < 0.02:
            self._velocity = 0.0
            self._inertia_timer.stop()
            return
        bar = self.verticalScrollBar()
        new_value = bar.value() + int(self._velocity * self._inertia_timer.interval())
        if new_value < bar.minimum() or new_value > bar.maximum():
            self._velocity = 0.0
            self._inertia_timer.stop()
            return
        bar.setValue(new_value)
        if self._velocity > 0:
            self._velocity = max(0.0, self._velocity - self._decel * self._inertia_timer.interval())
        else:
            self._velocity = min(0.0, self._velocity + self._decel * self._inertia_timer.interval())


class TimeLineWidget(QWidget):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.minute_height = 0.5
        self.left_pad = 56
        self.top_pad = 0
        self.bottom_pad = 8
        self.day_bar_height = 24
        self.sticky_top_offset = 0
        self.days_before = 1
        self.days_after = 1
        self.start_date = _dt.date.today() - _dt.timedelta(days=self.days_before)
        self._shift_active = False
        self._scroll_area: QScrollArea | None = None

        self._timer = QTimer(self)
        self._timer.setInterval(1000)
        self._timer.timeout.connect(self._on_tick)
        self._timer.start()

        self.setMinimumWidth(360)
        self.setAutoFillBackground(True)

    def minutes_for_y(self, y: float) -> float:
        y_rel = y - self.top_pad
        if y_rel <= 0:
            return 0.0
        day_span = 24 * 60 * self.minute_height
        y_rel -= self.day_bar_height
        if y_rel <= 0:
            return 0.0
        block = day_span + self.day_bar_height
        day_offset = int(y_rel // block)
        within = y_rel - day_offset * block
        if within <= day_span:
            minutes = day_offset * 24 * 60 + within / self.minute_height
        else:
            minutes = (day_offset + 1) * 24 * 60
        return max(0.0, min(self._total_minutes() - 0.001, minutes))

    def date_label_for_minutes(self, minutes: float) -> str:
        day_offset = int(minutes // (24 * 60))
        date = self.start_date + _dt.timedelta(days=day_offset)
        weekday_kr = ["월", "화", "수", "목", "금", "토", "일"]
        return f"{date.year:04d}-{date.month:02d}-{date.day:02d} ({weekday_en[date.weekday()]})"

    def bind_scroll_area(self, scroll: QScrollArea) -> None:
        self._scroll_area = scroll
        scroll.verticalScrollBar().valueChanged.connect(self._on_scroll)

    def _on_scroll(self, _value: int) -> None:
        self._maybe_shift_window()

    def set_sticky_top_offset(self, offset: int) -> None:
        self.sticky_top_offset = max(0, offset)

    def sizeHint(self):
        height = int(
            self._total_minutes() * self.minute_height
            + self.top_pad
            + self.bottom_pad
            + self._total_days() * self.day_bar_height
        )
        return QSize(420, height)

    def minimumSizeHint(self):
        height = int(
            self._total_minutes() * self.minute_height
            + self.top_pad
            + self.bottom_pad
            + self._total_days() * self.day_bar_height
        )
        return QSize(360, height)

    def _on_tick(self) -> None:
        self.update()

    def _scroll_to_now(self) -> None:
        if not self._scroll_area:
            return
        today = _dt.date.today()
        day_offset = (today - self.start_date).days
        if day_offset < 0 or day_offset >= self._total_days():
            self.start_date = today - _dt.timedelta(days=self.days_before)
            day_offset = self.days_before
        now_minutes = _minutes_since_midnight()
        y_now = self._y_for_minutes(day_offset * 24 * 60 + now_minutes)
        bar = self._scroll_area.verticalScrollBar()
        target = max(0, int(y_now - (self.day_bar_height + 17)))
        self._shift_active = True
        bar.setValue(target)
        self._shift_active = False
        self.update()

    def scroll_to_now(self) -> None:
        self._scroll_to_now()

    def _y_for_minutes(self, minutes_since_midnight: float) -> float:
        day_offset = int(minutes_since_midnight // (24 * 60))
        day_offset = min(day_offset, self._total_days() - 1)
        return self.top_pad + minutes_since_midnight * self.minute_height + (day_offset + 1) * self.day_bar_height

    def y_for_minutes(self, minutes_since_midnight: float) -> float:
        return self._y_for_minutes(minutes_since_midnight)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        rect = self.rect()
        painter.fillRect(rect, QColor(18, 18, 18))

        time_font = QFont()
        time_font.setPointSize(8)
        painter.setFont(time_font)

        line_pen = QPen(QColor(42, 42, 42))
        line_pen.setWidth(1)
        painter.setPen(line_pen)

        total_height = int(
            self._total_minutes() * self.minute_height
            + self.top_pad
            + self.bottom_pad
            + self._total_days() * self.day_bar_height
        )
        self.setMinimumHeight(total_height)

        total_hours = self._total_days() * 24
        for hour in range(0, total_hours + 1):
            y = self._y_for_minutes(hour * 60)
            painter.setPen(QPen(QColor(180, 180, 180)))
            day_hour = hour % 24
            label = "24:00" if (hour % 24 == 0 and hour != 0) else f"{day_hour:02d}:00"
            painter.setFont(time_font)
            painter.drawText(8, int(y) + 14, label)
            painter.setPen(QPen(QColor(42, 42, 42)))
            painter.drawLine(self.left_pad, int(y), rect.width() - 12, int(y))

            if hour != 0:
                half_y = y + 30 * self.minute_height
                painter.setPen(QPen(QColor(32, 32, 32)))
                painter.drawLine(self.left_pad + 16, int(half_y), rect.width() - 12, int(half_y))

        now_minutes = _minutes_since_midnight(include_seconds=True)
        today = _dt.date.today()
        day_offset = (today - self.start_date).days
        if 0 <= day_offset < self._total_days():
            y_now = self._y_for_minutes(day_offset * 24 * 60 + now_minutes)
            now_pen = QPen(QColor(255, 90, 90))
            now_pen.setWidth(2)
            painter.setPen(now_pen)
            painter.drawLine(self.left_pad, int(y_now), rect.width() - 12, int(y_now))

            dot_radius = 4
            painter.setBrush(QColor(255, 90, 90))
            painter.drawEllipse(QRectF(self.left_pad - dot_radius, y_now - dot_radius, dot_radius * 2, dot_radius * 2))

            time_str = _dt.datetime.now().strftime("%H:%M:%S")
            painter.setPen(QPen(QColor(255, 90, 90)))
            painter.drawText(self.left_pad + 6, int(y_now) - 6, time_str)

        self._draw_day_labels(painter)

    def _draw_day_labels(self, painter: QPainter) -> None:
        start_day = self.start_date
        weekday_kr = ["월", "화", "수", "목", "금", "토", "일"]
        labels = [
            (day * 24 * 60, start_day + _dt.timedelta(days=day))
            for day in range(self._total_days())
        ]

        bar_height = self.day_bar_height
        bar_color = QColor(24, 24, 24)
        text_color = QColor(200, 200, 200)
        day_font = QFont()
        day_font.setPointSize(10)
        day_font.setBold(False)
        painter.setFont(day_font)

        scroll_y = 0
        if self._scroll_area is not None:
            scroll_y = self._scroll_area.verticalScrollBar().value()
        probe_y = scroll_y + self.sticky_top_offset + 1
        current_minutes = self.minutes_for_y(probe_y)
        current_day_offset = int(current_minutes // (24 * 60))

        for minutes, date in labels:
            boundary_y = int(self._y_for_minutes(minutes))
            y = boundary_y - bar_height
            if y < 0:
                y = 0
            day_offset = int(minutes // (24 * 60))
            if day_offset == current_day_offset:
                y = scroll_y + self.sticky_top_offset
            painter.fillRect(0, int(y), self.width(), bar_height, bar_color)
            date_part = f"{date.month:02d}-{date.day:02d}"
            weekday_part = f" {weekday_kr[date.weekday()]}"
            painter.setPen(QPen(text_color))
            x = 8
            base_rect = QRectF(0, y, self.width(), bar_height)

            bold_font = QFont(day_font)
            bold_font.setBold(True)
            bold_font.setPointSize(day_font.pointSize())
            painter.setFont(bold_font)
            painter.drawText(QRectF(x, y, self.width() - x, bar_height), Qt.AlignLeft | Qt.AlignVCenter, date_part)

            bold_metrics = painter.fontMetrics()
            x += bold_metrics.horizontalAdvance(date_part)

            weekday_font = QFont(day_font)
            weekday_font.setBold(False)
            weekday_font.setPointSize(max(1, day_font.pointSize() - 2))
            painter.setFont(weekday_font)
            painter.drawText(QRectF(x, y, self.width() - x, bar_height), Qt.AlignLeft | Qt.AlignVCenter, weekday_part)

    def _day_block_height(self) -> float:
        return 24 * 60 * self.minute_height + self.day_bar_height

    def _maybe_shift_window(self) -> None:
        if self._shift_active or self._scroll_area is None:
            return
        bar = self._scroll_area.verticalScrollBar()
        y = bar.value()
        probe_y = y + self.sticky_top_offset + 1
        current_minutes = self.minutes_for_y(probe_y)
        current_day = int(current_minutes // (24 * 60))
        if current_day <= 0:
            self._shift_active = True
            self.start_date -= _dt.timedelta(days=1)
            bar.setValue(min(bar.maximum(), int(y + self._day_block_height())))
            self._shift_active = False
            self.update()
        elif current_day >= self._total_days() - 1:
            self._shift_active = True
            self.start_date += _dt.timedelta(days=1)
            bar.setValue(max(bar.minimum(), int(y - self._day_block_height())))
            self._shift_active = False
            self.update()

    def _total_days(self) -> int:
        return self.days_before + self.days_after + 1

    def _total_minutes(self) -> int:
        return self._total_days() * 24 * 60


def _minutes_since_midnight(include_seconds: bool = False) -> float:
    now = _dt.datetime.now()
    minutes = now.hour * 60 + now.minute
    if include_seconds:
        minutes += now.second / 60.0
    return minutes
