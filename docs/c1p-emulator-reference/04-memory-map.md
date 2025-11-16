# 4. Memory Map of OSI C1P and PCjs Emulator

## Real OSI C1P Memory Map
Address Range | Description
------------- | -----------
$0000–$00FF   | Zero page
$0100–$01FF   | 6502 stack
$0200–$BFFF   | User RAM (various configurations)
$C000–$CFFF   | I/O, unused, expansion
$D000–$D3FF   | Video RAM (32×32 characters)
$F800–$FFFF   | Monitor ROM

## PCjs Emulator Memory Map
- Mirrors the real hardware map  
- VRAM stored in a dedicated PCjs buffer  
- ROM loaded from hex files  
- Memory read/write implemented in JS  

(TODO: Add emulator-specific quirks)
