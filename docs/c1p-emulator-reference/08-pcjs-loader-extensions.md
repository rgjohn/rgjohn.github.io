# 8. Custom PCjs Loader & UI Extensions

This section documents the custom enhancements added to the OSI C1P PCjs emulator, including program loaders, UI improvements, and custom character generator options.

---

# 8.1 LOD Loader Extension

The OSI C1P monitor supports a text-based hex load format known as **.LOD files**, composed of:

- CR-terminated lines  
- Loader commands such as `.XXXX/` followed by hex bytes  
- A final `.XXXXG` command to execute the program  

The PCjs C1P emulator already simulates monitor typing internally for JSON-based program loaders.  
This extension enables **native .LOD loading** via:

### 8.1.1 UI Button Loader  
A new toolbar/button:

