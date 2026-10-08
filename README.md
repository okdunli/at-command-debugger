<div align="center">
<img alt="AT指令调试台" src="icon.svg" height="128">

<h1>AT Command Debugger</h1>

[![中文](https://img.shields.io/badge/中文-README-blue?style=for-the-badge&labelColor=000000)](README.zh-CN.md)
[![License](https://img.shields.io/badge/license-Apache--2.0-green?style=for-the-badge&labelColor=000000)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-58A6FF?style=for-the-badge&labelColor=000000)]()

</div>

A cross-platform (Windows / macOS / Linux) desktop host tool for exercising the AT command set of embedded modules — any AT-based firmware. Command sets are described by declarative JSON profiles, so switching modules never means changing code. It turns "open a serial terminal,
type commands by hand, squint at the replies" into a form-driven workflow: pick a scenario →
fill in the parameters → preview the command sequence → run it in one click → export the test report.

Tech stack: **Python + PyWebView (native WebView) + vanilla HTML/CSS/JS** —
one codebase, three desktop platforms; a `--browser` mode that runs in a plain browser is also included.

## Overview

Testing a module's AT firmware by hand means remembering the parameter ranges and ordering of dozens of commands…
Typing them one by one in a raw terminal is slow, error-prone, and leaves no proper record to look back on.

AT Command Debugger fills those gaps:

- a complete command library with parameter validation, examples and help;
- one-click scenario presets that emit a whole configuration sequence in the right order;
- runnable test suites (including negative cases and read-back verification) with exportable reports;
- a live serial terminal: colored TX/RX logs, HEX view, loop sending, auto-reply;
- a built-in device simulator, so the full workflow runs without any hardware;
- OEM profiles externalize the entire command set as JSON — adapting a new module means editing JSON, not Python.

---

## Features

| Module                | Description                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One-click presets     | 10 scenario templates (device health check / network provisioning / parameter configuration / message send-receive / factory reset …): fill in the form → preview the command sequence → run step by step or in one go                                                                                                                                                                                                 |
| Command library       | Declarative command reference: parameter validation (range / HEX / choice / regex), examples and help; invalid values are caught before they reach the serial port                                                                                                                                                                                                                                                     |
| Test suites           | 7 categories, 45 cases, including negative cases (wrong types, out-of-range values) and read-back verification (write, then read back and compare); runs can be partial, baselines can be saved and compared automatically on re-runs, results export to Markdown / CSV / HTML / JSON                                                                                                                                  |
| Error-code dictionary | Per-profile reply-code dictionary: when the terminal hits a known code it shows meaning, severity and suggested fix; editable (add / edit / delete / reorder) inside the app                                                                                                                                                                                                                                           |
| Custom buttons        | Frequently used commands become buttons: multi-command sequences, groups, colors and icons, `{variable}` placeholders filled at click time; persisted per profile, with import/export                                                                                                                                                                                                                                  |
| Serial terminal       | TX / RX / system-message coloring, timestamps, command history (arrow keys), text / HEX dual view, loop sending (timed resend, synchronized between desktop and browser clients), keyword auto-reply, multi-line bulk sending (`#` comments and WAIT supported), macro recording, RSSI signal trend chart, log bookmarks, byte counter reset; serial parameter changes take effect immediately (silent auto-reconnect) |
| Pin control           | DTR / RTS live toggles in the serial bar — diagnoses the classic "works in another tool, silent here" problem caused by pin levels at port open resetting the module or dropping it into the bootloader                                                                                                                                                                                                                |
| Device simulator      | Built-in device simulator (`SIM` port) implements command replies, message exchange and the event model; demos, development and automated tests all run without hardware                                                                                                                                                                                                                                               |
| Profiles (OEM)        | The complete "personality" of a module — brand text, command library, categories, presets, suites, default buttons, simulator behaviour — all in an external `profile.json`; switch from the title-bar dropdown and the app instantly becomes a dedicated tool for that module, without changing a line of code                                                                                                        |
| Test reports          | Suite runs export to Markdown / CSV / HTML / JSON; terminal logs export to file; configuration and button sets export/import as JSON packages                                                                                                                                                                                                                                                                          |
| Modern interface      | Frameless window with native drag / 8-way resize, geometry remembered across sessions, maximize fits the work area, window opacity and always-on-top toggles; dark / light themes, four preset accent colors + custom color, UI scale 85–115 %, splash and transition animations; presets / buttons / suites can be pinned to the home dashboard, profiles switchable in the title bar                                 |

---

## Getting started

### Requirements

| Item     | Requirement                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| OS       | Windows 10+ / macOS / Linux                                                                                           |
| Python   | 3.10 or newer                                                                                                         |
| GUI      | Windows: Edge WebView2 (preinstalled on Win 11); macOS: WebKit (built in); Linux: WebKitGTK (`libwebkit2gtk-4.0-dev`) |
| Hardware | none — the built-in simulator covers the full workflow; a USB-serial adapter plus the module for real tests           |

### Installation

```bash
cd at-command-debugger
pip install -r requirements.txt
python main.py               # desktop app
python main.py --browser --open   # browser mode
python main.py --selftest    # self-check (includes the simulator link)
```

On Windows you can simply double-click `run.bat`; for a Python-free single-file executable see "Packaging" below.

### Command-line options

| Option              | Description                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| *(none)*            | Start the desktop app (default)                                                                                |
| `--browser`         | No desktop window; serve the UI over local HTTP only                                                           |
| `--open`            | With `--browser`: open the system browser automatically                                                        |
| `--host` / `--port` | HTTP bind address / port (0 = auto) in browser mode                                                            |
| `--no-http`         | Desktop mode without the auxiliary HTTP service                                                                |
| `--debug`           | Open the WebView developer tools                                                                               |
| `--verbose`         | Verbose logging                                                                                                |
| `--selftest`        | Run the self-check and exit                                                                                    |
| `--instance NAME`   | Multi-instance mode: dedicated data directory and lock, so several windows can drive different modules at once |

### First run

1. Pick a serial port in the serial bar — or `SIM` for the built-in virtual device — set the baud rate to match your firmware, click **Connect**.
2. Open **Presets**, choose *Device health check*, fill in the form, preview, run.
3. Open **Suites**, tick a category, run it, export the report.

---

## Profiles (OEM mechanism)

**One profile = the complete "personality" of one module**: a single JSON file decides everything the app shows and sends. Two directories are merged, user directory winning on name clashes:

```
<app dir>/profiles/<id>/profile.json      built-in (external folder next to the executable, read-only)
<data dir>/profiles/<id>/profile.json     user-created / imported (writable)
```

A bundled example profile demonstrates every feature and makes a good starting point for new profiles.

Every field except `id` / `name` is optional and falls back to built-in defaults: `brand`, `subtitle`,
`icon`, `version`, `doc`, `categories`, `commands`, `error_codes`, `presets`, `quick_actions`,
`suites`, `buttons`, `device`, etc.

Parameter validation is a serializable declarative spec (`{"type":"range","low":0,"high":9}`,
`{"type":"hex","size":8}`, `{"type":"choice",...}`, `{"type":"any","of":[...]}`);
preset steps are templates with filter interpolation (`{token|key:8}`, `{text|hex}`,
`{x|default:5}`); conditional steps support
`when: "!debug" | "mode==1" | "a&&b" | "a||b"`.

Typical workflow: edit visually in Settings → Profiles (commands, presets, suites, error codes and home
pinning are all editable and reorderable inside the app), or take the JSON route — duplicate the built-in
*Example* profile → export → edit the JSON → import → verify →
drop the folder into the `profiles/` directory next to the executable (frozen builds read it externally; dev mode reads the project-root `profiles/`). Exported packages carry
`{"kind":"at-command-debugger-profile","format":1,...}`.

---

## Data directory

| Platform | Path                                         |
| -------- | -------------------------------------------- |
| Windows  | `%APPDATA%\AT指令调试台`                     |
| macOS    | `~/Library/Application Support/AT指令调试台` |
| Linux    | `~/.local/share/AT指令调试台`                |

Place a `portable.txt` next to the executable for portable mode (data directory follows the binary).

On first launch missing config files are generated automatically (incomplete `config.json` is topped up); if no profile exists, an example profile is generated automatically to keep the app usable out of the box.

| File / directory    | Contents                                                                |
| ------------------- | ----------------------------------------------------------------------- |
| `config.json`       | Full application configuration (serial, protocol, UI, window, behavior) |
| `profiles/<id>/`    | User profiles; `buttons.json` per profile (custom buttons)              |
| `history.json`      | Sent-command history                                                    |
| `export/`           | Reports and exported packages                                           |
| `logs/debugger.log` | Rolling application log                                                 |

Everything is plain JSON / text; delete it to return to defaults.

---

## FAQ

**Connected, but nothing is received or sent.**
Almost always wiring or module state, not the software. Check, in order: the port is the real USB-serial adapter (not an ACPI placeholder); TX↔RX are crossed and grounds are common; the module is powered and not held in reset; the baud rate matches the firmware; if the module was ever put into transparent mode, exit it with `+++` (no line ending, 1 s silence before and after) before sending `AT`. When the module returns zero bytes, the failed-send toast includes this checklist.

**The module resets or goes silent right after connecting.**
Some firmwares react to DTR/RTS levels at port open. Use the DTR / RTS toggles in the serial bar to flip the pin states after connecting.

**The profile dropdown disappeared.**
The picker is hidden when only one profile exists; create or import one in Settings → Profiles.

**Browser mode shows a connection error.**
Another instance may hold the HTTP port. Set a fixed one with `--port`, or give the instance its own data directory with `--instance`.

---

## Project structure

```
at-command-debugger/
├── main.py                  Entry point
├── run.bat                  Windows launcher
├── build.py / atcdbg.spec   PyInstaller packaging (three platform scripts)
├── requirements.txt
├── profiles/                Profiles directory (includes the example profile)
└── atcdbg/
    ├── core/                UI-independent core logic
    │   ├── serial_mgr.py    Serial port, event queue, DTR/RTS
    │   ├── runner.py        Command / sequence execution engine
    │   ├── protocol.py      Frame parsing, OK/ERROR/EVENT classification
    │   ├── commands.py      Command library + profile loading
    │   ├── presets.py       Scenario templates + interpolation
    │   ├── suites.py        Test-suite engine
    │   ├── buttons.py       Custom button persistence
    │   ├── device_sim.py    Device simulator
    │   ├── profiles.py      Profile discovery, merge, import/export
    │   ├── validators.py    Declarative parameter validation
    │   ├── exporter.py      Report generation (md/csv/html/json)
    │   ├── config.py        Config schema and autosave
    │   ├── paths.py         Data directories, logging
    │   └── winnative.py     Win32 drag / resize / system menu
    └── webui/
       ├── app.py           Window lifecycle, HTTP service
       ├── backend.py       JS↔Python bridge (single invoke dispatcher)
       └── ui/              HTML / CSS / JS front end
```

Common customizations:

- **Support another module**: duplicate and edit a profile JSON — commands, presets, suites, buttons and the simulator's reply table are all data. No Python required.
- **Add a backend call**: add a public method to `webui/backend.py`; the front end reaches it through the single `invoke` dispatcher.
- **Modify the front end**: `webui/ui/`; relaunch after editing (no hot reload).
- **Verify an environment**: `python main.py --selftest` exercises the command library, suites, simulator link and paths without opening a window.

## Packaging

```bash
build_windows.bat     # Windows
bash build_mac.sh     # macOS
bash build_linux.sh   # Linux (requires WebKitGTK, see script notes)
```

The result is a **single-file executable**: `dist/AT指令调试台.exe` (macOS / Linux: `dist/AT指令调试台`), freely movable and distributable — no Python required. Notes:

- PyInstaller builds for the OS it runs on only; cross-compilation is not possible
- The single-file build extracts to a temp dir on first launch, so startup is a bit slower
- **Profiles are external**: no profiles are packed into the executable — after building, a copy of `profiles/` is placed in `dist/`, and the app reads profiles from that sibling folder; if no profile exists, an example profile is generated automatically on first launch; add or remove profiles by editing the folder, no rebuild needed
- Icons are used as-is from the `assets/` folder (`icon.png` / `icon_256.png` / `icon.ico`) and bundled verbatim; to change the icon, just replace the files in that folder — no generation step involved

A GitHub Actions workflow (`.github/workflows/build.yml`) builds all three platforms and uploads the artifacts — trigger it manually from the Actions tab or by pushing a `v*` tag.

## License

[Apache License 2.0](LICENSE)
