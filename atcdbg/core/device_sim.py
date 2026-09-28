from __future__ import annotations

import random
import re
import threading
import time
from typing import Callable

from . import commands as C
from . import protocol as P

BANNER: list[str] = []
STATE_DEFAULTS: dict[str, str] = {}
BATTERY_MV = 3300
JOIN_DELAY = 2.0
TX_DELAY = 0.15
STYLE = "an5481"
PROFILE_NAME = "设备"

TCONF_LINES = [
    "1: Freq= {v} Hz",
    "2: Power= {v} dBm",
    "3: Bandwidth= {v} (=125000 Hz)",
    "4: SF= {v}",
    "5: CR= {v} (=4/5)",
    "6: LNA State= {v}",
    "7: PA Boost State= {v}",
    "8: modulation LORA",
    "9: Payload len= {v} Bytes",
    "10: Frequency deviation not applicable",
    "11: LowDRopt[0 to 2]= {v}",
    "12 BT product not applicable",
]

def refresh(profile: dict) -> None:
    global BANNER, STATE_DEFAULTS, BATTERY_MV, JOIN_DELAY, TX_DELAY
    global STYLE, PROFILE_NAME
    device = profile.get("device") or {}
    sim = device.get("sim") or {}
    BANNER = [str(x) for x in (device.get("banner") or [])]
    STATE_DEFAULTS = {str(k): str(v)
                      for k, v in (device.get("state") or {}).items()}
    BATTERY_MV = int(sim.get("battery_mv", 3300))
    JOIN_DELAY = float(sim.get("join_delay", 2.0))
    TX_DELAY = float(sim.get("tx_delay", 0.15))
    STYLE = str(device.get("style") or "an5481").lower()
    PROFILE_NAME = str(profile.get("name") or "设备")

