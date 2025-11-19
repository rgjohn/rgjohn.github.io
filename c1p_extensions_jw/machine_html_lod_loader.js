console.log("[LOD] UI + Loader extension script running (Serial/Tape Mode)");

(function() {

    // ---------------------------------------------------------------
    // Wait for emulator DOM
    // ---------------------------------------------------------------
    function initWhenReady() {
        // We look for the PCjs global object to be sure the runtime is up
        if (typeof PCjs === "undefined" || !PCjs.machines) {
            console.log("[LOD] PCjs runtime not ready — retrying...");
            return void setTimeout(initWhenReady, 100);
        }

        const machineEl = document.querySelector(".pcjs-machine");
        if (!machineEl) {
            return void setTimeout(initWhenReady, 100);
        }

        // Prevent double insertion
        if (document.getElementById("lod-loader-box")) return;

        console.log("[LOD] PCjs and Machine found. Initializing Serial Loader.");
        buildUI(machineEl);
    }

    // ---------------------------------------------------------------
    // Build the UI
    // ---------------------------------------------------------------
    function buildUI(machineEl) {
        const box = document.createElement("div");
        box.id = "lod-loader-box";
        box.style.border = "2px solid #888";
        box.style.padding = "1em";
        box.style.marginTop = "1.5em";
        box.style.background = "#f2f2f2";
        box.style.fontFamily = "monospace";

        const title = document.createElement("div");
        title.textContent = "Load OSI C1P .LOD (Serial Tape Mode)";
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
        loadBtn.textContent = "LOAD VIA SERIAL TAPE";
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

        // -----------------------------------------------------------
        // Event: File Selected
        // -----------------------------------------------------------
        fileInput.addEventListener("change", ev => {
            const file = ev.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                preview.textContent = reader.result;
                statusDiv.textContent = "File loaded. Ready to send to Serial Port.";
            };
            reader.readAsText(file);
        });

        // -----------------------------------------------------------
        // Event: LOAD VIA SERIAL
        // -----------------------------------------------------------
        loadBtn.addEventListener("click", () => {
            const text = preview.textContent;
            if (!text || text.startsWith("(file contents")) {
                alert("Please select a file first.");
                return;
            }

            // 1. Find the Serial Component
            // We look for a component that identifies as serial
            const serial = PCjs.components.find(c => 
                c.type === "serial" || 
                (c.id && c.id.includes("serial"))
            );

            if (!serial) {
                statusDiv.textContent = "Error: Serial Port component not found.";
                return;
            }

            // 2. Prepare the Data
            // Convert text to an array of ASCII byte values.
            // OSI requires CR (0x0D) as line terminators.
            // We replace LF with CR, or CRLF with CR.
            const cleanText = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
            
            const byteArray = [];
            for (let i = 0; i < cleanText.length; i++) {
                byteArray.push(cleanText.charCodeAt(i));
            }

            console.log(`[LOD] Converted ${byteArray.length} bytes for serial transmission.`);

            // 3. Create Fake JSON Blob
            // Structure: { "bytes": [ ... ] }
            const jsonPayload = JSON.stringify({ bytes: byteArray });
            const blob = new Blob([jsonPayload], { type: "application/json" });
            const blobURL = URL.createObjectURL(blob);

            // 4. Load into Serial Port
            statusDiv.textContent = "Mounting tape...";
            
            try {
                // PCjs serial components usually have a load(name, path) method
                // The 'name' is arbitrary, 'path' is our Blob URL.
                if (typeof serial.load === "function") {
                    const result = serial.load("TapeLoader.json", blobURL);
                    
                    // If load returns true or undefined (async), assume success
                    console.log("[LOD] serial.load() called", result);
                    statusDiv.innerHTML = "<b>Tape Mounted!</b><br>If the emulator is in Monitor mode, typing should start immediately.<br>If not, Reset the machine and enter Monitor (M).";
                    
                } else {
                    statusDiv.textContent = "Error: Serial component found but has no load() method.";
                    console.error(serial);
                }
            } catch (err) {
                console.error(err);
                statusDiv.textContent = "Exception during load: " + err.message;
            }
        });
    }

    initWhenReady();

})();
