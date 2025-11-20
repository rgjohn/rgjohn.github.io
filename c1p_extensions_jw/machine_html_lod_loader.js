console.log("[LOD] UI + Loader extension script running (Editable V2)");

(function() {

    function initWhenReady() {
        if (typeof PCjs === "undefined" || !PCjs.machines) {
            return void setTimeout(initWhenReady, 100);
        }
        checkAutoStart();

        const serialList = document.getElementById("c1p8k-debugger.listSerial");
        const serialLoadBtn = document.getElementById("c1p8k-debugger.loadSerial");

        if (!serialList || !serialLoadBtn) {
            return void setTimeout(initWhenReady, 200);
        }

        if (document.getElementById("lod-loader-box")) return;
        buildUI(serialList, serialLoadBtn);
    }

    function checkAutoStart() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("autoStart") === "true") {
            const runControl = document.querySelector("div[id$='.run'] button, button[title='Run']");
            const statusDiv = document.querySelector(".pcjs-status");
            const isStopped = statusDiv ? statusDiv.textContent.includes("Stopped") : true;

            if (runControl && isStopped) {
                console.log("[LOD] AutoStart detected. Clicking Run...");
                setTimeout(() => runControl.click(), 500);
            }
        }
    }

    function buildUI(serialListDiv, serialLoadBtnDiv) {
        const selectEl = serialListDiv.querySelector("select");
        const buttonEl = serialLoadBtnDiv.querySelector("button");
        const machineEl = document.querySelector(".pcjs-machine");

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

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".lod,.txt,.65v";
        fileInput.style.marginBottom = "0.75em";
        box.appendChild(fileInput);

        // CHANGED: <textarea> instead of <pre> to allow pasting
        const preview = document.createElement("textarea");
        preview.placeholder = "(Paste code here or load file)";
        preview.style.width = "100%";
        preview.style.height = "10em";
        preview.style.fontFamily = "monospace";
        preview.style.whiteSpace = "pre";
        preview.style.background = "#fff";
        preview.style.border = "1px solid #ccc";
        box.appendChild(preview);

        const loadBtn = document.createElement("button");
        loadBtn.textContent = "INJECT & LOAD";
        loadBtn.style.marginTop = "0.75em";
        loadBtn.style.padding = "0.5em 1em";
        loadBtn.style.fontSize = "1.1em";
        loadBtn.style.fontWeight = "bold";
        loadBtn.style.cursor = "pointer";
        box.appendChild(loadBtn);

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
                preview.value = reader.result; // Use .value for textarea
                statusDiv.textContent = "File loaded.";
            };
            reader.readAsText(file);
        });

        loadBtn.addEventListener("click", () => {
            const text = preview.value; // Use .value for textarea
            if (!text) {
                alert("Please select a file or paste code first.");
                return;
            }

            const breakBtn = document.querySelector("div[id$='.break'] button");
            if (breakBtn) breakBtn.click();

            statusDiv.innerHTML = "<b>Step 1:</b> Break sent.<br><b>Step 2:</b> <span style='color:red;font-weight:bold;'>PRESS 'M' NOW!</span><br>(Injecting tape in 2 seconds...)";

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
                buttonEl.click();
                
                statusDiv.innerHTML = "<b>Tape Running!</b><br>If you pressed M, you should see ghost typing.";
            }, 2000);
        });
    }

    initWhenReady();

})();
