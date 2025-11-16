# 7. Monitor and Loader Behavior

## OSI Monitor Commands
- `.xxxx/bytes` — load bytes into memory
- `.xxxxG` — run program at address
- `.xxxxR` — examine memory
- etc.

## Loader Mechanics
- CR-terminated lines
- No LF
- ASCII hex bytes
- Address auto-increments

## PCjs Loader Behavior
- Accepts ASCII loader text
- Simulates keyboard input
- Loads memory through monitor, not directly
- Fully compatible with .LOD files

(TODO: add examples)
