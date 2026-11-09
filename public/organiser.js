// Organiser page: builds the two links for a client code and session title.
(function () {
  var C = window.PollCommon;
  var codeEl = document.getElementById("code");
  var titleEl = document.getElementById("title");
  var pEl = document.getElementById("plink");
  var rEl = document.getElementById("rlink");
  var msg = document.getElementById("msg");

  function make(page, code, title) {
    var u = new URL(page, location.href);
    u.search = "";
    u.searchParams.set("c", code);
    if (title) u.searchParams.set("t", title);
    return u.toString();
  }

  function update() {
    var code = C.normaliseCode(codeEl.value);
    var title = titleEl.value.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!code) {
      pEl.value = "";
      rEl.value = "";
      msg.textContent = "Enter a client code to see your links.";
      return;
    }
    pEl.value = make("index.html", code, title);
    rEl.value = make("results.html", code, title);
    msg.textContent = code !== codeEl.value.trim().toLowerCase() ? 'Your code will be used as "' + code + '".' : "";
  }

  function copy(input, label) {
    if (!input.value) return;
    input.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(input.value).then(
        function () { msg.textContent = label + " link copied."; },
        function () { msg.textContent = "Press and hold the link to copy it."; }
      );
    } else {
      document.execCommand("copy");
      msg.textContent = label + " link copied.";
    }
  }

  codeEl.addEventListener("input", update);
  titleEl.addEventListener("input", update);
  document.getElementById("pcopy").addEventListener("click", function () { copy(pEl, "Participant"); });
  document.getElementById("rcopy").addEventListener("click", function () { copy(rEl, "Results"); });
  update();
})();
