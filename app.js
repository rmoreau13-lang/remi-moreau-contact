// Portail Rémi Moreau — quatre champs (nom, prénom, téléphone, e-mail), puis un bouton ouvre
// un message déjà rédigé que le visiteur envoie depuis son propre appareil (SMS, WhatsApp ou e-mail).
// Aucun appel réseau, aucun cookie, aucun stockage dans le navigateur.
(function () {
  var MOBILE = "+33609712791";
  var WHATSAPP = "https://wa.me/33609712791";
  var EMAIL = "remi@lepacteimmo.com";

  function $(id) { return document.getElementById(id); }
  var root = document.documentElement;
  // Le SMS n'existe que sur un téléphone ou une tablette : ailleurs, « Être rappelé » ouvre un e-mail.
  var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia("(pointer:coarse)").matches);
  root.classList.add("js", mobile ? "is-mobile" : "is-desktop");

  // Origine de la visite : ?src=instagram&c=campagne (ou utm_source / utm_campaign).
  // Elle figure en clair dans le message : le visiteur la voit avant d'envoyer.
  function tag(v) { return (v || "").replace(/[^0-9A-Za-zÀ-ÿ _.\-]/g, "").slice(0, 40); }
  var qs = new URLSearchParams(location.search);
  var origine = [tag(qs.get("src") || qs.get("utm_source")), tag(qs.get("c") || qs.get("utm_campaign"))].filter(Boolean).join(" / ");

  // Les quatre informations demandées, toutes nécessaires.
  var FIELDS = [
    { id: "nom", label: "Nom", miss: "votre nom", ok: function (v) { return v.length > 0; } },
    { id: "prenom", label: "Prénom", miss: "votre prénom", ok: function (v) { return v.length > 0; } },
    { id: "tel", label: "Téléphone", miss: "un numéro de téléphone valide", ok: function (v) { return v.replace(/\D/g, "").length >= 9; } },
    { id: "email", label: "E-mail", miss: "une adresse e-mail valide", ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); } }
  ];
  function val(id) { return $(id).value.trim(); }
  function invalid() { return FIELDS.filter(function (f) { return !f.ok(val(f.id)); }); }
  function missing(bad) {
    var m = bad.map(function (f) { return f.miss; });
    return "Il manque " + (m.length > 1 ? m.slice(0, -1).join(", ") + " et " + m[m.length - 1] : m[0]) + ".";
  }

  // Projet choisi d'un geste (facultatif) : un seul à la fois, un second appui le retire.
  var projet = "";
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var on = c.getAttribute("aria-pressed") === "true";
      chips.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
      if (!on) c.setAttribute("aria-pressed", "true");
      projet = on ? "" : c.getAttribute("data-projet");
      refresh();
    });
  });

  function two(n) { return (n < 10 ? "0" : "") + n; }

  // Le message contient tout ce qui est transmis, et rien d'autre.
  function message(kind) {
    var n = new Date(), l = [], d = [];
    l.push(kind === "whatsapp"
      ? "Bonjour Rémi, je vous écris au sujet de mon projet immobilier. Vous pouvez me répondre ici ou me rappeler à ce numéro."
      : "Bonjour Rémi, je vous demande de me rappeler au sujet de mon projet immobilier.");
    FIELDS.forEach(function (f) { if (val(f.id)) d.push(f.label + " : " + val(f.id)); });
    if (projet) d.push("Projet : " + projet);
    if (origine) d.push("Origine : " + origine);
    if (d.length) l = l.concat([""], d);
    l.push("", "Demande faite le " + two(n.getDate()) + "/" + two(n.getMonth() + 1) + "/" + n.getFullYear() +
      " à " + two(n.getHours()) + " h " + two(n.getMinutes()) + " depuis votre portail.");
    return l.join("\n");
  }

  function href(kind) {
    var text = message(kind), qui = (val("prenom") + " " + val("nom")).trim();
    if (kind === "sms") return "sms:" + MOBILE + "?&body=" + encodeURIComponent(text);
    if (kind === "whatsapp") return WHATSAPP + "?text=" + encodeURIComponent(text);
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Demande de rappel — " + (projet || "projet immobilier") + (qui ? " — " + qui : "")) +
      "&body=" + encodeURIComponent(text.replace(/\n/g, "\r\n"));
  }

  // Met à jour les liens d'envoi avec la saisie, le projet choisi et l'heure courante.
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-send]"));
  function channel(a) { var k = a.getAttribute("data-send"); return k === "rappel" ? (mobile ? "sms" : "mail") : k; }
  function refresh() { links.forEach(function (a) { a.href = href(channel(a)); }); }

  var form = $("lead"), err = $("err"), sent = $("sent");
  function mark(bad) {
    FIELDS.forEach(function (f) {
      if (bad.indexOf(f) >= 0) $(f.id).setAttribute("aria-invalid", "true"); else $(f.id).removeAttribute("aria-invalid");
    });
  }

  // Clic sur un moyen d'envoi : on vérifie la saisie, puis le lien ouvre l'application du visiteur.
  function send(e) {
    var bad = invalid();
    mark(bad);
    sent.hidden = true;
    if (bad.length) {
      e.preventDefault();
      err.textContent = missing(bad);
      err.hidden = false;
      $(bad[0].id).focus();
      return;
    }
    err.hidden = true;
    refresh();
    var k = channel(e.currentTarget);
    sent.textContent = "Dernière étape : envoyez le message ouvert dans " + (k === "whatsapp" ? "WhatsApp" : k === "sms" ? "votre application SMS" : "votre messagerie") + ".";
    sent.hidden = false;
  }
  links.forEach(function (a) { a.addEventListener("click", send); });

  // Pendant la saisie : liens à jour, et le message d'erreur disparaît dès que tout est rempli.
  form.addEventListener("input", function () {
    refresh();
    if (!err.hidden) {
      var bad = invalid();
      mark(bad);
      if (bad.length) err.textContent = missing(bad); else err.hidden = true;
    }
  });
  // Touche « Entrée » du clavier : champ suivant ; dans le dernier champ, même effet que « Être rappelé ».
  form.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.isComposing) return;
    var i = FIELDS.map(function (f) { return f.id; }).indexOf(e.target.id);
    if (i < 0) return;
    e.preventDefault();
    if (i < FIELDS.length - 1) $(FIELDS[i + 1].id).focus(); else links[0].click();
  });
  // La page n'envoie jamais le formulaire elle-même.
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  refresh();

  // La barre du bas n'apparaît qu'une fois les boutons du haut dépassés (ils sont alors au-dessus de l'écran).
  var bar = document.querySelector(".bar"), actions = document.querySelector(".actions");
  function sync() { bar.classList.toggle("on", actions.getBoundingClientRect().bottom < 0); }
  if (bar && actions) {
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  }
})();
