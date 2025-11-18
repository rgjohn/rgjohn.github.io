console.log("[LOD] UI + Loader extension script running");

(function() {

    // ---------------------------------------------------------------
    // LOD PARSER (Phase 2A) — parse text into {addr, bytes[]} blocks
    // ---------------------------------------------------------------
    function parseLOD(text) {
        if (!text || typeof text !== "string") {
            return [];
        }

        // Normalize CRLF and CR to simple LF
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        const lines = text.split("\n");
        const blocks = [];

        let currentAddr = null;
        let currentBytes = [];

        function finishBlock() {
            if (currentAddr !== null && currentBytes.length > 0) {
                blocks.push({
                    addr: currentAddr,
                    bytes: currentBytes.slice()
                });
            }
            currentAddr = null;
            currentBytes = [];
        }

        for (let raw of lines) {
            let line = (raw || "").trim();
            if (!line) continue;

            // PURE END-OF-BLOCK MARKER: ".0222G"
            if (/^\.[0-9A-Fa-f]+G$/i.test(line)) {
                finishBlock();
                continue;
            }

            // BLOCK START: ".0222/...." or ".0222/"
            if (/^\.[0-9A-Fa-f]+\/?/.test(line)) {
                // if we were already in a block, close it first
                finishBlock();

                const addrMatch = line.match(/^\.(\w+)/);
                if (!addrMatch) continue;

                currentAddr = parseInt(addrMatch[1], 16);
                if (isNaN(currentAddr)) {
                    currentAddr = null;
                    currentBytes = [];
                    continue;
                }

                // Extract after slash if present
                const slashPos = line.indexOf("/");
                let afterSlash = (slashPos >= 0 ? line.substring(slashPos + 1) : "").trim();

                // Handle ".0222/A9 07 ... G" on SAME line
                let hasTerminator = false;
                if (afterSlash.endsWith("G") || afterSlash.endsWith("g")) {
                    hasTerminator = true;
                    afterSlash = afterSlash.slice(0, -1).trim();
                }

                if (afterSlash.length > 0) {
                    afterSlash.split(/[\s,]+/).forEach(tok => {
                        if (/^[0-9A-Fa-f]{2}$/.test(tok)) {
                            currentBytes.push(parseInt(tok, 16));
                        }
                    });
                }

                if (hasTerminator) {
                    finishBlock();
                }

                continue;
            }

            // OTHERWISE: Plain data line (hex bytes separated by whitespace or commas)
            const tokens = line.split(/[\s,]+/);
            tokens.forEach(tok => {
                if (/^[0-9A-Fa-f]{2}$/.test(tok)) {
                    currentBytes.push(parseInt(tok, 16));
                }
            });
        }

        // End-of-file: close any open block
        finishBlock();

        return blocks;
    }

    // ---------------------------------------------------------------
    // Wait until the DOM is ready AND the emulator is built
    // ---------------------------------------------------------------
    function initWhenReady() {
        const machineEl = document.querySelector(".pcjs-machine");
        if (!machineEl) {
            console.log("[LOD] No .pcjs-machine yet — retrying...");
            return void setTimeout(initWhenReady, 100);
        }

        console.log("[LOD] Machine element found:", machineEl);

        // Machine ID is like "c1p8k-debugger.machine" → strip ".machine"
        const machineId = machineEl.id.replace(/\.machine$/, "");
        console.log("[LOD] Machine ID:", machineId);

        // Prevent double-insertion
        if (document.getElementById("lod-loader-box")) {
            console.log("[LOD] Loader UI already exists — skipping");
            return;
        }

        // ---------- Build the UI ----------
        const box = document.createElement("div");
        box.id = "lod-loader-box";
        box.style.border = "2px solid #888";
        box.style.padding = "1em";
        box.style.marginTop = "1.5em";
        box.style.background = "#f2f2f2";
        box.style.fontFamily = "monospace";

        const title = document.createElement("div");
        title.textContent = "Load OSI C1P .LOD Program";
        title.style.fontWeight = "bold";
        title.style.marginBottom = "0.75em";
        box.appendChild(title);

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".lod,.txt";
        fileInput.style.marginBottom = "0.75em";
        box.appendChild(fileInput);

        const preview = document.createElement("pre");
        preview.textContent = "(file contents will appear here)";
        preview.style.whiteSpace = "pre-wrap";
        preview.style.background = "#fff";
        preview.style.padding = "0.5em";
        preview.style.border = "1px solid #ccc";
        preview.style.height = "10em";
        preview.style.overflowY = "auto";
        box.appendChild(preview);

        // ---------- LOAD TO RAM button ----------
        const loadBtn = document.createElement("button");
        loadBtn.textContent = "LOAD TO RAM";
        loadBtn.style.marginTop = "0.75em";
        loadBtn.style.padding = "0.25em 1em";
        loadBtn.style.fontFamily = "monospace";
        loadBtn.style.cursor = "pointer";
        box.appendChild(loadBtn);

        // ---------- AUTO-RUN checkbox ----------
        const autorunLabel = document.createElement("label");
        autorunLabel.style.marginLeft = "1em";
        autorunLabel.style.fontSize = "0.9em";

        const autorunCheckbox = document.createElement("input");
        autorunCheckbox.type = "checkbox";
        autorunCheckbox.id = "lod-autorun";
        autorunCheckbox.checked = true;
        autorunCheckbox.style.marginLeft = "0.5em";

        autorunLabel.appendChild(autorunCheckbox);
        autorunLabel.appendChild(document.createTextNode(" Auto-run after load"));

        box.appendChild(autorunLabel);

        // ---------- LOAD LOGIC ----------
        loadBtn.addEventListener("click", function () {
            const text = preview.textContent.trim();
            if (!text) {
                alert("No .LOD text loaded.");
                return;
            }

            console.log("[LOD] Parsing LOD text for LOAD TO RAM...");

            const lines = text
                .replace(/\r\n/g, "\r")
                .replace(/\n/g, "\r")
                .split("\r")
                .map(l => l.trim())
                .filter(l => l !== "");

            // Find RAM component
            const ram = PCjs.components.find(c => c.id.endsWith(".ram8K"));
            if (!ram) {
                alert("Could not find RAM component");
                console.error("[LOD] RAM component (.ram8K) not found");
                return;
            }

            let execAddress = null;

            for (let line of lines) {

                // Must start with a dot
                if (!line.startsWith(".")) continue;

                // Example: .0200/A9 41 8D 00 D0
                const addrMatch = line.match(/^\.([0-9A-Fa-f]{4})/);
                if (!addrMatch) continue;

                let addr = parseInt(addrMatch[1], 16);

                // Execution command?
                if (line.endsWith("G") || line.match(/G\s*$/)) {
                    execAddress = addr;
                    console.log("[LOD] Found G execution address:", execAddress.toString(16));
                    continue;
                }

                // Load command?
                const slashPos = line.indexOf("/");
                if (slashPos >= 0) {
                    const bytesPart = line.substring(slashPos + 1).trim();
                    const byteTokens = bytesPart.split(/\s+/);

                    for (let tok of byteTokens) {
                        if (!tok.match(/^[0-9A-Fa-f]{2}$/)) continue;
                        const byte = parseInt(tok, 16);
                        ram.abMem[addr++] = byte;
                    }
                }
            }

            console.log("[LOD] Load completed.");

            if (execAddress !== null) {
                const addrHex = execAddress.toString(16).toUpperCase().padStart(4, "0");
                console.log("[LOD] Program entry address:", addrHex);

                if (autorunCheckbox.checked) {
                    // AUTO-RUN via monitor script
                    if (typeof commandMachine === "function") {
                        const script = "." + addrHex + "G\r";
                        console.log("[LOD] Auto-running via commandMachine script:", script);

                        try {
                            // Find debugger component
                            const dbg = PCjs.components.find(c => c.id.endsWith(".debugger"));
                            if (!dbg || !dbg.exports || typeof dbg.exports.runScript !== "function") {
                                console.warn("[LOD] No debugger.runScript() found — cannot autorun");
                            } else {
                                const script = "." + addrHex + "G\n";   // actual monitor input
                                console.log("[LOD] Auto-running via debugger.runScript:", script);
                                dbg.exports.runScript(script);
                            }

                            console.log("[LOD] commandMachine(script) returned:", ok);
                        } catch (e) {
                            console.error("[LOD] Error during auto-run:", e);
                            alert("Load complete, but auto-run failed (see console).");
                            return;
                        }

                        alert(`Load complete. Auto-running from $${addrHex}.`);
                        return;
                    } else {
                        console.warn("[LOD] commandMachine is not available — cannot autorun");
                        alert(`Load complete. Program entry at $${addrHex}, but auto-run is unavailable.`);
                        return;
                    }
                }

                // No auto-run, just inform the user
                alert(`Load complete. Program entry: $${addrHex}`);
            } else {
                alert("Load complete (no .XXXXG entry point found).");
            }
        });

        // ---------- Add SCREEN TEST button ----------
        const screenBtn = document.createElement("button");
        screenBtn.textContent = "SCREEN TEST";
        screenBtn.id = "lod-screen-test";
        screenBtn.style.display = "block";
        screenBtn.style.marginTop = "0.75em";
        screenBtn.style.marginRight = "0.5em";
        box.appendChild(screenBtn);

        // ---------- Add PARSE LOD button ----------
        const parseBtn = document.createElement("button");
        parseBtn.textContent = "PARSE LOD";
        parseBtn.id = "lod-parse-btn";
        parseBtn.style.marginTop = "0.5em";
        box.appendChild(parseBtn);

        // ---------- Hook into file selection ----------
        fileInput.addEventListener("change", function(ev) {
            const file = ev.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function() {
                preview.textContent = reader.result;
                console.log("[LOD] File loaded, preview updated");
            };
            reader.readAsText(file);
        });

        // ---------- Insert after machine ----------
        machineEl.parentNode.appendChild(box);

        console.log("[LOD] Loader UI successfully inserted");

        // ---------- SCREEN TEST functionality ----------
        screenBtn.addEventListener("click", () => {
            console.log("[LOD] Screen test button clicked");

            // Locate RAM
            let ram = PCjs.components.find(c => c.id.includes(".ram8K"));
            if (!ram) {
                console.error("[LOD] ERROR: RAM component not found");
                return;
            }

            const VIDEO_BASE = 0xD060;
            const SCREEN_COLS = 32;

            function writeChar(row, col, ascii) {
                ram.abMem[VIDEO_BASE + row * SCREEN_COLS + col] = ascii;
            }

            const text = "HELLO";
            for (let i = 0; i < text.length; i++) {
                writeChar(0, i, text.charCodeAt(i));
            }

            console.log("[LOD] HELLO written to screen RAM");
        });

        // ---------- PARSE LOD functionality (no RAM writes yet) ----------
        parseBtn.addEventListener("click", () => {
            console.log("[LOD] PARSE LOD button clicked");

            const text = preview.textContent || "";
            if (!text.trim()) {
                preview.textContent = "[PARSER] No text to parse.\n\n" + text;
                console.warn("[LOD] No text in preview to parse");
                return;
            }

            const blocks = parseLOD(text);
            console.log("[LOD] Parsed blocks:", blocks);

            if (!blocks.length) {
                preview.textContent = "[PARSER] No valid .LOD blocks found.\n\n" + text;
                return;
            }

            // Build a human-readable summary
            let summary = "";
            summary += "[PARSER] Parsed " + blocks.length + " block(s):\n\n";
            blocks.forEach((b, idx) => {
                const addrHex = b.addr.toString(16).toUpperCase().padStart(4, "0");
                summary += "Block " + (idx + 1) + " at $" + addrHex +
                           " (" + b.bytes.length + " bytes)\n";

                // Show first 16 bytes as sample
                const sample = b.bytes.slice(0, 16)
                    .map(v => v.toString(16).toUpperCase().padStart(2, "0"))
                    .join(" ");
                summary += "  Sample: " + sample +
                           (b.bytes.length > 16 ? " ..." : "") + "\n\n";
            });

            // Overwrite preview with summary (keeps everything on-screen)
            preview.textContent = summary;
        });
    }

    initWhenReady();

})();
