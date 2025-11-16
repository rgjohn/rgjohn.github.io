# 11. TODO & Roadmap

This roadmap tracks development of the enhanced OSI C1P PCjs environment, including tools, documentation, loader extensions, and UI improvements.

---

# 11.1 Completed
(TODO: Fill in as progress is made)

---

# 11.2 Immediate Tasks

## LOD Loader Extensions
- [ ] Create standalone `lod-loader.js` extension  
- [ ] Add **Load .LOD Program…** UI button  
- [ ] Implement CR-terminated line parsing  
- [ ] Inject loader lines into monitor via keyboard buffer  
- [ ] Recognize and execute `.XXXXG` automatically  
- [ ] Support `?lod=/path/file.lod&autoStart=true` URL parameters  

## Documentation Integration
- [ ] Add full reference manual to `/docs/c1p-emulator-reference/`  
- [ ] Begin populating key sections  
- [ ] Add cross-links between loader behavior and emulator architecture  

## Page Layout & Navigation Modifications
- [ ] Create custom layout without sidebar  
- [ ] Apply layout to C1P emulator & debugger pages  
- [ ] Move useful navigation items below emulator  
- [ ] Create “John’s 6502 Programs” section under OSI C1P Software  

---

# 11.3 Short-Term Enhancements

## VRAM & Display Tools
- [ ] Implement VRAM dump (full 32×32)  
- [ ] Add screenshot-export tool  
- [ ] Optional character-grid overlay for diagnostics  

## Character Generator Options
- [ ] Support drop-in PNG replacers (already possible)  
- [ ] Implement runtime chargen selector  
- [ ] Add preview tool showing the active chargen set  

## Memory & Debugging Tools
- [ ] Develop memory inspector panel  
- [ ] Add region dump tool (with address range inputs)  
- [ ] Add helper to run at arbitrary address  
- [ ] Explore debugger enhancements (stepping, breakpoints)  

---

# 11.4 Long-Term Goals

## Emulator Automation
- [ ] ChatGPT-assisted program upload  
- [ ] Automated test cycles  
- [ ] Side-by-side memory comparisons  
- [ ] Exportable log & trace system  
- [ ] Scriptable emulator API (“C1P Dev Console”)  

## Real Hardware Reference Manual (Volume 2)
- [ ] Consolidate original OSI docs  
- [ ] Clean badly-scanned PDFs  
- [ ] Establish authoritative specification set  
- [ ] Map ROM routines and monitor commands  
- [ ] Cross-verify behavior against PCjs and original hardware  

## Larger Enhancements
- [ ] Inline assembler tool  
- [ ] Symbol table viewer  
- [ ] Interactive disassembly window  
- [ ] Accurate cycle-timing mode (if feasible)  

---

# 11.5 Notes

This roadmap is a living document.  
It will be updated continuously as features are implemented, refined, or re-prioritized.
