# Portail contact — Rémi Moreau

Portail de contact de Rémi Moreau, négociateur immobilier chez Pardo & Chartier by Le Pacte Immo (Marseille).

Site statique (HTML, CSS, JavaScript) hébergé sur Vercel ; ce dépôt GitHub en est la source. Les en-têtes de sécurité sont définis dans `vercel.json`.

## Données personnelles

- Le formulaire ne transmet rien : il prépare un message que le visiteur envoie lui-même par SMS, WhatsApp ou e-mail.
- Aucun cookie, aucun traceur, aucun appel à un site tiers au chargement (polices hébergées dans le dépôt).
- Une politique de sécurité (Content-Security-Policy) interdit à la page tout envoi de données vers un serveur.

Suivi de campagne : ajouter `?src=instagram&c=nom-campagne` au lien. L'origine apparaît en clair dans le message préparé.
