# Custom Loader Tools & Extension Architecture

## Overview
The C1P Emulator mirror uses a "Serial Injection" strategy to load user programs (.LOD, .65v, .TXT). This replaces earlier attempts at direct RAM poking, ensuring 100% compatibility with the emulator's internal state machine and the ROM Monitor.

## The "Trojan Horse" Injection Method
Instead of writing to memory addresses directly, the loader extension (`machine_html_lod_loader.js`):
1.  Intercepts the user's file (or URL parameters).
2.  Creates a browser `Blob` containing the raw text (ensuring CR line endings).
3.  Programmatically injects this Blob as a new `<option>` into the emulator's existing **Serial Port List**.
4.  Programmatically clicks the emulator's native **Load** button.

This tricks the emulator into treating the user's code as if it were a built-in library tape.

## Capabilities

### 1. Interactive Panel
Appears below the emulator on both Standard and Debugger pages.
*   **Input:** File picker (.lod, .txt, .65v) or text paste.
*   **Action:** "INJECT & LOAD" button.
*   **Behavior:** 
    *   Clicks `BREAK` to reset the machine.
    *   Waits 2 seconds.
    *   Injects the tape and triggers the Serial Load.
    *   Result: The machine automatically enters Monitor mode (if not already there) and "ghost types" the program into memory, executing it immediately if a `.xxxxG` footer is present.

### 2. URL-Based Automation
Allows remote execution of programs via URL parameters, enabling automated batch testing.

**URL Format:**
`https://rgjohn.github.io/machines/osi/c1p/debugger/?autoStart=true&autoMount={name:"PROG",path:"/path/to/file.65v"}`

**Mechanism:**
*   The `autoMount` parameter (native PCjs) mounts the file to the serial port.
*   The `autoStart=true` parameter is detected by our custom script.
*   If the Debugger is present and "Stopped" (Halt on Boot), the script automatically clicks the **Run** button.
*   This releases the CPU, allowing the ROM to process the mounted serial stream immediately.

## Technical Implementation
*   **File:** `c1p_extensions_jw/machine_html_lod_loader.js`
*   **Hook:** Included via `<script>` in `_includes/machine.html`.
*   **Dependencies:** Requires the `c1p8k-debugger.listSerial` and `c1p8k-debugger.loadSerial` DOM elements to be present.

## Programming Notes & Memory Usage

### Zero Page Safety
Based on successful execution of complex programs (e.g., `LIFE.65v`), the following Zero Page locations appear safe for user machine code, even when loading via the Monitor:
*   **$FE - $FF**: Commonly used as 16-bit pointers for indirect addressing (e.g., `STA ($FE), Y`).
*   **$00 - $10**: Often used by user programs (though Microsoft BASIC uses this region heavily, it is generally safe for pure machine code running from Monitor).

### Loading Addresses
*   **$0200 - $027F**: This region is the **Monitor Input Buffer**.
    *   *Caution:* While loading large blocks into this region (e.g., starting at `$0222`) has been observed to work in some `.LOD` files, it carries a risk of buffer collision if the load command line is extremely long.
    *   *Recommendation:* For manual or experimental code, prefer loading at **$0300** or above to guarantee no overlap with the input buffer during the load process.
