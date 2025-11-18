# 5. Video System

## Real Hardware
- 32×32 text display
- Character codes map to chargen ROM
- Screen RAM begins at $D000
- No hardware scrolling

## PCjs Video Emulation
- canvas-based rendering
- scaled font texture (`chargen4x.png`)
- update occurs on VBlank simulation

## VRAM Layout
Row × Column mapping:
```
Base: $D000
Offset = row * 32 + column
```

## Planned Tools
- VRAM dump
- Screenshot extractor
