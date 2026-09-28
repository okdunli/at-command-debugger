from __future__ import annotations

import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent.parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from atcdbg.webui.app import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
