import { withBase } from "../lib/base.js";

/** Photoshoot galleries — homepage interactive pool + per-type lightbox. */
export const PHOTOSHOOT = {
  portrait: {
    id: "portrait",
    title: "People",
    src: withBase("/photoshoot/portrait/p01.jpg"),
    gallery: [
      "/photoshoot/portrait/p01.jpg",
      "/photoshoot/portrait/p02.jpg",
      "/photoshoot/portrait/p03.jpg",
      "/photoshoot/portrait/p04.jpg",
    ].map(withBase),
  },
  landscape: {
    id: "landscape",
    title: "Landscape",
    src: withBase("/photoshoot/landscape/l01.jpg"),
    gallery: [
      "/photoshoot/landscape/l01.jpg",
      "/photoshoot/landscape/l02.jpg",
      "/photoshoot/landscape/l03.jpg",
      "/photoshoot/landscape/l04.jpg",
      "/photoshoot/landscape/l05.jpg",
      "/photoshoot/landscape/l06.jpg",
      "/photoshoot/landscape/l07.jpg",
    ].map(withBase),
  },
};
