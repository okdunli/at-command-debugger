from __future__ import annotations

from typing import Any

from . import paths
from .store import JsonStore

DEFAULTS: dict[str, Any] = {
    "profile": {
        "active": "",
        "window": True,
        "edit_mode": True,
    },
    "serial": {
        "port": "",
        "baudrate": 9600,
        "bytesize": 8,
        "parity": "N",
        "stopbits": 1,
        "flowcontrol": "none",   # none | rtscts | xonxoff
        "dtr": "off",
        "rts": "off",
        "timeout": 1.0,
        "auto_reconnect": False,
    },
    "protocol": {
        "line_ending": "CRLF",   # CRLF | CR | LF
        "send_mode": "text",     # text | hex
        "command_delay": 0.35,
        "read_timeout": 5.0,
        "strip_echo": True,
        "wait_event": True,
    },
    "ui": {
        "theme": "dark",         # dark | light
        "accent": "blue",        # blue | violet | teal | amber
        "font_size": 13,
        "ui_scale": 1.0,
        "animation": True,
        "auto_scroll": True,
        "timestamps": True,
        "max_log_lines": 2000,
        "term_font_size": 13,
        "append_crlf": True,
        "accent_custom": "",
        "window_opacity": 100,
    },
    "behavior": {
        "save_history": True,
        "history_limit": 200,
        "http_server": True,
        "http_port": 0,
        "http_host": "127.0.0.1",
        "minimize_to_tray": False,
        "confirm_before_run": False,
        "auto_connect": False,
    },
    "window": {
        "width": 1120,
        "height": 720,
        "x": None,
        "y": None,
        "maximized": False,
        "topmost": False,
    },
}

def _deep_merge(base: dict, patch: dict) -> dict:
    out = dict(base)
    for key, value in (patch or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _deep_merge(out[key], value)
        else:
            out[key] = value
    return out

class AppConfig:

    def __init__(self) -> None:
        self._store = JsonStore(paths.config_file(), {})
        raw = self._store.data
        if not isinstance(raw, dict):
            raw = {}
        self._data = _deep_merge(DEFAULTS, raw)

    @property
    def data(self) -> dict:
        return self._data

    def section(self, name: str) -> dict:
        sec = self._data.get(name)
        if not isinstance(sec, dict):
            sec = {}
            self._data[name] = sec
        return sec

    def get(self, section: str, key: str, default: Any = None) -> Any:
        return self.section(section).get(key, default)

    def set(self, section: str, key: str, value: Any, autosave: bool = True) -> None:
        self.section(section)[key] = value
        if autosave:
            self.save()

    def update(self, patch: dict, autosave: bool = True) -> dict:
        self._data = _deep_merge(self._data, patch or {})
        if autosave:
            self.save()
        return self._data

    def ensure_defaults(self) -> None:
        """初始化补全：把深合并默认值后的完整配置落盘。

        首次运行（config.json 不存在）直接生成完整配置文件；
        已有文件缺项时补齐缺失键（不覆盖用户已设置的值）；
        内容完全一致则跳过写入，避免每次启动都产生备份文件。
        """
        try:
            if self._store.data != self._data:
                self.save()
        except Exception:
            pass

    def save(self) -> bool:
        return self._store.update(self._data, autosave=False) or self._store.save()

    def reload(self) -> dict:
        self._store.reload()
        raw = self._store.data if isinstance(self._store.data, dict) else {}
        # 迁移：旧默认读超时 3.0 对慢指令（配网/入网/扫描）太短，升到 5.0
        try:
            proto = raw.get("protocol")
            if isinstance(proto, dict) and float(proto.get("read_timeout", 0)) == 3.0:
                proto["read_timeout"] = 5.0
        except (TypeError, ValueError):
            pass
        self._data = _deep_merge(DEFAULTS, raw)
        return self._data

    @property
    def profile(self) -> dict:
        return self.section("profile")

    @property
    def serial(self) -> dict:
        return self.section("serial")

    @property
    def protocol(self) -> dict:
        return self.section("protocol")

    @property
    def ui(self) -> dict:
        return self.section("ui")

    @property
    def behavior(self) -> dict:
        return self.section("behavior")

    @property
    def window(self) -> dict:
        return self.section("window")

    def reset(self) -> dict:
        self._data = _deep_merge(DEFAULTS, {})
        self.save()
        return self._data

    def to_dict(self) -> dict:
        return self._data
