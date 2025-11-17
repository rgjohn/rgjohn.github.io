console.log("[LOD] UI + Loader extension script running");

(function() {

    // Wait until the DOM is ready AND the emulator is built
    function initWhenReady() {
        const machineEl = document.querySelector(".pcjs-machine");
        if (!machineEl) {
            console.log("[LOD] No .pcjs-machine yet — retrying...");
            return void setTimeout(initWhenReady, 100);
        }

        console.log("[LOD] Machine element found:", machineEl);

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

        // ---------- Add SCREEN TEST button ----------
        const screenBtn = document.createElement("button");
        screenBtn.textContent = "SCREEN TEST";
        screenBtn.id = "lod-screen-test";
        screenBtn.style.marginTop = "0.5em";
        screenBtn.style.marginBottom = "0.5em";
        box.appendChild(screenBtn);

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
        document.getElementById("lod-screen-test").addEventListener("click", () => {
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

            // Write HELLO
            const text = "HELLO";
            for (let i = 0; i < text.length; i++) {
                writeChar(0, i, text.charCodeAt(i));
            }

            console.log("[LOD] HELLO written to screen RAM");
        });
    }

    initWhenReady();

})();
