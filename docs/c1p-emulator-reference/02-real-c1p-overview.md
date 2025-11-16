# 2. Real OSI C1P Hardware Overview

## CPU
- MOS Technology 6502  
- Clock speed: ~1 MHz  

## Memory
- Typical configurations:
  - 8 KB RAM
  - 16 KB RAM
  - Expansion options  
- ROM:
  - Monitor ROM at $F800–$FFFF  
  - Optional BASIC ROMs  

## Video
- 32×32 character display  
- Memory-mapped at $D000–$D3FF  
- Character generator ROM  
- Timings and quirks (to be expanded)

## Keyboard
- ASCII-style matrix keyboard  
- Polled by the monitor  
- Behavior quirks (Ghosting, repeat, etc.)

## Loader Format (.LOD files)
- Text-based hex format  
- Carriage-return (CR) terminated  
- Leading "." indicates loader directive  
- Slash introduces byte-load sequence  
- Example:
  ```
  .0200/A9 41 8D 00 E0
  .0200G
  ```

## References
(TODO: add consolidated specifications)
