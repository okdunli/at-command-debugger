from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import webbrowser
from pathlib import Path

from ..core import paths
from ..core.logging_setup import setup as setup_logging

UI_DIR = paths.ui_dir()
INDEX_FILE = UI_DIR / "index.html"
BG_COLOR = "#0b0e14"
_MIN_SIZE = (1120, 640)


def _icon_file() -> str | None:
    if sys.platform == "win32":
        names = ("icon.ico", "icon.png", "icon_256.png")
    else:
        names = ("icon.png", "icon_256.png", "icon.ico")
    for name in names:
        for base in (paths.app_dir(), paths.app_dir().parent):
            path = base / "assets" / name
            if path.exists():
                return str(path)
    return None


def _dpi_aware() -> None:
    if sys.platform != "win32":
        return
    try:
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass


def _acquire_single_instance():
    lock_path = paths.runtime_dir() / "app.lock"
    try:
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        fh = open(lock_path, "w", encoding="utf-8")
    except OSError:
        return None
    try:
        if sys.platform == "win32":
            import msvcrt
            msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        fh.close()
        return None
    try:
        fh.seek(0)
        fh.truncate()
        fh.write(str(os.getpid()))
        fh.flush()
    except OSError:
        pass
    return fh


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="AT指令调试台")
    parser.add_argument("--browser", action="store_true",
                        help="不启动桌面窗口，仅开启本地 HTTP 服务")
    parser.add_argument("--host", default="", help="HTTP 监听地址")
    parser.add_argument("--port", type=int, default=0, help="HTTP 端口（0=自动）")
    parser.add_argument("--open", dest="open_browser", action="store_true",
                        help="浏览器模式下自动打开系统默认浏览器")
    parser.add_argument("--debug", action="store_true", help="开启 WebView 调试")
    parser.add_argument("--verbose", action="store_true", help="输出详细日志")
    parser.add_argument("--selftest", action="store_true", help="自检后退出")
    parser.add_argument("--no-http", action="store_true", help="不启动 HTTP 服务")
    parser.add_argument("--instance", default="",
                        help="多实例名称（如 dev2）：使用独立数据目录与锁，"
                             "可同时开多个窗口分别控制不同设备")
    args = parser.parse_args(argv)

    if args.instance:
        paths.set_instance(args.instance)

    if not args.selftest:



        auto_instance = ""
        lock_fh = _acquire_single_instance()
        if lock_fh is None and not args.instance:
            for n in range(2, 51):
                paths.set_instance(str(n))
                lock_fh = _acquire_single_instance()
                if lock_fh is not None:
                    auto_instance = str(n)
                    break
            if lock_fh is None:
                print("实例数量已达上限（49 个窗口），无法再启动。")
                return 5
        elif lock_fh is None:
            print(f"实例 {args.instance} 已在运行（窗口标题可见实例名）。")
            print("如要再开一个窗口控制其他设备，直接再双击一次 run.bat 即可。")
            return 5
        if auto_instance:
            print(f"检测到已有窗口在运行，已自动开启新实例（{auto_instance}），"
                  "可连接另一台设备。")

    log = setup_logging(verbose=args.verbose)

    if not INDEX_FILE.exists():
        print(f"界面文件缺失：{INDEX_FILE}")
        return 3

    from .backend import Api, start_http_server

    api = Api()

    if args.selftest:
        result = api.selftest()
        print("=" * 60)
        print("AT指令调试台 · 自检")
        print("=" * 60)
        for check in result["checks"]:
            flag = "OK  " if check["ok"] else "FAIL"
            print(f'  [{flag}] {check["name"]}: {check["detail"]}')
        print("-" * 60)
        print("结果：" + ("全部通过" if result["ok"] else "存在失败项"))
        return 0 if result["ok"] else 1

    cfg = api.cfg
    host = args.host or cfg.behavior.get("http_host", "127.0.0.1")
    port = args.port or int(cfg.behavior.get("http_port", 0) or 0)
    server = None
    if not args.no_http and cfg.behavior.get("http_server", True):
        try:
            server, port = start_http_server(api, host=host, port=port)
            url = f"http://{host}:{port}/"
            api.http_url = url
            print(f"内置 HTTP 服务已启动：{url}")
            log.info("HTTP 服务 %s", url)
            if args.browser and args.open_browser:
                threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        except Exception as exc:
            log.warning("HTTP 服务启动失败：%s", exc)

    if args.browser:
        if server is None:
            print("HTTP 服务未启动，无法使用浏览器模式")
            return 4
        print("浏览器模式：按 Ctrl+C 退出")
        try:
            while True:
                threading.Event().wait(1.0)
        except KeyboardInterrupt:
            pass
        return 0

    try:
        import webview
    except ImportError:
        print("缺少 pywebview，无法启动桌面界面。")
        print("  请执行：pip install pywebview")
        print("  或改用浏览器模式：python -m atcdbg --browser --open")
        return 2

    _dpi_aware()
    win_cfg = cfg.window
    width = max(1120, int(win_cfg.get("width") or 1120))
    height = max(640, int(win_cfg.get("height") or 720))
    pos = _sanitize_position(webview, win_cfg.get("x"), win_cfg.get("y"))



    if server is not None:
        host_show = "127.0.0.1" if host in ("", "0.0.0.0", "::") else host
        desktop_url = f"http://{host_show}:{port}/index.html?desktop=1"
    else:
        desktop_url = None

    window = _create_window(webview, api, width, height, pos, desktop_url)
    api._win = window

    def _on_closing() -> bool:
        try:
            from ..core import winnative
            state: dict[str, object] = {"maximized": bool(api._maximized)}
            if not api._maximized:
                geometry = winnative.logical_geometry(window)
                if geometry is None:
                    state.update({
                        "width": int(window.width),
                        "height": int(window.height),
                        "x": int(window.x),
                        "y": int(window.y),
                    })
                else:
                    state.update(geometry)
            api.save_window_state(state)
        except Exception:
            pass
        return True

    def _on_closed() -> None:
        api.shutdown()

    try:
        window.events.closing += _on_closing
        window.events.closed += _on_closed
    except Exception:
        pass

    log.info("界面已启动（%s）", paths.platform_label())

    def _after_start() -> None:

        try:
            from ..core import winnative
            if winnative.attach(window):
                winnative.enable_rounded_corners(window)
                log.info("已启用 Win32 原生窗口拖动")
        except Exception as exc:
            log.warning("原生窗口拖动不可用：%s", exc)
        if win_cfg.get("maximized"):
            try:
                from ..core import winnative
                geo = winnative.logical_geometry(window)
                if geo:
                    api._restore_rect = geo
                wa = winnative.work_area_physical(window)
                if wa and winnative.set_rect_physical(
                        window, wa["x"], wa["y"], wa["width"], wa["height"]):
                    api._maximized = True
                else:
                    window.maximize()
                    api._maximized = True
            except Exception:
                pass


        try:
            opacity = int(cfg.ui.get("window_opacity", 100) or 100)
            if 40 <= opacity < 100:
                from ..core import winnative
                winnative.set_opacity(window, opacity)
        except Exception:
            pass


        if win_cfg.get("topmost"):
            try:
                from ..core import winnative
                winnative.set_topmost(window, True)
            except Exception:
                pass

        if cfg.behavior.get("auto_connect", False):
            def _auto() -> None:
                try:
                    result = api.auto_connect_last()
                    if result.get("ok"):
                        log.info("已自动连接上次串口：%s", result.get("port"))
                    elif not result.get("skipped"):
                        log.warning("自动连接失败：%s", result.get("error"))
                except Exception as exc:
                    log.warning("自动连接异常：%s", exc)
            threading.Thread(target=_auto, daemon=True).start()

    webview.start(debug=args.debug, func=_after_start, icon=_icon_file())
    return 0


