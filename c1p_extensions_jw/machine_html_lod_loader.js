console.log("[LOD] UI + Loader extension script running");

(function() {

    // ---------------------------------------------------------------
    // LOD PARSER — Extract blocks { addr, bytes[] }
    // ---------------------------------------------------------------
    function parseLOD(text) {
        if (!text || typeof text !== "string") return [];

        // Normalize all line endings → LF
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines = text.split("\n");

        const blocks = [];
        let currentAddr = null;
        let currentBytes = [];

        function finishBlock() {
            if (currentAddr !== null && currentBytes.length > 0) {
                blocks.push({ addr: currentAddr, bytes: currentBytes.slice() });
            }
            currentAddr = null;
            currentBytes = [];
        }

        for (let raw of lines) {
            let line = (raw || "").trim();
            if (!line) continue;

            // End marker like ".0222G"
            if (/^\.[0-9A-Fa-f]+G$/i.test(line)) {
                finishBlock();
                continue;
            }

            // Start of block: ".0222/" or ".0222/A9 41 ..."
            if (/^\.[0-9A-Fa-f]+\/?/i.test(line)) {
                finishBlock();

                const addrMatch = line.match(/^\.(\w+)/);
                if (!addrMatch) continue;

                currentAddr = parseInt(addrMatch[1], 16);
                if (isNaN(currentAddr)) {
                    currentAddr = null;
                    currentBytes = [];
                    continue;
                }

                let slashPos = line.indexOf("/");
                let payload = slashPos >= 0 ? line.substring(slashPos + 1).trim() : "";

                // If line ends with G, remove it
                let hasG = false;
                if (/G$/i.test(payload)) {
                    hasG = true;
                    payload = payload.slice(0, -1).trim();
                }

                // Extract hex byte tokens
                if (payload.length > 0) {
                    payload.split(/[\s,]+/).forEach(tok => {
                        if (/^[0-9A-Fa-f]{2}$/.test(tok))
                            currentBytes.push(parseInt(tok, 16));
                    });
                }

                if (hasG) finishBlock();
                continue;
            }

            // Plain data line: bytes only
            line.split(/[\s,]+/).forEach(tok => {
                if (/^[0-9A-Fa-f]{2}$/.test(tok))
                    currentBytes.push(parseInt(tok, 16));
            });
        }

        finishBlock();
        return blocks;
    }

    // ---------------------------------------------------------------
    // Wait for emulator DOM
    // ---------------------------------------------------------------
    function initWhenReady() {
        const machineEl = document.querySelector(".pcjs-machine");
        if (!machineEl) {
            console.log("[LOD] No .pcjs-machine yet — retrying...");
            return void setTimeout(initWhenReady, 100);
        }

        console.log("[LOD] Machine element found:", machineEl);

        // Prevent double insertion
        if (document.getElementById("lod-loader-box")) {
            console.log("[LOD] Loader already exists — skipping");
            return;
        }

        // Extract machine ID (e.g., "c1p8k-debugger.machine")
        const machineID = machineEl.id || "";
        const cleanMachineID = machineID.replace(".machine", "");
        console.log("[LOD] Machine ID:", cleanMachineID);

        // -----------------------------------------------------------
        // BUILD UI PANEL
        // -----------------------------------------------------------
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

        // LOAD TO RAM
        const loadBtn = document.createElement("button");
        loadBtn.textContent = "LOAD TO RAM";
        loadBtn.style.marginTop = "0.75em";
        loadBtn.style.padding = "0.25em 1em";
        loadBtn.style.fontFamily = "monospace";
        loadBtn.style.cursor = "pointer";
        box.appendChild(loadBtn);

        // SCREEN TEST
        const screenBtn = document.createElement("button");
        screenBtn.textContent = "SCREEN TEST";
        screenBtn.style.marginLeft = "0.75em";
        screenBtn.style.padding = "0.25em 1em";
        box.appendChild(screenBtn);

        // PARSE LOD
        const parseBtn = document.createElement("button");
        parseBtn.textContent = "PARSE LOD";
        parseBtn.style.marginLeft = "0.75em";
        parseBtn.style.padding = "0.25em 1em";
        box.appendChild(parseBtn);

        machineEl.parentNode.appendChild(box);
        console.log("[LOD] Loader UI successfully inserted");

        // -----------------------------------------------------------
        // FILE LOAD
        // -----------------------------------------------------------
        fileInput.addEventListener("change", ev => {
            const file = ev.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                preview.textContent = reader.result;
                console.log("[LOD] File loaded, preview updated");
            };
            reader.readAsText(file);
        });

        // -----------------------------------------------------------
        // SCREEN TEST — write HELLO to VRAM
        // -----------------------------------------------------------
        screenBtn.addEventListener("click", () => {
            let ram = PCjs.components.find(c => c.id.endsWith(".ram8K"));
            if (!ram) return alert("RAM not found");

            const VIDEO = 0xD000;
            const COLS = 32;

            "HELLO".split("").forEach((ch, i) => {
                ram.abMem[VIDEO + i] = ch.charCodeAt(0);
            });

            console.log("[LOD] HELLO written to VRAM");
        });

        // -----------------------------------------------------------
        // PARSE LOD — preview parser output
        // -----------------------------------------------------------
        parseBtn.addEventListener("click", () => {
            const text = preview.textContent || "";
            const blocks = parseLOD(text);

            if (!blocks.length) {
                preview.textContent = "[PARSER] No valid LOD blocks.\n\n" + text;
                return;
            }

            let out = "[PARSER] " + blocks.length + " block(s) found:\n\n";
            blocks.forEach((b, i) => {
                const a = b.addr.toString(16).toUpperCase().padStart(4, "0");
                const sample = b.bytes.slice(0, 16)
                    .map(b => b.toString(16).toUpperCase().padStart(2, "0"))
                    .join(" ");
                out += `Block ${i+1} @ $${a}, ${b.bytes.length} bytes\n  ${sample}${b.bytes.length>16?" ...":""}\n\n`;
            });

            preview.textContent = out;
        });

        // -----------------------------------------------------------
        // LOAD TO RAM + AUTO-RUN (debugger only)
        // -----------------------------------------------------------
        loadBtn.addEventListener("click", () => {
            const text = preview.textContent.trim();
            if (!text) return alert("No LOD text loaded.");

            const blocks = parseLOD(text);
            if (!blocks.length) return alert("No valid .LOD blocks found.");

            // Find RAM
            const ram = PCjs.components.find(c => c.id.endsWith(".ram8K"));
            if (!ram) return alert("RAM component not found.");

            // Write bytes
            blocks.forEach(b => {
                let addr = b.addr;
                b.bytes.forEach(byte => {
                    ram.abMem[addr++] = byte;
                });
            });

            console.log("[LOD] RAM write complete.");

            // FIND ANY ".XXXXG"
            const gMatch = text.match(/\.(\w+)G/i);
            let execAddr = gMatch ? parseInt(gMatch[1], 16) : null;

            if (execAddr == null) {
                // On non-debugger pages, or if no G address is found, just stop here.
                alert("Load complete (no auto-run execution address found).");
                return;
            }

            const hexAddr = execAddr.toString(16).toUpperCase().padStart(4, "0");
            console.log("[LOD] Execution address found: $" + hexAddr);

            // -------------------------------------------------------
            // Attempt Auto-Run (Debugger only)
            // -------------------------------------------------------
            // We specifically look for the debugger input box and Enter button
            // using robust attribute selectors based on the user's DOM snippet.
            const debugInput = document.querySelector("input[id$='debugInput']");
            const debugEnter = document.querySelector("div[id$='debugEnter'] button");

            if (!debugInput || !debugEnter) {
                // Standard page (no debugger) - just alert success
                alert("Load complete.");
                return;
            }

            // Helper to send a command to the PCjs debugger
            function sendCmd(cmdStr) {
                debugInput.value = cmdStr;
                debugInput.dispatchEvent(new Event("input", { bubbles: true }));
                debugEnter.click();
            }

            // Execute sequence: Halt -> Set PC -> Go
            // 1. Halt (to break out of ROM loops)
            sendCmd("h");

            // 2. Set PC to the start address (force register update)
            sendCmd("r pc " + hexAddr);

            // 3. Go (resume execution)
            sendCmd("g");

            console.log(`[LOD] Auto-run sequence sent: h -> r pc ${hexAddr} -> g`);
        });

    }

    initWhenReady();

})();
