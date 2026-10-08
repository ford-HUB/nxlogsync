import { ipcMain as d, app as r, BrowserWindow as l, Menu as u } from "electron";
import { fileURLToPath as R } from "node:url";
import e from "node:path";
import { mkdtemp as v, writeFile as E, rm as y } from "node:fs/promises";
const T = 99;
function j(h) {
  d.handle("printing:list-printers", async () => {
    const a = h();
    return a ? (await a.webContents.getPrintersAsync()).map((i) => ({ name: i.name, displayName: i.displayName || i.name, isDefault: i.isDefault })) : [];
  }), d.handle("printing:print-html", async (a, n) => {
    if (typeof (n == null ? void 0 : n.html) != "string" || typeof n.deviceName != "string" || n.deviceName === "")
      return { ok: !1, message: "Pick a printer first." };
    const i = Math.min(T, Math.max(1, Math.floor(Number(n.copies) || 1))), p = await v(e.join(r.getPath("temp"), "nxlogsync-print-")), m = e.join(p, "print.html"), s = new l({ show: !1, webPreferences: { javascript: !1, sandbox: !0 } });
    try {
      return await E(m, n.html, "utf8"), await s.loadFile(m), await new Promise((o) => {
        s.webContents.print(
          {
            silent: !0,
            deviceName: n.deviceName,
            copies: i,
            printBackground: !0,
            pageSize: "A4",
            margins: { marginType: "none" }
          },
          (P, _) => o(P ? { ok: !0 } : { ok: !1, message: _ || "The printer did not accept the job." })
        );
      });
    } catch (o) {
      return { ok: !1, message: o instanceof Error ? o.message : String(o) };
    } finally {
      s.destroy(), await y(p, { recursive: !0, force: !0 });
    }
  });
}
const f = e.dirname(R(import.meta.url));
process.env.APP_ROOT = e.join(f, "..");
const c = process.env.VITE_DEV_SERVER_URL, O = e.join(process.env.APP_ROOT, "dist-electron"), w = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = c ? e.join(process.env.APP_ROOT, "public") : w;
let t;
function g() {
  t = new l({
    icon: e.join(process.env.VITE_PUBLIC, "logo-nxlogsync.png"),
    webPreferences: {
      preload: e.join(f, "preload.mjs")
    }
  }), t.webContents.on("did-finish-load", () => {
    t == null || t.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), c ? t.loadURL(c) : t.loadFile(e.join(w, "index.html"));
}
r.on("window-all-closed", () => {
  process.platform !== "darwin" && (r.quit(), t = null);
});
r.on("activate", () => {
  l.getAllWindows().length === 0 && g();
});
r.whenReady().then(() => {
  u.setApplicationMenu(null), j(() => t), g();
});
export {
  O as MAIN_DIST,
  w as RENDERER_DIST,
  c as VITE_DEV_SERVER_URL
};
