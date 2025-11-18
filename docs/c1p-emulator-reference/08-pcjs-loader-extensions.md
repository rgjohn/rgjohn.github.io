8. Custom PCjs Loader & UI Extensions

This section documents all custom enhancements added to the OSI C1P PCjs emulator.
These extensions are non-invasive, meaning they do not modify the PCjs core and exist entirely as external add-ons.

Current completed extensions include:

A dynamic .LOD file loader UI

Automatic DOM injection below the emulator

A multi-stage .LOD parser

Live RAM access and VRAM writing

Program preview window

Planned extensions include:

URL-based autoloading

Character set selector

VRAM tools

Memory inspector utilities

Custom API bindings

8.1 LOD Loader Extension (Completed Stage 1)

The OSI C1P uses a monitor with a line-oriented hex loader format known as .LOD files.

A typical example:

.0200/A9 41 8D 00 E0
.0200G


A .LOD file consists of:

A starting address (.XXXX/)

A series of raw bytes (hex pairs)

Optional multiple blocks (each beginning with .XXXX/)

A terminating .XXXXG to begin execution

✔ What has been implemented so far

A new file:

c1p_extensions_jw/machine_html_lod_loader.js


is automatically included by _includes/machine.html and provides:

UI Features (Completed)

A padded, styled box inserted directly under the emulator panel

A file picker for .lod / .txt files

A scrollable preview showing raw file text

Robust DOM-retry logic until the emulator loads

Works on:

/machines/osi/c1p/

/machines/osi/c1p/debugger/

Parser Features (Completed)

Phase 1 (done):

Normalizes CR, CRLF, LF

Removes blank lines

Detects valid loader lines

Passes them to Phase 2

Phase 2 (done):

Splits address from byte section

Validates hex formatting

Converts hex into byte arrays

Produces list of loader blocks:

[
  {
    "address": 512,
    "bytes": [0xA9, 0x41, 0x8D, 0x00, 0xE0]
  },
  ...
]

✔ RAM Write Test (Confirmed Working)

We verified:

ram.abMem[address] = value;


correctly updates RAM and the Video RAM region $D000–$D3FF.

HI printed correctly at top-left:

ram.abMem[0xD000] = 0x48; // H
ram.abMem[0xD001] = 0x49; // I

8.1.2 Load-to-RAM Button (Planned: Next Step)

The loader will receive a Load to RAM button, which will:

Parse .lod blocks

Use ram.abMem[...] = ... to write bytes directly

Display success/errors to the user

Future enhancement:

Auto-run if .XXXXG block was present

This will replicate OSI monitor loading without typing anything.

8.1.3 URL Loader (Planned)

Programs can also be auto-loaded via URL parameters:

?lod=/assets/demo/pong.lod&autoStart=1


Implementation plan:

Fetch .lod text via fetch()

Reuse same parser

Load into RAM

Auto-run if requested

8.2 Character Generator (chargen) Extensions
8.2.1 Drop-in Replacement Support (Already Works)

Users can replace:

chargen4x.png
chargen2x.png
chargen1x.png


with identical-sized PNGs to change the video font.

8.2.2 Runtime Selector (Planned)

Will allow switching chargen files at runtime.
Requires:

Rebasing video texture

Forcing a redraw

UI selector

8.3 Page Layout & Navigation Extensions (Planned)

A simplified layout will:

Remove large left-hand navigation

Keep only relevant OSI links in a new “utility menu”

Focus the page around the emulator

Not yet implemented.

8.4 VRAM Tools (Planned)

Tools to dump VRAM:

Hex dump

Character-grid dump

Markdown/text export

This will be invaluable for debugging video programs.

8.5 Screenshot Tool (Planned)

Will capture the video canvas and export PNG or Base64.

8.6 Memory & API Tools (Planned)

Proposed helper APIs:

machine.loadLOD(text)
machine.loadBytes(addr, array)
machine.dumpVRAM()
machine.screenshot()
machine.runAt(addr)


These will enable automated tooling and ChatGPT-assisted workflows.
