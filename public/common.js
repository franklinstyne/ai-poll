// Small helpers shared by the participant, results and organiser pages.
(function () {
  var memoryId = null;

  function randomId() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    var s = "";
    for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
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
    }
  };
})();
