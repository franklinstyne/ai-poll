// Results page: shows live charts for one client code and refreshes itself.
(function () {
  var C = window.PollCommon;
  var Q = window.POLL_QUESTIONS;
  var params = new URLSearchParams(location.search);
  var code = C.normaliseCode(params.get("c") || "");
  var app = document.getElementById("app");
  var title = C.title(params);
  var REFRESH_MS = 4000;
  var COLORS = ["#0f766e", "#b45309", "#1d4ed8", "#9333ea", "#be123c", "#047857", "#7c2d12", "#0369a1"];

  document.title = "Results: " + title;
  app.textContent = "";

  if (!code) {
    app.appendChild(C.el("h1", null, "Live results"));
    app.appendChild(C.el("p", "sub", "This link is missing its poll code. Use the Results link from the organiser page."));
    return;
  }

  var head = C.el("div", "res-head");
  head.appendChild(C.el("h1", null, title));
  var countEl = C.el("div", "count", "0 responses");
  head.appendChild(countEl);
  app.appendChild(head);

  var statusEl = C.el("div", "status", "Loading...");
  app.appendChild(statusEl);
  var grid = C.el("div", "grid");
  app.appendChild(grid);

  var foot = C.el("div", "res-foot");
  var copyBtn = C.el("button", "ghost", "Copy participant link");
  copyBtn.type = "button";
  var resetBtn = C.el("button", "danger", "Reset votes");
  resetBtn.type = "button";
  var footMsg = C.el("span", "msg", "");
  foot.appendChild(copyBtn);
  foot.appendChild(resetBtn);
  foot.appendChild(footMsg);
  app.appendChild(foot);

  function participantLink() {
    var u = new URL("index.html", location.href);
    u.search = "";
    u.searchParams.set("c", code);
    if (params.get("t")) u.searchParams.set("t", C.title(params));
    return u.toString();
  }

  copyBtn.addEventListener("click", function () {
    var link = participantLink();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(
        function () { footMsg.textContent = "Participant link copied."; },
        function () { footMsg.textContent = link; }
      );
    } else {
      footMsg.textContent = link;
    }
  });

  resetBtn.addEventListener("click", function () {
    var pin = window.prompt("Enter the reset PIN to clear all votes for \"" + code + "\":");
    if (pin === null) return;
    fetch(C.api(code, "&action=reset"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin: pin })
    })
      .then(function (r) { return r.json().then(function (b) { return { status: r.status, body: b }; }); })
      .then(function (res) {
        if (res.status === 200) {
          footMsg.textContent = "Votes cleared.";
          lastJson = "";
          load();
        } else if (res.body && res.body.error === "reset_not_configured") {
          footMsg.textContent = "Reset is not set up. Add a RESET_PIN in Netlify, or just use a new client code for a clean start.";
        } else if (res.body && res.body.error === "wrong_pin") {
          footMsg.textContent = "Wrong PIN.";
        } else {
          footMsg.textContent = "Reset failed.";
        }
      })
      .catch(function () { footMsg.textContent = "Reset failed. Check your connection."; });
  });

  function barsFor(q, votes) {
    var counts = q.options.map(function () { return 0; });
    var answered = 0;
    votes.forEach(function (v) {
      var a = v[q.id];
      if (a === undefined || a === null) return;
      var list = Array.isArray(a) ? a : [a];
      var hit = false;
      list.forEach(function (x) {
        var idx = q.options.indexOf(x);
        if (idx >= 0) { counts[idx]++; hit = true; }
      });
      if (hit) answered++;
    });
    var max = Math.max.apply(null, counts);
    var wrap = C.el("div", "bars");
    if (q.type === "multi") {
      wrap.appendChild(C.el("p", "note", "Tick all that apply. Percentages are out of the " + answered + " people who answered."));
    }
    q.options.forEach(function (opt, idx) {
      var pct = answered ? Math.round((counts[idx] / answered) * 100) : 0;
      var row = C.el("div", "bar-row" + (max > 0 && counts[idx] === max ? " top" : ""));
      var label = C.el("div", "bar-label");
      label.appendChild(C.el("span", "bar-name", opt));
      label.appendChild(C.el("span", "bar-num", counts[idx] + " (" + pct + "%)"));
      var track = C.el("div", "bar-track");
      var fill = C.el("div", "bar-fill");
      fill.style.width = pct + "%";
      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function cloudFor(q, votes) {
    var tally = {};
    votes.forEach(function (v) {
      var a = v[q.id];
      if (typeof a !== "string") return;
      var w = a.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "").replace(/\s+/g, " ").trim();
      if (!w) return;
      tally[w] = (tally[w] || 0) + 1;
    });
    var words = Object.keys(tally);
    var wrap = C.el("div", "cloud");
    if (words.length === 0) {
      wrap.appendChild(C.el("div", "empty", "Waiting for answers"));
      return wrap;
    }
    words.sort(function (a, b) { return tally[b] - tally[a] || (a < b ? -1 : 1); });
    var top = tally[words[0]];
    words.slice(0, 60).forEach(function (w, i) {
      var size = 1.5 + (tally[w] / top) * 2.6;
      var span = C.el("span", null, w);
      span.style.fontSize = size.toFixed(2) + "rem";
      span.style.color = COLORS[i % COLORS.length];
      span.title = tally[w] + (tally[w] === 1 ? " answer" : " answers");
      wrap.appendChild(span);
    });
    return wrap;
  }

  function render(data) {
    var votes = data.votes || [];
    var n = votes.length;
    countEl.textContent = n + (n === 1 ? " response" : " responses");
    grid.textContent = "";
    Q.forEach(function (q, i) {
      var card = C.el("section", "card");
      card.appendChild(C.el("h2", "q-title", i + 1 + ". " + q.text));
      card.appendChild(q.type === "text" ? cloudFor(q, votes) : barsFor(q, votes));
      grid.appendChild(card);
    });
  }

  var lastJson = "";
  function load() {
    fetch(C.api(code), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        return r.text();
      })
      .then(function (text) {
        if (text !== lastJson) {
          lastJson = text;
          render(JSON.parse(text));
        }
        statusEl.textContent = "Live. Updates every few seconds.";
      })
      .catch(function () {
        statusEl.textContent = "Connection issue. Retrying...";
      });
  }

  load();
  setInterval(load, REFRESH_MS);
})();
