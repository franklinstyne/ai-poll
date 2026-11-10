// Small helpers shared by the participant, results and organiser pages.
(function () {
  var memoryId = null;
  var NS = "http://www.w3.org/2000/svg";

  function randomId() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    var s = "";
    for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }

  // Build a QR matrix for some text. Returns null if the library did not load.
  function qrMatrix(text) {
    if (typeof qrcode !== "function" || !text) return null;
    try {
      var qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      var n = qr.getModuleCount();
      var rows = [];
      for (var r = 0; r < n; r++) {
        var row = [];
        for (var c = 0; c < n; c++) row.push(qr.isDark(r, c));
        rows.push(row);
      }
      return { n: n, rows: rows };
    } catch (e) {
      return null;
    }
  }

  window.PollCommon = {
    normaliseCode: function (s) {
      return String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
    },
    title: function (params) {
      var t = (params.get("t") || "").replace(/\s+/g, " ").trim().slice(0, 80);
      return t || "Quick AI Pulse Check";
    },
    el: function (tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined && text !== null) n.textContent = text;
      return n;
    },
    voterId: function (code) {
      var key = "poll-voter-" + code;
      try {
        var v = localStorage.getItem(key);
        if (!v) {
          v = randomId();
          localStorage.setItem(key, v);
        }
        return v;
      } catch (e) {
        if (!memoryId) memoryId = randomId();
        return memoryId;
      }
    },
    loadSaved: function (code) {
      try {
        var raw = localStorage.getItem("poll-answers-" + code);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    saveAnswers: function (code, answers) {
      try {
        localStorage.setItem("poll-answers-" + code, JSON.stringify(answers));
      } catch (e) {}
    },
    api: function (code, extra) {
      return "/api/poll?c=" + encodeURIComponent(code) + (extra || "");
    },

    // QR code as an inline SVG element (dark modules on white, with a quiet zone).
    qrSvg: function (text, label) {
      var m = qrMatrix(text);
      if (!m) return null;
      var quiet = 2;
      var size = m.n + quiet * 2;
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 " + size + " " + size);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", label || "QR code for the poll link");
      svg.setAttribute("shape-rendering", "crispEdges");
      var bg = document.createElementNS(NS, "rect");
      bg.setAttribute("width", size);
      bg.setAttribute("height", size);
      bg.setAttribute("fill", "#ffffff");
      svg.appendChild(bg);
      var d = "";
      for (var r = 0; r < m.n; r++) {
        for (var c = 0; c < m.n; c++) {
          if (m.rows[r][c]) d += "M" + (c + quiet) + " " + (r + quiet) + "h1v1h-1z";
        }
      }
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "#0b1f1c");
      svg.appendChild(path);
      return svg;
    },

    // Download the QR code as a PNG file.
    qrDownload: function (text, filename, onDone) {
      var m = qrMatrix(text);
      if (!m) return false;
      var quiet = 4;
      var total = m.n + quiet * 2;
      var scale = Math.max(1, Math.floor(1200 / total));
      var canvas = document.createElement("canvas");
      canvas.width = canvas.height = total * scale;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0b1f1c";
      for (var r = 0; r < m.n; r++) {
        for (var c = 0; c < m.n; c++) {
          if (m.rows[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
      canvas.toBlob(function (blob) {
        if (!blob) return;
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename || "poll-qr.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        if (onDone) onDone();
      }, "image/png");
      return true;
    },

    // Link to the participant page for a code (and optional title).
    participantUrl: function (code, title) {
      var u = new URL("index.html", location.href);
      u.search = "";
      u.searchParams.set("c", code);
      if (title) u.searchParams.set("t", title);
      return u.toString();
    },
    resultsUrl: function (code, title) {
      var u = new URL("results.html", location.href);
      u.search = "";
      u.searchParams.set("c", code);
      if (title) u.searchParams.set("t", title);
      return u.toString();
    }
  };
})();
