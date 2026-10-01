// Portail Rémi Moreau — envoi des demandes par e-mail (FormSubmit) + relais WhatsApp.
(function () {
  var EMAIL_ENDPOINT = "https://formsubmit.co/ajax/remi@lepacteimmo.com";
  var WHATSAPP = "https://wa.me/33609712791";

  var dlg = document.getElementById("dlg");
  var form = document.getElementById("lead");
  var done = document.getElementById("done");
  var err = document.getElementById("err");
  var send = document.getElementById("send");
  var projet = document.getElementById("projet");
  var invest = document.getElementById("invest");
  var wa = document.getElementById("wa");

  // Origine de la visite : ?src=instagram&c=campagne (ou utm_source / utm_campaign)
  var qs = new URLSearchParams(location.search);
  var source = qs.get("src") || qs.get("utm_source") || "";
  var campagne = qs.get("c") || qs.get("utm_campaign") || "";

  function syncInvest() { invest.hidden = projet.value !== "Investir"; }
  projet.addEventListener("change", syncInvest);

  function openDialog(p) {
    form.hidden = false; done.hidden = true; err.hidden = true;
    projet.value = p || "";
    syncInvest();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    document.getElementById("prenom").focus();
  }
  function closeDialog() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }

  document.querySelectorAll("[data-open]").forEach(function (b) {
    b.addEventListener("click", function () { openDialog(b.getAttribute("data-open")); });
  });
  document.getElementById("close").addEventListener("click", closeDialog);
  document.getElementById("close2").addEventListener("click", closeDialog);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(); });

  function val(id) { return document.getElementById(id).value.trim(); }

  function collect() {
    var slot = form.querySelector('input[name="Créneau"]:checked');
    var d = {
      "Prénom": val("prenom"),
      "Téléphone": val("tel"),
      "Créneau": slot ? slot.value : "",
      "Projet": projet.value,
      "Quartier ou commune": val("quartier")
    };
    if (projet.value === "Investir") {
      if (val("budget")) d["Budget (€)"] = val("budget");
      if (val("rdt")) d["Rendement net visé (%)"] = val("rdt");
    }
    if (source) d["Origine"] = source;
    if (campagne) d["Campagne"] = campagne;
    return d;
  }

  function whatsappText(d) {
    var l = ["Bonjour Rémi, je souhaite être rappelé(e).", ""];
    Object.keys(d).forEach(function (k) {
      if (d[k] && k !== "Origine" && k !== "Campagne") l.push(k + " : " + d[k]);
    });
    return l.join("\n");
  }

  function showDone(ok, d) {
    wa.href = WHATSAPP + "?text=" + encodeURIComponent(whatsappText(d));
    form.hidden = true; done.hidden = false;
    document.getElementById("done-title").textContent = ok ? "Demande envoyée" : "L'envoi par e-mail n'a pas abouti";
    document.getElementById("done-title").style.color = ok ? "" : "var(--err)";
    document.getElementById("done-text").textContent = ok
      ? "Merci " + d["Prénom"] + ". Votre demande est partie par e-mail à Rémi Moreau. Vous pouvez aussi la lui envoyer sur WhatsApp."
      : "Votre demande n'a pas pu partir par e-mail. Envoyez-la sur WhatsApp avec le bouton ci-dessous, ou appelez le 06 09 71 27 91.";
    wa.textContent = ok ? "Envoyer aussi sur WhatsApp" : "Envoyer sur WhatsApp";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = collect();
    var miss = [];
    if (!d["Prénom"]) miss.push("votre prénom");
    if (d["Téléphone"].replace(/\D/g, "").length < 9) miss.push("un numéro de téléphone valide");
    if (!d["Créneau"]) miss.push("un créneau");
    if (!d["Projet"]) miss.push("votre projet");
    if (miss.length) { err.textContent = "Il manque " + miss.join(", ") + "."; err.hidden = false; return; }
    err.hidden = true;

    // Piège à robots : champ invisible, jamais rempli par une personne.
    if (document.getElementById("site").value) { showDone(true, d); return; }

    var payload = Object.assign({}, d, {
      _subject: "Portail contact — " + d["Projet"] + " — " + d["Prénom"] + (d["Créneau"] === "Tout de suite" ? " — À RAPPELER TOUT DE SUITE" : ""),
      _template: "table",
      _captcha: "false"
    });

    send.disabled = true; send.textContent = "Envoi en cours…";
    fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (j) { return r.ok && String(j.success) === "true"; }); })
      .catch(function () { return false; })
      .then(function (ok) {
        send.disabled = false; send.textContent = "Être rappelé";
        showDone(ok, d);
        if (ok) form.reset();
      });
  });
})();
