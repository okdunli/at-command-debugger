from __future__ import annotations

import re

STATUS_OK = "OK"
STATUS_ERRORS = [
    "AT_ERROR",
    "AT_PARAM_ERROR",
    "AT_BUSY_ERROR",
    "AT_TEST_PARAM_OVERFLOW",
    "AT_NO_NETWORK_JOINED",
    "AT_NO_NET_JOINED",
    "AT_RX_ERROR",
    "AT_DUTYCYCLE_RESTRICTED",
    "AT_DUTYCYLE_RESTRICTED",
    "AT_CRYPTO_ERROR",
    "AT_NO_CLASS_B_ENABLE",
    "AT_ERROR_UNKNOWN",
]
STATUS_ALL = [STATUS_OK] + STATUS_ERRORS

EVENT_PREFIXES = ("+EVT:", "NVM DATA", "+EVT")
EVENT_JOINED = "+EVT:JOINED"
EVENT_JOIN_FAILED = "+EVT:JOIN FAILED"

STYLE = "an5481"

AI_STATUS_EXACT = ("OK", "ERROR", "+ERROR")
AI_STATUS_PREFIX = ("+CME ERROR", "OK+SEND", "ERR+SEND")
AI_EVENT_PREFIX = ("+CJOIN:", "+CLINKCHECK:", "OK+SENT", "OK+RECV", "ERR+SENT",
                   "+EVENT:", "+DATA:", "+BLUFIDATA:")

# Combo 系错误响应行：+<CMD>:<errno>（纯数字尾缀），如 +MQTTSUB:199
_AI_ERRNO_RE = re.compile(r"^\+[A-Z][A-Z0-9]*:\d+$")

def set_style(style: str) -> None:
    global STYLE
    STYLE = str(style or "an5481").lower()

def get_style() -> str:
    return STYLE

LINE_ENDINGS = {
    "CRLF": "\r\n",
    "CR": "\r",
    "LF": "\n",
}

def line_ending(name: str) -> str:
    return LINE_ENDINGS.get(str(name).upper(), "\r\n")

def is_status(line: str) -> bool:
    text = line.strip()
    if STYLE == "aithinker":
        if text in AI_STATUS_EXACT:
            return True
        return any(text.startswith(p) for p in AI_STATUS_PREFIX)
    return text in STATUS_ALL

def is_error(line: str) -> bool:
    text = line.strip()
    if STYLE == "aithinker":
        if text == "ERROR" or text.startswith("+CME ERROR") or text == "+ERROR":
            return True
        if _AI_ERRNO_RE.match(text):
            return True
        return text.startswith("ERR+")
    return text in STATUS_ERRORS

def is_ok(line: str) -> bool:
    return line.strip() == STATUS_OK

def is_event(line: str) -> bool:
    text = line.strip()
    if STYLE == "aithinker":
        return any(text.startswith(p) for p in AI_EVENT_PREFIX)
    return any(text.startswith(p) for p in EVENT_PREFIXES)

def classify(line: str) -> str:
    text = (line or "").strip()
    if not text:
        return "empty"
    if is_ok(text):
        return "ok"
    if is_error(text):
        return "error"
    if is_event(text):
        return "event"
    return "value"

def event_name(line: str) -> str:
    text = (line or "").strip()
    if text.startswith("+EVT:"):
        return text[5:].split(":")[0].strip()
    return text

_HEX_RE = re.compile(r"^[0-9A-Fa-f\s:/-]+$")

def is_hex(text: str) -> bool:
    cleaned = re.sub(r"[\s:/-]", "", text or "")
    if not cleaned:
        return False
    if len(cleaned) % 2 != 0:
        return False
    return bool(re.fullmatch(r"[0-9A-Fa-f]+", cleaned))

def text_to_hex(text: str, encoding: str = "utf-8") -> str:
    return (text or "").encode(encoding, errors="replace").hex().upper()

