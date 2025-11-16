# 8. Custom PCjs Loader & UI Extensions

This section documents the custom enhancements added to the OSI C1P PCjs emulator, including program loaders, UI improvements, character generator options, and page layout modifications.

---

# 8.1 LOD Loader Extension

The OSI C1P monitor supports a text-based hex load format called **.LOD files**, composed of:

- Carriage-return (CR) terminated lines  
- Loader directives beginning with `.`  
- Slash (`/`) specifying byte-loading sequences  
- A terminating `.XXXXG` to start program execution  

Example:
```
.0200/A9 41 8D 00 E0
.0200G
```

The PCjs C1P emulator already contains logic to simulate keyboard input and load bytes via the monitor.  
The LOD Loader implements **native .lod program loading** using this mechanism.

---

## 8.1.1 UI Button Loader

A new button will be added to the emulator interface:

```
Load .LOD Program…
```

### Features:

1. Opens a file picker allowing the user to choose a `.lod` file  
2. Reads the file contents as ASCII text  
3. Splits input on CR boundaries  
4. Feeds each loader line into the emulator’s monitor  
5. Detects `.XXXXG` and auto-executes if present  
6. Uses **no PCjs core modifications** — implemented as a clean extension  

---

## 8.1.2 URL Loader

Programs can also be loaded automatically via URL parameters:

```
?lod=/path/to/program.lod&autoStart=true
```

Behavior:

1. The `.lod` file is fetched from the provided path  
2. Loader text is parsed  
3. Each line is injected into the monitor  
4. If `autoStart=true`, execution begins automatically  

This mechanism parallels PCjs’s `autoMount` feature, but supports **pure .lod text** rather than JSON-based loaders.

---

# 8.2 Character Generator (chargen) Extensions

The OSI C1P character generator consists of a **16×16 table of 8×8 glyphs**.  
PCjs renders characters by slicing one of the following images:

- `chargen1x.png`
- `chargen2x.png`
- `chargen4x.png`

found in:

```
machines/osi/c1p/video/
```

---

## 8.2.1 Drop-In Replacement (Immediate Support)

Users may replace these PNGs with their own custom-designed character sets.

**Requirements:**

- Same pixel dimensions  
- Same 16×16 tile layout  
- Same ordering of glyphs  

PCjs will automatically use the new sets with no code changes.

This enables highly accurate visual reproduction of modified or upgraded C1P hardware.

---

## 8.2.2 Planned: Runtime Character Set Selector

A future UI feature will allow toggling between character sets *during runtime*:

```
Character Set:
   • OSI Original
   • John’s Custom Set A
   • John’s Custom Set B
   • Experimental Set
```

Needs:

- JS extension  
- Re-binding of chargen texture  
- Forced redraw of VRAM  

This allows rapid testing of multiple visualization styles.

---

# 8.3 Page Layout & Navigation Extensions

The standard PCjs site layout includes a large left-hand sidebar with extensive navigation.  
For a streamlined development-focused workflow, the C1P emulator pages will be customized.

---

## 8.3.1 Sidebar Removal (Custom Layout)

A new layout file (e.g., `c1p-custom.html`) will:

- Remove the entire left-hand navigation menu  
- Preserve existing page headings  
- Display the emulator as the main content focus  

This creates an application-like standalone emulator interface.

---

## 8.3.2 Relocated Useful Menu Items

Selected navigation items will be preserved and moved **below the emulator**:

### Hardware
- OSI → Challenger 1P  
- OSI → Challenger 1P with Debugger  

### Software
- OSI C1P → 6502 Programs  
- OSI C1P → BASIC Programs  
- OSI C1P → John’s 6502 Programs *(new category)*  

This creates a compact, relevant navigation area while removing clutter.

---

# 8.4 VRAM Dump & Screenshot Tools (Planned)

## 8.4.1 VRAM Dump
- Dumps $D000–$D3FF as  
  - Hex  
  - Character grid  
  - Markdown or text  
- Useful for debugging graphics and text programs.

## 8.4.2 Screenshot Tool
- Captures the video canvas  
- Exports as PNG or Base64  
- Enables ChatGPT-assisted debugging using screenshots  

---

# 8.5 Memory Tools (Planned)

Future planned features include:

- Memory region inspector to view bytes interactively  
- Direct byte injection for patching programs in RAM  
- Zero-page and stack visualization  
- Breakpoint manager (depending on emulator complexity)  

---

# 8.6 API Extensions (Planned)

Helper APIs will be exposed for developer use:

```javascript
machine.loadLOD(text);
machine.dumpVRAM();
machine.screenshot();
machine.loadBytes(address, bytes);
machine.runAt(address);
```

These will support:

- Automation  
- Batch testing  
- Integration with ChatGPT-guided workflows  

---

This section will expand as new extensions and tools are implemented.
