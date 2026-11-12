"""配置集串口默认值必须生效，但不能覆盖用户手动设置的参数。"""
from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from atcdbg.core.config import DEFAULTS, merge_profile_defaults

PROFILE = {
    "serial_defaults": {
        "baudrate": 115200,
        "bytesize": 8,
        "parity": "N",
        "stopbits": 1,
        "flowcontrol": "none",
        "timeout": 1.0,
        "dtr": "off",
        "rts": "off",
        "auto_reconnect": False,
    },
    "protocol_defaults": {"line_ending": "CRLF"},
}


class TestProfileDefaults(unittest.TestCase):
    def test_fresh_config_gets_profile_baudrate(self):
        cfg = copy.deepcopy(DEFAULTS)
        merge_profile_defaults(cfg, PROFILE)
        self.assertEqual(cfg["serial"]["baudrate"], 115200)

    def test_user_baudrate_is_preserved(self):
        cfg = copy.deepcopy(DEFAULTS)
        cfg["serial"]["baudrate"] = 921600
        merge_profile_defaults(cfg, PROFILE)
        self.assertEqual(cfg["serial"]["baudrate"], 921600)

    def test_user_protocol_is_preserved(self):
        cfg = copy.deepcopy(DEFAULTS)
        cfg["protocol"]["line_ending"] = "LF"
        merge_profile_defaults(cfg, PROFILE)
        self.assertEqual(cfg["protocol"]["line_ending"], "LF")

    def test_unknown_keys_are_ignored(self):
        cfg = copy.deepcopy(DEFAULTS)
        merge_profile_defaults(cfg, {"serial_defaults": {"nonsense": 1}})
        self.assertNotIn("nonsense", cfg["serial"])

    def test_real_example_profile(self):
        root = Path(__file__).resolve().parents[1]
        profile = json.loads(
            (root / "profiles" / "example" / "profile.json").read_text("utf-8"))
        cfg = copy.deepcopy(DEFAULTS)
        merge_profile_defaults(cfg, profile)
        self.assertEqual(cfg["serial"]["baudrate"], 115200)

    def test_ascii_rx_decodes_correctly(self):
        """正确字节流能正常解码：乱码来自串口参数，不在解码路径。"""
        from atcdbg.core.serial_mgr import SerialManager
        mgr = object.__new__(SerialManager)
        captured = []
        mgr._push = captured.append
        for line in (b"################################################\r\n",
                     b"arch             : Ai-SG01\r\n",
                     b"Configuration loaded from Flash\r\n"):
            mgr._push_line(line)
        self.assertEqual([e["text"] for e in captured], [
            "################################################",
            "arch             : Ai-SG01",
            "Configuration loaded from Flash",
        ])


if __name__ == "__main__":
    unittest.main()
