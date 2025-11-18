console.log("[LOD] UI + Loader extension script running");

(function() {

    // ---------------------------------------------------------------
    // LOD PARSER — parse text into {addr, bytes[]} blocks
    // ---------------------------------------------------------------
    function parseLOD(text) {
        if (!text || typeof text !== "string") return [];

        // Normalize CRLF/CR/LF → LF
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

            // ".0200G"
            if (/^\.[0-9A-Fa-f]+G$/i.test(line)) {
                finishBlock();
                continue;
            }

            // ".0200/...."
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
                let afterSlash = slashPos >= 0 ? line.substring(slashPos + 1).trim() : "";

                // ".0200/A9 ... G" on same line
                let hasG = false;
                if (afterSlash.endsWith("G") || afterSlash.endsWith("g")) {
                    hasG = true;
                    afterSlash = afterSlash.slice(0, -1).trim();
                }

                if (afterSlash) {
                    afterSlash.split(/[\s,]+/).forEach(tok => {
                        if (/^[0-9A-F]{2}$/i.test(tok)) {
                            currentBytes.push(parseInt(tok, 16));
                        }
                    });
                }

                if (hasG) finishBlock();
                continue;
            }

            // Plain data lines
            line.split(/[\s,]+/).forEach(tok => {
                if (/^[0-9A-F]{2}$/i.test(tok)) {
                    currentBytes.push(parseInt(tok, 16));
                }
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

        if (document.getElementById("lod-loader-box")) {
            console.log("[LOD] Loader UI already exists — skipping");
            return;
        }

        const machineId = machineEl.id.replace(".machine", "");
        console.log("[LOD] Machine ID:", machineId);

        // ---------------------------------------------------------------
        // Build UI panel
        // ---------------------------------------------------------------
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

        // LOAD TO RAM button
        const loadBtn = document.createElement("button");
        loadBtn.textContent = "LOAD TO RAM";
        loadBtn.style.marginTop = "0.75em";
        loadBtn.style.padding = "0.25em 1em";
        loadBtn.style.cursor = "pointer";
        box.appendChild(loadBtn);

        // SCREEN TEST
        const screenBtn = document.createElement("button");
        screenBtn.textContent = "SCREEN TEST";
        screenBtn.style.marginLeft = "0.75em";
        box.appendChild(screenBtn);

        // PARSE LOD button
        const parseBtn = document.createElement("button");
        parseBtn.textContent = "PARSE LOD";
        parseBtn.style.marginLeft = "0.75em";
        box.appendChild(parseBtn);

        // ---------------------------------------------------------------
        // Insert UI under emulator
        // ---------------------------------------------------------------
        machineEl.parentNode.appendChild(box);
        console.log("[LOD] Loader UI successfully inserted");

        // ===============================================================
        // FILE LOADING
        // ===============================================================
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

        // ===============================================================
        // LOAD TO RAM — main logic
        // ===============================================================
        loadBtn.addEventListener("click", () => {
            const text = preview.textContent.trim();
            if (!text) {
                alert("No .LOD text loaded.");
                return;
            }

            console.log("[LOD] Parsing LOD text for LOAD TO RAM...");
            const blocks = parseLOD(text);

            if (!blocks.length) {
                alert("Error: No valid .LOD blocks found.");
                return;
            }

            // Find RAM
            const ram = PCjs.components.find(c => c.id.endsWith(".ram8K"));
            if (!ram) {
                alert("ERROR: RAM component not found!");
                return;
            }

            let execAddr = null;

            // Write all blocks to RAM
            for (let b of blocks) {
                let addr = b.addr;
                for (let byte of b.bytes) {
                    ram.abMem[addr++] = byte;
                }
            }

            // Detect an ending G
            const endMatch = text.match(/\.(\w+)G/i);
            if (endMatch) {
                execAddr = parseInt(endMatch[1], 16);
            }

            console.log("[LOD] Load completed.");

            if (execAddr !== null) {
                console.log("[LOD] Program entry address:", execAddr.toString(16).toUpperCase());

                // ---------------------------------------------------------------
                // AUTO-RUN using debugger.runScript()
                // ---------------------------------------------------------------
                const dbg = PCjs.components.find(c => c.id.endsWith(".debugger"));

                if (dbg && dbg.exports && typeof dbg.exports.runScript === "function") {
                    const script = "." + execAddr.toString(16).toUpperCase().padStart(4, "0") + "G\n";
                    console.log("[LOD] Auto-running via debugger.runScript:", script);

                    dbg.exports.runScript(script);
                } else {
                    alert("Load complete, but auto-run unavailable (no debugger on this page).");
                }
            } else {
                alert("Load complete.");
            }
        });

        // ===============================================================
        // SCREEN TEST
        // ===============================================================
        screenBtn.addEventListener("click", () => {
            console.log("[LOD] Screen test button clicked");

            const ram = PCjs.components.find(c => c.id.includes(".ram8K"));
            if (!ram) return;

            const VIDEO = 0xD060;
            const COLS = 32;

            "HELLO".split("").forEach((ch, i) => {
                ram.abMem[VIDEO + i] = ch.charCodeAt(0);
            });

            console.log("[LOD] HELLO written to screen RAM");
        });

        // ===============================================================
        // PARSE LOD — debug tool
        // ===============================================================
        parseBtn.addEventListener("click", () => {
            const text = preview.textContent;
            const blocks = parseLOD(text);

            if (!blocks.length) {
                preview.textContent = "[PARSER] No valid LOD blocks found.\n\n" + text;
                return;
            }

            let out = "[PARSER] Parsed " + blocks.length + " block(s):\n\n";
            blocks.forEach((b, i) => {
                const addrHex = b.addr.toString(16).toUpperCase().padStart(4, "0");
                out += `Block ${i + 1}: $${addrHex}  (${b.bytes.length} bytes)\n`;

                const sample = b.bytes.slice(0, 16)
                    .map(v => v.toString(16).toUpperCase().padStart(2, "0"))
                    .join(" ");
                out += "  Sample: " + sample + (b.bytes.length > 16 ? " ..." : "") + "\n\n";
            });

            preview.textContent = out;
        });
    }

    initWhenReady();

})();
