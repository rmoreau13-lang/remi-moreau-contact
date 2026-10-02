// Portail Rémi Moreau — rien à saisir : chaque bouton ouvre un message déjà rédigé
// que le visiteur envoie depuis son propre appareil (SMS, WhatsApp ou e-mail).
// Aucun appel réseau, aucun cookie, aucun stockage dans le navigateur.
(function () {
  var MOBILE = "+33609712791";
  var WHATSAPP = "https://wa.me/33609712791";
  var EMAIL = "remi@lepacteimmo.com";

  var root = document.documentElement;
  // Le SMS n'existe que sur un téléphone ou une tablette : ailleurs, « Être rappelé » ouvre un e-mail.
  var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia("(pointer:coarse)").matches);
  root.classList.add("js", mobile ? "is-mobile" : "is-desktop");

  // Origine de la visite : ?src=instagram&c=campagne (ou utm_source / utm_campaign).
  // Elle figure en clair dans le message : le visiteur la voit avant d'envoyer.
  function tag(v) { return (v || "").replace(/[^0-9A-Za-zÀ-ÿ _.\-]/g, "").slice(0, 40); }
  var qs = new URLSearchParams(location.search);
  var origine = [tag(qs.get("src") || qs.get("utm_source")), tag(qs.get("c") || qs.get("utm_campaign"))].filter(Boolean).join(" / ");

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
    if (kind === "mail") d.push("Mon numéro de téléphone : ");
    if (projet) d.push("Projet : " + projet);
    if (origine) d.push("Origine : " + origine);
    if (d.length) l = l.concat([""], d);
    l.push("", "Demande faite le " + two(n.getDate()) + "/" + two(n.getMonth() + 1) + "/" + n.getFullYear() +
      " à " + two(n.getHours()) + " h " + two(n.getMinutes()) + " depuis votre portail.");
    return l.join("\n");
  }

  function href(kind) {
    var text = message(kind);
    if (kind === "sms") return "sms:" + MOBILE + "?&body=" + encodeURIComponent(text);
    if (kind === "whatsapp") return WHATSAPP + "?text=" + encodeURIComponent(text);
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Demande de rappel — " + (projet || "projet immobilier")) +
      "&body=" + encodeURIComponent(text.replace(/\n/g, "\r\n"));
  }

  // Met à jour les liens d'envoi avec le projet choisi et l'heure courante.
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-send]"));
  function refresh() {
    links.forEach(function (a) {
      var k = a.getAttribute("data-send");
      a.href = href(k === "rappel" ? (mobile ? "sms" : "mail") : k);
    });
  }
  // Au clic, le lien est remis à jour (heure exacte) avant que l'application du visiteur ne s'ouvre.
  links.forEach(function (a) { a.addEventListener("click", refresh); });
  refresh();

  // La barre du bas n'apparaît que lorsque les boutons du haut ne sont plus à l'écran.
  var bar = document.querySelector(".bar"), actions = document.querySelector(".actions");
  if (bar && actions) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        bar.classList.toggle("on", !e[e.length - 1].isIntersecting);
      }).observe(actions);
    } else {
      bar.classList.add("on");
    }
  }
})();
