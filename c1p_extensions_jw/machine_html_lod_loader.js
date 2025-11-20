console.log("[LOD] UI + Loader extension script running (Dropdown Injection Mode)");

(function() {

    function initWhenReady() {
        // We need the DOM to be fully parsed and the Serial List to exist
        const serialList = document.getElementById("c1p8k-debugger.listSerial");
        const serialLoadBtn = document.getElementById("c1p8k-debugger.loadSerial");

        if (!serialList || !serialLoadBtn) {
            console.log("[LOD] Serial controls not found yet... retrying.");
            return void setTimeout(initWhenReady, 200);
        }

        // Prevent double insertion
        if (document.getElementById("lod-loader-box")) return;

        console.log("[LOD] Serial controls found. Initializing UI.");
        buildUI(serialList, serialLoadBtn);
    }

    function buildUI(serialListDiv, serialLoadBtnDiv) {
        // Find the actual <select> and <button> elements inside the wrappers
        const selectEl = serialListDiv.querySelector("select");
        const buttonEl = serialLoadBtnDiv.querySelector("button");

        if (!selectEl || !buttonEl) {
            console.error("[LOD] Could not find <select> or <button> inside serial controls.");
            return;
        }

        // Create the Custom Panel
        const machineEl = document.querySelector(".pcjs-machine");
        const box = document.createElement("div");
        box.id = "lod-loader-box";
        box.style.border = "2px solid #888";
        box.style.padding = "1em";
        box.style.marginTop = "1.5em";
        box.style.background = "#e6f2ff"; // Light blue to distinguish new version
        box.style.fontFamily = "monospace";

        const title = document.createElement("div");
        title.textContent = "Load .LOD via Serial Injection";
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
        loadBtn.textContent = "INJECT & LOAD";
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
                statusDiv.textContent = "File loaded. Ready to inject.";
            };
            reader.readAsText(file);
        });

        // Event: INJECT AND LOAD
        loadBtn.addEventListener("click", () => {
            const text = preview.textContent;
            if (!text || text.startsWith("(file contents")) {
                alert("Please select a file or paste code first.");
                return;
            }

            statusDiv.textContent = "Preparing injection...";

            // 1. Prepare the Text (Ensure CR line endings)
            const cleanText = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
            
            // 2. Create a Blob URL
            // Note: using .65v extension in the blob type hint just in case, though URL matters most
            const blob = new Blob([cleanText], { type: "text/plain" });
            const blobURL = URL.createObjectURL(blob);

            // 3. Inject into the <select> list
            // We create a new option at the top of the list
            const optionName = "** CUSTOM LOD LOAD **";
            const newOption = new Option(optionName, blobURL);
            
            // Add it to the beginning of the select
            selectEl.add(newOption, 0);
            
            // 4. Select it
            selectEl.selectedIndex = 0;
            selectEl.value = blobURL;

            // 5. Trigger 'change' event so PCjs sees the new value
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));

            statusDiv.innerHTML = "<b>Injected!</b> Clicking Load button...";

            // 6. Click the existing PCjs 'Load' button
            setTimeout(() => {
                buttonEl.click();
                statusDiv.innerHTML = "<b>Load Triggered!</b><br>Ensure you are in Monitor Mode (Break -> M).";
            }, 200);
        });
    }

    initWhenReady();

})();
