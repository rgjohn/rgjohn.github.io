console.log("[LOD] UI + Loader extension script running (Final V1)");

(function() {

    function initWhenReady() {
        // Check for PCjs global
        if (typeof PCjs === "undefined" || !PCjs.machines) {
            return void setTimeout(initWhenReady, 100);
        }

        // 1. URL AUTO-START CHECK
        // If the URL has ?autoStart=true and the debugger is halted, click Run.
        checkAutoStart();

        // 2. UI INITIALIZATION
        const serialList = document.getElementById("c1p8k-debugger.listSerial");
        const serialLoadBtn = document.getElementById("c1p8k-debugger.loadSerial");

        if (!serialList || !serialLoadBtn) {
            return void setTimeout(initWhenReady, 200);
        }

        if (document.getElementById("lod-loader-box")) return;

        console.log("[LOD] System ready. Building UI.");
        buildUI(serialList, serialLoadBtn);
    }

    // ---------------------------------------------------------------
    // Auto-Start Logic for URLs
    // ---------------------------------------------------------------
    function checkAutoStart() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("autoStart") === "true") {
            // Find the Run button in the debugger panel
            // It is usually inside a control div, e.g., id="c1p8k-debugger.run"
            const runControl = document.querySelector("div[id$='.run'] button, button[title='Run']");
            
            // Check if the CPU is halted (speed text often says "Stopped")
            const statusDiv = document.querySelector(".pcjs-status");
            const isStopped = statusDiv ? statusDiv.textContent.includes("Stopped") : true;

            if (runControl && isStopped) {
                console.log("[LOD] AutoStart detected. Clicking Run...");
                setTimeout(() => runControl.click(), 500); // Small delay to ensure load finishes
            }
        }
    }

    // ---------------------------------------------------------------
    // Interactive UI Builder
    // ---------------------------------------------------------------
    function buildUI(serialListDiv, serialLoadBtnDiv) {
        const selectEl = serialListDiv.querySelector("select");
        const buttonEl = serialLoadBtnDiv.querySelector("button");
        const machineEl = document.querySelector(".pcjs-machine");

        if (!selectEl || !buttonEl || !machineEl) return;

        const box = document.createElement("div");
        box.id = "lod-loader-box";
        box.style.border = "2px solid #888";
        box.style.padding = "1em";
        box.style.marginTop = "1.5em";
        box.style.background = "#e6f2ff"; 
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

        fileInput.addEventListener("change", ev => {
            const file = ev.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                preview.textContent = reader.result;
                statusDiv.textContent = "File loaded.";
            };
            reader.readAsText(file);
        });

        loadBtn.addEventListener("click", () => {
            const text = preview.textContent;
            if (!text || text.startsWith("(file contents")) {
                alert("Please select a file or paste code first.");
                return;
            }

            // Attempt to click BREAK to help the user
            const breakBtn = document.querySelector("div[id$='.break'] button");
            if (breakBtn) {
                console.log("[LOD] Clicking Break button...");
                breakBtn.click();
            }

            statusDiv.innerHTML = "<b>Step 1:</b> Break sent.<br><b>Step 2:</b> <span style='color:red;font-weight:bold;'>PRESS 'M' NOW!</span><br>(Injecting tape in 2 seconds...)";

            // Delay injection to give user time to hit 'M'
            setTimeout(() => {
                const cleanText = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
                const blob = new Blob([cleanText], { type: "text/plain" });
                const blobURL = URL.createObjectURL(blob);

                const optionName = "** CUSTOM LOD LOAD **";
                const newOption = new Option(optionName, blobURL);
                
                selectEl.add(newOption, 0);
                selectEl.selectedIndex = 0;
                selectEl.value = blobURL;
                selectEl.dispatchEvent(new Event("change", { bubbles: true }));

                // Click the PCjs Load button
                buttonEl.click();
                
                statusDiv.innerHTML = "<b>Tape Running!</b><br>If you pressed M, you should see ghost typing.";
            }, 2000);
        });
    }

    initWhenReady();

})();
