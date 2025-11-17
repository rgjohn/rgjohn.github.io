(function() {
    console.log("[LOD] loader extension initializing");

    //
    // Find the machine container added by machine.html
    //
    var machineEl = document.querySelector(".pcjs-machine");
    if (!machineEl) {
        console.log("[LOD] No machine element found — aborting loader init");
        return;
    }

    //
    // Find the loader UI elements that machine.html created.
    // We look them up by walking the DOM.
    //
    var boxes = machineEl.parentNode.querySelectorAll("div");
    var loaderBox = null;

    // Find the one containing our loader title
    boxes.forEach(function(div) {
        if (div.textContent.includes("Load OSI C1P .LOD Program")) {
            loaderBox = div;
        }
    });

    if (!loaderBox) {
        console.log("[LOD] Loader box not found — aborting");
        return;
    }

    console.log("[LOD] Found loader box:", loaderBox);

    //
    // Locate the file input and preview box
    //
    var fileInput = loaderBox.querySelector("input[type='file']");
    var preview = loaderBox.querySelector("pre");

    if (!fileInput || !preview) {
        console.log("[LOD] Missing input or preview elements");
        return;
    }

    console.log("[LOD] File input and preview found");

    //
    // Attach file reader
    //
    fileInput.addEventListener("change", function(event) {
        var file = event.target.files[0];
        if (!file) return;

        console.log("[LOD] Selected file:", file.name);

        var reader = new FileReader();

        reader.onload = function(ev) {
            var text = ev.target.result;

            console.log("[LOD] Raw file contents loaded:");
            console.log(text);

            // Display in preview
            preview.textContent = text;
        };

        reader.onerror = function(err) {
            console.error("[LOD] File read error:", err);
        };

        // VERY IMPORTANT:
        // Read as plain text WITHOUT modifying line endings
        reader.readAsText(file);
    });

})();
