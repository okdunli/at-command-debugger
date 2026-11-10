from __future__ import annotations

import ctypes
import sys
import time

WM_NCLBUTTONDOWN = 0x00A1
WM_NCRBUTTONUP = 0x00A5
WM_SYSCOMMAND = 0x0112
HTCAPTION = 2
SC_MAXIMIZE = 0xF030
SC_RESTORE = 0xF120
SC_MINIMIZE = 0xF020
SC_CLOSE = 0xF060
SC_MOUSEMENU = 0xF090
SC_SIZE = 0xF000

SWP_NOSIZE = 0x0001
SWP_NOZORDER = 0x0004
SWP_NOACTIVATE = 0x0010
SWP_ASYNCWINDOWPOS = 0x4000
_SWP_DRAG = (SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_ASYNCWINDOWPOS)

VK_LBUTTON = 0x01

def available() -> bool:
    return sys.platform == "win32"

def _owns_hwnd(hwnd: int) -> bool:
    """句柄必须属于当前进程——防止误操作资源管理器等外部窗口。"""
    if not hwnd:
        return False
    try:
        u32 = _u32()
        pid = ctypes.c_ulong()
        _bind(u32.GetWindowThreadProcessId,
              [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)], ctypes.c_ulong)
        u32.GetWindowThreadProcessId(ctypes.c_void_p(hwnd), ctypes.byref(pid))
        return pid.value == int(__import__("os").getpid())
    except Exception:
        return False


def _hwnd(window) -> int:

    handle = getattr(window, "_win_hwnd", None)
    if handle:
        return int(handle)

    native = getattr(window, "native", None)
    if native is not None:
        try:
            return int(native.Handle.ToInt32())
        except Exception:
            pass

    try:
        from webview.platforms.winforms import BrowserView  # type: ignore
        view = BrowserView.instances.get(getattr(window, "uid", "master"))
        if view is not None:
            return int(view.Handle.ToInt32())
    except Exception:
        pass
    # 绝不回退到 GetForegroundWindow()：拿不到本窗口句柄时前台可能是
    # 资源管理器/别的程序，SetWindowPos 会把【别人的窗口】缩放（用户实测到）。
    return 0

def attach(window, retries: int = 20, delay: float = 0.15) -> bool:
    if not available():
        return False
    handle = 0
    for _ in range(max(1, retries)):
        handle = _hwnd(window)
        if handle:
            break
        time.sleep(delay)
    if handle:
        try:
            window._win_hwnd = handle
        except Exception:
            pass
        return True
    return False

def _u32():
    return ctypes.windll.user32

def _send(hwnd: int, msg: int, wparam: int, lparam: int = 0) -> bool:
    try:
        _u32().SendMessageW(hwnd, msg, wparam, lparam)
        return True
    except Exception:
        return False

def _bind(func, argtypes, restype=None):
    func.argtypes = argtypes
    func.restype = restype

def _cursor() -> tuple[int, int]:
    from ctypes import byref, wintypes
    point = wintypes.POINT()
    if not _u32().GetCursorPos(byref(point)):
        return (0, 0)
    return (int(point.x), int(point.y))

def _window_origin(hwnd: int) -> tuple[int, int]:
    from ctypes import byref, wintypes
    rect = wintypes.RECT()
    if not _u32().GetWindowRect(hwnd, byref(rect)):
        return (0, 0)
    return (int(rect.left), int(rect.top))

def logical_geometry(window) -> dict | None:
    """Window geometry in *logical* pixels.

    pywebview's resize() takes logical pixels while WinForms reports Width/
    Height in physical pixels, so reading window.width directly and feeding it
    back into resize() drifts by the monitor scale factor (1.09375 on a 105 DPI
    display) on every round trip — that is what made edge-resize run away.
    platform.get_size()/get_position() do the division for us.
    """
    try:
        from webview.platforms import winforms  # type: ignore
        uid = getattr(window, "uid", "master")
        size = winforms.get_size(uid)
        pos = winforms.get_position(uid)
        if not size or not pos:
            return None
        return {"x": int(pos[0]), "y": int(pos[1]),
                "width": int(size[0]), "height": int(size[1])}
    except Exception:
        return None