def _sanitize_position(webview, x, y):
    if x is None or y is None:
        return None
    try:
        px, py = int(x), int(y)
    except (TypeError, ValueError):
        return None
    try:
        screens = list(webview.screens)
    except Exception:
        return (px, py)
    if not screens:
        return (px, py)
    for screen in screens:
        try:
            left = int(getattr(screen, "x", 0) or 0)
            top = int(getattr(screen, "y", 0) or 0)
            right = left + int(screen.width)
            bottom = top + int(screen.height)
        except Exception:
            continue
        if left <= px < right - 80 and top <= py < bottom - 80:
            return (px, py)
    return None


def _create_window(webview, api, width: int, height: int, pos=None, url=None):
    common = dict(
        title=_window_title(api),
        url=url or INDEX_FILE.as_uri(),
        js_api=api,
        width=width,
        height=height,
        min_size=_MIN_SIZE,
        background_color=BG_COLOR,
    )
    if pos is not None:
        common["x"], common["y"] = int(pos[0]), int(pos[1])
    try:
        return webview.create_window(
            frameless=True,
            easy_drag=False,
            **common,
        )
    except TypeError:
        common.pop("x", None)
        common.pop("y", None)
        return webview.create_window(frameless=True, easy_drag=False, **common)
    except Exception:
        return webview.create_window(**common)


def _window_title(api) -> str:
    try:
        profile = getattr(api, "profile", {}) or {}
        brand = str(profile.get("brand") or "").strip()
        name = str(profile.get("name") or "").strip()
        if brand and name and brand != name:
            title = f"{brand} — {name}"
        else:
            title = brand or name or "AT指令调试台"
        inst = paths.instance_name()
        if inst:
            title += f"（{inst}）"
        return title
    except Exception:
        return "AT指令调试台"
