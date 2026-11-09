// Participant page: shows the questions and sends one vote.
(function () {
  var C = window.PollCommon;
  var Q = window.POLL_QUESTIONS;
  var params = new URLSearchParams(location.search);
  var code = C.normaliseCode(params.get("c") || "");
  var app = document.getElementById("app");
  var title = C.title(params);

  document.title = title;
  app.textContent = "";
  app.appendChild(C.el("h1", null, title));

  if (!code) {
    app.appendChild(C.el("p", "sub", "This link is missing its poll code. Please ask your trainer for the full link."));
    return;
  }

  app.appendChild(C.el("p", "sub", "Takes about two minutes. Your answers are anonymous."));

  var form = document.createElement("form");
  form.noValidate = true;
  app.appendChild(form);

  var errorEl = C.el("p", "error", "");
  errorEl.setAttribute("role", "alert");
  var submitBtn = C.el("button", null, "Submit my answers");
  submitBtn.type = "submit";
  var submitRow = C.el("div", "submit-row");
  submitRow.appendChild(submitBtn);
  submitRow.appendChild(errorEl);

  function buildForm(saved) {
    form.textContent = "";
    Q.forEach(function (q, i) {
      var fs = C.el("fieldset", "q");
      fs.appendChild(C.el("legend", "q-legend", i + 1 + ". " + q.text));
      if (q.hint) fs.appendChild(C.el("p", "hint", q.hint));

      if (q.type === "text") {
        var input = document.createElement("input");
        input.type = "text";
        input.name = q.id;
        input.className = "text-input";
        input.maxLength = q.maxLength || 30;
        input.placeholder = q.placeholder || "";
        input.autocomplete = "off";
        input.setAttribute("aria-label", q.text);
        if (saved && typeof saved[q.id] === "string") input.value = saved[q.id];
        fs.appendChild(input);
      } else {
        var picked = saved ? saved[q.id] : null;
        var pickedList = Array.isArray(picked) ? picked : picked ? [picked] : [];
        q.options.forEach(function (opt) {
          var lab = C.el("label", "opt");
          var inp = document.createElement("input");
          inp.type = q.type === "multi" ? "checkbox" : "radio";
          inp.name = q.id;
          inp.value = opt;
          if (pickedList.indexOf(opt) >= 0) inp.checked = true;
          lab.appendChild(inp);
          lab.appendChild(C.el("span", null, opt));
          fs.appendChild(lab);
        });
      }
      form.appendChild(fs);
    });
    form.appendChild(submitRow);
  }

  function collect() {
    var answers = {};
    var firstMissing = null;
    Q.forEach(function (q, i) {
      var fs = form.querySelectorAll("fieldset.q")[i];
      if (q.type === "text") {
        var v = form.elements[q.id].value.replace(/\s+/g, " ").trim();
        if (v) answers[q.id] = v;
        else if (q.required && !firstMissing) firstMissing = fs;
        return;
      }
      var checked = form.querySelectorAll('input[name="' + q.id + '"]:checked');
      var vals = [];
      checked.forEach(function (c) { vals.push(c.value); });
      if (vals.length === 0) {
        if (!firstMissing) firstMissing = fs;
        return;
      }
      answers[q.id] = q.type === "multi" ? vals : vals[0];
    });
    return { answers: answers, missing: firstMissing };
  }

  function showThanks(answers) {
    app.textContent = "";
    app.appendChild(C.el("h1", null, title));
    var card = C.el("div", "card thanks");
    card.appendChild(C.el("h2", null, "Thank you"));
    card.appendChild(C.el("p", "sub", "Your answers have been received. Watch the main screen for the results."));
    var edit = C.el("button", "ghost", "Change my answers");
    edit.type = "button";
    edit.addEventListener("click", function () {
      app.textContent = "";
      app.appendChild(C.el("h1", null, title));
      app.appendChild(C.el("p", "sub", "Update your answers and submit again. You will not be counted twice."));
      app.appendChild(form);
      buildForm(answers);
    });
    card.appendChild(edit);
    app.appendChild(card);
    window.scrollTo(0, 0);
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    errorEl.textContent = "";
    var res = collect();
    if (res.missing) {
      errorEl.textContent = "Please answer every question before submitting.";
      res.missing.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    fetch(C.api(code), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ voter: C.voterId(code), answers: res.answers })
    })
      .then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        C.saveAnswers(code, res.answers);
        showThanks(res.answers);
      })
      .catch(function () {
        errorEl.textContent = "Could not send your answers. Please check your connection and try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit my answers";
      });
  });

  buildForm(C.loadSaved(code));
})();
