//
// lod-loader.js
// OSI C1P PCjs extension for loading .LOD programs by simulating keyboard input
//
// This file is deliberately self-contained and does NOT depend on PCjs internals.
// It works by:
//  - adding a "Load .LOD Program" button near the C1P controls
//  - reading a .lod text file
//  - normalising CR/CRLF/LF line endings
//  - "typing" each line into the emulator via synthetic keyboard events
//  - sending a final CR after each line
//
// Important notes:
//  - The .LOD file should already contain the final ".XXXXG" line if you want auto-run.
//    We simply type that line as if you had done it by hand.
//

(function() {
    "use strict";

    // ---- Utility: log helper ----
    function log(msg) {
        if (window && window.console && console.log) {
            console.log("LOD Loader:", msg);
        }
    }

    // ---- Utility: normalise line endings and split into non-empty lines ----
    function parseLODText(text) {
        // Convert CRLF -> CR, LF -> CR, then split on CR.
        const normalised = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
        const lines = normalised
            .split("\r")
            .map(l => l.trim())
            .filter(l => l.length > 0);
        return lines;
    }

    // ---- Utility: synthetic key events to simulate typing ----
    function sendChar(ch) {
        const isEnter = (ch === "\r");
        const key = isEnter ? "Enter" : ch;
        const code = isEnter ? 13 : ch.charCodeAt(0);

        ["keydown", "keypress", "keyup"].forEach(type => {
            const ev = new KeyboardEvent(type, {
                key: key,
                bubbles: true,
                cancelable: true
            });

            // Older code may read keyCode / which / charCode
            try {
                Object.defineProperty(ev, "keyCode", { get: () => code });
                Object.defineProperty(ev, "which",   { get: () => code });
                Object.defineProperty(ev, "charCode",{
                    get: () => (type === "keypress" ? code : 0)
                });
            } catch (e) {
                // Some browsers may not allow redefining; ignore.
            }

            document.dispatchEvent(ev);
        });
    }

    // Type a full line and press Enter at the end
    function typeLine(line) {
        // Ensure focus is on the emulator (best-effort)
        focusDisplay();

        for (let i = 0; i < line.length; i++) {
            sendChar(line[i]);
        }
        // Send carriage return
        sendChar("\r");
    }

    // Try to focus the C1P display so it receives key events.
    function focusDisplay() {
        // Try a few likely candidates; this is best-effort only.
        const selectors = [
            ".pcjs-display",
            ".machine.c1p canvas",
            ".machine.c1p",
            "canvas"
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && typeof el.focus === "function") {
                try {
                    el.focus();
                    return;
                } catch (e) {}
            }
        }
    }

    // ---- Main LOD loading sequence ----
    function loadLODFromText(text) {
        const lines = parseLODText(text);
        if (!lines.length) {
            alert("LOD Loader: no lines found in file.");
            return;
        }

        log("Loading LOD program with " + lines.length + " lines…");

        // Type each line with a small delay to avoid overwhelming the emulator.
        let index = 0;

        function step() {
            if (index >= lines.length) {
                log("LOD program finished.");
                return;
            }
            const line = lines[index++];
            log("Typing: " + line);
            typeLine(line);

            // Adjust delay if needed; 20–50 ms is usually fine.
            setTimeout(step, 30);
        }

        step();
    }

    // ---- UI creation ----
    function createUI() {
        // Find the C1P machine container
        // We look for the first .machine that also mentions "Challenger 1P" nearby.
        let container = document.querySelector(".machine.c1p");
        if (!container) {
            // Fallback: first .machine on the page
            container = document.querySelector(".machine");
        }
        if (!container) {
            log("C1P container not found; UI not installed.");
            return;
        }

        // We will place our controls just above the machine container
        const toolbar = document.createElement("div");
        toolbar.style.margin = "8px 0";
        toolbar.style.display = "flex";
        toolbar.style.gap = "8px";
        toolbar.style.alignItems = "center";

        const button = document.createElement("button");
        button.textContent = "Load .LOD Program";
        button.style.padding = "4px 10px";
        button.style.fontSize = "13px";
        button.style.cursor = "pointer";

        const note = document.createElement("span");
        note.textContent = " (wait for BASIC 'OK' before loading)";
        note.style.fontSize = "11px";
        note.style.fontStyle = "italic";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".lod";
        fileInput.style.display = "none";

        button.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", (evt) => {
            const file = evt.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                loadLODFromText(e.target.result);
            };
            reader.readAsText(file);
        });

        toolbar.appendChild(button);
        toolbar.appendChild(note);
        toolbar.appendChild(fileInput);

        // Insert toolbar before the machine container
        container.parentNode.insertBefore(toolbar, container);

        log("UI installed.");
    }

    // ---- Optional URL-based preloading (manual trigger) ----
    // This does NOT auto-run by itself; it preloads the text so that when the user
    // clicks "Load .LOD Program (URL)", the program is injected.
    let preloadedLODText = null;

    function checkURLPreload() {
        if (!window.URLSearchParams) return;
        const params = new URLSearchParams(window.location.search);
        if (!params.has("lod")) return;

        const url = params.get("lod");
        if (!url) return;

        fetch(url)
            .then(res => res.text())
            .then(text => {
                preloadedLODText = text;
                log("Preloaded LOD from URL: " + url);
                alert("LOD Loader: LOD file preloaded from URL.\n\n" +
                      "Start the emulator, wait for BASIC 'OK', then use the\n" +
                      "\"Load .LOD Program\" button and choose the local file.\n\n" +
                      "(Full automatic URL loading can be added later with\n" +
                      "more knowledge of PCjs internals.)");
            })
            .catch(err => {
                console.error("LOD Loader URL error:", err);
            });
    }

    // ---- Bootstrapping ----
    function initWhenReady() {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                createUI();
                checkURLPreload();
            });
        } else {
            createUI();
            checkURLPreload();
        }
    }

    initWhenReady();

})();
