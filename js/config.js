/* Chemins relatifs à index.html. Dossiers : rooms/A–D, shared, place.

   En local (dossier Dropbox), laissez mediaBase vide : les fichiers ./assets sont lus sur le disque.
   Sur GitHub Pages, coller le lien de partage Dropbox du dossier "assets"
   (visible par « toute personne disposant du lien »), sans les photos dans Git.
   Forme attendue : https://dl.dropboxusercontent.com/scl/fo/xxxxxxxx/yyyyyyyy/
   (remplacer www.dropbox.com par dl.dropboxusercontent.com, et ?dl=0 par rien ou ?raw=1)
*/
window.SITE_CONFIG = {
  contactEmail: "familleange+locatif@gmail.com",
  mediaBase: "",
  media: {
    place: {
      photos: [
        "assets/place/NE 1.jpg",
        "assets/place/NE 2.jpg",
        "assets/place/SO 1.jpg",
        "assets/place/SO 2.jpg",
      ],
    },
    a: {
      photos: [
        "assets/rooms/A/Nord 1.jpeg",
        "assets/rooms/A/Nord 2.jpeg",
        "assets/rooms/A/Nord 3.jpeg",
      ],
      video: "assets/rooms/A/VID20260818122708.mp4",
    },
    b: {
      photos: [
        "assets/rooms/B/IMG20260818123018.jpg",
        "assets/rooms/B/Est 1.jpeg",
        "assets/rooms/B/Est 2.jpeg",
      ],
      video: "assets/rooms/B/VID20260818123027.mp4",
    },
    c: {
      photos: ["assets/rooms/C/IMG20260818123006.jpg"],
      video: "assets/rooms/C/VID20260818122914.mp4",
    },
    d: {
      photos: [],
      video: "",
    },
    kitchen: {
      photos: [
        "assets/shared/kitchen/IMG20260818123202.jpg",
        "assets/shared/kitchen/IMG20260818123247.jpg",
        "assets/shared/kitchen/IMG20260818123239.jpg",
      ],
      video: "assets/shared/kitchen/VID20260818122518.mp4",
    },
    bathroom: {
      photos: ["assets/shared/bathroom/IMG20260818123225.jpg"],
      video: "assets/shared/bathroom/VID20260818122458.mp4",
    },
    toilets: {
      photos: ["assets/shared/toilets/IMG20260818123147.jpg"],
      video: "assets/shared/toilets/VID20260818122649.mp4",
    },
    hall: {
      photos: [],
      video: "assets/shared/hall.mp4",
    },
  },
};

window.assetUrl = function (path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = (window.SITE_CONFIG && window.SITE_CONFIG.mediaBase) || "";
  const encoded = String(path)
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  if (!base) return encoded;
  return base.replace(/\/+$/, "") + "/" + encoded;
};
