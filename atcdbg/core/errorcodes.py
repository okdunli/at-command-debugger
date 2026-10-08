from __future__ import annotations

import json
import re

from . import paths

_COMMON_CODES: list[dict] = [
    {
        "code": "OK", "severity": "ok", "type": "status",
        "meaning": "指令执行成功，无错误。",
        "hint": "继续下一条指令。",
    },
]

_AN5481_CODES: list[dict] = [
    {
        "code": "AT_ERROR", "severity": "err", "type": "status",
        "meaning": "通用错误：指令未被识别（拼写错误或固件不支持该指令）。",
        "hint": "检查指令拼写与大小写；用 AT? 查看固件支持的指令列表。",
    },
    {
        "code": "AT_PARAM_ERROR", "severity": "err", "type": "status",
        "meaning": "参数错误：指令的参数取值或格式不合法。",
        "hint": "核对参数范围与格式（如 KEY 为 16 字节十六进制、DR 为 0~7）。",
    },
    {
        "code": "AT_BUSY_ERROR", "severity": "warn", "type": "status",
        "meaning": "LoRa 网络繁忙（如正在发射/接收），指令未能完成。",
        "hint": "可稍后重试；射频测试中需先 AT+TOFF 停止测试。",
    },
    {
        "code": "AT_TEST_PARAM_OVERFLOW", "severity": "err", "type": "status",
        "meaning": "参数过长，超出指令允许的最大长度。",
        "hint": "缩短参数（如载荷超出最大包长）后重发。",
    },
    {
        "code": "AT_NO_NETWORK_JOINED", "severity": "err", "type": "status",
        "meaning": "LoRa 网络尚未入网，无法执行该操作（发送数据/切 Class 等）。",
        "hint": "先执行 AT+JOIN 完成 OTAA/ABP 入网再重试。",
        "alias": "AT_NO_NET_JOINED（Ra-09 固件短写形式）",
    },
    {
        "code": "AT_NO_NET_JOINED", "severity": "err", "type": "status",
        "meaning": "LoRa 网络尚未入网（Ra-09 固件短写形式）。",
        "hint": "先执行 AT+JOIN 完成 OTAA/ABP 入网再重试。",
    },
    {
        "code": "AT_RX_ERROR", "severity": "err", "type": "status",
        "meaning": "接收错误：指令在传输中被破坏，固件未执行该指令。",
        "hint": "按手册先发送一个空行 <CR><LF> 清空队列，再原样重发指令。",
        "recover": "purge_crlf",
    },
    {
        "code": "AT_DUTYCYCLE_RESTRICTED", "severity": "warn", "type": "status",
        "meaning": "占空比限制：当前区域发射占空比已耗尽，指令被拒绝。",
        "hint": "等待占空比窗口恢复，或关闭占空比管理（AT+DCS=1，测试场景）。",
    },
    {
        "code": "AT_DUTYCYLE_RESTRICTED", "severity": "warn", "type": "status",
        "meaning": "占空比限制（固件历史拼写形式）。",
        "hint": "同 AT_DUTYCYCLE_RESTRICTED。",
    },
    {
        "code": "AT_CRYPTO_ERROR", "severity": "fatal", "type": "status",
        "meaning": "加密计算失败：会话密钥或加解密上下文异常。",
        "hint": "多为密钥不匹配/上下文损坏，重写密钥并 AT+RFS 恢复出厂后重新入网。",
    },
    {
        "code": "AT_NO_CLASS_B_ENABLE", "severity": "err", "type": "status",
        "meaning": "设备不支持或未启用 Class B，无法切换。",
        "hint": "确认网关下发 Beacon/PingSlot 配置且固件开启 Class B 支持。",
    },
    {
        "code": "AT_ERROR_UNKNOWN", "severity": "err", "type": "status",
        "meaning": "未知错误（固件内部未分类）。",
        "hint": "读取详细日志复现步骤；尝试复位（ATZ）后重试。",
    },

    {
        "code": "+EVT:JOINED", "severity": "ok", "type": "event",
        "meaning": "OTAA 入网成功。",
        "hint": "可以开始发送数据（AT+SEND）。",
    },
    {
        "code": "+EVT:JOIN FAILED", "severity": "err", "type": "event",
        "meaning": "入网失败：ID/密钥错误、网关未收到上行、或下行未收到/解密失败。",
        "hint": "核对 DevEUI/AppEUI/AppKey 与网关侧配置，重新调用 AT+JOIN。",
    },
    {
        "code": "+EVT:SEND_CONFIRMED", "severity": "ok", "type": "event",
        "meaning": "确认帧已被网关 ACK。",
        "hint": "链路上行正常。",
    },
    {
        "code": "+EVT:BEACON_NOT_RECEIVED", "severity": "warn", "type": "event",
        "meaning": "Class B 信标窗口未收到信标。",
        "hint": "检查网关是否开启信标广播、覆盖是否正常。",
    },
    {
        "code": "+EVT:BEACON_LOST", "severity": "warn", "type": "event",
        "meaning": "超过 120 分钟未收到信标，Class B 已回退为 Class A 并重新搜信标。",
        "hint": "无需手动处理，恢复覆盖后自动重新锁定。",
    },
    {
        "code": "NVM DATA STORED", "severity": "ok", "type": "event",
        "meaning": "LoRaWAN 上下文已成功写入 Flash（AT+CS）。",
        "hint": "",
    },
    {
        "code": "NVM DATA RESTORED", "severity": "ok", "type": "event",
        "meaning": "LoRaWAN 上下文已从 Flash 恢复。",
        "hint": "",
    },
]

