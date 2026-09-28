from __future__ import annotations

import csv
import json
import time
from html import escape
from pathlib import Path
from typing import Any

from . import paths

def _safe_name(name: str) -> str:
    keep = []
    for ch in (name or "report"):
        if ch.isalnum() or ch in "-_.":
            keep.append(ch)
    return "".join(keep) or "report"

def _timestamp() -> str:
    return time.strftime("%Y%m%d-%H%M%S")

def _target(name: str, fmt: str) -> Path:
    return paths.export_dir() / f"{_safe_name(name)}-{_timestamp()}.{fmt}"

# ------------------------------------------------------------------ Markdown
def to_markdown(result: dict, title: str = "AT 指令测试报告") -> str:
    lines: list[str] = []
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"- 生成时间：{time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"- 总用例：{result.get('total', 0)}")
    lines.append(f"- 通过：{result.get('passed', 0)}")
    lines.append(f"- 失败：{result.get('failed', 0)}")
    lines.append(f"- 跳过：{result.get('skipped', 0)}")
    lines.append(f"- 耗时：{result.get('duration', 0)} 秒")
    lines.append("")
    lines.append("## 结果汇总")
    lines.append("")
    lines.append("| # | 用例 | 指令 | 结果 | 说明 | 耗时(s) |")
    lines.append("|---|------|------|------|------|---------|")
    for item in result.get("results", []):
        status = "跳过" if item.get("skipped") else (
            "通过" if item.get("ok") else "失败")
        cmd = str(item.get("cmd", "")).replace("|", "\\|")
        name = str(item.get("name") or item.get("label", "")).replace("|", "\\|")
        reason = str(item.get("reason") or item.get("error", "")).replace("|", "\\|")
        lines.append(f"| {item.get('index', '')} | {name} | `{cmd}` | {status} "
                     f"| {reason} | {item.get('duration', 0)} |")
    lines.append("")
    return "\n".join(lines)

# ------------------------------------------------------------------ CSV
def to_csv(result: dict) -> str:
    import io

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["序号", "套件", "用例ID", "用例名称", "指令",
                     "结果", "说明", "返回状态", "耗时(s)"])
    for item in result.get("results", []):
        status = "跳过" if item.get("skipped") else (
            "通过" if item.get("ok") else "失败")
        writer.writerow([
            item.get("index", ""),
            item.get("suite_name", ""),
            item.get("id", ""),
            item.get("name") or item.get("label", ""),
            item.get("cmd", ""),
            status,
            item.get("reason") or item.get("error", ""),
            item.get("status", ""),
            item.get("duration", 0),
        ])
    return buf.getvalue()

# ------------------------------------------------------------------ HTML
def to_html(result: dict, title: str = "AT 指令测试报告") -> str:
    rows = []
    for item in result.get("results", []):
        if item.get("skipped"):
            badge, cls = "跳过", "skip"
        elif item.get("ok"):
            badge, cls = "通过", "pass"
        else:
            badge, cls = "失败", "fail"
        rows.append(
            f"<tr><td>{item.get('index', '')}</td>"
            f"<td>{escape(str(item.get('suite_name', '') or ''))}</td>"
            f"<td>{escape(str(item.get('name') or item.get('label') or ''))}</td>"
            f"<td><code>{escape(str(item.get('cmd', '')))}</code></td>"
            f"<td><span class='badge {cls}'>{badge}</span></td>"
            f"<td>{escape(str(item.get('reason') or item.get('error') or ''))}</td>"
            f"<td>{item.get('duration', 0)}</td></tr>")
    total = result.get("total", 0)
    passed = result.get("passed", 0)
    failed = result.get("failed", 0)
    skipped = result.get("skipped", 0)
    rate = (passed / total * 100) if total else 0
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>{escape(title)}</title>
<style>
:root {{ color-scheme: dark; }}
body {{ margin:0; padding:32px; background:#0b1020; color:#e6edf3;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif; }}
h1 {{ font-size:22px; margin:0 0 4px; }}
.meta {{ color:#8b98a9; font-size:13px; margin-bottom:24px; }}
.cards {{ display:flex; gap:12px; flex-wrap:wrap; margin-bottom:24px; }}
.card {{ flex:1 1 120px; background:#151b2e; border:1px solid #232b42;
  border-radius:12px; padding:14px 16px; }}
.card .k {{ color:#8b98a9; font-size:12px; }}
.card .v {{ font-size:24px; font-weight:700; margin-top:4px; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
th, td {{ padding:8px 10px; border-bottom:1px solid #232b42; text-align:left; }}
th {{ color:#8b98a9; font-weight:600; }}
code {{ background:#10162a; padding:2px 6px; border-radius:5px; color:#79c0ff; }}
.badge {{ padding:2px 8px; border-radius:999px; font-size:12px; }}
.pass {{ background:rgba(63,185,80,.16); color:#3fb950; }}
.fail {{ background:rgba(248,81,73,.16); color:#f85149; }}
.skip {{ background:rgba(139,152,169,.16); color:#8b98a9; }}
</style></head><body>
<h1>{escape(title)}</h1>
<div class="meta">生成时间：{time.strftime('%Y-%m-%d %H:%M:%S')} · 通过率 {rate:.1f}%</div>
<div class="cards">
  <div class="card"><div class="k">总用例</div><div class="v">{total}</div></div>
  <div class="card"><div class="k">通过</div><div class="v" style="color:#3fb950">{passed}</div></div>
  <div class="card"><div class="k">失败</div><div class="v" style="color:#f85149">{failed}</div></div>
  <div class="card"><div class="k">跳过</div><div class="v">{skipped}</div></div>
  <div class="card"><div class="k">耗时</div><div class="v">{result.get('duration', 0)}s</div></div>
</div>
<table><thead><tr><th>#</th><th>套件</th><th>用例</th><th>指令</th>
<th>结果</th><th>说明</th><th>耗时(s)</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table>
</body></html>"""

def export_result(result: dict, fmt: str = "md",
                  name: str = "AT测试报告") -> Path:
    fmt = (fmt or "md").lower()
    if fmt in ("markdown", "md"):
        path = _target(name, "md")
        path.write_text(to_markdown(result), encoding="utf-8")
    elif fmt == "csv":
        path = _target(name, "csv")
        path.write_text(to_csv(result), encoding="utf-8-sig")
    elif fmt in ("html", "htm"):
        path = _target(name, "html")
        path.write_text(to_html(result), encoding="utf-8")
    elif fmt == "json":
        path = _target(name, "json")
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2),
                        encoding="utf-8")
    else:
        raise ValueError(f"不支持的导出格式：{fmt}")
    return path

def export_buttons(data: dict) -> Path:
    path = _target("自定义按钮", "json")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2),
                    encoding="utf-8")
    return path

def export_json(data: Any, name: str = "export") -> Path:
    path = _target(name, "json")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2),
                    encoding="utf-8")
    return path

def export_logs(logs: list[dict]) -> Path:
    path = _target("串口日志", "txt")
    content = "\n".join(
        f'[{item.get("ts_text", "")}] {item.get("dir", "")} {item.get("text", "")}'
        for item in logs)
    path.write_text(content, encoding="utf-8")
    return path

def open_in_explorer(path: Path) -> bool:
    import subprocess
    import sys

    try:
        target = str(path)
        if sys.platform == "win32":
            subprocess.Popen(["explorer", "/select,", target])
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", target])
        else:
            subprocess.Popen(["xdg-open", str(path.parent)])
        return True
    except Exception:
        return False

def load_json_file(path: str) -> Any:
    return json.loads(Path(path).read_text(encoding="utf-8"))
