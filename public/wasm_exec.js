// Copyright 2018 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
//
// This file has been modified for use by the TinyGo compiler.

(async () => {
    "use strict";

    function A(A, Q, I) {
        return Q <= A && A <= I;
    }
    function Q(A) {
        if (A === undefined) {
            return {};
        }
        if (A === Object(A)) {
            return A;
        }
        throw TypeError("Could not convert argument to dictionary");
    }
    function I(A) {
        return A >= 0 && A <= 127;
    }
    var B = -1;
    function C(A) {
        this.tokens = [].slice.call(A);
        this.tokens.reverse();
    }
    C.prototype = {
        endOfStream: function () {
            return !this.tokens.length;
        },
        read: function () {
            if (this.tokens.length) {
                return this.tokens.pop();
            } else {
                return B;
            }
        },
        prepend: function (A) {
            if (Array.isArray(A)) {
                for (var Q = A; Q.length;) {
                    this.tokens.push(Q.pop());
                }
            } else {
                this.tokens.push(A);
            }
        },
        push: function (A) {
            if (Array.isArray(A)) {
                for (var Q = A; Q.length;) {
                    this.tokens.unshift(Q.shift());
                }
            } else {
                this.tokens.unshift(A);
            }
        }
    };
    var g = -1;
    function E(A, Q) {
        if (A) {
            throw TypeError("Decoder error");
        }
        return Q || 65533;
    }
    function D(A) {
        A = String(A).trim().toLowerCase();
        if (Object.prototype.hasOwnProperty.call(w, A)) {
            return w[A];
        } else {
            return null;
        }
    }
    var w = {};
    [{
        encodings: [{
            labels: ["unicode-1-1-utf-8", "utf-8", "utf8"],
            name: "UTF-8"
        }],
        heading: "The Encoding"
    }].forEach(function (A) {
        A.encodings.forEach(function (A) {
            A.labels.forEach(function (Q) {
                w[Q] = A;
            });
        });
    });
    var M;
    var i;
    var h = {
        "UTF-8": function (A) {
            return new F(A);
        }
    };
    var k = {
        "UTF-8": function (A) {
            return new o(A);
        }
    };
    var G = "utf-8";
    function y(A, I) {
        if (!(this instanceof y)) {
            throw TypeError("Called as a function. Did you forget 'new'?");
        }
        A = A !== undefined ? String(A) : G;
        I = Q(I);
        this._encoding = null;
        this._decoder = null;
        this._ignoreBOM = false;
        this._BOMseen = false;
        this._error_mode = "replacement";
        this._do_not_flush = false;
        var B = D(A);
        if (B === null || B.name === "replacement") {
            throw RangeError("Unknown encoding: " + A);
        }
        if (!k[B.name]) {
            throw Error("Decoder not present. Did you forget to include encoding-indexes.js first?");
        }
        var C = this;
        C._encoding = B;
        if (I.fatal) {
            C._error_mode = "fatal";
        }
        if (I.ignoreBOM) {
            C._ignoreBOM = true;
        }
        if (!Object.defineProperty) {
            this.encoding = C._encoding.name.toLowerCase();
            this.fatal = C._error_mode === "fatal";
            this.ignoreBOM = C._ignoreBOM;
        }
        return C;
    }
    function J(A, I) {
        if (!(this instanceof J)) {
            throw TypeError("Called as a function. Did you forget 'new'?");
        }
        I = Q(I);
        this._encoding = null;
        this._encoder = null;
        this._do_not_flush = false;
        this._fatal = I.fatal ? "fatal" : "replacement";
        var B = this;
        if (I.NONSTANDARD_allowLegacyEncoding) {
            var C = D(A = A !== undefined ? String(A) : G);
            if (C === null || C.name === "replacement") {
                throw RangeError("Unknown encoding: " + A);
            }
            if (!h[C.name]) {
                throw Error("Encoder not present. Did you forget to include encoding-indexes.js first?");
            }
            B._encoding = C;
        } else {
            B._encoding = D("utf-8");
        }
        if (!Object.defineProperty) {
            this.encoding = B._encoding.name.toLowerCase();
        }
        return B;
    }
    function o(Q) {
        var I = Q.fatal;
        var C = 0;
        var D = 0;
        var w = 0;
        var M = 128;
        var i = 191;
        this.handler = function (Q, h) {
            if (h === B && w !== 0) {
                w = 0;
                return E(I);
            }
            if (h === B) {
                return g;
            }
            if (w === 0) {
                if (A(h, 0, 127)) {
                    return h;
                }
                if (A(h, 194, 223)) {
                    w = 1;
                    C = h & 31;
                } else if (A(h, 224, 239)) {
                    if (h === 224) {
                        M = 160;
                    }
                    if (h === 237) {
                        i = 159;
                    }
                    w = 2;
                    C = h & 15;
                } else {
                    if (!A(h, 240, 244)) {
                        return E(I);
                    }
                    if (h === 240) {
                        M = 144;
                    }
                    if (h === 244) {
                        i = 143;
                    }
                    w = 3;
                    C = h & 7;
                }
                return null;
            }
            if (!A(h, M, i)) {
                C = w = D = 0;
                M = 128;
                i = 191;
                Q.prepend(h);
                return E(I);
            }
            M = 128;
            i = 191;
            C = C << 6 | h & 63;
            if ((D += 1) !== w) {
                return null;
            }
            var k = C;
            C = w = D = 0;
            return k;
        };
    }
    function F(Q) {
        Q.fatal;
        this.handler = function (Q, C) {
            if (C === B) {
                return g;
            }
            if (I(C)) {
                return C;
            }
            var E;
            var D;
            if (A(C, 128, 2047)) {
                E = 1;
                D = 192;
            } else if (A(C, 2048, 65535)) {
                E = 2;
                D = 224;
            } else if (A(C, 65536, 1114111)) {
                E = 3;
                D = 240;
            }
            var w = [(C >> E * 6) + D];
            for (; E > 0;) {
                var M = C >> (E - 1) * 6;
                w.push(M & 63 | 128);
                E -= 1;
            }
            return w;
        };
    }
    if (Object.defineProperty) {
        Object.defineProperty(y.prototype, "encoding", {
            get: function () {
                return this._encoding.name.toLowerCase();
            }
        });
        Object.defineProperty(y.prototype, "fatal", {
            get: function () {
                return this._error_mode === "fatal";
            }
        });
        Object.defineProperty(y.prototype, "ignoreBOM", {
            get: function () {
                return this._ignoreBOM;
            }
        });
    }
    y.prototype.decode = function (A, I) {
        var E;
        E = typeof A == "object" && A instanceof ArrayBuffer ? new Uint8Array(A) : typeof A == "object" && "buffer" in A && A.buffer instanceof ArrayBuffer ? new Uint8Array(A.buffer, A.byteOffset, A.byteLength) : new Uint8Array(0);
        I = Q(I);
        if (!this._do_not_flush) {
            this._decoder = k[this._encoding.name]({
                fatal: this._error_mode === "fatal"
            });
            this._BOMseen = false;
        }
        this._do_not_flush = Boolean(I.stream);
        var D;
        var w = new C(E);
        var M = [];
        while (true) {
            var i = w.read();
            if (i === B) {
                break;
            }
            if ((D = this._decoder.handler(w, i)) === g) {
                break;
            }
            if (D !== null) {
                if (Array.isArray(D)) {
                    M.push.apply(M, D);
                } else {
                    M.push(D);
                }
            }
        }
        if (!this._do_not_flush) {
            do {
                if ((D = this._decoder.handler(w, w.read())) === g) {
                    break;
                }
                if (D !== null) {
                    if (Array.isArray(D)) {
                        M.push.apply(M, D);
                    } else {
                        M.push(D);
                    }
                }
            } while (!w.endOfStream());
            this._decoder = null;
        }
        return function (A) {
            var Q;
            var I;
            Q = ["UTF-8", "UTF-16LE", "UTF-16BE"];
            I = this._encoding.name;
            if (Q.indexOf(I) !== -1 && !this._ignoreBOM && !this._BOMseen) {
                if (A.length > 0 && A[0] === 65279) {
                    this._BOMseen = true;
                    A.shift();
                } else if (A.length > 0) {
                    this._BOMseen = true;
                }
            }
            return function (A) {
                var Q = "";
                for (var I = 0; I < A.length; ++I) {
                    var B = A[I];
                    if (B <= 65535) {
                        Q += String.fromCharCode(B);
                    } else {
                        B -= 65536;
                        Q += String.fromCharCode(55296 + (B >> 10), 56320 + (B & 1023));
                    }
                }
                return Q;
            }(A);
        }.call(this, M);
    };
    if (Object.defineProperty) {
        Object.defineProperty(J.prototype, "encoding", {
            get: function () {
                return this._encoding.name.toLowerCase();
            }
        });
    }
    J.prototype.encode = function (A, I) {
        A = A === undefined ? "" : String(A);
        I = Q(I);
        if (!this._do_not_flush) {
            this._encoder = h[this._encoding.name]({
                fatal: this._fatal === "fatal"
            });
        }
        this._do_not_flush = Boolean(I.stream);
        var E;
        var D = new C(function (A) {
            var Q = String(A);
            for (var I = Q.length, B = 0, C = []; B < I;) {
                var g = Q.charCodeAt(B);
                if (g < 55296 || g > 57343) {
                    C.push(g);
                } else if (g >= 56320 && g <= 57343) {
                    C.push(65533);
                } else if (g >= 55296 && g <= 56319) {
                    if (B === I - 1) {
                        C.push(65533);
                    } else {
                        var E = Q.charCodeAt(B + 1);
                        if (E >= 56320 && E <= 57343) {
                            var D = g & 1023;
                            var w = E & 1023;
                            C.push(65536 + (D << 10) + w);
                            B += 1;
                        } else {
                            C.push(65533);
                        }
                    }
                }
                B += 1;
            }
            return C;
        }(A));
        var w = [];
        while (true) {
            var M = D.read();
            if (M === B) {
                break;
            }
            if ((E = this._encoder.handler(D, M)) === g) {
                break;
            }
            if (Array.isArray(E)) {
                w.push.apply(w, E);
            } else {
                w.push(E);
            }
        }
        if (!this._do_not_flush) {
            while ((E = this._encoder.handler(D, D.read())) !== g) {
                if (Array.isArray(E)) {
                    w.push.apply(w, E);
                } else {
                    w.push(E);
                }
            }
            this._encoder = null;
        }
        return new Uint8Array(w);
    };
    window.TextDecoder ||= y;
    window.TextEncoder ||= J;
    M = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    i = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
    window.btoa = window.btoa || function (A) {
        var Q;
        var I;
        var B;
        var C;
        var g = "";
        for (var E = 0, D = (A = String(A)).length % 3; E < A.length;) {
            if ((I = A.charCodeAt(E++)) > 255 || (B = A.charCodeAt(E++)) > 255 || (C = A.charCodeAt(E++)) > 255) {
                throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");
            }
            g += M.charAt((Q = I << 16 | B << 8 | C) >> 18 & 63) + M.charAt(Q >> 12 & 63) + M.charAt(Q >> 6 & 63) + M.charAt(Q & 63);
        }
        if (D) {
            return g.slice(0, D - 3) + "===".substring(D);
        } else {
            return g;
        }
    };
    window.atob = window.atob || function (A) {
        A = String(A).replace(/[\t\n\f\r ]+/g, "");
        if (!i.test(A)) {
            throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
        }
        var Q;
        var I;
        var B;
        A += "==".slice(2 - (A.length & 3));
        var C = "";
        for (var g = 0; g < A.length;) {
            Q = M.indexOf(A.charAt(g++)) << 18 | M.indexOf(A.charAt(g++)) << 12 | (I = M.indexOf(A.charAt(g++))) << 6 | (B = M.indexOf(A.charAt(g++)));
            C += I === 64 ? String.fromCharCode(Q >> 16 & 255) : B === 64 ? String.fromCharCode(Q >> 16 & 255, Q >> 8 & 255) : String.fromCharCode(Q >> 16 & 255, Q >> 8 & 255, Q & 255);
        }
        return C;
    };
    if (!Array.prototype.fill) {
        Object.defineProperty(Array.prototype, "fill", {
            value: function (A) {
                if (this == null) {
                    throw new TypeError("this is null or not defined");
                }
                var Q = Object(this);
                var I = Q.length >>> 0;
                var B = arguments[1] | 0;
                for (var C = B < 0 ? Math.max(I + B, 0) : Math.min(B, I), g = arguments[2], E = g === undefined ? I : g | 0, D = E < 0 ? Math.max(I + E, 0) : Math.min(E, I); C < D;) {
                    Q[C] = A;
                    C++;
                }
                return Q;
            }
        });
    }
    (function () {
        if (typeof globalThis != "object" || !globalThis) {
            try {
                Object.defineProperty(Object.prototype, "__global__", {
                    get: function () {
                        return this;
                    },
                    configurable: true
                });
                if (!__global__) {
                    throw new Error("Global not found.");
                }
                __global__.globalThis = __global__;
                delete Object.prototype.__global__;
            } catch (A) {
                window.globalThis = function () {
                    if (typeof window != "undefined") {
                        return window;
                    } else if (this !== undefined) {
                        return this;
                    } else {
                        return undefined;
                    }
                }();
            }
        }
    })();

    const enosys = () => {
        const err = new Error("not implemented");
        err.code = "ENOSYS";
        return err;
    };

    if (!globalThis.fs) {
        let outputBuf = "";
        globalThis.fs = {
            constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 }, // unused
            writeSync(fd, buf) {
                outputBuf += decoder.decode(buf);
                const nl = outputBuf.lastIndexOf("\n");
                if (nl != -1) {
                    console.log(outputBuf.substr(0, nl));
                    outputBuf = outputBuf.substr(nl + 1);
                }
                return buf.length;
            },
            write(fd, buf, offset, length, position, callback) {
                if (offset !== 0 || length !== buf.length || position !== null) {
                    callback(enosys());
                    return;
                }
                const n = this.writeSync(fd, buf);
                callback(null, n);
            },
            chmod(path, mode, callback) { callback(enosys()); },
            chown(path, uid, gid, callback) { callback(enosys()); },
            close(fd, callback) { callback(enosys()); },
            fchmod(fd, mode, callback) { callback(enosys()); },
            fchown(fd, uid, gid, callback) { callback(enosys()); },
            fstat(fd, callback) { callback(enosys()); },
            fsync(fd, callback) { callback(null); },
            ftruncate(fd, length, callback) { callback(enosys()); },
            lchown(path, uid, gid, callback) { callback(enosys()); },
            link(path, link, callback) { callback(enosys()); },
            lstat(path, callback) { callback(enosys()); },
            mkdir(path, perm, callback) { callback(enosys()); },
            open(path, flags, mode, callback) { callback(enosys()); },
            read(fd, buffer, offset, length, position, callback) { callback(enosys()); },
            readdir(path, callback) { callback(enosys()); },
            readlink(path, callback) { callback(enosys()); },
            rename(from, to, callback) { callback(enosys()); },
            rmdir(path, callback) { callback(enosys()); },
            stat(path, callback) { callback(enosys()); },
            symlink(path, link, callback) { callback(enosys()); },
            truncate(path, length, callback) { callback(enosys()); },
            unlink(path, callback) { callback(enosys()); },
            utimes(path, atime, mtime, callback) { callback(enosys()); },
        };
    }

    const encoder = new (typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder)("utf-8");
    const decoder = new (typeof TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : TextDecoder)("utf-8", {
        ignoreBOM: true,
        fatal: true
    });
    let reinterpretBuf = new DataView(new ArrayBuffer(8));
    var logLine = [];

    const Go = class {
        constructor() {
            this._callbackTimeouts = new Map();
            this._nextCallbackTimeoutID = 1;

            const mem = () => {
                // The buffer may change when requesting more memory.
                return new DataView(this._inst.exports.memory.buffer);
            }

            const unboxValue = (v_ref) => {
                reinterpretBuf.setBigInt64(0, v_ref, true);
                const f = reinterpretBuf.getFloat64(0, true);
                if (f === 0) {
                    return undefined;
                }
                if (!isNaN(f)) {
                    return f;
                }

                const id = v_ref & 0xffffffffn;
                return this._values[id];
            }


            const loadValue = (addr) => {
                let v_ref = mem().getBigUint64(addr, true);
                return unboxValue(v_ref);
            }

            const boxValue = (v) => {
                const nanHead = 0x7FF80000n;

                if (typeof v === "number") {
                    if (isNaN(v)) {
                        return nanHead << 32n;
                    }
                    if (v === 0) {
                        return (nanHead << 32n) | 1n;
                    }
                    reinterpretBuf.setFloat64(0, v, true);
                    return reinterpretBuf.getBigInt64(0, true);
                }

                switch (v) {
                    case undefined:
                        return 0n;
                    case null:
                        return (nanHead << 32n) | 2n;
                    case true:
                        return (nanHead << 32n) | 3n;
                    case false:
                        return (nanHead << 32n) | 4n;
                }

                let id = this._ids.get(v);
                if (id === undefined) {
                    id = this._idPool.pop();
                    if (id === undefined) {
                        id = BigInt(this._values.length);
                    }
                    this._values[id] = v;
                    this._goRefCounts[id] = 0;
                    this._ids.set(v, id);
                }
                this._goRefCounts[id]++;
                let typeFlag = 1n;
                switch (typeof v) {
                    case "string":
                        typeFlag = 2n;
                        break;
                    case "symbol":
                        typeFlag = 3n;
                        break;
                    case "function":
                        typeFlag = 4n;
                        break;
                }
                return id | ((nanHead | typeFlag) << 32n);
            }

            const storeValue = (addr, v) => {
                let v_ref = boxValue(v);
                mem().setBigUint64(addr, v_ref, true);
            }

            const loadSlice = (array, len, cap) => {
                return new Uint8Array(this._inst.exports.memory.buffer, array, len);
            }

            const loadSliceOfValues = (array, len, cap) => {
                const a = new Array(len);
                for (let i = 0; i < len; i++) {
                    a[i] = loadValue(array + i * 8);
                }
                return a;
            }

            const loadString = (ptr, len) => {
                return decoder.decode(new DataView(this._inst.exports.memory.buffer, ptr, len));
            }

            const timeOrigin = Date.now() - performance.now();
            this.importObject = {
                wasi_snapshot_preview1: {
                    // https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md#fd_write
                    fd_write: function (fd, iovs_ptr, iovs_len, nwritten_ptr) {
                        let nwritten = 0;
                        if (fd == 1) {
                            for (let iovs_i = 0; iovs_i < iovs_len; iovs_i++) {
                                let iov_ptr = iovs_ptr + iovs_i * 8; // assuming wasm32
                                let ptr = mem().getUint32(iov_ptr + 0, true);
                                let len = mem().getUint32(iov_ptr + 4, true);
                                nwritten += len;
                                for (let i = 0; i < len; i++) {
                                    let c = mem().getUint8(ptr + i);
                                    if (c == 13) { // CR
                                        // ignore
                                    } else if (c == 10) { // LF
                                        // write line
                                        let line = decoder.decode(new Uint8Array(logLine));
                                        logLine = [];
                                        console.log(line);
                                    } else {
                                        logLine.push(c);
                                    }
                                }
                            }
                        } else {
                            console.error('invalid file descriptor:', fd);
                        }
                        mem().setUint32(nwritten_ptr, nwritten, true);
                        return 0;
                    },
                    fd_close: () => 0,      // dummy
                    fd_fdstat_get: () => 0, // dummy
                    fd_seek: () => 0,       // dummy
                    "proc_exit": (code) => {
                        if (global.process) {
                            // Node.js
                            process.exit(code);
                        } else {
                            // Can't exit in a browser.
                            throw 'trying to exit with code ' + code;
                        }
                    },
                    random_get: (bufPtr, bufLen) => {
                        crypto.getRandomValues(loadSlice(bufPtr, bufLen));
                        return 0;
                    },
                },
                gojs: {
                    // func ticks() float64
                    "runtime.ticks": () => {
                        return timeOrigin + performance.now();
                    },

                    // func sleepTicks(timeout float64)
                    "runtime.sleepTicks": (timeout) => {
                        // Do not sleep, only reactivate scheduler after the given timeout.
                        setTimeout(this._inst.exports.go_scheduler, timeout);
                    },

                    // func finalizeRef(v ref)
                    "syscall/js.finalizeRef": (v_ref) => {
                        // Note: TinyGo does not support finalizers so this should never be
                        // called.
                        console.error('syscall/js.finalizeRef not implemented');
                    },

                    // func stringVal(value string) ref
                    "syscall/js.stringVal": (value_ptr, value_len) => {
                        const s = loadString(value_ptr, value_len);
                        return boxValue(s);
                    },

                    // func valueGet(v ref, p string) ref
                    "syscall/js.valueGet": (v_ref, p_ptr, p_len) => {
                        let prop = loadString(p_ptr, p_len);
                        let v = unboxValue(v_ref);
                        let result = Reflect.get(v, prop);
                        return boxValue(result);
                    },

                    // func valueSet(v ref, p string, x ref)
                    "syscall/js.valueSet": (v_ref, p_ptr, p_len, x_ref) => {
                        const v = unboxValue(v_ref);
                        const p = loadString(p_ptr, p_len);
                        const x = unboxValue(x_ref);
                        Reflect.set(v, p, x);
                    },

                    // func valueDelete(v ref, p string)
                    "syscall/js.valueDelete": (v_ref, p_ptr, p_len) => {
                        const v = unboxValue(v_ref);
                        const p = loadString(p_ptr, p_len);
                        Reflect.deleteProperty(v, p);
                    },

                    // func valueIndex(v ref, i int) ref
                    "syscall/js.valueIndex": (v_ref, i) => {
                        return boxValue(Reflect.get(unboxValue(v_ref), i));
                    },

                    // valueSetIndex(v ref, i int, x ref)
                    "syscall/js.valueSetIndex": (v_ref, i, x_ref) => {
                        Reflect.set(unboxValue(v_ref), i, unboxValue(x_ref));
                    },

                    // func valueCall(v ref, m string, args []ref) (ref, bool)
                    "syscall/js.valueCall": (ret_addr, v_ref, m_ptr, m_len, args_ptr, args_len, args_cap) => {
                        const v = unboxValue(v_ref);
                        const name = loadString(m_ptr, m_len);
                        const args = loadSliceOfValues(args_ptr, args_len, args_cap);
                        try {
                            const m = Reflect.get(v, name);
                            storeValue(ret_addr, Reflect.apply(m, v, args));
                            mem().setUint8(ret_addr + 8, 1);
                        } catch (err) {
                            storeValue(ret_addr, err);
                            mem().setUint8(ret_addr + 8, 0);
                        }
                    },

                    // func valueInvoke(v ref, args []ref) (ref, bool)
                    "syscall/js.valueInvoke": (ret_addr, v_ref, args_ptr, args_len, args_cap) => {
                        try {
                            const v = unboxValue(v_ref);
                            const args = loadSliceOfValues(args_ptr, args_len, args_cap);
                            storeValue(ret_addr, Reflect.apply(v, undefined, args));
                            mem().setUint8(ret_addr + 8, 1);
                        } catch (err) {
                            storeValue(ret_addr, err);
                            mem().setUint8(ret_addr + 8, 0);
                        }
                    },

                    // func valueNew(v ref, args []ref) (ref, bool)
                    "syscall/js.valueNew": (ret_addr, v_ref, args_ptr, args_len, args_cap) => {
                        const v = unboxValue(v_ref);
                        const args = loadSliceOfValues(args_ptr, args_len, args_cap);
                        try {
                            storeValue(ret_addr, Reflect.construct(v, args));
                            mem().setUint8(ret_addr + 8, 1);
                        } catch (err) {
                            storeValue(ret_addr, err);
                            mem().setUint8(ret_addr + 8, 0);
                        }
                    },

                    // func valueLength(v ref) int
                    "syscall/js.valueLength": (v_ref) => {
                        return unboxValue(v_ref).length;
                    },

                    // valuePrepareString(v ref) (ref, int)
                    "syscall/js.valuePrepareString": (ret_addr, v_ref) => {
                        const s = String(unboxValue(v_ref));
                        const str = encoder.encode(s);
                        storeValue(ret_addr, str);
                        mem().setInt32(ret_addr + 8, str.length, true);
                    },

                    // valueLoadString(v ref, b []byte)
                    "syscall/js.valueLoadString": (v_ref, slice_ptr, slice_len, slice_cap) => {
                        const str = unboxValue(v_ref);
                        loadSlice(slice_ptr, slice_len, slice_cap).set(str);
                    },

                    // func valueInstanceOf(v ref, t ref) bool
                    "syscall/js.valueInstanceOf": (v_ref, t_ref) => {
                        return unboxValue(v_ref) instanceof unboxValue(t_ref);
                    },

                    // func copyBytesToGo(dst []byte, src ref) (int, bool)
                    "syscall/js.copyBytesToGo": (ret_addr, dest_addr, dest_len, dest_cap, src_ref) => {
                        let num_bytes_copied_addr = ret_addr;
                        let returned_status_addr = ret_addr + 4; // Address of returned boolean status variable

                        const dst = loadSlice(dest_addr, dest_len);
                        const src = unboxValue(src_ref);
                        if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
                            mem().setUint8(returned_status_addr, 0); // Return "not ok" status
                            return;
                        }
                        const toCopy = src.subarray(0, dst.length);
                        dst.set(toCopy);
                        mem().setUint32(num_bytes_copied_addr, toCopy.length, true);
                        mem().setUint8(returned_status_addr, 1); // Return "ok" status
                    },

                    // copyBytesToJS(dst ref, src []byte) (int, bool)
                    // Originally copied from upstream Go project, then modified:
                    //   https://github.com/golang/go/blob/3f995c3f3b43033013013e6c7ccc93a9b1411ca9/misc/wasm/wasm_exec.js#L404-L416
                    "syscall/js.copyBytesToJS": (ret_addr, dst_ref, src_addr, src_len, src_cap) => {
                        let num_bytes_copied_addr = ret_addr;
                        let returned_status_addr = ret_addr + 4; // Address of returned boolean status variable

                        const dst = unboxValue(dst_ref);
                        const src = loadSlice(src_addr, src_len);
                        if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
                            mem().setUint8(returned_status_addr, 0); // Return "not ok" status
                            return;
                        }
                        const toCopy = src.subarray(0, dst.length);
                        dst.set(toCopy);
                        mem().setUint32(num_bytes_copied_addr, toCopy.length, true);
                        mem().setUint8(returned_status_addr, 1); // Return "ok" status
                    },
                }
            };

            // Go 1.20 uses 'env'. Go 1.21 uses 'gojs'.
            // For compatibility, we use both as long as Go 1.20 is supported.
            this.importObject.env = this.importObject.gojs;
        }

        async run(instance) {
            this._inst = instance;
            this._values = [ // JS values that Go currently has references to, indexed by reference id
                NaN,
                0,
                null,
                true,
                false,
                global,
                this,
            ];
            this._goRefCounts = []; // number of references that Go has to a JS value, indexed by reference id
            this._ids = new Map();  // mapping from JS values to reference ids
            this._idPool = [];      // unused ids that have been garbage collected
            this.exited = false;    // whether the Go program has exited

            while (true) {
                const callbackPromise = new Promise((resolve) => {
                    this._resolveCallbackPromise = () => {
                        if (this.exited) {
                            throw new Error("bad callback: Go program has already exited");
                        }
                        setTimeout(resolve, 0); // make sure it is asynchronous
                    };
                });
                this._inst.exports._start();
                if (this.exited) {
                    break;
                }
                await callbackPromise;
            }
        }

        _resume() {
            if (this.exited) {
                throw new Error("Go program has already exited");
            }
            this._inst.exports.resume();
            if (this.exited) {
                this._resolveExitPromise();
            }
        }

        _makeFuncWrapper(id) {
            const go = this;
            return function () {
                const event = { id: id, this: this, args: arguments };
                go._pendingEvent = event;
                go._resume();
                return event.result;
            };
        }
    }

    try {
        const e = new Go
            , t = fetch(new URL("app.wasm", import.meta.url), {
                method: "GET",
                headers: {
                    "Content-Type": "application/wasm"
                }
            })
            , n = WebAssembly.instantiateStreaming ? (await WebAssembly.instantiateStreaming(t, e.importObject)).instance : (await WebAssembly.instantiate(await (await t).arrayBuffer(), e.importObject)).instance;
        window.__iwm_wasm_exports ||= {},
            await e.run(n)
    } catch (e) {
        console.log(e)
    }
})();