def hex_to_text(hex_str: str, encoding: str = "utf-8") -> str:
    cleaned = re.sub(r"[\s:/-]", "", hex_str or "")
    if not cleaned:
        return ""
    if len(cleaned) % 2 != 0:
        cleaned = cleaned[:-1]
    try:
        return bytes.fromhex(cleaned).decode(encoding, errors="replace")
    except Exception:
        return ""

def bytes_to_hex(data: bytes, sep: str = "") -> str:
    return data.hex(sep).upper()

def normalize_key(value: str, size: int = 16, sep: str = ":") -> str:
    cleaned = re.sub(r"[^0-9A-Fa-f]", "", value or "")
    if len(cleaned) < size * 2:
        cleaned = cleaned.ljust(size * 2, "0")
    cleaned = cleaned[: size * 2]
    pairs = [cleaned[i:i + 2].upper() for i in range(0, len(cleaned), 2)]
    return sep.join(pairs)

def normalize_hex_input(value: str) -> str:
    return re.sub(r"[\s:]", "", value or "").upper()

def format_hex_grouped(value: str, sep: str = ":") -> str:
    cleaned = normalize_hex_input(value)
    pairs = [cleaned[i:i + 2] for i in range(0, len(cleaned), 2)]
    return sep.join(pairs)

def build_command(name: str, value: str | None = None,
                  query: bool = False, help_: bool = False) -> str:
    name = (name or "").strip()
    if not name:
        return ""
    if help_:
        return f"{name}?"
    if query:
        return f"{name}=?"
    if value not in (None, ""):
        return f"{name}={value}"
    return name

def parse_int(value: str, default: int = 0) -> int:
    try:
        return int(str(value).strip(), 0)
    except Exception:
        return default

def validate_range(value: str, low: int, high: int) -> tuple[bool, str]:
    try:
        num = int(str(value).strip(), 0)
    except Exception:
        return False, "不是有效整数"
    if num < low or num > high:
        return False, f"取值范围应为 {low}~{high}"
    return True, ""

def validate_hex_bytes(value: str, size: int) -> tuple[bool, str]:
    cleaned = normalize_hex_input(value)
    if not cleaned:
        return False, "不能为空"
    if not re.fullmatch(r"[0-9A-F]+", cleaned):
        return False, "只能包含十六进制字符 0-9 A-F"
    if len(cleaned) != size * 2:
        return False, f"应为 {size} 字节（{size * 2} 个十六进制字符）"
    return True, ""

def validate_choice(value: str, choices: list[str]) -> tuple[bool, str]:
    text = str(value).strip()
    if text in choices:
        return True, ""
    return False, f"可选值：{' / '.join(choices)}"

def validate_send_payload(value: str) -> tuple[bool, str]:
    parts = str(value or "").split(":")
    if len(parts) < 3:
        return False, "格式应为 port:ack:payload，例如 2:0:ABCD"
    port_ok, port_msg = validate_range(parts[0], 1, 223)
    if not port_ok:
        return False, f"端口 {port_msg}"
    if parts[1].strip() not in ("0", "1"):
        return False, "确认位应为 0（非确认）或 1（确认）"
    payload = ":".join(parts[2:])
    ok, msg = validate_hex_bytes(payload, 0) if False else (True, "")
    cleaned = normalize_hex_input(payload)
    if not cleaned or not re.fullmatch(r"[0-9A-F]+", cleaned):
        return False, "载荷必须是十六进制字符串"
    if len(cleaned) > 484:
        return False, "载荷过长（最多 242 字节）"
    return True, ""

def validate_tconf(value: str) -> tuple[bool, str]:
    parts = str(value or "").split(":")
    if len(parts) != 12:
        return False, "应为 12 段参数：freq:pow:bw:sf:cr:lna:pa:mod:paylen:freqdev:lowdropt:BT"
    return True, ""

def validate_tth(value: str) -> tuple[bool, str]:
    parts = str(value or "").replace(",", ",").split(",")
    if len(parts) != 4:
        return False, "应为 Fstart,Fstop,Fdelta,包数（逗号分隔）"
    return True, ""
