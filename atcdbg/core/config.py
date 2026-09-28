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
        "read_timeout": 3.0,
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

    def save(self) -> bool:
        return self._store.update(self._data, autosave=False) or self._store.save()

    def reload(self) -> dict:
        self._store.reload()
        raw = self._store.data if isinstance(self._store.data, dict) else {}
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
