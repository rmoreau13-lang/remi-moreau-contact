// Portail Rémi Moreau — le formulaire ne transmet rien lui-même : il prépare un message
// que le visiteur envoie depuis son propre appareil (SMS, WhatsApp ou e-mail).
// Aucun appel réseau, aucun cookie, aucun stockage dans le navigateur.
(function () {
  var MOBILE = "+33609712791";
  var WHATSAPP = "https://wa.me/33609712791";
  var EMAIL = "remi@lepacteimmo.com";

  function $(id) { return document.getElementById(id); }
  var dlg = $("dlg"), form = $("lead"), done = $("done"), err = $("err");
  var projet = $("projet"), invest = $("invest");
  var channels = {
    sms: { label: "SMS", links: [$("by-sms"), $("again-sms")] },
    whatsapp: { label: "WhatsApp", links: [$("by-wa"), $("again-wa")] },
    mail: { label: "e-mail", links: [$("by-mail"), $("again-mail")] }
  };

  // Origine de la visite : ?src=instagram&c=campagne (ou utm_source / utm_campaign).
  // Elle figure en clair dans le message : le visiteur la voit avant d'envoyer.
  function tag(v) { return (v || "").replace(/[^0-9A-Za-zÀ-ÿ _.\-]/g, "").slice(0, 40); }
  var qs = new URLSearchParams(location.search);
  var origine = [tag(qs.get("src") || qs.get("utm_source")), tag(qs.get("c") || qs.get("utm_campaign"))].filter(Boolean).join(" / ");

  // Le SMS n'est proposé que sur un téléphone ou une tablette.
  var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia("(pointer:coarse)").matches);
  if (!mobile) {
    channels.sms.links.forEach(function (a) { a.hidden = true; });
    $("by-wa").className = "btn primary";
  }

  function val(id) { return $(id).value.trim(); }
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function syncInvest() { invest.hidden = projet.value !== "Investir"; }

  function collect() {
    var slot = form.querySelector('input[name="creneau"]:checked');
    var inv = projet.value === "Investir";
    return {
      prenom: val("prenom"), tel: val("tel"), creneau: slot ? slot.value : "", projet: projet.value,
      quartier: val("quartier"), budget: inv ? val("budget") : "", rdt: inv ? val("rdt") : ""
    };
  }

  function missing(d) {
    var m = [];
    if (!d.prenom) m.push("votre prénom");
    if (d.tel.replace(/\D/g, "").length < 9) m.push("un numéro de téléphone valide");
    if (!d.creneau) m.push("un créneau");
    if (!d.projet) m.push("votre projet");
    return m;
  }

  // Le message contient tout ce qui est transmis, et rien d'autre.
  function message(d) {
    var n = new Date(), l = [];
    if (d.creneau === "Tout de suite") l.push("À RAPPELER TOUT DE SUITE");
    l.push("Bonjour Rémi, je vous demande de me rappeler au sujet de mon projet immobilier.", "");
    [
      ["Prénom", d.prenom], ["Téléphone", d.tel], ["Créneau", d.creneau], ["Projet", d.projet],
      ["Quartier ou commune", d.quartier],
      ["Budget", d.budget && d.budget.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €"],
      ["Rendement net visé", d.rdt && d.rdt.replace(".", ",") + " %"],
      ["Origine", origine]
    ].forEach(function (p) { if (p[1]) l.push(p[0] + " : " + p[1]); });
    l.push("", "Demande faite le " + two(n.getDate()) + "/" + two(n.getMonth() + 1) + "/" + n.getFullYear() +
      " à " + two(n.getHours()) + " h " + two(n.getMinutes()) + " depuis votre portail.");
    return l.join("\n");
  }

  // Met à jour les trois liens d'envoi avec le message courant.
  function refresh() {
    var d = collect(), text = message(d), enc = encodeURIComponent(text);
    var subject = "Demande de rappel — " + (d.projet || "projet immobilier") + (d.prenom ? " — " + d.prenom : "") +
      (d.creneau === "Tout de suite" ? " — À RAPPELER TOUT DE SUITE" : "");
    var href = {
      sms: "sms:" + MOBILE + "?&body=" + enc,
      whatsapp: WHATSAPP + "?text=" + enc,
      mail: "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text.replace(/\n/g, "\r\n"))
    };
    Object.keys(channels).forEach(function (k) {
      channels[k].links.forEach(function (a) { a.href = href[k]; });
    });
    return { d: d, text: text };
  }

  function showForm() { form.hidden = false; done.hidden = true; }
  function showDone(k, text) {
    form.hidden = true; done.hidden = false;
    $("done-text").textContent = "Il s'est ouvert dans votre application " + channels[k].label +
      " : appuyez sur « Envoyer » pour que Rémi le reçoive.";
    $("preview").textContent = text;
    $("copy").textContent = "Copier le message";
  }

  // Clic sur un moyen d'envoi : on vérifie la saisie, puis le lien ouvre l'application du visiteur.
  function onSend(k) {
    return function (e) {
      var r = refresh(), m = missing(r.d);
      if (m.length) {
        e.preventDefault();
        showForm();
        err.textContent = "Il manque " + m.join(", ") + ".";
        err.hidden = false;
        return;
      }
      err.hidden = true;
      window.setTimeout(function () { showDone(k, r.text); }, 400);
    };
  }
  Object.keys(channels).forEach(function (k) {
    channels[k].links.forEach(function (a) { a.addEventListener("click", onSend(k)); });
  });

  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  projet.addEventListener("change", syncInvest);

  $("copy").addEventListener("click", function () {
    var btn = this, pre = $("preview");
    function ok() { btn.textContent = "Message copié"; }
    function manual() {
      var r = document.createRange(), s = window.getSelection();
      r.selectNodeContents(pre); s.removeAllRanges(); s.addRange(r);
      btn.textContent = "Message sélectionné : copiez-le";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.textContent).then(ok, manual);
    else manual();
  });

  function openDialog(p) {
    showForm(); err.hidden = true;
    if (p) projet.value = p;
    syncInvest(); refresh();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    $("prenom").focus();
  }
  function closeDialog() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }

  document.querySelectorAll("[data-open]").forEach(function (b) {
    b.addEventListener("click", function () { openDialog(b.getAttribute("data-open")); });
  });
  $("close").addEventListener("click", closeDialog);
  $("close2").addEventListener("click", closeDialog);
  $("edit").addEventListener("click", showForm);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(); });
})();
