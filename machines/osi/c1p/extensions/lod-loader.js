//
// lod-loader.js
// OSI C1P PCjs extension for loading .LOD programs
//

(function() {

    //
    // Utility: Wait for PCjs machine to be fully initialized
    //
    function waitForMachine(callback) {
        const check = () => {
            if (window && window.pcjsMachines && Object.keys(window.pcjsMachines).length > 0) {
                callback();
            } else {
                setTimeout(check, 200);
            }
        };
        check();
    }

    //
    // Inject text into monitor as keystrokes (CR appended)
    //
    function injectLine(machine, line) {
        const input = machine.keyboard;
        if (!input) {
            console.error("LOD Loader: keyboard not found");
            return;
        }
        // Add CR if missing
        if (!line.endsWith("\r")) line += "\r";

        for (let i = 0; i < line.length; i++) {
            const ch = line.charCodeAt(i);
            input.injectChar(ch);
        }
    }

    //
    // Main LOD loading routine
    //
    function loadLOD(machine, text) {
        const raw = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
        const lines = raw.split("\r").map(l => l.trim()).filter(l => l.length);

        let runAddress = null;

        for (const line of lines) {
            // Detect .XXXXG auto-run command
            const match = line.match(/^\.(\w+)G$/i);
            if (match) {
                runAddress = match[1];
            }
            injectLine(machine, line);
        }

        // Auto-run if .XXXXG was found
        if (runAddress) {
            const cmd = `.${runAddress}G`;
            injectLine(machine, cmd);
        }

        console.log("LOD Loader: Program loaded");
    }

    //
    // Add UI button + hidden file input
    //
    function addUI(machine) {
        const container = document.querySelector(".machine.c1p");
        if (!container) {
            console.error("LOD Loader: C1P container not found");
            return;
        }

        // Create wrapper
        const wrapper = document.createElement("div");
        wrapper.style.margin = "10px 0";

        // Button
        const button = document.createElement("button");
        button.textContent = "Load .LOD Program";
        button.style.padding = "6px 12px";
        button.style.fontSize = "14px";
        button.style.cursor = "pointer";

        // Hidden file input
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".lod";
        input.style.display = "none";

        // Button click → open file picker
        button.onclick = () => input.click();

        // File select → load .lod file
        input.onchange = evt => {
            const file = evt.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => loadLOD(machine, e.target.result);
            reader.readAsText(file);
        };

        wrapper.appendChild(button);
        wrapper.appendChild(input);
        container.parentNode.insertBefore(wrapper, container);

        console.log("LOD Loader: UI installed");
    }

    //
    // URL Loader support
    // ?lod=/path/to/file.lod&autoStart=true
    //
    function checkURLLoader(machine) {
        const params = new URLSearchParams(window.location.search);
        if (!params.has("lod")) return;

        const url = params.get("lod");
        const autoStart = params.get("autoStart") === "true";

        fetch(url)
            .then(res => res.text())
            .then(text => {
                loadLOD(machine, text);
                if (autoStart) {
                    console.log("LOD Loader: autoStart enabled");
                }
            })
            .catch(err => console.error("LOD Loader URL error:", err));
    }

    //
    // Boot sequence
    //
    waitForMachine(() => {
        const id = Object.keys(window.pcjsMachines)[0];
        const machine = window.pcjsMachines[id];
        if (!machine) {
            console.error("LOD Loader: machine not found");
            return;
        }

        addUI(machine);
        checkURLLoader(machine);

        console.log("LOD Loader initialized");
    });

})();
