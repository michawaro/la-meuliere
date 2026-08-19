# La Meulière — Bures-sur-Yvette

Site vitrine de 4 chambres étudiantes. Les photos et films restent dans Dropbox : le dépôt GitHub ne les contient pas, pour rester léger.

## En local

Ouvrir `index.html` depuis le dossier Dropbox. `mediaBase` est vide : les fichiers de `assets/` sont lus sur le disque.

## Sur GitHub Pages

1. Partager le dossier `assets` dans Dropbox (lien « toute personne disposant du lien »).
2. Transformer le lien :
   - `www.dropbox.com` → `dl.dropboxusercontent.com`
   - retirer `?dl=0` (ou le remplacer par `?raw=1` selon le type de lien)
3. Coller l’URL du dossier dans `js/config.js`, propriété `mediaBase` (avec un `/` à la fin).

Le navigateur du visiteur charge alors les images depuis Dropbox. GitHub ne les stocke pas.

Si un fichier ne s’affiche pas, créer un lien de partage pour ce fichier et coller l’URL complète (qui commence par `https://`) à la place du chemin `assets/...` dans `js/config.js`.

## Pages

Dans le dépôt GitHub : Settings → Pages → Branch `main`, dossier `/` (racine).
