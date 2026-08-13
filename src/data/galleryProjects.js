import { withBase } from "../lib/base.js";

const PROJECTS = [
  {
    id: "zawa",
    title: "Zawa",
    category: "Branding",
    src: "/projects/zawa-cover.png",
  },
  {
    id: "pebble",
    title: "Pebble",
    category: "Branding",
    src: "/projects/pebble-cover.png",
  },
  {
    id: "curva",
    title: "CURVa",
    category: "Branding",
    src: "/projects/curva-cover.png",
  },
  {
    id: "jamesjean",
    title: "James Jean",
    category: "Branding",
    src: "/projects/jamesjean-cover.png",
  },
  {
    id: "maann-studio",
    title: "Maann Studio",
    category: "Campaign",
    src: "/projects/maann-studio-cover.png",
  },
  {
    id: "maison-margiela",
    title: "Maison Margiela",
    category: "Campaign",
    src: "/projects/maison-margiela-cover.png",
  },
  {
    id: "lan",
    title: "LAN",
    category: "Campaign",
    src: "/projects/lan-cover.png",
  },
  {
    id: "cbgl",
    title: "CBGL",
    category: "Campaign",
    src: "/projects/cbgl-cover.png",
  },
  {
    id: "dreamcore",
    title: "Dreamcore Magazine",
    category: "Editorial",
    src: "/projects/dreamcore-magazine-cover.png",
  },
  {
    id: "vitra",
    title: "vitra.",
    category: "Editorial",
    src: "/projects/vitra-cover.png",
  },
  {
    id: "where-next",
    title: "Where Do We Go Next",
    category: "Editorial",
    src: "/projects/where-do-we-go-next-cover.png",
  },
  {
    id: "murakami",
    title: "Takashi Murakami",
    category: "Editorial",
    src: "/projects/takashi-murakami-cover.png",
  },
  {
    id: "tamagotchi",
    title: "Tamagotchi",
    category: "3D Modeling",
    src: "/projects/tamagotchi-cover.png",
    video: "/projects/tamagotchi/video.mp4",
  },
  {
    id: "melody-kuromi",
    title: "My Melody & Kuromi",
    category: "3D Modeling",
    src: "/projects/my-melody-kuromi-cover.png",
    video: "/projects/melody-kuromi/video.mp4",
  },
  {
    id: "editorial-3d",
    title: "Editorial Form",
    category: "3D Modeling",
    src: "/projects/editorial-cover.png",
    video: "/projects/editorial-3d/video.mp4",
  },
  {
    id: "babymonster",
    title: "BABYMONSTER",
    category: "3D Modeling",
    src: "/projects/babymonster-cover.png",
    video: "/projects/babymonster/video.mp4",
  },
  {
    id: "soulmark",
    title: "Soulmark",
    category: "More Works",
    src: "/projects/soulmark-cover.png",
  },
  {
    id: "wdym",
    title: "WDYM",
    category: "More Works",
    src: "/projects/wdym-cover.png",
  },
  {
    id: "what-you-want",
    title: "What You Want",
    category: "More Works",
    src: "/projects/what-you-want-cover.png",
    video: "/projects/what-you-want/video.mp4",
  },
  {
    id: "ark-protocol",
    title: "The Ark Protocol",
    category: "More Works",
    src: "/projects/ark-protocol-cover.png",
  },
];

export const GALLERY_PROJECTS = PROJECTS.map((project) => ({
  ...project,
  src: withBase(project.src),
  video: project.video ? withBase(project.video) : project.video,
}));
