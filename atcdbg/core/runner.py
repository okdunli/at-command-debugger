from __future__ import annotations

import queue
import time
from typing import Callable

from . import errorcodes as EC
from . import protocol as P
from .config import AppConfig
from .serial_mgr import SerialManager

class Runner:
    def __init__(self, mgr: SerialManager, cfg: AppConfig) -> None:
        self.mgr = mgr
        self.cfg = cfg
        self.on_send: Callable[[str], None] | None = None
        self._cancel = False
        self._running = False

    @property
    def running(self) -> bool:
        return self._running

    def cancel(self) -> None:
        self._cancel = True

    def _check_conn(self) -> str:
        if not self.mgr.is_open:
            return "串口未连接"
        return ""

    def send(self, cmd: str, timeout: float | None = None,
             wait_event: float = 0.0, expect: str = "",
             no_status: bool = False, line_ending: str = "") -> dict:
        err = self._check_conn()
        if err:
            return {"ok": False, "cmd": cmd, "error": err, "lines": [],
                    "events": [], "status": "", "duration": 0.0}

        proto = self.cfg.protocol
        if line_ending:

            le = {"NONE": ""}.get(line_ending.upper(),
                                  P.line_ending(line_ending))
        else:
            le = P.line_ending(proto.get("line_ending", "CRLF"))
        timeout = timeout or float(proto.get("read_timeout", 5.0))
        strip_echo = bool(proto.get("strip_echo", True))
        if no_status:
            timeout = max(timeout, 2.0)

        q = self.mgr.subscribe()
        started = time.time()
        lines: list[str] = []
        events: list[str] = []
        status = ""
        try:
            self.mgr.write((cmd + le).encode("utf-8"))
            if self.on_send:
                try:
                    self.on_send(cmd)
                except Exception:
                    pass
            soft_deadline = started + timeout
            event_deadline = None
            tokens = [t.strip() for t in (expect or "").split("|") if t.strip()]
            want_event = any(t.startswith(("+", "OK+", "ERR+"))
                             for t in tokens)
            while True:
                if self._cancel:
                    return {"ok": False, "cmd": cmd, "error": "已取消",
                            "lines": lines, "events": events,
                            "status": status,
                            "duration": round(time.time() - started, 3)}
                now = time.time()
                limit = event_deadline or soft_deadline
                if now > limit:
                    break
                try:
                    item = q.get(timeout=0.03)
                except queue.Empty:
                    continue
                if item.get("type") != "rx":
                    continue
                text = (item.get("text") or "").strip()
                if not text:
                    continue
                if strip_echo and text == cmd.strip():
                    continue
                lines.append(text)
                if P.is_event(text):
                    events.append(text)
                if P.is_status(text) and not status:
                    status = text
                    if wait_event > 0:
                        event_deadline = time.time() + wait_event
                    else:
                        break
                if status and wait_event > 0:
                    if not want_event:
                        break
                    if any(t in e or e.startswith(t)
                           for t in tokens for e in events):
                        break
        finally:
            self.mgr.unsubscribe(q)

        duration = round(time.time() - started, 3)
        ok = self._judge(status, expect, no_status, lines, events, wait_event)
        err = self._error_text(status, expect, lines)
        errors = EC.scan(status + "\n" + "\n".join(lines + events)) if not ok else []
        return {
            "ok": ok,
            "cmd": cmd,
            "status": status,
            "lines": lines,
            "events": events,
            "duration": duration,
            "error": err,
            "errors": errors,
            "err_meaning": (errors[0]["meaning"] if errors else ""),
            "err_hint": (errors[0]["hint"] if errors else ""),
        }

    def _judge(self, status: str, expect: str, no_status: bool,
               lines: list[str], events: list[str], wait_event: float) -> bool:
        if no_status:
            return True
        style_ok = status == "OK" or (
            P.get_style() == "aithinker" and status.startswith("OK+SEND"))
        if expect:
            for token in (t.strip() for t in expect.split("|") if t.strip()):
                if token == "OK" and style_ok:
                    return True
                if token.startswith("+") and \
                        any(token in e for e in events):
                    return True
                if token in P.STATUS_ERRORS and status == token:
                    return True
                if token.startswith(("OK+", "ERR+")) and (
                        status.startswith(token)
                        or any(e.startswith(token) for e in events)):
                    return True
                if not token.startswith(("+", "AT_", "OK")) and \
                        any(token in line for line in lines):
                    return True
            return False
        if wait_event > 0:
            return bool(events)
        return style_ok

    def _error_text(self, status: str, expect: str, lines: list[str]) -> str:
        if status:
            return f"模组返回 {status}"
        if expect.startswith("+EVT"):
            return f"未等到事件 {expect}（超时）"
        return "等待响应超时（未收到状态）"

    def run_steps(self, steps: list[dict],
                  on_progress: Callable[[dict], None] | None = None,
                  delay_override: float | None = None) -> dict:
        self._cancel = False
        self._running = True
        total = len(steps)
        results: list[dict] = []
        passed = 0
        started = time.time()
        aborted = False
        try:
            index = 0
            while index < total:
                if self._cancel:
                    break
                step = steps[index]
                cmd = step.get("cmd", "")
                result = self.send(
                    cmd,
                    timeout=float(step.get("timeout") or 0) or None,
                    wait_event=float(step.get("wait_event") or 0),
                    expect=step.get("expect", "OK"),
                    no_status=bool(step.get("no_status")),
                )
                item = {
                    "index": index + 1,
                    "total": total,
                    "label": step.get("label", cmd),
                    "note": step.get("note", ""),
                    "cmd": cmd,
                    "ok": result["ok"],
                    "status": result["status"],
                    "lines": result["lines"],
                    "events": result["events"],
                    "duration": result["duration"],
                    "error": result["error"],
                    "errors": result.get("errors", []),
                    "err_meaning": result.get("err_meaning", ""),
                    "err_hint": result.get("err_hint", ""),
                    "cancelled": self._cancel,
                }
                results.append(item)
                if result["ok"]:
                    passed += 1
                if on_progress:
                    try:
                        on_progress(item)
                    except Exception:
                        pass
                if self._cancel:
                    break
                if not result["ok"]:
                    policy = str(step.get("on_error") or "stop").lower()
                    if policy == "stop":
                        aborted = True
                        break
                    if policy == "skip":

                        for rest in steps[index + 1:]:
                            results.append({
                                "index": results[-1]["index"] + 1 if results else 1,
                                "total": total,
                                "label": rest.get("label", rest.get("cmd", "")),
                                "note": rest.get("note", ""),
                                "cmd": rest.get("cmd", ""),
                                "ok": None, "skipped": True,
                                "reason": "上一步出错，按策略跳过",
                                "status": "", "lines": [], "events": [],
                                "duration": 0.0, "error": "",
                                "errors": [], "err_meaning": "", "err_hint": "",
                                "cancelled": self._cancel,
                            })
                        aborted = True
                        break

                index += 1
                gap = delay_override
                if gap is None:
                    gap = float(step.get("delay") or 0)
                if gap > 0:
                    self._sleep(gap)
        finally:
            self._running = False

        executed = len([r for r in results if not r.get("skipped")])
        skipped = len(results) - executed
        return {
            "ok": passed == total and not self._cancel and not aborted,
            "total": total,
            "passed": passed,
            "failed": executed - passed,
            "skipped": skipped,
            "aborted": aborted,
            "cancelled": self._cancel,
            "duration": round(time.time() - started, 3),
            "results": results,
        }

    def _sleep(self, seconds: float) -> None:
        end = time.time() + seconds
        while time.time() < end:
            if self._cancel:
                break
            time.sleep(0.05)

    def run_case(self, case: dict) -> dict:
        cmd = case.get("cmd", "")
        result = self.send(
            cmd,
            timeout=float(case.get("timeout") or 3.0),
            wait_event=float(case.get("event_timeout") or 0),
            expect=case.get("expect", "OK"),
        )
        passed, reason = self.evaluate(case, result)
        cleanup_note = ""
        cleanup_cmd = case.get("cleanup")
        if cleanup_cmd:
            try:
                self.send(cleanup_cmd, timeout=3.0)
                cleanup_note = f"已执行收尾 {cleanup_cmd}"
            except Exception:
                pass
        return {
            "case": case,
            "ok": passed,
            "reason": reason,
            "status": result.get("status", ""),
            "lines": result.get("lines", []),
            "events": result.get("events", []),
            "duration": result.get("duration", 0.0),
            "errors": result.get("errors", []),
            "err_meaning": result.get("err_meaning", ""),
            "err_hint": result.get("err_hint", ""),
            "cleanup": cleanup_note,
        }

    def evaluate(self, case: dict, result: dict) -> tuple[bool, str]:
        expect = (case.get("expect") or "OK").strip()
        status = result.get("status", "")
        lines = result.get("lines", [])
        events = result.get("events", [])

        if not self._judge(status, expect, False, lines, events, 0):
            if expect.startswith(("+", "OK+", "ERR+")):
                return False, f"未等到预期响应 {expect}"
            return False, f"期望 {expect}，实际 {status or '等待响应超时'}"

        contains = case.get("contains")
        if contains and not any(contains in line for line in lines):
            return False, f"响应中未包含 “{contains}”"

        value_in = case.get("value_in")
        if value_in:
            values = [line.strip() for line in lines
                      if line.strip() and not P.is_status(line)
                      and not P.is_event(line)]
            if not any(v in value_in for v in values):
                return False, f"返回值 {values[:2]} 不在预期集合内"

        hex_len = case.get("hex_len")
        if hex_len:
            values = [line.strip() for line in lines
                      if line.strip() and not P.is_status(line)]
            ok = False
            for value in values:
                ok, _ = P.validate_hex_bytes(value, int(hex_len))
                if ok:
                    break
            if not ok:
                return False, f"返回值不是 {hex_len} 字节十六进制"

        verify = case.get("verify")
        if verify:
            vcmd = verify.get("cmd")
            if vcmd:
                vres = self.send(vcmd, timeout=3.0)
                needle = (verify.get("contains") or "").strip()
                vlines = " ".join(vres.get("lines", []))
                if needle:
                    if needle.lower() in vlines.lower():
                        return True, "回读校验通过"
                    return False, f"回读未包含 {needle}（实际 {vlines[:60]}）"
                if vres.get("ok"):
                    return True, "回读校验通过"
                return False, "回读指令未返回 OK"

        return True, "通过"

    def run_suite(self, cases: list[dict],
                  on_progress: Callable[[dict], None] | None = None) -> dict:
        self._cancel = False
        self._running = True
        total = len(cases)
        results: list[dict] = []
        passed = 0
        skipped = 0
        aborted = False
        started = time.time()
        try:
            index = 0
            while index < total:
                if self._cancel:
                    break
                case = cases[index]
                if case.get("skip"):
                    item = {
                        "index": index + 1, "total": total,
                        "id": case.get("id", ""), "name": case.get("name", ""),
                        "cmd": case.get("cmd", ""),
                        "suite": case.get("suite", ""),
                        "suite_name": case.get("suite_name", ""),
                        "ok": None, "skipped": True,
                        "reason": "已跳过", "lines": [], "events": [],
                        "duration": 0.0, "status": "",
                        "errors": [], "err_meaning": "", "err_hint": "",
                    }
                    results.append(item)
                    skipped += 1
                    if on_progress:
                        on_progress(item)
                    index += 1
                    continue

                outcome = self.run_case(case)
                item = {
                    "index": index + 1,
                    "total": total,
                    "id": case.get("id", ""),
                    "name": case.get("name", ""),
                    "cmd": case.get("cmd", ""),
                    "suite": case.get("suite", ""),
                    "suite_name": case.get("suite_name", ""),
                    "ok": outcome["ok"],
                    "skipped": False,
                    "reason": outcome["reason"],
                    "status": outcome["status"],
                    "lines": outcome["lines"],
                    "events": outcome["events"],
                    "duration": outcome["duration"],
                    "errors": outcome.get("errors", []),
                    "err_meaning": outcome.get("err_meaning", ""),
                    "err_hint": outcome.get("err_hint", ""),
                    "cleanup": outcome.get("cleanup", ""),
                }
                results.append(item)
                if outcome["ok"]:
                    passed += 1
                if on_progress:
                    try:
                        on_progress(item)
                    except Exception:
                        pass
                if self._cancel:
                    break
                if not outcome["ok"]:
                    policy = str(case.get("on_error") or "continue").lower()
                    if policy == "stop":
                        aborted = True
                        break
                    if policy == "skip":
                        for rest in cases[index + 1:]:
                            results.append({
                                "index": len(results) + 1, "total": total,
                                "id": rest.get("id", ""),
                                "name": rest.get("name", ""),
                                "cmd": rest.get("cmd", ""),
                                "suite": rest.get("suite", ""),
                                "suite_name": rest.get("suite_name", ""),
                                "ok": None, "skipped": True,
                                "reason": "上一步出错，按策略跳过",
                                "lines": [], "events": [], "duration": 0.0,
                                "status": "", "errors": [],
                                "err_meaning": "", "err_hint": "",
                            })
                            skipped += 1
                            if on_progress:
                                on_progress(results[-1])
                        aborted = True
                        break

                index += 1
                self._sleep(float(self.cfg.protocol.get("command_delay", 0.35)))
        finally:
            self._running = False

        executed = total - skipped
        return {
            "total": total,
            "executed": executed,
            "passed": passed,
            "failed": executed - passed,
            "skipped": skipped,
            "aborted": aborted,
            "cancelled": self._cancel,
            "duration": round(time.time() - started, 3),
            "results": results,
        }
