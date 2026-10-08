from __future__ import annotations

import queue
import threading
import time
from typing import Callable

try:
    import serial  # type: ignore
    from serial.tools import list_ports  # type: ignore
    _HAS_SERIAL = True
except Exception:  # pragma: no cover
    serial = None  # type: ignore
    list_ports = None  # type: ignore
    _HAS_SERIAL = False

from .config import AppConfig

VIRTUAL_PORTS = ("SIM", "SIMULATOR", "VIRTUAL", "MOCK", "模拟", "模拟器")


BAUD_CANDIDATES = (
    115200, 9600, 57600, 38400, 19200, 4800, 2400, 1200, 300, 74880,
    230400, 460800, 921600, 128000, 153600, 256000, 500000, 576000,
    1000000, 1152000, 1500000, 2000000, 3000000, 4000000,
)


def is_virtual(port: str) -> bool:
    return str(port or "").strip().upper() in VIRTUAL_PORTS


class SerialManager:
    def __init__(self, config: AppConfig, simulator=None) -> None:
        self.cfg = config
        self.simulator = simulator
        self._port = None
        self._lock = threading.RLock()
        self._events: "queue.Queue[dict]" = queue.Queue(maxsize=10000)
        self._subscribers: list["queue.Queue[dict]"] = []
        self._rx_thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._last_error = ""
        self._bytes_in = 0
        self._bytes_out = 0
        self._connected_at: float | None = None
        self._on_status: list[Callable[[dict], None]] = []
        self._reconnect_timer: threading.Timer | None = None


    @property
    def is_open(self) -> bool:
        if self._port is not None:
            try:
                return bool(self._port.is_open)
            except Exception:
                return False
        return self._virtual_active()

    def _virtual_active(self) -> bool:
        return self.simulator is not None and getattr(
            self.simulator, "active", False)

    @property
    def port_name(self) -> str:
        if self._port is not None:
            try:
                return self._port.port or ""
            except Exception:
                return ""
        if self._virtual_active():
            return "SIM"
        return ""

    def status(self) -> dict:

        baudrate = self.cfg.serial.get("baudrate", 9600)
        if self._port is not None:
            try:
                baudrate = int(self._port.baudrate)
            except Exception:
                pass
        pins: dict | None = None
        if self._port is not None:
            try:
                pins = {"dtr": bool(self._port.dtr), "rts": bool(self._port.rts),
                        "cts": bool(self._port.cts), "dsr": bool(self._port.dsr)}
            except Exception:
                pins = None
        return {
            "connected": self.is_open,
            "port": self.port_name,
            "baudrate": baudrate,
            "virtual": self._virtual_active() and self._port is None,
            "bytes_in": self._bytes_in,
            "bytes_out": self._bytes_out,
            "connected_at": self._connected_at,
            "last_error": self._last_error,
            "has_pyserial": _HAS_SERIAL,
            "pins": pins,
        }

    def on_status(self, callback: Callable[[dict], None]) -> None:
        self._on_status.append(callback)

    def _emit_status(self, kind: str, **extra) -> None:
        payload = {"type": "status", "kind": kind, "ts": time.time()}
        payload.update(extra)
        self._push(payload)
        for cb in list(self._on_status):
            try:
                cb(payload)
            except Exception:
                pass

    def _push(self, event: dict) -> None:
        try:
            self._events.put_nowait(event)
        except queue.Full:
            try:
                self._events.get_nowait()
            except Exception:
                pass
            try:
                self._events.put_nowait(event)
            except Exception:
                pass
        for sub in list(self._subscribers):
            try:
                sub.put_nowait(event)
            except Exception:
                pass

    def subscribe(self) -> "queue.Queue[dict]":
        q: "queue.Queue[dict]" = queue.Queue(maxsize=5000)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: "queue.Queue[dict]") -> None:
        try:
            self._subscribers.remove(q)
        except ValueError:
            pass

    def drain(self, limit: int = 500) -> list[dict]:
        out: list[dict] = []
        while len(out) < limit:
            try:
                out.append(self._events.get_nowait())
            except queue.Empty:
                break
        return out


    @staticmethod
    def list_ports() -> list[dict]:
        ports: list[dict] = []
        if _HAS_SERIAL and list_ports is not None:
            try:
                for info in list_ports.comports():
                    ports.append({
                        "device": info.device,
                        "name": info.device,
                        "description": getattr(info, "description", "") or "",
                        "manufacturer": getattr(info, "manufacturer", "") or "",
                        "hwid": getattr(info, "hwid", "") or "",
                        "vid": getattr(info, "vid", None),
                        "pid": getattr(info, "pid", None),
                        "virtual": False,
                    })
            except Exception:
                pass
        ports.append({
            "device": "SIM",
            "name": "SIM",
            "description": "虚拟设备（无硬件自测）",
            "manufacturer": "AT指令调试台",
            "hwid": "SIM",
            "vid": None,
            "pid": None,
            "virtual": True,
        })
        return ports


    def connect(self, port: str | None = None, **overrides) -> dict:
        with self._lock:
            try:
                self.disconnect(silent=True)
            except Exception:
                pass

            ser_cfg = dict(self.cfg.serial)
            ser_cfg.update({k: v for k, v in overrides.items()
                            if k in ser_cfg})
            target = port or ser_cfg.get("port") or ""

            if is_virtual(target):
                if self.simulator is None:
                    return self._fail("未启用虚拟设备")
                try:
                    self.simulator.start(self._push)
                except Exception as exc:
                    return self._fail(f"虚拟设备启动失败：{exc}")
                ser_cfg["port"] = "SIM"
                self._stop.clear()
                self._connected_at = time.time()
                self._emit_status("connected", port="SIM", virtual=True)
                return {"ok": True, "port": "SIM", "virtual": True}

            if not target:
                return self._fail("未选择串口")
            if not _HAS_SERIAL:
                return self._fail(
                    "未安装 pyserial，无法打开真实串口（可执行 pip install pyserial）")

            try:
                parity_map = {
                    "N": serial.PARITY_NONE,
                    "E": serial.PARITY_EVEN,
                    "O": serial.PARITY_ODD,
                    "M": serial.PARITY_MARK,
                    "S": serial.PARITY_SPACE,
                }
                stop_map = {1: serial.STOPBITS_ONE,
                            1.5: serial.STOPBITS_ONE_POINT_FIVE,
                            2: serial.STOPBITS_TWO}
                bytes_map = {5: serial.FIVEBITS, 6: serial.SIXBITS,
                             7: serial.SEVENBITS, 8: serial.EIGHTBITS}
                flow = str(ser_cfg.get("flowcontrol", "none")).lower()
                port_obj = serial.Serial(
                    port=target,
                    baudrate=int(ser_cfg.get("baudrate", 9600)),
                    bytesize=bytes_map.get(int(ser_cfg.get("bytesize", 8)),
                                           serial.EIGHTBITS),
                    parity=parity_map.get(
                        str(ser_cfg.get("parity", "N")).upper(),
                        serial.PARITY_NONE),
                    stopbits=stop_map.get(float(ser_cfg.get("stopbits", 1)),
                                          serial.STOPBITS_ONE),
                    timeout=float(ser_cfg.get("timeout", 1.0)),
                    write_timeout=2.0,
                    rtscts=(flow == "rtscts"),
                    xonxoff=(flow == "xonxoff"),
                    dsrdtr=(flow == "dsrdtr"),
                )
            except Exception as exc:
                return self._fail(self._open_error(exc))

            self._port = port_obj




            try:
                dtr_on = str(ser_cfg.get("dtr", "off")).lower() not in ("off", "false", "0", "")
                rts_on = str(ser_cfg.get("rts", "off")).lower() not in ("off", "false", "0", "")
                self._port.dtr = dtr_on
                self._port.rts = rts_on
            except Exception:
                pass
            self._stop.clear()
            self._rx_thread = threading.Thread(
                target=self._read_loop, name="AT-RX", daemon=True)
            self._rx_thread.start()
            self._last_error = ""
            self._connected_at = time.time()
            self._emit_status("connected", port=target, virtual=False)
            return {"ok": True, "port": target, "virtual": False}

    def apply_params(self, **overrides) -> dict:
        """已连接状态下热应用串口参数（波特率/数据位/校验/停止位/流控/超时/DTR/RTS），
        无需断开重连。port 变化不支持热应用，需走 connect()。"""
        with self._lock:
            port = self._port
            if port is None:
                return {"ok": False, "error": "串口未连接"}
            ser_cfg = self.cfg.serial
            changed = {k: v for k, v in overrides.items()
                       if k in ser_cfg and k != "port"
                       and ser_cfg.get(k) != v}
            ser_cfg.update({k: v for k, v in overrides.items()
                            if k in ser_cfg and k != "port"})
            if self._virtual_active():
                return {"ok": True, "applied": sorted(changed), "virtual": True}
            if not changed:
                return {"ok": True, "applied": []}
            if not _HAS_SERIAL:
                return {"ok": False, "error": "未安装 pyserial"}
            try:
                parity_map = {
                    "N": serial.PARITY_NONE, "E": serial.PARITY_EVEN,
                    "O": serial.PARITY_ODD, "M": serial.PARITY_MARK,
                    "S": serial.PARITY_SPACE,
                }
                stop_map = {1: serial.STOPBITS_ONE,
                            1.5: serial.STOPBITS_ONE_POINT_FIVE,
                            2: serial.STOPBITS_TWO}
                bytes_map = {5: serial.FIVEBITS, 6: serial.SIXBITS,
                             7: serial.SEVENBITS, 8: serial.EIGHTBITS}
                flow = str(ser_cfg.get("flowcontrol", "none")).lower()
                if "baudrate" in changed:
                    port.baudrate = int(ser_cfg.get("baudrate", 9600))
                if "bytesize" in changed:
                    port.bytesize = bytes_map.get(
                        int(ser_cfg.get("bytesize", 8)), serial.EIGHTBITS)
                if "parity" in changed:
                    port.parity = parity_map.get(
                        str(ser_cfg.get("parity", "N")).upper(),
                        serial.PARITY_NONE)
                if "stopbits" in changed:
                    port.stopbits = stop_map.get(
                        float(ser_cfg.get("stopbits", 1)), serial.STOPBITS_ONE)
                if "timeout" in changed:
                    port.timeout = float(ser_cfg.get("timeout", 1.0))
                if "flowcontrol" in changed:
                    port.rtscts = (flow == "rtscts")
                    port.xonxoff = (flow == "xonxoff")
                    port.dsrdtr = (flow == "dsrdtr")
                if "dtr" in changed or "rts" in changed:
                    dtr_on = str(ser_cfg.get("dtr", "off")).lower() not in (
                        "off", "false", "0", "")
                    rts_on = str(ser_cfg.get("rts", "off")).lower() not in (
                        "off", "false", "0", "")
                    if "dtr" in changed:
                        port.dtr = dtr_on
                    if "rts" in changed:
                        port.rts = rts_on
            except Exception as exc:
                return {"ok": False, "error": f"串口参数应用失败：{exc}",
                        "applied": sorted(changed)}
            self._emit_status("params", applied=sorted(changed))
            return {"ok": True, "applied": sorted(changed)}

    def _fail(self, message: str) -> dict:
        self._last_error = message
        self._emit_status("error", message=message)
        return {"ok": False, "error": message}

    @staticmethod
    def _open_error(exc: Exception) -> str:
        msg = str(exc)
        ename = type(exc).__name__
        errno = getattr(exc, "errno", None)
        if (isinstance(exc, PermissionError) or errno == 13
                or "PermissionError" in msg or "拒绝访问" in msg
                or "access is denied" in msg.lower()):
            return ("串口被其他程序占用（可能是另一个调试台窗口、"
                    "串口监视器或烧录工具正在使用它）")
        if (isinstance(exc, FileNotFoundError) or errno == 2
                or "FileNotFoundError" in ename or "系统找不到" in msg
                or "no such file" in msg.lower()):
            return "串口不存在或已被拔出（端口列表会自动刷新，请重新选择）"
        if ("cannot configure port" in msg.lower() or "参数错误" in msg
                or "invalid argument" in msg.lower()):
            return ("串口不支持当前参数组合——通常是波特率超出该串口"
                    "支持范围或流控冲突，请换低一点的波特率、"
                    "并把流控设为 none（多数模组默认 8N1 无流控）")
        return f"打开串口失败：{msg}"

    def disconnect(self, silent: bool = False) -> dict:
        with self._lock:
            if self._reconnect_timer is not None:
                try:
                    self._reconnect_timer.cancel()
                except Exception:
                    pass
                self._reconnect_timer = None
            self._stop.set()
            if self.simulator is not None and getattr(self.simulator, "active", False):
                try:
                    self.simulator.stop()
                except Exception:
                    pass
            if self._port is not None:
                try:
                    if self._port.is_open:
                        self._port.close()
                except Exception:
                    pass
            self._port = None
            self._connected_at = None
            if not silent:
                self._emit_status("disconnected")
            return {"ok": True}


    def write(self, data: bytes) -> int:
        try:
            if self._virtual_active() and self._port is None:
                self.simulator.receive(data)
                self._bytes_out += len(data)
                return len(data)
            if self._port is None or not self._port.is_open:
                self._last_error = "串口未连接"
                return 0
            written = self._port.write(data)
            try:
                self._port.flush()
            except Exception:
                pass
            self._bytes_out += written
            return written
        except Exception as exc:
            self._last_error = f"写入失败：{exc}"
            self._emit_status("error", message=self._last_error)
            return 0

    def _read_loop(self) -> None:
        buffer = b""
        port = self._port
        last_data_ts = time.time()


        idle_flush = 0.15
        while not self._stop.is_set() and port is not None:
            try:
                waiting = port.in_waiting
                chunk = port.read(waiting or 1)
            except Exception as exc:
                self._last_error = f"读取失败：{exc}"
                self._emit_status("error", message=self._last_error)
                if self.cfg.serial.get("auto_reconnect"):
                    self._schedule_reconnect()
                break
            now = time.time()
            if not chunk:

                if buffer and (now - last_data_ts) >= idle_flush:
                    self._push_line(buffer)
                    buffer = b""
                continue
            self._bytes_in += len(chunk)
            buffer += chunk
            last_data_ts = now
            while b"\n" in buffer:
                line, buffer = buffer.split(b"\n", 1)
                self._push_line(line)

            if buffer and (len(buffer) >= 512 or (now - last_data_ts) >= idle_flush):
                self._push_line(buffer)
                buffer = b""
        if buffer:
            self._push_line(buffer)

    def _push_line(self, raw: bytes) -> None:
        text = raw.decode("utf-8", errors="replace").rstrip("\r\n")
        self._push({
            "type": "rx",
            "text": text,
            "hex": raw.hex(" ").upper(),
            "ts": time.time(),
        })

    def inject_rx(self, text: str) -> None:
        self._push({
            "type": "rx",
            "text": text,
            "hex": text.encode("utf-8", errors="replace").hex(" ").upper(),
            "ts": time.time(),
        })

    def set_dtr(self, state: bool) -> dict:
        if self._port is None:
            if self._virtual_active():
                return {"ok": False, "error": "虚拟串口没有真实引脚"}
            return {"ok": False, "error": "串口未连接"}
        try:
            self._port.dtr = bool(state)
            return {"ok": True, "dtr": bool(state)}
        except Exception as exc:
            return {"ok": False, "error": f"设置 DTR 失败：{exc}"}

    def set_rts(self, state: bool) -> dict:
        if self._port is None:
            if self._virtual_active():
                return {"ok": False, "error": "虚拟串口没有真实引脚"}
            return {"ok": False, "error": "串口未连接"}
        try:
            self._port.rts = bool(state)
            return {"ok": True, "rts": bool(state)}
        except Exception as exc:
            return {"ok": False, "error": f"设置 RTS 失败：{exc}"}

    def pin_state(self) -> dict:
        if self._port is None or not self.is_open:
            return {"ok": False}
        try:
            return {
                "ok": True,
                "dtr": bool(self._port.dtr),
                "rts": bool(self._port.rts),
                "cts": bool(self._port.cts),
                "dsr": bool(self._port.dsr),
                "ri": bool(self._port.ri),
                "cd": bool(self._port.cd),
            }
        except Exception:
            return {"ok": False}

    def reset_counters(self) -> dict:
        self._bytes_in = 0
        self._bytes_out = 0
        self._emit_status("counters_reset")
        return {"ok": True}

    def _schedule_reconnect(self) -> None:
        last = self.port_name
        if not last:
            return

        def attempt() -> None:
            if self.is_open:
                return
            result = self.connect(last)
            if not result.get("ok"):
                self._reconnect_timer = threading.Timer(3.0, attempt)
                self._reconnect_timer.daemon = True
                self._reconnect_timer.start()

        self._reconnect_timer = threading.Timer(1.5, attempt)
        self._reconnect_timer.daemon = True
        self._reconnect_timer.start()

    def detect_baud(self, port: str, baudrates=None,
                    handshake: str = "AT\r\n", expect: str = "OK",
                    timeout: float = 0.45) -> dict:
        if is_virtual(port):
            return {"ok": False, "error": "虚拟串口无需探测波特率"}
        if not _HAS_SERIAL:
            return {"ok": False, "error": "未安装 pyserial，无法探测真实串口"}
        tried: list[dict] = []
        for baud in (baudrates or BAUD_CANDIDATES):
            ser = None
            try:
                ser = serial.Serial(port=port, baudrate=int(baud),
                                    timeout=timeout, write_timeout=0.6)
            except Exception as exc:
                tried.append({"baud": int(baud), "error": str(exc)[:80]})
                continue
            try:
                try:
                    ser.reset_input_buffer()
                except Exception:
                    pass
                ser.write(handshake.encode("utf-8"))
                try:
                    ser.flush()
                except Exception:
                    pass
                deadline = time.time() + timeout + 0.35
                buf = b""
                hit = False
                while time.time() < deadline:
                    n = ser.in_waiting
                    chunk = ser.read(n or 1)
                    if chunk:
                        buf += chunk
                        if expect.encode("utf-8") in buf:
                            hit = True
                            break
                reply = buf[:160].decode("utf-8", errors="replace").strip()
                tried.append({"baud": int(baud), "ok": hit, "reply": reply})
                if hit:
                    return {"ok": True, "baudrate": int(baud), "tried": tried}
            except Exception as exc:
                tried.append({"baud": int(baud), "error": str(exc)[:80]})
            finally:
                try:
                    if ser is not None:
                        ser.close()
                except Exception:
                    pass
        return {"ok": False,
                "error": "所有候选波特率均未收到有效响应（检查模组是否上电 / TX-RX 接线）",
                "tried": tried}

    def sniff_baud(self, port: str, baudrates=None,
                   window: float = 0.5) -> dict:
        if is_virtual(port):
            return {"ok": False, "error": "虚拟串口无需嗅探波特率"}
        if not _HAS_SERIAL:
            return {"ok": False, "error": "未安装 pyserial，无法嗅探真实串口"}
        samples: list[dict] = []
        for baud in (baudrates or BAUD_CANDIDATES):
            ser = None
            try:
                ser = serial.Serial(port=port, baudrate=int(baud),
                                    timeout=0.15, write_timeout=0.5)
            except Exception as exc:
                samples.append({"baud": int(baud), "error": str(exc)[:80]})
                continue
            try:
                try:
                    ser.reset_input_buffer()
                except Exception:
                    pass
                buf = b""
                deadline = time.time() + max(0.2, window)
                while time.time() < deadline:
                    n = ser.in_waiting
                    chunk = ser.read(n or 1)
                    if chunk:
                        buf += chunk
                total = len(buf)
                if total == 0:
                    samples.append({"baud": int(baud), "bytes": 0})
                    continue
                printable = sum(1 for c in buf
                                if 32 <= c <= 126 or c in (9, 10, 11, 12, 13))
                ratio = printable / total
                text = buf.decode("utf-8", errors="replace")
                sample = text[:64].replace("\r", "\\r").replace("\n", "\\n")
                samples.append({"baud": int(baud), "bytes": total,
                                "printable_ratio": round(ratio, 3),
                                "sample": sample})
            except Exception as exc:
                samples.append({"baud": int(baud), "error": str(exc)[:80]})
            finally:
                try:
                    if ser is not None:
                        ser.close()
                except Exception:
                    pass
        valid = [s for s in samples if s.get("bytes", 0) > 0]
        best = None
        if valid:
            best = max(valid,
                       key=lambda s: (s.get("printable_ratio", 0),
                                      s.get("bytes", 0)))
        return {"ok": bool(best),
                "best": best,
                "samples": samples}

    def close(self) -> None:
        self.disconnect(silent=True)
