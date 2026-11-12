(function () {
  var FORM_RESPONSE_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdM5Zbx-uNCSKBIDTcS56zQAPODF8HSmRPSW7wWn4pLW8hOrQ/formResponse";
  var FORM_ENTRIES = {
    type: "entry.650936012",
    title: "entry.1847178783",
    description: "entry.1287888075",
    email: "entry.189203274",
  };

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var submitBtn = document.getElementById("contactSubmitBtn");
    var status = document.getElementById("contactStatus");

    function showStatus(text) {
      status.hidden = false;
      status.textContent = text;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = document.getElementById("contactTitle").value.trim();
      var description = document.getElementById("contactDescription").value.trim();

      if (!title || !description) {
        showStatus(status.dataset.msgMissing);
        return;
      }

      submitBtn.disabled = true;

      // Stesso Google Form per ForceKIT e ForceKIT Space: il prodotto (data-product sul modulo) va
      // davanti al titolo. Il tipo resta uno dei valori del modulo, che altrimenti potrebbe scartarlo.
      var product = (form.dataset.product || "").trim();
      if (product) title = "[" + product + "] " + title;

      fetch(FORM_RESPONSE_URL, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams({
          [FORM_ENTRIES.type]: document.getElementById("contactType").value,
          [FORM_ENTRIES.title]: title,
          [FORM_ENTRIES.description]: description,
          [FORM_ENTRIES.email]: document.getElementById("contactEmail").value.trim(),
        }),
      })
        .then(function () {
          showStatus(status.dataset.msgSuccess);
          form.reset();
        })
        .catch(function () {
          showStatus(status.dataset.msgError);
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  });
})();
