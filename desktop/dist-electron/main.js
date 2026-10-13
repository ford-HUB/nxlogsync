import Ut, { ipcMain as fo, app as cn, BrowserWindow as Io, Menu as nd } from "electron";
import { fileURLToPath as rd } from "node:url";
import Ze from "node:path";
import { mkdtemp as id, writeFile as od, rm as sd } from "node:fs/promises";
import At from "fs";
import ad from "constants";
import Jn from "stream";
import Po from "util";
import Il from "assert";
import Z from "path";
import Jr from "child_process";
import Pl from "events";
import Qn from "crypto";
import Nl from "tty";
import Qr from "os";
import Tt from "url";
import Dl from "zlib";
import ld from "http";
const cd = 99;
function ud(e) {
  fo.handle("printing:list-printers", async () => {
    const t = e();
    return t ? (await t.webContents.getPrintersAsync()).map((r) => ({ name: r.name, displayName: r.displayName || r.name, isDefault: r.isDefault })) : [];
  }), fo.handle("printing:print-html", async (t, n) => {
    if (typeof (n == null ? void 0 : n.html) != "string" || typeof n.deviceName != "string" || n.deviceName === "")
      return { ok: !1, message: "Pick a printer first." };
    const r = Math.min(cd, Math.max(1, Math.floor(Number(n.copies) || 1))), i = await id(Ze.join(cn.getPath("temp"), "nxlogsync-print-")), o = Ze.join(i, "print.html"), s = new Io({ show: !1, webPreferences: { javascript: !1, sandbox: !0 } });
    try {
      return await od(o, n.html, "utf8"), await s.loadFile(o), await new Promise((a) => {
        s.webContents.print(
          {
            silent: !0,
            deviceName: n.deviceName,
            copies: r,
            printBackground: !0,
            pageSize: "A4",
            margins: { marginType: "none" }
          },
          (c, m) => a(c ? { ok: !0 } : { ok: !1, message: m || "The printer did not accept the job." })
        );
      });
    } catch (a) {
      return { ok: !1, message: a instanceof Error ? a.message : String(a) };
    } finally {
      s.destroy(), await sd(i, { recursive: !0, force: !0 });
    }
  });
}
var Ce = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function fd(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Fl = {}, Mt = {}, Re = {};
Re.fromCallback = function(e) {
  return Object.defineProperty(function(...t) {
    if (typeof t[t.length - 1] == "function") e.apply(this, t);
    else
      return new Promise((n, r) => {
        t.push((i, o) => i != null ? r(i) : n(o)), e.apply(this, t);
      });
  }, "name", { value: e.name });
};
Re.fromPromise = function(e) {
  return Object.defineProperty(function(...t) {
    const n = t[t.length - 1];
    if (typeof n != "function") return e.apply(this, t);
    t.pop(), e.apply(this, t).then((r) => n(null, r), n);
  }, "name", { value: e.name });
};
var ft = ad, dd = process.cwd, Lr = null, hd = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return Lr || (Lr = dd.call(process)), Lr;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var Ns = process.chdir;
  process.chdir = function(e) {
    Lr = null, Ns.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, Ns);
}
var pd = md;
function md(e) {
  ft.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || n(e), e.chown = o(e.chown), e.fchown = o(e.fchown), e.lchown = o(e.lchown), e.chmod = r(e.chmod), e.fchmod = r(e.fchmod), e.lchmod = r(e.lchmod), e.chownSync = s(e.chownSync), e.fchownSync = s(e.fchownSync), e.lchownSync = s(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = a(e.stat), e.fstat = a(e.fstat), e.lstat = a(e.lstat), e.statSync = c(e.statSync), e.fstatSync = c(e.fstatSync), e.lstatSync = c(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(l, f, h) {
    h && process.nextTick(h);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(l, f, h, g) {
    g && process.nextTick(g);
  }, e.lchownSync = function() {
  }), hd === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(l) {
    function f(h, g, _) {
      var E = Date.now(), A = 0;
      l(h, g, function T(R) {
        if (R && (R.code === "EACCES" || R.code === "EPERM" || R.code === "EBUSY") && Date.now() - E < 6e4) {
          setTimeout(function() {
            e.stat(g, function(D, B) {
              D && D.code === "ENOENT" ? l(h, g, T) : _(R);
            });
          }, A), A < 100 && (A += 10);
          return;
        }
        _ && _(R);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(f, l), f;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(l) {
    function f(h, g, _, E, A, T) {
      var R;
      if (T && typeof T == "function") {
        var D = 0;
        R = function(B, G, J) {
          if (B && B.code === "EAGAIN" && D < 10)
            return D++, l.call(e, h, g, _, E, A, R);
          T.apply(this, arguments);
        };
      }
      return l.call(e, h, g, _, E, A, R);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(f, l), f;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(l) {
    return function(f, h, g, _, E) {
      for (var A = 0; ; )
        try {
          return l.call(e, f, h, g, _, E);
        } catch (T) {
          if (T.code === "EAGAIN" && A < 10) {
            A++;
            continue;
          }
          throw T;
        }
    };
  }(e.readSync);
  function t(l) {
    l.lchmod = function(f, h, g) {
      l.open(
        f,
        ft.O_WRONLY | ft.O_SYMLINK,
        h,
        function(_, E) {
          if (_) {
            g && g(_);
            return;
          }
          l.fchmod(E, h, function(A) {
            l.close(E, function(T) {
              g && g(A || T);
            });
          });
        }
      );
    }, l.lchmodSync = function(f, h) {
      var g = l.openSync(f, ft.O_WRONLY | ft.O_SYMLINK, h), _ = !0, E;
      try {
        E = l.fchmodSync(g, h), _ = !1;
      } finally {
        if (_)
          try {
            l.closeSync(g);
          } catch {
          }
        else
          l.closeSync(g);
      }
      return E;
    };
  }
  function n(l) {
    ft.hasOwnProperty("O_SYMLINK") && l.futimes ? (l.lutimes = function(f, h, g, _) {
      l.open(f, ft.O_SYMLINK, function(E, A) {
        if (E) {
          _ && _(E);
          return;
        }
        l.futimes(A, h, g, function(T) {
          l.close(A, function(R) {
            _ && _(T || R);
          });
        });
      });
    }, l.lutimesSync = function(f, h, g) {
      var _ = l.openSync(f, ft.O_SYMLINK), E, A = !0;
      try {
        E = l.futimesSync(_, h, g), A = !1;
      } finally {
        if (A)
          try {
            l.closeSync(_);
          } catch {
          }
        else
          l.closeSync(_);
      }
      return E;
    }) : l.futimes && (l.lutimes = function(f, h, g, _) {
      _ && process.nextTick(_);
    }, l.lutimesSync = function() {
    });
  }
  function r(l) {
    return l && function(f, h, g) {
      return l.call(e, f, h, function(_) {
        m(_) && (_ = null), g && g.apply(this, arguments);
      });
    };
  }
  function i(l) {
    return l && function(f, h) {
      try {
        return l.call(e, f, h);
      } catch (g) {
        if (!m(g)) throw g;
      }
    };
  }
  function o(l) {
    return l && function(f, h, g, _) {
      return l.call(e, f, h, g, function(E) {
        m(E) && (E = null), _ && _.apply(this, arguments);
      });
    };
  }
  function s(l) {
    return l && function(f, h, g) {
      try {
        return l.call(e, f, h, g);
      } catch (_) {
        if (!m(_)) throw _;
      }
    };
  }
  function a(l) {
    return l && function(f, h, g) {
      typeof h == "function" && (g = h, h = null);
      function _(E, A) {
        A && (A.uid < 0 && (A.uid += 4294967296), A.gid < 0 && (A.gid += 4294967296)), g && g.apply(this, arguments);
      }
      return h ? l.call(e, f, h, _) : l.call(e, f, _);
    };
  }
  function c(l) {
    return l && function(f, h) {
      var g = h ? l.call(e, f, h) : l.call(e, f);
      return g && (g.uid < 0 && (g.uid += 4294967296), g.gid < 0 && (g.gid += 4294967296)), g;
    };
  }
  function m(l) {
    if (!l || l.code === "ENOSYS")
      return !0;
    var f = !process.getuid || process.getuid() !== 0;
    return !!(f && (l.code === "EINVAL" || l.code === "EPERM"));
  }
}
var Ds = Jn.Stream, gd = Ed;
function Ed(e) {
  return {
    ReadStream: t,
    WriteStream: n
  };
  function t(r, i) {
    if (!(this instanceof t)) return new t(r, i);
    Ds.call(this);
    var o = this;
    this.path = r, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
    for (var s = Object.keys(i), a = 0, c = s.length; a < c; a++) {
      var m = s[a];
      this[m] = i[m];
    }
    if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.end === void 0)
        this.end = 1 / 0;
      else if (typeof this.end != "number")
        throw TypeError("end must be a Number");
      if (this.start > this.end)
        throw new Error("start must be <= end");
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        o._read();
      });
      return;
    }
    e.open(this.path, this.flags, this.mode, function(l, f) {
      if (l) {
        o.emit("error", l), o.readable = !1;
        return;
      }
      o.fd = f, o.emit("open", f), o._read();
    });
  }
  function n(r, i) {
    if (!(this instanceof n)) return new n(r, i);
    Ds.call(this), this.path = r, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
    for (var o = Object.keys(i), s = 0, a = o.length; s < a; s++) {
      var c = o[s];
      this[c] = i[c];
    }
    if (this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.start < 0)
        throw new Error("start must be >= zero");
      this.pos = this.start;
    }
    this.busy = !1, this._queue = [], this.fd === null && (this._open = e.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
  }
}
var yd = _d, wd = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function _d(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: wd(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(n) {
    Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(e, n));
  }), t;
}
var re = At, vd = pd, Ad = gd, Td = yd, wr = Po, Ee, Br;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (Ee = Symbol.for("graceful-fs.queue"), Br = Symbol.for("graceful-fs.previous")) : (Ee = "___graceful-fs.queue", Br = "___graceful-fs.previous");
function Sd() {
}
function xl(e, t) {
  Object.defineProperty(e, Ee, {
    get: function() {
      return t;
    }
  });
}
var Lt = Sd;
wr.debuglog ? Lt = wr.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (Lt = function() {
  var e = wr.format.apply(wr, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!re[Ee]) {
  var bd = Ce[Ee] || [];
  xl(re, bd), re.close = function(e) {
    function t(n, r) {
      return e.call(re, n, function(i) {
        i || Fs(), typeof r == "function" && r.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, Br, {
      value: e
    }), t;
  }(re.close), re.closeSync = function(e) {
    function t(n) {
      e.apply(re, arguments), Fs();
    }
    return Object.defineProperty(t, Br, {
      value: e
    }), t;
  }(re.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    Lt(re[Ee]), Il.equal(re[Ee].length, 0);
  });
}
Ce[Ee] || xl(Ce, re[Ee]);
var Oe = No(Td(re));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !re.__patched && (Oe = No(re), re.__patched = !0);
function No(e) {
  vd(e), e.gracefulify = No, e.createReadStream = G, e.createWriteStream = J;
  var t = e.readFile;
  e.readFile = n;
  function n(U, y, H) {
    return typeof y == "function" && (H = y, y = null), Y(U, y, H);
    function Y(ee, O, $, P) {
      return t(ee, O, function(C) {
        C && (C.code === "EMFILE" || C.code === "ENFILE") ? Yt([Y, [ee, O, $], C, P || Date.now(), Date.now()]) : typeof $ == "function" && $.apply(this, arguments);
      });
    }
  }
  var r = e.writeFile;
  e.writeFile = i;
  function i(U, y, H, Y) {
    return typeof H == "function" && (Y = H, H = null), ee(U, y, H, Y);
    function ee(O, $, P, C, N) {
      return r(O, $, P, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? Yt([ee, [O, $, P, C], I, N || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var o = e.appendFile;
  o && (e.appendFile = s);
  function s(U, y, H, Y) {
    return typeof H == "function" && (Y = H, H = null), ee(U, y, H, Y);
    function ee(O, $, P, C, N) {
      return o(O, $, P, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? Yt([ee, [O, $, P, C], I, N || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var a = e.copyFile;
  a && (e.copyFile = c);
  function c(U, y, H, Y) {
    return typeof H == "function" && (Y = H, H = 0), ee(U, y, H, Y);
    function ee(O, $, P, C, N) {
      return a(O, $, P, function(I) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? Yt([ee, [O, $, P, C], I, N || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  var m = e.readdir;
  e.readdir = f;
  var l = /^v[0-5]\./;
  function f(U, y, H) {
    typeof y == "function" && (H = y, y = null);
    var Y = l.test(process.version) ? function($, P, C, N) {
      return m($, ee(
        $,
        P,
        C,
        N
      ));
    } : function($, P, C, N) {
      return m($, P, ee(
        $,
        P,
        C,
        N
      ));
    };
    return Y(U, y, H);
    function ee(O, $, P, C) {
      return function(N, I) {
        N && (N.code === "EMFILE" || N.code === "ENFILE") ? Yt([
          Y,
          [O, $, P],
          N,
          C || Date.now(),
          Date.now()
        ]) : (I && I.sort && I.sort(), typeof P == "function" && P.call(this, N, I));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var h = Ad(e);
    T = h.ReadStream, D = h.WriteStream;
  }
  var g = e.ReadStream;
  g && (T.prototype = Object.create(g.prototype), T.prototype.open = R);
  var _ = e.WriteStream;
  _ && (D.prototype = Object.create(_.prototype), D.prototype.open = B), Object.defineProperty(e, "ReadStream", {
    get: function() {
      return T;
    },
    set: function(U) {
      T = U;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "WriteStream", {
    get: function() {
      return D;
    },
    set: function(U) {
      D = U;
    },
    enumerable: !0,
    configurable: !0
  });
  var E = T;
  Object.defineProperty(e, "FileReadStream", {
    get: function() {
      return E;
    },
    set: function(U) {
      E = U;
    },
    enumerable: !0,
    configurable: !0
  });
  var A = D;
  Object.defineProperty(e, "FileWriteStream", {
    get: function() {
      return A;
    },
    set: function(U) {
      A = U;
    },
    enumerable: !0,
    configurable: !0
  });
  function T(U, y) {
    return this instanceof T ? (g.apply(this, arguments), this) : T.apply(Object.create(T.prototype), arguments);
  }
  function R() {
    var U = this;
    oe(U.path, U.flags, U.mode, function(y, H) {
      y ? (U.autoClose && U.destroy(), U.emit("error", y)) : (U.fd = H, U.emit("open", H), U.read());
    });
  }
  function D(U, y) {
    return this instanceof D ? (_.apply(this, arguments), this) : D.apply(Object.create(D.prototype), arguments);
  }
  function B() {
    var U = this;
    oe(U.path, U.flags, U.mode, function(y, H) {
      y ? (U.destroy(), U.emit("error", y)) : (U.fd = H, U.emit("open", H));
    });
  }
  function G(U, y) {
    return new e.ReadStream(U, y);
  }
  function J(U, y) {
    return new e.WriteStream(U, y);
  }
  var Q = e.open;
  e.open = oe;
  function oe(U, y, H, Y) {
    return typeof H == "function" && (Y = H, H = null), ee(U, y, H, Y);
    function ee(O, $, P, C, N) {
      return Q(O, $, P, function(I, k) {
        I && (I.code === "EMFILE" || I.code === "ENFILE") ? Yt([ee, [O, $, P, C], I, N || Date.now(), Date.now()]) : typeof C == "function" && C.apply(this, arguments);
      });
    }
  }
  return e;
}
function Yt(e) {
  Lt("ENQUEUE", e[0].name, e[1]), re[Ee].push(e), Do();
}
var _r;
function Fs() {
  for (var e = Date.now(), t = 0; t < re[Ee].length; ++t)
    re[Ee][t].length > 2 && (re[Ee][t][3] = e, re[Ee][t][4] = e);
  Do();
}
function Do() {
  if (clearTimeout(_r), _r = void 0, re[Ee].length !== 0) {
    var e = re[Ee].shift(), t = e[0], n = e[1], r = e[2], i = e[3], o = e[4];
    if (i === void 0)
      Lt("RETRY", t.name, n), t.apply(null, n);
    else if (Date.now() - i >= 6e4) {
      Lt("TIMEOUT", t.name, n);
      var s = n.pop();
      typeof s == "function" && s.call(null, r);
    } else {
      var a = Date.now() - o, c = Math.max(o - i, 1), m = Math.min(c * 1.2, 100);
      a >= m ? (Lt("RETRY", t.name, n), t.apply(null, n.concat([i]))) : re[Ee].push(e);
    }
    _r === void 0 && (_r = setTimeout(Do, 0));
  }
}
(function(e) {
  const t = Re.fromCallback, n = Oe, r = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((i) => typeof n[i] == "function");
  Object.assign(e, n), r.forEach((i) => {
    e[i] = t(n[i]);
  }), e.exists = function(i, o) {
    return typeof o == "function" ? n.exists(i, o) : new Promise((s) => n.exists(i, s));
  }, e.read = function(i, o, s, a, c, m) {
    return typeof m == "function" ? n.read(i, o, s, a, c, m) : new Promise((l, f) => {
      n.read(i, o, s, a, c, (h, g, _) => {
        if (h) return f(h);
        l({ bytesRead: g, buffer: _ });
      });
    });
  }, e.write = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? n.write(i, o, ...s) : new Promise((a, c) => {
      n.write(i, o, ...s, (m, l, f) => {
        if (m) return c(m);
        a({ bytesWritten: l, buffer: f });
      });
    });
  }, typeof n.writev == "function" && (e.writev = function(i, o, ...s) {
    return typeof s[s.length - 1] == "function" ? n.writev(i, o, ...s) : new Promise((a, c) => {
      n.writev(i, o, ...s, (m, l, f) => {
        if (m) return c(m);
        a({ bytesWritten: l, buffers: f });
      });
    });
  }), typeof n.realpath.native == "function" ? e.realpath.native = t(n.realpath.native) : process.emitWarning(
    "fs.realpath.native is not a function. Is fs being monkey-patched?",
    "Warning",
    "fs-extra-WARN0003"
  );
})(Mt);
var Fo = {}, Ll = {};
const Cd = Z;
Ll.checkPath = function(t) {
  if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(Cd.parse(t).root, ""))) {
    const r = new Error(`Path contains invalid characters: ${t}`);
    throw r.code = "EINVAL", r;
  }
};
const Ul = Mt, { checkPath: kl } = Ll, Ml = (e) => {
  const t = { mode: 511 };
  return typeof e == "number" ? e : { ...t, ...e }.mode;
};
Fo.makeDir = async (e, t) => (kl(e), Ul.mkdir(e, {
  mode: Ml(t),
  recursive: !0
}));
Fo.makeDirSync = (e, t) => (kl(e), Ul.mkdirSync(e, {
  mode: Ml(t),
  recursive: !0
}));
const $d = Re.fromPromise, { makeDir: Rd, makeDirSync: Oi } = Fo, Ii = $d(Rd);
var tt = {
  mkdirs: Ii,
  mkdirsSync: Oi,
  // alias
  mkdirp: Ii,
  mkdirpSync: Oi,
  ensureDir: Ii,
  ensureDirSync: Oi
};
const Od = Re.fromPromise, Bl = Mt;
function Id(e) {
  return Bl.access(e).then(() => !0).catch(() => !1);
}
var Bt = {
  pathExists: Od(Id),
  pathExistsSync: Bl.existsSync
};
const an = Oe;
function Pd(e, t, n, r) {
  an.open(e, "r+", (i, o) => {
    if (i) return r(i);
    an.futimes(o, t, n, (s) => {
      an.close(o, (a) => {
        r && r(s || a);
      });
    });
  });
}
function Nd(e, t, n) {
  const r = an.openSync(e, "r+");
  return an.futimesSync(r, t, n), an.closeSync(r);
}
var jl = {
  utimesMillis: Pd,
  utimesMillisSync: Nd
};
const un = Mt, pe = Z, Dd = Po;
function Fd(e, t, n) {
  const r = n.dereference ? (i) => un.stat(i, { bigint: !0 }) : (i) => un.lstat(i, { bigint: !0 });
  return Promise.all([
    r(e),
    r(t).catch((i) => {
      if (i.code === "ENOENT") return null;
      throw i;
    })
  ]).then(([i, o]) => ({ srcStat: i, destStat: o }));
}
function xd(e, t, n) {
  let r;
  const i = n.dereference ? (s) => un.statSync(s, { bigint: !0 }) : (s) => un.lstatSync(s, { bigint: !0 }), o = i(e);
  try {
    r = i(t);
  } catch (s) {
    if (s.code === "ENOENT") return { srcStat: o, destStat: null };
    throw s;
  }
  return { srcStat: o, destStat: r };
}
function Ld(e, t, n, r, i) {
  Dd.callbackify(Fd)(e, t, r, (o, s) => {
    if (o) return i(o);
    const { srcStat: a, destStat: c } = s;
    if (c) {
      if (Zn(a, c)) {
        const m = pe.basename(e), l = pe.basename(t);
        return n === "move" && m !== l && m.toLowerCase() === l.toLowerCase() ? i(null, { srcStat: a, destStat: c, isChangingCase: !0 }) : i(new Error("Source and destination must not be the same."));
      }
      if (a.isDirectory() && !c.isDirectory())
        return i(new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`));
      if (!a.isDirectory() && c.isDirectory())
        return i(new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`));
    }
    return a.isDirectory() && xo(e, t) ? i(new Error(Zr(e, t, n))) : i(null, { srcStat: a, destStat: c });
  });
}
function Ud(e, t, n, r) {
  const { srcStat: i, destStat: o } = xd(e, t, r);
  if (o) {
    if (Zn(i, o)) {
      const s = pe.basename(e), a = pe.basename(t);
      if (n === "move" && s !== a && s.toLowerCase() === a.toLowerCase())
        return { srcStat: i, destStat: o, isChangingCase: !0 };
      throw new Error("Source and destination must not be the same.");
    }
    if (i.isDirectory() && !o.isDirectory())
      throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);
    if (!i.isDirectory() && o.isDirectory())
      throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`);
  }
  if (i.isDirectory() && xo(e, t))
    throw new Error(Zr(e, t, n));
  return { srcStat: i, destStat: o };
}
function Hl(e, t, n, r, i) {
  const o = pe.resolve(pe.dirname(e)), s = pe.resolve(pe.dirname(n));
  if (s === o || s === pe.parse(s).root) return i();
  un.stat(s, { bigint: !0 }, (a, c) => a ? a.code === "ENOENT" ? i() : i(a) : Zn(t, c) ? i(new Error(Zr(e, n, r))) : Hl(e, t, s, r, i));
}
function Gl(e, t, n, r) {
  const i = pe.resolve(pe.dirname(e)), o = pe.resolve(pe.dirname(n));
  if (o === i || o === pe.parse(o).root) return;
  let s;
  try {
    s = un.statSync(o, { bigint: !0 });
  } catch (a) {
    if (a.code === "ENOENT") return;
    throw a;
  }
  if (Zn(t, s))
    throw new Error(Zr(e, n, r));
  return Gl(e, t, o, r);
}
function Zn(e, t) {
  return t.ino && t.dev && t.ino === e.ino && t.dev === e.dev;
}
function xo(e, t) {
  const n = pe.resolve(e).split(pe.sep).filter((i) => i), r = pe.resolve(t).split(pe.sep).filter((i) => i);
  return n.reduce((i, o, s) => i && r[s] === o, !0);
}
function Zr(e, t, n) {
  return `Cannot ${n} '${e}' to a subdirectory of itself, '${t}'.`;
}
var pn = {
  checkPaths: Ld,
  checkPathsSync: Ud,
  checkParentPaths: Hl,
  checkParentPathsSync: Gl,
  isSrcSubdir: xo,
  areIdentical: Zn
};
const Ne = Oe, Ln = Z, kd = tt.mkdirs, Md = Bt.pathExists, Bd = jl.utimesMillis, Un = pn;
function jd(e, t, n, r) {
  typeof n == "function" && !r ? (r = n, n = {}) : typeof n == "function" && (n = { filter: n }), r = r || function() {
  }, n = n || {}, n.clobber = "clobber" in n ? !!n.clobber : !0, n.overwrite = "overwrite" in n ? !!n.overwrite : n.clobber, n.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0001"
  ), Un.checkPaths(e, t, "copy", n, (i, o) => {
    if (i) return r(i);
    const { srcStat: s, destStat: a } = o;
    Un.checkParentPaths(e, s, t, "copy", (c) => c ? r(c) : n.filter ? ql(xs, a, e, t, n, r) : xs(a, e, t, n, r));
  });
}
function xs(e, t, n, r, i) {
  const o = Ln.dirname(n);
  Md(o, (s, a) => {
    if (s) return i(s);
    if (a) return jr(e, t, n, r, i);
    kd(o, (c) => c ? i(c) : jr(e, t, n, r, i));
  });
}
function ql(e, t, n, r, i, o) {
  Promise.resolve(i.filter(n, r)).then((s) => s ? e(t, n, r, i, o) : o(), (s) => o(s));
}
function Hd(e, t, n, r, i) {
  return r.filter ? ql(jr, e, t, n, r, i) : jr(e, t, n, r, i);
}
function jr(e, t, n, r, i) {
  (r.dereference ? Ne.stat : Ne.lstat)(t, (s, a) => s ? i(s) : a.isDirectory() ? Xd(a, e, t, n, r, i) : a.isFile() || a.isCharacterDevice() || a.isBlockDevice() ? Gd(a, e, t, n, r, i) : a.isSymbolicLink() ? Qd(e, t, n, r, i) : a.isSocket() ? i(new Error(`Cannot copy a socket file: ${t}`)) : a.isFIFO() ? i(new Error(`Cannot copy a FIFO pipe: ${t}`)) : i(new Error(`Unknown file: ${t}`)));
}
function Gd(e, t, n, r, i, o) {
  return t ? qd(e, n, r, i, o) : Vl(e, n, r, i, o);
}
function qd(e, t, n, r, i) {
  if (r.overwrite)
    Ne.unlink(n, (o) => o ? i(o) : Vl(e, t, n, r, i));
  else return r.errorOnExist ? i(new Error(`'${n}' already exists`)) : i();
}
function Vl(e, t, n, r, i) {
  Ne.copyFile(t, n, (o) => o ? i(o) : r.preserveTimestamps ? Vd(e.mode, t, n, i) : ei(n, e.mode, i));
}
function Vd(e, t, n, r) {
  return Wd(e) ? Yd(n, e, (i) => i ? r(i) : Ls(e, t, n, r)) : Ls(e, t, n, r);
}
function Wd(e) {
  return (e & 128) === 0;
}
function Yd(e, t, n) {
  return ei(e, t | 128, n);
}
function Ls(e, t, n, r) {
  zd(t, n, (i) => i ? r(i) : ei(n, e, r));
}
function ei(e, t, n) {
  return Ne.chmod(e, t, n);
}
function zd(e, t, n) {
  Ne.stat(e, (r, i) => r ? n(r) : Bd(t, i.atime, i.mtime, n));
}
function Xd(e, t, n, r, i, o) {
  return t ? Wl(n, r, i, o) : Kd(e.mode, n, r, i, o);
}
function Kd(e, t, n, r, i) {
  Ne.mkdir(n, (o) => {
    if (o) return i(o);
    Wl(t, n, r, (s) => s ? i(s) : ei(n, e, i));
  });
}
function Wl(e, t, n, r) {
  Ne.readdir(e, (i, o) => i ? r(i) : Yl(o, e, t, n, r));
}
function Yl(e, t, n, r, i) {
  const o = e.pop();
  return o ? Jd(e, o, t, n, r, i) : i();
}
function Jd(e, t, n, r, i, o) {
  const s = Ln.join(n, t), a = Ln.join(r, t);
  Un.checkPaths(s, a, "copy", i, (c, m) => {
    if (c) return o(c);
    const { destStat: l } = m;
    Hd(l, s, a, i, (f) => f ? o(f) : Yl(e, n, r, i, o));
  });
}
function Qd(e, t, n, r, i) {
  Ne.readlink(t, (o, s) => {
    if (o) return i(o);
    if (r.dereference && (s = Ln.resolve(process.cwd(), s)), e)
      Ne.readlink(n, (a, c) => a ? a.code === "EINVAL" || a.code === "UNKNOWN" ? Ne.symlink(s, n, i) : i(a) : (r.dereference && (c = Ln.resolve(process.cwd(), c)), Un.isSrcSubdir(s, c) ? i(new Error(`Cannot copy '${s}' to a subdirectory of itself, '${c}'.`)) : e.isDirectory() && Un.isSrcSubdir(c, s) ? i(new Error(`Cannot overwrite '${c}' with '${s}'.`)) : Zd(s, n, i)));
    else
      return Ne.symlink(s, n, i);
  });
}
function Zd(e, t, n) {
  Ne.unlink(t, (r) => r ? n(r) : Ne.symlink(e, t, n));
}
var eh = jd;
const Te = Oe, kn = Z, th = tt.mkdirsSync, nh = jl.utimesMillisSync, Mn = pn;
function rh(e, t, n) {
  typeof n == "function" && (n = { filter: n }), n = n || {}, n.clobber = "clobber" in n ? !!n.clobber : !0, n.overwrite = "overwrite" in n ? !!n.overwrite : n.clobber, n.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0002"
  );
  const { srcStat: r, destStat: i } = Mn.checkPathsSync(e, t, "copy", n);
  return Mn.checkParentPathsSync(e, r, t, "copy"), ih(i, e, t, n);
}
function ih(e, t, n, r) {
  if (r.filter && !r.filter(t, n)) return;
  const i = kn.dirname(n);
  return Te.existsSync(i) || th(i), zl(e, t, n, r);
}
function oh(e, t, n, r) {
  if (!(r.filter && !r.filter(t, n)))
    return zl(e, t, n, r);
}
function zl(e, t, n, r) {
  const o = (r.dereference ? Te.statSync : Te.lstatSync)(t);
  if (o.isDirectory()) return dh(o, e, t, n, r);
  if (o.isFile() || o.isCharacterDevice() || o.isBlockDevice()) return sh(o, e, t, n, r);
  if (o.isSymbolicLink()) return mh(e, t, n, r);
  throw o.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : o.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
}
function sh(e, t, n, r, i) {
  return t ? ah(e, n, r, i) : Xl(e, n, r, i);
}
function ah(e, t, n, r) {
  if (r.overwrite)
    return Te.unlinkSync(n), Xl(e, t, n, r);
  if (r.errorOnExist)
    throw new Error(`'${n}' already exists`);
}
function Xl(e, t, n, r) {
  return Te.copyFileSync(t, n), r.preserveTimestamps && lh(e.mode, t, n), Lo(n, e.mode);
}
function lh(e, t, n) {
  return ch(e) && uh(n, e), fh(t, n);
}
function ch(e) {
  return (e & 128) === 0;
}
function uh(e, t) {
  return Lo(e, t | 128);
}
function Lo(e, t) {
  return Te.chmodSync(e, t);
}
function fh(e, t) {
  const n = Te.statSync(e);
  return nh(t, n.atime, n.mtime);
}
function dh(e, t, n, r, i) {
  return t ? Kl(n, r, i) : hh(e.mode, n, r, i);
}
function hh(e, t, n, r) {
  return Te.mkdirSync(n), Kl(t, n, r), Lo(n, e);
}
function Kl(e, t, n) {
  Te.readdirSync(e).forEach((r) => ph(r, e, t, n));
}
function ph(e, t, n, r) {
  const i = kn.join(t, e), o = kn.join(n, e), { destStat: s } = Mn.checkPathsSync(i, o, "copy", r);
  return oh(s, i, o, r);
}
function mh(e, t, n, r) {
  let i = Te.readlinkSync(t);
  if (r.dereference && (i = kn.resolve(process.cwd(), i)), e) {
    let o;
    try {
      o = Te.readlinkSync(n);
    } catch (s) {
      if (s.code === "EINVAL" || s.code === "UNKNOWN") return Te.symlinkSync(i, n);
      throw s;
    }
    if (r.dereference && (o = kn.resolve(process.cwd(), o)), Mn.isSrcSubdir(i, o))
      throw new Error(`Cannot copy '${i}' to a subdirectory of itself, '${o}'.`);
    if (Te.statSync(n).isDirectory() && Mn.isSrcSubdir(o, i))
      throw new Error(`Cannot overwrite '${o}' with '${i}'.`);
    return gh(i, n);
  } else
    return Te.symlinkSync(i, n);
}
function gh(e, t) {
  return Te.unlinkSync(t), Te.symlinkSync(e, t);
}
var Eh = rh;
const yh = Re.fromCallback;
var Uo = {
  copy: yh(eh),
  copySync: Eh
};
const Us = Oe, Jl = Z, X = Il, Bn = process.platform === "win32";
function Ql(e) {
  [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ].forEach((n) => {
    e[n] = e[n] || Us[n], n = n + "Sync", e[n] = e[n] || Us[n];
  }), e.maxBusyTries = e.maxBusyTries || 3;
}
function ko(e, t, n) {
  let r = 0;
  typeof t == "function" && (n = t, t = {}), X(e, "rimraf: missing path"), X.strictEqual(typeof e, "string", "rimraf: path should be a string"), X.strictEqual(typeof n, "function", "rimraf: callback function required"), X(t, "rimraf: invalid options argument provided"), X.strictEqual(typeof t, "object", "rimraf: options should be object"), Ql(t), ks(e, t, function i(o) {
    if (o) {
      if ((o.code === "EBUSY" || o.code === "ENOTEMPTY" || o.code === "EPERM") && r < t.maxBusyTries) {
        r++;
        const s = r * 100;
        return setTimeout(() => ks(e, t, i), s);
      }
      o.code === "ENOENT" && (o = null);
    }
    n(o);
  });
}
function ks(e, t, n) {
  X(e), X(t), X(typeof n == "function"), t.lstat(e, (r, i) => {
    if (r && r.code === "ENOENT")
      return n(null);
    if (r && r.code === "EPERM" && Bn)
      return Ms(e, t, r, n);
    if (i && i.isDirectory())
      return Ur(e, t, r, n);
    t.unlink(e, (o) => {
      if (o) {
        if (o.code === "ENOENT")
          return n(null);
        if (o.code === "EPERM")
          return Bn ? Ms(e, t, o, n) : Ur(e, t, o, n);
        if (o.code === "EISDIR")
          return Ur(e, t, o, n);
      }
      return n(o);
    });
  });
}
function Ms(e, t, n, r) {
  X(e), X(t), X(typeof r == "function"), t.chmod(e, 438, (i) => {
    i ? r(i.code === "ENOENT" ? null : n) : t.stat(e, (o, s) => {
      o ? r(o.code === "ENOENT" ? null : n) : s.isDirectory() ? Ur(e, t, n, r) : t.unlink(e, r);
    });
  });
}
function Bs(e, t, n) {
  let r;
  X(e), X(t);
  try {
    t.chmodSync(e, 438);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw n;
  }
  try {
    r = t.statSync(e);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw n;
  }
  r.isDirectory() ? kr(e, t, n) : t.unlinkSync(e);
}
function Ur(e, t, n, r) {
  X(e), X(t), X(typeof r == "function"), t.rmdir(e, (i) => {
    i && (i.code === "ENOTEMPTY" || i.code === "EEXIST" || i.code === "EPERM") ? wh(e, t, r) : i && i.code === "ENOTDIR" ? r(n) : r(i);
  });
}
function wh(e, t, n) {
  X(e), X(t), X(typeof n == "function"), t.readdir(e, (r, i) => {
    if (r) return n(r);
    let o = i.length, s;
    if (o === 0) return t.rmdir(e, n);
    i.forEach((a) => {
      ko(Jl.join(e, a), t, (c) => {
        if (!s) {
          if (c) return n(s = c);
          --o === 0 && t.rmdir(e, n);
        }
      });
    });
  });
}
function Zl(e, t) {
  let n;
  t = t || {}, Ql(t), X(e, "rimraf: missing path"), X.strictEqual(typeof e, "string", "rimraf: path should be a string"), X(t, "rimraf: missing options"), X.strictEqual(typeof t, "object", "rimraf: options should be object");
  try {
    n = t.lstatSync(e);
  } catch (r) {
    if (r.code === "ENOENT")
      return;
    r.code === "EPERM" && Bn && Bs(e, t, r);
  }
  try {
    n && n.isDirectory() ? kr(e, t, null) : t.unlinkSync(e);
  } catch (r) {
    if (r.code === "ENOENT")
      return;
    if (r.code === "EPERM")
      return Bn ? Bs(e, t, r) : kr(e, t, r);
    if (r.code !== "EISDIR")
      throw r;
    kr(e, t, r);
  }
}
function kr(e, t, n) {
  X(e), X(t);
  try {
    t.rmdirSync(e);
  } catch (r) {
    if (r.code === "ENOTDIR")
      throw n;
    if (r.code === "ENOTEMPTY" || r.code === "EEXIST" || r.code === "EPERM")
      _h(e, t);
    else if (r.code !== "ENOENT")
      throw r;
  }
}
function _h(e, t) {
  if (X(e), X(t), t.readdirSync(e).forEach((n) => Zl(Jl.join(e, n), t)), Bn) {
    const n = Date.now();
    do
      try {
        return t.rmdirSync(e, t);
      } catch {
      }
    while (Date.now() - n < 500);
  } else
    return t.rmdirSync(e, t);
}
var vh = ko;
ko.sync = Zl;
const Hr = Oe, Ah = Re.fromCallback, ec = vh;
function Th(e, t) {
  if (Hr.rm) return Hr.rm(e, { recursive: !0, force: !0 }, t);
  ec(e, t);
}
function Sh(e) {
  if (Hr.rmSync) return Hr.rmSync(e, { recursive: !0, force: !0 });
  ec.sync(e);
}
var ti = {
  remove: Ah(Th),
  removeSync: Sh
};
const bh = Re.fromPromise, tc = Mt, nc = Z, rc = tt, ic = ti, js = bh(async function(t) {
  let n;
  try {
    n = await tc.readdir(t);
  } catch {
    return rc.mkdirs(t);
  }
  return Promise.all(n.map((r) => ic.remove(nc.join(t, r))));
});
function Hs(e) {
  let t;
  try {
    t = tc.readdirSync(e);
  } catch {
    return rc.mkdirsSync(e);
  }
  t.forEach((n) => {
    n = nc.join(e, n), ic.removeSync(n);
  });
}
var Ch = {
  emptyDirSync: Hs,
  emptydirSync: Hs,
  emptyDir: js,
  emptydir: js
};
const $h = Re.fromCallback, oc = Z, mt = Oe, sc = tt;
function Rh(e, t) {
  function n() {
    mt.writeFile(e, "", (r) => {
      if (r) return t(r);
      t();
    });
  }
  mt.stat(e, (r, i) => {
    if (!r && i.isFile()) return t();
    const o = oc.dirname(e);
    mt.stat(o, (s, a) => {
      if (s)
        return s.code === "ENOENT" ? sc.mkdirs(o, (c) => {
          if (c) return t(c);
          n();
        }) : t(s);
      a.isDirectory() ? n() : mt.readdir(o, (c) => {
        if (c) return t(c);
      });
    });
  });
}
function Oh(e) {
  let t;
  try {
    t = mt.statSync(e);
  } catch {
  }
  if (t && t.isFile()) return;
  const n = oc.dirname(e);
  try {
    mt.statSync(n).isDirectory() || mt.readdirSync(n);
  } catch (r) {
    if (r && r.code === "ENOENT") sc.mkdirsSync(n);
    else throw r;
  }
  mt.writeFileSync(e, "");
}
var Ih = {
  createFile: $h(Rh),
  createFileSync: Oh
};
const Ph = Re.fromCallback, ac = Z, pt = Oe, lc = tt, Nh = Bt.pathExists, { areIdentical: cc } = pn;
function Dh(e, t, n) {
  function r(i, o) {
    pt.link(i, o, (s) => {
      if (s) return n(s);
      n(null);
    });
  }
  pt.lstat(t, (i, o) => {
    pt.lstat(e, (s, a) => {
      if (s)
        return s.message = s.message.replace("lstat", "ensureLink"), n(s);
      if (o && cc(a, o)) return n(null);
      const c = ac.dirname(t);
      Nh(c, (m, l) => {
        if (m) return n(m);
        if (l) return r(e, t);
        lc.mkdirs(c, (f) => {
          if (f) return n(f);
          r(e, t);
        });
      });
    });
  });
}
function Fh(e, t) {
  let n;
  try {
    n = pt.lstatSync(t);
  } catch {
  }
  try {
    const o = pt.lstatSync(e);
    if (n && cc(o, n)) return;
  } catch (o) {
    throw o.message = o.message.replace("lstat", "ensureLink"), o;
  }
  const r = ac.dirname(t);
  return pt.existsSync(r) || lc.mkdirsSync(r), pt.linkSync(e, t);
}
var xh = {
  createLink: Ph(Dh),
  createLinkSync: Fh
};
const gt = Z, Nn = Oe, Lh = Bt.pathExists;
function Uh(e, t, n) {
  if (gt.isAbsolute(e))
    return Nn.lstat(e, (r) => r ? (r.message = r.message.replace("lstat", "ensureSymlink"), n(r)) : n(null, {
      toCwd: e,
      toDst: e
    }));
  {
    const r = gt.dirname(t), i = gt.join(r, e);
    return Lh(i, (o, s) => o ? n(o) : s ? n(null, {
      toCwd: i,
      toDst: e
    }) : Nn.lstat(e, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), n(a)) : n(null, {
      toCwd: e,
      toDst: gt.relative(r, e)
    })));
  }
}
function kh(e, t) {
  let n;
  if (gt.isAbsolute(e)) {
    if (n = Nn.existsSync(e), !n) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: e,
      toDst: e
    };
  } else {
    const r = gt.dirname(t), i = gt.join(r, e);
    if (n = Nn.existsSync(i), n)
      return {
        toCwd: i,
        toDst: e
      };
    if (n = Nn.existsSync(e), !n) throw new Error("relative srcpath does not exist");
    return {
      toCwd: e,
      toDst: gt.relative(r, e)
    };
  }
}
var Mh = {
  symlinkPaths: Uh,
  symlinkPathsSync: kh
};
const uc = Oe;
function Bh(e, t, n) {
  if (n = typeof t == "function" ? t : n, t = typeof t == "function" ? !1 : t, t) return n(null, t);
  uc.lstat(e, (r, i) => {
    if (r) return n(null, "file");
    t = i && i.isDirectory() ? "dir" : "file", n(null, t);
  });
}
function jh(e, t) {
  let n;
  if (t) return t;
  try {
    n = uc.lstatSync(e);
  } catch {
    return "file";
  }
  return n && n.isDirectory() ? "dir" : "file";
}
var Hh = {
  symlinkType: Bh,
  symlinkTypeSync: jh
};
const Gh = Re.fromCallback, fc = Z, Ge = Mt, dc = tt, qh = dc.mkdirs, Vh = dc.mkdirsSync, hc = Mh, Wh = hc.symlinkPaths, Yh = hc.symlinkPathsSync, pc = Hh, zh = pc.symlinkType, Xh = pc.symlinkTypeSync, Kh = Bt.pathExists, { areIdentical: mc } = pn;
function Jh(e, t, n, r) {
  r = typeof n == "function" ? n : r, n = typeof n == "function" ? !1 : n, Ge.lstat(t, (i, o) => {
    !i && o.isSymbolicLink() ? Promise.all([
      Ge.stat(e),
      Ge.stat(t)
    ]).then(([s, a]) => {
      if (mc(s, a)) return r(null);
      Gs(e, t, n, r);
    }) : Gs(e, t, n, r);
  });
}
function Gs(e, t, n, r) {
  Wh(e, t, (i, o) => {
    if (i) return r(i);
    e = o.toDst, zh(o.toCwd, n, (s, a) => {
      if (s) return r(s);
      const c = fc.dirname(t);
      Kh(c, (m, l) => {
        if (m) return r(m);
        if (l) return Ge.symlink(e, t, a, r);
        qh(c, (f) => {
          if (f) return r(f);
          Ge.symlink(e, t, a, r);
        });
      });
    });
  });
}
function Qh(e, t, n) {
  let r;
  try {
    r = Ge.lstatSync(t);
  } catch {
  }
  if (r && r.isSymbolicLink()) {
    const a = Ge.statSync(e), c = Ge.statSync(t);
    if (mc(a, c)) return;
  }
  const i = Yh(e, t);
  e = i.toDst, n = Xh(i.toCwd, n);
  const o = fc.dirname(t);
  return Ge.existsSync(o) || Vh(o), Ge.symlinkSync(e, t, n);
}
var Zh = {
  createSymlink: Gh(Jh),
  createSymlinkSync: Qh
};
const { createFile: qs, createFileSync: Vs } = Ih, { createLink: Ws, createLinkSync: Ys } = xh, { createSymlink: zs, createSymlinkSync: Xs } = Zh;
var ep = {
  // file
  createFile: qs,
  createFileSync: Vs,
  ensureFile: qs,
  ensureFileSync: Vs,
  // link
  createLink: Ws,
  createLinkSync: Ys,
  ensureLink: Ws,
  ensureLinkSync: Ys,
  // symlink
  createSymlink: zs,
  createSymlinkSync: Xs,
  ensureSymlink: zs,
  ensureSymlinkSync: Xs
};
function tp(e, { EOL: t = `
`, finalEOL: n = !0, replacer: r = null, spaces: i } = {}) {
  const o = n ? t : "", s = JSON.stringify(e, r, i);
  if (s === void 0)
    throw new TypeError(`Converting ${typeof e} value to JSON is not supported`);
  return s.replace(/\n/g, t) + o;
}
function np(e) {
  return Buffer.isBuffer(e) && (e = e.toString("utf8")), e.replace(/^\uFEFF/, "");
}
var Mo = { stringify: tp, stripBom: np };
let fn;
try {
  fn = Oe;
} catch {
  fn = At;
}
const ni = Re, { stringify: gc, stripBom: Ec } = Mo;
async function rp(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const n = t.fs || fn, r = "throws" in t ? t.throws : !0;
  let i = await ni.fromCallback(n.readFile)(e, t);
  i = Ec(i);
  let o;
  try {
    o = JSON.parse(i, t ? t.reviver : null);
  } catch (s) {
    if (r)
      throw s.message = `${e}: ${s.message}`, s;
    return null;
  }
  return o;
}
const ip = ni.fromPromise(rp);
function op(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const n = t.fs || fn, r = "throws" in t ? t.throws : !0;
  try {
    let i = n.readFileSync(e, t);
    return i = Ec(i), JSON.parse(i, t.reviver);
  } catch (i) {
    if (r)
      throw i.message = `${e}: ${i.message}`, i;
    return null;
  }
}
async function sp(e, t, n = {}) {
  const r = n.fs || fn, i = gc(t, n);
  await ni.fromCallback(r.writeFile)(e, i, n);
}
const ap = ni.fromPromise(sp);
function lp(e, t, n = {}) {
  const r = n.fs || fn, i = gc(t, n);
  return r.writeFileSync(e, i, n);
}
var cp = {
  readFile: ip,
  readFileSync: op,
  writeFile: ap,
  writeFileSync: lp
};
const vr = cp;
var up = {
  // jsonfile exports
  readJson: vr.readFile,
  readJsonSync: vr.readFileSync,
  writeJson: vr.writeFile,
  writeJsonSync: vr.writeFileSync
};
const fp = Re.fromCallback, Dn = Oe, yc = Z, wc = tt, dp = Bt.pathExists;
function hp(e, t, n, r) {
  typeof n == "function" && (r = n, n = "utf8");
  const i = yc.dirname(e);
  dp(i, (o, s) => {
    if (o) return r(o);
    if (s) return Dn.writeFile(e, t, n, r);
    wc.mkdirs(i, (a) => {
      if (a) return r(a);
      Dn.writeFile(e, t, n, r);
    });
  });
}
function pp(e, ...t) {
  const n = yc.dirname(e);
  if (Dn.existsSync(n))
    return Dn.writeFileSync(e, ...t);
  wc.mkdirsSync(n), Dn.writeFileSync(e, ...t);
}
var Bo = {
  outputFile: fp(hp),
  outputFileSync: pp
};
const { stringify: mp } = Mo, { outputFile: gp } = Bo;
async function Ep(e, t, n = {}) {
  const r = mp(t, n);
  await gp(e, r, n);
}
var yp = Ep;
const { stringify: wp } = Mo, { outputFileSync: _p } = Bo;
function vp(e, t, n) {
  const r = wp(t, n);
  _p(e, r, n);
}
var Ap = vp;
const Tp = Re.fromPromise, $e = up;
$e.outputJson = Tp(yp);
$e.outputJsonSync = Ap;
$e.outputJSON = $e.outputJson;
$e.outputJSONSync = $e.outputJsonSync;
$e.writeJSON = $e.writeJson;
$e.writeJSONSync = $e.writeJsonSync;
$e.readJSON = $e.readJson;
$e.readJSONSync = $e.readJsonSync;
var Sp = $e;
const bp = Oe, ho = Z, Cp = Uo.copy, _c = ti.remove, $p = tt.mkdirp, Rp = Bt.pathExists, Ks = pn;
function Op(e, t, n, r) {
  typeof n == "function" && (r = n, n = {}), n = n || {};
  const i = n.overwrite || n.clobber || !1;
  Ks.checkPaths(e, t, "move", n, (o, s) => {
    if (o) return r(o);
    const { srcStat: a, isChangingCase: c = !1 } = s;
    Ks.checkParentPaths(e, a, t, "move", (m) => {
      if (m) return r(m);
      if (Ip(t)) return Js(e, t, i, c, r);
      $p(ho.dirname(t), (l) => l ? r(l) : Js(e, t, i, c, r));
    });
  });
}
function Ip(e) {
  const t = ho.dirname(e);
  return ho.parse(t).root === t;
}
function Js(e, t, n, r, i) {
  if (r) return Pi(e, t, n, i);
  if (n)
    return _c(t, (o) => o ? i(o) : Pi(e, t, n, i));
  Rp(t, (o, s) => o ? i(o) : s ? i(new Error("dest already exists.")) : Pi(e, t, n, i));
}
function Pi(e, t, n, r) {
  bp.rename(e, t, (i) => i ? i.code !== "EXDEV" ? r(i) : Pp(e, t, n, r) : r());
}
function Pp(e, t, n, r) {
  Cp(e, t, {
    overwrite: n,
    errorOnExist: !0
  }, (o) => o ? r(o) : _c(e, r));
}
var Np = Op;
const vc = Oe, po = Z, Dp = Uo.copySync, Ac = ti.removeSync, Fp = tt.mkdirpSync, Qs = pn;
function xp(e, t, n) {
  n = n || {};
  const r = n.overwrite || n.clobber || !1, { srcStat: i, isChangingCase: o = !1 } = Qs.checkPathsSync(e, t, "move", n);
  return Qs.checkParentPathsSync(e, i, t, "move"), Lp(t) || Fp(po.dirname(t)), Up(e, t, r, o);
}
function Lp(e) {
  const t = po.dirname(e);
  return po.parse(t).root === t;
}
function Up(e, t, n, r) {
  if (r) return Ni(e, t, n);
  if (n)
    return Ac(t), Ni(e, t, n);
  if (vc.existsSync(t)) throw new Error("dest already exists.");
  return Ni(e, t, n);
}
function Ni(e, t, n) {
  try {
    vc.renameSync(e, t);
  } catch (r) {
    if (r.code !== "EXDEV") throw r;
    return kp(e, t, n);
  }
}
function kp(e, t, n) {
  return Dp(e, t, {
    overwrite: n,
    errorOnExist: !0
  }), Ac(e);
}
var Mp = xp;
const Bp = Re.fromCallback;
var jp = {
  move: Bp(Np),
  moveSync: Mp
}, St = {
  // Export promiseified graceful-fs:
  ...Mt,
  // Export extra methods:
  ...Uo,
  ...Ch,
  ...ep,
  ...Sp,
  ...tt,
  ...jp,
  ...Bo,
  ...Bt,
  ...ti
}, jt = {}, yt = {}, de = {}, wt = {};
Object.defineProperty(wt, "__esModule", { value: !0 });
wt.CancellationError = wt.CancellationToken = void 0;
const Hp = Pl;
class Gp extends Hp.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(t) {
    this.removeParentCancelHandler(), this._parent = t, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(t) {
    super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, t != null && (this.parent = t);
  }
  cancel() {
    this._cancelled = !0, this.emit("cancel");
  }
  onCancel(t) {
    this.cancelled ? t() : this.once("cancel", t);
  }
  createPromise(t) {
    if (this.cancelled)
      return Promise.reject(new mo());
    const n = () => {
      if (r != null)
        try {
          this.removeListener("cancel", r), r = null;
        } catch {
        }
    };
    let r = null;
    return new Promise((i, o) => {
      let s = null;
      if (r = () => {
        try {
          s != null && (s(), s = null);
        } finally {
          o(new mo());
        }
      }, this.cancelled) {
        r();
        return;
      }
      this.onCancel(r), t(i, o, (a) => {
        s = a;
      });
    }).then((i) => (n(), i)).catch((i) => {
      throw n(), i;
    });
  }
  removeParentCancelHandler() {
    const t = this._parent;
    t != null && this.parentCancelHandler != null && (t.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners(), this._parent = null;
    }
  }
}
wt.CancellationToken = Gp;
class mo extends Error {
  constructor() {
    super("cancelled");
  }
}
wt.CancellationError = mo;
var mn = {};
Object.defineProperty(mn, "__esModule", { value: !0 });
mn.newError = qp;
function qp(e, t) {
  const n = new Error(e);
  return n.code = t, n;
}
var fe = {}, go = { exports: {} }, Ar = { exports: {} }, Di, Zs;
function Vp() {
  if (Zs) return Di;
  Zs = 1;
  var e = 1e3, t = e * 60, n = t * 60, r = n * 24, i = r * 7, o = r * 365.25;
  Di = function(l, f) {
    f = f || {};
    var h = typeof l;
    if (h === "string" && l.length > 0)
      return s(l);
    if (h === "number" && isFinite(l))
      return f.long ? c(l) : a(l);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(l)
    );
  };
  function s(l) {
    if (l = String(l), !(l.length > 100)) {
      var f = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        l
      );
      if (f) {
        var h = parseFloat(f[1]), g = (f[2] || "ms").toLowerCase();
        switch (g) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return h * o;
          case "weeks":
          case "week":
          case "w":
            return h * i;
          case "days":
          case "day":
          case "d":
            return h * r;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return h * n;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return h * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return h * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return h;
          default:
            return;
        }
      }
    }
  }
  function a(l) {
    var f = Math.abs(l);
    return f >= r ? Math.round(l / r) + "d" : f >= n ? Math.round(l / n) + "h" : f >= t ? Math.round(l / t) + "m" : f >= e ? Math.round(l / e) + "s" : l + "ms";
  }
  function c(l) {
    var f = Math.abs(l);
    return f >= r ? m(l, f, r, "day") : f >= n ? m(l, f, n, "hour") : f >= t ? m(l, f, t, "minute") : f >= e ? m(l, f, e, "second") : l + " ms";
  }
  function m(l, f, h, g) {
    var _ = f >= h * 1.5;
    return Math.round(l / h) + " " + g + (_ ? "s" : "");
  }
  return Di;
}
var Fi, ea;
function Tc() {
  if (ea) return Fi;
  ea = 1;
  function e(t) {
    r.debug = r, r.default = r, r.coerce = m, r.disable = a, r.enable = o, r.enabled = c, r.humanize = Vp(), r.destroy = l, Object.keys(t).forEach((f) => {
      r[f] = t[f];
    }), r.names = [], r.skips = [], r.formatters = {};
    function n(f) {
      let h = 0;
      for (let g = 0; g < f.length; g++)
        h = (h << 5) - h + f.charCodeAt(g), h |= 0;
      return r.colors[Math.abs(h) % r.colors.length];
    }
    r.selectColor = n;
    function r(f) {
      let h, g = null, _, E;
      function A(...T) {
        if (!A.enabled)
          return;
        const R = A, D = Number(/* @__PURE__ */ new Date()), B = D - (h || D);
        R.diff = B, R.prev = h, R.curr = D, h = D, T[0] = r.coerce(T[0]), typeof T[0] != "string" && T.unshift("%O");
        let G = 0;
        T[0] = T[0].replace(/%([a-zA-Z%])/g, (Q, oe) => {
          if (Q === "%%")
            return "%";
          G++;
          const U = r.formatters[oe];
          if (typeof U == "function") {
            const y = T[G];
            Q = U.call(R, y), T.splice(G, 1), G--;
          }
          return Q;
        }), r.formatArgs.call(R, T), (R.log || r.log).apply(R, T);
      }
      return A.namespace = f, A.useColors = r.useColors(), A.color = r.selectColor(f), A.extend = i, A.destroy = r.destroy, Object.defineProperty(A, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => g !== null ? g : (_ !== r.namespaces && (_ = r.namespaces, E = r.enabled(f)), E),
        set: (T) => {
          g = T;
        }
      }), typeof r.init == "function" && r.init(A), A;
    }
    function i(f, h) {
      const g = r(this.namespace + (typeof h > "u" ? ":" : h) + f);
      return g.log = this.log, g;
    }
    function o(f) {
      r.save(f), r.namespaces = f, r.names = [], r.skips = [];
      const h = (typeof f == "string" ? f : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const g of h)
        g[0] === "-" ? r.skips.push(g.slice(1)) : r.names.push(g);
    }
    function s(f, h) {
      let g = 0, _ = 0, E = -1, A = 0;
      for (; g < f.length; )
        if (_ < h.length && (h[_] === f[g] || h[_] === "*"))
          h[_] === "*" ? (E = _, A = g, _++) : (g++, _++);
        else if (E !== -1)
          _ = E + 1, A++, g = A;
        else
          return !1;
      for (; _ < h.length && h[_] === "*"; )
        _++;
      return _ === h.length;
    }
    function a() {
      const f = [
        ...r.names,
        ...r.skips.map((h) => "-" + h)
      ].join(",");
      return r.enable(""), f;
    }
    function c(f) {
      for (const h of r.skips)
        if (s(f, h))
          return !1;
      for (const h of r.names)
        if (s(f, h))
          return !0;
      return !1;
    }
    function m(f) {
      return f instanceof Error ? f.stack || f.message : f;
    }
    function l() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return r.enable(r.load()), r;
  }
  return Fi = e, Fi;
}
var ta;
function Wp() {
  return ta || (ta = 1, function(e, t) {
    t.formatArgs = r, t.save = i, t.load = o, t.useColors = n, t.storage = s(), t.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), t.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function n() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function r(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const m = "color: " + this.color;
      c.splice(1, 0, m, "color: inherit");
      let l = 0, f = 0;
      c[0].replace(/%[a-zA-Z%]/g, (h) => {
        h !== "%%" && (l++, h === "%c" && (f = l));
      }), c.splice(f, 0, m);
    }
    t.log = console.debug || console.log || (() => {
    });
    function i(c) {
      try {
        c ? t.storage.setItem("debug", c) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function o() {
      let c;
      try {
        c = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function s() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = Tc()(t);
    const { formatters: a } = e.exports;
    a.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (m) {
        return "[UnexpectedJSONParseError]: " + m.message;
      }
    };
  }(Ar, Ar.exports)), Ar.exports;
}
var Tr = { exports: {} }, xi, na;
function Yp() {
  return na || (na = 1, xi = (e, t = process.argv) => {
    const n = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", r = t.indexOf(n + e), i = t.indexOf("--");
    return r !== -1 && (i === -1 || r < i);
  }), xi;
}
var Li, ra;
function zp() {
  if (ra) return Li;
  ra = 1;
  const e = Qr, t = Nl, n = Yp(), { env: r } = process;
  let i;
  n("no-color") || n("no-colors") || n("color=false") || n("color=never") ? i = 0 : (n("color") || n("colors") || n("color=true") || n("color=always")) && (i = 1), "FORCE_COLOR" in r && (r.FORCE_COLOR === "true" ? i = 1 : r.FORCE_COLOR === "false" ? i = 0 : i = r.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(r.FORCE_COLOR, 10), 3));
  function o(c) {
    return c === 0 ? !1 : {
      level: c,
      hasBasic: !0,
      has256: c >= 2,
      has16m: c >= 3
    };
  }
  function s(c, m) {
    if (i === 0)
      return 0;
    if (n("color=16m") || n("color=full") || n("color=truecolor"))
      return 3;
    if (n("color=256"))
      return 2;
    if (c && !m && i === void 0)
      return 0;
    const l = i || 0;
    if (r.TERM === "dumb")
      return l;
    if (process.platform === "win32") {
      const f = e.release().split(".");
      return Number(f[0]) >= 10 && Number(f[2]) >= 10586 ? Number(f[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in r)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((f) => f in r) || r.CI_NAME === "codeship" ? 1 : l;
    if ("TEAMCITY_VERSION" in r)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(r.TEAMCITY_VERSION) ? 1 : 0;
    if (r.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in r) {
      const f = parseInt((r.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (r.TERM_PROGRAM) {
        case "iTerm.app":
          return f >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(r.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(r.TERM) || "COLORTERM" in r ? 1 : l;
  }
  function a(c) {
    const m = s(c, c && c.isTTY);
    return o(m);
  }
  return Li = {
    supportsColor: a,
    stdout: o(s(!0, t.isatty(1))),
    stderr: o(s(!0, t.isatty(2)))
  }, Li;
}
var ia;
function Xp() {
  return ia || (ia = 1, function(e, t) {
    const n = Nl, r = Po;
    t.init = l, t.log = a, t.formatArgs = o, t.save = c, t.load = m, t.useColors = i, t.destroy = r.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = zp();
      h && (h.stderr || h).level >= 2 && (t.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    t.inspectOpts = Object.keys(process.env).filter((h) => /^debug_/i.test(h)).reduce((h, g) => {
      const _ = g.substring(6).toLowerCase().replace(/_([a-z])/g, (A, T) => T.toUpperCase());
      let E = process.env[g];
      return /^(yes|on|true|enabled)$/i.test(E) ? E = !0 : /^(no|off|false|disabled)$/i.test(E) ? E = !1 : E === "null" ? E = null : E = Number(E), h[_] = E, h;
    }, {});
    function i() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : n.isatty(process.stderr.fd);
    }
    function o(h) {
      const { namespace: g, useColors: _ } = this;
      if (_) {
        const E = this.color, A = "\x1B[3" + (E < 8 ? E : "8;5;" + E), T = `  ${A};1m${g} \x1B[0m`;
        h[0] = T + h[0].split(`
`).join(`
` + T), h.push(A + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        h[0] = s() + g + " " + h[0];
    }
    function s() {
      return t.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function a(...h) {
      return process.stderr.write(r.formatWithOptions(t.inspectOpts, ...h) + `
`);
    }
    function c(h) {
      h ? process.env.DEBUG = h : delete process.env.DEBUG;
    }
    function m() {
      return process.env.DEBUG;
    }
    function l(h) {
      h.inspectOpts = {};
      const g = Object.keys(t.inspectOpts);
      for (let _ = 0; _ < g.length; _++)
        h.inspectOpts[g[_]] = t.inspectOpts[g[_]];
    }
    e.exports = Tc()(t);
    const { formatters: f } = e.exports;
    f.o = function(h) {
      return this.inspectOpts.colors = this.useColors, r.inspect(h, this.inspectOpts).split(`
`).map((g) => g.trim()).join(" ");
    }, f.O = function(h) {
      return this.inspectOpts.colors = this.useColors, r.inspect(h, this.inspectOpts);
    };
  }(Tr, Tr.exports)), Tr.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? go.exports = Wp() : go.exports = Xp();
var Kp = go.exports, er = {};
Object.defineProperty(er, "__esModule", { value: !0 });
er.ProgressCallbackTransform = void 0;
const Jp = Jn;
class Qp extends Jp.Transform {
  constructor(t, n, r) {
    super(), this.total = t, this.cancellationToken = n, this.onProgress = r, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, n, r) {
    if (this.cancellationToken.cancelled) {
      r(new Error("cancelled"), null);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.total * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), r(null, t);
  }
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, t(null);
  }
}
er.ProgressCallbackTransform = Qp;
Object.defineProperty(fe, "__esModule", { value: !0 });
fe.DigestTransform = fe.HttpExecutor = fe.HttpError = void 0;
fe.addSensitiveRedirectHeader = om;
fe.addSensitiveFieldPattern = sm;
fe.createHttpError = yo;
fe.parseJson = lm;
fe.configureRequestOptionsFromUrl = Rc;
fe.configureRequestUrl = Go;
fe.safeGetHeader = ln;
fe.configureRequestOptions = Gr;
fe.isSensitiveFieldName = Oc;
fe.hashSensitiveValue = Ic;
fe.safeStringifyJson = tn;
const Sc = Qn, Zp = Kp, em = At, tm = Jn, Eo = Tt, nm = wt, oa = mn, rm = er, dt = (0, Zp.default)("electron-builder"), jo = (e) => e.toLowerCase().replace(/[-_]/g, ""), bc = /* @__PURE__ */ new Set(["authorization", "proxyauthorization", "privatetoken", "xapikey", "xauthtoken", "xaccesstoken", "xgitlabtoken", "cookie", "xcsrftoken"]), Cc = ["token", "password", "secret", "authorization", "credential", "apikey", "passphrase", "auth"], im = ["key"];
function om(e) {
  bc.add(jo(e));
}
function sm(e) {
  Cc.push(e.toLowerCase().replace(/[-_]/g, ""));
}
function yo(e, t = null) {
  return new Ho(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + tn(e.headers), t);
}
const am = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class Ho extends Error {
  constructor(t, n = `HTTP error: ${am.get(t) || t}`, r = null) {
    super(n), this.statusCode = t, this.description = r, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
fe.HttpError = Ho;
function lm(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class en {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, n = new nm.CancellationToken(), r) {
    Gr(t);
    const i = r == null ? void 0 : JSON.stringify(r), o = i ? Buffer.from(i) : void 0;
    if (o != null) {
      dt.enabled && dt(tn(r));
      const { headers: s, ...a } = t;
      t = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": o.length,
          ...s
        },
        ...a
      };
    }
    return this.doApiRequest(t, n, (s) => s.end(o));
  }
  doApiRequest(t, n, r, i = 0) {
    if (dt.enabled) {
      const { headers: o, auth: s, ...a } = t;
      dt(`Request: ${tn(a)}`);
    }
    return n.createPromise((o, s, a) => {
      const c = this.createRequest(t, (m) => {
        try {
          this.handleResponse(m, t, n, o, s, i, r);
        } catch (l) {
          s(l);
        }
      });
      this.addErrorAndTimeoutHandlers(c, s, t.timeout), this.addRedirectHandlers(c, t, s, i, (m) => {
        this.doApiRequest(m, n, r, i).then(o).catch(s);
      }), r(c, s), a(() => c.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(t, n, r, i, o) {
  }
  addErrorAndTimeoutHandlers(t, n, r = 60 * 1e3) {
    this.addTimeOutHandler(t, n, r), t.on("error", n), t.on("aborted", () => {
      n(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(t, n, r, i, o, s, a) {
    var c;
    if (dt.enabled) {
      const { headers: g, auth: _, ...E } = n;
      dt(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${tn(E)}`);
    }
    if (t.statusCode === 404) {
      o(yo(t, `method: ${n.method || "GET"} url: ${n.protocol || "https:"}//${n.hostname}${n.port ? `:${n.port}` : ""}${n.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      i();
      return;
    }
    const m = (c = t.statusCode) !== null && c !== void 0 ? c : 0, l = m >= 300 && m < 400, f = ln(t, "location");
    if (l && f != null) {
      if (s > this.maxRedirects) {
        o(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(en.prepareRedirectUrlOptions(f, n), r, a, s).then(i).catch(o);
      return;
    }
    t.setEncoding("utf8");
    let h = "";
    t.on("error", o), t.on("data", (g) => h += g), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const g = ln(t, "content-type"), _ = g != null && (Array.isArray(g) ? g.find((E) => E.includes("json")) != null : g.includes("json"));
          o(yo(t, `method: ${n.method || "GET"} url: ${n.protocol || "https:"}//${n.hostname}${n.port ? `:${n.port}` : ""}${n.path}

          Data:
          ${_ ? tn(JSON.parse(h)) : h}
          `));
        } else
          i(h.length === 0 ? null : h);
      } catch (g) {
        o(g);
      }
    });
  }
  async downloadToBuffer(t, n) {
    return await n.cancellationToken.createPromise((r, i, o) => {
      const s = [], a = {
        headers: n.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      Go(t, a), Gr(a), this.doDownload(a, {
        destination: null,
        options: n,
        onCancel: o,
        callback: (c) => {
          c == null ? r(Buffer.concat(s)) : i(c);
        },
        responseHandler: (c, m) => {
          let l = 0;
          c.on("data", (f) => {
            if (l += f.length, l > 524288e3) {
              m(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            s.push(f);
          }), c.on("end", () => {
            m(null);
          });
        }
      }, 0);
    });
  }
  doDownload(t, n, r) {
    const i = this.createRequest(t, (o) => {
      if (o.statusCode >= 400) {
        n.callback(new Error(`Cannot download "${t.protocol || "https:"}//${t.hostname}${t.path}", status ${o.statusCode}: ${o.statusMessage}`));
        return;
      }
      o.on("error", n.callback);
      const s = ln(o, "location");
      if (s != null) {
        r < this.maxRedirects ? this.doDownload(en.prepareRedirectUrlOptions(s, t), n, r++) : n.callback(this.createMaxRedirectError());
        return;
      }
      n.responseHandler == null ? um(n, o) : n.responseHandler(o, n.callback);
    });
    this.addErrorAndTimeoutHandlers(i, n.callback, t.timeout), this.addRedirectHandlers(i, t, n.callback, r, (o) => {
      this.doDownload(o, n, r++);
    }), i.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(t, n, r) {
    t.on("socket", (i) => {
      i.setTimeout(r, () => {
        t.abort(), n(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(t, n) {
    const r = Rc(t, { ...n }), i = r.headers;
    if (i == null)
      return r;
    const o = en.reconstructOriginalUrl(n), s = $c(t, n);
    if (en.isCrossOriginRedirect(o, s)) {
      dt.enabled && dt(`Cross-origin redirect (${o.host} → ${s.host}): stripping sensitive headers`);
      for (const a of Object.keys(i))
        bc.has(jo(a)) && delete i[a];
    }
    return r;
  }
  static reconstructOriginalUrl(t) {
    const n = t.protocol || "https:";
    if (!t.hostname)
      throw new Error("Missing hostname in request options");
    const r = t.hostname, i = t.port ? `:${t.port}` : "", o = t.path || "/";
    return new Eo.URL(`${n}//${r}${i}${o}`);
  }
  static isCrossOriginRedirect(t, n) {
    if (t.hostname.toLowerCase() !== n.hostname.toLowerCase())
      return !0;
    if (t.protocol === "http:" && // This can be replaced with `!originalUrl.port`, but for the sake of clarity.
    ["80", ""].includes(t.port) && n.protocol === "https:" && // This can be replaced with `!redirectUrl.port`, but for the sake of clarity.
    ["443", ""].includes(n.port))
      return !1;
    if (t.protocol !== n.protocol)
      return !0;
    const r = t.port, i = n.port;
    return r !== i;
  }
  static async retryOnServerError(t, n = 3) {
    for (let r = 0; ; r++)
      try {
        return await t();
      } catch (i) {
        if (r < n && (i instanceof Ho && i.isServerError() || i.code === "EPIPE")) {
          await new Promise((o) => setTimeout(o, 1e3 * (r + 1)));
          continue;
        }
        throw i;
      }
  }
}
fe.HttpExecutor = en;
function $c(e, t) {
  try {
    return new Eo.URL(e);
  } catch {
    const n = t.hostname, r = t.protocol || "https:", i = t.port ? `:${t.port}` : "", o = `${r}//${n}${i}`;
    return new Eo.URL(e, o);
  }
}
function Rc(e, t) {
  const n = Gr(t), r = $c(e, t);
  return Go(r, n), n;
}
function Go(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class wo extends tm.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, n = "sha512", r = "base64") {
    super(), this.expected = t, this.algorithm = n, this.encoding = r, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, Sc.createHash)(n);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(t, n, r) {
    this.digester.update(t), r(null, t);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(t) {
    if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
      try {
        this.validate();
      } catch (n) {
        t(n);
        return;
      }
    t(null);
  }
  validate() {
    if (this._actual == null)
      throw (0, oa.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, oa.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
fe.DigestTransform = wo;
function cm(e, t, n) {
  return e != null && t != null && e !== t ? (n(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function ln(e, t) {
  const n = e.headers[t];
  return n == null ? null : Array.isArray(n) ? n.length === 0 ? null : n[n.length - 1] : n;
}
function um(e, t) {
  if (!cm(ln(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const n = [];
  if (e.options.onProgress != null) {
    const s = ln(t, "content-length");
    s != null && n.push(new rm.ProgressCallbackTransform(parseInt(s, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const r = e.options.sha512;
  r != null ? n.push(new wo(r, "sha512", r.length === 128 && !r.includes("+") && !r.includes("Z") && !r.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && n.push(new wo(e.options.sha2, "sha256", "hex"));
  const i = (0, em.createWriteStream)(e.destination);
  n.push(i);
  let o = t;
  for (const s of n)
    s.on("error", (a) => {
      i.close(), e.options.cancellationToken.cancelled || e.callback(a);
    }), o = o.pipe(s);
  i.on("finish", () => {
    i.close(e.callback);
  });
}
function Gr(e, t, n) {
  n != null && (e.method = n), e.headers = { ...e.headers };
  const r = e.headers;
  return t != null && (r.authorization = t.startsWith("Basic") || t.startsWith("Bearer") ? t : `token ${t}`), r["User-Agent"] == null && (r["User-Agent"] = "electron-builder"), (n == null || n === "GET" || r["Cache-Control"] == null) && (r["Cache-Control"] = "no-cache"), e.protocol == null && process.versions.electron != null && (e.protocol = "https:"), e;
}
function Oc(e) {
  const t = jo(e);
  return Cc.some((n) => t.includes(n)) || im.some((n) => t.endsWith(n));
}
function Ic(e) {
  return `${(0, Sc.createHash)("sha256").update(e).digest("hex")} (sha256 hash)`;
}
function tn(e, t) {
  return JSON.stringify(e, (n, r) => Oc(n) || t != null && t.has(n) ? typeof r == "string" ? Ic(r) : "<stripped sensitive data>" : r, 2);
}
var ri = {};
Object.defineProperty(ri, "__esModule", { value: !0 });
ri.MemoLazy = void 0;
class fm {
  constructor(t, n) {
    this.selector = t, this.creator = n, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && Pc(this.selected, t))
      return this._value;
    this.selected = t;
    const n = this.creator(t);
    return this.value = n, n;
  }
  set value(t) {
    this._value = t;
  }
}
ri.MemoLazy = fm;
function Pc(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const i = Object.keys(e), o = Object.keys(t);
    return i.length === o.length && i.every((s) => Pc(e[s], t[s]));
  }
  return e === t;
}
var tr = {};
Object.defineProperty(tr, "__esModule", { value: !0 });
tr.githubUrl = dm;
tr.githubTagPrefix = hm;
tr.getS3LikeProviderBaseUrl = pm;
function dm(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function hm(e) {
  var t;
  return e.tagNamePrefix ? e.tagNamePrefix : !((t = e.vPrefixedTagName) !== null && t !== void 0) || t ? "v" : "";
}
function pm(e) {
  const t = e.provider;
  if (t === "s3")
    return mm(e);
  if (t === "spaces")
    return gm(e);
  throw new Error(`Not supported provider: ${t}`);
}
function mm(e) {
  let t;
  if (e.accelerate == !0)
    t = `https://${e.bucket}.s3-accelerate.amazonaws.com`;
  else if (e.endpoint != null)
    t = `${e.endpoint}/${e.bucket}`;
  else if (e.bucket.includes(".")) {
    if (e.region == null)
      throw new Error(`Bucket name "${e.bucket}" includes a dot, but S3 region is missing`);
    e.region === "us-east-1" ? t = `https://s3.amazonaws.com/${e.bucket}` : t = `https://s3-${e.region}.amazonaws.com/${e.bucket}`;
  } else e.region === "cn-north-1" ? t = `https://${e.bucket}.s3.${e.region}.amazonaws.com.cn` : t = `https://${e.bucket}.s3.amazonaws.com`;
  return Nc(t, e.path);
}
function Nc(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function gm(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return Nc(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var qo = {};
Object.defineProperty(qo, "__esModule", { value: !0 });
qo.retry = Dc;
const Em = wt;
async function Dc(e, t) {
  var n;
  const { retries: r, interval: i, backoff: o = 0, attempt: s = 0, shouldRetry: a, cancellationToken: c = new Em.CancellationToken() } = t;
  try {
    return await e();
  } catch (m) {
    if (await Promise.resolve((n = a == null ? void 0 : a(m)) !== null && n !== void 0 ? n : !0) && r > 0 && !c.cancelled)
      return await new Promise((l) => setTimeout(l, i + o * s)), await Dc(e, { ...t, retries: r - 1, attempt: s + 1 });
    throw m;
  }
}
var Vo = {};
Object.defineProperty(Vo, "__esModule", { value: !0 });
Vo.parseDn = ym;
function ym(e) {
  let t = !1, n = null, r = "", i = 0;
  e = e.trim();
  const o = /* @__PURE__ */ new Map();
  for (let s = 0; s <= e.length; s++) {
    if (s === e.length) {
      n !== null && o.set(n, r);
      break;
    }
    const a = e[s];
    if (t) {
      if (a === '"') {
        t = !1;
        continue;
      }
    } else {
      if (a === '"') {
        t = !0;
        continue;
      }
      if (a === "\\") {
        s++;
        const c = parseInt(e.slice(s, s + 2), 16);
        Number.isNaN(c) ? r += e[s] : (s++, r += String.fromCharCode(c));
        continue;
      }
      if (n === null && a === "=") {
        n = r, r = "";
        continue;
      }
      if (a === "," || a === ";" || a === "+") {
        n !== null && o.set(n, r), n = null, r = "";
        continue;
      }
    }
    if (a === " " && !t) {
      if (r.length === 0)
        continue;
      if (s > i) {
        let c = s;
        for (; e[c] === " "; )
          c++;
        i = c;
      }
      if (i >= e.length || e[i] === "," || e[i] === ";" || n === null && e[i] === "=" || n !== null && e[i] === "+") {
        s = i - 1;
        continue;
      }
    }
    r += a;
  }
  return o;
}
var dn = {};
Object.defineProperty(dn, "__esModule", { value: !0 });
dn.nil = dn.UUID = void 0;
const Fc = Qn, xc = mn, wm = "options.name must be either a string or a Buffer", sa = (0, Fc.randomBytes)(16);
sa[0] = sa[0] | 1;
const Mr = {}, V = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  Mr[t] = e, V[e] = t;
}
class kt {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const n = kt.check(t);
    if (!n)
      throw new Error("not a UUID");
    this.version = n.version, n.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, n) {
    return _m(t, "sha1", 80, n);
  }
  toString() {
    return this.ascii == null && (this.ascii = vm(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, n = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: (Mr[t[14] + t[15]] & 240) >> 4,
        variant: aa((Mr[t[19] + t[20]] & 224) >> 5),
        format: "ascii"
      } : !1;
    if (Buffer.isBuffer(t)) {
      if (t.length < n + 16)
        return !1;
      let r = 0;
      for (; r < 16 && t[n + r] === 0; r++)
        ;
      return r === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
        version: (t[n + 6] & 240) >> 4,
        variant: aa((t[n + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, xc.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(t) {
    const n = Buffer.allocUnsafe(16);
    let r = 0;
    for (let i = 0; i < 16; i++)
      n[i] = Mr[t[r++] + t[r++]], (i === 3 || i === 5 || i === 7 || i === 9) && (r += 1);
    return n;
  }
}
dn.UUID = kt;
kt.OID = kt.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function aa(e) {
  switch (e) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var Fn;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})(Fn || (Fn = {}));
function _m(e, t, n, r, i = Fn.ASCII) {
  const o = (0, Fc.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, xc.newError)(wm, "ERR_INVALID_UUID_NAME");
  o.update(r), o.update(e);
  const a = o.digest();
  let c;
  switch (i) {
    case Fn.BINARY:
      a[6] = a[6] & 15 | n, a[8] = a[8] & 63 | 128, c = a;
      break;
    case Fn.OBJECT:
      a[6] = a[6] & 15 | n, a[8] = a[8] & 63 | 128, c = new kt(a);
      break;
    default:
      c = V[a[0]] + V[a[1]] + V[a[2]] + V[a[3]] + "-" + V[a[4]] + V[a[5]] + "-" + V[a[6] & 15 | n] + V[a[7]] + "-" + V[a[8] & 63 | 128] + V[a[9]] + "-" + V[a[10]] + V[a[11]] + V[a[12]] + V[a[13]] + V[a[14]] + V[a[15]];
      break;
  }
  return c;
}
function vm(e) {
  return V[e[0]] + V[e[1]] + V[e[2]] + V[e[3]] + "-" + V[e[4]] + V[e[5]] + "-" + V[e[6]] + V[e[7]] + "-" + V[e[8]] + V[e[9]] + "-" + V[e[10]] + V[e[11]] + V[e[12]] + V[e[13]] + V[e[14]] + V[e[15]];
}
dn.nil = new kt("00000000-0000-0000-0000-000000000000");
var nr = {}, Lc = {};
(function(e) {
  (function(t) {
    t.parser = function(d, u) {
      return new r(d, u);
    }, t.SAXParser = r, t.SAXStream = f, t.createStream = m, t.MAX_BUFFER_LENGTH = 64 * 1024;
    var n = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    t.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function r(d, u) {
      if (!(this instanceof r))
        return new r(d, u);
      var S = this;
      o(S), S.q = S.c = "", S.bufferCheckPosition = t.MAX_BUFFER_LENGTH, S.encoding = null, S.opt = u || {}, S.opt.lowercase = S.opt.lowercase || S.opt.lowercasetags, S.looseCase = S.opt.lowercase ? "toLowerCase" : "toUpperCase", S.opt.maxEntityCount = S.opt.maxEntityCount || 512, S.opt.maxEntityDepth = S.opt.maxEntityDepth || 4, S.entityCount = S.entityDepth = 0, S.tags = [], S.closed = S.closedRoot = S.sawRoot = !1, S.tag = S.error = null, S.strict = !!d, S.noscript = !!(d || S.opt.noscript), S.state = y.BEGIN, S.strictEntities = S.opt.strictEntities, S.ENTITIES = S.strictEntities ? Object.create(t.XML_ENTITIES) : Object.create(t.ENTITIES), S.attribList = [], S.opt.xmlns && (S.ns = Object.create(A)), S.opt.unquotedAttributeValues === void 0 && (S.opt.unquotedAttributeValues = !d), S.trackPosition = S.opt.position !== !1, S.trackPosition && (S.position = S.line = S.column = 0), Y(S, "onready");
    }
    Object.create || (Object.create = function(d) {
      function u() {
      }
      u.prototype = d;
      var S = new u();
      return S;
    }), Object.keys || (Object.keys = function(d) {
      var u = [];
      for (var S in d) d.hasOwnProperty(S) && u.push(S);
      return u;
    });
    function i(d) {
      for (var u = Math.max(t.MAX_BUFFER_LENGTH, 10), S = 0, w = 0, W = n.length; w < W; w++) {
        var te = d[n[w]].length;
        if (te > u)
          switch (n[w]) {
            case "textNode":
              N(d);
              break;
            case "cdata":
              C(d, "oncdata", d.cdata), d.cdata = "";
              break;
            case "script":
              C(d, "onscript", d.script), d.script = "";
              break;
            default:
              k(d, "Max buffer length exceeded: " + n[w]);
          }
        S = Math.max(S, te);
      }
      var se = t.MAX_BUFFER_LENGTH - S;
      d.bufferCheckPosition = se + d.position;
    }
    function o(d) {
      for (var u = 0, S = n.length; u < S; u++)
        d[n[u]] = "";
    }
    function s(d) {
      N(d), d.cdata !== "" && (C(d, "oncdata", d.cdata), d.cdata = ""), d.script !== "" && (C(d, "onscript", d.script), d.script = "");
    }
    r.prototype = {
      end: function() {
        q(this);
      },
      write: vn,
      resume: function() {
        return this.error = null, this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        s(this);
      }
    };
    var a;
    try {
      a = require("stream").Stream;
    } catch {
      a = function() {
      };
    }
    a || (a = function() {
    });
    var c = t.EVENTS.filter(function(d) {
      return d !== "error" && d !== "end";
    });
    function m(d, u) {
      return new f(d, u);
    }
    function l(d, u) {
      if (d.length >= 2) {
        if (d[0] === 255 && d[1] === 254)
          return "utf-16le";
        if (d[0] === 254 && d[1] === 255)
          return "utf-16be";
      }
      return d.length >= 3 && d[0] === 239 && d[1] === 187 && d[2] === 191 ? "utf8" : d.length >= 4 ? d[0] === 60 && d[1] === 0 && d[2] === 63 && d[3] === 0 ? "utf-16le" : d[0] === 0 && d[1] === 60 && d[2] === 0 && d[3] === 63 ? "utf-16be" : "utf8" : u ? "utf8" : null;
    }
    function f(d, u) {
      if (!(this instanceof f))
        return new f(d, u);
      a.apply(this), this._parser = new r(d, u), this.writable = !0, this.readable = !0;
      var S = this;
      this._parser.onend = function() {
        S.emit("end");
      }, this._parser.onerror = function(w) {
        S.emit("error", w), S._parser.error = null;
      }, this._decoder = null, this._decoderBuffer = null, c.forEach(function(w) {
        Object.defineProperty(S, "on" + w, {
          get: function() {
            return S._parser["on" + w];
          },
          set: function(W) {
            if (!W)
              return S.removeAllListeners(w), S._parser["on" + w] = W, W;
            S.on(w, W);
          },
          enumerable: !0,
          configurable: !1
        });
      });
    }
    f.prototype = Object.create(a.prototype, {
      constructor: {
        value: f
      }
    }), f.prototype._decodeBuffer = function(d, u) {
      if (this._decoderBuffer && (d = Buffer.concat([this._decoderBuffer, d]), this._decoderBuffer = null), !this._decoder) {
        var S = l(d, u);
        if (!S)
          return this._decoderBuffer = d, "";
        this._parser.encoding = S, this._decoder = new TextDecoder(S);
      }
      return this._decoder.decode(d, { stream: !u });
    }, f.prototype.write = function(d) {
      if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(d))
        d = this._decodeBuffer(d, !1);
      else if (this._decoderBuffer) {
        var u = this._decodeBuffer(Buffer.alloc(0), !0);
        u && (this._parser.write(u), this.emit("data", u));
      }
      return this._parser.write(d.toString()), this.emit("data", d), !0;
    }, f.prototype.end = function(d) {
      if (d && d.length && this.write(d), this._decoderBuffer) {
        var u = this._decodeBuffer(Buffer.alloc(0), !0);
        u && (this._parser.write(u), this.emit("data", u));
      } else if (this._decoder) {
        var S = this._decoder.decode();
        S && (this._parser.write(S), this.emit("data", S));
      }
      return this._parser.end(), !0;
    }, f.prototype.on = function(d, u) {
      var S = this;
      return !S._parser["on" + d] && c.indexOf(d) !== -1 && (S._parser["on" + d] = function() {
        var w = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        w.splice(0, 0, d), S.emit.apply(S, w);
      }), a.prototype.on.call(S, d, u);
    };
    var h = /^\[CDATA\[$/i, g = /^DOCTYPE$/i, _ = "http://www.w3.org/XML/1998/namespace", E = "http://www.w3.org/2000/xmlns/", A = { xml: _, xmlns: E }, T = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, R = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, D = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, B = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function G(d) {
      return d === " " || d === `
` || d === "\r" || d === "	";
    }
    function J(d) {
      return d === '"' || d === "'";
    }
    function Q(d) {
      return d === ">" || G(d);
    }
    function oe(d, u) {
      return d.test(u);
    }
    function U(d, u) {
      return !oe(d, u);
    }
    var y = 0;
    t.STATE = {
      BEGIN: y++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: y++,
      // leading whitespace
      TEXT: y++,
      // general stuff
      TEXT_ENTITY: y++,
      // &amp and such.
      OPEN_WAKA: y++,
      // <
      SGML_DECL: y++,
      // <!BLARG
      SGML_DECL_QUOTED: y++,
      // <!BLARG foo "bar
      DOCTYPE: y++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: y++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: y++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: y++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: y++,
      // <!-
      COMMENT: y++,
      // <!--
      COMMENT_ENDING: y++,
      // <!-- blah -
      COMMENT_ENDED: y++,
      // <!-- blah --
      CDATA: y++,
      // <![CDATA[ something
      CDATA_ENDING: y++,
      // ]
      CDATA_ENDING_2: y++,
      // ]]
      PROC_INST: y++,
      // <?hi
      PROC_INST_BODY: y++,
      // <?hi there
      PROC_INST_ENDING: y++,
      // <?hi "there" ?
      OPEN_TAG: y++,
      // <strong
      OPEN_TAG_SLASH: y++,
      // <strong /
      ATTRIB: y++,
      // <a
      ATTRIB_NAME: y++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: y++,
      // <a foo _
      ATTRIB_VALUE: y++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: y++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: y++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: y++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: y++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: y++,
      // <foo bar=&quot
      CLOSE_TAG: y++,
      // </a
      CLOSE_TAG_SAW_WHITE: y++,
      // </a   >
      SCRIPT: y++,
      // <script> ...
      SCRIPT_ENDING: y++
      // <script> ... <
    }, t.XML_ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    }), t.ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    }), Object.keys(t.ENTITIES).forEach(function(d) {
      var u = t.ENTITIES[d], S = typeof u == "number" ? String.fromCharCode(u) : u;
      t.ENTITIES[d] = S;
    });
    for (var H in t.STATE)
      t.STATE[t.STATE[H]] = H;
    y = t.STATE;
    function Y(d, u, S) {
      d[u] && d[u](S);
    }
    function ee(d) {
      var u = d && d.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
      return u ? u[2] : null;
    }
    function O(d) {
      return d ? d.toLowerCase().replace(/[^a-z0-9]/g, "") : null;
    }
    function $(d, u) {
      const S = O(d), w = O(u);
      return !S || !w ? !0 : w === "utf16" ? S === "utf16le" || S === "utf16be" : S === w;
    }
    function P(d, u) {
      if (!(!d.strict || !d.encoding || !u || u.name !== "xml")) {
        var S = ee(u.body);
        S && !$(d.encoding, S) && F(
          d,
          "XML declaration encoding " + S + " does not match detected stream encoding " + d.encoding.toUpperCase()
        );
      }
    }
    function C(d, u, S) {
      d.textNode && N(d), Y(d, u, S);
    }
    function N(d) {
      d.textNode = I(d.opt, d.textNode), d.textNode && Y(d, "ontext", d.textNode), d.textNode = "";
    }
    function I(d, u) {
      return d.trim && (u = u.trim()), d.normalize && (u = u.replace(/\s+/g, " ")), u;
    }
    function k(d, u) {
      return N(d), d.trackPosition && (u += `
Line: ` + d.line + `
Column: ` + d.column + `
Char: ` + d.c), u = new Error(u), d.error = u, Y(d, "onerror", u), d;
    }
    function q(d) {
      return d.sawRoot && !d.closedRoot && F(d, "Unclosed root tag"), d.state !== y.BEGIN && d.state !== y.BEGIN_WHITESPACE && d.state !== y.TEXT && k(d, "Unexpected end"), N(d), d.c = "", d.closed = !0, Y(d, "onend"), r.call(d, d.strict, d.opt), d;
    }
    function F(d, u) {
      if (typeof d != "object" || !(d instanceof r))
        throw new Error("bad call to strictFail");
      d.strict && k(d, u);
    }
    function z(d) {
      d.strict || (d.tagName = d.tagName[d.looseCase]());
      var u = d.tags[d.tags.length - 1] || d, S = d.tag = { name: d.tagName, attributes: {} };
      d.opt.xmlns && (S.ns = u.ns), d.attribList.length = 0, C(d, "onopentagstart", S);
    }
    function ce(d, u) {
      var S = d.indexOf(":"), w = S < 0 ? ["", d] : d.split(":"), W = w[0], te = w[1];
      return u && d === "xmlns" && (W = "xmlns", te = ""), { prefix: W, local: te };
    }
    function M(d) {
      if (d.strict || (d.attribName = d.attribName[d.looseCase]()), d.attribList.indexOf(d.attribName) !== -1 || d.tag.attributes.hasOwnProperty(d.attribName)) {
        d.attribName = d.attribValue = "";
        return;
      }
      if (d.opt.xmlns) {
        var u = ce(d.attribName, !0), S = u.prefix, w = u.local;
        if (S === "xmlns")
          if (w === "xml" && d.attribValue !== _)
            F(
              d,
              "xml: prefix must be bound to " + _ + `
Actual: ` + d.attribValue
            );
          else if (w === "xmlns" && d.attribValue !== E)
            F(
              d,
              "xmlns: prefix must be bound to " + E + `
Actual: ` + d.attribValue
            );
          else {
            var W = d.tag, te = d.tags[d.tags.length - 1] || d;
            W.ns === te.ns && (W.ns = Object.create(te.ns)), W.ns[w] = d.attribValue;
          }
        d.attribList.push([d.attribName, d.attribValue]);
      } else
        d.tag.attributes[d.attribName] = d.attribValue, C(d, "onattribute", {
          name: d.attribName,
          value: d.attribValue
        });
      d.attribName = d.attribValue = "";
    }
    function we(d, u) {
      if (d.opt.xmlns) {
        var S = d.tag, w = ce(d.tagName);
        S.prefix = w.prefix, S.local = w.local, S.uri = S.ns[w.prefix] || "", S.prefix && !S.uri && (F(
          d,
          "Unbound namespace prefix: " + JSON.stringify(d.tagName)
        ), S.uri = w.prefix);
        var W = d.tags[d.tags.length - 1] || d;
        S.ns && W.ns !== S.ns && Object.keys(S.ns).forEach(function(Vt) {
          C(d, "onopennamespace", {
            prefix: Vt,
            uri: S.ns[Vt]
          });
        });
        for (var te = 0, se = d.attribList.length; te < se; te++) {
          var _e = d.attribList[te], ve = _e[0], Me = _e[1], ue = ce(ve, !0), Be = ue.prefix, Ai = ue.local, fr = Be === "" ? "" : S.ns[Be] || "", at = {
            name: ve,
            value: Me,
            prefix: Be,
            local: Ai,
            uri: fr
          };
          Be && Be !== "xmlns" && !fr && (F(
            d,
            "Unbound namespace prefix: " + JSON.stringify(Be)
          ), at.uri = Be), d.tag.attributes[ve] = at, C(d, "onattribute", at);
        }
        d.attribList.length = 0;
      }
      d.tag.isSelfClosing = !!u, d.sawRoot = !0, d.tags.push(d.tag), C(d, "onopentag", d.tag), u || (!d.noscript && d.tagName.toLowerCase() === "script" ? d.state = y.SCRIPT : d.state = y.TEXT, d.tag = null, d.tagName = ""), d.attribName = d.attribValue = "", d.attribList.length = 0;
    }
    function wn(d) {
      if (!d.tagName) {
        F(d, "Weird empty close tag."), d.textNode += "</>", d.state = y.TEXT;
        return;
      }
      if (d.script) {
        if (d.tagName !== "script") {
          d.script += "</" + d.tagName + ">", d.tagName = "", d.state = y.SCRIPT;
          return;
        }
        C(d, "onscript", d.script), d.script = "";
      }
      var u = d.tags.length, S = d.tagName;
      d.strict || (S = S[d.looseCase]());
      for (var w = S; u--; ) {
        var W = d.tags[u];
        if (W.name !== w)
          F(d, "Unexpected close tag");
        else
          break;
      }
      if (u < 0) {
        F(d, "Unmatched closing tag: " + d.tagName), d.textNode += "</" + d.tagName + ">", d.state = y.TEXT;
        return;
      }
      d.tagName = S;
      for (var te = d.tags.length; te-- > u; ) {
        var se = d.tag = d.tags.pop();
        d.tagName = d.tag.name, C(d, "onclosetag", d.tagName);
        var _e = {};
        for (var ve in se.ns)
          _e[ve] = se.ns[ve];
        var Me = d.tags[d.tags.length - 1] || d;
        d.opt.xmlns && se.ns !== Me.ns && Object.keys(se.ns).forEach(function(ue) {
          var Be = se.ns[ue];
          C(d, "onclosenamespace", { prefix: ue, uri: Be });
        });
      }
      u === 0 && (d.closedRoot = !0), d.tagName = d.attribValue = d.attribName = "", d.attribList.length = 0, d.state = y.TEXT;
    }
    function ke(d) {
      var u = d.entity, S = u.toLowerCase(), w, W = "";
      return d.ENTITIES[u] ? d.ENTITIES[u] : d.ENTITIES[S] ? d.ENTITIES[S] : (u = S, u.charAt(0) === "#" && (u.charAt(1) === "x" ? (u = u.slice(2), w = parseInt(u, 16), W = w.toString(16)) : (u = u.slice(1), w = parseInt(u, 10), W = w.toString(10))), u = u.replace(/^0+/, ""), isNaN(w) || W.toLowerCase() !== u || w < 0 || w > 1114111 || !ur(w) ? (F(d, "Invalid character entity"), "&" + d.entity + ";") : String.fromCodePoint(w));
    }
    function ur(d) {
      return d === 9 || d === 10 || d === 13 || d >= 32 && d <= 55295 || d >= 57344 && d <= 65533 || d >= 65536 && d <= 1114111;
    }
    function _n(d, u) {
      u === "<" ? (d.state = y.OPEN_WAKA, d.startTagPosition = d.position) : G(u) || (F(d, "Non-whitespace before first tag."), d.textNode = u, d.state = y.TEXT);
    }
    function qt(d, u) {
      var S = "";
      return u < d.length && (S = d.charAt(u)), S;
    }
    function vn(d) {
      var u = this;
      if (this.error)
        throw this.error;
      if (u.closed)
        return k(
          u,
          "Cannot write after close. Assign an onready handler."
        );
      if (d === null)
        return q(u);
      typeof d == "object" && (d = d.toString());
      for (var S = 0, w = ""; w = qt(d, S++), u.c = w, !!w; )
        switch (u.trackPosition && (u.position++, w === `
` ? (u.line++, u.column = 0) : u.column++), u.state) {
          case y.BEGIN:
            if (u.state = y.BEGIN_WHITESPACE, w === "\uFEFF")
              continue;
            _n(u, w);
            continue;
          case y.BEGIN_WHITESPACE:
            _n(u, w);
            continue;
          case y.TEXT:
            if (u.sawRoot && !u.closedRoot) {
              for (var te = S - 1; w && w !== "<" && w !== "&"; )
                w = qt(d, S++), w && u.trackPosition && (u.position++, w === `
` ? (u.line++, u.column = 0) : u.column++);
              u.textNode += d.substring(te, S - 1);
            }
            w === "<" && !(u.sawRoot && u.closedRoot && !u.strict) ? (u.state = y.OPEN_WAKA, u.startTagPosition = u.position) : (!G(w) && (!u.sawRoot || u.closedRoot) && F(u, "Text data outside of root node."), w === "&" ? u.state = y.TEXT_ENTITY : u.textNode += w);
            continue;
          case y.SCRIPT:
            w === "<" ? u.state = y.SCRIPT_ENDING : u.script += w;
            continue;
          case y.SCRIPT_ENDING:
            w === "/" ? u.state = y.CLOSE_TAG : (u.script += "<" + w, u.state = y.SCRIPT);
            continue;
          case y.OPEN_WAKA:
            if (w === "!")
              u.state = y.SGML_DECL, u.sgmlDecl = "";
            else if (!G(w)) if (oe(T, w))
              u.state = y.OPEN_TAG, u.tagName = w;
            else if (w === "/")
              u.state = y.CLOSE_TAG, u.tagName = "";
            else if (w === "?")
              u.state = y.PROC_INST, u.procInstName = u.procInstBody = "";
            else {
              if (F(u, "Unencoded <"), u.startTagPosition + 1 < u.position) {
                var W = u.position - u.startTagPosition;
                w = new Array(W).join(" ") + w;
              }
              u.textNode += "<" + w, u.state = y.TEXT;
            }
            continue;
          case y.SGML_DECL:
            if (u.sgmlDecl + w === "--") {
              u.state = y.COMMENT, u.comment = "", u.sgmlDecl = "";
              continue;
            }
            u.doctype && u.doctype !== !0 && u.sgmlDecl ? (u.state = y.DOCTYPE_DTD, u.doctype += "<!" + u.sgmlDecl + w, u.sgmlDecl = "") : h.test(u.sgmlDecl + w) ? (C(u, "onopencdata"), u.state = y.CDATA, u.sgmlDecl = "", u.cdata = "") : g.test(u.sgmlDecl + w) ? (u.state = y.DOCTYPE, (u.doctype || u.sawRoot) && F(
              u,
              "Inappropriately located doctype declaration"
            ), u.doctype = "", u.sgmlDecl = "") : w === ">" ? (C(u, "onsgmldeclaration", u.sgmlDecl), u.sgmlDecl = "", u.state = y.TEXT) : (J(w) && (u.state = y.SGML_DECL_QUOTED), u.sgmlDecl += w);
            continue;
          case y.SGML_DECL_QUOTED:
            w === u.q && (u.state = y.SGML_DECL, u.q = ""), u.sgmlDecl += w;
            continue;
          case y.DOCTYPE:
            w === ">" ? (u.state = y.TEXT, C(u, "ondoctype", u.doctype), u.doctype = !0) : (u.doctype += w, w === "[" ? u.state = y.DOCTYPE_DTD : J(w) && (u.state = y.DOCTYPE_QUOTED, u.q = w));
            continue;
          case y.DOCTYPE_QUOTED:
            u.doctype += w, w === u.q && (u.q = "", u.state = y.DOCTYPE);
            continue;
          case y.DOCTYPE_DTD:
            w === "]" ? (u.doctype += w, u.state = y.DOCTYPE) : w === "<" ? (u.state = y.OPEN_WAKA, u.startTagPosition = u.position) : J(w) ? (u.doctype += w, u.state = y.DOCTYPE_DTD_QUOTED, u.q = w) : u.doctype += w;
            continue;
          case y.DOCTYPE_DTD_QUOTED:
            u.doctype += w, w === u.q && (u.state = y.DOCTYPE_DTD, u.q = "");
            continue;
          case y.COMMENT:
            w === "-" ? u.state = y.COMMENT_ENDING : u.comment += w;
            continue;
          case y.COMMENT_ENDING:
            w === "-" ? (u.state = y.COMMENT_ENDED, u.comment = I(u.opt, u.comment), u.comment && C(u, "oncomment", u.comment), u.comment = "") : (u.comment += "-" + w, u.state = y.COMMENT);
            continue;
          case y.COMMENT_ENDED:
            w !== ">" ? (F(u, "Malformed comment"), u.comment += "--" + w, u.state = y.COMMENT) : u.doctype && u.doctype !== !0 ? u.state = y.DOCTYPE_DTD : u.state = y.TEXT;
            continue;
          case y.CDATA:
            for (var te = S - 1; w && w !== "]"; )
              w = qt(d, S++), w && u.trackPosition && (u.position++, w === `
` ? (u.line++, u.column = 0) : u.column++);
            u.cdata += d.substring(te, S - 1), w === "]" && (u.state = y.CDATA_ENDING);
            continue;
          case y.CDATA_ENDING:
            w === "]" ? u.state = y.CDATA_ENDING_2 : (u.cdata += "]" + w, u.state = y.CDATA);
            continue;
          case y.CDATA_ENDING_2:
            w === ">" ? (u.cdata && C(u, "oncdata", u.cdata), C(u, "onclosecdata"), u.cdata = "", u.state = y.TEXT) : w === "]" ? u.cdata += "]" : (u.cdata += "]]" + w, u.state = y.CDATA);
            continue;
          case y.PROC_INST:
            w === "?" ? u.state = y.PROC_INST_ENDING : G(w) ? u.state = y.PROC_INST_BODY : u.procInstName += w;
            continue;
          case y.PROC_INST_BODY:
            if (!u.procInstBody && G(w))
              continue;
            w === "?" ? u.state = y.PROC_INST_ENDING : u.procInstBody += w;
            continue;
          case y.PROC_INST_ENDING:
            if (w === ">") {
              const Me = {
                name: u.procInstName,
                body: u.procInstBody
              };
              P(u, Me), C(u, "onprocessinginstruction", Me), u.procInstName = u.procInstBody = "", u.state = y.TEXT;
            } else
              u.procInstBody += "?" + w, u.state = y.PROC_INST_BODY;
            continue;
          case y.OPEN_TAG:
            oe(R, w) ? u.tagName += w : (z(u), w === ">" ? we(u) : w === "/" ? u.state = y.OPEN_TAG_SLASH : (G(w) || F(u, "Invalid character in tag name"), u.state = y.ATTRIB));
            continue;
          case y.OPEN_TAG_SLASH:
            w === ">" ? (we(u, !0), wn(u)) : (F(
              u,
              "Forward-slash in opening tag not followed by >"
            ), u.state = y.ATTRIB);
            continue;
          case y.ATTRIB:
            if (G(w))
              continue;
            w === ">" ? we(u) : w === "/" ? u.state = y.OPEN_TAG_SLASH : oe(T, w) ? (u.attribName = w, u.attribValue = "", u.state = y.ATTRIB_NAME) : F(u, "Invalid attribute name");
            continue;
          case y.ATTRIB_NAME:
            w === "=" ? u.state = y.ATTRIB_VALUE : w === ">" ? (F(u, "Attribute without value"), u.attribValue = u.attribName, M(u), we(u)) : G(w) ? u.state = y.ATTRIB_NAME_SAW_WHITE : oe(R, w) ? u.attribName += w : F(u, "Invalid attribute name");
            continue;
          case y.ATTRIB_NAME_SAW_WHITE:
            if (w === "=")
              u.state = y.ATTRIB_VALUE;
            else {
              if (G(w))
                continue;
              F(u, "Attribute without value"), u.tag.attributes[u.attribName] = "", u.attribValue = "", C(u, "onattribute", {
                name: u.attribName,
                value: ""
              }), u.attribName = "", w === ">" ? we(u) : oe(T, w) ? (u.attribName = w, u.state = y.ATTRIB_NAME) : (F(u, "Invalid attribute name"), u.state = y.ATTRIB);
            }
            continue;
          case y.ATTRIB_VALUE:
            if (G(w))
              continue;
            J(w) ? (u.q = w, u.state = y.ATTRIB_VALUE_QUOTED) : (u.opt.unquotedAttributeValues || k(u, "Unquoted attribute value"), u.state = y.ATTRIB_VALUE_UNQUOTED, u.attribValue = w);
            continue;
          case y.ATTRIB_VALUE_QUOTED:
            if (w !== u.q) {
              w === "&" ? u.state = y.ATTRIB_VALUE_ENTITY_Q : u.attribValue += w;
              continue;
            }
            M(u), u.q = "", u.state = y.ATTRIB_VALUE_CLOSED;
            continue;
          case y.ATTRIB_VALUE_CLOSED:
            G(w) ? u.state = y.ATTRIB : w === ">" ? we(u) : w === "/" ? u.state = y.OPEN_TAG_SLASH : oe(T, w) ? (F(u, "No whitespace between attributes"), u.attribName = w, u.attribValue = "", u.state = y.ATTRIB_NAME) : F(u, "Invalid attribute name");
            continue;
          case y.ATTRIB_VALUE_UNQUOTED:
            if (!Q(w)) {
              w === "&" ? u.state = y.ATTRIB_VALUE_ENTITY_U : u.attribValue += w;
              continue;
            }
            M(u), w === ">" ? we(u) : u.state = y.ATTRIB;
            continue;
          case y.CLOSE_TAG:
            if (u.tagName)
              w === ">" ? wn(u) : oe(R, w) ? u.tagName += w : u.script ? (u.script += "</" + u.tagName + w, u.tagName = "", u.state = y.SCRIPT) : (G(w) || F(u, "Invalid tagname in closing tag"), u.state = y.CLOSE_TAG_SAW_WHITE);
            else {
              if (G(w))
                continue;
              U(T, w) ? u.script ? (u.script += "</" + w, u.state = y.SCRIPT) : F(u, "Invalid tagname in closing tag.") : u.tagName = w;
            }
            continue;
          case y.CLOSE_TAG_SAW_WHITE:
            if (G(w))
              continue;
            w === ">" ? wn(u) : F(u, "Invalid characters in closing tag");
            continue;
          case y.TEXT_ENTITY:
          case y.ATTRIB_VALUE_ENTITY_Q:
          case y.ATTRIB_VALUE_ENTITY_U:
            var se, _e;
            switch (u.state) {
              case y.TEXT_ENTITY:
                se = y.TEXT, _e = "textNode";
                break;
              case y.ATTRIB_VALUE_ENTITY_Q:
                se = y.ATTRIB_VALUE_QUOTED, _e = "attribValue";
                break;
              case y.ATTRIB_VALUE_ENTITY_U:
                se = y.ATTRIB_VALUE_UNQUOTED, _e = "attribValue";
                break;
            }
            if (w === ";") {
              var ve = ke(u);
              u.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(ve) ? ((u.entityCount += 1) > u.opt.maxEntityCount && k(
                u,
                "Parsed entity count exceeds max entity count"
              ), (u.entityDepth += 1) > u.opt.maxEntityDepth && k(
                u,
                "Parsed entity depth exceeds max entity depth"
              ), u.entity = "", u.state = se, u.write(ve), u.entityDepth -= 1) : (u[_e] += ve, u.entity = "", u.state = se);
            } else oe(u.entity.length ? B : D, w) ? u.entity += w : (F(u, "Invalid character in entity name"), u[_e] += "&" + u.entity + w, u.entity = "", u.state = se);
            continue;
          default:
            throw new Error(u, "Unknown state: " + u.state);
        }
      return u.position >= u.bufferCheckPosition && i(u), u;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var d = String.fromCharCode, u = Math.floor, S = function() {
        var w = 16384, W = [], te, se, _e = -1, ve = arguments.length;
        if (!ve)
          return "";
        for (var Me = ""; ++_e < ve; ) {
          var ue = Number(arguments[_e]);
          if (!isFinite(ue) || // `NaN`, `+Infinity`, or `-Infinity`
          ue < 0 || // not a valid Unicode code point
          ue > 1114111 || // not a valid Unicode code point
          u(ue) !== ue)
            throw RangeError("Invalid code point: " + ue);
          ue <= 65535 ? W.push(ue) : (ue -= 65536, te = (ue >> 10) + 55296, se = ue % 1024 + 56320, W.push(te, se)), (_e + 1 === ve || W.length > w) && (Me += d.apply(null, W), W.length = 0);
        }
        return Me;
      };
      Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
        value: S,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = S;
    }();
  })(e);
})(Lc);
Object.defineProperty(nr, "__esModule", { value: !0 });
nr.XElement = void 0;
nr.parseXml = bm;
const Am = Lc, Sr = mn;
class Uc {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, Sr.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!Sm(t))
      throw (0, Sr.newError)(`Invalid element name: ${t}`, "ERR_XML_ELEMENT_INVALID_NAME");
  }
  attribute(t) {
    const n = this.attributes === null ? null : this.attributes[t];
    if (n == null)
      throw (0, Sr.newError)(`No attribute "${t}"`, "ERR_XML_MISSED_ATTRIBUTE");
    return n;
  }
  removeAttribute(t) {
    this.attributes !== null && delete this.attributes[t];
  }
  element(t, n = !1, r = null) {
    const i = this.elementOrNull(t, n);
    if (i === null)
      throw (0, Sr.newError)(r || `No element "${t}"`, "ERR_XML_MISSED_ELEMENT");
    return i;
  }
  elementOrNull(t, n = !1) {
    if (this.elements === null)
      return null;
    for (const r of this.elements)
      if (la(r, t, n))
        return r;
    return null;
  }
  getElements(t, n = !1) {
    return this.elements === null ? [] : this.elements.filter((r) => la(r, t, n));
  }
  elementValueOrEmpty(t, n = !1) {
    const r = this.elementOrNull(t, n);
    return r === null ? "" : r.value;
  }
}
nr.XElement = Uc;
const Tm = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function Sm(e) {
  return Tm.test(e);
}
function la(e, t, n) {
  const r = e.name;
  return r === t || n === !0 && r.length === t.length && r.toLowerCase() === t.toLowerCase();
}
function bm(e) {
  let t = null;
  const n = Am.parser(!0, {}), r = [];
  return n.onopentag = (i) => {
    const o = new Uc(i.name);
    if (o.attributes = i.attributes, t === null)
      t = o;
    else {
      const s = r[r.length - 1];
      s.elements == null && (s.elements = []), s.elements.push(o);
    }
    r.push(o);
  }, n.onclosetag = () => {
    r.pop();
  }, n.ontext = (i) => {
    r.length > 0 && (r[r.length - 1].value = i);
  }, n.oncdata = (i) => {
    const o = r[r.length - 1];
    o.value = i, o.isCData = !0;
  }, n.onerror = (i) => {
    throw i;
  }, n.write(e), t;
}
var Ht = {};
Object.defineProperty(Ht, "__esModule", { value: !0 });
Ht.mapToObject = kc;
Ht.isValidKey = ii;
Ht.asArray = Cm;
Ht.deepAssign = Rm;
Ht.objectToArgs = Pm;
function kc(e) {
  const t = {};
  for (const [n, r] of e)
    ii(n) && (r instanceof Map ? t[n] = kc(r) : t[n] = r);
  return t;
}
function ii(e) {
  return ["__proto__", "prototype", "constructor"].includes(e) ? !1 : ["string", "number", "symbol", "boolean"].includes(typeof e) || e === null;
}
function Cm(e) {
  return e == null ? [] : Array.isArray(e) ? e : [e];
}
function ca(e) {
  if (Array.isArray(e))
    return !1;
  const t = typeof e;
  return t === "object" || t === "function";
}
function $m(e, t, n) {
  const r = t[n];
  if (r === void 0)
    return;
  const i = e[n];
  i == null || r == null || !ca(i) || !ca(r) ? Array.isArray(i) && Array.isArray(r) ? e[n] = Array.from(new Set(i.concat(r))) : e[n] = r : e[n] = Mc(i, r);
}
function Mc(e, t) {
  if (e !== t)
    for (const n of Object.getOwnPropertyNames(t))
      ii(n) && $m(e, t, n);
  return e;
}
function Rm(e, ...t) {
  for (const n of t)
    n != null && Mc(e, n);
  return e;
}
const Om = /^[a-zA-Z][a-zA-Z0-9-]*$/, Im = /[\0\r\n]/;
function Pm(e) {
  const t = Object.entries(e).reduce((n, [r, i]) => {
    if (!ii(r) || i == null)
      return n;
    if (!Om.test(r))
      throw new Error(`objectToArgs: unsafe flag name rejected: ${JSON.stringify(r)}`);
    if (Im.test(i))
      throw new Error(`objectToArgs: value for --${r} contains a null byte or newline`);
    return n.concat([`--${r}`, i]);
  }, []);
  return Object.freeze(t);
}
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.objectToArgs = e.deepAssign = e.asArray = e.mapToObject = e.isValidKey = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubTagPrefix = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.isSensitiveFieldName = e.HttpExecutor = e.hashSensitiveValue = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0;
  var t = wt;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var n = mn;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return n.newError;
  } });
  var r = fe;
  Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
    return r.configureRequestOptions;
  } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
    return r.configureRequestOptionsFromUrl;
  } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
    return r.configureRequestUrl;
  } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
    return r.createHttpError;
  } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
    return r.DigestTransform;
  } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
    return r.HttpError;
  } }), Object.defineProperty(e, "hashSensitiveValue", { enumerable: !0, get: function() {
    return r.hashSensitiveValue;
  } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
    return r.HttpExecutor;
  } }), Object.defineProperty(e, "isSensitiveFieldName", { enumerable: !0, get: function() {
    return r.isSensitiveFieldName;
  } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
    return r.parseJson;
  } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
    return r.safeGetHeader;
  } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
    return r.safeStringifyJson;
  } });
  var i = ri;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return i.MemoLazy;
  } });
  var o = er;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return o.ProgressCallbackTransform;
  } });
  var s = tr;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return s.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return s.githubUrl;
  } }), Object.defineProperty(e, "githubTagPrefix", { enumerable: !0, get: function() {
    return s.githubTagPrefix;
  } });
  var a = qo;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return a.retry;
  } });
  var c = Vo;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return c.parseDn;
  } });
  var m = dn;
  Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
    return m.UUID;
  } });
  var l = nr;
  Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
    return l.parseXml;
  } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
    return l.XElement;
  } });
  var f = Ht;
  Object.defineProperty(e, "isValidKey", { enumerable: !0, get: function() {
    return f.isValidKey;
  } }), Object.defineProperty(e, "mapToObject", { enumerable: !0, get: function() {
    return f.mapToObject;
  } }), Object.defineProperty(e, "asArray", { enumerable: !0, get: function() {
    return f.asArray;
  } }), Object.defineProperty(e, "deepAssign", { enumerable: !0, get: function() {
    return f.deepAssign;
  } }), Object.defineProperty(e, "objectToArgs", { enumerable: !0, get: function() {
    return f.objectToArgs;
  } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
})(de);
var ye = {}, Wo = {}, Ve = {};
function Bc(e) {
  return typeof e > "u" || e === null;
}
function Nm(e) {
  return typeof e == "object" && e !== null;
}
function Dm(e) {
  return Array.isArray(e) ? e : Bc(e) ? [] : [e];
}
function Fm(e, t) {
  if (t) {
    const n = Object.keys(t);
    for (let r = 0, i = n.length; r < i; r += 1) {
      const o = n[r];
      e[o] = t[o];
    }
  }
  return e;
}
function xm(e, t) {
  let n = "";
  for (let r = 0; r < t; r += 1)
    n += e;
  return n;
}
function Lm(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
Ve.isNothing = Bc;
Ve.isObject = Nm;
Ve.toArray = Dm;
Ve.repeat = xm;
Ve.isNegativeZero = Lm;
Ve.extend = Fm;
function jc(e, t) {
  let n = "";
  const r = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (n += 'in "' + e.mark.name + '" '), n += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (n += `

` + e.mark.snippet), r + " " + n) : r;
}
function jn(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = jc(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
jn.prototype = Object.create(Error.prototype);
jn.prototype.constructor = jn;
jn.prototype.toString = function(t) {
  return this.name + ": " + jc(this, t);
};
var rr = jn;
const On = Ve;
function Ui(e, t, n, r, i) {
  let o = "", s = "";
  const a = Math.floor(i / 2) - 1;
  return r - t > a && (o = " ... ", t = r - a + o.length), n - r > a && (s = " ...", n = r + a - s.length), {
    str: o + e.slice(t, n).replace(/\t/g, "→") + s,
    pos: r - t + o.length
    // relative position
  };
}
function ki(e, t) {
  return On.repeat(" ", t - e.length) + e;
}
function Um(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  const n = /\r?\n|\r|\0/g, r = [0], i = [];
  let o, s = -1;
  for (; o = n.exec(e.buffer); )
    i.push(o.index), r.push(o.index + o[0].length), e.position <= o.index && s < 0 && (s = r.length - 2);
  s < 0 && (s = r.length - 1);
  let a = "";
  const c = Math.min(e.line + t.linesAfter, i.length).toString().length, m = t.maxLength - (t.indent + c + 3);
  for (let f = 1; f <= t.linesBefore && !(s - f < 0); f++) {
    const h = Ui(
      e.buffer,
      r[s - f],
      i[s - f],
      e.position - (r[s] - r[s - f]),
      m
    );
    a = On.repeat(" ", t.indent) + ki((e.line - f + 1).toString(), c) + " | " + h.str + `
` + a;
  }
  const l = Ui(e.buffer, r[s], i[s], e.position, m);
  a += On.repeat(" ", t.indent) + ki((e.line + 1).toString(), c) + " | " + l.str + `
`, a += On.repeat("-", t.indent + c + 3 + l.pos) + `^
`;
  for (let f = 1; f <= t.linesAfter && !(s + f >= i.length); f++) {
    const h = Ui(
      e.buffer,
      r[s + f],
      i[s + f],
      e.position - (r[s] - r[s + f]),
      m
    );
    a += On.repeat(" ", t.indent) + ki((e.line + f + 1).toString(), c) + " | " + h.str + `
`;
  }
  return a.replace(/\n$/, "");
}
var km = Um;
const ua = rr, Mm = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], Bm = [
  "scalar",
  "sequence",
  "mapping"
];
function jm(e) {
  const t = {};
  return e !== null && Object.keys(e).forEach(function(n) {
    e[n].forEach(function(r) {
      t[String(r)] = n;
    });
  }), t;
}
function Hm(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(n) {
    if (Mm.indexOf(n) === -1)
      throw new ua('Unknown option "' + n + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(n) {
    return n;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = jm(t.styleAliases || null), Bm.indexOf(this.kind) === -1)
    throw new ua('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var Ie = Hm;
const Cn = rr, Mi = Ie;
function fa(e, t) {
  const n = [];
  return e[t].forEach(function(r) {
    let i = n.length;
    n.forEach(function(o, s) {
      o.tag === r.tag && o.kind === r.kind && o.multi === r.multi && (i = s);
    }), n[i] = r;
  }), n;
}
function Gm() {
  const e = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  };
  function t(n) {
    n.multi ? (e.multi[n.kind].push(n), e.multi.fallback.push(n)) : e[n.kind][n.tag] = e.fallback[n.tag] = n;
  }
  for (let n = 0, r = arguments.length; n < r; n += 1)
    arguments[n].forEach(t);
  return e;
}
function _o(e) {
  return this.extend(e);
}
_o.prototype.extend = function(t) {
  let n = [], r = [];
  if (t instanceof Mi)
    r.push(t);
  else if (Array.isArray(t))
    r = r.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (n = n.concat(t.implicit)), t.explicit && (r = r.concat(t.explicit));
  else
    throw new Cn("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  n.forEach(function(o) {
    if (!(o instanceof Mi))
      throw new Cn("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (o.loadKind && o.loadKind !== "scalar")
      throw new Cn("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (o.multi)
      throw new Cn("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), r.forEach(function(o) {
    if (!(o instanceof Mi))
      throw new Cn("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  const i = Object.create(_o.prototype);
  return i.implicit = (this.implicit || []).concat(n), i.explicit = (this.explicit || []).concat(r), i.compiledImplicit = fa(i, "implicit"), i.compiledExplicit = fa(i, "explicit"), i.compiledTypeMap = Gm(i.compiledImplicit, i.compiledExplicit), i;
};
var Hc = _o;
const qm = Ie;
var Gc = new qm("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
});
const Vm = Ie;
var qc = new Vm("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
});
const Wm = Ie;
var Vc = new Wm("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
});
const Ym = Hc;
var Wc = new Ym({
  explicit: [
    Gc,
    qc,
    Vc
  ]
});
const zm = Ie;
function Xm(e) {
  if (e === null) return !0;
  const t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function Km() {
  return null;
}
function Jm(e) {
  return e === null;
}
var Yc = new zm("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: Xm,
  construct: Km,
  predicate: Jm,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
const Qm = Ie;
function Zm(e) {
  if (e === null) return !1;
  const t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function eg(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function tg(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var zc = new Qm("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: Zm,
  construct: eg,
  predicate: tg,
  represent: {
    lowercase: function(e) {
      return e ? "true" : "false";
    },
    uppercase: function(e) {
      return e ? "TRUE" : "FALSE";
    },
    camelcase: function(e) {
      return e ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
const ng = Ve, rg = Ie;
function ig(e) {
  return e >= 48 && e <= 57 || e >= 65 && e <= 70 || e >= 97 && e <= 102;
}
function og(e) {
  return e >= 48 && e <= 55;
}
function sg(e) {
  return e >= 48 && e <= 57;
}
function ag(e) {
  if (e === null) return !1;
  const t = e.length;
  let n = 0, r = !1;
  if (!t) return !1;
  let i = e[n];
  if ((i === "-" || i === "+") && (i = e[++n]), i === "0") {
    if (n + 1 === t) return !0;
    if (i = e[++n], i === "b") {
      for (n++; n < t; n++) {
        if (i = e[n], i !== "0" && i !== "1") return !1;
        r = !0;
      }
      return r && isFinite(In(e));
    }
    if (i === "x") {
      for (n++; n < t; n++) {
        if (!ig(e.charCodeAt(n))) return !1;
        r = !0;
      }
      return r && isFinite(In(e));
    }
    if (i === "o") {
      for (n++; n < t; n++) {
        if (!og(e.charCodeAt(n))) return !1;
        r = !0;
      }
      return r && isFinite(In(e));
    }
  }
  for (; n < t; n++) {
    if (!sg(e.charCodeAt(n)))
      return !1;
    r = !0;
  }
  return r ? isFinite(In(e)) : !1;
}
function In(e) {
  let t = e, n = 1, r = t[0];
  if ((r === "-" || r === "+") && (r === "-" && (n = -1), t = t.slice(1), r = t[0]), t === "0") return 0;
  if (r === "0") {
    if (t[1] === "b") return n * parseInt(t.slice(2), 2);
    if (t[1] === "x") return n * parseInt(t.slice(2), 16);
    if (t[1] === "o") return n * parseInt(t.slice(2), 8);
  }
  return n * parseInt(t, 10);
}
function lg(e) {
  return In(e);
}
function cg(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !ng.isNegativeZero(e);
}
var Xc = new rg("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: ag,
  construct: lg,
  predicate: cg,
  represent: {
    binary: function(e) {
      return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
    },
    octal: function(e) {
      return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
    },
    decimal: function(e) {
      return e.toString(10);
    },
    hexadecimal: function(e) {
      return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
const Kc = Ve, ug = Ie, fg = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
), dg = new RegExp(
  "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function hg(e) {
  return e === null || !fg.test(e) ? !1 : isFinite(parseFloat(e, 10)) ? !0 : dg.test(e);
}
function pg(e) {
  let t = e.toLowerCase();
  const n = t[0] === "-" ? -1 : 1;
  return "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? n === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : n * parseFloat(t, 10);
}
const mg = /^[-+]?[0-9]+e/;
function gg(e, t) {
  if (isNaN(e))
    switch (t) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (Kc.isNegativeZero(e))
    return "-0.0";
  const n = e.toString(10);
  return mg.test(n) ? n.replace("e", ".e") : n;
}
function Eg(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || Kc.isNegativeZero(e));
}
var Jc = new ug("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: hg,
  construct: pg,
  predicate: Eg,
  represent: gg,
  defaultStyle: "lowercase"
}), Qc = Wc.extend({
  implicit: [
    Yc,
    zc,
    Xc,
    Jc
  ]
}), Zc = Qc;
const yg = Ie, eu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), tu = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function wg(e) {
  return e === null ? !1 : eu.exec(e) !== null || tu.exec(e) !== null;
}
function _g(e) {
  let t = 0, n = null, r = eu.exec(e);
  if (r === null && (r = tu.exec(e)), r === null) throw new Error("Date resolve error");
  const i = +r[1], o = +r[2] - 1, s = +r[3];
  if (!r[4])
    return new Date(Date.UTC(i, o, s));
  const a = +r[4], c = +r[5], m = +r[6];
  if (r[7]) {
    for (t = r[7].slice(0, 3); t.length < 3; )
      t += "0";
    t = +t;
  }
  if (r[9]) {
    const f = +r[10], h = +(r[11] || 0);
    n = (f * 60 + h) * 6e4, r[9] === "-" && (n = -n);
  }
  const l = new Date(Date.UTC(i, o, s, a, c, m, t));
  return n && l.setTime(l.getTime() - n), l;
}
function vg(e) {
  return e.toISOString();
}
var nu = new yg("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: wg,
  construct: _g,
  instanceOf: Date,
  represent: vg
});
const Ag = Ie;
function Tg(e) {
  return e === "<<" || e === null;
}
var ru = new Ag("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: Tg
});
const Sg = Ie, Yo = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function bg(e) {
  if (e === null) return !1;
  let t = 0;
  const n = e.length, r = Yo;
  for (let i = 0; i < n; i++) {
    const o = r.indexOf(e.charAt(i));
    if (!(o > 64)) {
      if (o < 0) return !1;
      t += 6;
    }
  }
  return t % 8 === 0;
}
function Cg(e) {
  const t = e.replace(/[\r\n=]/g, ""), n = t.length, r = Yo;
  let i = 0;
  const o = [];
  for (let a = 0; a < n; a++)
    a % 4 === 0 && a && (o.push(i >> 16 & 255), o.push(i >> 8 & 255), o.push(i & 255)), i = i << 6 | r.indexOf(t.charAt(a));
  const s = n % 4 * 6;
  return s === 0 ? (o.push(i >> 16 & 255), o.push(i >> 8 & 255), o.push(i & 255)) : s === 18 ? (o.push(i >> 10 & 255), o.push(i >> 2 & 255)) : s === 12 && o.push(i >> 4 & 255), new Uint8Array(o);
}
function $g(e) {
  let t = "", n = 0;
  const r = e.length, i = Yo;
  for (let s = 0; s < r; s++)
    s % 3 === 0 && s && (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]), n = (n << 8) + e[s];
  const o = r % 3;
  return o === 0 ? (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]) : o === 2 ? (t += i[n >> 10 & 63], t += i[n >> 4 & 63], t += i[n << 2 & 63], t += i[64]) : o === 1 && (t += i[n >> 2 & 63], t += i[n << 4 & 63], t += i[64], t += i[64]), t;
}
function Rg(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var iu = new Sg("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: bg,
  construct: Cg,
  predicate: Rg,
  represent: $g
});
const Og = Ie, da = Object.prototype.hasOwnProperty, Ig = Object.prototype.toString;
function Pg(e) {
  if (e === null) return !0;
  const t = {}, n = e;
  for (let r = 0, i = n.length; r < i; r += 1) {
    const o = n[r];
    let s = !1;
    if (Ig.call(o) !== "[object Object]") return !1;
    let a;
    for (a in o)
      if (da.call(o, a))
        if (!s) s = !0;
        else return !1;
    if (!s || da.call(t, a)) return !1;
    Object.defineProperty(t, a, { value: !0 });
  }
  return !0;
}
function Ng(e) {
  return e !== null ? e : [];
}
var ou = new Og("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: Pg,
  construct: Ng
});
const Dg = Ie, Fg = Object.prototype.toString;
function xg(e) {
  if (e === null) return !0;
  const t = e, n = new Array(t.length);
  for (let r = 0, i = t.length; r < i; r += 1) {
    const o = t[r];
    if (Fg.call(o) !== "[object Object]") return !1;
    const s = Object.keys(o);
    if (s.length !== 1) return !1;
    n[r] = [s[0], o[s[0]]];
  }
  return !0;
}
function Lg(e) {
  if (e === null) return [];
  const t = e, n = new Array(t.length);
  for (let r = 0, i = t.length; r < i; r += 1) {
    const o = t[r], s = Object.keys(o);
    n[r] = [s[0], o[s[0]]];
  }
  return n;
}
var su = new Dg("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: xg,
  construct: Lg
});
const Ug = Ie, kg = Object.prototype.hasOwnProperty;
function Mg(e) {
  if (e === null) return !0;
  const t = e;
  for (const n in t)
    if (kg.call(t, n) && t[n] !== null)
      return !1;
  return !0;
}
function Bg(e) {
  return e !== null ? e : {};
}
var au = new Ug("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: Mg,
  construct: Bg
}), zo = Zc.extend({
  implicit: [
    nu,
    ru
  ],
  explicit: [
    iu,
    ou,
    su,
    au
  ]
});
const Dt = Ve, lu = rr, jg = km, Hg = zo, qe = Object.prototype.hasOwnProperty, qr = 1, cu = 2, uu = 3, Vr = 4, Bi = 1, Gg = 2, ha = 3, qg = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Vg = /[\x85\u2028\u2029]/, Wg = /[,\[\]{}]/, fu = /^(?:!|!!|![0-9A-Za-z-]+!)$/, du = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
function pa(e) {
  return Object.prototype.toString.call(e);
}
function et(e) {
  return e === 10 || e === 13;
}
function ot(e) {
  return e === 9 || e === 32;
}
function De(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function nn(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function Yg(e) {
  if (e >= 48 && e <= 57)
    return e - 48;
  const t = e | 32;
  return t >= 97 && t <= 102 ? t - 97 + 10 : -1;
}
function zg(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function Xg(e) {
  return e >= 48 && e <= 57 ? e - 48 : -1;
}
function ma(e) {
  switch (e) {
    case 48:
      return "\0";
    case 97:
      return "\x07";
    case 98:
      return "\b";
    case 116:
      return "	";
    case 9:
      return "	";
    case 110:
      return `
`;
    case 118:
      return "\v";
    case 102:
      return "\f";
    case 114:
      return "\r";
    case 101:
      return "\x1B";
    case 32:
      return " ";
    case 34:
      return '"';
    case 47:
      return "/";
    case 92:
      return "\\";
    case 78:
      return "";
    case 95:
      return " ";
    case 76:
      return "\u2028";
    case 80:
      return "\u2029";
    default:
      return "";
  }
}
function Kg(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
function hu(e, t, n) {
  t === "__proto__" ? Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !0,
    writable: !0,
    value: n
  }) : e[t] = n;
}
const pu = new Array(256), mu = new Array(256);
for (let e = 0; e < 256; e++)
  pu[e] = ma(e) ? 1 : 0, mu[e] = ma(e);
function Jg(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || Hg, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.maxDepth = typeof t.maxDepth == "number" ? t.maxDepth : 100, this.maxTotalMergeKeys = typeof t.maxTotalMergeKeys == "number" ? t.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
}
function gu(e, t) {
  const n = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return n.snippet = jg(n), new lu(t, n);
}
function L(e, t) {
  throw gu(e, t);
}
function Wr(e, t) {
  e.onWarning && e.onWarning.call(null, gu(e, t));
}
function Ft(e, t, n) {
  const r = e.anchorMapTransactions;
  if (r.length !== 0) {
    const i = r[r.length - 1];
    qe.call(i, t) || (i[t] = {
      existed: qe.call(e.anchorMap, t),
      value: e.anchorMap[t]
    });
  }
  e.anchorMap[t] = n;
}
function Qg(e) {
  e.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
}
function Zg(e) {
  const t = e.anchorMapTransactions.pop(), n = e.anchorMapTransactions;
  if (n.length === 0) return;
  const r = n[n.length - 1], i = Object.keys(t);
  for (let o = 0, s = i.length; o < s; o += 1) {
    const a = i[o];
    qe.call(r, a) || (r[a] = t[a]);
  }
}
function e0(e) {
  const t = e.anchorMapTransactions.pop(), n = Object.keys(t);
  for (let r = n.length - 1; r >= 0; r -= 1) {
    const i = t[n[r]];
    i.existed ? e.anchorMap[n[r]] = i.value : delete e.anchorMap[n[r]];
  }
}
function Eu(e) {
  return {
    position: e.position,
    line: e.line,
    lineStart: e.lineStart,
    lineIndent: e.lineIndent,
    firstTabInLine: e.firstTabInLine,
    tag: e.tag,
    anchor: e.anchor,
    kind: e.kind,
    result: e.result
  };
}
function ga(e, t) {
  e.position = t.position, e.line = t.line, e.lineStart = t.lineStart, e.lineIndent = t.lineIndent, e.firstTabInLine = t.firstTabInLine, e.tag = t.tag, e.anchor = t.anchor, e.kind = t.kind, e.result = t.result;
}
const Ea = {
  YAML: function(t, n, r) {
    t.version !== null && L(t, "duplication of %YAML directive"), r.length !== 1 && L(t, "YAML directive accepts exactly one argument");
    const i = /^([0-9]+)\.([0-9]+)$/.exec(r[0]);
    i === null && L(t, "ill-formed argument of the YAML directive");
    const o = parseInt(i[1], 10), s = parseInt(i[2], 10);
    o !== 1 && L(t, "unacceptable YAML version of the document"), t.version = r[0], t.checkLineBreaks = s < 2, s !== 1 && s !== 2 && Wr(t, "unsupported YAML version of the document");
  },
  TAG: function(t, n, r) {
    let i;
    r.length !== 2 && L(t, "TAG directive accepts exactly two arguments");
    const o = r[0];
    i = r[1], fu.test(o) || L(t, "ill-formed tag handle (first argument) of the TAG directive"), qe.call(t.tagMap, o) && L(t, 'there is a previously declared suffix for "' + o + '" tag handle'), du.test(i) || L(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      i = decodeURIComponent(i);
    } catch {
      L(t, "tag prefix is malformed: " + i);
    }
    t.tagMap[o] = i;
  }
};
function Et(e, t, n, r) {
  if (t < n) {
    const i = e.input.slice(t, n);
    if (r)
      for (let o = 0, s = i.length; o < s; o += 1) {
        const a = i.charCodeAt(o);
        a === 9 || a >= 32 && a <= 1114111 || L(e, "expected valid JSON character");
      }
    else qg.test(i) && L(e, "the stream contains non-printable characters");
    e.result += i;
  }
}
function ya(e) {
  e.totalMergeKeys++, e.maxTotalMergeKeys !== -1 && e.totalMergeKeys > e.maxTotalMergeKeys && L(e, "merge keys exceeded maxTotalMergeKeys (" + e.maxTotalMergeKeys + ")");
}
function wa(e, t, n, r) {
  Dt.isObject(n) || L(e, "cannot merge mappings; the provided source object is unacceptable"), ya(e);
  const i = Object.keys(n);
  for (let o = 0, s = i.length; o < s; o += 1) {
    const a = i[o];
    ya(e), qe.call(t, a) || (hu(t, a, n[a]), r[a] = !0);
  }
}
function rn(e, t, n, r, i, o, s, a, c) {
  if (Array.isArray(i)) {
    i = Array.prototype.slice.call(i);
    for (let m = 0, l = i.length; m < l; m += 1)
      Array.isArray(i[m]) && L(e, "nested arrays are not supported inside keys"), typeof i == "object" && pa(i[m]) === "[object Object]" && (i[m] = "[object Object]");
  }
  if (typeof i == "object" && pa(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), r === "tag:yaml.org,2002:merge")
    if (Array.isArray(o)) {
      o.length > 100 && L(e, "abnormal merge sequence size");
      for (let m = 0, l = o.length; m < l; m += 1)
        wa(e, t, o[m], n);
    } else
      wa(e, t, o, n);
  else
    !e.json && !qe.call(n, i) && qe.call(t, i) && (e.line = s || e.line, e.lineStart = a || e.lineStart, e.position = c || e.position, L(e, "duplicated mapping key")), hu(t, i, o), delete n[i];
  return t;
}
function Xo(e) {
  const t = e.input.charCodeAt(e.position);
  t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : L(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function ae(e, t, n) {
  let r = 0, i = e.input.charCodeAt(e.position);
  for (; i !== 0; ) {
    for (; ot(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (t && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (et(i))
      for (Xo(e), i = e.input.charCodeAt(e.position), r++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return n !== -1 && r !== 0 && e.lineIndent < n && Wr(e, "deficient indentation"), r;
}
function oi(e) {
  let t = e.position, n = e.input.charCodeAt(t);
  return !!((n === 45 || n === 46) && n === e.input.charCodeAt(t + 1) && n === e.input.charCodeAt(t + 2) && (t += 3, n = e.input.charCodeAt(t), n === 0 || De(n)));
}
function Ko(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += Dt.repeat(`
`, t - 1));
}
function t0(e, t, n) {
  let r, i, o, s, a, c;
  const m = e.kind, l = e.result;
  let f = e.input.charCodeAt(e.position);
  if (De(f) || nn(f) || f === 35 || f === 38 || f === 42 || f === 33 || f === 124 || f === 62 || f === 39 || f === 34 || f === 37 || f === 64 || f === 96)
    return !1;
  if (f === 63 || f === 45) {
    const h = e.input.charCodeAt(e.position + 1);
    if (De(h) || n && nn(h))
      return !1;
  }
  for (e.kind = "scalar", e.result = "", r = i = e.position, o = !1; f !== 0; ) {
    if (f === 58) {
      const h = e.input.charCodeAt(e.position + 1);
      if (De(h) || n && nn(h))
        break;
    } else if (f === 35) {
      const h = e.input.charCodeAt(e.position - 1);
      if (De(h))
        break;
    } else {
      if (e.position === e.lineStart && oi(e) || n && nn(f))
        break;
      if (et(f))
        if (s = e.line, a = e.lineStart, c = e.lineIndent, ae(e, !1, -1), e.lineIndent >= t) {
          o = !0, f = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = i, e.line = s, e.lineStart = a, e.lineIndent = c;
          break;
        }
    }
    o && (Et(e, r, i, !1), Ko(e, e.line - s), r = i = e.position, o = !1), ot(f) || (i = e.position + 1), f = e.input.charCodeAt(++e.position);
  }
  return Et(e, r, i, !1), e.result ? !0 : (e.kind = m, e.result = l, !1);
}
function n0(e, t) {
  let n, r, i = e.input.charCodeAt(e.position);
  if (i !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (i = e.input.charCodeAt(e.position)) !== 0; )
    if (i === 39)
      if (Et(e, n, e.position, !0), i = e.input.charCodeAt(++e.position), i === 39)
        n = e.position, e.position++, r = e.position;
      else
        return !0;
    else et(i) ? (Et(e, n, r, !0), Ko(e, ae(e, !1, t)), n = r = e.position) : e.position === e.lineStart && oi(e) ? L(e, "unexpected end of the document within a single quoted scalar") : (e.position++, ot(i) || (r = e.position));
  L(e, "unexpected end of the stream within a single quoted scalar");
}
function r0(e, t) {
  let n, r, i, o = e.input.charCodeAt(e.position);
  if (o !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (o = e.input.charCodeAt(e.position)) !== 0; ) {
    if (o === 34)
      return Et(e, n, e.position, !0), e.position++, !0;
    if (o === 92) {
      if (Et(e, n, e.position, !0), o = e.input.charCodeAt(++e.position), et(o))
        ae(e, !1, t);
      else if (o < 256 && pu[o])
        e.result += mu[o], e.position++;
      else if ((i = zg(o)) > 0) {
        let s = i, a = 0;
        for (; s > 0; s--)
          o = e.input.charCodeAt(++e.position), (i = Yg(o)) >= 0 ? a = (a << 4) + i : L(e, "expected hexadecimal character");
        e.result += Kg(a), e.position++;
      } else
        L(e, "unknown escape sequence");
      n = r = e.position;
    } else et(o) ? (Et(e, n, r, !0), Ko(e, ae(e, !1, t)), n = r = e.position) : e.position === e.lineStart && oi(e) ? L(e, "unexpected end of the document within a double quoted scalar") : (e.position++, ot(o) || (r = e.position));
  }
  L(e, "unexpected end of the stream within a double quoted scalar");
}
function i0(e, t) {
  let n = !0, r, i, o;
  const s = e.tag;
  let a;
  const c = e.anchor;
  let m, l, f, h;
  const g = /* @__PURE__ */ Object.create(null);
  let _, E, A, T = e.input.charCodeAt(e.position);
  if (T === 91)
    m = 93, h = !1, a = [];
  else if (T === 123)
    m = 125, h = !0, a = {};
  else
    return !1;
  for (e.anchor !== null && Ft(e, e.anchor, a), T = e.input.charCodeAt(++e.position); T !== 0; ) {
    if (ae(e, !0, t), T = e.input.charCodeAt(e.position), T === m)
      return e.position++, e.tag = s, e.anchor = c, e.kind = h ? "mapping" : "sequence", e.result = a, !0;
    if (n ? T === 44 && L(e, "expected the node content, but found ','") : L(e, "missed comma between flow collection entries"), E = _ = A = null, l = f = !1, T === 63) {
      const R = e.input.charCodeAt(e.position + 1);
      De(R) && (l = f = !0, e.position++, ae(e, !0, t));
    }
    r = e.line, i = e.lineStart, o = e.position, hn(e, t, qr, !1, !0), E = e.tag, _ = e.result, ae(e, !0, t), T = e.input.charCodeAt(e.position), (f || e.line === r) && T === 58 && (l = !0, T = e.input.charCodeAt(++e.position), ae(e, !0, t), hn(e, t, qr, !1, !0), A = e.result), h ? rn(e, a, g, E, _, A, r, i, o) : l ? a.push(rn(e, null, g, E, _, A, r, i, o)) : a.push(_), ae(e, !0, t), T = e.input.charCodeAt(e.position), T === 44 ? (n = !0, T = e.input.charCodeAt(++e.position)) : n = !1;
  }
  L(e, "unexpected end of the stream within a flow collection");
}
function o0(e, t) {
  let n, r = Bi, i = !1, o = !1, s = t, a = 0, c = !1, m, l = e.input.charCodeAt(e.position);
  if (l === 124)
    n = !1;
  else if (l === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; l !== 0; )
    if (l = e.input.charCodeAt(++e.position), l === 43 || l === 45)
      Bi === r ? r = l === 43 ? ha : Gg : L(e, "repeat of a chomping mode identifier");
    else if ((m = Xg(l)) >= 0)
      m === 0 ? L(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : o ? L(e, "repeat of an indentation width identifier") : (s = t + m - 1, o = !0);
    else
      break;
  if (ot(l)) {
    do
      l = e.input.charCodeAt(++e.position);
    while (ot(l));
    if (l === 35)
      do
        l = e.input.charCodeAt(++e.position);
      while (!et(l) && l !== 0);
  }
  for (; l !== 0; ) {
    for (Xo(e), e.lineIndent = 0, l = e.input.charCodeAt(e.position); (!o || e.lineIndent < s) && l === 32; )
      e.lineIndent++, l = e.input.charCodeAt(++e.position);
    if (!o && e.lineIndent > s && (s = e.lineIndent), et(l)) {
      a++;
      continue;
    }
    if (!o && s === 0 && L(e, "missing indentation for block scalar"), e.lineIndent < s) {
      r === ha ? e.result += Dt.repeat(`
`, i ? 1 + a : a) : r === Bi && i && (e.result += `
`);
      break;
    }
    n ? ot(l) ? (c = !0, e.result += Dt.repeat(`
`, i ? 1 + a : a)) : c ? (c = !1, e.result += Dt.repeat(`
`, a + 1)) : a === 0 ? i && (e.result += " ") : e.result += Dt.repeat(`
`, a) : e.result += Dt.repeat(`
`, i ? 1 + a : a), i = !0, o = !0, a = 0;
    const f = e.position;
    for (; !et(l) && l !== 0; )
      l = e.input.charCodeAt(++e.position);
    Et(e, f, e.position, !1);
  }
  return !0;
}
function _a(e, t) {
  const n = e.tag, r = e.anchor, i = [];
  let o = !1;
  if (e.firstTabInLine !== -1) return !1;
  e.anchor !== null && Ft(e, e.anchor, i);
  let s = e.input.charCodeAt(e.position);
  for (; s !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, L(e, "tab characters must not be used in indentation")), s === 45); ) {
    const a = e.input.charCodeAt(e.position + 1);
    if (!De(a))
      break;
    if (o = !0, e.position++, ae(e, !0, -1) && e.lineIndent <= t) {
      i.push(null), s = e.input.charCodeAt(e.position);
      continue;
    }
    const c = e.line;
    if (hn(e, t, uu, !1, !0), i.push(e.result), ae(e, !0, -1), s = e.input.charCodeAt(e.position), (e.line === c || e.lineIndent > t) && s !== 0)
      L(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return o ? (e.tag = n, e.anchor = r, e.kind = "sequence", e.result = i, !0) : !1;
}
function yu(e, t, n) {
  let r, i, o, s;
  const a = e.tag, c = e.anchor, m = {}, l = /* @__PURE__ */ Object.create(null);
  let f = null, h = null, g = null, _ = !1, E = !1;
  if (e.firstTabInLine !== -1) return !1;
  e.anchor !== null && Ft(e, e.anchor, m);
  let A = e.input.charCodeAt(e.position);
  for (; A !== 0; ) {
    !_ && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, L(e, "tab characters must not be used in indentation"));
    const T = e.input.charCodeAt(e.position + 1), R = e.line;
    if ((A === 63 || A === 58) && De(T))
      A === 63 ? (_ && (rn(e, m, l, f, h, null, i, o, s), f = h = g = null), E = !0, _ = !0, r = !0) : _ ? (_ = !1, r = !0) : L(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, A = T;
    else {
      if (i = e.line, o = e.lineStart, s = e.position, !hn(e, n, cu, !1, !0))
        break;
      if (e.line === R) {
        for (A = e.input.charCodeAt(e.position); ot(A); )
          A = e.input.charCodeAt(++e.position);
        if (A === 58)
          A = e.input.charCodeAt(++e.position), De(A) || L(e, "a whitespace character is expected after the key-value separator within a block mapping"), _ && (rn(e, m, l, f, h, null, i, o, s), f = h = g = null), E = !0, _ = !1, r = !1, f = e.tag, h = e.result;
        else if (E)
          L(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = a, e.anchor = c, !0;
      } else if (E)
        L(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = a, e.anchor = c, !0;
    }
    if ((e.line === R || e.lineIndent > t) && (_ && (i = e.line, o = e.lineStart, s = e.position), hn(e, t, Vr, !0, r) && (_ ? h = e.result : g = e.result), _ || (rn(e, m, l, f, h, g, i, o, s), f = h = g = null), ae(e, !0, -1), A = e.input.charCodeAt(e.position)), (e.line === R || e.lineIndent > t) && A !== 0)
      L(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return _ && rn(e, m, l, f, h, null, i, o, s), E && (e.tag = a, e.anchor = c, e.kind = "mapping", e.result = m), E;
}
function s0(e) {
  let t = !1, n = !1, r, i, o = e.input.charCodeAt(e.position);
  if (o !== 33) return !1;
  e.tag !== null && L(e, "duplication of a tag property"), o = e.input.charCodeAt(++e.position), o === 60 ? (t = !0, o = e.input.charCodeAt(++e.position)) : o === 33 ? (n = !0, r = "!!", o = e.input.charCodeAt(++e.position)) : r = "!";
  let s = e.position;
  if (t) {
    do
      o = e.input.charCodeAt(++e.position);
    while (o !== 0 && o !== 62);
    e.position < e.length ? (i = e.input.slice(s, e.position), o = e.input.charCodeAt(++e.position)) : L(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; o !== 0 && !De(o); )
      o === 33 && (n ? L(e, "tag suffix cannot contain exclamation marks") : (r = e.input.slice(s - 1, e.position + 1), fu.test(r) || L(e, "named tag handle cannot contain such characters"), n = !0, s = e.position + 1)), o = e.input.charCodeAt(++e.position);
    i = e.input.slice(s, e.position), Wg.test(i) && L(e, "tag suffix cannot contain flow indicator characters");
  }
  i && !du.test(i) && L(e, "tag name cannot contain such characters: " + i);
  try {
    i = decodeURIComponent(i);
  } catch {
    L(e, "tag name is malformed: " + i);
  }
  return t ? e.tag = i : qe.call(e.tagMap, r) ? e.tag = e.tagMap[r] + i : r === "!" ? e.tag = "!" + i : r === "!!" ? e.tag = "tag:yaml.org,2002:" + i : L(e, 'undeclared tag handle "' + r + '"'), !0;
}
function a0(e) {
  let t = e.input.charCodeAt(e.position);
  if (t !== 38) return !1;
  e.anchor !== null && L(e, "duplication of an anchor property"), t = e.input.charCodeAt(++e.position);
  const n = e.position;
  for (; t !== 0 && !De(t) && !nn(t); )
    t = e.input.charCodeAt(++e.position);
  return e.position === n && L(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(n, e.position), !0;
}
function l0(e) {
  let t = e.input.charCodeAt(e.position);
  if (t !== 42) return !1;
  t = e.input.charCodeAt(++e.position);
  const n = e.position;
  for (; t !== 0 && !De(t) && !nn(t); )
    t = e.input.charCodeAt(++e.position);
  e.position === n && L(e, "name of an alias node must contain at least one character");
  const r = e.input.slice(n, e.position);
  return qe.call(e.anchorMap, r) || L(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], ae(e, !0, -1), !0;
}
function c0(e, t, n, r) {
  const i = Eu(e);
  return Qg(e), ga(e, t), e.tag = null, e.anchor = null, e.kind = null, e.result = null, yu(e, n, r) && e.kind === "mapping" ? (Zg(e), !0) : (e0(e), ga(e, i), !1);
}
function hn(e, t, n, r, i) {
  let o, s, a = 1, c = !1, m = !1, l = null, f, h, g;
  e.depth >= e.maxDepth && L(e, "nesting exceeded maxDepth (" + e.maxDepth + ")"), e.depth += 1, e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null;
  const _ = o = s = Vr === n || uu === n;
  if (r && ae(e, !0, -1) && (c = !0, e.lineIndent > t ? a = 1 : e.lineIndent === t ? a = 0 : e.lineIndent < t && (a = -1)), a === 1)
    for (; ; ) {
      const E = e.input.charCodeAt(e.position), A = Eu(e);
      if (c && (E === 33 && e.tag !== null || E === 38 && e.anchor !== null) || !s0(e) && !a0(e))
        break;
      l === null && (l = A), ae(e, !0, -1) ? (c = !0, s = _, e.lineIndent > t ? a = 1 : e.lineIndent === t ? a = 0 : e.lineIndent < t && (a = -1)) : s = !1;
    }
  if (s && (s = c || i), a === 1 || Vr === n)
    if (qr === n || cu === n ? h = t : h = t + 1, g = e.position - e.lineStart, a === 1)
      if (s && (_a(e, g) || yu(e, g, h)) || i0(e, h))
        m = !0;
      else {
        const E = e.input.charCodeAt(e.position);
        l !== null && _ && !s && E !== 124 && E !== 62 && c0(
          e,
          l,
          l.position - l.lineStart,
          h
        ) || o && o0(e, h) || n0(e, h) || r0(e, h) ? m = !0 : l0(e) ? (m = !0, (e.tag !== null || e.anchor !== null) && L(e, "alias node should not have any properties")) : t0(e, h, qr === n) && (m = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && Ft(e, e.anchor, e.result);
      }
    else a === 0 && (m = s && _a(e, g));
  if (e.tag === null)
    e.anchor !== null && Ft(e, e.anchor, e.result);
  else if (e.tag === "?") {
    e.result !== null && e.kind !== "scalar" && L(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"');
    for (let E = 0, A = e.implicitTypes.length; E < A; E += 1)
      if (f = e.implicitTypes[E], f.resolve(e.result)) {
        e.result = f.construct(e.result), e.tag = f.tag, e.anchor !== null && Ft(e, e.anchor, e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (qe.call(e.typeMap[e.kind || "fallback"], e.tag))
      f = e.typeMap[e.kind || "fallback"][e.tag];
    else {
      f = null;
      const E = e.typeMap.multi[e.kind || "fallback"];
      for (let A = 0, T = E.length; A < T; A += 1)
        if (e.tag.slice(0, E[A].tag.length) === E[A].tag) {
          f = E[A];
          break;
        }
    }
    f || L(e, "unknown tag !<" + e.tag + ">"), e.result !== null && f.kind !== e.kind && L(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + f.kind + '", not "' + e.kind + '"'), f.resolve(e.result, e.tag) ? (e.result = f.construct(e.result, e.tag), e.anchor !== null && Ft(e, e.anchor, e.result)) : L(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.depth -= 1, e.tag !== null || e.anchor !== null || m;
}
function u0(e) {
  const t = e.position;
  let n = !1, r;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (r = e.input.charCodeAt(e.position)) !== 0 && (ae(e, !0, -1), r = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || r !== 37)); ) {
    n = !0, r = e.input.charCodeAt(++e.position);
    let i = e.position;
    for (; r !== 0 && !De(r); )
      r = e.input.charCodeAt(++e.position);
    const o = e.input.slice(i, e.position), s = [];
    for (o.length < 1 && L(e, "directive name must not be less than one character in length"); r !== 0; ) {
      for (; ot(r); )
        r = e.input.charCodeAt(++e.position);
      if (r === 35) {
        do
          r = e.input.charCodeAt(++e.position);
        while (r !== 0 && !et(r));
        break;
      }
      if (et(r)) break;
      for (i = e.position; r !== 0 && !De(r); )
        r = e.input.charCodeAt(++e.position);
      s.push(e.input.slice(i, e.position));
    }
    r !== 0 && Xo(e), qe.call(Ea, o) ? Ea[o](e, o, s) : Wr(e, 'unknown document directive "' + o + '"');
  }
  if (ae(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, ae(e, !0, -1)) : n && L(e, "directives end mark is expected"), hn(e, e.lineIndent - 1, Vr, !1, !0), ae(e, !0, -1), e.checkLineBreaks && Vg.test(e.input.slice(t, e.position)) && Wr(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && oi(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, ae(e, !0, -1));
    return;
  }
  e.position < e.length - 1 && L(e, "end of the stream or a document separator is expected");
}
function wu(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  const n = new Jg(e, t), r = e.indexOf("\0");
  for (r !== -1 && (n.position = r, L(n, "null byte is not allowed in input")), n.input += "\0"; n.input.charCodeAt(n.position) === 32; )
    n.lineIndent += 1, n.position += 1;
  for (; n.position < n.length - 1; )
    u0(n);
  return n.documents;
}
function f0(e, t, n) {
  t !== null && typeof t == "object" && typeof n > "u" && (n = t, t = null);
  const r = wu(e, n);
  if (typeof t != "function")
    return r;
  for (let i = 0, o = r.length; i < o; i += 1)
    t(r[i]);
}
function d0(e, t) {
  const n = wu(e, t);
  if (n.length !== 0) {
    if (n.length === 1)
      return n[0];
    throw new lu("expected a single document in the stream, but found more");
  }
}
Wo.loadAll = f0;
Wo.load = d0;
var _u = {};
const si = Ve, ir = rr, h0 = zo, vu = Object.prototype.toString, Au = Object.prototype.hasOwnProperty, Jo = 65279, p0 = 9, Hn = 10, m0 = 13, g0 = 32, E0 = 33, y0 = 34, vo = 35, w0 = 37, _0 = 38, v0 = 39, A0 = 42, Tu = 44, T0 = 45, Yr = 58, S0 = 61, b0 = 62, C0 = 63, $0 = 64, Su = 91, bu = 93, R0 = 96, Cu = 123, O0 = 124, $u = 125, Se = {};
Se[0] = "\\0";
Se[7] = "\\a";
Se[8] = "\\b";
Se[9] = "\\t";
Se[10] = "\\n";
Se[11] = "\\v";
Se[12] = "\\f";
Se[13] = "\\r";
Se[27] = "\\e";
Se[34] = '\\"';
Se[92] = "\\\\";
Se[133] = "\\N";
Se[160] = "\\_";
Se[8232] = "\\L";
Se[8233] = "\\P";
const I0 = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
], P0 = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function N0(e, t) {
  if (t === null) return {};
  const n = {}, r = Object.keys(t);
  for (let i = 0, o = r.length; i < o; i += 1) {
    let s = r[i], a = String(t[s]);
    s.slice(0, 2) === "!!" && (s = "tag:yaml.org,2002:" + s.slice(2));
    const c = e.compiledTypeMap.fallback[s];
    c && Au.call(c.styleAliases, a) && (a = c.styleAliases[a]), n[s] = a;
  }
  return n;
}
function D0(e) {
  let t, n;
  const r = e.toString(16).toUpperCase();
  if (e <= 255)
    t = "x", n = 2;
  else if (e <= 65535)
    t = "u", n = 4;
  else if (e <= 4294967295)
    t = "U", n = 8;
  else
    throw new ir("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + t + si.repeat("0", n - r.length) + r;
}
const F0 = 1, Gn = 2;
function x0(e) {
  this.schema = e.schema || h0, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = si.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = N0(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? Gn : F0, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function va(e, t) {
  const n = si.repeat(" ", t);
  let r = 0, i = "";
  const o = e.length;
  for (; r < o; ) {
    let s;
    const a = e.indexOf(`
`, r);
    a === -1 ? (s = e.slice(r), r = o) : (s = e.slice(r, a + 1), r = a + 1), s.length && s !== `
` && (i += n), i += s;
  }
  return i;
}
function Ao(e, t) {
  return `
` + si.repeat(" ", e.indent * t);
}
function L0(e, t) {
  for (let n = 0, r = e.implicitTypes.length; n < r; n += 1)
    if (e.implicitTypes[n].resolve(t))
      return !0;
  return !1;
}
function zr(e) {
  return e === g0 || e === p0;
}
function qn(e) {
  return e >= 32 && e <= 126 || e >= 161 && e <= 55295 && e !== 8232 && e !== 8233 || e >= 57344 && e <= 65533 && e !== Jo || e >= 65536 && e <= 1114111;
}
function Aa(e) {
  return qn(e) && e !== Jo && // - b-char
  e !== m0 && e !== Hn;
}
function Ta(e, t, n) {
  const r = Aa(e), i = r && !zr(e);
  return (
    // ns-plain-safe
    (n ? r : r && // - c-flow-indicator
    e !== Tu && e !== Su && e !== bu && e !== Cu && e !== $u) && // ns-plain-char
    e !== vo && // false on '#'
    !(t === Yr && !i) || // false on ': '
    Aa(t) && !zr(t) && e === vo || // change to true on '[^ ]#'
    t === Yr && i
  );
}
function U0(e) {
  return qn(e) && e !== Jo && !zr(e) && // - s-white
  // - (c-indicator ::=
  // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
  e !== T0 && e !== C0 && e !== Yr && e !== Tu && e !== Su && e !== bu && e !== Cu && e !== $u && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
  e !== vo && e !== _0 && e !== A0 && e !== E0 && e !== O0 && e !== S0 && e !== b0 && e !== v0 && e !== y0 && // | “%” | “@” | “`”)
  e !== w0 && e !== $0 && e !== R0;
}
function k0(e) {
  return !zr(e) && e !== Yr;
}
function Pn(e, t) {
  const n = e.charCodeAt(t);
  let r;
  return n >= 55296 && n <= 56319 && t + 1 < e.length && (r = e.charCodeAt(t + 1), r >= 56320 && r <= 57343) ? (n - 55296) * 1024 + r - 56320 + 65536 : n;
}
function Ru(e) {
  return /^\n* /.test(e);
}
const Ou = 1, To = 2, Iu = 3, Pu = 4, Zt = 5;
function M0(e, t, n, r, i, o, s, a) {
  let c, m = 0, l = null, f = !1, h = !1;
  const g = r !== -1;
  let _ = -1, E = U0(Pn(e, 0)) && k0(Pn(e, e.length - 1));
  if (t || s)
    for (c = 0; c < e.length; m >= 65536 ? c += 2 : c++) {
      if (m = Pn(e, c), !qn(m))
        return Zt;
      E = E && Ta(m, l, a), l = m;
    }
  else {
    for (c = 0; c < e.length; m >= 65536 ? c += 2 : c++) {
      if (m = Pn(e, c), m === Hn)
        f = !0, g && (h = h || // Foldable line = too long, and not more-indented.
        c - _ - 1 > r && e[_ + 1] !== " ", _ = c);
      else if (!qn(m))
        return Zt;
      E = E && Ta(m, l, a), l = m;
    }
    h = h || g && c - _ - 1 > r && e[_ + 1] !== " ";
  }
  return !f && !h ? E && !s && !i(e) ? Ou : o === Gn ? Zt : To : n > 9 && Ru(e) ? Zt : s ? o === Gn ? Zt : To : h ? Pu : Iu;
}
function B0(e, t, n, r, i) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === Gn ? '""' : "''";
    if (!e.noCompatMode && (I0.indexOf(t) !== -1 || P0.test(t)))
      return e.quotingType === Gn ? '"' + t + '"' : "'" + t + "'";
    const o = e.indent * Math.max(1, n), s = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - o), a = r || // No block styles in flow mode.
    e.flowLevel > -1 && n >= e.flowLevel;
    function c(m) {
      return L0(e, m);
    }
    switch (M0(
      t,
      a,
      e.indent,
      s,
      c,
      e.quotingType,
      e.forceQuotes && !r,
      i
    )) {
      case Ou:
        return t;
      case To:
        return "'" + t.replace(/'/g, "''") + "'";
      case Iu:
        return "|" + Sa(t, e.indent) + ba(va(t, o));
      case Pu:
        return ">" + Sa(t, e.indent) + ba(va(j0(t, s), o));
      case Zt:
        return '"' + H0(t) + '"';
      default:
        throw new ir("impossible error: invalid scalar style");
    }
  }();
}
function Sa(e, t) {
  const n = Ru(e) ? String(t) : "", r = e[e.length - 1] === `
`, o = r && (e[e.length - 2] === `
` || e === `
`) ? "+" : r ? "" : "-";
  return n + o + `
`;
}
function ba(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function j0(e, t) {
  const n = /(\n+)([^\n]*)/g;
  let r = function() {
    let a = e.indexOf(`
`);
    return a = a !== -1 ? a : e.length, n.lastIndex = a, Ca(e.slice(0, a), t);
  }(), i = e[0] === `
` || e[0] === " ", o, s;
  for (; s = n.exec(e); ) {
    const a = s[1], c = s[2];
    o = c[0] === " ", r += a + (!i && !o && c !== "" ? `
` : "") + Ca(c, t), i = o;
  }
  return r;
}
function Ca(e, t) {
  if (e === "" || e[0] === " ") return e;
  const n = / [^ ]/g;
  let r, i = 0, o, s = 0, a = 0, c = "";
  for (; r = n.exec(e); )
    a = r.index, a - i > t && (o = s > i ? s : a, c += `
` + e.slice(i, o), i = o + 1), s = a;
  return c += `
`, e.length - i > t && s > i ? c += e.slice(i, s) + `
` + e.slice(s + 1) : c += e.slice(i), c.slice(1);
}
function H0(e) {
  let t = "", n = 0;
  for (let r = 0; r < e.length; n >= 65536 ? r += 2 : r++) {
    n = Pn(e, r);
    const i = Se[n];
    !i && qn(n) ? (t += e[r], n >= 65536 && (t += e[r + 1])) : t += i || D0(n);
  }
  return t;
}
function G0(e, t, n) {
  let r = "";
  const i = e.tag;
  for (let o = 0, s = n.length; o < s; o += 1) {
    let a = n[o];
    e.replacer && (a = e.replacer.call(n, String(o), a)), (st(e, t, a, !1, !1) || typeof a > "u" && st(e, t, null, !1, !1)) && (r !== "" && (r += "," + (e.condenseFlow ? "" : " ")), r += e.dump);
  }
  e.tag = i, e.dump = "[" + r + "]";
}
function $a(e, t, n, r) {
  let i = "";
  const o = e.tag;
  for (let s = 0, a = n.length; s < a; s += 1) {
    let c = n[s];
    e.replacer && (c = e.replacer.call(n, String(s), c)), (st(e, t + 1, c, !0, !0, !1, !0) || typeof c > "u" && st(e, t + 1, null, !0, !0, !1, !0)) && ((!r || i !== "") && (i += Ao(e, t)), e.dump && Hn === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  }
  e.tag = o, e.dump = i || "[]";
}
function q0(e, t, n) {
  let r = "";
  const i = e.tag, o = Object.keys(n);
  for (let s = 0, a = o.length; s < a; s += 1) {
    let c = "";
    r !== "" && (c += ", "), e.condenseFlow && (c += '"');
    const m = o[s];
    let l = n[m];
    e.replacer && (l = e.replacer.call(n, m, l)), st(e, t, m, !1, !1) && (e.dump.length > 1024 && (c += "? "), c += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), st(e, t, l, !1, !1) && (c += e.dump, r += c));
  }
  e.tag = i, e.dump = "{" + r + "}";
}
function V0(e, t, n, r) {
  let i = "";
  const o = e.tag, s = Object.keys(n);
  if (e.sortKeys === !0)
    s.sort();
  else if (typeof e.sortKeys == "function")
    s.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new ir("sortKeys must be a boolean or a function");
  for (let a = 0, c = s.length; a < c; a += 1) {
    let m = "";
    (!r || i !== "") && (m += Ao(e, t));
    const l = s[a];
    let f = n[l];
    if (e.replacer && (f = e.replacer.call(n, l, f)), !st(e, t + 1, l, !0, !0, !0))
      continue;
    const h = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024;
    h && (e.dump && Hn === e.dump.charCodeAt(0) ? m += "?" : m += "? "), m += e.dump, h && (m += Ao(e, t)), st(e, t + 1, f, !0, h) && (e.dump && Hn === e.dump.charCodeAt(0) ? m += ":" : m += ": ", m += e.dump, i += m);
  }
  e.tag = o, e.dump = i || "{}";
}
function Ra(e, t, n) {
  const r = n ? e.explicitTypes : e.implicitTypes;
  for (let i = 0, o = r.length; i < o; i += 1) {
    const s = r[i];
    if ((s.instanceOf || s.predicate) && (!s.instanceOf || typeof t == "object" && t instanceof s.instanceOf) && (!s.predicate || s.predicate(t))) {
      if (n ? s.multi && s.representName ? e.tag = s.representName(t) : e.tag = s.tag : e.tag = "?", s.represent) {
        const a = e.styleMap[s.tag] || s.defaultStyle;
        let c;
        if (vu.call(s.represent) === "[object Function]")
          c = s.represent(t, a);
        else if (Au.call(s.represent, a))
          c = s.represent[a](t, a);
        else
          throw new ir("!<" + s.tag + '> tag resolver accepts not "' + a + '" style');
        e.dump = c;
      }
      return !0;
    }
  }
  return !1;
}
function st(e, t, n, r, i, o, s) {
  e.tag = null, e.dump = n, Ra(e, n, !1) || Ra(e, n, !0);
  const a = vu.call(e.dump), c = r;
  r && (r = e.flowLevel < 0 || e.flowLevel > t);
  const m = a === "[object Object]" || a === "[object Array]";
  let l, f;
  if (m && (l = e.duplicates.indexOf(n), f = l !== -1), (e.tag !== null && e.tag !== "?" || f || e.indent !== 2 && t > 0) && (i = !1), f && e.usedDuplicates[l])
    e.dump = "*ref_" + l;
  else {
    if (m && f && !e.usedDuplicates[l] && (e.usedDuplicates[l] = !0), a === "[object Object]")
      r && Object.keys(e.dump).length !== 0 ? (V0(e, t, e.dump, i), f && (e.dump = "&ref_" + l + e.dump)) : (q0(e, t, e.dump), f && (e.dump = "&ref_" + l + " " + e.dump));
    else if (a === "[object Array]")
      r && e.dump.length !== 0 ? (e.noArrayIndent && !s && t > 0 ? $a(e, t - 1, e.dump, i) : $a(e, t, e.dump, i), f && (e.dump = "&ref_" + l + e.dump)) : (G0(e, t, e.dump), f && (e.dump = "&ref_" + l + " " + e.dump));
    else if (a === "[object String]")
      e.tag !== "?" && B0(e, e.dump, t, o, c);
    else {
      if (a === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new ir("unacceptable kind of an object to dump " + a);
    }
    if (e.tag !== null && e.tag !== "?") {
      let h = encodeURI(
        e.tag[0] === "!" ? e.tag.slice(1) : e.tag
      ).replace(/!/g, "%21");
      e.tag[0] === "!" ? h = "!" + h : h.slice(0, 18) === "tag:yaml.org,2002:" ? h = "!!" + h.slice(18) : h = "!<" + h + ">", e.dump = h + " " + e.dump;
    }
  }
  return !0;
}
function W0(e, t) {
  const n = [], r = [];
  So(e, n, r);
  const i = r.length;
  for (let o = 0; o < i; o += 1)
    t.duplicates.push(n[r[o]]);
  t.usedDuplicates = new Array(i);
}
function So(e, t, n) {
  if (e !== null && typeof e == "object") {
    const r = t.indexOf(e);
    if (r !== -1)
      n.indexOf(r) === -1 && n.push(r);
    else if (t.push(e), Array.isArray(e))
      for (let i = 0, o = e.length; i < o; i += 1)
        So(e[i], t, n);
    else {
      const i = Object.keys(e);
      for (let o = 0, s = i.length; o < s; o += 1)
        So(e[i[o]], t, n);
    }
  }
}
function Y0(e, t) {
  t = t || {};
  const n = new x0(t);
  n.noRefs || W0(e, n);
  let r = e;
  return n.replacer && (r = n.replacer.call({ "": r }, "", r)), st(n, 0, r, !0, !0) ? n.dump + `
` : "";
}
_u.dump = Y0;
const Nu = Wo, z0 = _u;
function Qo(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
ye.Type = Ie;
ye.Schema = Hc;
ye.FAILSAFE_SCHEMA = Wc;
ye.JSON_SCHEMA = Qc;
ye.CORE_SCHEMA = Zc;
ye.DEFAULT_SCHEMA = zo;
ye.load = Nu.load;
ye.loadAll = Nu.loadAll;
ye.dump = z0.dump;
ye.YAMLException = rr;
ye.types = {
  binary: iu,
  float: Jc,
  map: Vc,
  null: Yc,
  pairs: su,
  set: au,
  timestamp: nu,
  bool: zc,
  int: Xc,
  merge: ru,
  omap: ou,
  seq: qc,
  str: Gc
};
ye.safeLoad = Qo("safeLoad", "load");
ye.safeLoadAll = Qo("safeLoadAll", "loadAll");
ye.safeDump = Qo("safeDump", "dump");
var ai = {};
Object.defineProperty(ai, "__esModule", { value: !0 });
ai.Lazy = void 0;
class X0 {
  constructor(t) {
    this._value = null, this.creator = t;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null)
      return this._value;
    const t = this.creator();
    return this.value = t, t;
  }
  set value(t) {
    this._value = t, this.creator = null;
  }
}
ai.Lazy = X0;
var bo = { exports: {} };
const K0 = "2.0.0", Du = 256, J0 = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, Q0 = 16, Z0 = Du - 6, eE = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var li = {
  MAX_LENGTH: Du,
  MAX_SAFE_COMPONENT_LENGTH: Q0,
  MAX_SAFE_BUILD_LENGTH: Z0,
  MAX_SAFE_INTEGER: J0,
  RELEASE_TYPES: eE,
  SEMVER_SPEC_VERSION: K0,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const tE = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var ci = tE;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: n,
    MAX_SAFE_BUILD_LENGTH: r,
    MAX_LENGTH: i
  } = li, o = ci;
  t = e.exports = {};
  const s = t.re = [], a = t.safeRe = [], c = t.src = [], m = t.safeSrc = [], l = t.t = {};
  let f = 0;
  const h = "[a-zA-Z0-9-]", g = [
    ["\\s", 1],
    ["\\d", i],
    [h, r]
  ], _ = (A) => {
    for (const [T, R] of g)
      A = A.split(`${T}*`).join(`${T}{0,${R}}`).split(`${T}+`).join(`${T}{1,${R}}`);
    return A;
  }, E = (A, T, R) => {
    const D = _(T), B = f++;
    o(A, B, T), l[A] = B, c[B] = T, m[B] = D, s[B] = new RegExp(T, R ? "g" : void 0), a[B] = new RegExp(D, R ? "g" : void 0);
  };
  E("NUMERICIDENTIFIER", "0|[1-9]\\d*"), E("NUMERICIDENTIFIERLOOSE", "\\d+"), E("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${h}*`), E("MAINVERSION", `(${c[l.NUMERICIDENTIFIER]})\\.(${c[l.NUMERICIDENTIFIER]})\\.(${c[l.NUMERICIDENTIFIER]})`), E("MAINVERSIONLOOSE", `(${c[l.NUMERICIDENTIFIERLOOSE]})\\.(${c[l.NUMERICIDENTIFIERLOOSE]})\\.(${c[l.NUMERICIDENTIFIERLOOSE]})`), E("PRERELEASEIDENTIFIER", `(?:${c[l.NONNUMERICIDENTIFIER]}|${c[l.NUMERICIDENTIFIER]})`), E("PRERELEASEIDENTIFIERLOOSE", `(?:${c[l.NONNUMERICIDENTIFIER]}|${c[l.NUMERICIDENTIFIERLOOSE]})`), E("PRERELEASE", `(?:-(${c[l.PRERELEASEIDENTIFIER]}(?:\\.${c[l.PRERELEASEIDENTIFIER]})*))`), E("PRERELEASELOOSE", `(?:-?(${c[l.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${c[l.PRERELEASEIDENTIFIERLOOSE]})*))`), E("BUILDIDENTIFIER", `${h}+`), E("BUILD", `(?:\\+(${c[l.BUILDIDENTIFIER]}(?:\\.${c[l.BUILDIDENTIFIER]})*))`), E("FULLPLAIN", `v?${c[l.MAINVERSION]}${c[l.PRERELEASE]}?${c[l.BUILD]}?`), E("FULL", `^${c[l.FULLPLAIN]}$`), E("LOOSEPLAIN", `[v=\\s]*${c[l.MAINVERSIONLOOSE]}${c[l.PRERELEASELOOSE]}?${c[l.BUILD]}?`), E("LOOSE", `^${c[l.LOOSEPLAIN]}$`), E("GTLT", "((?:<|>)?=?)"), E("XRANGEIDENTIFIERLOOSE", `${c[l.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), E("XRANGEIDENTIFIER", `${c[l.NUMERICIDENTIFIER]}|x|X|\\*`), E("XRANGEPLAIN", `[v=\\s]*(${c[l.XRANGEIDENTIFIER]})(?:\\.(${c[l.XRANGEIDENTIFIER]})(?:\\.(${c[l.XRANGEIDENTIFIER]})(?:${c[l.PRERELEASE]})?${c[l.BUILD]}?)?)?`), E("XRANGEPLAINLOOSE", `[v=\\s]*(${c[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[l.XRANGEIDENTIFIERLOOSE]})(?:${c[l.PRERELEASELOOSE]})?${c[l.BUILD]}?)?)?`), E("XRANGE", `^${c[l.GTLT]}\\s*${c[l.XRANGEPLAIN]}$`), E("XRANGELOOSE", `^${c[l.GTLT]}\\s*${c[l.XRANGEPLAINLOOSE]}$`), E("COERCEPLAIN", `(^|[^\\d])(\\d{1,${n}})(?:\\.(\\d{1,${n}}))?(?:\\.(\\d{1,${n}}))?`), E("COERCE", `${c[l.COERCEPLAIN]}(?:$|[^\\d])`), E("COERCEFULL", c[l.COERCEPLAIN] + `(?:${c[l.PRERELEASE]})?(?:${c[l.BUILD]})?(?:$|[^\\d])`), E("COERCERTL", c[l.COERCE], !0), E("COERCERTLFULL", c[l.COERCEFULL], !0), E("LONETILDE", "(?:~>?)"), E("TILDETRIM", `(\\s*)${c[l.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", E("TILDE", `^${c[l.LONETILDE]}${c[l.XRANGEPLAIN]}$`), E("TILDELOOSE", `^${c[l.LONETILDE]}${c[l.XRANGEPLAINLOOSE]}$`), E("LONECARET", "(?:\\^)"), E("CARETTRIM", `(\\s*)${c[l.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", E("CARET", `^${c[l.LONECARET]}${c[l.XRANGEPLAIN]}$`), E("CARETLOOSE", `^${c[l.LONECARET]}${c[l.XRANGEPLAINLOOSE]}$`), E("COMPARATORLOOSE", `^${c[l.GTLT]}\\s*(${c[l.LOOSEPLAIN]})$|^$`), E("COMPARATOR", `^${c[l.GTLT]}\\s*(${c[l.FULLPLAIN]})$|^$`), E("COMPARATORTRIM", `(\\s*)${c[l.GTLT]}\\s*(${c[l.LOOSEPLAIN]}|${c[l.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", E("HYPHENRANGE", `^\\s*(${c[l.XRANGEPLAIN]})\\s+-\\s+(${c[l.XRANGEPLAIN]})\\s*$`), E("HYPHENRANGELOOSE", `^\\s*(${c[l.XRANGEPLAINLOOSE]})\\s+-\\s+(${c[l.XRANGEPLAINLOOSE]})\\s*$`), E("STAR", "(<|>)?=?\\s*\\*"), E("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), E("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(bo, bo.exports);
var or = bo.exports;
const nE = Object.freeze({ loose: !0 }), rE = Object.freeze({}), iE = (e) => e ? typeof e != "object" ? nE : e : rE;
var Zo = iE;
const Oa = /^[0-9]+$/, Fu = (e, t) => {
  if (typeof e == "number" && typeof t == "number")
    return e === t ? 0 : e < t ? -1 : 1;
  const n = Oa.test(e), r = Oa.test(t);
  return n && r && (e = +e, t = +t), e === t ? 0 : n && !r ? -1 : r && !n ? 1 : e < t ? -1 : 1;
}, oE = (e, t) => Fu(t, e);
var xu = {
  compareIdentifiers: Fu,
  rcompareIdentifiers: oE
};
const br = ci, { MAX_LENGTH: Ia, MAX_SAFE_INTEGER: Cr } = li, { safeRe: $r, t: Rr } = or, sE = Zo, { compareIdentifiers: ji } = xu;
let aE = class Ke {
  constructor(t, n) {
    if (n = sE(n), t instanceof Ke) {
      if (t.loose === !!n.loose && t.includePrerelease === !!n.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > Ia)
      throw new TypeError(
        `version is longer than ${Ia} characters`
      );
    br("SemVer", t, n), this.options = n, this.loose = !!n.loose, this.includePrerelease = !!n.includePrerelease;
    const r = t.trim().match(n.loose ? $r[Rr.LOOSE] : $r[Rr.FULL]);
    if (!r)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +r[1], this.minor = +r[2], this.patch = +r[3], this.major > Cr || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > Cr || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > Cr || this.patch < 0)
      throw new TypeError("Invalid patch version");
    r[4] ? this.prerelease = r[4].split(".").map((i) => {
      if (/^[0-9]+$/.test(i)) {
        const o = +i;
        if (o >= 0 && o < Cr)
          return o;
      }
      return i;
    }) : this.prerelease = [], this.build = r[5] ? r[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (br("SemVer.compare", this.version, this.options, t), !(t instanceof Ke)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Ke(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Ke || (t = new Ke(t, this.options)), this.major < t.major ? -1 : this.major > t.major ? 1 : this.minor < t.minor ? -1 : this.minor > t.minor ? 1 : this.patch < t.patch ? -1 : this.patch > t.patch ? 1 : 0;
  }
  comparePre(t) {
    if (t instanceof Ke || (t = new Ke(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let n = 0;
    do {
      const r = this.prerelease[n], i = t.prerelease[n];
      if (br("prerelease compare", n, r, i), r === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (r === void 0)
        return -1;
      if (r === i)
        continue;
      return ji(r, i);
    } while (++n);
  }
  compareBuild(t) {
    t instanceof Ke || (t = new Ke(t, this.options));
    let n = 0;
    do {
      const r = this.build[n], i = t.build[n];
      if (br("build compare", n, r, i), r === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (r === void 0)
        return -1;
      if (r === i)
        continue;
      return ji(r, i);
    } while (++n);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, n, r) {
    if (t.startsWith("pre")) {
      if (!n && r === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (n) {
        const i = `-${n}`.match(this.options.loose ? $r[Rr.PRERELEASELOOSE] : $r[Rr.PRERELEASE]);
        if (!i || i[1] !== n)
          throw new Error(`invalid identifier: ${n}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", n, r);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", n, r);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", n, r), this.inc("pre", n, r);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", n, r), this.inc("pre", n, r);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const i = Number(r) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [i];
        else {
          let o = this.prerelease.length;
          for (; --o >= 0; )
            typeof this.prerelease[o] == "number" && (this.prerelease[o]++, o = -2);
          if (o === -1) {
            if (n === this.prerelease.join(".") && r === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(i);
          }
        }
        if (n) {
          let o = [n, i];
          r === !1 && (o = [n]), ji(this.prerelease[0], n) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = o) : this.prerelease = o;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var Pe = aE;
const Pa = Pe, lE = (e, t, n = !1) => {
  if (e instanceof Pa)
    return e;
  try {
    return new Pa(e, t);
  } catch (r) {
    if (!n)
      return null;
    throw r;
  }
};
var gn = lE;
const cE = gn, uE = (e, t) => {
  const n = cE(e, t);
  return n ? n.version : null;
};
var fE = uE;
const dE = gn, hE = (e, t) => {
  const n = dE(e.trim().replace(/^[=v]+/, ""), t);
  return n ? n.version : null;
};
var pE = hE;
const Na = Pe, mE = (e, t, n, r, i) => {
  typeof n == "string" && (i = r, r = n, n = void 0);
  try {
    return new Na(
      e instanceof Na ? e.version : e,
      n
    ).inc(t, r, i).version;
  } catch {
    return null;
  }
};
var gE = mE;
const Da = gn, EE = (e, t) => {
  const n = Da(e, null, !0), r = Da(t, null, !0), i = n.compare(r);
  if (i === 0)
    return null;
  const o = i > 0, s = o ? n : r, a = o ? r : n, c = !!s.prerelease.length;
  if (!!a.prerelease.length && !c) {
    if (!a.patch && !a.minor)
      return "major";
    if (a.compareMain(s) === 0)
      return a.minor && !a.patch ? "minor" : "patch";
  }
  const l = c ? "pre" : "";
  return n.major !== r.major ? l + "major" : n.minor !== r.minor ? l + "minor" : n.patch !== r.patch ? l + "patch" : "prerelease";
};
var yE = EE;
const wE = Pe, _E = (e, t) => new wE(e, t).major;
var vE = _E;
const AE = Pe, TE = (e, t) => new AE(e, t).minor;
var SE = TE;
const bE = Pe, CE = (e, t) => new bE(e, t).patch;
var $E = CE;
const RE = gn, OE = (e, t) => {
  const n = RE(e, t);
  return n && n.prerelease.length ? n.prerelease : null;
};
var IE = OE;
const Fa = Pe, PE = (e, t, n) => new Fa(e, n).compare(new Fa(t, n));
var We = PE;
const NE = We, DE = (e, t, n) => NE(t, e, n);
var FE = DE;
const xE = We, LE = (e, t) => xE(e, t, !0);
var UE = LE;
const xa = Pe, kE = (e, t, n) => {
  const r = new xa(e, n), i = new xa(t, n);
  return r.compare(i) || r.compareBuild(i);
};
var es = kE;
const ME = es, BE = (e, t) => e.sort((n, r) => ME(n, r, t));
var jE = BE;
const HE = es, GE = (e, t) => e.sort((n, r) => HE(r, n, t));
var qE = GE;
const VE = We, WE = (e, t, n) => VE(e, t, n) > 0;
var ui = WE;
const YE = We, zE = (e, t, n) => YE(e, t, n) < 0;
var ts = zE;
const XE = We, KE = (e, t, n) => XE(e, t, n) === 0;
var Lu = KE;
const JE = We, QE = (e, t, n) => JE(e, t, n) !== 0;
var Uu = QE;
const ZE = We, ey = (e, t, n) => ZE(e, t, n) >= 0;
var ns = ey;
const ty = We, ny = (e, t, n) => ty(e, t, n) <= 0;
var rs = ny;
const ry = Lu, iy = Uu, oy = ui, sy = ns, ay = ts, ly = rs, cy = (e, t, n, r) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof n == "object" && (n = n.version), e === n;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof n == "object" && (n = n.version), e !== n;
    case "":
    case "=":
    case "==":
      return ry(e, n, r);
    case "!=":
      return iy(e, n, r);
    case ">":
      return oy(e, n, r);
    case ">=":
      return sy(e, n, r);
    case "<":
      return ay(e, n, r);
    case "<=":
      return ly(e, n, r);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var ku = cy;
const uy = Pe, fy = gn, { safeRe: Or, t: Ir } = or, dy = (e, t) => {
  if (e instanceof uy)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let n = null;
  if (!t.rtl)
    n = e.match(t.includePrerelease ? Or[Ir.COERCEFULL] : Or[Ir.COERCE]);
  else {
    const c = t.includePrerelease ? Or[Ir.COERCERTLFULL] : Or[Ir.COERCERTL];
    let m;
    for (; (m = c.exec(e)) && (!n || n.index + n[0].length !== e.length); )
      (!n || m.index + m[0].length !== n.index + n[0].length) && (n = m), c.lastIndex = m.index + m[1].length + m[2].length;
    c.lastIndex = -1;
  }
  if (n === null)
    return null;
  const r = n[2], i = n[3] || "0", o = n[4] || "0", s = t.includePrerelease && n[5] ? `-${n[5]}` : "", a = t.includePrerelease && n[6] ? `+${n[6]}` : "";
  return fy(`${r}.${i}.${o}${s}${a}`, t);
};
var hy = dy;
class py {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const n = this.map.get(t);
    if (n !== void 0)
      return this.map.delete(t), this.map.set(t, n), n;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, n) {
    if (!this.delete(t) && n !== void 0) {
      if (this.map.size >= this.max) {
        const i = this.map.keys().next().value;
        this.delete(i);
      }
      this.map.set(t, n);
    }
    return this;
  }
}
var my = py, Hi, La;
function Ye() {
  if (La) return Hi;
  La = 1;
  const e = /\s+/g;
  class t {
    constructor($, P) {
      if (P = i(P), $ instanceof t)
        return $.loose === !!P.loose && $.includePrerelease === !!P.includePrerelease ? $ : new t($.raw, P);
      if ($ instanceof o)
        return this.raw = $.value, this.set = [[$]], this.formatted = void 0, this;
      if (this.options = P, this.loose = !!P.loose, this.includePrerelease = !!P.includePrerelease, this.raw = $.trim().replace(e, " "), this.set = this.raw.split("||").map((C) => this.parseRange(C.trim())).filter((C) => C.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const C = this.set[0];
        if (this.set = this.set.filter((N) => !E(N[0])), this.set.length === 0)
          this.set = [C];
        else if (this.set.length > 1) {
          for (const N of this.set)
            if (N.length === 1 && A(N[0])) {
              this.set = [N];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let $ = 0; $ < this.set.length; $++) {
          $ > 0 && (this.formatted += "||");
          const P = this.set[$];
          for (let C = 0; C < P.length; C++)
            C > 0 && (this.formatted += " "), this.formatted += P[C].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange($) {
      const C = ((this.options.includePrerelease && g) | (this.options.loose && _)) + ":" + $, N = r.get(C);
      if (N)
        return N;
      const I = this.options.loose, k = I ? c[m.HYPHENRANGELOOSE] : c[m.HYPHENRANGE];
      $ = $.replace(k, Y(this.options.includePrerelease)), s("hyphen replace", $), $ = $.replace(c[m.COMPARATORTRIM], l), s("comparator trim", $), $ = $.replace(c[m.TILDETRIM], f), s("tilde trim", $), $ = $.replace(c[m.CARETTRIM], h), s("caret trim", $);
      let q = $.split(" ").map((M) => R(M, this.options)).join(" ").split(/\s+/).map((M) => H(M, this.options));
      I && (q = q.filter((M) => (s("loose invalid filter", M, this.options), !!M.match(c[m.COMPARATORLOOSE])))), s("range list", q);
      const F = /* @__PURE__ */ new Map(), z = q.map((M) => new o(M, this.options));
      for (const M of z) {
        if (E(M))
          return [M];
        F.set(M.value, M);
      }
      F.size > 1 && F.has("") && F.delete("");
      const ce = [...F.values()];
      return r.set(C, ce), ce;
    }
    intersects($, P) {
      if (!($ instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((C) => T(C, P) && $.set.some((N) => T(N, P) && C.every((I) => N.every((k) => I.intersects(k, P)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test($) {
      if (!$)
        return !1;
      if (typeof $ == "string")
        try {
          $ = new a($, this.options);
        } catch {
          return !1;
        }
      for (let P = 0; P < this.set.length; P++)
        if (ee(this.set[P], $, this.options))
          return !0;
      return !1;
    }
  }
  Hi = t;
  const n = my, r = new n(), i = Zo, o = fi(), s = ci, a = Pe, {
    safeRe: c,
    t: m,
    comparatorTrimReplace: l,
    tildeTrimReplace: f,
    caretTrimReplace: h
  } = or, { FLAG_INCLUDE_PRERELEASE: g, FLAG_LOOSE: _ } = li, E = (O) => O.value === "<0.0.0-0", A = (O) => O.value === "", T = (O, $) => {
    let P = !0;
    const C = O.slice();
    let N = C.pop();
    for (; P && C.length; )
      P = C.every((I) => N.intersects(I, $)), N = C.pop();
    return P;
  }, R = (O, $) => (O = O.replace(c[m.BUILD], ""), s("comp", O, $), O = J(O, $), s("caret", O), O = B(O, $), s("tildes", O), O = oe(O, $), s("xrange", O), O = y(O, $), s("stars", O), O), D = (O) => !O || O.toLowerCase() === "x" || O === "*", B = (O, $) => O.trim().split(/\s+/).map((P) => G(P, $)).join(" "), G = (O, $) => {
    const P = $.loose ? c[m.TILDELOOSE] : c[m.TILDE];
    return O.replace(P, (C, N, I, k, q) => {
      s("tilde", O, C, N, I, k, q);
      let F;
      return D(N) ? F = "" : D(I) ? F = `>=${N}.0.0 <${+N + 1}.0.0-0` : D(k) ? F = `>=${N}.${I}.0 <${N}.${+I + 1}.0-0` : q ? (s("replaceTilde pr", q), F = `>=${N}.${I}.${k}-${q} <${N}.${+I + 1}.0-0`) : F = `>=${N}.${I}.${k} <${N}.${+I + 1}.0-0`, s("tilde return", F), F;
    });
  }, J = (O, $) => O.trim().split(/\s+/).map((P) => Q(P, $)).join(" "), Q = (O, $) => {
    s("caret", O, $);
    const P = $.loose ? c[m.CARETLOOSE] : c[m.CARET], C = $.includePrerelease ? "-0" : "";
    return O.replace(P, (N, I, k, q, F) => {
      s("caret", O, N, I, k, q, F);
      let z;
      return D(I) ? z = "" : D(k) ? z = `>=${I}.0.0${C} <${+I + 1}.0.0-0` : D(q) ? I === "0" ? z = `>=${I}.${k}.0${C} <${I}.${+k + 1}.0-0` : z = `>=${I}.${k}.0${C} <${+I + 1}.0.0-0` : F ? (s("replaceCaret pr", F), I === "0" ? k === "0" ? z = `>=${I}.${k}.${q}-${F} <${I}.${k}.${+q + 1}-0` : z = `>=${I}.${k}.${q}-${F} <${I}.${+k + 1}.0-0` : z = `>=${I}.${k}.${q}-${F} <${+I + 1}.0.0-0`) : (s("no pr"), I === "0" ? k === "0" ? z = `>=${I}.${k}.${q}${C} <${I}.${k}.${+q + 1}-0` : z = `>=${I}.${k}.${q}${C} <${I}.${+k + 1}.0-0` : z = `>=${I}.${k}.${q} <${+I + 1}.0.0-0`), s("caret return", z), z;
    });
  }, oe = (O, $) => (s("replaceXRanges", O, $), O.split(/\s+/).map((P) => U(P, $)).join(" ")), U = (O, $) => {
    O = O.trim();
    const P = $.loose ? c[m.XRANGELOOSE] : c[m.XRANGE];
    return O.replace(P, (C, N, I, k, q, F) => {
      s("xRange", O, C, N, I, k, q, F);
      const z = D(I), ce = z || D(k), M = ce || D(q), we = M;
      return N === "=" && we && (N = ""), F = $.includePrerelease ? "-0" : "", z ? N === ">" || N === "<" ? C = "<0.0.0-0" : C = "*" : N && we ? (ce && (k = 0), q = 0, N === ">" ? (N = ">=", ce ? (I = +I + 1, k = 0, q = 0) : (k = +k + 1, q = 0)) : N === "<=" && (N = "<", ce ? I = +I + 1 : k = +k + 1), N === "<" && (F = "-0"), C = `${N + I}.${k}.${q}${F}`) : ce ? C = `>=${I}.0.0${F} <${+I + 1}.0.0-0` : M && (C = `>=${I}.${k}.0${F} <${I}.${+k + 1}.0-0`), s("xRange return", C), C;
    });
  }, y = (O, $) => (s("replaceStars", O, $), O.trim().replace(c[m.STAR], "")), H = (O, $) => (s("replaceGTE0", O, $), O.trim().replace(c[$.includePrerelease ? m.GTE0PRE : m.GTE0], "")), Y = (O) => ($, P, C, N, I, k, q, F, z, ce, M, we) => (D(C) ? P = "" : D(N) ? P = `>=${C}.0.0${O ? "-0" : ""}` : D(I) ? P = `>=${C}.${N}.0${O ? "-0" : ""}` : k ? P = `>=${P}` : P = `>=${P}${O ? "-0" : ""}`, D(z) ? F = "" : D(ce) ? F = `<${+z + 1}.0.0-0` : D(M) ? F = `<${z}.${+ce + 1}.0-0` : we ? F = `<=${z}.${ce}.${M}-${we}` : O ? F = `<${z}.${ce}.${+M + 1}-0` : F = `<=${F}`, `${P} ${F}`.trim()), ee = (O, $, P) => {
    for (let C = 0; C < O.length; C++)
      if (!O[C].test($))
        return !1;
    if ($.prerelease.length && !P.includePrerelease) {
      for (let C = 0; C < O.length; C++)
        if (s(O[C].semver), O[C].semver !== o.ANY && O[C].semver.prerelease.length > 0) {
          const N = O[C].semver;
          if (N.major === $.major && N.minor === $.minor && N.patch === $.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Hi;
}
var Gi, Ua;
function fi() {
  if (Ua) return Gi;
  Ua = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(l, f) {
      if (f = n(f), l instanceof t) {
        if (l.loose === !!f.loose)
          return l;
        l = l.value;
      }
      l = l.trim().split(/\s+/).join(" "), s("comparator", l, f), this.options = f, this.loose = !!f.loose, this.parse(l), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, s("comp", this);
    }
    parse(l) {
      const f = this.options.loose ? r[i.COMPARATORLOOSE] : r[i.COMPARATOR], h = l.match(f);
      if (!h)
        throw new TypeError(`Invalid comparator: ${l}`);
      this.operator = h[1] !== void 0 ? h[1] : "", this.operator === "=" && (this.operator = ""), h[2] ? this.semver = new a(h[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(l) {
      if (s("Comparator.test", l, this.options.loose), this.semver === e || l === e)
        return !0;
      if (typeof l == "string")
        try {
          l = new a(l, this.options);
        } catch {
          return !1;
        }
      return o(l, this.operator, this.semver, this.options);
    }
    intersects(l, f) {
      if (!(l instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new c(l.value, f).test(this.value) : l.operator === "" ? l.value === "" ? !0 : new c(this.value, f).test(l.semver) : (f = n(f), f.includePrerelease && (this.value === "<0.0.0-0" || l.value === "<0.0.0-0") || !f.includePrerelease && (this.value.startsWith("<0.0.0") || l.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && l.operator.startsWith(">") || this.operator.startsWith("<") && l.operator.startsWith("<") || this.semver.version === l.semver.version && this.operator.includes("=") && l.operator.includes("=") || o(this.semver, "<", l.semver, f) && this.operator.startsWith(">") && l.operator.startsWith("<") || o(this.semver, ">", l.semver, f) && this.operator.startsWith("<") && l.operator.startsWith(">")));
    }
  }
  Gi = t;
  const n = Zo, { safeRe: r, t: i } = or, o = ku, s = ci, a = Pe, c = Ye();
  return Gi;
}
const gy = Ye(), Ey = (e, t, n) => {
  try {
    t = new gy(t, n);
  } catch {
    return !1;
  }
  return t.test(e);
};
var di = Ey;
const yy = Ye(), wy = (e, t) => new yy(e, t).set.map((n) => n.map((r) => r.value).join(" ").trim().split(" "));
var _y = wy;
const vy = Pe, Ay = Ye(), Ty = (e, t, n) => {
  let r = null, i = null, o = null;
  try {
    o = new Ay(t, n);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!r || i.compare(s) === -1) && (r = s, i = new vy(r, n));
  }), r;
};
var Sy = Ty;
const by = Pe, Cy = Ye(), $y = (e, t, n) => {
  let r = null, i = null, o = null;
  try {
    o = new Cy(t, n);
  } catch {
    return null;
  }
  return e.forEach((s) => {
    o.test(s) && (!r || i.compare(s) === 1) && (r = s, i = new by(r, n));
  }), r;
};
var Ry = $y;
const qi = Pe, Oy = Ye(), ka = ui, Iy = (e, t) => {
  e = new Oy(e, t);
  let n = new qi("0.0.0");
  if (e.test(n) || (n = new qi("0.0.0-0"), e.test(n)))
    return n;
  n = null;
  for (let r = 0; r < e.set.length; ++r) {
    const i = e.set[r];
    let o = null;
    i.forEach((s) => {
      const a = new qi(s.semver.version);
      switch (s.operator) {
        case ">":
          a.prerelease.length === 0 ? a.patch++ : a.prerelease.push(0), a.raw = a.format();
        case "":
        case ">=":
          (!o || ka(a, o)) && (o = a);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${s.operator}`);
      }
    }), o && (!n || ka(n, o)) && (n = o);
  }
  return n && e.test(n) ? n : null;
};
var Py = Iy;
const Ny = Ye(), Dy = (e, t) => {
  try {
    return new Ny(e, t).range || "*";
  } catch {
    return null;
  }
};
var Fy = Dy;
const xy = Pe, Mu = fi(), { ANY: Ly } = Mu, Uy = Ye(), ky = di, Ma = ui, Ba = ts, My = rs, By = ns, jy = (e, t, n, r) => {
  e = new xy(e, r), t = new Uy(t, r);
  let i, o, s, a, c;
  switch (n) {
    case ">":
      i = Ma, o = My, s = Ba, a = ">", c = ">=";
      break;
    case "<":
      i = Ba, o = By, s = Ma, a = "<", c = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (ky(e, t, r))
    return !1;
  for (let m = 0; m < t.set.length; ++m) {
    const l = t.set[m];
    let f = null, h = null;
    if (l.forEach((g) => {
      g.semver === Ly && (g = new Mu(">=0.0.0")), f = f || g, h = h || g, i(g.semver, f.semver, r) ? f = g : s(g.semver, h.semver, r) && (h = g);
    }), f.operator === a || f.operator === c || (!h.operator || h.operator === a) && o(e, h.semver))
      return !1;
    if (h.operator === c && s(e, h.semver))
      return !1;
  }
  return !0;
};
var is = jy;
const Hy = is, Gy = (e, t, n) => Hy(e, t, ">", n);
var qy = Gy;
const Vy = is, Wy = (e, t, n) => Vy(e, t, "<", n);
var Yy = Wy;
const ja = Ye(), zy = (e, t, n) => (e = new ja(e, n), t = new ja(t, n), e.intersects(t, n));
var Xy = zy;
const Ky = di, Jy = We;
var Qy = (e, t, n) => {
  const r = [];
  let i = null, o = null;
  const s = e.sort((l, f) => Jy(l, f, n));
  for (const l of s)
    Ky(l, t, n) ? (o = l, i || (i = l)) : (o && r.push([i, o]), o = null, i = null);
  i && r.push([i, null]);
  const a = [];
  for (const [l, f] of r)
    l === f ? a.push(l) : !f && l === s[0] ? a.push("*") : f ? l === s[0] ? a.push(`<=${f}`) : a.push(`${l} - ${f}`) : a.push(`>=${l}`);
  const c = a.join(" || "), m = typeof t.raw == "string" ? t.raw : String(t);
  return c.length < m.length ? c : t;
};
const Ha = Ye(), os = fi(), { ANY: Vi } = os, $n = di, ss = We, Zy = (e, t, n = {}) => {
  if (e === t)
    return !0;
  e = new Ha(e, n), t = new Ha(t, n);
  let r = !1;
  e: for (const i of e.set) {
    for (const o of t.set) {
      const s = tw(i, o, n);
      if (r = r || s !== null, s)
        continue e;
    }
    if (r)
      return !1;
  }
  return !0;
}, ew = [new os(">=0.0.0-0")], Ga = [new os(">=0.0.0")], tw = (e, t, n) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === Vi) {
    if (t.length === 1 && t[0].semver === Vi)
      return !0;
    n.includePrerelease ? e = ew : e = Ga;
  }
  if (t.length === 1 && t[0].semver === Vi) {
    if (n.includePrerelease)
      return !0;
    t = Ga;
  }
  const r = /* @__PURE__ */ new Set();
  let i, o;
  for (const g of e)
    g.operator === ">" || g.operator === ">=" ? i = qa(i, g, n) : g.operator === "<" || g.operator === "<=" ? o = Va(o, g, n) : r.add(g.semver);
  if (r.size > 1)
    return null;
  let s;
  if (i && o) {
    if (s = ss(i.semver, o.semver, n), s > 0)
      return null;
    if (s === 0 && (i.operator !== ">=" || o.operator !== "<="))
      return null;
  }
  for (const g of r) {
    if (i && !$n(g, String(i), n) || o && !$n(g, String(o), n))
      return null;
    for (const _ of t)
      if (!$n(g, String(_), n))
        return !1;
    return !0;
  }
  let a, c, m, l, f = o && !n.includePrerelease && o.semver.prerelease.length ? o.semver : !1, h = i && !n.includePrerelease && i.semver.prerelease.length ? i.semver : !1;
  f && f.prerelease.length === 1 && o.operator === "<" && f.prerelease[0] === 0 && (f = !1);
  for (const g of t) {
    if (l = l || g.operator === ">" || g.operator === ">=", m = m || g.operator === "<" || g.operator === "<=", i) {
      if (h && g.semver.prerelease && g.semver.prerelease.length && g.semver.major === h.major && g.semver.minor === h.minor && g.semver.patch === h.patch && (h = !1), g.operator === ">" || g.operator === ">=") {
        if (a = qa(i, g, n), a === g && a !== i)
          return !1;
      } else if (i.operator === ">=" && !$n(i.semver, String(g), n))
        return !1;
    }
    if (o) {
      if (f && g.semver.prerelease && g.semver.prerelease.length && g.semver.major === f.major && g.semver.minor === f.minor && g.semver.patch === f.patch && (f = !1), g.operator === "<" || g.operator === "<=") {
        if (c = Va(o, g, n), c === g && c !== o)
          return !1;
      } else if (o.operator === "<=" && !$n(o.semver, String(g), n))
        return !1;
    }
    if (!g.operator && (o || i) && s !== 0)
      return !1;
  }
  return !(i && m && !o && s !== 0 || o && l && !i && s !== 0 || h || f);
}, qa = (e, t, n) => {
  if (!e)
    return t;
  const r = ss(e.semver, t.semver, n);
  return r > 0 ? e : r < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, Va = (e, t, n) => {
  if (!e)
    return t;
  const r = ss(e.semver, t.semver, n);
  return r < 0 ? e : r > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var nw = Zy;
const Wi = or, Wa = li, rw = Pe, Ya = xu, iw = gn, ow = fE, sw = pE, aw = gE, lw = yE, cw = vE, uw = SE, fw = $E, dw = IE, hw = We, pw = FE, mw = UE, gw = es, Ew = jE, yw = qE, ww = ui, _w = ts, vw = Lu, Aw = Uu, Tw = ns, Sw = rs, bw = ku, Cw = hy, $w = fi(), Rw = Ye(), Ow = di, Iw = _y, Pw = Sy, Nw = Ry, Dw = Py, Fw = Fy, xw = is, Lw = qy, Uw = Yy, kw = Xy, Mw = Qy, Bw = nw;
var Bu = {
  parse: iw,
  valid: ow,
  clean: sw,
  inc: aw,
  diff: lw,
  major: cw,
  minor: uw,
  patch: fw,
  prerelease: dw,
  compare: hw,
  rcompare: pw,
  compareLoose: mw,
  compareBuild: gw,
  sort: Ew,
  rsort: yw,
  gt: ww,
  lt: _w,
  eq: vw,
  neq: Aw,
  gte: Tw,
  lte: Sw,
  cmp: bw,
  coerce: Cw,
  Comparator: $w,
  Range: Rw,
  satisfies: Ow,
  toComparators: Iw,
  maxSatisfying: Pw,
  minSatisfying: Nw,
  minVersion: Dw,
  validRange: Fw,
  outside: xw,
  gtr: Lw,
  ltr: Uw,
  intersects: kw,
  simplifyRange: Mw,
  subset: Bw,
  SemVer: rw,
  re: Wi.re,
  src: Wi.src,
  tokens: Wi.t,
  SEMVER_SPEC_VERSION: Wa.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: Wa.RELEASE_TYPES,
  compareIdentifiers: Ya.compareIdentifiers,
  rcompareIdentifiers: Ya.rcompareIdentifiers
}, sr = {}, Xr = { exports: {} };
Xr.exports;
(function(e, t) {
  var n = 200, r = "__lodash_hash_undefined__", i = 1, o = 2, s = 9007199254740991, a = "[object Arguments]", c = "[object Array]", m = "[object AsyncFunction]", l = "[object Boolean]", f = "[object Date]", h = "[object Error]", g = "[object Function]", _ = "[object GeneratorFunction]", E = "[object Map]", A = "[object Number]", T = "[object Null]", R = "[object Object]", D = "[object Promise]", B = "[object Proxy]", G = "[object RegExp]", J = "[object Set]", Q = "[object String]", oe = "[object Symbol]", U = "[object Undefined]", y = "[object WeakMap]", H = "[object ArrayBuffer]", Y = "[object DataView]", ee = "[object Float32Array]", O = "[object Float64Array]", $ = "[object Int8Array]", P = "[object Int16Array]", C = "[object Int32Array]", N = "[object Uint8Array]", I = "[object Uint8ClampedArray]", k = "[object Uint16Array]", q = "[object Uint32Array]", F = /[\\^$.*+?()[\]{}|]/g, z = /^\[object .+?Constructor\]$/, ce = /^(?:0|[1-9]\d*)$/, M = {};
  M[ee] = M[O] = M[$] = M[P] = M[C] = M[N] = M[I] = M[k] = M[q] = !0, M[a] = M[c] = M[H] = M[l] = M[Y] = M[f] = M[h] = M[g] = M[E] = M[A] = M[R] = M[G] = M[J] = M[Q] = M[y] = !1;
  var we = typeof Ce == "object" && Ce && Ce.Object === Object && Ce, wn = typeof self == "object" && self && self.Object === Object && self, ke = we || wn || Function("return this")(), ur = t && !t.nodeType && t, _n = ur && !0 && e && !e.nodeType && e, qt = _n && _n.exports === ur, vn = qt && we.process, d = function() {
    try {
      return vn && vn.binding && vn.binding("util");
    } catch {
    }
  }(), u = d && d.isTypedArray;
  function S(p, v) {
    for (var b = -1, x = p == null ? 0 : p.length, K = 0, j = []; ++b < x; ) {
      var ie = p[b];
      v(ie, b, p) && (j[K++] = ie);
    }
    return j;
  }
  function w(p, v) {
    for (var b = -1, x = v.length, K = p.length; ++b < x; )
      p[K + b] = v[b];
    return p;
  }
  function W(p, v) {
    for (var b = -1, x = p == null ? 0 : p.length; ++b < x; )
      if (v(p[b], b, p))
        return !0;
    return !1;
  }
  function te(p, v) {
    for (var b = -1, x = Array(p); ++b < p; )
      x[b] = v(b);
    return x;
  }
  function se(p) {
    return function(v) {
      return p(v);
    };
  }
  function _e(p, v) {
    return p.has(v);
  }
  function ve(p, v) {
    return p == null ? void 0 : p[v];
  }
  function Me(p) {
    var v = -1, b = Array(p.size);
    return p.forEach(function(x, K) {
      b[++v] = [K, x];
    }), b;
  }
  function ue(p, v) {
    return function(b) {
      return p(v(b));
    };
  }
  function Be(p) {
    var v = -1, b = Array(p.size);
    return p.forEach(function(x) {
      b[++v] = x;
    }), b;
  }
  var Ai = Array.prototype, fr = Function.prototype, at = Object.prototype, Vt = ke["__core-js_shared__"], ps = fr.toString, Xe = at.hasOwnProperty, ms = function() {
    var p = /[^.]+$/.exec(Vt && Vt.keys && Vt.keys.IE_PROTO || "");
    return p ? "Symbol(src)_1." + p : "";
  }(), gs = at.toString, rf = RegExp(
    "^" + ps.call(Xe).replace(F, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), Es = qt ? ke.Buffer : void 0, dr = ke.Symbol, ys = ke.Uint8Array, ws = at.propertyIsEnumerable, of = Ai.splice, Ct = dr ? dr.toStringTag : void 0, _s = Object.getOwnPropertySymbols, sf = Es ? Es.isBuffer : void 0, af = ue(Object.keys, Object), Ti = Wt(ke, "DataView"), An = Wt(ke, "Map"), Si = Wt(ke, "Promise"), bi = Wt(ke, "Set"), Ci = Wt(ke, "WeakMap"), Tn = Wt(Object, "create"), lf = Ot(Ti), cf = Ot(An), uf = Ot(Si), ff = Ot(bi), df = Ot(Ci), vs = dr ? dr.prototype : void 0, $i = vs ? vs.valueOf : void 0;
  function $t(p) {
    var v = -1, b = p == null ? 0 : p.length;
    for (this.clear(); ++v < b; ) {
      var x = p[v];
      this.set(x[0], x[1]);
    }
  }
  function hf() {
    this.__data__ = Tn ? Tn(null) : {}, this.size = 0;
  }
  function pf(p) {
    var v = this.has(p) && delete this.__data__[p];
    return this.size -= v ? 1 : 0, v;
  }
  function mf(p) {
    var v = this.__data__;
    if (Tn) {
      var b = v[p];
      return b === r ? void 0 : b;
    }
    return Xe.call(v, p) ? v[p] : void 0;
  }
  function gf(p) {
    var v = this.__data__;
    return Tn ? v[p] !== void 0 : Xe.call(v, p);
  }
  function Ef(p, v) {
    var b = this.__data__;
    return this.size += this.has(p) ? 0 : 1, b[p] = Tn && v === void 0 ? r : v, this;
  }
  $t.prototype.clear = hf, $t.prototype.delete = pf, $t.prototype.get = mf, $t.prototype.has = gf, $t.prototype.set = Ef;
  function nt(p) {
    var v = -1, b = p == null ? 0 : p.length;
    for (this.clear(); ++v < b; ) {
      var x = p[v];
      this.set(x[0], x[1]);
    }
  }
  function yf() {
    this.__data__ = [], this.size = 0;
  }
  function wf(p) {
    var v = this.__data__, b = pr(v, p);
    if (b < 0)
      return !1;
    var x = v.length - 1;
    return b == x ? v.pop() : of.call(v, b, 1), --this.size, !0;
  }
  function _f(p) {
    var v = this.__data__, b = pr(v, p);
    return b < 0 ? void 0 : v[b][1];
  }
  function vf(p) {
    return pr(this.__data__, p) > -1;
  }
  function Af(p, v) {
    var b = this.__data__, x = pr(b, p);
    return x < 0 ? (++this.size, b.push([p, v])) : b[x][1] = v, this;
  }
  nt.prototype.clear = yf, nt.prototype.delete = wf, nt.prototype.get = _f, nt.prototype.has = vf, nt.prototype.set = Af;
  function Rt(p) {
    var v = -1, b = p == null ? 0 : p.length;
    for (this.clear(); ++v < b; ) {
      var x = p[v];
      this.set(x[0], x[1]);
    }
  }
  function Tf() {
    this.size = 0, this.__data__ = {
      hash: new $t(),
      map: new (An || nt)(),
      string: new $t()
    };
  }
  function Sf(p) {
    var v = mr(this, p).delete(p);
    return this.size -= v ? 1 : 0, v;
  }
  function bf(p) {
    return mr(this, p).get(p);
  }
  function Cf(p) {
    return mr(this, p).has(p);
  }
  function $f(p, v) {
    var b = mr(this, p), x = b.size;
    return b.set(p, v), this.size += b.size == x ? 0 : 1, this;
  }
  Rt.prototype.clear = Tf, Rt.prototype.delete = Sf, Rt.prototype.get = bf, Rt.prototype.has = Cf, Rt.prototype.set = $f;
  function hr(p) {
    var v = -1, b = p == null ? 0 : p.length;
    for (this.__data__ = new Rt(); ++v < b; )
      this.add(p[v]);
  }
  function Rf(p) {
    return this.__data__.set(p, r), this;
  }
  function Of(p) {
    return this.__data__.has(p);
  }
  hr.prototype.add = hr.prototype.push = Rf, hr.prototype.has = Of;
  function lt(p) {
    var v = this.__data__ = new nt(p);
    this.size = v.size;
  }
  function If() {
    this.__data__ = new nt(), this.size = 0;
  }
  function Pf(p) {
    var v = this.__data__, b = v.delete(p);
    return this.size = v.size, b;
  }
  function Nf(p) {
    return this.__data__.get(p);
  }
  function Df(p) {
    return this.__data__.has(p);
  }
  function Ff(p, v) {
    var b = this.__data__;
    if (b instanceof nt) {
      var x = b.__data__;
      if (!An || x.length < n - 1)
        return x.push([p, v]), this.size = ++b.size, this;
      b = this.__data__ = new Rt(x);
    }
    return b.set(p, v), this.size = b.size, this;
  }
  lt.prototype.clear = If, lt.prototype.delete = Pf, lt.prototype.get = Nf, lt.prototype.has = Df, lt.prototype.set = Ff;
  function xf(p, v) {
    var b = gr(p), x = !b && Kf(p), K = !b && !x && Ri(p), j = !b && !x && !K && Is(p), ie = b || x || K || j, he = ie ? te(p.length, String) : [], me = he.length;
    for (var ne in p)
      Xe.call(p, ne) && !(ie && // Safari 9 has enumerable `arguments.length` in strict mode.
      (ne == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      K && (ne == "offset" || ne == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      j && (ne == "buffer" || ne == "byteLength" || ne == "byteOffset") || // Skip index properties.
      Vf(ne, me))) && he.push(ne);
    return he;
  }
  function pr(p, v) {
    for (var b = p.length; b--; )
      if (Cs(p[b][0], v))
        return b;
    return -1;
  }
  function Lf(p, v, b) {
    var x = v(p);
    return gr(p) ? x : w(x, b(p));
  }
  function Sn(p) {
    return p == null ? p === void 0 ? U : T : Ct && Ct in Object(p) ? Gf(p) : Xf(p);
  }
  function As(p) {
    return bn(p) && Sn(p) == a;
  }
  function Ts(p, v, b, x, K) {
    return p === v ? !0 : p == null || v == null || !bn(p) && !bn(v) ? p !== p && v !== v : Uf(p, v, b, x, Ts, K);
  }
  function Uf(p, v, b, x, K, j) {
    var ie = gr(p), he = gr(v), me = ie ? c : ct(p), ne = he ? c : ct(v);
    me = me == a ? R : me, ne = ne == a ? R : ne;
    var Fe = me == R, je = ne == R, Ae = me == ne;
    if (Ae && Ri(p)) {
      if (!Ri(v))
        return !1;
      ie = !0, Fe = !1;
    }
    if (Ae && !Fe)
      return j || (j = new lt()), ie || Is(p) ? Ss(p, v, b, x, K, j) : jf(p, v, me, b, x, K, j);
    if (!(b & i)) {
      var xe = Fe && Xe.call(p, "__wrapped__"), Le = je && Xe.call(v, "__wrapped__");
      if (xe || Le) {
        var ut = xe ? p.value() : p, rt = Le ? v.value() : v;
        return j || (j = new lt()), K(ut, rt, b, x, j);
      }
    }
    return Ae ? (j || (j = new lt()), Hf(p, v, b, x, K, j)) : !1;
  }
  function kf(p) {
    if (!Os(p) || Yf(p))
      return !1;
    var v = $s(p) ? rf : z;
    return v.test(Ot(p));
  }
  function Mf(p) {
    return bn(p) && Rs(p.length) && !!M[Sn(p)];
  }
  function Bf(p) {
    if (!zf(p))
      return af(p);
    var v = [];
    for (var b in Object(p))
      Xe.call(p, b) && b != "constructor" && v.push(b);
    return v;
  }
  function Ss(p, v, b, x, K, j) {
    var ie = b & i, he = p.length, me = v.length;
    if (he != me && !(ie && me > he))
      return !1;
    var ne = j.get(p);
    if (ne && j.get(v))
      return ne == v;
    var Fe = -1, je = !0, Ae = b & o ? new hr() : void 0;
    for (j.set(p, v), j.set(v, p); ++Fe < he; ) {
      var xe = p[Fe], Le = v[Fe];
      if (x)
        var ut = ie ? x(Le, xe, Fe, v, p, j) : x(xe, Le, Fe, p, v, j);
      if (ut !== void 0) {
        if (ut)
          continue;
        je = !1;
        break;
      }
      if (Ae) {
        if (!W(v, function(rt, It) {
          if (!_e(Ae, It) && (xe === rt || K(xe, rt, b, x, j)))
            return Ae.push(It);
        })) {
          je = !1;
          break;
        }
      } else if (!(xe === Le || K(xe, Le, b, x, j))) {
        je = !1;
        break;
      }
    }
    return j.delete(p), j.delete(v), je;
  }
  function jf(p, v, b, x, K, j, ie) {
    switch (b) {
      case Y:
        if (p.byteLength != v.byteLength || p.byteOffset != v.byteOffset)
          return !1;
        p = p.buffer, v = v.buffer;
      case H:
        return !(p.byteLength != v.byteLength || !j(new ys(p), new ys(v)));
      case l:
      case f:
      case A:
        return Cs(+p, +v);
      case h:
        return p.name == v.name && p.message == v.message;
      case G:
      case Q:
        return p == v + "";
      case E:
        var he = Me;
      case J:
        var me = x & i;
        if (he || (he = Be), p.size != v.size && !me)
          return !1;
        var ne = ie.get(p);
        if (ne)
          return ne == v;
        x |= o, ie.set(p, v);
        var Fe = Ss(he(p), he(v), x, K, j, ie);
        return ie.delete(p), Fe;
      case oe:
        if ($i)
          return $i.call(p) == $i.call(v);
    }
    return !1;
  }
  function Hf(p, v, b, x, K, j) {
    var ie = b & i, he = bs(p), me = he.length, ne = bs(v), Fe = ne.length;
    if (me != Fe && !ie)
      return !1;
    for (var je = me; je--; ) {
      var Ae = he[je];
      if (!(ie ? Ae in v : Xe.call(v, Ae)))
        return !1;
    }
    var xe = j.get(p);
    if (xe && j.get(v))
      return xe == v;
    var Le = !0;
    j.set(p, v), j.set(v, p);
    for (var ut = ie; ++je < me; ) {
      Ae = he[je];
      var rt = p[Ae], It = v[Ae];
      if (x)
        var Ps = ie ? x(It, rt, Ae, v, p, j) : x(rt, It, Ae, p, v, j);
      if (!(Ps === void 0 ? rt === It || K(rt, It, b, x, j) : Ps)) {
        Le = !1;
        break;
      }
      ut || (ut = Ae == "constructor");
    }
    if (Le && !ut) {
      var Er = p.constructor, yr = v.constructor;
      Er != yr && "constructor" in p && "constructor" in v && !(typeof Er == "function" && Er instanceof Er && typeof yr == "function" && yr instanceof yr) && (Le = !1);
    }
    return j.delete(p), j.delete(v), Le;
  }
  function bs(p) {
    return Lf(p, Zf, qf);
  }
  function mr(p, v) {
    var b = p.__data__;
    return Wf(v) ? b[typeof v == "string" ? "string" : "hash"] : b.map;
  }
  function Wt(p, v) {
    var b = ve(p, v);
    return kf(b) ? b : void 0;
  }
  function Gf(p) {
    var v = Xe.call(p, Ct), b = p[Ct];
    try {
      p[Ct] = void 0;
      var x = !0;
    } catch {
    }
    var K = gs.call(p);
    return x && (v ? p[Ct] = b : delete p[Ct]), K;
  }
  var qf = _s ? function(p) {
    return p == null ? [] : (p = Object(p), S(_s(p), function(v) {
      return ws.call(p, v);
    }));
  } : ed, ct = Sn;
  (Ti && ct(new Ti(new ArrayBuffer(1))) != Y || An && ct(new An()) != E || Si && ct(Si.resolve()) != D || bi && ct(new bi()) != J || Ci && ct(new Ci()) != y) && (ct = function(p) {
    var v = Sn(p), b = v == R ? p.constructor : void 0, x = b ? Ot(b) : "";
    if (x)
      switch (x) {
        case lf:
          return Y;
        case cf:
          return E;
        case uf:
          return D;
        case ff:
          return J;
        case df:
          return y;
      }
    return v;
  });
  function Vf(p, v) {
    return v = v ?? s, !!v && (typeof p == "number" || ce.test(p)) && p > -1 && p % 1 == 0 && p < v;
  }
  function Wf(p) {
    var v = typeof p;
    return v == "string" || v == "number" || v == "symbol" || v == "boolean" ? p !== "__proto__" : p === null;
  }
  function Yf(p) {
    return !!ms && ms in p;
  }
  function zf(p) {
    var v = p && p.constructor, b = typeof v == "function" && v.prototype || at;
    return p === b;
  }
  function Xf(p) {
    return gs.call(p);
  }
  function Ot(p) {
    if (p != null) {
      try {
        return ps.call(p);
      } catch {
      }
      try {
        return p + "";
      } catch {
      }
    }
    return "";
  }
  function Cs(p, v) {
    return p === v || p !== p && v !== v;
  }
  var Kf = As(/* @__PURE__ */ function() {
    return arguments;
  }()) ? As : function(p) {
    return bn(p) && Xe.call(p, "callee") && !ws.call(p, "callee");
  }, gr = Array.isArray;
  function Jf(p) {
    return p != null && Rs(p.length) && !$s(p);
  }
  var Ri = sf || td;
  function Qf(p, v) {
    return Ts(p, v);
  }
  function $s(p) {
    if (!Os(p))
      return !1;
    var v = Sn(p);
    return v == g || v == _ || v == m || v == B;
  }
  function Rs(p) {
    return typeof p == "number" && p > -1 && p % 1 == 0 && p <= s;
  }
  function Os(p) {
    var v = typeof p;
    return p != null && (v == "object" || v == "function");
  }
  function bn(p) {
    return p != null && typeof p == "object";
  }
  var Is = u ? se(u) : Mf;
  function Zf(p) {
    return Jf(p) ? xf(p) : Bf(p);
  }
  function ed() {
    return [];
  }
  function td() {
    return !1;
  }
  e.exports = Qf;
})(Xr, Xr.exports);
var jw = Xr.exports;
Object.defineProperty(sr, "__esModule", { value: !0 });
sr.DownloadedUpdateHelper = void 0;
sr.createTempUpdateFile = Ww;
const Hw = Qn, Gw = At, za = jw, Pt = St, xn = Z;
class qw {
  constructor(t) {
    this.cacheDir = t, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return xn.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(t, n, r, i) {
    if (this.versionInfo != null && this.file === t && this.fileInfo != null)
      return za(this.versionInfo, n) && za(this.fileInfo.info, r.info) && await (0, Pt.pathExists)(t) ? t : null;
    const o = await this.getValidCachedUpdateFile(r, i);
    return o === null ? null : (i.info(`Update has already been downloaded to ${t}).`), this._file = o, o);
  }
  async setDownloadedFile(t, n, r, i, o, s) {
    this._file = t, this._packageFile = n, this.versionInfo = r, this.fileInfo = i, this._downloadedFileInfo = {
      fileName: o,
      sha512: i.info.sha512,
      isAdminRightsRequired: i.info.isAdminRightsRequired === !0
    }, s && await (0, Pt.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
  }
  async clear() {
    this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, Pt.emptyDir)(this.cacheDirForPendingUpdate);
    } catch {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(t, n) {
    const r = this.getUpdateInfoFile();
    if (!await (0, Pt.pathExists)(r))
      return null;
    let o;
    try {
      o = await (0, Pt.readJson)(r);
    } catch (m) {
      let l = "No cached update info available";
      return m.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), l += ` (error on read: ${m.message})`), n.info(l), null;
    }
    if (!((o == null ? void 0 : o.fileName) !== null))
      return n.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== o.sha512)
      return n.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${o.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const a = xn.join(this.cacheDirForPendingUpdate, o.fileName);
    if (!await (0, Pt.pathExists)(a))
      return n.info("Cached update file doesn't exist"), null;
    const c = await Vw(a);
    return t.info.sha512 !== c ? (n.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${c}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = o, a);
  }
  getUpdateInfoFile() {
    return xn.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
sr.DownloadedUpdateHelper = qw;
function Vw(e, t = "sha512", n = "base64", r) {
  return new Promise((i, o) => {
    const s = (0, Hw.createHash)(t);
    s.on("error", o).setEncoding(n), (0, Gw.createReadStream)(e, {
      ...r,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", o).on("end", () => {
      s.end(), i(s.read());
    }).pipe(s, { end: !1 });
  });
}
async function Ww(e, t, n) {
  let r = 0, i = xn.join(t, e);
  for (let o = 0; o < 3; o++)
    try {
      return await (0, Pt.unlink)(i), i;
    } catch (s) {
      if (s.code === "ENOENT")
        return i;
      n.warn(`Error on remove temp update file: ${s}`), i = xn.join(t, `${r++}-${e}`);
    }
  return i;
}
var hi = {}, as = {};
Object.defineProperty(as, "__esModule", { value: !0 });
as.getAppCacheDir = zw;
const Yi = Z, Yw = Qr;
function zw() {
  const e = (0, Yw.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || Yi.join(e, "AppData", "Local") : process.platform === "darwin" ? t = Yi.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || Yi.join(e, ".cache"), t;
}
Object.defineProperty(hi, "__esModule", { value: !0 });
hi.ElectronAppAdapter = void 0;
const Xa = Z, Xw = as;
class Kw {
  constructor(t = Ut.app) {
    this.app = t;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === !0;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? Xa.join(process.resourcesPath, "app-update.yml") : Xa.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, Xw.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(t) {
    this.app.once("quit", (n, r) => t(r));
  }
}
hi.ElectronAppAdapter = Kw;
var ju = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = n;
  const t = de;
  e.NET_SESSION_NAME = "electron-updater";
  function n() {
    return Ut.session.fromPartition(e.NET_SESSION_NAME, {
      cache: !1
    });
  }
  class r extends t.HttpExecutor {
    constructor(o) {
      super(), this.proxyLoginCallback = o, this.cachedSession = null;
    }
    async download(o, s, a) {
      return await a.cancellationToken.createPromise((c, m, l) => {
        const f = {
          headers: a.headers || void 0,
          redirect: "manual"
        };
        (0, t.configureRequestUrl)(o, f), (0, t.configureRequestOptions)(f), this.doDownload(f, {
          destination: s,
          options: a,
          onCancel: l,
          callback: (h) => {
            h == null ? c(s) : m(h);
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(o, s) {
      o.headers && o.headers.Host && (o.host = o.headers.Host, delete o.headers.Host), this.cachedSession == null && (this.cachedSession = n());
      const a = Ut.net.request({
        ...o,
        session: this.cachedSession
      });
      return a.on("response", s), this.proxyLoginCallback != null && a.on("login", this.proxyLoginCallback), a;
    }
    addRedirectHandlers(o, s, a, c, m) {
      o.on("redirect", (l, f, h) => {
        o.abort(), c > this.maxRedirects ? a(this.createMaxRedirectError()) : m(t.HttpExecutor.prepareRedirectUrlOptions(h, s));
      });
    }
  }
  e.ElectronHttpExecutor = r;
})(ju);
var ar = {}, ze = {};
Object.defineProperty(ze, "__esModule", { value: !0 });
ze.newBaseUrl = Jw;
ze.newUrlFromBase = Qw;
ze.getChannelFilename = Zw;
const Hu = Tt;
function Jw(e) {
  const t = new Hu.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function Qw(e, t, n = !1) {
  const r = new Hu.URL(e, t), i = t.search;
  return i != null && i.length !== 0 ? r.search = i : n && (r.search = `noCache=${Date.now().toString(32)}`), r;
}
function Zw(e) {
  return `${e}.yml`;
}
var le = {}, e_ = "[object Symbol]", Gu = /[\\^$.*+?()[\]{}|]/g, t_ = RegExp(Gu.source), n_ = typeof Ce == "object" && Ce && Ce.Object === Object && Ce, r_ = typeof self == "object" && self && self.Object === Object && self, i_ = n_ || r_ || Function("return this")(), o_ = Object.prototype, s_ = o_.toString, Ka = i_.Symbol, Ja = Ka ? Ka.prototype : void 0, Qa = Ja ? Ja.toString : void 0;
function a_(e) {
  if (typeof e == "string")
    return e;
  if (c_(e))
    return Qa ? Qa.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function l_(e) {
  return !!e && typeof e == "object";
}
function c_(e) {
  return typeof e == "symbol" || l_(e) && s_.call(e) == e_;
}
function u_(e) {
  return e == null ? "" : a_(e);
}
function f_(e) {
  return e = u_(e), e && t_.test(e) ? e.replace(Gu, "\\$&") : e;
}
var qu = f_;
Object.defineProperty(le, "__esModule", { value: !0 });
le.Provider = void 0;
le.findFile = g_;
le.parseUpdateInfo = E_;
le.getFileList = Vu;
le.resolveFiles = y_;
const _t = de, d_ = ye, h_ = Tt, Kr = ze, p_ = qu;
class m_ {
  constructor(t) {
    this.runtimeOptions = t, this.requestHeaders = null, this.executor = t.executor;
  }
  // By default, the blockmap file is in the same directory as the main file
  // But some providers may have a different blockmap file, so we need to override this method
  getBlockMapFiles(t, n, r, i = null) {
    const o = (0, Kr.newUrlFromBase)(`${t.pathname}.blockmap`, t);
    return [(0, Kr.newUrlFromBase)(`${t.pathname.replace(new RegExp(p_(r), "g"), n)}.blockmap`, i ? new h_.URL(i) : t), o];
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const t = process.env.TEST_UPDATER_ARCH || process.arch;
      return "-linux" + (t === "x64" ? "" : `-${t}`);
    } else
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(t) {
    return `${t}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(t) {
    this.requestHeaders = t;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(t, n, r) {
    return this.executor.request(this.createRequestOptions(t, n), r);
  }
  createRequestOptions(t, n) {
    const r = {};
    return this.requestHeaders == null ? n != null && (r.headers = n) : r.headers = n == null ? this.requestHeaders : { ...this.requestHeaders, ...n }, (0, _t.configureRequestUrl)(t, r), r;
  }
}
le.Provider = m_;
function g_(e, t, n) {
  var r;
  if (e.length === 0)
    throw (0, _t.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const i = e.filter((s) => s.url.pathname.toLowerCase().endsWith(`.${t.toLowerCase()}`)), o = (r = i.find((s) => [s.url.pathname, s.info.url].some((a) => a.includes(process.arch)))) !== null && r !== void 0 ? r : i.shift();
  return o || (n == null ? e[0] : e.find((s) => !n.some((a) => s.url.pathname.toLowerCase().endsWith(`.${a.toLowerCase()}`))));
}
function E_(e, t, n) {
  if (e == null)
    throw (0, _t.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${n}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let r;
  try {
    r = (0, d_.load)(e);
  } catch (i) {
    throw (0, _t.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${n}): ${i.stack || i.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return r;
}
function Vu(e) {
  const t = e.files;
  if (t != null && t.length > 0)
    return t;
  if (e.path != null)
    return [
      {
        url: e.path,
        sha2: e.sha2,
        sha512: e.sha512
      }
    ];
  throw (0, _t.newError)(`No files provided: ${(0, _t.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
}
function y_(e, t, n = (r) => r) {
  const i = Vu(e).map((a) => {
    if (a.sha2 == null && a.sha512 == null)
      throw (0, _t.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, _t.safeStringifyJson)(a)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, Kr.newUrlFromBase)(n(a.url), t),
      info: a
    };
  }), o = e.packages, s = o == null ? null : o[process.arch] || o.ia32;
  return s != null && (i[0].packageInfo = {
    ...s,
    path: (0, Kr.newUrlFromBase)(n(s.path), t).href
  }), i;
}
Object.defineProperty(ar, "__esModule", { value: !0 });
ar.GenericProvider = void 0;
const Za = de, zi = ze, Xi = le;
class w_ extends Xi.Provider {
  constructor(t, n, r) {
    super(r), this.configuration = t, this.updater = n, this.baseUrl = (0, zi.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, zi.getChannelFilename)(this.channel), n = (0, zi.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let r = 0; ; r++)
      try {
        return (0, Xi.parseUpdateInfo)(await this.httpRequest(n), t, n);
      } catch (i) {
        if (i instanceof Za.HttpError && i.statusCode === 404)
          throw (0, Za.newError)(`Cannot find channel "${t}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        if (i.code === "ECONNREFUSED" && r < 3) {
          await new Promise((o, s) => {
            try {
              setTimeout(o, 1e3 * r);
            } catch (a) {
              s(a);
            }
          });
          continue;
        }
        throw i;
      }
  }
  resolveFiles(t) {
    return (0, Xi.resolveFiles)(t, this.baseUrl);
  }
}
ar.GenericProvider = w_;
var pi = {}, mi = {};
Object.defineProperty(mi, "__esModule", { value: !0 });
mi.BitbucketProvider = void 0;
const el = de, Ki = ze, Ji = le;
class __ extends Ji.Provider {
  constructor(t, n, r) {
    super({
      ...r,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = n;
    const { owner: i, slug: o } = t;
    this.baseUrl = (0, Ki.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${o}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new el.CancellationToken(), n = (0, Ki.getChannelFilename)(this.getCustomChannelName(this.channel)), r = (0, Ki.newUrlFromBase)(n, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(r, void 0, t);
      return (0, Ji.parseUpdateInfo)(i, n, r);
    } catch (i) {
      throw (0, el.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, Ji.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: n } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${n}, channel: ${this.channel})`;
  }
}
mi.BitbucketProvider = __;
var vt = {};
Object.defineProperty(vt, "__esModule", { value: !0 });
vt.GitHubProvider = vt.BaseGitHubProvider = void 0;
vt.computeReleaseNotes = Yu;
const it = de, Qe = Bu, v_ = Tt, on = ze, Co = le, Qi = /\/tag\/(v?[^/]+)$/;
class Wu extends Co.Provider {
  constructor(t, n, r) {
    super({
      ...r,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, on.newBaseUrl)((0, it.githubUrl)(t, n));
    const i = n === "github.com" ? "api.github.com" : n;
    this.baseApiUrl = (0, on.newBaseUrl)((0, it.githubUrl)(t, i));
  }
  computeGithubBasePath(t) {
    const n = this.options.host;
    return n && !["github.com", "api.github.com"].includes(n) ? `/api/v3${t}` : t;
  }
}
vt.BaseGitHubProvider = Wu;
class A_ extends Wu {
  constructor(t, n, r) {
    super(t, "github.com", r), this.options = t, this.updater = n;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, n, r, i, o;
    const s = new it.CancellationToken(), a = await this.httpRequest((0, on.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, s), c = (0, it.parseXml)(a);
    let m = c.element("entry", !1, "No published versions on GitHub"), l = null;
    try {
      if (this.updater.allowPrerelease) {
        const A = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((n = Qe.prerelease(this.updater.currentVersion)) === null || n === void 0 ? void 0 : n[0]) || null;
        if (A === null)
          l = Qi.exec(m.element("link").attribute("href"))[1];
        else
          for (const T of c.getElements("entry")) {
            const R = Qi.exec(T.element("link").attribute("href"));
            if (R === null)
              continue;
            const D = R[1];
            if (!Qe.valid(D))
              continue;
            const B = ((r = Qe.prerelease(D)) === null || r === void 0 ? void 0 : r[0]) || null, G = !A || ["alpha", "beta"].includes(A), J = B !== null && !["alpha", "beta"].includes(String(B));
            if (G && !J && !(A === "beta" && B === "alpha")) {
              l = D, m = T;
              break;
            }
            if (B && B === A) {
              l = D, m = T;
              break;
            }
          }
      } else {
        l = await this.getLatestTagName(s);
        for (const A of c.getElements("entry")) {
          const T = Qi.exec(A.element("link").attribute("href"));
          if (T != null && T[1] === l) {
            m = A;
            break;
          }
        }
      }
    } catch (A) {
      throw (0, it.newError)(`Cannot parse releases feed: ${A.stack || A.message},
XML:
${a}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (l == null)
      throw (0, it.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let f, h = "", g = "";
    const _ = async (A) => {
      h = (0, on.getChannelFilename)(A), g = (0, on.newUrlFromBase)(this.getBaseDownloadPath(String(l), h), this.baseUrl);
      const T = this.createRequestOptions(g);
      try {
        return await this.executor.request(T, s);
      } catch (R) {
        throw R instanceof it.HttpError && R.statusCode === 404 ? (0, it.newError)(`Cannot find ${h} in the latest release artifacts (${g}): ${R.stack || R.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : R;
      }
    };
    try {
      let A = this.channel;
      this.updater.allowPrerelease && (!((i = Qe.prerelease(l)) === null || i === void 0) && i[0]) && (A = this.getCustomChannelName(String((o = Qe.prerelease(l)) === null || o === void 0 ? void 0 : o[0]))), f = await _(A);
    } catch (A) {
      if (this.updater.allowPrerelease)
        f = await _(this.getDefaultChannelName());
      else
        throw A;
    }
    const E = (0, Co.parseUpdateInfo)(f, h, g);
    return E.releaseName == null && (E.releaseName = m.elementValueOrEmpty("title")), E.releaseNotes == null && (E.releaseNotes = Yu(this.updater.currentVersion, this.updater.fullChangelog, c, m)), {
      tag: l,
      ...E
    };
  }
  async getLatestTagName(t) {
    const n = this.options, r = n.host == null || n.host === "github.com" ? (0, on.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new v_.URL(`${this.computeGithubBasePath(`/repos/${n.owner}/${n.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const i = await this.httpRequest(r, { Accept: "application/json" }, t);
      return i == null ? null : JSON.parse(i).tag_name;
    } catch (i) {
      throw (0, it.newError)(`Unable to find latest version on GitHub (${r}), please ensure a production release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(t) {
    return (0, Co.resolveFiles)(t, this.baseUrl, (n) => this.getBaseDownloadPath(t.tag, n.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, n) {
    return `${this.basePath}/download/${t}/${n}`;
  }
}
vt.GitHubProvider = A_;
function tl(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function Yu(e, t, n, r) {
  if (!t)
    return tl(r);
  const i = /\/tag\/v?([^/]+)$/;
  let o;
  try {
    o = i.exec(r.element("link").attribute("href"))[1], o = Qe.valid(o) ? o : void 0;
  } catch {
  }
  if (o == null)
    return null;
  const s = [];
  for (const a of n.getElements("entry")) {
    let c;
    try {
      const f = i.exec(a.element("link").attribute("href"));
      if (!f)
        continue;
      c = f[1];
    } catch {
      continue;
    }
    if (!Qe.valid(c))
      continue;
    const m = Qe.gt(c, e.raw), l = Qe.lte(c, o);
    m && l && s.push({
      version: c,
      note: tl(a)
    });
  }
  return s.sort((a, c) => Qe.rcompare(a.version, c.version));
}
var gi = {};
Object.defineProperty(gi, "__esModule", { value: !0 });
gi.GitLabProvider = void 0;
const ge = de, Zi = Tt, T_ = qu, Pr = ze, eo = le;
class S_ extends eo.Provider {
  /**
   * Normalizes filenames by replacing spaces and underscores with dashes.
   *
   * This is a workaround to handle filename formatting differences between tools:
   * - electron-builder formats filenames like "test file.txt" as "test-file.txt"
   * - GitLab may provide asset URLs using underscores, such as "test_file.txt"
   *
   * Because of this mismatch, we can't reliably extract the correct filename from
   * the asset path without normalization. This function ensures consistent matching
   * across different filename formats by converting all spaces and underscores to dashes.
   *
   * @param filename The filename to normalize
   * @returns The normalized filename with spaces and underscores replaced by dashes
   */
  normalizeFilename(t) {
    return t.replace(/ |_/g, "-");
  }
  constructor(t, n, r) {
    super({
      ...r,
      // GitLab might not support multiple range requests efficiently
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.updater = n, this.cachedLatestVersion = null;
    const o = t.host || "gitlab.com";
    this.baseApiUrl = (0, Pr.newBaseUrl)(`https://${o}/api/v4`);
  }
  createRequestOptions(t, n) {
    const r = super.createRequestOptions(t, n);
    return r.redirect = "manual", r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = new ge.CancellationToken(), n = (0, Pr.newUrlFromBase)(`projects/${this.options.projectId}/releases/permalink/latest`, this.baseApiUrl), r = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) };
    let i;
    try {
      i = await this.httpRequest(n, r, t);
    } catch (g) {
      throw (0, ge.newError)(`Unable to find latest release on GitLab (${n}): ${g.stack || g.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    if (!i)
      throw (0, ge.newError)("No published releases on GitLab", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let o;
    try {
      o = JSON.parse(i);
    } catch (g) {
      throw (0, ge.newError)(`Unable to parse latest release response from GitLab (${n}): response was not valid JSON: ${g.stack || g.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    if (o.upcoming_release)
      throw (0, ge.newError)("Latest GitLab release is scheduled but not yet published", "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    const s = o.tag_name;
    let a = null, c = "", m = null;
    const l = async (g) => {
      c = (0, Pr.getChannelFilename)(g);
      const _ = o.assets.links.find((T) => T.name === c);
      if (!_)
        throw (0, ge.newError)(`Cannot find ${c} in the latest release assets`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      m = new Zi.URL(_.direct_asset_url);
      const E = this.setAuthHeaderForToken(this.options.token || null), A = Object.keys(E).length ? E : void 0;
      try {
        const T = await this.httpRequest(m, A, t);
        if (!T)
          throw (0, ge.newError)(`Empty response from ${m}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        return T;
      } catch (T) {
        throw T instanceof ge.HttpError && T.statusCode === 404 ? (0, ge.newError)(`Cannot find ${c} in the latest release artifacts (${m}): ${T.stack || T.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : T;
      }
    };
    try {
      a = await l(this.channel);
    } catch (g) {
      if (this.channel !== this.getDefaultChannelName())
        a = await l(this.getDefaultChannelName());
      else
        throw g;
    }
    if (!a)
      throw (0, ge.newError)(`Unable to parse channel data from ${c}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    const f = (0, eo.parseUpdateInfo)(a, c, m);
    f.releaseName == null && (f.releaseName = o.name), f.releaseNotes == null && (f.releaseNotes = o.description || null);
    const h = {
      tag: s,
      assets: this.convertAssetsToMap(o.assets),
      ...f
    };
    return this.cachedLatestVersion = h, h;
  }
  /**
   * Utility function to convert GitlabReleaseAsset to Map<string, string>
   * Maps asset names to their download URLs
   */
  convertAssetsToMap(t) {
    const n = /* @__PURE__ */ new Map();
    for (const r of t.links)
      n.set(this.normalizeFilename(r.name), r.direct_asset_url);
    return n;
  }
  /**
   * Find blockmap file URL in assets map for a specific filename
   */
  findBlockMapInAssets(t, n) {
    const r = [`${n}.blockmap`, `${this.normalizeFilename(n)}.blockmap`];
    for (const i of r) {
      const o = t.get(i);
      if (o)
        return new Zi.URL(o);
    }
    return null;
  }
  async fetchReleaseInfoByVersion(t) {
    const n = new ge.CancellationToken(), r = [`v${t}`, t];
    for (const i of r) {
      const o = (0, Pr.newUrlFromBase)(`projects/${this.options.projectId}/releases/${encodeURIComponent(i)}`, this.baseApiUrl);
      try {
        const s = { Accept: "application/json", ...this.setAuthHeaderForToken(this.options.token || null) }, a = await this.httpRequest(o, s, n);
        if (a)
          return JSON.parse(a);
      } catch (s) {
        if (s instanceof ge.HttpError && s.statusCode === 404)
          continue;
        throw (0, ge.newError)(`Unable to find release ${i} on GitLab (${o}): ${s.stack || s.message}`, "ERR_UPDATER_RELEASE_NOT_FOUND");
      }
    }
    throw (0, ge.newError)(`Unable to find release with version ${t} (tried: ${r.join(", ")}) on GitLab`, "ERR_UPDATER_RELEASE_NOT_FOUND");
  }
  setAuthHeaderForToken(t) {
    const n = {};
    return t != null && (t.startsWith("Bearer") ? n.authorization = t : n["PRIVATE-TOKEN"] = t), n;
  }
  /**
   * Get version info for blockmap files, using cache when possible
   */
  async getVersionInfoForBlockMap(t) {
    if (this.cachedLatestVersion && this.cachedLatestVersion.version === t)
      return this.cachedLatestVersion.assets;
    const n = await this.fetchReleaseInfoByVersion(t);
    return n && n.assets ? this.convertAssetsToMap(n.assets) : null;
  }
  /**
   * Find blockmap URLs from version assets
   */
  async findBlockMapUrlsFromAssets(t, n, r) {
    let i = null, o = null;
    const s = await this.getVersionInfoForBlockMap(n);
    s && (i = this.findBlockMapInAssets(s, r));
    const a = await this.getVersionInfoForBlockMap(t);
    if (a) {
      const c = r.replace(new RegExp(T_(n), "g"), t);
      o = this.findBlockMapInAssets(a, c);
    }
    return [o, i];
  }
  async getBlockMapFiles(t, n, r, i = null) {
    if (this.options.uploadTarget === "project_upload") {
      const o = t.pathname.split("/").pop() || "", [s, a] = await this.findBlockMapUrlsFromAssets(n, r, o);
      if (!a)
        throw (0, ge.newError)(`Cannot find blockmap file for ${r} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      if (!s)
        throw (0, ge.newError)(`Cannot find blockmap file for ${n} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      return [s, a];
    } else
      return super.getBlockMapFiles(t, n, r, i);
  }
  resolveFiles(t) {
    return (0, eo.getFileList)(t).map((n) => {
      const i = [
        n.url,
        // Original filename
        this.normalizeFilename(n.url)
        // Normalized filename (spaces/underscores → dashes)
      ].find((s) => t.assets.has(s)), o = i ? t.assets.get(i) : void 0;
      if (!o)
        throw (0, ge.newError)(`Cannot find asset "${n.url}" in GitLab release assets. Available assets: ${Array.from(t.assets.keys()).join(", ")}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new Zi.URL(o),
        info: n
      };
    });
  }
  toString() {
    return `GitLab (projectId: ${this.options.projectId}, channel: ${this.channel})`;
  }
}
gi.GitLabProvider = S_;
var Ei = {};
Object.defineProperty(Ei, "__esModule", { value: !0 });
Ei.KeygenProvider = void 0;
const nl = de, to = ze, no = le;
class b_ extends no.Provider {
  constructor(t, n, r) {
    super({
      ...r,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = n, this.defaultHostname = "api.keygen.sh";
    const i = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, to.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new nl.CancellationToken(), n = (0, to.getChannelFilename)(this.getCustomChannelName(this.channel)), r = (0, to.newUrlFromBase)(n, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(r, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, no.parseUpdateInfo)(i, n, r);
    } catch (i) {
      throw (0, nl.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, no.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: n, platform: r } = this.configuration;
    return `Keygen (account: ${t}, product: ${n}, platform: ${r}, channel: ${this.channel})`;
  }
}
Ei.KeygenProvider = b_;
var yi = {};
Object.defineProperty(yi, "__esModule", { value: !0 });
yi.PrivateGitHubProvider = void 0;
const zt = de, C_ = ye, $_ = Z, rl = Tt, il = ze, R_ = vt, O_ = le;
class I_ extends R_.BaseGitHubProvider {
  constructor(t, n, r, i) {
    super(t, "api.github.com", i), this.updater = n, this.token = r;
  }
  createRequestOptions(t, n) {
    const r = super.createRequestOptions(t, n);
    return r.redirect = "manual", r;
  }
  async getLatestVersion() {
    const t = new zt.CancellationToken(), n = (0, il.getChannelFilename)(this.getDefaultChannelName()), r = await this.getLatestVersionInfo(t), i = r.assets.find((a) => a.name === n);
    if (i == null)
      throw (0, zt.newError)(`Cannot find ${n} in the release ${r.html_url || r.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const o = new rl.URL(i.url);
    let s;
    try {
      s = (0, C_.load)(await this.httpRequest(o, this.configureHeaders("application/octet-stream"), t));
    } catch (a) {
      throw a instanceof zt.HttpError && a.statusCode === 404 ? (0, zt.newError)(`Cannot find ${n} in the latest release artifacts (${o}): ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : a;
    }
    return s.assets = r.assets, s;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(t) {
    return {
      accept: t,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(t) {
    const n = this.updater.allowPrerelease;
    let r = this.basePath;
    n || (r = `${r}/latest`);
    const i = (0, il.newUrlFromBase)(r, this.baseUrl);
    try {
      const o = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), t));
      if (n) {
        const s = o.filter((a) => !a.draft);
        return s.find((a) => a.prerelease) || s[0];
      } else
        return o;
    } catch (o) {
      throw (0, zt.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${o.stack || o.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, O_.getFileList)(t).map((n) => {
      const r = $_.posix.basename(n.url).replace(/ /g, "-"), i = t.assets.find((o) => o != null && o.name === r);
      if (i == null)
        throw (0, zt.newError)(`Cannot find asset "${r}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new rl.URL(i.url),
        info: n
      };
    });
  }
}
yi.PrivateGitHubProvider = I_;
Object.defineProperty(pi, "__esModule", { value: !0 });
pi.isUrlProbablySupportMultiRangeRequests = zu;
pi.createClient = L_;
const Nr = de, P_ = mi, ol = ar, N_ = vt, D_ = gi, F_ = Ei, x_ = yi;
function zu(e) {
  return !e.includes("s3.amazonaws.com");
}
function L_(e, t, n) {
  if (typeof e == "string")
    throw (0, Nr.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const r = e.provider;
  switch (r) {
    case "github": {
      const i = e, o = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
      return o == null ? new N_.GitHubProvider(i, t, n) : new x_.PrivateGitHubProvider(i, t, o, n);
    }
    case "bitbucket":
      return new P_.BitbucketProvider(e, t, n);
    case "gitlab":
      return new D_.GitLabProvider(e, t, n);
    case "keygen":
      return new F_.KeygenProvider(e, t, n);
    case "s3":
    case "spaces":
      return new ol.GenericProvider({
        provider: "generic",
        url: (0, Nr.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...n,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const i = e;
      return new ol.GenericProvider(i, t, {
        ...n,
        isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && zu(i.url)
      });
    }
    case "custom": {
      const i = e, o = i.updateProvider;
      if (!o)
        throw (0, Nr.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new o(i, t, n);
    }
    default:
      throw (0, Nr.newError)(`Unsupported provider: ${r}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var wi = {}, lr = {}, En = {}, Gt = {};
Object.defineProperty(Gt, "__esModule", { value: !0 });
Gt.OperationKind = void 0;
Gt.computeOperations = U_;
var xt;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(xt || (Gt.OperationKind = xt = {}));
function U_(e, t, n) {
  const r = al(e.files), i = al(t.files);
  let o = null;
  const s = t.files[0], a = [], c = s.name, m = r.get(c);
  if (m == null)
    throw new Error(`no file ${c} in old blockmap`);
  const l = i.get(c);
  let f = 0;
  const { checksumToOffset: h, checksumToOldSize: g } = M_(r.get(c), m.offset, n);
  let _ = s.offset;
  for (let E = 0; E < l.checksums.length; _ += l.sizes[E], E++) {
    const A = l.sizes[E], T = l.checksums[E];
    let R = h.get(T);
    R != null && g.get(T) !== A && (n.warn(`Checksum ("${T}") matches, but size differs (old: ${g.get(T)}, new: ${A})`), R = void 0), R === void 0 ? (f++, o != null && o.kind === xt.DOWNLOAD && o.end === _ ? o.end += A : (o = {
      kind: xt.DOWNLOAD,
      start: _,
      end: _ + A
      // oldBlocks: null,
    }, sl(o, a, T, E))) : o != null && o.kind === xt.COPY && o.end === R ? o.end += A : (o = {
      kind: xt.COPY,
      start: R,
      end: R + A
      // oldBlocks: [checksum]
    }, sl(o, a, T, E));
  }
  return f > 0 && n.info(`File${s.name === "file" ? "" : " " + s.name} has ${f} changed blocks`), a;
}
const k_ = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function sl(e, t, n, r) {
  if (k_ && t.length !== 0) {
    const i = t[t.length - 1];
    if (i.kind === e.kind && e.start < i.end && e.start > i.start) {
      const o = [i.start, i.end, e.start, e.end].reduce((s, a) => s < a ? s : a);
      throw new Error(`operation (block index: ${r}, checksum: ${n}, kind: ${xt[e.kind]}) overlaps previous operation (checksum: ${n}):
abs: ${i.start} until ${i.end} and ${e.start} until ${e.end}
rel: ${i.start - o} until ${i.end - o} and ${e.start - o} until ${e.end - o}`);
    }
  }
  t.push(e);
}
function M_(e, t, n) {
  const r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let o = t;
  for (let s = 0; s < e.checksums.length; s++) {
    const a = e.checksums[s], c = e.sizes[s], m = i.get(a);
    if (m === void 0)
      r.set(a, o), i.set(a, c);
    else if (n.debug != null) {
      const l = m === c ? "(same size)" : `(size: ${m}, this size: ${c})`;
      n.debug(`${a} duplicated in blockmap ${l}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    o += c;
  }
  return { checksumToOffset: r, checksumToOldSize: i };
}
function al(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    t.set(n.name, n);
  return t;
}
Object.defineProperty(En, "__esModule", { value: !0 });
En.DataSplitter = void 0;
En.copyData = Xu;
const Dr = de, B_ = At, j_ = Jn, H_ = Gt, ll = Buffer.from(`\r
\r
`);
var ht;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(ht || (ht = {}));
function Xu(e, t, n, r, i) {
  const o = (0, B_.createReadStream)("", {
    fd: n,
    autoClose: !1,
    start: e.start,
    // end is inclusive
    end: e.end - 1
  });
  o.on("error", r), o.once("end", i), o.pipe(t, {
    end: !1
  });
}
class G_ extends j_.Writable {
  constructor(t, n, r, i, o, s, a, c) {
    super(), this.out = t, this.options = n, this.partIndexToTaskIndex = r, this.partIndexToLength = o, this.finishHandler = s, this.grandTotalBytes = a, this.onProgress = c, this.start = Date.now(), this.nextUpdate = this.start + 1e3, this.transferred = 0, this.delta = 0, this.partIndex = -1, this.headerListBuffer = null, this.readState = ht.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(t, n, r) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${t.length} bytes`);
      return;
    }
    this.handleData(t).then(() => {
      if (this.onProgress) {
        const i = Date.now();
        (i >= this.nextUpdate || this.transferred === this.grandTotalBytes) && this.grandTotalBytes && (i - this.start) / 1e3 && (this.nextUpdate = i + 1e3, this.onProgress({
          total: this.grandTotalBytes,
          delta: this.delta,
          transferred: this.transferred,
          percent: this.transferred / this.grandTotalBytes * 100,
          bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
        }), this.delta = 0);
      }
      r();
    }).catch(r);
  }
  async handleData(t) {
    let n = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
      throw (0, Dr.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    if (this.ignoreByteCount > 0) {
      const r = Math.min(this.ignoreByteCount, t.length);
      this.ignoreByteCount -= r, n = r;
    } else if (this.remainingPartDataCount > 0) {
      const r = Math.min(this.remainingPartDataCount, t.length);
      this.remainingPartDataCount -= r, await this.processPartData(t, 0, r), n = r;
    }
    if (n !== t.length) {
      if (this.readState === ht.HEADER) {
        const r = this.searchHeaderListEnd(t, n);
        if (r === -1)
          return;
        n = r, this.readState = ht.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === ht.BODY)
          this.readState = ht.INIT;
        else {
          this.partIndex++;
          let s = this.partIndexToTaskIndex.get(this.partIndex);
          if (s == null)
            if (this.isFinished)
              s = this.options.end;
            else
              throw (0, Dr.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          const a = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
          if (a < s)
            await this.copyExistingData(a, s);
          else if (a > s)
            throw (0, Dr.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
          if (this.isFinished) {
            this.onPartEnd(), this.finishHandler();
            return;
          }
          if (n = this.searchHeaderListEnd(t, n), n === -1) {
            this.readState = ht.HEADER;
            return;
          }
        }
        const r = this.partIndexToLength[this.partIndex], i = n + r, o = Math.min(i, t.length);
        if (await this.processPartStarted(t, n, o), this.remainingPartDataCount = r - (o - n), this.remainingPartDataCount > 0)
          return;
        if (n = i + this.boundaryLength, n >= t.length) {
          this.ignoreByteCount = this.boundaryLength - (t.length - i);
          return;
        }
      }
    }
  }
  copyExistingData(t, n) {
    return new Promise((r, i) => {
      const o = () => {
        if (t === n) {
          r();
          return;
        }
        const s = this.options.tasks[t];
        if (s.kind !== H_.OperationKind.COPY) {
          i(new Error("Task kind must be COPY"));
          return;
        }
        Xu(s, this.out, this.options.oldFileFd, i, () => {
          t++, o();
        });
      };
      o();
    });
  }
  searchHeaderListEnd(t, n) {
    const r = t.indexOf(ll, n);
    if (r !== -1)
      return r + ll.length;
    const i = n === 0 ? t : t.slice(n);
    return this.headerListBuffer == null ? this.headerListBuffer = i : this.headerListBuffer = Buffer.concat([this.headerListBuffer, i]), -1;
  }
  onPartEnd() {
    const t = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== t)
      throw (0, Dr.newError)(`Expected length: ${t} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    this.actualPartLength = 0;
  }
  processPartStarted(t, n, r) {
    return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(t, n, r);
  }
  processPartData(t, n, r) {
    this.actualPartLength += r - n, this.transferred += r - n, this.delta += r - n;
    const i = this.out;
    return i.write(n === 0 && t.length === r ? t : t.slice(n, r)) ? Promise.resolve() : new Promise((o, s) => {
      i.on("error", s), i.once("drain", () => {
        i.removeListener("error", s), o();
      });
    });
  }
}
En.DataSplitter = G_;
var _i = {};
Object.defineProperty(_i, "__esModule", { value: !0 });
_i.executeTasksUsingMultipleRangeRequests = q_;
_i.checkIsRangesSupported = Ro;
const $o = de, cl = En, ul = Gt;
function q_(e, t, n, r, i) {
  const o = (s) => {
    if (s >= t.length) {
      e.fileMetadataBuffer != null && n.write(e.fileMetadataBuffer), n.end();
      return;
    }
    const a = s + 1e3;
    V_(e, {
      tasks: t,
      start: s,
      end: Math.min(t.length, a),
      oldFileFd: r
    }, n, () => o(a), i);
  };
  return o;
}
function V_(e, t, n, r, i) {
  let o = "bytes=", s = 0, a = 0;
  const c = /* @__PURE__ */ new Map(), m = [];
  for (let h = t.start; h < t.end; h++) {
    const g = t.tasks[h];
    g.kind === ul.OperationKind.DOWNLOAD && (o += `${g.start}-${g.end - 1}, `, c.set(s, h), s++, m.push(g.end - g.start), a += g.end - g.start);
  }
  if (s <= 1) {
    const h = (g) => {
      if (g >= t.end) {
        r();
        return;
      }
      const _ = t.tasks[g++];
      if (_.kind === ul.OperationKind.COPY)
        (0, cl.copyData)(_, n, t.oldFileFd, i, () => h(g));
      else {
        const E = e.createRequestOptions();
        E.headers.Range = `bytes=${_.start}-${_.end - 1}`;
        const A = e.httpExecutor.createRequest(E, (T) => {
          T.on("error", i), Ro(T, i) && (T.pipe(n, {
            end: !1
          }), T.once("end", () => h(g)));
        });
        e.httpExecutor.addErrorAndTimeoutHandlers(A, i), A.end();
      }
    };
    h(t.start);
    return;
  }
  const l = e.createRequestOptions();
  l.headers.Range = o.substring(0, o.length - 2);
  const f = e.httpExecutor.createRequest(l, (h) => {
    if (!Ro(h, i))
      return;
    const g = (0, $o.safeGetHeader)(h, "content-type"), _ = /^multipart\/.+?\s*;\s*boundary=(?:"([^"]+)"|([^\s";]+))\s*$/i.exec(g);
    if (_ == null) {
      i(new Error(`Content-Type "multipart/byteranges" is expected, but got "${g}"`));
      return;
    }
    const E = new cl.DataSplitter(n, t, c, _[1] || _[2], m, r, a, e.options.onProgress);
    E.on("error", i), h.pipe(E), h.on("end", () => {
      setTimeout(() => {
        f.abort(), i(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(f, i), f.end();
}
function Ro(e, t) {
  if (e.statusCode >= 400)
    return t((0, $o.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const n = (0, $o.safeGetHeader)(e, "accept-ranges");
    if (n == null || n === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var vi = {};
Object.defineProperty(vi, "__esModule", { value: !0 });
vi.ProgressDifferentialDownloadCallbackTransform = void 0;
const W_ = Jn;
var sn;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(sn || (sn = {}));
class Y_ extends W_.Transform {
  constructor(t, n, r) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = n, this.onProgress = r, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = sn.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, n, r) {
    if (this.cancellationToken.cancelled) {
      r(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == sn.COPY) {
      r(null, t);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), r(null, t);
  }
  beginFileCopy() {
    this.operationType = sn.COPY;
  }
  beginRangeDownload() {
    this.operationType = sn.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
  }
  // Called when we are 100% done with the connection/download
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, this.transferred = 0, t(null);
  }
}
vi.ProgressDifferentialDownloadCallbackTransform = Y_;
Object.defineProperty(lr, "__esModule", { value: !0 });
lr.DifferentialDownloader = void 0;
const Rn = de, ro = St, z_ = At, X_ = En, K_ = Tt, Fr = Gt, fl = _i, J_ = vi;
class Q_ {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(t, n, r) {
    this.blockAwareFileInfo = t, this.httpExecutor = n, this.options = r, this.fileMetadataBuffer = null, this.logger = r.logger;
  }
  createRequestOptions() {
    const t = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    return (0, Rn.configureRequestUrl)(this.options.newUrl, t), (0, Rn.configureRequestOptions)(t), t;
  }
  doDownload(t, n) {
    if (t.version !== n.version)
      throw new Error(`version is different (${t.version} - ${n.version}), full download is required`);
    const r = this.logger, i = (0, Fr.computeOperations)(t, n, r);
    r.debug != null && r.debug(JSON.stringify(i, null, 2));
    let o = 0, s = 0;
    for (const c of i) {
      const m = c.end - c.start;
      c.kind === Fr.OperationKind.DOWNLOAD ? o += m : s += m;
    }
    const a = this.blockAwareFileInfo.size;
    if (o + s + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== a)
      throw new Error(`Internal error, size mismatch: downloadSize: ${o}, copySize: ${s}, newSize: ${a}`);
    return r.info(`Full: ${dl(a)}, To download: ${dl(o)} (${Math.round(o / (a / 100))}%)`), this.downloadFile(i);
  }
  downloadFile(t) {
    const n = [], r = () => Promise.all(n.map((i) => (0, ro.close)(i.descriptor).catch((o) => {
      this.logger.error(`cannot close file "${i.path}": ${o}`);
    })));
    return this.doDownloadFile(t, n).then(r).catch((i) => r().catch((o) => {
      try {
        this.logger.error(`cannot close files: ${o}`);
      } catch (s) {
        try {
          console.error(s);
        } catch {
        }
      }
      throw i;
    }).then(() => {
      throw i;
    }));
  }
  async doDownloadFile(t, n) {
    const r = await (0, ro.open)(this.options.oldFile, "r");
    n.push({ descriptor: r, path: this.options.oldFile });
    const i = await (0, ro.open)(this.options.newFile, "w");
    n.push({ descriptor: i, path: this.options.newFile });
    const o = (0, z_.createWriteStream)(this.options.newFile, { fd: i });
    await new Promise((s, a) => {
      const c = [];
      let m;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const T = [];
        let R = 0;
        for (const B of t)
          B.kind === Fr.OperationKind.DOWNLOAD && (T.push(B.end - B.start), R += B.end - B.start);
        const D = {
          expectedByteCounts: T,
          grandTotal: R
        };
        m = new J_.ProgressDifferentialDownloadCallbackTransform(D, this.options.cancellationToken, this.options.onProgress), c.push(m);
      }
      const l = new Rn.DigestTransform(this.blockAwareFileInfo.sha512);
      l.isValidateOnEnd = !1, c.push(l), o.on("finish", () => {
        o.close(() => {
          n.splice(1, 1);
          try {
            l.validate();
          } catch (T) {
            a(T);
            return;
          }
          s(void 0);
        });
      }), c.push(o);
      let f = null;
      for (const T of c)
        T.on("error", a), f == null ? f = T : f = f.pipe(T);
      const h = c[0];
      let g;
      if (this.options.isUseMultipleRangeRequest) {
        g = (0, fl.executeTasksUsingMultipleRangeRequests)(this, t, h, r, a), g(0);
        return;
      }
      let _ = 0, E = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const A = this.createRequestOptions();
      A.redirect = "manual", g = (T) => {
        var R, D;
        if (T >= t.length) {
          this.fileMetadataBuffer != null && h.write(this.fileMetadataBuffer), h.end();
          return;
        }
        const B = t[T++];
        if (B.kind === Fr.OperationKind.COPY) {
          m && m.beginFileCopy(), (0, X_.copyData)(B, h, r, a, () => g(T));
          return;
        }
        const G = `bytes=${B.start}-${B.end - 1}`;
        A.headers.range = G, (D = (R = this.logger) === null || R === void 0 ? void 0 : R.debug) === null || D === void 0 || D.call(R, `download range: ${G}`), m && m.beginRangeDownload();
        const J = this.httpExecutor.createRequest(A, (Q) => {
          Q.on("error", a), Q.on("aborted", () => {
            a(new Error("response has been aborted by the server"));
          }), Q.statusCode >= 400 && a((0, Rn.createHttpError)(Q)), Q.pipe(h, {
            end: !1
          }), Q.once("end", () => {
            m && m.endRangeDownload(), ++_ === 100 ? (_ = 0, setTimeout(() => g(T), 1e3)) : g(T);
          });
        });
        J.on("redirect", (Q, oe, U) => {
          this.logger.info(`Redirect to ${Z_(U)}`), E = U, (0, Rn.configureRequestUrl)(new K_.URL(E), A), J.followRedirect();
        }), this.httpExecutor.addErrorAndTimeoutHandlers(J, a), J.end();
      }, g(0);
    });
  }
  async readRemoteBytes(t, n) {
    const r = Buffer.allocUnsafe(n + 1 - t), i = this.createRequestOptions();
    i.headers.range = `bytes=${t}-${n}`;
    let o = 0;
    if (await this.request(i, (s) => {
      s.copy(r, o), o += s.length;
    }), o !== r.length)
      throw new Error(`Received data length ${o} is not equal to expected ${r.length}`);
    return r;
  }
  request(t, n) {
    return new Promise((r, i) => {
      const o = this.httpExecutor.createRequest(t, (s) => {
        (0, fl.checkIsRangesSupported)(s, i) && (s.on("error", i), s.on("aborted", () => {
          i(new Error("response has been aborted by the server"));
        }), s.on("data", n), s.on("end", () => r()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(o, i), o.end();
    });
  }
}
lr.DifferentialDownloader = Q_;
function dl(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function Z_(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(wi, "__esModule", { value: !0 });
wi.GenericDifferentialDownloader = void 0;
const ev = lr;
class tv extends ev.DifferentialDownloader {
  download(t, n) {
    return this.doDownload(t, n);
  }
}
wi.GenericDifferentialDownloader = tv;
var bt = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = r;
  const t = de;
  Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
  class n {
    constructor(o) {
      this.emitter = o;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(o) {
      r(this.emitter, "login", o);
    }
    progress(o) {
      r(this.emitter, e.DOWNLOAD_PROGRESS, o);
    }
    updateDownloaded(o) {
      r(this.emitter, e.UPDATE_DOWNLOADED, o);
    }
    updateCancelled(o) {
      r(this.emitter, "update-cancelled", o);
    }
  }
  e.UpdaterSignal = n;
  function r(i, o, s) {
    i.on(o, s);
  }
})(bt);
Object.defineProperty(yt, "__esModule", { value: !0 });
yt.NoOpLogger = yt.AppUpdater = void 0;
const be = de, nv = Qn, rv = Qr, iv = Pl, He = St, ov = ye, io = ai, Ue = Z, Nt = Bu, hl = sr, sv = hi, pl = ju, av = ar, oo = pi, so = Dl, lv = wi, Xt = bt;
class ls extends iv.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(t) {
    if (this._channel != null) {
      if (typeof t != "string")
        throw (0, be.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, be.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
    }
    this._channel = t, this.allowDowngrade = !0;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(t) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: t
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, pl.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new Ku();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new io.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(t) {
    t && (this._isUpdateSupported = t);
  }
  /**
   * Allows developer to override default logic for determining if the user is below the rollout threshold.
   * The default logic compares the staging percentage with numerical representation of user ID.
   * An override can define custom logic, or bypass it if needed.
   */
  get isUserWithinRollout() {
    return this._isUserWithinRollout;
  }
  set isUserWithinRollout(t) {
    t && (this._isUserWithinRollout = t);
  }
  constructor(t, n) {
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this.previousBlockmapBaseUrlOverride = null, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new Xt.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (o) => this.checkIfUpdateSupported(o), this._isUserWithinRollout = (o) => this.isStagingMatch(o), this.clientPromise = null, this.stagingUserIdPromise = new io.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new io.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (o) => {
      this._logger.error(`Error: ${o.stack || o.message}`);
    }), n == null ? (this.app = new sv.ElectronAppAdapter(), this.httpExecutor = new pl.ElectronHttpExecutor((o, s) => this.emit("login", o, s))) : (this.app = n, this.httpExecutor = null);
    const r = this.app.version, i = (0, Nt.parse)(r);
    if (i == null)
      throw (0, be.newError)(`App version is not a valid semver version: "${r}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = i, this.allowPrerelease = cv(i), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](https://www.electron.build/publish#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(t) {
    const n = this.createProviderRuntimeOptions();
    let r;
    typeof t == "string" ? r = new av.GenericProvider({ provider: "generic", url: t }, this, {
      ...n,
      isUseMultipleRangeRequest: (0, oo.isUrlProbablySupportMultiRangeRequests)(t)
    }) : r = (0, oo.createClient)(t, this, n), this.clientPromise = Promise.resolve(r);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive())
      return Promise.resolve(null);
    let t = this.checkForUpdatesPromise;
    if (t != null)
      return this._logger.info("Checking for update (already in progress)"), t;
    const n = () => this.checkForUpdatesPromise = null;
    return this._logger.info("Checking for update"), t = this.doCheckForUpdates().then((r) => (n(), r)).catch((r) => {
      throw n(), this.emit("error", r, `Cannot check for updates: ${(r.stack || r).toString()}`), r;
    }), this.checkForUpdatesPromise = t, t;
  }
  isUpdaterActive() {
    return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(t) {
    return this.checkForUpdates().then((n) => n != null && n.downloadPromise ? (n.downloadPromise.then(() => {
      const r = ls.formatDownloadNotification(n.updateInfo.version, this.app.name, t);
      new Ut.Notification(r).show();
    }), n) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), n));
  }
  static formatDownloadNotification(t, n, r) {
    return r == null && (r = {
      title: "A new update is ready to install",
      body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
    }), r = {
      title: r.title.replace("{appName}", n).replace("{version}", t),
      body: r.body.replace("{appName}", n).replace("{version}", t)
    }, r;
  }
  async isStagingMatch(t) {
    const n = t.stagingPercentage;
    let r = n;
    if (r == null)
      return !0;
    if (r = parseInt(r, 10), isNaN(r))
      return this._logger.warn(`Staging percentage is NaN: ${n}`), !0;
    r = r / 100;
    const i = await this.stagingUserIdPromise.value, s = be.UUID.parse(i).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${r}, percentage: ${s}, user id: ${i}`), s < r;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const n = (0, Nt.parse)(t.version);
    if (n == null)
      throw (0, be.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const r = this.currentVersion;
    if ((0, Nt.eq)(n, r) || !await Promise.resolve(this.isUpdateSupported(t)) || !await Promise.resolve(this.isUserWithinRollout(t)))
      return !1;
    const o = (0, Nt.gt)(n, r), s = (0, Nt.lt)(n, r);
    return o ? !0 : this.allowDowngrade && s;
  }
  checkIfUpdateSupported(t) {
    const n = t == null ? void 0 : t.minimumSystemVersion, r = (0, rv.release)();
    if (n)
      try {
        if ((0, Nt.lt)(r, n))
          return this._logger.info(`Current OS version ${r} is less than the minimum OS version required ${n} for version ${r}`), !1;
      } catch (i) {
        this._logger.warn(`Failed to compare current OS version(${r}) with minimum OS version(${n}): ${(i.message || i).toString()}`);
      }
    return !0;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((r) => (0, oo.createClient)(r, this, this.createProviderRuntimeOptions())));
    const t = await this.clientPromise, n = await this.stagingUserIdPromise.value;
    return t.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": n })), {
      info: await t.getLatestVersion(),
      provider: t
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: !0,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const t = await this.getUpdateInfoAndProvider(), n = t.info;
    if (!await this.isUpdateAvailable(n))
      return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${n.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", n), {
        isUpdateAvailable: !1,
        versionInfo: n,
        updateInfo: n
      };
    this.updateInfoAndProvider = t, this.onUpdateAvailable(n);
    const r = new be.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: n,
      updateInfo: n,
      cancellationToken: r,
      downloadPromise: this.autoDownload ? this.downloadUpdate(r) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, be.asArray)(t.files).map((n) => n.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new be.CancellationToken()) {
    const n = this.updateInfoAndProvider;
    if (n == null) {
      const i = new Error("Please check update first");
      return this.dispatchError(i), Promise.reject(i);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, be.asArray)(n.info.files).map((i) => i.url).join(", ")}`);
    const r = (i) => {
      if (!(i instanceof be.CancellationError))
        try {
          this.dispatchError(i);
        } catch (o) {
          this._logger.warn(`Cannot dispatch error event: ${o.stack || o}`);
        }
      return i;
    };
    return this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider: n,
      requestHeaders: this.computeRequestHeaders(n.provider),
      cancellationToken: t,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((i) => {
      throw r(i);
    }).finally(() => {
      this.downloadPromise = null;
    }), this.downloadPromise;
  }
  dispatchError(t) {
    this.emit("error", t, (t.stack || t).toString());
  }
  dispatchUpdateDownloaded(t) {
    this.emit(Xt.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, ov.load)(await (0, He.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(t) {
    const n = t.fileExtraDownloadHeaders;
    if (n != null) {
      const r = this.requestHeaders;
      return r == null ? n : {
        ...n,
        ...r
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const t = Ue.join(this.app.userDataPath, ".updaterId");
    try {
      const r = await (0, He.readFile)(t, "utf-8");
      if (be.UUID.check(r))
        return r;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${r}`);
    } catch (r) {
      r.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${r}`);
    }
    const n = be.UUID.v5((0, nv.randomBytes)(4096), be.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${n}`);
    try {
      await (0, He.outputFile)(t, n);
    } catch (r) {
      this._logger.warn(`Couldn't write out staging user ID: ${r}`);
    }
    return n;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const t = this.requestHeaders;
    if (t == null)
      return !0;
    for (const n of Object.keys(t)) {
      const r = n.toLowerCase();
      if (r === "authorization" || r === "private-token")
        return !1;
    }
    return !0;
  }
  async getOrCreateDownloadHelper() {
    let t = this.downloadedUpdateHelper;
    if (t == null) {
      const n = (await this.configOnDisk.value).updaterCacheDirName, r = this._logger;
      n == null && r.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      const i = Ue.join(this.app.baseCachePath, n || this.app.name);
      r.debug != null && r.debug(`updater cache dir: ${i}`), t = new hl.DownloadedUpdateHelper(i), this.downloadedUpdateHelper = t;
    }
    return t;
  }
  async executeDownload(t) {
    const n = t.fileInfo, r = {
      headers: t.downloadUpdateOptions.requestHeaders,
      cancellationToken: t.downloadUpdateOptions.cancellationToken,
      sha2: n.info.sha2,
      sha512: n.info.sha512
    };
    this.listenerCount(Xt.DOWNLOAD_PROGRESS) > 0 && (r.onProgress = (R) => this.emit(Xt.DOWNLOAD_PROGRESS, R));
    const i = t.downloadUpdateOptions.updateInfoAndProvider.info, o = i.version, s = n.packageInfo;
    function a() {
      const R = decodeURIComponent(t.fileInfo.url.pathname);
      return R.toLowerCase().endsWith(`.${t.fileExtension.toLowerCase()}`) ? Ue.basename(R) : Ue.basename(t.fileInfo.info.url);
    }
    const c = await this.getOrCreateDownloadHelper(), m = c.cacheDirForPendingUpdate;
    await (0, He.mkdir)(m, { recursive: !0 });
    const l = a();
    let f = Ue.join(m, l);
    const h = s == null ? null : Ue.join(m, `package-${o}${Ue.extname(s.path) || ".7z"}`), g = async (R) => {
      await c.setDownloadedFile(f, h, i, n, l, R), await t.done({
        ...i,
        downloadedFile: f
      });
      const D = Ue.join(m, "current.blockmap");
      return await (0, He.pathExists)(D) && await (0, He.copyFile)(D, Ue.join(c.cacheDir, "current.blockmap")), h == null ? [f] : [f, h];
    }, _ = this._logger, E = await c.validateDownloadedPath(f, i, n, _);
    if (E != null)
      return f = E, await g(!1);
    const A = async () => (await c.clear().catch(() => {
    }), await (0, He.unlink)(f).catch(() => {
    })), T = await (0, hl.createTempUpdateFile)(`temp-${l}`, m, _);
    try {
      await t.task(T, r, h, A), await (0, be.retry)(() => (0, He.rename)(T, f), {
        retries: 60,
        interval: 500,
        shouldRetry: (R) => R instanceof Error && /^EBUSY:/.test(R.message) ? !0 : (_.warn(`Cannot rename temp file to final file: ${R.message || R.stack}`), !1)
      });
    } catch (R) {
      throw await A(), R instanceof be.CancellationError && (_.info("cancelled"), this.emit("update-cancelled", i)), R;
    }
    return _.info(`New version ${o} has been downloaded to ${f}`), await g(!0);
  }
  async differentialDownloadInstaller(t, n, r, i, o) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const s = n.updateInfoAndProvider.provider, a = await s.getBlockMapFiles(t.url, this.app.version, n.updateInfoAndProvider.info.version, this.previousBlockmapBaseUrlOverride);
      this._logger.info(`Download block maps (old: "${a[0]}", new: ${a[1]})`);
      const c = async (_) => {
        const E = await this.httpExecutor.downloadToBuffer(_, {
          headers: n.requestHeaders,
          cancellationToken: n.cancellationToken
        });
        if (E == null || E.length === 0)
          throw new Error(`Blockmap "${_.href}" is empty`);
        try {
          return JSON.parse((0, so.gunzipSync)(E).toString());
        } catch (A) {
          throw new Error(`Cannot parse blockmap "${_.href}", error: ${A}`);
        }
      }, m = {
        newUrl: t.url,
        oldFile: Ue.join(this.downloadedUpdateHelper.cacheDir, o),
        logger: this._logger,
        newFile: r,
        isUseMultipleRangeRequest: s.isUseMultipleRangeRequest,
        requestHeaders: n.requestHeaders,
        cancellationToken: n.cancellationToken
      };
      this.listenerCount(Xt.DOWNLOAD_PROGRESS) > 0 && (m.onProgress = (_) => this.emit(Xt.DOWNLOAD_PROGRESS, _));
      const l = async (_, E) => {
        const A = Ue.join(E, "current.blockmap");
        await (0, He.outputFile)(A, (0, so.gzipSync)(JSON.stringify(_)));
      }, f = async (_) => {
        const E = Ue.join(_, "current.blockmap");
        try {
          if (await (0, He.pathExists)(E))
            return JSON.parse((0, so.gunzipSync)(await (0, He.readFile)(E)).toString());
        } catch (A) {
          this._logger.warn(`Cannot parse blockmap "${E}", error: ${A}`);
        }
        return null;
      }, h = await c(a[1]);
      await l(h, this.downloadedUpdateHelper.cacheDirForPendingUpdate);
      let g = await f(this.downloadedUpdateHelper.cacheDir);
      return g == null && (g = await c(a[0])), await new lv.GenericDifferentialDownloader(t.info, this.httpExecutor, m).download(g, h), !1;
    } catch (s) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), this._testOnlyOptions != null)
        throw s;
      return !0;
    }
  }
}
yt.AppUpdater = ls;
function cv(e) {
  const t = (0, Nt.prerelease)(e);
  return t != null && t.length > 0;
}
class Ku {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(t) {
  }
}
yt.NoOpLogger = Ku;
Object.defineProperty(jt, "__esModule", { value: !0 });
jt.BaseUpdater = void 0;
const ml = Jr, ao = Z, uv = yt;
class fv extends uv.AppUpdater {
  constructor(t, n) {
    super(t, n), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, n = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? n : this.autoRunAppAfterInstall) ? setImmediate(() => {
      Ut.autoUpdater.emit("before-quit-for-update"), this.app.quit();
    }) : this.quitAndInstallCalled = !1;
  }
  executeDownload(t) {
    return super.executeDownload({
      ...t,
      done: (n) => (this.dispatchUpdateDownloaded(n), this.addQuitHandler(), Promise.resolve())
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(t = !1, n = !1) {
    if (this.quitAndInstallCalled)
      return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
    const r = this.downloadedUpdateHelper, i = this.installerPath, o = r == null ? null : r.downloadedFileInfo;
    if (i == null || o == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    this.quitAndInstallCalled = !0;
    try {
      return this._logger.info(`Install: isSilent: ${t}, isForceRunAfter: ${n}`), this.doInstall({
        isSilent: t,
        isForceRunAfter: n,
        isAdminRightsRequired: o.isAdminRightsRequired
      });
    } catch (s) {
      return this.dispatchError(s), !1;
    }
  }
  addQuitHandler() {
    this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((t) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (t !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${t}`);
        return;
      }
      this._logger.info("Auto install update on quit"), this.install(!0, !1);
    }));
  }
  /**
   * Strips relative-path entries from a PATH string.
   * Prevents PATH-poisoning where a writable directory earlier in PATH shadows
   * a trusted package manager binary.
   */
  sanitizeEnvPath(t) {
    return t.split(ao.delimiter).filter((n) => ao.isAbsolute(n)).join(ao.delimiter);
  }
  spawnSyncLog(t, n = [], r = {}) {
    var i;
    this._logger.info(`Executing: ${t} with args: ${n}`);
    const o = { ...process.env, ...r }, s = (0, ml.spawnSync)(t, n, {
      env: { ...o, PATH: this.sanitizeEnvPath((i = o.PATH) !== null && i !== void 0 ? i : "") },
      encoding: "utf-8",
      shell: !0
    }), { error: a, status: c, stdout: m, stderr: l } = s;
    if (a != null)
      throw this._logger.error(l), a;
    if (c != null && c !== 0)
      throw this._logger.error(l), new Error(`Command ${t} exited with code ${c}`);
    return m.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(t, n = [], r = void 0, i = "ignore") {
    return this._logger.info(`Executing: ${t} with args: ${n}`), new Promise((o, s) => {
      try {
        const a = { stdio: i, env: r, detached: !0 }, c = (0, ml.spawn)(t, n, a);
        c.on("error", (m) => {
          s(m);
        }), c.unref(), c.pid !== void 0 && o(!0);
      } catch (a) {
        s(a);
      }
    });
  }
}
jt.BaseUpdater = fv;
var Vn = {}, cr = {};
Object.defineProperty(cr, "__esModule", { value: !0 });
cr.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const Kt = St, dv = lr, hv = Dl;
class pv extends dv.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, n = t.size, r = n - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(r, n - 1);
    const i = Ju(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await mv(this.options.oldFile), i);
  }
}
cr.FileWithEmbeddedBlockMapDifferentialDownloader = pv;
function Ju(e) {
  return JSON.parse((0, hv.inflateRawSync)(e).toString());
}
async function mv(e) {
  const t = await (0, Kt.open)(e, "r");
  try {
    const n = (await (0, Kt.fstat)(t)).size, r = Buffer.allocUnsafe(4);
    await (0, Kt.read)(t, r, 0, r.length, n - r.length);
    const i = Buffer.allocUnsafe(r.readUInt32BE(0));
    return await (0, Kt.read)(t, i, 0, i.length, n - r.length - i.length), await (0, Kt.close)(t), Ju(i);
  } catch (n) {
    throw await (0, Kt.close)(t), n;
  }
}
Object.defineProperty(Vn, "__esModule", { value: !0 });
Vn.AppImageUpdater = void 0;
const lo = de, gl = Jr, gv = St, Ev = At, Jt = Z, yv = jt, wv = cr, _v = le, El = bt;
class vv extends yv.BaseUpdater {
  constructor(t, n) {
    super(t, n);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null && !this.forceDevUpdateConfig ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, _v.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        const s = process.env.APPIMAGE;
        if (s == null)
          throw (0, lo.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(r, s, i, n, t)) && await this.httpExecutor.download(r.url, i, o), await (0, gv.chmod)(i, 493);
      }
    });
  }
  async downloadDifferential(t, n, r, i, o) {
    try {
      const s = {
        newUrl: t.url,
        oldFile: n,
        logger: this._logger,
        newFile: r,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: o.requestHeaders,
        cancellationToken: o.cancellationToken
      };
      return this.listenerCount(El.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(El.DOWNLOAD_PROGRESS, a)), await new wv.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, s).download(), !1;
    } catch (s) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const n = process.env.APPIMAGE;
    if (n == null)
      throw (0, lo.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    if (!Jt.isAbsolute(n) || n.includes("\0"))
      throw (0, lo.newError)(`APPIMAGE env is not a valid absolute path: "${n}"`, "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, Ev.unlinkSync)(n);
    let r;
    const i = Jt.basename(n), o = this.installerPath;
    if (o == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    Jt.basename(o) === i || !/\d+\.\d+\.\d+/.test(i) ? r = n : r = Jt.join(Jt.dirname(n), Jt.basename(o)), (0, gl.execFileSync)("mv", ["-f", o, r]), r !== n && this.emit("appimage-filename-updated", r);
    const s = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(r, [], s) : (s.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, gl.execFileSync)(r, [], { env: s })), !0;
  }
}
Vn.AppImageUpdater = vv;
var Wn = {}, yn = {};
Object.defineProperty(yn, "__esModule", { value: !0 });
yn.LinuxUpdater = void 0;
const Av = jt, Tv = /^[a-zA-Z0-9_-]+$/;
class Sv extends Av.BaseUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /**
   * Returns true if the current process is running as root.
   */
  isRunningAsRoot() {
    var t;
    return ((t = process.getuid) === null || t === void 0 ? void 0 : t.call(process)) === 0;
  }
  /**
   * Sanitizes the installer path for use with shell:true spawn calls.
   * Backslash-escapes metacharacters that have special meaning in POSIX shell.
   * Note: paths containing single-quotes (') are not supported.
   */
  get installerPath() {
    const t = super.installerPath;
    return t == null ? null : t.replace(/\\/g, "\\\\").replace(/([`$!" ;|&()<>])/g, "\\$1").replace(/[\n\r]/g, "");
  }
  runCommandWithSudoIfNeeded(t) {
    if (this.isRunningAsRoot())
      return this._logger.info("Running as root, no need to use sudo"), this.spawnSyncLog(t[0], t.slice(1));
    const { name: n } = this.app, i = `"${n.replace(/["`$\\!\n\r;|&<>(){}*?[\]#~]/g, "")} would like to update"`, o = this.sudoWithArgs(i);
    this._logger.info(`Running as non-root user, using sudo to install: ${o}`);
    let s = '"';
    return (/pkexec/i.test(o[0]) || o[0] === "sudo") && (s = ""), this.spawnSyncLog(o[0], [...o.length > 1 ? o.slice(1) : [], `${s}/bin/bash`, "-c", `'${t.join(" ")}'${s}`]);
  }
  sudoWithArgs(t) {
    const n = this.determineSudoCommand(), r = [n];
    return /kdesudo/i.test(n) ? (r.push("--comment", t), r.push("-c")) : /gksudo/i.test(n) ? r.push("--message", t) : /pkexec/i.test(n) && r.push("--disable-internal-agent"), r;
  }
  hasCommand(t) {
    try {
      return this.spawnSyncLog("command", ["-v", t]), !0;
    } catch {
      return !1;
    }
  }
  determineSudoCommand() {
    const t = ["gksudo", "kdesudo", "pkexec", "beesu"];
    for (const n of t)
      if (this.hasCommand(n))
        return n;
    return "sudo";
  }
  /**
   * Detects the package manager to use based on the available commands.
   * Allows overriding the default behavior by setting the ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER environment variable.
   * If the environment variable is set, it will be used directly. (This is useful for testing each package manager logic path.)
   * Otherwise, it checks for the presence of the specified package manager commands in the order provided.
   * @param pms - An array of package manager commands to check for, in priority order.
   * @returns The detected package manager command or "unknown" if none are found.
   */
  detectPackageManager(t) {
    var n;
    let r = t;
    const i = (n = process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER) === null || n === void 0 ? void 0 : n.trim();
    i && (Tv.test(i) ? r = [i] : this._logger.warn(`ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER "${i}" contains unsafe characters. Ignoring override.`));
    for (const a of r)
      if (this.hasCommand(a))
        return a;
    const o = i ? `ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER override "${i}", ` : "", s = t[0];
    return this._logger.warn(`No package manager found in the list: ${o}${t.join(", ")}. Utilizing default: ${s}`), s;
  }
}
yn.LinuxUpdater = Sv;
Object.defineProperty(Wn, "__esModule", { value: !0 });
Wn.DebUpdater = void 0;
const bv = le, yl = bt, Cv = yn;
class cs extends Cv.LinuxUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, bv.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(yl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(yl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(r.url, i, o);
      }
    });
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    if (!this.hasCommand("dpkg") && !this.hasCommand("apt"))
      return this.dispatchError(new Error("Neither dpkg nor apt command found. Cannot install .deb package.")), !1;
    const r = ["dpkg", "apt"], i = this.detectPackageManager(r);
    try {
      cs.installWithCommandRunner(i, n, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (o) {
      return this.dispatchError(o), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, n, r, i) {
    var o;
    if (t === "dpkg")
      try {
        r(["dpkg", "-i", n]);
      } catch (s) {
        i.warn((o = s.message) !== null && o !== void 0 ? o : s), i.warn("dpkg installation failed, trying to fix broken dependencies with apt-get"), r(["apt-get", "install", "-f", "-y"]);
      }
    else if (t === "apt")
      i.warn("Using apt to install a local .deb. This may fail for unsigned packages unless properly configured."), r([
        "apt",
        "install",
        "-y",
        "--allow-unauthenticated",
        // needed for unsigned .debs
        "--allow-downgrades",
        // allow lower version installs
        "--allow-change-held-packages",
        n
      ]);
    else
      throw new Error(`Package manager ${t} not supported`);
  }
}
Wn.DebUpdater = cs;
var Yn = {};
Object.defineProperty(Yn, "__esModule", { value: !0 });
Yn.PacmanUpdater = void 0;
const wl = bt, $v = le, Rv = yn;
class us extends Rv.LinuxUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, $v.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(wl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(wl.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(r.url, i, o);
      }
    });
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    try {
      us.installWithCommandRunner(n, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (r) {
      return this.dispatchError(r), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, n, r) {
    var i;
    try {
      n(["pacman", "-U", "--noconfirm", t]);
    } catch (o) {
      r.warn((i = o.message) !== null && i !== void 0 ? i : o), r.warn("pacman installation failed, attempting to update package database and retry");
      try {
        n(["pacman", "-Sy", "--noconfirm"]), n(["pacman", "-U", "--noconfirm", t]);
      } catch (s) {
        throw r.error("Retry after pacman -Sy failed"), s;
      }
    }
  }
}
Yn.PacmanUpdater = us;
var zn = {};
Object.defineProperty(zn, "__esModule", { value: !0 });
zn.RpmUpdater = void 0;
const _l = bt, Ov = le, Iv = yn;
class fs extends Iv.LinuxUpdater {
  constructor(t, n) {
    super(t, n);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, Ov.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: r,
      downloadUpdateOptions: t,
      task: async (i, o) => {
        this.listenerCount(_l.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(_l.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(r.url, i, o);
      }
    });
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const r = ["zypper", "dnf", "yum", "rpm"], i = this.detectPackageManager(r);
    try {
      fs.installWithCommandRunner(i, n, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (o) {
      return this.dispatchError(o), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, n, r, i) {
    if (t === "zypper")
      return r(["zypper", "--non-interactive", "--no-refresh", "install", "--allow-unsigned-rpm", "-f", n]);
    if (t === "dnf")
      return r(["dnf", "install", "--nogpgcheck", "-y", n]);
    if (t === "yum")
      return r(["yum", "install", "--nogpgcheck", "-y", n]);
    if (t === "rpm")
      return i.warn("Installing with rpm only (no dependency resolution)."), r(["rpm", "-Uvh", "--replacepkgs", "--replacefiles", "--nodeps", n]);
    throw new Error(`Package manager ${t} not supported`);
  }
}
zn.RpmUpdater = fs;
var Xn = {};
Object.defineProperty(Xn, "__esModule", { value: !0 });
Xn.MacUpdater = void 0;
const vl = de, co = St, Pv = At, Al = Z, Nv = ld, Dv = yt, Fv = le, Tl = Jr, Sl = Qn;
class ds extends Dv.AppUpdater {
  constructor(t, n) {
    super(t, n), this.nativeUpdater = Ut.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (r) => {
      this._logger.warn(r), this.emit("error", r);
    }), this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
    });
  }
  /** Filters update files to the appropriate architecture.
   * On arm64 Macs (including Rosetta), arm64 files are preferred when available.
   * On x64 Macs, arm64 files are excluded. */
  static filterFilesForArch(t, n) {
    const r = (i) => {
      var o;
      return i.url.pathname.includes("arm64") || ((o = i.info.url) === null || o === void 0 ? void 0 : o.includes("arm64"));
    };
    return n && t.some(r) ? t.filter((i) => n === r(i)) : t.filter((i) => !r(i));
  }
  debug(t) {
    this._logger.debug != null && this._logger.debug(t);
  }
  closeServerIfExists() {
    this.server && (this.debug("Closing proxy server"), this.server.close((t) => {
      t && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
    }));
  }
  async doDownloadUpdate(t) {
    let n = t.updateInfoAndProvider.provider.resolveFiles(t.updateInfoAndProvider.info);
    const r = this._logger, i = "sysctl.proc_translated";
    let o = !1;
    try {
      this.debug("Checking for macOS Rosetta environment"), o = (0, Tl.execFileSync)("sysctl", [i], { encoding: "utf8" }).includes(`${i}: 1`), r.info(`Checked for macOS Rosetta environment (isRosetta=${o})`);
    } catch (l) {
      r.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${l}`);
    }
    let s = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const f = (0, Tl.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
      r.info(`Checked 'uname -a': arm64=${f}`), s = s || f;
    } catch (l) {
      r.warn(`uname shell command to check for arm64 failed: ${l}`);
    }
    s = s || process.arch === "arm64" || o, n = ds.filterFilesForArch(n, s);
    const a = (0, Fv.findFile)(n, "zip", ["pkg", "dmg"]);
    if (a == null)
      throw (0, vl.newError)(`ZIP file not provided: ${(0, vl.safeStringifyJson)(n)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const c = t.updateInfoAndProvider.provider, m = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: a,
      downloadUpdateOptions: t,
      task: async (l, f) => {
        const h = Al.join(this.downloadedUpdateHelper.cacheDir, m), g = () => (0, co.pathExistsSync)(h) ? !t.disableDifferentialDownload : (r.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let _ = !0;
        g() && (_ = await this.differentialDownloadInstaller(a, t, l, c, m)), _ && await this.httpExecutor.download(a.url, l, f);
      },
      done: async (l) => {
        if (!t.disableDifferentialDownload)
          try {
            const f = Al.join(this.downloadedUpdateHelper.cacheDir, m);
            await (0, co.copyFile)(l.downloadedFile, f);
          } catch (f) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${f.message}`);
          }
        return this.updateDownloaded(a, l);
      }
    });
  }
  async updateDownloaded(t, n) {
    var r;
    const i = n.downloadedFile, o = (r = t.info.size) !== null && r !== void 0 ? r : (await (0, co.stat)(i)).size, s = this._logger, a = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${a})`), this.server = (0, Nv.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${a})`), this.server.on("close", () => {
      s.info(`Proxy server for native Squirrel.Mac is closed (${a})`);
    });
    const c = (m) => {
      const l = m.address();
      return typeof l == "string" ? l : `http://127.0.0.1:${l == null ? void 0 : l.port}`;
    };
    return await new Promise((m, l) => {
      const f = (0, Sl.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), h = Buffer.from(`autoupdater:${f}`, "ascii"), g = `/${(0, Sl.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (_, E) => {
        const A = _.url;
        if (s.info(`${A} requested`), A === "/") {
          if (!_.headers.authorization || _.headers.authorization.indexOf("Basic ") === -1) {
            E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), s.warn("No authenthication info");
            return;
          }
          const D = _.headers.authorization.split(" ")[1], B = Buffer.from(D, "base64").toString("ascii"), [G, J] = B.split(":");
          if (G !== "autoupdater" || J !== f) {
            E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), s.warn("Invalid authenthication credentials");
            return;
          }
          const Q = Buffer.from(`{ "url": "${c(this.server)}${g}" }`);
          E.writeHead(200, { "Content-Type": "application/json", "Content-Length": Q.length }), E.end(Q);
          return;
        }
        if (!A.startsWith(g)) {
          s.warn(`${A} requested, but not supported`), E.writeHead(404), E.end();
          return;
        }
        s.info(`${g} requested by Squirrel.Mac, pipe ${i}`);
        let T = !1;
        E.on("finish", () => {
          T || (this.nativeUpdater.removeListener("error", l), m([]));
        });
        const R = (0, Pv.createReadStream)(i);
        R.on("error", (D) => {
          try {
            E.end();
          } catch (B) {
            s.warn(`cannot end response: ${B}`);
          }
          T = !0, this.nativeUpdater.removeListener("error", l), l(new Error(`Cannot pipe "${i}": ${D}`));
        }), E.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": o
        }), R.pipe(E);
      }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${a})`), this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${c(this.server)}, ${a})`), this.nativeUpdater.setFeedURL({
          url: c(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${h.toString("base64")}`
          }
        }), this.dispatchUpdateDownloaded(n), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", l), this.nativeUpdater.checkForUpdates()) : m([]);
      });
    });
  }
  handleUpdateDownloaded() {
    this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
  }
  quitAndInstall() {
    this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
  }
}
Xn.MacUpdater = ds;
var Kn = {}, hs = {};
Object.defineProperty(hs, "__esModule", { value: !0 });
hs.verifySignature = Lv;
const bl = de, Qu = Jr, xv = Qr, Cl = Z;
function Zu(e, t) {
  return ['set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", e], {
    shell: !0,
    timeout: t
  }];
}
function Lv(e, t, n) {
  return new Promise((r, i) => {
    const o = t.replace(/'/g, "''");
    n.info(`Verifying signature ${o}`), (0, Qu.execFile)(...Zu(`"Get-AuthenticodeSignature -LiteralPath '${o}' | ConvertTo-Json -Compress"`, 20 * 1e3), (s, a, c) => {
      var m;
      try {
        if (s != null || c) {
          uo(n, s, c, i), r(null);
          return;
        }
        const l = Uv(a);
        if (l.Status === 0) {
          try {
            const _ = Cl.normalize(l.Path), E = Cl.normalize(t);
            if (n.info(`LiteralPath: ${_}. Update Path: ${E}`), _ !== E) {
              uo(n, new Error(`LiteralPath of ${_} is different than ${E}`), c, i), r(null);
              return;
            }
          } catch (_) {
            n.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(m = _.message) !== null && m !== void 0 ? m : _.stack}`);
          }
          const h = (0, bl.parseDn)(l.SignerCertificate.Subject);
          let g = !1;
          for (const _ of e) {
            const E = (0, bl.parseDn)(_);
            if (E.size ? g = Array.from(E.keys()).every((T) => E.get(T) === h.get(T)) : _ === h.get("CN") && (n.warn(`Signature validated using only CN ${_}. Please add your full Distinguished Name (DN) to publisherNames configuration`), g = !0), g) {
              r(null);
              return;
            }
          }
        }
        const f = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(l, (h, g) => h === "RawData" ? void 0 : g, 2);
        n.warn(`Sign verification failed, installer signed with incorrect certificate: ${f}`), r(f);
      } catch (l) {
        uo(n, l, null, i), r(null);
        return;
      }
    });
  });
}
function Uv(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const n = t.SignerCertificate;
  return n != null && (delete n.Archived, delete n.Extensions, delete n.Handle, delete n.HasPrivateKey, delete n.SubjectName), t;
}
function uo(e, t, n, r) {
  if (kv()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || n}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, Qu.execFileSync)(...Zu("ConvertTo-Json test", 10 * 1e3));
  } catch (i) {
    e.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && r(t), n && r(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${n}. Failing signature validation due to unknown stderr.`));
}
function kv() {
  const e = xv.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(Kn, "__esModule", { value: !0 });
Kn.NsisUpdater = void 0;
const xr = de, $l = Z, Mv = jt, Bv = cr, Rl = bt, jv = le, Hv = St, Gv = hs, Ol = Tt;
class qv extends Mv.BaseUpdater {
  constructor(t, n) {
    super(t, n), this._verifyUpdateCodeSignature = (r, i) => (0, Gv.verifySignature)(r, i, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(t) {
    t && (this._verifyUpdateCodeSignature = t);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const n = t.updateInfoAndProvider.provider, r = (0, jv.findFile)(n.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: r,
      task: async (i, o, s, a) => {
        const c = r.packageInfo, m = c != null && s != null;
        if (m && t.disableWebInstaller)
          throw (0, xr.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !m && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (m || t.disableDifferentialDownload || await this.differentialDownloadInstaller(r, t, i, n, xr.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(r.url, i, o);
        const l = await this.verifySignature(i);
        if (l != null)
          throw await a(), (0, xr.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${l}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (m && await this.differentialDownloadWebPackage(t, c, s, n))
          try {
            await this.httpExecutor.download(new Ol.URL(c.path), s, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: c.sha512
            });
          } catch (f) {
            try {
              await (0, Hv.unlink)(s);
            } catch {
            }
            throw f;
          }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(t) {
    let n;
    try {
      if (n = (await this.configOnDisk.value).publisherName, n == null)
        return null;
    } catch (r) {
      if (r.code === "ENOENT")
        return null;
      throw r;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(n) ? n : [n], t);
  }
  doInstall(t) {
    const n = this.installerPath;
    if (n == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const r = ["--updated"];
    t.isSilent && r.push("/S"), t.isForceRunAfter && r.push("--force-run"), this.installDirectory && r.push(`/D=${this.installDirectory}`);
    const i = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    i != null && r.push(`--package-file=${i}`);
    const o = () => {
      this.spawnLog($l.join(process.resourcesPath, "elevate.exe"), [n].concat(r)).catch((s) => this.dispatchError(s));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), o(), !0) : (this.spawnLog(n, r).catch((s) => {
      const a = s.code;
      this._logger.info(`Cannot run installer: error code: ${a}, error message: "${s.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), a === "UNKNOWN" || a === "EACCES" ? o() : a === "ENOENT" ? Ut.shell.openPath(n).catch((c) => this.dispatchError(c)) : this.dispatchError(s);
    }), !0);
  }
  async differentialDownloadWebPackage(t, n, r, i) {
    if (n.blockMapSize == null)
      return !0;
    try {
      const o = {
        newUrl: new Ol.URL(n.path),
        oldFile: $l.join(this.downloadedUpdateHelper.cacheDir, xr.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: r,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(Rl.DOWNLOAD_PROGRESS) > 0 && (o.onProgress = (s) => this.emit(Rl.DOWNLOAD_PROGRESS, s)), await new Bv.FileWithEmbeddedBlockMapDifferentialDownloader(n, this.httpExecutor, o).download();
    } catch (o) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${o.stack || o}`), process.platform === "win32";
    }
    return !1;
  }
}
Kn.NsisUpdater = qv;
(function(e) {
  var t = Ce && Ce.__createBinding || (Object.create ? function(A, T, R, D) {
    D === void 0 && (D = R);
    var B = Object.getOwnPropertyDescriptor(T, R);
    (!B || ("get" in B ? !T.__esModule : B.writable || B.configurable)) && (B = { enumerable: !0, get: function() {
      return T[R];
    } }), Object.defineProperty(A, D, B);
  } : function(A, T, R, D) {
    D === void 0 && (D = R), A[D] = T[R];
  }), n = Ce && Ce.__exportStar || function(A, T) {
    for (var R in A) R !== "default" && !Object.prototype.hasOwnProperty.call(T, R) && t(T, A, R);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const r = St, i = Z;
  var o = jt;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return o.BaseUpdater;
  } });
  var s = yt;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return s.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return s.NoOpLogger;
  } });
  var a = le;
  Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
    return a.Provider;
  } });
  var c = Vn;
  Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
    return c.AppImageUpdater;
  } });
  var m = Wn;
  Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
    return m.DebUpdater;
  } });
  var l = Yn;
  Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
    return l.PacmanUpdater;
  } });
  var f = zn;
  Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
    return f.RpmUpdater;
  } });
  var h = Xn;
  Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
    return h.MacUpdater;
  } });
  var g = Kn;
  Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
    return g.NsisUpdater;
  } }), n(bt, e);
  let _;
  function E() {
    if (process.platform === "win32")
      _ = new Kn.NsisUpdater();
    else if (process.platform === "darwin")
      _ = new Xn.MacUpdater();
    else {
      _ = new Vn.AppImageUpdater();
      try {
        const A = i.join(process.resourcesPath, "package-type");
        if (!(0, r.existsSync)(A))
          return _;
        switch ((0, r.readFileSync)(A).toString().trim()) {
          case "deb":
            _ = new Wn.DebUpdater();
            break;
          case "rpm":
            _ = new zn.RpmUpdater();
            break;
          case "pacman":
            _ = new Yn.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (A) {
        console.warn("Unable to detect 'package-type' for autoUpdater (rpm/deb/pacman support). If you'd like to expand support, please consider contributing to electron-builder", A.message);
      }
    }
    return _;
  }
  Object.defineProperty(e, "autoUpdater", {
    enumerable: !0,
    get: () => _ || E()
  });
})(Fl);
const Vv = /* @__PURE__ */ fd(Fl), { autoUpdater: Qt } = Vv, Wv = 1500;
function Yv(e) {
  let t = { phase: "none" }, n = null;
  const r = (i) => {
    var o;
    t = i, (o = e()) == null || o.webContents.send("updater:status", t);
  };
  fo.handle("updater:get-status", () => t), cn.isPackaged && (Qt.on("update-available", (i) => {
    n = i.version, r({ phase: "downloading", version: n, percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 });
  }), Qt.on("download-progress", (i) => {
    r({
      phase: "downloading",
      version: n ?? "",
      percent: i.percent,
      transferred: i.transferred,
      total: i.total,
      bytesPerSecond: i.bytesPerSecond
    });
  }), Qt.on("update-downloaded", (i) => {
    r({ phase: "installing", version: i.version }), setTimeout(() => Qt.quitAndInstall(!0, !0), Wv);
  }), Qt.on("error", (i) => {
    console.error("Auto-update failed:", i), t.phase !== "none" && r({ phase: "error", version: n, message: i.message });
  }), Qt.checkForUpdates().catch(() => {
  }));
}
const ef = Ze.dirname(rd(import.meta.url));
process.env.APP_ROOT = Ze.join(ef, "..");
const Oo = process.env.VITE_DEV_SERVER_URL, dA = Ze.join(process.env.APP_ROOT, "dist-electron"), tf = Ze.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Oo ? Ze.join(process.env.APP_ROOT, "public") : tf;
let Je;
function nf() {
  Je = new Io({
    icon: Ze.join(process.env.VITE_PUBLIC, "logo-nxlogsync.png"),
    webPreferences: {
      preload: Ze.join(ef, "preload.mjs")
    }
  }), Je.webContents.on("did-finish-load", () => {
    Je == null || Je.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), Oo ? Je.loadURL(Oo) : Je.loadFile(Ze.join(tf, "index.html"));
}
cn.on("window-all-closed", () => {
  process.platform !== "darwin" && (cn.quit(), Je = null);
});
cn.on("activate", () => {
  Io.getAllWindows().length === 0 && nf();
});
cn.whenReady().then(() => {
  nd.setApplicationMenu(null), ud(() => Je), nf(), Yv(() => Je);
});
export {
  dA as MAIN_DIST,
  tf as RENDERER_DIST,
  Oo as VITE_DEV_SERVER_URL
};
