import { ipcMain, app, BrowserWindow, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
const MAX_COPIES = 99;
function registerPrintingHandlers(getWindow) {
  ipcMain.handle("printing:list-printers", async () => {
    const win2 = getWindow();
    if (!win2) return [];
    const printers = await win2.webContents.getPrintersAsync();
    return printers.map((p) => ({ name: p.name, displayName: p.displayName || p.name, isDefault: p.isDefault }));
  });
  ipcMain.handle("printing:print-html", async (_event, request) => {
    if (typeof (request == null ? void 0 : request.html) !== "string" || typeof request.deviceName !== "string" || request.deviceName === "") {
      return { ok: false, message: "Pick a printer first." };
    }
    const copies = Math.min(MAX_COPIES, Math.max(1, Math.floor(Number(request.copies) || 1)));
    const dir = await mkdtemp(path.join(app.getPath("temp"), "nxlogsync-print-"));
    const file = path.join(dir, "print.html");
    const printWin = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } });
    try {
      await writeFile(file, request.html, "utf8");
      await printWin.loadFile(file);
      return await new Promise((resolve) => {
        printWin.webContents.print(
          {
            silent: true,
            deviceName: request.deviceName,
            copies,
            printBackground: true,
            pageSize: "A4",
            margins: { marginType: "none" }
          },
          (success, failureReason) => resolve(success ? { ok: true } : { ok: false, message: failureReason || "The printer did not accept the job." })
        );
      });
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    } finally {
      printWin.destroy();
      await rm(dir, { recursive: true, force: true });
    }
  });
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "logo-nxlogsync.png"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerPrintingHandlers(() => win);
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
