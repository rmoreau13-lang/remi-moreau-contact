// L'ancienne adresse renvoie vers la nouvelle en conservant la page et les paramètres (?src=…).
(function () {
  var NEW = "https://remi-moreau-contact.vercel.app/";
  var page = location.pathname.split("/").pop();
  if (!/^(confidentialite|mentions)\.html$/.test(page)) page = "";
  location.replace(NEW + page + location.search + location.hash);
})();