class DeviceSimulator:
    def __init__(self) -> None:
        self.active = False
        self._push: Callable[[dict], None] | None = None
        self._buffer = bytearray()
        self._lock = threading.RLock()
        self.join_success = True
        self.join_delay = JOIN_DELAY
        self.tx_delay = TX_DELAY
        self.echo = True
        self.battery_mv = BATTERY_MV
        self.state: dict[str, str] = {}
        self._reset_state()

    def _reset_state(self) -> None:

        state: dict[str, str] = dict(STATE_DEFAULTS)
        for key, value in (
            ("VL", "2"), ("BAND", ""), ("CLASS", "A"), ("ADR", "1"),
            ("DR", "5"), ("TXP", "0"), ("DCS", "0"),
            ("JN1DL", "5000"), ("JN2DL", "6000"),
            ("RX1DL", "1000"), ("RX2DL", "2000"),
            ("RX2DR", ""), ("RX2FQ", ""), ("PGSLOT", "4"),
        ):
            state.setdefault(key, value)
        self.state = state
        self.joined = False
        self.rf_busy = False
        self.fcnt = 0
        self.join_delay = JOIN_DELAY
        self.battery_mv = BATTERY_MV

    def start(self, push: Callable[[dict], None]) -> None:
        self.active = True
        self._push = push
        self._reset_state()
        self.emit(f"[SIM] 虚拟设备已就绪（模拟 {PROFILE_NAME}）")

    def stop(self) -> None:
        self.active = False
        self._push = None

    def emit(self, text: str) -> None:
        if self._push is None:
            return
        self._push({
            "type": "rx",
            "text": text,
            "hex": text.encode("utf-8", errors="replace").hex(" ").upper(),
            "ts": time.time(),
            "sim": True,
        })

    def emit_lines(self, lines: list[str], delay: float = 0.0) -> None:
        for line in lines:
            if delay:
                time.sleep(delay)
            self.emit(line)

    def receive(self, data: bytes) -> None:
        with self._lock:
            self._buffer.extend(data)
            while b"\r" in self._buffer or b"\n" in self._buffer:
                idx = min(
                    [i for i in (self._buffer.find(b"\r"), self._buffer.find(b"\n"))
                     if i >= 0]
                )
                raw = bytes(self._buffer[:idx])
                del self._buffer[: idx + 1]
                while self._buffer[:1] in (b"\r", b"\n"):
                    del self._buffer[:1]
                line = raw.decode("utf-8", errors="replace").strip()
                if not line:
                    continue
                if self.echo:
                    self.emit(line)
                threading.Thread(target=self._handle, args=(line,),
                                 daemon=True).start()

    def _handle(self, line: str) -> None:
        text = line.strip()
        time.sleep(0.05)
        if STYLE == "aithinker":
            return self._handle_ai(text)
        if text.upper() == "AT":
            return self._ok()
        if text.upper() == "AT?":
            self.emit("AT+<CMD>?         : Help of <CMD>")
            self.emit("AT+<CMD>          : Run <CMD>")
            self.emit("AT+<CMD>=<value>  : Set the value")
            self.emit("AT+<CMD>=?        : Get the value")
            return self._ok()
        if text.upper() == "ATZ":
            self.emit_lines(BANNER, 0.01)
            return
        if text.upper() == "AT+RFS":
            self.emit_lines(BANNER, 0.01)
            self._reset_state()
            return
        if text.upper() == "AT+CS":
            self.emit("NVM DATA STORED")
            return self._ok()
        if text.upper() == "AT+TTONE":
            if self.rf_busy:
                return self._status("AT_BUSY_ERROR")
            self.rf_busy = True
            self.emit("[TimeDisplay]: Tx FSK Test")
            return self._ok()
        if text.upper() == "AT+TRSSI":
            if self.rf_busy:
                return self._status("AT_BUSY_ERROR")
            self.rf_busy = True
            self.emit("[TimeDisplay]: Rx FSK Test")
            self.emit(f"[TimeDisplay]:>>> RSSI Value= {random.randint(-90, -7)} dBm")
            return self._ok()
        if text.upper() == "AT+TSNR":
            if self.rf_busy:
                return self._status("AT_BUSY_ERROR")
            self.rf_busy = True
            self.emit("[TimeDisplay]:>>> SNR Value= "
                      f"{round(random.uniform(-5, 20), 1)} dB")
            return self._ok()
        if text.upper() == "AT+TOFF":
            self.rf_busy = False
            self.emit("Test Stop")
            return self._ok()

        match = re.fullmatch(r"(AT\+[A-Z0-9]+)(=\?|\?|=(.*))?", text.upper())
        if not match:
            return self._status("AT_ERROR")

        name = match.group(1)
        suffix = match.group(2) or ""
        value = ""
        if suffix.startswith("=") and len(suffix) > 1:
            value = text[len(name) + 1:].strip()

        if suffix == "?":
            self.emit(f"{name}? : help")
            return self._ok()

        if suffix == "=?":
            return self._handle_get(name)

        if suffix.startswith("="):
            return self._handle_set(name, value)

        return self._handle_run(name)

    def _ai_err(self) -> None:
        self.emit("ERROR")

    def _handle_ai(self, text: str) -> None:
        up = text.upper()
        if up == "AT":
            return self._ok()
        if up == "AT?":
            self.emit("AT+<CMD>[op][params]   op: = set / ? query / =? test")
            return self._ok()
        match = re.fullmatch(r"(AT\+[A-Z0-9]+)(=\?|\?|=(.*))?", up)
        if not match:
            return self._ai_err()
        name = match.group(1)
        suffix = match.group(2) or ""
        value = ""
        if suffix.startswith("=") and len(suffix) > 1:
            value = text[len(name) + 1:].strip()
        if suffix == "=?":
            self.emit(f'{name}: <value>')
            return self._ok()
        if suffix == "?":
            return self._ai_query(name)
        if suffix.startswith("="):
            return self._ai_set(name, value)
        return self._ai_run(name)

    def _ai_query(self, name: str) -> None:
        key = name.replace("AT+", "")
        if key == "CGMI":
            self.emit("+CGMI=ASR")
            return self._ok()
        if key == "CGMM":
            self.emit("+CGMM=6601")
            return self._ok()
        if key == "CGMR":
            self.emit("+CGMR=v1.1.0")
            return self._ok()
        if key == "CGSN":
            self.emit("+CGSN=0539349E00032523")
            return self._ok()
        if key.startswith("CRSSI"):

            self.emit("+CRSSI:")
            for ch in range(8):
                self.emit(f"{ch}:{random.randint(-160, -60)}")
            return self._ok()
        if key == "CSTATUS":
            self.emit(f"+CSTATUS={self.state.get('CSTATUS', '00')}")
            return self._ok()
        if key == "CBL":
            self.emit("+CBL=0")
            return self._ok()
        if key == "CNUMMUTICAST":
            self.emit("+CNUMMUTICAST:0")
            return self._ok()
        if key == "CJOIN":
            self.emit(f"+CJOIN:{self.state.get('CJOIN_P', '1,0,8,8')}")
            return self._ok()
        if key == "DRX":
            self.emit("+DRX:0,")
            return self._ok()
        if key in self.state:
            self.emit(f"+{key}:{self.state[key]}")
            return self._ok()
        return self._ai_err()

    def _ai_run(self, name: str) -> None:
        key = name.replace("AT+", "")
        if key == "CSAVE":
            self.emit("[SIM] MAC 参数已写入 EEPROM/FLASH")
            return self._ok()
        if key == "CRESTORE":
            self._ok()
            self._reset_state()
            return
        if key == "DRX":
            self.emit("+DRX:0,")
            return self._ok()
        return self._ai_err()

    def _ai_set(self, name: str, value: str) -> None:
        key = name.replace("AT+", "")
        st = self.state

        def need_range(raw: str, low: int, high: int) -> bool:
            ok, _ = P.validate_range(raw, low, high)
            return ok

        if key == "CGBR":
            if not need_range(value, 1, 9600):
                return self._ai_err()
            st["CGBR"] = value
            return self._ok()
        if key in ("CDEVEUI", "CAPPEUI"):
            ok, _ = P.validate_hex_bytes(value, 8)
            if not ok:
                return self._ai_err()
            st[key] = P.normalize_hex_input(value)
            return self._ok()
        if key in ("CAPPKEY", "CAPPSKEY", "CNWKSKEY", "CKEYSPROTECT"):
            ok, _ = P.validate_hex_bytes(value, 16)
            if not ok:
                return self._ai_err()
            st[key] = P.normalize_hex_input(value)
            return self._ok()
        if key == "CDEVADDR":
            ok, _ = P.validate_hex_bytes(value, 4)
            if not ok:
                return self._ai_err()
            st[key] = P.normalize_hex_input(value)
            return self._ok()
        if key == "CFREQBANDMASK":
            if not re.fullmatch(r"[0-9A-Fa-f]{1,4}", value or ""):
                return self._ai_err()
            st[key] = value.upper().rjust(4, "0")
            return self._ok()
        if key == "CJOINMODE":
            if value not in ("0", "1"):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CULDLMODE":
            if value not in ("1", "2"):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CWORKMODE":
            if value != "2":
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CCLASS":
            parts = [p.strip() for p in (value or "").split(",")]
            if parts[0] not in ("0", "1", "2"):
                return self._ai_err()
            if len(parts) > 1 and parts[0] == "1":
                if parts[1] == "0" and len(parts) > 2 \
                        and not need_range(parts[2], 0, 7):
                    return self._ai_err()
                if parts[1] == "1" and len(parts) < 5:
                    return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CCONFIRM":
            if value not in ("0", "1"):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CLINKCHECK":
            if value not in ("0", "1", "2"):
                return self._ai_err()
            st[key] = value
            self._ok()
            if value == "1":
                threading.Thread(target=self._ai_linkcheck, daemon=True).start()
                return None
            return None
        if key == "CAPPPORT":
            if not need_range(value, 1, 223):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CDATARATE":
            if not need_range(value, 0, 5):
                return self._ai_err()
            if st.get("CADR") == "1":

                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CTXP":
            if not need_range(value, 0, 7):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CADR":
            if value not in ("0", "1"):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CRXP":
            parts = [p.strip() for p in (value or "").split(",")]
            if len(parts) != 3 or not all(
                    need_range(p, 0, 1000000000) for p in parts):
                return self._ai_err()
            st[key] = ",".join(parts)
            return self._ok()
        if key == "CRX1DELAY":
            if not need_range(value, 0, 255):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CNBTRIALS":
            parts = [p.strip() for p in (value or "").split(",")]
            if len(parts) != 2 or parts[0] not in ("0", "1") \
                    or not need_range(parts[1], 1, 15):
                return self._ai_err()
            st[key] = f"{parts[0]},{parts[1]}"
            return self._ok()
        if key == "CRM":
            parts = [p.strip() for p in (value or "").split(",")]
            if not parts or parts[0] not in ("0", "1"):
                return self._ai_err()
            if len(parts) > 2:
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "ILOGLVL":
            if not need_range(value, 0, 5):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CPINGSLOTINFOREQ":
            if not need_range(value, 0, 7):
                return self._ai_err()
            st[key] = value
            return self._ok()
        if key == "CADDMUTICAST":
            parts = [p for p in (value or "").split(",") if p.strip()]
            if not 3 <= len(parts) <= 5:
                return self._ai_err()
            return self._ok()
        if key == "CDELMUTICAST":
            if not value.strip():
                return self._ai_err()
            return self._ok()
        if key == "IREBOOT":
            if value not in ("0", "1"):
                return self._ai_err()
            self._ok()
            threading.Thread(target=self._ai_reboot, daemon=True).start()
            return None
        if key == "CJOIN":
            return self._ai_join_cmd(value)
        if key == "DTRX":
            return self._ai_dtrx(value)
        return self._ai_err()

    def _ai_reboot(self) -> None:
        time.sleep(0.3)
        self.emit_lines(BANNER, 0.01)

    def _ai_linkcheck(self) -> None:
        time.sleep(1.0)
        self.emit(f"+CLINKCHECK:0,{random.randint(0, 20)},1,"
                  f"{random.randint(-110, -40)},{random.randint(0, 12)}")

    def _ai_join_cmd(self, value: str) -> None:
        parts = [p.strip() for p in (value or "").split(",") if p.strip()]
        if not parts or parts[0] not in ("0", "1"):
            return self._ai_err()
        if len(parts) > 1 and parts[1] not in ("0", "1"):
            return self._ai_err()
        if len(parts) > 2 and not P.validate_range(parts[2], 7, 255)[0]:
            return self._ai_err()
        if len(parts) > 3 and not P.validate_range(parts[3], 1, 256)[0]:
            return self._ai_err()
        if len(parts) > 4:
            return self._ai_err()
        self.state["CJOIN_P"] = ",".join(parts) if parts else "1"
        if parts[0] != "1":
            self.emit("[SIM] 已停止 JOIN")
            return self._ok()
        if self.state.get("CJOINMODE", "0") == "1":

            return self._ai_err()
        self._ok()
        threading.Thread(target=self._ai_async_join, daemon=True).start()
        return None

    def _ai_async_join(self) -> None:
        time.sleep(self.join_delay)
        if self.join_success:
            self.joined = True
            self.state["CSTATUS"] = "04"
            self.emit("+CJOIN:OK")
            self.emit(f"[{int(time.time() * 1000) % 10 ** 7}]Joined")
        else:
            self.emit("+CJOIN:FAIL")

    def _ai_dtrx(self, value: str) -> None:
        parts = [p.strip() for p in (value or "").split(",")]
        if len(parts) < 3 or len(parts) > 4:
            return self._ai_err()
        try:
            confirm = int(parts[0] or "0")
            length = int(parts[2] or "0")
        except ValueError:
            return self._ai_err()
        if confirm not in (0, 1) or not 0 <= length <= 255:
            return self._ai_err()
        payload = P.normalize_hex_input(parts[3] if len(parts) > 3 else "")
        if not self.joined:
            self.emit("ERR+SEND:00")
            return
        if self.rf_busy:
            self.emit("ERR+SEND:01")
            return
        if length > 0 and len(payload) != length * 2:
            self.emit("ERR+SEND:02")
            return
        self.fcnt += 1
        self.emit(f"OK+SEND:{length:02d}")
        threading.Thread(target=self._ai_async_tx,
                         args=(confirm, length), daemon=True).start()
        return None

    def _ai_async_tx(self, confirm: int, length: int) -> None:
        time.sleep(self.tx_delay)
        self.emit("OK+SENT:01")
        port = self.state.get("CAPPPORT", "10")
        self.state["CSTATUS"] = "07"
        if confirm == 1:
            time.sleep(0.8)
            self.emit(f"OK+RECV:02,{int(port):02d},00")
            self.state["CSTATUS"] = "08"
        elif self.state.get("CLINKCHECK") == "2":
            self._ai_linkcheck()

    def _handle_get(self, name: str) -> None:
        key = name.replace("AT+", "")
        if key == "VER":
            for line in BANNER:
                if line.startswith("APPLICATION_VERSION"):
                    self.emit(line)
            self.emit("MW_LORAWAN_VERSION:  V2.4.0")
            self.emit("MW_RADIO_VERSION:    V1.2.0")
            self.emit("L2_SPEC_VERSION:     V1.0.4")
            self.emit("RP_SPEC_VERSION:     V2-1.0.1")
            return self._ok()
        if key == "BAT":
            self.emit(str(self.battery_mv))
            return self._ok()
        if key == "LTIME":
            self.emit("LTIME:" + time.strftime("%Hh%Mm%Ss on %d/%m/%Y"))
            return self._ok()
        if key == "BAND":
            self.emit(f'{self.state["BAND"]}:{C.band_name(self.state["BAND"])}')
            return self._ok()
        if key == "CLASS":
            self.emit(self.state["CLASS"])
            return self._ok()
        if key == "DR" and self.state["ADR"] == "1":
            return self._status("AT_ERROR")
        if key == "TCONF":
            conf = self.state.get("TCONF") or ""
            parts = conf.split(":") if conf else []
            for i, line in enumerate(TCONF_LINES, start=1):
                value = parts[i - 1] if i - 1 < len(parts) else ""
                self.emit(line.replace("{i}", str(i)).replace("{v}", value))
            return self._ok()
        if key in self.state:
            self.emit(self.state[key])
            return self._ok()
        return self._status("AT_ERROR")

    def _handle_set(self, name: str, value: str) -> None:
        key = name.replace("AT+", "")
        value = value.strip()

        if key in ("DEUI", "APPEUI"):
            ok, _ = P.validate_hex_bytes(value, 8)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state[key] = P.normalize_key(value, 8)
            return self._ok()
        if key in ("APPKEY", "NWKKEY", "APPSKEY", "NWKSKEY"):
            ok, _ = P.validate_hex_bytes(value, 16)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state[key] = P.normalize_key(value, 16)
            return self._ok()
        if key == "DADDR":
            ok, _ = P.validate_hex_bytes(value, 4)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state["DADDR"] = P.normalize_key(value, 4)
            return self._ok()
        if key == "NWKID":
            ok, _ = P.validate_range(value, 0, 127)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state["NWKID"] = value
            return self._ok()
        if key == "BAND":
            values = [str(b.get("value")) for b in C.BANDS]
            if values and value not in values:
                return self._status("AT_PARAM_ERROR")
            self.state["BAND"] = value
            return self._ok()
        if key == "CLASS":
            allowed = [str(c).upper() for c in (C.CLASSES or ["A", "B", "C"])]
            if value.upper() not in allowed:
                return self._status("AT_PARAM_ERROR")
            if value.upper() in ("B", "C") and not self.joined:
                return self._status("AT_NO_NET_JOINED")
            target = value.upper()
            self.state["CLASS"] = target
            if target == "C":
                self.emit("+EVT:SWITCH_TO_CLASS_C")
            if target == "B":
                self.emit("+EVT:SWITCH_TO_CLASS_B")
            return self._ok()
        if key == "ADR":
            if value not in ("0", "1"):
                return self._status("AT_PARAM_ERROR")
            self.state["ADR"] = value
            return self._ok()
        if key == "DR":
            ok, _ = P.validate_range(value, 0, 7)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state["DR"] = value
            return self._ok()
        if key == "TXP":
            ok, _ = P.validate_range(value, 0, 15)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state["TXP"] = value
            return self._ok()
        if key == "VL":
            ok, _ = P.validate_range(value, 0, 3)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state["VL"] = value
            return self._ok()
        if key == "DCS":
            if value not in ("0", "1"):
                return self._status("AT_PARAM_ERROR")
            self.state["DCS"] = value
            return self._ok()
        if key in ("JN1DL", "JN2DL", "RX1DL", "RX2DL", "RX2FQ"):
            ok, _ = P.validate_range(value, 0, 1000000000)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state[key] = value
            return self._ok()
        if key == "RX2DR":
            ok, _ = P.validate_range(value, 0, 15)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state["RX2DR"] = value
            return self._ok()
        if key == "PGSLOT":
            ok, _ = P.validate_range(value, 0, 7)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            self.state["PGSLOT"] = value
            return self._ok()
        if key == "JOIN":
            return self._handle_join(value)
        if key == "CERTIF":
            return self._handle_join(value, cert=True)
        if key == "SEND":
            return self._handle_send(value)
        if key == "TTX":
            ok, _ = P.validate_range(value, 1, 65535)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            if self.rf_busy:
                return self._status("AT_BUSY_ERROR")
            self.rf_busy = True
            count = int(value)
            threading.Thread(target=self._run_ttx, args=(count,),
                             daemon=True).start()
            return self._ok()
        if key == "TRX":
            ok, _ = P.validate_range(value, 1, 65535)
            if not ok:
                return self._status("AT_PARAM_ERROR")
            if self.rf_busy:
                return self._status("AT_BUSY_ERROR")
            self.rf_busy = True
            count = int(value)
            threading.Thread(target=self._run_trx, args=(count,),
                             daemon=True).start()
            return self._ok()
        if key == "TTH":
            parts = value.split(",")
            if len(parts) != 4:
                return self._status("AT_PARAM_ERROR")
            if self.rf_busy:
                return self._status("AT_BUSY_ERROR")
            self.rf_busy = True
            threading.Thread(target=self._run_tth, args=(parts,),
                             daemon=True).start()
            return self._ok()
        if key == "TCONF":
            parts = value.split(":")
            if len(parts) != 12:
                return self._status("AT_PARAM_ERROR")
            self.state["TCONF"] = value
            return self._ok()
        return self._status("AT_ERROR")

    def _handle_run(self, name: str) -> None:
        key = name.replace("AT+", "")
        if key == "LINKC":
            return self._ok()
        if key in ("TTONE", "TRSSI", "TOFF", "CS"):
            return self._handle_set(name, "")
        if key in self.state:
            return self._ok()
        return self._status("AT_ERROR")

    def _handle_join(self, mode: str, cert: bool = False) -> None:
        if mode not in ("0", "1"):
            return self._status("AT_PARAM_ERROR")
        if cert:
            self.emit("[SIM] 进入认证模式")
        self._ok()
        threading.Thread(target=self._async_join, args=(mode,),
                         daemon=True).start()
        return None

    def _async_join(self, mode: str) -> None:
        time.sleep(self.join_delay)
        if mode == "0":
            self.joined = True
            self.emit("+EVT:JOINED")
            return
        if self.join_success:
            self.joined = True
            self.emit("+EVT:JOINED")
        else:
            self.emit("+EVT:JOIN FAILED")
        return

    def _handle_send(self, value: str) -> None:
        ok, _ = P.validate_send_payload(value)
        if not ok:
            return self._status("AT_PARAM_ERROR")
        if not self.joined:
            return self._status("AT_NO_NET_JOINED")
        parts = value.split(":")
        ack = parts[1].strip()
        self.fcnt += 1
        self._ok()
        if ack == "1":
            threading.Thread(target=self._async_confirmed,
                             daemon=True).start()
        threading.Thread(target=self._async_rx_event, daemon=True).start()
        return None

    def _async_confirmed(self) -> None:
        time.sleep(0.8)
        self.emit("+EVT:SEND_CONFIRMED")

    def _async_rx_event(self) -> None:
        time.sleep(0.4)
        self.emit(f"+EVT:RX_1:{self.state['RX2DR']}:{random.randint(-110, -40)}:{random.randint(0, 12)}")

    def _run_ttx(self, count: int) -> None:
        for i in range(1, count + 1):
            time.sleep(0.05)
            self.emit(f"[TimeDisplay]:Tx Test: Packet {i} of {count}")
            self.emit("[TimeDisplay]:OnTxDone")
        self.rf_busy = False
        self.emit("[SIM] Tx 测试完成")

    def _run_trx(self, count: int) -> None:
        received = 0
        for i in range(1, count + 1):
            time.sleep(0.05)
            if random.random() > 0.05:
                received += 1
            per = int((i - received) * 100 / i)
            self.emit(f"[TimeDisplay]:Rx: {i} of {count} >>> PER= {per} %")
        self.rf_busy = False
        self.emit("[SIM] Rx 测试完成")

    def _run_tth(self, parts: list[str]) -> None:
        try:
            start = int(parts[0])
            stop = int(parts[1])
            delta = int(parts[2])
            count = int(parts[3])
        except Exception:
            return
        steps = max(1, min(count, int((stop - start) / max(delta, 1)) + 1))
        for i in range(steps):
            freq = start + i * delta
            time.sleep(0.05)
            self.emit(f"[TimeDisplay]: Tx Hop at {freq}Hz. {i} of {steps}")
            self.emit("[TimeDisplay]:OnTxDone")
        self.rf_busy = False
        self.emit("[SIM] 跳频测试完成")

    def _ok(self) -> None:
        self.emit("OK")

    def _status(self, status: str) -> None:
        self.emit(status)
