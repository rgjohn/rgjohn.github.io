# 3. PCjs C1P Emulator Architecture

## Directory Layout
- `/machines/osi/c1p/`
- `/machines/shared/`
- `/modules/` (legacy v2 runtime reconstruction)
- `_includes/`, `_layouts/` (Jekyll build system)

## Core Files
- `c1p.js` or `c1p-uncompiled.js` — main emulator behavior
- `system.hex` — OSI monitor ROM
- `basic-gcpatch.hex` — BASIC patch ROM
- `chargen4x.png` — character generator texture
- `machine.js`, `keyboard.js`, `panel.js` — PCjs core modules

## Initialization Sequence
1. Browser loads HTML wrapper  
2. PCjs loads configuration from embedded script block  
3. Machine class initializes:
   - CPU
   - Memory
   - Video
   - Keyboard
4. ROM images fetched asynchronously  
5. Video initialized  
6. Machine starts in reset state  

## Monitor Loader Behavior
- PCjs replicates typing hex loader input  
- Loader text is passed to the machine’s keyboard buffer  
- Monitor loads bytes directly into memory  

(TODO: Add more details after examining the PCjs API)