_AITHINKER_CODES: list[dict] = [
    {
        "code": "+CME ERROR", "severity": "err", "type": "status",
        "meaning": "Ra-08 命令执行失败，附带 CME 错误码。",
        "hint": "核对指令拼写与参数取值范围（密钥 16/32 位 HEX、端口 1~223 等）。",
    },
    {
        "code": "+CJOIN:OK", "severity": "ok", "type": "event",
        "meaning": "Ra-08 OTAA 入网成功（随后打印 [ts]Joined）。",
        "hint": "可以开始发送数据（AT+DTRX）。",
    },
    {
        "code": "+CJOIN:FAIL", "severity": "err", "type": "event",
        "meaning": "Ra-08 入网失败：三元组错误、频组掩码不对或网关未收到 Join Request。",
        "hint": "核对 DevEUI/AppEUI/AppKey 与网关侧配置；确认 CFREQBANDMASK 与网关频段一致后重试 AT+CJOIN。",
    },
    {
        "code": "OK+SENT", "severity": "ok", "type": "event",
        "meaning": "Ra-08 数据发送成功（OK+SENT:次数）。",
        "hint": "",
    },
    {
        "code": "OK+RECV", "severity": "ok", "type": "event",
        "meaning": "Ra-08 收到下行数据 / 应答（OK+RECV:TYPE,PORT,LEN,DATA）。",
        "hint": "TYPE 按 bit 解析：bit0 确认、bit1 ACK、bit2 LINK 应答、bit3 TIME 应答。",
    },
    {
        "code": "ERR+SEND:00", "severity": "err", "type": "status",
        "meaning": "Ra-08 发送请求失败：节点未入网。",
        "hint": "先完成入网（OTAA：AT+CJOIN；ABP：AT+CJOINMODE=1 并写会话密钥）。",
    },
    {
        "code": "ERR+SEND:01", "severity": "warn", "type": "status",
        "meaning": "Ra-08 发送请求失败：通信忙（上一帧尚未完成）。",
        "hint": "稍候重试；确认帧需等待上一帧 ACK 或超时。",
    },
    {
        "code": "ERR+SEND:02", "severity": "err", "type": "status",
        "meaning": "Ra-08 发送请求失败：数据长度超过当前速率允许的最大长度。",
        "hint": "缩短载荷或提高 DR（AT+CDATARATE，需先 AT+CADR=0）。",
    },
    {
        "code": "ERR+SENT", "severity": "err", "type": "status",
        "meaning": "Ra-08 确认帧重传达到最大次数仍未收到应答，发送失败。",
        "hint": "检查链路覆盖 / 网关下行；确认帧可改非确认帧验证上行通路。",
    },
]

STYLE_DEFAULTS: dict[str, list[dict]] = {
    "an5481": _COMMON_CODES + _AN5481_CODES,
    "aithinker": _COMMON_CODES + _AITHINKER_CODES,
}

POLICIES = ("stop", "skip", "continue")

_ACTIVE_PROFILE = ""
_ACTIVE_STYLE = "an5481"
_ACTIVE_SOURCE = "default"

CODES: list[dict] = list(STYLE_DEFAULTS["an5481"])
_BY_CODE: dict[str, dict] = {c["code"].upper(): c for c in CODES}

_PATTERNS: list[dict] = sorted(CODES, key=lambda c: -len(c["code"]))

def _default_codes(style: str) -> list[dict]:
    return [dict(c) for c in STYLE_DEFAULTS.get(style or "an5481",
                                                STYLE_DEFAULTS["an5481"])]

def _rebuild(codes: list[dict]) -> None:
    global _BY_CODE, _PATTERNS
    CODES[:] = codes
    _BY_CODE = {c["code"].upper(): c for c in CODES if not c.get("pattern")}
    _PATTERNS = sorted(CODES, key=lambda c: -len(c.get("pattern") or c["code"]))

def _load_custom(profile_id: str) -> list[dict] | None:
    candidates: list = []
    try:
        candidates.append(paths.errorcodes_file(profile_id))
    except Exception:
        pass
    # 允许内置（仓库内）配置集携带自己的错误码库，而不只限于 user_dir
    try:
        candidates.append(paths.builtin_profiles_dir()
                          / (profile_id or "") / "errorcodes.json")
    except Exception:
        pass
    for path in candidates:
        try:
            if path.exists():
                data = json.loads(path.read_text(encoding="utf-8"))
                codes = data.get("codes") if isinstance(data, dict) else data
                if isinstance(codes, list) and codes:
                    return [dict(c) for c in codes
                            if isinstance(c, dict) and c.get("code")]
        except Exception:
            continue
    return None

