/* Chemins relatifs à index.html. Médias : assets-optimized-web/assets/ */
window.SITE_CONFIG = {
  contactEmail: "familleange+locatif@gmail.com",
  mediaBase: "",
  availRepo: "michawaro/la-meuliere",
  availPath: "data/availability.json",
  adminVault: "data/admin-vault.json",
  availGist: "484cee76e7f8cf108e3d40a3da9ed4d8",
  media: {
    place: {
      photos: [
        "assets-optimized-web/assets/place/NE 1.webp",
        "assets-optimized-web/assets/place/NE 2.webp",
        "assets-optimized-web/assets/place/SO 1.webp",
        "assets-optimized-web/assets/place/SO 2.webp",
      ],
    },
    a: {
      photos: [
        "assets-optimized-web/assets/rooms/A/Nord 1.webp",
        "assets-optimized-web/assets/rooms/A/Nord 2.webp",
        "assets-optimized-web/assets/rooms/A/Nord 3.webp",
      ],
      video: "assets-optimized-web/assets/rooms/A/VID20260818122708.mp4",
    },
    b: {
      photos: [
        "assets-optimized-web/assets/rooms/B/IMG20260818123018.webp",
        "assets-optimized-web/assets/rooms/B/Est 1.webp",
        "assets-optimized-web/assets/rooms/B/Est 2.webp",
      ],
      video: "assets-optimized-web/assets/rooms/B/VID20260818123027.mp4",
    },
    c: {
      photos: ["assets-optimized-web/assets/rooms/C/IMG20260818123006.webp"],
      video: "assets-optimized-web/assets/rooms/C/VID20260818122914.mp4",
    },
    d: {
      photos: [],
      video: "",
    },
    kitchen: {
      photos: [
        "assets-optimized-web/assets/shared/kitchen/IMG20260818123202.webp",
        "assets-optimized-web/assets/shared/kitchen/IMG20260818123247.webp",
        "assets-optimized-web/assets/shared/kitchen/IMG20260818123239.webp",
      ],
      video: "assets-optimized-web/assets/shared/kitchen/VID20260818122518.mp4",
    },
    bathroom: {
      photos: ["assets-optimized-web/assets/shared/bathroom/IMG20260818123225.webp"],
      video: "assets-optimized-web/assets/shared/bathroom/VID20260818122458.mp4",
    },
    toilets: {
      photos: ["assets-optimized-web/assets/shared/toilets/IMG20260818123147.webp"],
      video: "assets-optimized-web/assets/shared/toilets/VID20260818122649.mp4",
    },
    hall: {
      photos: [],
      video: "assets-optimized-web/assets/shared/hall.mp4",
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
