// Organiser page: builds the links and the QR code for a client code and session title.
(function () {
  var C = window.PollCommon;
  var codeEl = document.getElementById("code");
  var titleEl = document.getElementById("title");
  var pEl = document.getElementById("plink");
  var rEl = document.getElementById("rlink");
  var rOpen = document.getElementById("ropen");
  var qrBox = document.getElementById("qrbox");
  var qrHost = document.getElementById("qr");
  var qrBtn = document.getElementById("qrdl");
  var msg = document.getElementById("msg");
  var KEY = "poll-organiser-last";

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) {
      codeEl.value = saved.code || "";
      titleEl.value = saved.title || "";
    }
  } catch (e) {}

  function update() {
    var code = C.normaliseCode(codeEl.value);
    var title = titleEl.value.replace(/\s+/g, " ").trim().slice(0, 80);
    qrHost.textContent = "";
    if (!code) {
      pEl.value = "";
      rEl.value = "";
      rOpen.removeAttribute("href");
      qrBox.hidden = true;
      msg.textContent = "Enter a client code to see your links.";
      return;
    }
    pEl.value = C.participantUrl(code, title);
    rEl.value = C.resultsUrl(code, title);
    rOpen.href = rEl.value;
    var svg = C.qrSvg(pEl.value, "QR code for the poll link");
    if (svg) {
      qrHost.appendChild(svg);
      qrBox.hidden = false;
    } else {
      qrBox.hidden = true;
    }
    msg.textContent = code !== codeEl.value.trim().toLowerCase() ? 'Your code will be used as "' + code + '".' : "";
    try { localStorage.setItem(KEY, JSON.stringify({ code: codeEl.value, title: titleEl.value })); } catch (e) {}
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
  qrBtn.addEventListener("click", function () {
    var code = C.normaliseCode(codeEl.value);
    if (!code) return;
    C.qrDownload(pEl.value, "poll-qr-" + code + ".png", function () {
      msg.textContent = "QR code downloaded.";
    });
  });
  update();
})();
