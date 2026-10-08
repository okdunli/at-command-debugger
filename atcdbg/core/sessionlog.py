from __future__ import annotations

import json
import re
import threading
import time
from pathlib import Path

from . import paths

_LOCK = threading.RLock()
_TS_RE = re.compile(r"^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\]\s?(.*)$")

def logs_dir() -> Path:
    return paths.log_dir()

class SessionLogger:
    def __init__(self) -> None:
        self._fh = None
        self.path: Path | None = None
        self.count = 0

    @property
    def active(self) -> bool:
        return self._fh is not None

    def start(self, port: str) -> Path | None:
        self.stop()
        with _LOCK:
            try:
                stamp = time.strftime("%Y%m%d-%H%M%S")
                safe_port = re.sub(r"[^A-Za-z0-9\u4e00-\u9fff]+", "-", port or "port").strip("-") or "port"
                self.path = logs_dir() / f"session-{stamp}-{safe_port}.jsonl"
                self._fh = open(self.path, "w", encoding="utf-8")
                self.count = 0
                return self.path
            except OSError:
                self._fh = None
                self.path = None
                return None

    def record(self, event: dict) -> None:
        if self._fh is None:
            return
        with _LOCK:
            try:
                self._fh.write(json.dumps({
                    "ts": event.get("ts") or time.time(),
                    "dir": event.get("dir") or "rx",
                    "text": event.get("text") or "",
                    "hex": event.get("hex") or "",
                    "sim": bool(event.get("sim")),
                }, ensure_ascii=False) + "\n")
                self.count += 1
                self._fh.flush()
            except OSError:
                pass

    def stop(self) -> dict | None:
        with _LOCK:
            if self._fh is not None:
                try:
                    self._fh.close()
                except OSError:
                    pass
                info = {"path": str(self.path), "count": self.count}
                self._fh = None
                return info
            return None

_logger = SessionLogger()

def start_session(port: str) -> dict | None:
    p = _logger.start(port)
    return {"path": str(p)} if p else None

def stop_session() -> dict | None:
    return _logger.stop()

def current_session() -> dict:
    if _logger.active and _logger.path:
        return {"path": str(_logger.path), "count": _logger.count}
    return {}

def record(event: dict) -> None:
    _logger.record(event)

def _entry_meta(p: Path) -> dict:
    port = ""
    count = 0
    try:
        with open(p, "r", encoding="utf-8") as fh:
            for line in fh:
                if not line.strip():
                    continue
                count += 1
                if not port:
                    try:
                        port = json.loads(line).get("text", "")
                    except Exception:
                        port = ""
    except OSError:
        pass
    st = p.stat()
    return {
        "name": p.name,
        "path": str(p),
        "size": st.st_size,
        "mtime": st.st_mtime,
        "count": count,
        "port": port,
    }

def list_sessions() -> list[dict]:
    items = []
    for p in sorted(logs_dir().glob("session-*.jsonl"),
                    key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            items.append(_entry_meta(p))
        except OSError:
            continue
    return items

def read_session(name: str) -> list[dict]:
    p = logs_dir() / Path(name).name
    if not p.exists() or p.suffix != ".jsonl":
        return []
    events = []
    try:
        with open(p, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    events.append(json.loads(line))
                except Exception:
                    continue
    except OSError:
        pass
    return events

def delete_session(name: str) -> bool:
    p = logs_dir() / Path(name).name
    if p.exists() and p.suffix == ".jsonl":
        try:
            p.unlink()
            return True
        except OSError:
            return False
    return False

def export_session(name: str, fmt: str = "txt") -> str:
    events = read_session(name)
    if not events:
        return ""
    stem = Path(name).stem
    out = logs_dir() / f"{stem}.{fmt}"
    if fmt == "json":
        out.write_text(json.dumps(events, ensure_ascii=False, indent=2),
                       encoding="utf-8")
    elif fmt == "md":
        lines = ["# 串口日志 " + stem, ""]
        for e in events:
            lines.append(f"- `[{_fmt_ts(e.get('ts'))}]` **{e.get('dir', '').upper()}** "
                         f"{e.get('text', '')}")
        out.write_text("\n".join(lines), encoding="utf-8")
    else:
        with open(out, "w", encoding="utf-8") as fh:
            for e in events:
                fh.write(f"[{_fmt_ts(e.get('ts'))}] "
                         f"{(e.get('dir') or 'RX').upper()}: {e.get('text', '')}\n")
    return str(out)

def import_external(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        return {"ok": False, "error": "文件不存在"}
    events = []
    try:
        if p.suffix.lower() == ".jsonl" or (p.suffix.lower() == ".json"
                                            and p.read_text(encoding="utf-8")[:1] == "["):
            raw = json.loads(p.read_text(encoding="utf-8"))
            if isinstance(raw, list):
                for e in raw:
                    if isinstance(e, dict) and e.get("text"):
                        events.append({"ts": e.get("ts") or 0,
                                       "dir": e.get("dir") or "rx",
                                       "text": str(e.get("text")),
                                       "hex": e.get("hex") or ""})
        else:
            for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
                if not line.strip():
                    continue
                ts = 0.0
                text = line
                m = _TS_RE.match(line)
                if m:
                    try:
                        import calendar
                        t = time.strptime(m.group(1).split(".")[0].replace(".", " "),
                                          "%Y-%m-%d %H:%M:%S") \
                            if "." in m.group(1) else \
                            time.strptime(m.group(1), "%Y-%m-%d %H:%M:%S")
                        ts = calendar.timegm(t)
                    except Exception:
                        ts = 0.0
                    text = m.group(2)
                m2 = re.match(r"^(TX|RX|SYS):\s?(.*)$", text)
                d, body = ("rx", text)
                if m2:
                    d, body = m2.group(1).lower(), m2.group(2)
                events.append({"ts": ts, "dir": d, "text": body,
                               "hex": body.encode("utf-8", errors="replace").hex(" ").upper()})
    except Exception as exc:
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
    return {"ok": True, "events": events, "count": len(events)}

def _fmt_ts(ts) -> str:
    try:
        return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(float(ts or 0)))
    except Exception:
        return ""