def work_area_physical(window) -> dict | None:
    """Monitor work area (excludes the taskbar) in *physical* pixels — the same
    coordinate space as GetWindowRect / SetWindowPos. A borderless (frameless)
    window that is OS-maximized fills the whole monitor including the taskbar,
    so we size it to the work area instead to keep the taskbar visible."""
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return None
    u32 = _u32()
    try:
        _bind(u32.MonitorFromWindow,
              [ctypes.c_void_p, ctypes.c_uint], ctypes.c_void_p)
        _bind(u32.GetMonitorInfoW,
              [ctypes.c_void_p, ctypes.c_void_p], ctypes.c_int)
    except Exception:
        pass
    try:
        class MONITORINFO(ctypes.Structure):
            _fields_ = [("cbSize", ctypes.c_ulong),
                        ("rcMonitor", ctypes.c_int * 4),
                        ("rcWork", ctypes.c_int * 4),
                        ("dwFlags", ctypes.c_ulong)]
        hmon = u32.MonitorFromWindow(hwnd, 2)  # MONITOR_DEFAULTTONEAREST
        if not hmon:
            return None
        mi = MONITORINFO()
        mi.cbSize = ctypes.sizeof(MONITORINFO)
        if not u32.GetMonitorInfoW(hmon, ctypes.byref(mi)):
            return None
        rl, rt, rr_, rb = mi.rcWork
        return {"x": int(rl), "y": int(rt),
                "width": int(rr_ - rl), "height": int(rb - rt)}
    except Exception:
        return None

def set_rect_physical(window, x: int, y: int, w: int, h: int) -> bool:
    """Set the window bounds in physical pixels (same space as work_area_physical)."""
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    u32 = _u32()
    try:
        _bind(u32.SetWindowPos,
              [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int,
               ctypes.c_int, ctypes.c_int, ctypes.c_uint], ctypes.c_int)
    except Exception:
        pass
    try:
        flags = 0x0004 | 0x0010  # SWP_NOZORDER | SWP_NOACTIVATE
        return bool(u32.SetWindowPos(hwnd, 0, int(x), int(y),
                                    int(w), int(h), flags))
    except Exception:
        return False

def dpi_scale(window) -> float:
    """Win32 窗口的 DPI 缩放系数（物理像素 / 逻辑像素）。"""
    if not available():
        return 1.0
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return 1.0
    try:
        u32 = _u32()
        dpi = None
        try:
            fn = getattr(u32, "GetDpiForWindow", None)
            if fn is not None and hwnd:
                _bind(fn, [ctypes.c_void_p], ctypes.c_uint)
                dpi = int(fn(ctypes.c_void_p(hwnd)))
        except Exception:
            dpi = None
        if not dpi:
            fn = getattr(u32, "GetDpiForSystem", None)
            if fn is not None:
                dpi = int(fn())
        if dpi and dpi > 0:
            return float(dpi) / 96.0
    except Exception:
        pass
    return 1.0


def is_maximized(window) -> bool:
    """窗口当前是否处于系统最大化（IsZoomed），比后端的 _maximized 标志可靠。"""
    if not available():
        return False
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    try:
        u32 = _u32()
        _bind(u32.IsZoomed, [ctypes.c_void_p], ctypes.c_int)
        return bool(u32.IsZoomed(ctypes.c_void_p(hwnd)))
    except Exception:
        return False