def _profile_builtin_codes(profile_id: str) -> list[dict] | None:
    """读取 profile.json 内置的 error_codes（供重置时回退）。"""
    try:
        from . import profiles
        codes = profiles.load(profile_id).get("error_codes")
        if isinstance(codes, list) and codes:
            return [dict(c) for c in codes
                    if isinstance(c, dict) and c.get("code")]
    except Exception:
        pass
    return None

def set_active(profile_id: str = "", style: str = "an5481", codes=None) -> None:
    global _ACTIVE_PROFILE, _ACTIVE_STYLE, _ACTIVE_SOURCE
    _ACTIVE_PROFILE = profile_id or ""
    _ACTIVE_STYLE = style or "an5481"
    # 优先级：用户保存的侧车 errorcodes.json（自定义）> profile 内置 error_codes > 风格默认集
    sidecar = _load_custom(_ACTIVE_PROFILE) if _ACTIVE_PROFILE else None
    if sidecar is not None:
        _ACTIVE_SOURCE = "custom"
        _rebuild(sidecar)
        return
    # 调用方未显式传 codes 时，自动回退到 profile 内置错误码库
    if codes is None and _ACTIVE_PROFILE:
        codes = _profile_builtin_codes(_ACTIVE_PROFILE)
    if isinstance(codes, list) and codes:
        custom = [dict(c) for c in codes
                  if isinstance(c, dict) and c.get("code")]
        if custom:
            _ACTIVE_SOURCE = "profile"
            _rebuild(custom)
            return
    _ACTIVE_SOURCE = "default"
    _rebuild(_default_codes(_ACTIVE_STYLE))

def active_info() -> dict:
    return {
        "profile": _ACTIVE_PROFILE,
        "style": _ACTIVE_STYLE,
        "source": _ACTIVE_SOURCE,
        "count": len(CODES),
        "file": str(paths.errorcodes_file(_ACTIVE_PROFILE))
        if _ACTIVE_PROFILE else "",
    }

def save_active(codes: list[dict]) -> dict:
    if not _ACTIVE_PROFILE:
        return {"ok": False, "error": "无活动配置集，无法保存"}
    clean: list[dict] = []
    for c in codes or []:
        if not isinstance(c, dict) or not str(c.get("code") or "").strip():
            continue
        entry = {
            "code": str(c.get("code")).strip(),
            "severity": c.get("severity") if c.get("severity") in
            ("ok", "info", "warn", "err", "fatal") else "err",
            "type": "event" if c.get("type") == "event" else "status",
            "meaning": str(c.get("meaning") or ""),
            "hint": str(c.get("hint") or ""),
        }
        if c.get("alias"):
            entry["alias"] = str(c["alias"])
        if c.get("pattern"):
            entry["pattern"] = str(c["pattern"])
        clean.append(entry)
    if not clean:
        return {"ok": False, "error": "错误码表为空或格式不合法"}
    path = paths.errorcodes_file(_ACTIVE_PROFILE)
    path.write_text(json.dumps({"codes": clean}, ensure_ascii=False, indent=1),
                    encoding="utf-8")
    set_active(_ACTIVE_PROFILE, _ACTIVE_STYLE)
    return {"ok": True, "info": active_info()}

def reset_active() -> dict:
    if not _ACTIVE_PROFILE:
        return {"ok": False, "error": "无活动配置集"}
    path = paths.errorcodes_file(_ACTIVE_PROFILE)
    try:
        if path.exists():
            path.unlink()
    except OSError as exc:
        return {"ok": False, "error": str(exc)}
    # 重置后回到 profile 内置错误码库（而非风格默认集）
    set_active(_ACTIVE_PROFILE, _ACTIVE_STYLE,
               _profile_builtin_codes(_ACTIVE_PROFILE))
    return {"ok": True, "info": active_info()}

def get(code: str) -> dict | None:
    return _BY_CODE.get((code or "").strip().upper())

def all_codes() -> list[dict]:
    return [dict(c) for c in CODES]

def is_error(code: str) -> bool:
    entry = get(code)
    return bool(entry) and entry["severity"] in ("err", "fatal")

def scan(text: str) -> list[dict]:
    if not text:
        return []
    hits: list[dict] = []
    seen: set[str] = set()
    upper = text.upper()
    for entry in _PATTERNS:
        code = entry["code"].upper()
        if code in seen:
            continue
        pat = entry.get("pattern")
        if pat:
            try:
                if re.search(pat, upper):
                    seen.add(code)
                    hits.append(dict(entry))
            except re.error:
                continue
        elif code in upper:
            seen.add(code)
            hits.append(dict(entry))
    return hits

def scan_lines(lines: list[str]) -> list[dict]:
    return scan("\n".join(lines or []))

def describe(status: str, lines: list[str] | None = None) -> dict | None:
    entry = get(status) if status else None
    if entry and entry["severity"] != "ok":
        return entry
    for hit in scan_lines(lines or []):
        if hit["severity"] in ("err", "fatal", "warn"):
            return hit
    return None
