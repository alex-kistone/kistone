// Page pré-rendue servie pour une autre adresse (repli des espaces connectés) : on vide le
// contenu avant affichage, l'application le remplace aussitôt. Fichier séparé : la CSP du site
// interdit les scripts en ligne.
(function () {
  var r = document.getElementById("root"), p = r.getAttribute("data-prerendered");
  var here = location.pathname.replace(/\/+$/, "") || "/";
  if (p && p !== here) r.innerHTML = "";
})();
