import {GCManager} from "./manageGC.js"
const manager = GCManager();
const gc = manager.GC("2025-2026");
const x = await gc.getScore();
