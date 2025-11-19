console.log("[LOD] UI + Loader extension script running (Machine Mount Mode)");

(function() {

    function initWhenReady() {
        if (typeof PCjs === "undefined" || !PCjs.machines) {
            return void setTimeout(initWhenReady, 100);
        }

        const machineEl = document.querySelector(".pcjs-machine");
        if (!machineEl) return void setTimeout(initWhenReady, 100);

        if (document.getElementById("lod-loader-box")) return;

        console.log("[LOD] PCjs Ready. Initializing Tape Loader.");
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
        title.textContent = "Load OSI C1P .LOD (Tape Emulation)";
        title.style.fontWeight = "bold";
        title.style.marginBottom = "0.75em";
        box.appendChild(title);

        // File Input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".lod,.txt";
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
        loadBtn.textContent = "LOAD TAPE";
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

        // Event: LOAD TAPE
        loadBtn.addEventListener("click", () => {
            const text = preview.textContent;
            if (!text || text.startsWith("(file contents")) {
                alert("Please select a file first.");
                return;
            }

            // 1. Find the Machine Component
            // The machine handles 'mountSoftware'
            const machine = PCjs.components.find(c => c.id && c.id.includes(".machine"));
            if (!machine) {
                statusDiv.textContent = "Error: Machine component not found.";
                return;
            }

            // 2. Convert Text to Bytes (CR delimited)
            const cleanText = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
            const byteArray = [];
            for (let i = 0; i < cleanText.length; i++) {
                byteArray.push(cleanText.charCodeAt(i));
            }

            // 3. Create JSON Blob
            const jsonPayload = JSON.stringify({ bytes: byteArray });
            const blob = new Blob([jsonPayload], { type: "application/json" });
            const blobURL = URL.createObjectURL(blob);

            statusDiv.textContent = "Mounting tape via Machine API...";
            console.log("[LOD] Calling machine.mountSoftware with Blob URL");

            try {
                // 4. Call the API that ?autoMount uses
                if (typeof machine.mountSoftware === "function") {
                    
                    machine.mountSoftware({
                        name: "UserTape.json",
                        path: blobURL
                    });

                    statusDiv.innerHTML = "<b>Tape Mounted!</b><br>1. Ensure Emulator is in Monitor Mode (Press Break, then M).<br>2. Execution should start automatically.";
                
                } else {
                    // Fallback: try to find it on the prototype or log the machine
                    statusDiv.textContent = "Error: machine.mountSoftware() is not a function.";
                    console.error("Machine object:", machine);
                    console.log("Machine keys:", Object.keys(machine));
                }
            } catch (err) {
                console.error(err);
                statusDiv.textContent = "Exception: " + err.message;
            }
        });
    }

    initWhenReady();

})();
