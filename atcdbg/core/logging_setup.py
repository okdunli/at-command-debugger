from __future__ import annotations

import logging
import sys
from logging.handlers import RotatingFileHandler

from . import paths

_CONFIGURED = False


def setup(verbose: bool = False) -> logging.Logger:
    global _CONFIGURED
    level = logging.DEBUG if verbose else logging.INFO
    root = logging.getLogger("atcdbg")
    if _CONFIGURED:
        root.setLevel(level)
        return root
    root.setLevel(level)
    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S")

    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(fmt)
    root.addHandler(stream)

    try:
        file_handler = RotatingFileHandler(
            paths.log_file(), maxBytes=1024 * 512, backupCount=3,
            encoding="utf-8")
        file_handler.setFormatter(fmt)
        root.addHandler(file_handler)
    except Exception:
        pass

    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    _CONFIGURED = True
    return root
