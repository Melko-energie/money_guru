# server — à définir

Money Guru v1 tourne **entièrement dans le navigateur** : les données sont dans le
`localStorage`, aucun appel réseau, aucun compte.

Ce dossier reste vierge tant qu'il n'y a pas de vision backend. Le proxy est déjà
câblé côté Vite (`/api` → `http://127.0.0.1:3012`) si un jour on veut :

- synchroniser un profil entre plusieurs appareils,
- historiser les relevés mois par mois,
- servir des hypothèses de rendement à jour.

Créneau de ports réservé : **3012** (dev backend).
