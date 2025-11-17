12. C1P Emulator Developer API & Integration Guide

Version: 0.1
Status: In Development
Audience: Developers extending or embedding the PCjs OSI C1P Emulator
Maintainer: rgjohn & ChatGPT

12.1 Overview

This document describes the internal API surface exposed by the PCjs OSI C1P emulator (C1Pjs), along with the additional developer-facing entry points discovered through analysis.

It explains:

How the emulator represents hardware components

How to discover and inspect components dynamically

How to interact with RAM, CPU, Video, and other components

How to add new UI features cleanly (without modifying PCjs core code)

How to use PCjs' internal script/command system

The recommended methods for extending emulator functionality

This guide is essential for building advanced extensions such as:

The .LOD Loader

Character generator switchers

Memory editing tools

Debugging aids

Automation tools

Custom UI panels

12.2 PCjs Global Registry (PCjs)

When a C1P machine loads, PCjs creates a global registry object:

window.PCjs


It contains:

PCjs = {
    machines: { ... },
    components: [ ... ],
    commands: { ... },
    files: { ... }
}

12.2.1 Machines List
PCjs.machines


Example:

Object.keys(PCjs.machines);
// ["c1p8k", "c1p8k-debugger"]


Each key is a machine ID, matching the one declared in the page front matter.

12.3 Components System

Every emulated hardware element is represented as a Component subclass.

When the emulator loads, all components register themselves in:

PCjs.components


This is an ordered array containing objects such as:

Component ID	Type	Description
c1p8k-debugger.cpu6502	C1PCPU	CPU
c1p8k-debugger.ram8K	C1PRAM	RAM (8 KB)
c1p8k-debugger.video	C1PVideo	Video controller
c1p8k-debugger.keyboard	C1PKeyboard	Keyboard input device
c1p8k-debugger.panel	C1PPanel	Front-panel UI
c1p8k-debugger.debugger	C1PDebugger	Debugger engine
…	…	…
Inspect all components for a given machine:
PCjs.components.filter(c =>
    c.id.startsWith("c1p8k-debugger")
);

12.4 Component Identification

Each Component has:

component.id          // "c1p8k-debugger.ram8K"
component.type        // "C1PRAM"
component.idMachine   // "c1p8k-debugger"
component.idComponent // "ram8K"


This provides a consistent way to locate hardware units.

12.5 Accessing RAM (C1PRAM)

RAM is exposed through the abMem buffer:

let ram = PCjs.components.find(c => c.id === "c1p8k-debugger.ram8K");
ram.abMem[0x0200] = 0xA9;     // deposit a byte (LDA #imm)
ram.abMem[0x0201] = 0x42;     // LDA #$42


This buffer is live, and writes take immediate effect.

Example: Write “HI” to top-left of video RAM
ram.abMem[0xD000] = 0x48;  // 'H'
ram.abMem[0xD001] = 0x49;  // 'I'


Because video RAM is memory-mapped, characters appear instantly.

12.6 Accessing the CPU (C1PCPU)

CPU object:

let cpu = PCjs.components.find(c =>
    c.id.endsWith(".cpu6502")
);


Properties include:

Registers

Flags

Instruction tracing state

(PCjs does not expose setters for PC/SP registers via API.)

However, the CPU can be controlled through the Debugger, described next.

12.7 Debugger Component (C1PDebugger)

The C1P debugger UI contains a command interface. Internally it exposes a powerful scripting API.

Example:

let dbg = PCjs.components.find(c =>
    c.id.endsWith(".debugger")
);


The internal “monitor command interpreter” is accessible using:

commandMachine(null, false,
               "c1p8k-debugger",
               "Debug",
               "command",
               "db 0200");


This performs a Debugger command — equivalent to typing in the debugger.

12.8 commandMachine() – Central API Hook

Signature:

commandMachine(control, fSingle, idMachine, component, command, value)


Debug commands are invoked using:

commandMachine(null, false,
               "c1p8k-debugger",
               "Debug",
               "command",
               "db 0200");


This is the primary supported API for:

Memory display

Breakpoints

Disassembly

Register inspection

stepping / running

12.9 PCjs Script System (.script)

PCjs contains an internal “script language” (used for auto-boot and auto-typing).

To inject literal keystrokes:

commandMachine(null, false,
               "c1p8k-debugger",
               null,
               "script",
               "HELLO\r");


This is how the LOD Loader feeds bytes to the OSI monitor.

12.10 Emulator DOM Integration

The machine panel is always found using:

document.querySelector(".pcjs-machine")


Its id is the machine ID + .machine.

Example:

<div id="c1p8k-debugger.machine" class="pcjs-machine c1p-machine c1p-component">


Extensions can safely append UI elements below the panel:

const machineEl = document.querySelector(".pcjs-machine");
machineEl.parentNode.appendChild(newElement);

12.11 Safe Extensions Pattern (Recommended)

You should never modify PCjs core files.

Instead, use:

_includes/machine.html


to load custom scripts:

<script src="{{ site.baseurl }}/c1p_extensions_jw/machine_html_lod_loader.js"></script>


Then place all extensions under:

/c1p_extensions_jw/


This ensures:

clean isolation

easy maintenance

no merge issues

consistent load order

12.12 Memory Map Integration

Useful when writing tools:

VRAM: 0xD000 – 0xD3FF

Monitor ROM: 0xF800 – 0xFFFF

BASIC ROM: 0xA000 – 0xBFFF

Ram entry point:

let ram = PCjs.components.find(c => c.type === "C1PRAM");
ram.abMem[address] = value;

12.13 Planned Official API Extensions

We will eventually expose a stable API wrapped around the raw internals:

machine.loadLOD(text)
machine.loadBytes(addr, bytes)
machine.dumpVRAM()
machine.screenshot()
machine.runAt(addr)

12.14 Summary Cheat-Sheet

A concise cheat-sheet for developers:

// List machines:
Object.keys(PCjs.machines);

// List components:
PCjs.components.map(c => c.id);

// Access RAM:
let ram = PCjs.components.find(c => c.type === "C1PRAM");
ram.abMem[0x0200] = 0xFF;

// Access debugger:
let dbg = PCjs.components.find(c => c.type === "C1PDebugger");

// Issue debugger command:
commandMachine(null,false,"c1p8k-debugger","Debug","command","db 0200");

// Inject keystrokes:
commandMachine(null,false,"c1p8k-debugger",null,"script","HELLO\r");

// Find DOM container:
document.querySelector(".pcjs-machine");
