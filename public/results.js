// Results screen: live charts for one client code.
// Click any bar or word to filter every other chart to the people who chose it.
(function () {
  "use strict";
  const C = window.PollCommon;
  const Q = window.POLL_QUESTIONS;
  const el = C.el;
  const params = new URLSearchParams(location.search);
  const code = C.normaliseCode(params.get("c") || "");
  const app = document.getElementById("app");
  const title = C.title(params);
  const REFRESH_MS = 4000;
  const MAX_PIPS = 600;

  document.title = "Results: " + title;
  app.textContent = "";

  if (!code) {
    const box = el("div", "stage");
    box.append(el("h1", null, "Live results"), el("p", "lead", "This link is missing its poll code. Use the Results link from the organiser page."));
    app.append(box);
    return;
  }

  const qById = {};
  Q.forEach((q) => { qById[q.id] = q; });
  const pUrl = C.participantUrl(code, params.get("t") ? title : "");
  const shortUrl = pUrl.replace(/^https?:\/\//, "");

  // view: "focus" (one question at a time) or "all". idx: 0 is the join slide, 1..n are questions.
  const state = { votes: [], view: "focus", idx: null, filter: null, sort: false, prevCount: -1 };
  let cards = [];
  let joinCountEl = null;
  let pips = [];

  /* ---------- data helpers ---------- */

  const norm = (s) => String(s).toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "").replace(/\s+/g, " ").trim();
  const shortOpt = (o) => o.split(":")[0];

  function voteHas(v, q, value) {
    const a = v[q.id];
    if (a === undefined || a === null) return false;
    if (q.type === "text") return typeof a === "string" && norm(a) === value;
    return Array.isArray(a) ? a.includes(value) : a === value;
  }

  function matchesFilter(v) {
    const f = state.filter;
    return !f || voteHas(v, qById[f.qid], f.value);
  }

  // Votes a question should draw from. The question being filtered shows everyone,
  // so you can still see the other options next to the one you picked.
  function votesFor(q) {
    const f = state.filter;
    if (!f || f.qid === q.id) return state.votes;
    return state.votes.filter(matchesFilter);
  }

  function choiceStats(q, votes) {
    const counts = q.options.map(() => 0);
    let answered = 0;
    votes.forEach((v) => {
      const a = v[q.id];
      if (a === undefined || a === null) return;
      let hit = false;
      (Array.isArray(a) ? a : [a]).forEach((x) => {
        const i = q.options.indexOf(x);
        if (i >= 0) { counts[i]++; hit = true; }
      });
      if (hit) answered++;
    });
    return { counts, answered, max: Math.max(0, ...counts) };
  }

  function textStats(q, votes) {
    const tally = {};
    votes.forEach((v) => {
      const a = v[q.id];
      if (typeof a !== "string") return;
      const w = norm(a);
      if (w) tally[w] = (tally[w] || 0) + 1;
    });
    const words = Object.keys(tally).sort((a, b) => tally[b] - tally[a] || (a < b ? -1 : 1));
    return { tally, words };
  }

  function leaderOf(q, votes) {
    const none = { full: "No answers yet", short: "No answers yet" };
    if (q.type === "text") {
      const st = textStats(q, votes);
      if (!st.words.length) return none;
      const w = st.words[0];
      return { full: "Most common: " + w + " (" + st.tally[w] + ")", short: w + " (" + st.tally[w] + ")" };
    }
    const st = choiceStats(q, votes);
    if (!st.max) return none;
    const names = q.options.filter((o, i) => st.counts[i] === st.max);
    const pct = Math.round((st.max / st.answered) * 100);
    if (names.length > 2) {
      const t = names.length + " tied at " + pct + "%";
      return { full: "Leading: " + t, short: t };
    }
    return { full: "Leading: " + names.join(" and ") + " (" + pct + "%)", short: names.map(shortOpt).join(" and ") + " " + pct + "%" };
  }

  function toggleFilter(q, value) {
    const f = state.filter;
    state.filter = f && f.qid === q.id && f.value === value ? null : { qid: q.id, value };
    updateAll();
  }

  /* ---------- question panel ---------- */

  function buildPanel(q, big) {
    const root = el("section", "panel" + (big ? " big" : ""));
    root.append(el("h2", "q", q.text));
    const lead = el("p", "lead");
    root.append(lead);
    if (q.type === "multi") root.append(el("p", "note", "People could pick several, so the bars add up to more than 100%."));
    const body = el("div", q.type === "text" ? "cloud" : "rows");
    root.append(body);

    const rows = [];
    if (q.type !== "text") {
      q.options.forEach((opt) => {
        const b = el("button", "row");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        const track = el("span", "track");
        const fill = el("span", "fill");
        const val = el("span", "val", "0");
        track.append(fill, val);
        b.append(el("span", "lab", opt), track);
        b.addEventListener("click", () => toggleFilter(q, opt));
        body.append(b);
        rows.push({ opt, b, fill, val });
      });
    }

    let sig = "";
    function update() {
      const votes = votesFor(q);
      const f = state.filter;
      root.classList.toggle("src", !!f && f.qid === q.id);
      lead.textContent = leaderOf(q, votes).full;

      if (q.type === "text") {
        const st = textStats(q, votes);
        const picked = f && f.qid === q.id ? f.value : null;
        const next = JSON.stringify([st.words.map((w) => [w, st.tally[w]]), picked]);
        if (next === sig) return;
        sig = next;
        body.textContent = "";
        if (!st.words.length) {
          body.append(el("p", "empty", "No answers yet."));
          return;
        }
        const top = st.tally[st.words[0]];
        st.words.slice(0, 60).forEach((w) => {
          const t = st.tally[w];
          const b = el("button", "word" + (t === top ? " top" : ""), w);
          b.type = "button";
          b.style.fontSize = ((big ? 1.5 : 1.1) + (t / top) * (big ? 3.4 : 2.2)).toFixed(2) + "rem";
          b.title = t + (t === 1 ? " answer" : " answers") + ". Click to filter.";
          b.setAttribute("aria-pressed", String(picked === w));
          b.addEventListener("click", () => toggleFilter(q, w));
          body.append(b);
        });
        return;
      }

      const st = choiceStats(q, votes);
      const order = rows.map((r, i) => i);
      if (state.sort) order.sort((a, b) => st.counts[b] - st.counts[a] || a - b);
      rows.forEach((r, i) => {
        const c = st.counts[i];
        const pct = st.answered ? Math.round((c / st.answered) * 100) : 0;
        r.fill.style.width = pct + "%";
        r.val.style.left = pct + "%";
        r.val.textContent = c ? c + " (" + pct + "%)" : "0";
        r.b.style.order = String(order.indexOf(i));
        r.b.classList.toggle("top", st.max > 0 && c === st.max);
        r.b.setAttribute("aria-pressed", String(!!f && f.qid === q.id && f.value === r.opt));
        r.b.setAttribute("aria-label", r.opt + ": " + c + " of " + st.answered + " people (" + pct + "%). Click to filter the other charts.");
      });
    }
    return { el: root, update };
  }

  function buildJoin() {
    const root = el("section", "join");
    const qr = el("div", "qr");
    const svg = C.qrSvg(pUrl, "QR code to join the poll");
    qr.append(svg || el("p", "empty", "QR code unavailable"));
    const side = el("div", "join-side");
    joinCountEl = el("p", "join-count", "");
    side.append(
      el("h2", "join-h", "Scan to join"),
      el("p", "join-p", "Point your phone camera at the code, or type this address:"),
      el("p", "url", shortUrl),
      joinCountEl
    );
    root.append(qr, side);
    return root;
  }

  /* ---------- page frame ---------- */

  const top = el("header", "top");
  const titleBox = el("div");
  const liveEl = el("div", "live");
  const liveText = el("span", null, "Connecting");
  liveEl.append(el("i"), liveText);
  titleBox.append(el("h1", null, title), liveEl);

  const tools = el("div", "tools");
  const seg = el("div", "seg");
  seg.setAttribute("role", "group");
  seg.setAttribute("aria-label", "View");
  const focusBtn = el("button", null, "Focus");
  const allBtn = el("button", null, "All charts");
  [focusBtn, allBtn].forEach((b) => { b.type = "button"; });
  seg.append(focusBtn, allBtn);
  const sortBtn = el("button", "tool", "Sort by votes");
  sortBtn.type = "button";
  const fsBtn = el("button", "tool", "Full screen");
  fsBtn.type = "button";
  tools.append(seg, sortBtn, fsBtn);
  top.append(titleBox, tools);

  const layout = el("div", "layout");
  const rail = el("aside", "rail");
  const countEl = el("div", "count", "0");
  countEl.setAttribute("aria-live", "polite");
  const countLabel = el("div", "count-label", "responses");
  const room = el("div", "room");
  room.setAttribute("aria-hidden", "true");
  const qlist = el("nav", "qlist");
  qlist.setAttribute("aria-label", "Questions");

  const items = [];
  function addItem(label, idx, q) {
    const b = el("button", "qitem");
    b.type = "button";
    const k = el("span", "k", label);
    const v = el("span", "v", "");
    b.append(k, v);
    b.addEventListener("click", () => {
      if (state.view === "all" && idx > 0) {
        const p = document.getElementById("panel-" + q.id);
        if (p) p.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      state.view = "focus";
      go(idx);
    });
    qlist.append(b);
    items.push({ b, v, idx, q });
  }
  addItem("Join the poll", 0, null);
  Q.forEach((q, i) => addItem(q.short || q.text, i + 1, q));

  const railFoot = el("div", "rail-foot");
  const copyBtn = el("button", "tool", "Copy participant link");
  const resetBtn = el("button", "tool danger", "Reset votes");
  [copyBtn, resetBtn].forEach((b) => { b.type = "button"; });
  const footMsg = el("div", "foot-msg", "");
  railFoot.append(copyBtn, resetBtn, footMsg);
  const countBox = el("div");
  countBox.append(countEl, countLabel);
  rail.append(countBox, room, qlist, railFoot);

  const stage = el("main", "stage");
  const filterBar = el("div", "filterbar");
  const content = el("div", "content");
  stage.append(filterBar, content);
  layout.append(rail, stage);
  app.append(top, layout);

  /* ---------- rendering ---------- */

  function renderContent() {
    content.textContent = "";
    cards = [];
    joinCountEl = null;
    focusBtn.setAttribute("aria-pressed", String(state.view === "focus"));
    allBtn.setAttribute("aria-pressed", String(state.view === "all"));
    if (state.idx === null) return;
    if (state.view === "all") {
      const grid = el("div", "grid");
      Q.forEach((q) => {
        const c = buildPanel(q, false);
        c.el.id = "panel-" + q.id;
        cards.push(c);
        grid.append(c.el);
      });
      content.append(grid);
    } else if (state.idx === 0) {
      content.append(buildJoin());
    } else {
      const c = buildPanel(Q[state.idx - 1], true);
      cards = [c];
      content.append(c.el);
    }
    updateAll();
  }

  function go(i) {
    if (i < 0 || i > Q.length) return;
    state.idx = i;
    renderContent();
  }

  function updateRoom() {
    const n = Math.min(state.votes.length, MAX_PIPS);
    while (pips.length < n) {
      const p = el("span", "pip fresh");
      room.append(p);
      pips.push(p);
    }
    while (pips.length > n) pips.pop().remove();
    state.votes.slice(0, n).forEach((v, i) => {
      const p = pips[i];
      p.classList.toggle("on", !!state.filter && matchesFilter(v));
      p.classList.toggle("off", !!state.filter && !matchesFilter(v));
    });
  }

  function updateRail() {
    items.forEach((it) => {
      if (it.idx === 0) {
        it.v.textContent = "Show the QR code";
      } else {
        it.v.textContent = leaderOf(it.q, votesFor(it.q)).short;
      }
      const current = state.view === "focus" && state.idx === it.idx;
      if (current) it.b.setAttribute("aria-current", "true");
      else it.b.removeAttribute("aria-current");
    });
  }

  function updateFilterBar() {
    filterBar.textContent = "";
    const f = state.filter;
    if (!f) {
      filterBar.append(el("span", null, "Click any bar or word to see who chose it. The other charts then show only those people."));
      return;
    }
    const q = qById[f.qid];
    const n = state.votes.filter(matchesFilter).length;
    const chip = el("span", "chip");
    chip.append(el("span", null, n + " of " + state.votes.length + " people: " + (q.short || q.text) + " is " + f.value));
    const clear = el("button", null, "Clear filter");
    clear.type = "button";
    clear.addEventListener("click", () => { state.filter = null; updateAll(); });
    chip.append(clear);
    filterBar.append(chip);
  }

  function updateAll() {
    const n = state.votes.length;
    countEl.textContent = String(n);
    countLabel.textContent = n === 1 ? "response" : "responses";
    if (state.prevCount >= 0 && n !== state.prevCount) {
      countEl.classList.remove("bump");
      void countEl.offsetWidth;
      countEl.classList.add("bump");
    }
    state.prevCount = n;
    sortBtn.setAttribute("aria-pressed", String(state.sort));
    updateRoom();
    updateRail();
    updateFilterBar();
    cards.forEach((c) => c.update());
    if (joinCountEl) {
      joinCountEl.textContent = n === 0 ? "Waiting for the first answer." : n + (n === 1 ? " person has" : " people have") + " answered so far.";
    }
  }

  /* ---------- controls ---------- */

  focusBtn.addEventListener("click", () => {
    if (state.idx === null) return;
    state.view = "focus";
    renderContent();
  });
  allBtn.addEventListener("click", () => {
    if (state.idx === null) return;
    state.view = "all";
    renderContent();
  });
  sortBtn.addEventListener("click", () => { state.sort = !state.sort; updateAll(); });
  fsBtn.addEventListener("click", () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (e) {}
  });

  document.addEventListener("keydown", (e) => {
    if (e.target && /^(input|textarea|select)$/i.test(e.target.tagName)) return;
    if (e.key === "Escape" && state.filter) {
      state.filter = null;
      updateAll();
    } else if (state.view === "focus" && state.idx !== null && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
      e.preventDefault();
      go(state.idx + 1);
    } else if (state.view === "focus" && state.idx !== null && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
      e.preventDefault();
      go(state.idx - 1);
    }
  });

  copyBtn.addEventListener("click", () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pUrl).then(
        () => { footMsg.textContent = "Participant link copied."; },
        () => { footMsg.textContent = pUrl; }
      );
    } else {
      footMsg.textContent = pUrl;
    }
  });

  resetBtn.addEventListener("click", () => {
    const pin = window.prompt('Enter the reset PIN to clear all votes for "' + code + '":');
    if (pin === null) return;
    fetch(C.api(code, "&action=reset"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin })
    })
      .then((r) => r.json().then((b) => ({ status: r.status, body: b })))
      .then((res) => {
        if (res.status === 200) {
          footMsg.textContent = "Votes cleared.";
          state.filter = null;
          lastText = "";
          load();
        } else if (res.body && res.body.error === "reset_not_configured") {
          footMsg.textContent = "Reset is not set up. Add a RESET_PIN in Netlify, or use a new client code for a clean start.";
        } else if (res.body && res.body.error === "wrong_pin") {
          footMsg.textContent = "Wrong PIN.";
        } else {
          footMsg.textContent = "Reset failed.";
        }
      })
      .catch(() => { footMsg.textContent = "Reset failed. Check your connection."; });
  });

  /* ---------- live data ---------- */

  function setLive(ok) {
    liveEl.classList.toggle("off", !ok);
    liveText.textContent = ok ? "Live, updates every few seconds" : "Connection issue, retrying";
  }

  let lastText = "";
  function load() {
    fetch(C.api(code), { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("status " + r.status);
        return r.text();
      })
      .then((text) => {
        setLive(true);
        if (text === lastText && state.idx !== null) return;
        lastText = text;
        const data = JSON.parse(text);
        state.votes = data.votes || [];
        if (state.idx === null) {
          state.idx = state.votes.length === 0 ? 0 : 1;
          renderContent();
        } else {
          updateAll();
        }
      })
      .catch(() => setLive(false));
  }

  load();
  setInterval(load, REFRESH_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
})();
