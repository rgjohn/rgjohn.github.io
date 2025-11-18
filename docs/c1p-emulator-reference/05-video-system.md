5. Video System

This section describes the OSI C1P video hardware and how the PCjs emulator reproduces (and in some cases extends) that behavior.

5.1 Real OSI C1P Video Hardware
Display

32 columns × 32 rows

Uppercase-only character set (unless modified)

Memory-mapped display at $D000–$D3FF

No hardware scrolling

No graphics mode

Characters rendered directly from an on-board chargen ROM

Character Generator ROM

Contains 256 glyphs, arranged as:

16 rows × 16 columns of 8×8 pixel characters

The glyph index matches the low 8 bits of the value at each VRAM cell.

Video Timing

The 6545-derived video logic updates continuously

No double-buffering

CPU stores a byte into VRAM → the character on screen changes immediately

5.2 PCjs Video Emulation

PCjs uses a canvas-based renderer with a preloaded character generator image:

chargen1x.png

chargen2x.png

chargen4x.png (default, used by your emulator)

The emulator:

Loads one of the chargen PNGs

Slices it into 16×16 glyph tiles

Draws characters onto an offscreen canvas

Copies that onto the visible display at each refresh

PCjs simulates a simplified “VBlank”, typically ~60 FPS, but without real C1P timing.

5.3 VRAM Representation in PCjs

Internally, the VRAM area ($D000–$D3FF) lives inside the emulator’s single 64 KB RAM array:

ram.abMem[0xD000] → top-left character  
ram.abMem[0xD001] → row 0, column 1  
...
ram.abMem[0xD3FF] → bottom-right character

✔ Confirmed behavior (experimentally):

Writing directly to ram.abMem[...] immediately updates the on-screen display

The video device is hooked using:

addWriteNotify(0xD000, 0xD3FF, VideoDevice)


This means:

Writes modify RAM

…and also trigger the video device to redraw that cell

This matches real C1P behavior, but with cleaner abstraction.

5.4 VRAM Layout

Character offsets follow the real OSI C1P rules:

Base address: $D000
Offset      = row * 32 + column
Address     = $D000 + row*32 + column


Example:

Row 2, Col 8 → offset = 2*32 + 8 = 72 → address = $D048

This formula has been confirmed by direct VRAM pokes in the emulator.

5.5 Character Generator (Chargen) Handling

PCjs loads character data from external PNGs:

machines/osi/c1p/video/chargen4x.png


These PNGs must be:

16×16 characters

Each glyph exactly 8 pixels wide and 8 pixels high (scaled in the PNG)

Same ordering as original OSI ROM

✔ Drop-in Replacement (supported now)

You can replace any chargen*.png with a custom design, and PCjs will immediately use it.

✨ Planned:

Runtime character-set selector

Ability to hot-swap chargen tables without reloading the page

5.6 Rendering Behavior in PCjs (Technical Notes)
5.6.1 Update Cycle

PCjs's video component:

Tracks which VRAM address changed

Invalidates only those character cells

Redraws incrementally

This results in efficient rendering even on large canvases.

5.6.2 Scaling

The emulator scales each 8×8 glyph to:

1×

2×

4×

8×

depending on the PNG and rendering mode.

5.6.3 Palettes & Effects

PCjs uses the chargen PNG’s pixel values directly.
There is no palette manipulation.

5.7 VRAM Access Patterns (Useful for Developers)

The following actions update the display immediately:

ram.abMem[0xD000] = 0x48   // 'H'
ram.abMem[0xD001] = 0x49   // 'I'


PCjs also updates VRAM correctly when:

The running 6502 program writes a character

A debugger command is executed

The LOD loader (soon) injects monitor commands that modify video memory

5.8 Planned Tools and Extensions

These enhancements will be added through extensions (not PCjs core mods):

5.8.1 VRAM Dump Tool (Planned)

Dump VRAM as:

Hex

Characters

Markdown code block

JSON (for automated tools)

Useful for comparing screen output in regression tests.

5.8.2 Screenshot Extractor (Planned)

Grabs the front-buffer canvas

Generates PNG

Allows easy sharing with ChatGPT for visual debugging

Possible integration with GitHub Pages for archival

5.8.3 VRAM Watch Window (Idea)

A developer panel showing:

Current row/column map

Highlighting changed cells

Real-time updates

Would assist in debugging display logic and games.

5.9 Summary
Feature	Real C1P	PCjs Emulator
VRAM location	$D000–D3FF	Same (RAM-backed + write hooks)
VRAM size	1024 bytes	Same
Character ROM	On-board	PNG-based texture
Character layout	16×16 glyph tiles	Same
Updates	Immediate	Immediate + incremental redraw
Scrolling	None	None (matches hardware)
Chargen swap	Hardware mod	Drop-in PNG swap (now) + UI selection (planned)
