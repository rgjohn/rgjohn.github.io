console.log("[LOD] UI + Loader extension script running (Native .LOD Mode)");

(function() {

    function initWhenReady() {
        // Wait for PCjs global and machine
        if (typeof PCjs === "undefined" || !PCjs.machines) {
            return void setTimeout(initWhenReady, 100);
        }

        const machineEl = document.querySelector(".pcjs-machine");
        if (!machineEl) return void setTimeout(initWhenReady, 100);

        // Prevent double insertion
        if (document.getElementById("lod-loader-box")) return;

        console.log("[LOD] PCjs Ready. Initializing Native LOD Loader.");
        buildUI(machineEl);
    }

    function buildUI(machineEl) {
        const box = document.createElement("div");
        box.id = "lod-loader-box";
        box.style.border = "2px solid #888";
        box.style.padding = "1em";
        box.style.marginTop = "1.5em";
        box.style.background = "#f2f2f2";
        box.style.fontFamily = "monospace";

        const title = document.createElement("div");
        title.textContent = "Load OSI C1P .LOD (Native Serial)";
        title.style.fontWeight = "bold";
        title.style.marginBottom = "0.75em";
        box.appendChild(title);

        // File Input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".lod,.txt,.65v";
        fileInput.style.marginBottom = "0.75em";
        box.appendChild(fileInput);

        // Preview
        const preview = document.createElement("pre");
        preview.textContent = "(file contents will appear here)";
        preview.style.whiteSpace = "pre-wrap";
        preview.style.background = "#fff";
        preview.style.padding = "0.5em";
        preview.style.border = "1px solid #ccc";
        preview.style.height = "10em";
        preview.style.overflowY = "auto";
        box.appendChild(preview);

        // LOAD BUTTON
        const loadBtn = document.createElement("button");
        loadBtn.textContent = "LOAD .LOD VIA TAPE";
        loadBtn.style.marginTop = "0.75em";
        loadBtn.style.padding = "0.5em 1em";
        loadBtn.style.fontSize = "1.1em";
        loadBtn.style.fontWeight = "bold";
        loadBtn.style.cursor = "pointer";
        box.appendChild(loadBtn);

        // STATUS AREA
        const statusDiv = document.createElement("div");
        statusDiv.style.marginTop = "1em";
        statusDiv.style.color = "#333";
        box.appendChild(statusDiv);

        machineEl.parentNode.appendChild(box);

        // Event: File Selected
        fileInput.addEventListener("change", ev => {
            const file = ev.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                preview.textContent = reader.result;
                statusDiv.textContent = "File loaded. Ready to mount.";
            };
            reader.readAsText(file);
        });

        // Event: LOAD BUTTON
        loadBtn.addEventListener("click", () => {
            const text = preview.textContent;
            if (!text || text.startsWith("(file contents")) {
                alert("Please select a file first (or paste code into the preview).");
                return;
            }

            // 1. Find the Machine Component
            const machine = PCjs.components.find(c => c.id && c.id.includes(".machine"));
            if (!machine) {
                statusDiv.textContent = "Error: Machine component not found.";
                return;
            }

            // 2. Prepare Raw Text Blob
            // We do NOT wrap in JSON. We pass the raw LOD text.
            // We ensure lines end with CR for OSI compatibility.
            const cleanText = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
            
            const blob = new Blob([cleanText], { type: "text/plain" });
            const blobURL = URL.createObjectURL(blob);

            statusDiv.textContent = "Mounting tape...";
            console.log("[LOD] Calling machine.mountSoftware with .lod filename");

            try {
                if (typeof machine.mountSoftware === "function") {
                    
                    // KEY FIX: Filename must end in .lod (or .65v) to trigger native serial loader
                    machine.mountSoftware({
                        name: "program.lod", 
                        path: blobURL
                    });

                    statusDiv.innerHTML = "<b>Tape Mounted!</b><br>1. Ensure Emulator is in Monitor Mode (Break -> M).<br>2. The system should auto-type and run.";
                
                } else {
                    statusDiv.textContent = "Error: machine.mountSoftware() is not available.";
                }
            } catch (err) {
                console.error(err);
                statusDiv.textContent = "Exception: " + err.message;
            }
        });
    }

    initWhenReady();

})();