def resize_physical(window, w: int, h: int, fix_point: str = "se") -> bool:
    """按窗口边缘方向改尺寸（物理像素），完全绕过 pywebview 的 resize。

    pywebview 的 Window.resize 在 WinForms 上有时被 @_shown_call 拦下、
    或在最大化样式未摘时 SetWindowPos 被系统忽略——表现为 Windows 拖边
    完全无反应。这里直接读 GetWindowRect、按 fix_point 算好新位置、
    一次 SetWindowPos 完成，与 drag_loop 用同一套可靠路径。
    """
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    u32 = _u32()
    try:
        _bind(u32.GetWindowRect, [ctypes.c_void_p, ctypes.c_void_p], ctypes.c_int)
        _bind(u32.SetWindowPos,
              [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int,
               ctypes.c_int, ctypes.c_int, ctypes.c_uint], ctypes.c_int)
    except Exception:
        pass

    class RECT(ctypes.Structure):
        _fields_ = [("left", ctypes.c_long), ("top", ctypes.c_long),
                    ("right", ctypes.c_long), ("bottom", ctypes.c_long)]

    try:
        r = RECT()
        if not u32.GetWindowRect(hwnd, ctypes.byref(r)):
            return False
        old_w, old_h = r.right - r.left, r.bottom - r.top
        x, y = r.left, r.top
        d = str(fix_point or "se").lower()
        # fix_point 表示「拖动的是哪条边」：固定对面那条边不动。
        if "w" in d:
            x = r.right - w
        if "n" in d:
            y = r.bottom - h
        flags = 0x0004 | 0x0010  # SWP_NOZORDER | SWP_NOACTIVATE
        ok = bool(u32.SetWindowPos(hwnd, 0, int(x), int(y),
                                   int(w), int(h), flags))
        if not ok:
            # 兜底：只改尺寸（SWP_NOMOVE），至少让尺寸变化生效
            ok = bool(u32.SetWindowPos(hwnd, 0, 0, 0, int(w), int(h),
                                       0x0002 | 0x0004 | 0x0010))
        return ok
    except Exception:
        return False


def drag_loop(target, timeout: float = 60.0, interval: float = 0.008) -> bool:
    """Frame-based move: track the cursor and reposition the window until the
    left button is released. The modal DefWindowProc move loop
    (WM_NCLBUTTONDOWN/HTCAPTION) cannot be used here because pywebview runs every
    js_api call on a worker thread and a frameless window has no WS_CAPTION, so
    the loop never picks up the real mouse capture. Polling GetCursorPos +
    SetWindowPos is deterministic and DPI-safe (both are physical pixels).
    """
    hwnd = int(target) if isinstance(target, int) else _hwnd(target)
    if not hwnd or not available():
        return False
    from ctypes import c_int, wintypes
    u32 = _u32()
    try:
        _bind(u32.GetCursorPos, [ctypes.POINTER(wintypes.POINT)], wintypes.BOOL)
        _bind(u32.GetWindowRect,
              [wintypes.HWND, ctypes.POINTER(wintypes.RECT)], wintypes.BOOL)
        _bind(u32.SetWindowPos,
              [wintypes.HWND, wintypes.HWND, c_int, c_int, c_int, c_int,
               ctypes.c_uint], wintypes.BOOL)
        _bind(u32.GetAsyncKeyState, [c_int], ctypes.c_short)
        _bind(u32.IsWindow, [wintypes.HWND], wintypes.BOOL)
    except Exception:
        pass

    anchor = _cursor()
    origin = _window_origin(hwnd)
    deadline = time.time() + max(1.0, timeout)
    while time.time() < deadline:
        try:
            if not u32.IsWindow(hwnd):
                break
            if not (u32.GetAsyncKeyState(VK_LBUTTON) & 0x8000):
                break
        except Exception:
            break
        x, y = _cursor()
        dx, dy = x - anchor[0], y - anchor[1]
        if dx or dy:
            try:
                u32.SetWindowPos(hwnd, 0, origin[0] + dx, origin[1] + dy,
                                 0, 0, _SWP_DRAG)
            except Exception:
                break
        time.sleep(interval)
    return True

def show_system_menu(window) -> bool:
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    try:
        _u32().SetForegroundWindow(hwnd)
    except Exception:
        pass
    return _send(hwnd, WM_NCRBUTTONUP, HTCAPTION)

