 7. Monitor and Loader Behavior

This section documents the behavior of the original OSI C1P monitor ROM (the “boot monitor”), how `.LOD` loader files work, and how the PCjs C1P emulator processes loader text — both internally and via custom extensions.

---

# 7.1 Overview of the OSI C1P Monitor

The OSI monitor occupies the top 2 KB of memory:

$F800–$FFFF

yaml
Copy code

It provides:

- Hex input and display routines  
- Memory examine/modify commands  
- A simple text-based program loader  
- Optional entry points for BASIC and system utilities  

The monitor interface mimics a primitive command shell, using ASCII characters typed from the keyboard.

---

# 7.2 OSI Monitor Commands

The C1P monitor uses commands beginning with a **dot** (`.`).  
The most important commands include:

### **Load Bytes**
.xxxx/BB BB BB BB ...

markdown
Copy code
- Loads bytes starting at address `xxxx`  
- Bytes must be ASCII hex (00–FF)  
- Address auto-increments after each byte  
- A new `.xxxx/` line resets the load address  

### **Go (Execute)**
.xxxxG

markdown
Copy code
- Sets the program counter to `xxxx`  
- Starts program execution  

### **Read / Examine**
.xxxxR

markdown
Copy code
- Displays bytes starting at address `xxxx`  
- Typically shows 8–16 bytes per line depending on monitor version  

### **Modify**
.xxxx BB

markdown
Copy code
- Writes byte `BB` to address `xxxx`  
- Useful for patching small areas  

### **Break to Monitor**
Pressing:
CTRL-C

markdown
Copy code
returns execution to the monitor.

---

# 7.3 Loader File Format (.LOD)

`.LOD` files are plain ASCII text containing monitor commands.

### Key properties:

- Lines are **terminated by Carriage Return** (`CR`, ASCII 0x0D)
- Lines **must NOT include Line Feed** (`LF`, ASCII 0x0A)
- Hex bytes must be space-separated
- Loader commands always begin with `.`
- Loader usually ends with a `G` command:

.0200 G

shell
Copy code

### Example LOD program

.0200/A9 41 8D 00 D0
.0200G

yaml
Copy code

This loads a single-byte program that writes the letter "A" to VRAM location `$D000`, then starts execution.

---

# 7.4 LOD File Structure

A typical `.lod` file includes:

1. **Load block(s)**  
2. Optional **additional load blocks**  
3. Optional **jump (`G`) command**

Example with multiple blocks:

.0200/A9 30 A2 00
.0300/8D 10 D0
.0200G

yaml
Copy code

The loader respects block boundaries and resets load addresses as required.

---

# 7.5 Loader Mechanics Inside the Real OSI Monitor

The C1P monitor implements loader behavior as follows:

- A line is read until `CR`
- If the line begins with `.`, the monitor parses:
  - 4 hex digits → address
  - `/` → begin loading bytes
  - `G` → jump to address
- Each byte is written to the 6502 address bus
- After each byte, the address increments
- Execution of `.xxxxG` modifies the PC and begins running

### Important Detail:
The monitor cannot handle LF (`0x0A`).  
Lines ending in LF will break loading unless pre-processed.

---

# 7.6 PCjs Loader Behavior (Built-In)

PCjs includes a “keyboard simulation” system that can feed characters to the monitor as if typed manually.

The built-in PCjs loader:

- Accepts ASCII text
- Splits text into CR-delimited lines
- Feeds each line to the simulated keyboard
- The monitor handles all parsing and byte writes
- RAM is modified indirectly via the monitor’s routines

### Result:

PCjs loading behavior matches real hardware behavior extremely closely.

---

# 7.7 PCjs Loading Quirks & Details

PCjs does not modify memory directly during loader operations.

Instead:

- Keyboard input is simulated character-by-character
- The monitor ROM interprets commands
- Writes occur via monitor code
- Timing is preserved enough for correctness

This makes the emulator highly faithful for loader-based workflows.

---

# 7.8 Custom Loader Extension (Native .LOD Parsing)

A **custom loader extension** has been implemented to allow `.lod` files to be parsed by JavaScript and loaded directly into RAM without keyboard simulation.

This extension:

- Reads `.lod` text directly
- Splits lines on CR or CR/LF
- Identifies `.XXXX/` load blocks
- Converts ASCII hex bytes to integers
- Writes bytes to `ram.abMem[address]`
- Detects `.XXXXG` and determines run address

This loader operates entirely outside PCjs core code.

---

# 7.9 Loading Strategy Comparison

| Approach | Description | Pros | Cons |
|---------|-------------|------|------|
| **Monitor-based (PCjs built-in)** | Feed text into monitor via keyboard | 100% authentic, slow but accurate | Requires timing delays for large files |
| **Native .LOD loader (extension)** | Direct write to RAM using JS | Instant, reliable, easy for large files | Bypasses monitor; slightly less authentic |
| **URL auto-loader (extension)** | Load `.lod` file from URL | Automation, reproducible setups | Same auth/inauth tradeoffs as above |

Both systems coexist cleanly.

---

# 7.10 Execution Behavior (.XXXXG)

When encountering a line of the form:

.0200G

markdown
Copy code

The extension records:

- `executionAddress = 0x0200`

If the user presses:

LOAD TO RAM

yaml
Copy code

and if the “Auto-Start” option exists (planned), the emulator will:

1. Set the program counter to the address
2. Run the emulator from that point

This will use the PCjs debugger if active.

---

# 7.11 Examples

### Minimal Program Example

.0200/A9 41
.0200G

makefile
Copy code

Loads:

A9 41 → LDA #$41

yaml
Copy code

and jumps to 0200.

---

### Multi-block Example

.0200/A9 01 A2 00
.0300/8D 00 D0
.0200G

yaml
Copy code

Loads code into two different areas and jumps back to the start.

---

# 7.12 Planned Additions

- Monitor command injection API (keyboard automation)
- Monitor state introspection tools
- Auto-start toggle in the loader UI
- Error reporting in loader panel
- Invalid syntax detection in `.lod` files
- A monitor command reference appendix

---

# 7.13 Summary

The OSI C1P loader system is simple but powerful, and PCjs replicates it faithfully.  
Your custom loader extension expands it with:

- Direct .LOD parsing
- Fast direct-to-RAM loading
- URL-based automatic loading
- Optional auto-run support

This allows high-efficiency program development while retaining compatibility with the original OSI monitor design.

