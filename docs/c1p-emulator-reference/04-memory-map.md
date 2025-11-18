4. Memory Map of OSI C1P and PCjs Emulator

This section compares the real hardware memory layout of the 1978 OSI Challenger 1P (Superboard II) with the PCjs software emulation, noting all known differences and emulator-specific behaviors.

4.1 Real OSI C1P Memory Map
Address Range	Description
$0000–$00FF	Zero Page
$0100–$01FF	6502 Hardware Stack
$0200–$BFFF	User RAM (4–8 KB standard, up to 32 KB in expansions)
$C000–$CFFF	I/O Region / Expansion / Unused (varies by board revision)
$D000–$D3FF	Video RAM (32×32 = 1024 characters)
$D400–$D7FF	Unused / Expansion
$D800–$DFFF	Keyboard, Serial I/O, Port Bits
$F000–$F7FF	Expansion ROM / Unused
$F800–$FFFF	Monitor ROM (“OSI ROM BASIC / Monitor”)

Notes:

VRAM is contiguous: 1024 bytes starting at $D000

The monitor starts at $F800 and entry point is usually $FF00

Writes to ROM addresses are ignored by hardware

4.2 PCjs Emulator Memory Map (Confirmed)

The PCjs emulator mirrors the structure of the real hardware but with important differences in implementation.

✔ 4.2.1 Unified 64K RAM Buffer

We discovered that the C1PRAM component allocates a full 64 KB RAM array, regardless of the physical C1P model:

let ram = PCjs.components.find(c => c.id === "c1p8k-debugger.ram8K");
ram.abMem  // Uint8Array(65536)


Even in an “8 KB RAM” configuration, the emulator exposes:

A 64 KB contiguous memory array

ROM areas overlaid by read hooks that intercept reads

Write notifications used to emulate hardware restrictions

✔ 4.2.2 Video RAM Mapping (Working)

Writes to:

ram.abMem[0xD000] → top-left character  
ram.abMem[0xD001] → row 0, column 1  
...
ram.abMem[0xD0A0] → row 2, col 0


match the real C1P display exactly.

✔ 4.2.3 ROM Regions

PCjs loads ROM images into internal “ROM device” components:

BASIC ROM (romBASIC)

System ROM (romSystem)

Null filler ROM (romNull)

These are not stored in RAM, but PCjs intercepts reads via:

addReadNotify()


so CPU reads return ROM data.

Writes to these addresses are intercepted and ignored, just like hardware.

4.3 PCjs Memory Behavior Details
✔ 4.3.1 Read Notify Handlers

PCjs binds ROM and device reads like this:

addReadNotify(0xF800, 0xFFFF, romSystem)
addReadNotify(0xDE00, 0xDE00, video)
addReadNotify(0xDF00, 0xDFFF, keyboard)


This ensures:

RAM still exists at those addresses in abMem

But reads go to the device handler instead

And writes can be optionally blocked or forwarded

This differs from real hardware but produces the same external behavior.

✔ 4.3.2 Write Notify Handlers

VRAM, keyboard buffer, and serial port registers are managed via:

addWriteNotify(start, end, device)


We saw:

c1p8k-debugger.cpu6502: addWriteNotify(0xD000–0xD3FF, video)


This means:

Writing into RAM in these ranges triggers device behavior

The raw RAM also changes (which helps inspection tools)

PCjs video redraws automatically when VRAM changes

✔ 4.3.3 RAM Component Type

The main RAM component is always:

C1PRAM


Regardless of the name (e.g., ram8K), it always produces:

abMem: 65536-byte storage

setBuffer(...): low-level initializer

parms.addr = starting address (normally 0)

parms.size = configured RAM size (8192 bytes for 8K model)

PCjs does not restrict reading or writing outside the configured RAM size — this differs from hardware but is convenient for developers.

4.4 Emulator vs Hardware Memory Differences (Important)
✔ Emulator has full 64K RAM buffer

Hardware had actual RAM chips of:

4K

8K

Expanded versions with 32K total

✔ Emulator always allows writing to any address

Hardware only had RAM where chips physically existed.

✔ ROM reads are intercepted by PCjs, not stored in RAM

This matches hardware behavior externally.

✔ Emulator VRAM is not a separate chip

It is an overlay on top of the main memory with device read/write hooks.

✔ Emulator does not currently simulate bus noise or chip timing

Reads and writes are instantaneous.

4.5 Summary Table
Area	Real OSI C1P	PCjs Emulator
Zero Page	$0000–00FF	Same
Stack	$0100–01FF	Same
User RAM	Typically 4–32K	Full 64K array exposed
ROM	$F800–FFFF	Intercepted reads via notify handlers
VRAM	$D000–D3FF	Writes intercepted + stored in RAM
I/O Ports	$DF00–DFFF	Device handlers
Unmapped areas	Floating bus / undefined	Always return RAM or handler data