def system_command(window, command: str) -> bool:
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    code = {
        "minimize": SC_MINIMIZE,
        "maximize": SC_MAXIMIZE,
        "restore": SC_RESTORE,
        "close": SC_CLOSE,
        "menu": SC_MOUSEMENU,
        "size": SC_SIZE,
    }.get(str(command or "").lower())
    if code is None:
        return False
    return _send(hwnd, WM_SYSCOMMAND, code)

def set_maximized_corners(window, maximized: bool) -> bool:
    """最大化时关掉 DWM 圆角（Windows 11 无边框窗口放大后仍会有圆角）。"""
    if not available():
        return False
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    try:
        from ctypes import byref, c_int, windll
        pref = c_int(0 if maximized else 2)  # DWMWCP_DONOTROUND / DWMWCP_ROUND
        windll.dwmapi.DwmSetWindowAttribute(hwnd, 33, byref(pref), 4)
        return True
    except Exception:
        return False


def enable_rounded_corners(window) -> bool:
    if not available():
        return False
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    try:
        from ctypes import byref, c_int, windll
        value = c_int(1)
        windll.dwmapi.DwmSetWindowAttribute(hwnd, 20, byref(value), 4)
        corners = c_int(2)
        windll.dwmapi.DwmSetWindowAttribute(hwnd, 33, byref(corners), 4)
        return True
    except Exception:
        return False

_GWL_EXSTYLE = -20
_WS_EX_LAYERED = 0x00080000
_LWA_ALPHA = 0x02

_HWND_TOPMOST = -1
_HWND_NOTOPMOST = -2
SWP_NOSIZE = 0x0001
SWP_NOMOVE = 0x0002
SWP_NOACTIVATE = 0x0010

def set_topmost(window, on: bool) -> bool:
    if not available():
        return False
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    u32 = _u32()
    try:
        _bind(u32.SetWindowPos,
              [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int,
               ctypes.c_int, ctypes.c_int, ctypes.c_uint], ctypes.c_int)
    except Exception:
        pass
    try:
        after = _HWND_TOPMOST if on else _HWND_NOTOPMOST
        flags = SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
        return bool(u32.SetWindowPos(hwnd, after, 0, 0, 0, 0, flags))
    except Exception:
        return False

def set_opacity(window, percent) -> bool:
    if not available():
        return False
    hwnd = _hwnd(window)
    if not _owns_hwnd(hwnd):
        return False
    try:
        alpha_pct = max(40, min(100, int(round(float(percent)))))
    except (TypeError, ValueError):
        return False
    u32 = _u32()
    try:
        get_style = getattr(u32, "GetWindowLongPtrW", None) or u32.GetWindowLongW
        set_style = getattr(u32, "SetWindowLongPtrW", None) or u32.SetWindowLongW
        _bind(get_style, [ctypes.c_void_p, ctypes.c_int], ctypes.c_long)
        _bind(set_style, [ctypes.c_void_p, ctypes.c_int, ctypes.c_long],
              ctypes.c_long)
        _bind(u32.SetLayeredWindowAttributes,
              [ctypes.c_void_p, ctypes.c_uint, ctypes.c_ubyte, ctypes.c_uint],
              ctypes.c_int)
    except Exception:
        pass
    try:
        exstyle = int(get_style(hwnd, _GWL_EXSTYLE))
        if alpha_pct >= 100:
            u32.SetLayeredWindowAttributes(hwnd, 0, 255, _LWA_ALPHA)
            if exstyle & _WS_EX_LAYERED:
                set_style(hwnd, _GWL_EXSTYLE, exstyle & ~_WS_EX_LAYERED)
            return True
        if not (exstyle & _WS_EX_LAYERED):
            set_style(hwnd, _GWL_EXSTYLE, exstyle | _WS_EX_LAYERED)
        alpha = int(round(255 * alpha_pct / 100))
        return bool(u32.SetLayeredWindowAttributes(hwnd, 0, alpha, _LWA_ALPHA))
    except Exception:
        return False
