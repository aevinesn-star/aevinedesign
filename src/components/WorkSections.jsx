import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { GALLERY_PROJECTS } from "../data/galleryProjects";
import { PHOTOSHOOT } from "../data/photoshoot";
import { rememberReturnSection } from "../lib/scrollToSection.js";
import "./WorkSections.css";

const SECTIONS = [
  {
    id: "branding",
    eyebrow: "01 — Branding",
    title: "Identity that holds under pressure.",
    copy: "Systems, marks, and material languages that stay clear at every scale.",
    category: "Branding",
    layout: "feature",
  },
  {
    id: "campaign",
    eyebrow: "02 — Campaign",
    title: "Stories that move people.",
    copy: "Key visuals and narrative frames built to carry a single sharp idea.",
    category: "Campaign",
    layout: "campaign",
  },
  {
    id: "editorial",
    eyebrow: "03 — Editorial",
    title: "Pages with pace and presence.",
    copy: "Spreads and sequences where type, image, and rhythm do the storytelling.",
    category: "Editorial",
    layout: "editorial",
  },
  {
    id: "modeling",
    eyebrow: "04 — 3D Modeling",
    title: "Form you can almost touch.",
    copy: "Objects and environments shaped for light, material, and close looking.",
    category: "3D Modeling",
    layout: "modeling",
  },
  {
    id: "more",
    eyebrow: "05 — More Works",
    title: "Further experiments.",
    copy: "Additional studies and side projects from the studio.",
    category: "More Works",
    layout: "more",
  },
];

function projectHref(id) {
  return `project.html?id=${encodeURIComponent(id)}`;
}

const PHOTOSHOOT_TYPES = [
  { id: "portrait", label: "People" },
  { id: "landscape", label: "Landscape" },
];

function MediaLightbox({ item, onClose }) {
  const titleId = useId();
  const videoRef = useRef(null);
  const closeBtnRef = useRef(null);
  const isVideo = Boolean(item?.video);
  const isPhotoshoot =
    !isVideo && (item?.id === "portrait" || item?.id === "landscape");

  const [activeType, setActiveType] = useState(
    item?.id === "landscape" ? "landscape" : "portrait"
  );

  useEffect(() => {
    if (item?.id === "portrait" || item?.id === "landscape") {
      setActiveType(item.id);
    }
  }, [item?.id]);

  const activePhotoshoot = isPhotoshoot ? PHOTOSHOOT[activeType] : null;
  const gallery = isPhotoshoot
    ? (Array.isArray(activePhotoshoot?.gallery)
        ? activePhotoshoot.gallery.filter(Boolean)
        : [])
    : Array.isArray(item?.gallery)
      ? item.gallery.filter(Boolean)
      : [];
  const isGallery = !isVideo && gallery.length > 1;
  const galleryTitle = isPhotoshoot
    ? activePhotoshoot?.title ||
      (activeType === "portrait" ? "People" : "Landscape")
    : item?.title;
  const [index, setIndex] = useState(() => {
    const g = Array.isArray(item?.gallery) ? item.gallery.filter(Boolean) : [];
    if (!Number.isFinite(item?.startIndex) || !g.length) return 0;
    return Math.max(0, Math.min(g.length - 1, Math.floor(item.startIndex)));
  });

  useEffect(() => {
    if (isPhotoshoot) {
      const type = item?.id === "landscape" ? "landscape" : "portrait";
      const g = (PHOTOSHOOT[type]?.gallery || []).filter(Boolean);
      const nextIndex = Number.isFinite(item?.startIndex) && g.length
        ? Math.max(0, Math.min(g.length - 1, Math.floor(item.startIndex)))
        : 0;
      setActiveType(type);
      setIndex(nextIndex);
      return;
    }
    const g = Array.isArray(item?.gallery) ? item.gallery.filter(Boolean) : [];
    const nextIndex = Number.isFinite(item?.startIndex) && g.length
      ? Math.max(0, Math.min(g.length - 1, Math.floor(item.startIndex)))
      : 0;
    setIndex(nextIndex);
  }, [item?.id, item?.src, item?.video, item?.startIndex, isPhotoshoot]);

  const switchType = useCallback(
    (type) => {
      if (!isPhotoshoot || type === activeType) return;
      if (!PHOTOSHOOT[type]?.gallery?.length) return;
      setActiveType(type);
      setIndex(0);
    },
    [activeType, isPhotoshoot]
  );

  const goPrev = useCallback(() => {
    if (!isGallery) return;
    setIndex((i) => (i - 1 + gallery.length) % gallery.length);
  }, [gallery.length, isGallery]);

  const goNext = useCallback(() => {
    if (!isGallery) return;
    setIndex((i) => (i + 1) % gallery.length);
  }, [gallery.length, isGallery]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!isGallery) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, isGallery, goPrev, goNext]);

  useEffect(() => {
    if (!isVideo) return;
    const el = videoRef.current;
    if (!el) return;
    el.play().catch(() => {});
  }, [isVideo, item?.video]);

  const safeIndex =
    gallery.length > 0 ? Math.min(index, gallery.length - 1) : 0;
  const imageSrc = isGallery
    ? gallery[safeIndex]
    : gallery[0] || item?.src;
  const imageAlt = isGallery
    ? `${galleryTitle} — ${safeIndex + 1} of ${gallery.length}`
    : galleryTitle;

  return (
    <div
      className="video-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="video-lightbox__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="video-lightbox__bar">
          {isPhotoshoot ? (
            <div className="video-lightbox__title-row">
              <div
                id={titleId}
                className="video-lightbox__types"
                role="tablist"
                aria-label="Photoshoot gallery"
              >
                {PHOTOSHOOT_TYPES.map((type, i) => {
                  const selected = activeType === type.id;
                  return (
                    <span key={type.id} className="video-lightbox__type-wrap">
                      {i > 0 ? (
                        <span
                          className="video-lightbox__type-sep"
                          aria-hidden="true"
                        >
                          /
                        </span>
                      ) : null}
                      <button
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        className={`video-lightbox__type${selected ? " is-active" : ""}`}
                        onClick={() => switchType(type.id)}
                      >
                        {type.label}
                      </button>
                    </span>
                  );
                })}
              </div>
              {isGallery ? (
                <span className="video-lightbox__count" aria-live="polite">
                  {safeIndex + 1} / {gallery.length}
                </span>
              ) : null}
            </div>
          ) : (
            <p id={titleId} className="video-lightbox__title">
              {item.title}
              {isGallery ? (
                <span className="video-lightbox__count" aria-live="polite">
                  {" "}
                  {safeIndex + 1} / {gallery.length}
                </span>
              ) : null}
            </p>
          )}
          <button
            ref={closeBtnRef}
            type="button"
            className="video-lightbox__close"
            aria-label="Close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {isVideo ? (
          <video
            ref={videoRef}
            className="video-lightbox__video"
            src={item.video}
            controls
            playsInline
            autoPlay
          />
        ) : (
          <div className={`video-lightbox__stage${isGallery ? " video-lightbox__stage--gallery" : ""}`}>
            {isGallery ? (
              <button
                type="button"
                className="video-lightbox__nav video-lightbox__nav--prev"
                aria-label="Previous photo"
                onClick={goPrev}
              >
                ‹
              </button>
            ) : null}
            <img
              className="video-lightbox__image"
              src={imageSrc}
              alt={imageAlt}
            />
            {isGallery ? (
              <button
                type="button"
                className="video-lightbox__nav video-lightbox__nav--next"
                aria-label="Next photo"
                onClick={goNext}
              >
                ›
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectFigure({ project, sectionId, ratio = "wide", className = "", onOpenVideo }) {
  const openVideo = Boolean(project.video && onOpenVideo);
  const media = (
    <figure className="work-figure">
      <div className={`ph ph-photo ph-${ratio}`}>
        <img src={project.src} alt="" loading="lazy" decoding="async" />
      </div>
      <figcaption>
        <span>{project.title}</span>
        <span>{project.category}</span>
      </figcaption>
    </figure>
  );

  if (openVideo) {
    return (
      <button
        type="button"
        className={`project-link project-link--button ${className}`.trim()}
        aria-label={`${project.title} — play video`}
        onClick={() => onOpenVideo(project)}
      >
        {media}
      </button>
    );
  }

  return (
    <a
      className={`project-link ${className}`.trim()}
      href={projectHref(project.id)}
      aria-label={`${project.title} — view project`}
      onClick={() => rememberReturnSection(sectionId)}
    >
      {media}
    </a>
  );
}

function FeatureLayout({ projects, sectionId, onOpenVideo }) {
  const [lead, ...rest] = projects;
  if (!lead) return null;
  return (
    <div className="branding-layout">
      <div className="branding-layout__hero">
        <ProjectFigure
          project={lead}
          sectionId={sectionId}
          ratio="wide"
          onOpenVideo={onOpenVideo}
        />
      </div>
      <div className="branding-layout__row">
        {rest.map((p) => (
          <ProjectFigure
            key={p.id}
            project={p}
            sectionId={sectionId}
            ratio="wide"
            onOpenVideo={onOpenVideo}
          />
        ))}
      </div>
    </div>
  );
}

function CampaignLayout({ projects, sectionId, onOpenVideo }) {
  const [lead, ...rest] = projects;
  if (!lead) return null;
  return (
    <div className="campaign-layout">
      <div className="campaign-layout__hero">
        <ProjectFigure
          project={lead}
          sectionId={sectionId}
          ratio="cinema"
          onOpenVideo={onOpenVideo}
        />
      </div>
      <div className="campaign-layout__strip">
        {rest.map((p) => (
          <ProjectFigure
            key={p.id}
            project={p}
            sectionId={sectionId}
            ratio="wide"
            onOpenVideo={onOpenVideo}
          />
        ))}
      </div>
    </div>
  );
}

function EditorialLayout({ projects, sectionId, onOpenVideo }) {
  return (
    <div className="editorial-spread work-editorial">
      {projects.map((p) => (
        <ProjectFigure
          key={p.id}
          project={p}
          sectionId={sectionId}
          ratio="wide"
          onOpenVideo={onOpenVideo}
        />
      ))}
    </div>
  );
}

function ModelingLayout({ projects, sectionId, onOpenVideo }) {
  return (
    <div className="modeling-layout">
      {projects.map((p) => (
        <ProjectFigure
          key={p.id}
          project={p}
          sectionId={sectionId}
          ratio="square"
          onOpenVideo={onOpenVideo}
        />
      ))}
    </div>
  );
}

function MoreLayout({ projects, sectionId, onOpenVideo }) {
  return (
    <div className="more-works-grid">
      {projects.map((p) => (
        <ProjectFigure
          key={p.id}
          project={p}
          sectionId={sectionId}
          ratio="wide"
          onOpenVideo={onOpenVideo}
        />
      ))}
    </div>
  );
}

const PHOTOSHOOT_SPAWN_DISTANCE = 78;
const PHOTOSHOOT_MAX_POPS = 3;

function buildPhotoshootPool() {
  const { portrait, landscape } = PHOTOSHOOT;
  const pool = [];

  portrait?.gallery?.forEach((src, index) => {
    if (!src) return;
    pool.push({
      id: `portrait-${index}`,
      src,
      type: "portrait",
      index,
      gallery: portrait,
    });
  });

  landscape?.gallery?.forEach((src, index) => {
    if (!src) return;
    pool.push({
      id: `landscape-${index}`,
      src,
      type: "landscape",
      index,
      gallery: landscape,
    });
  });

  return pool;
}

function PhotoshootPop({ pop, depth, onOpen }) {
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <button
      type="button"
      className={`photoshoot-pop photoshoot-pop--${pop.photo.type}${isIn ? " is-in" : ""}`}
      style={{
        left: pop.x,
        top: pop.y,
        "--pop-rotate": `${pop.rotate}deg`,
        "--pop-depth": depth,
        zIndex: 10 + (PHOTOSHOOT_MAX_POPS - depth),
      }}
      aria-label={`${pop.photo.gallery.title} ${pop.photo.index + 1} — open gallery`}
      onClick={() => onOpen(pop.photo)}
    >
      <img
        src={pop.photo.src}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
      />
    </button>
  );
}

function PhotoshootSection({ onOpenPhoto }) {
  const pool = useMemo(() => buildPhotoshootPool(), []);
  const stageRef = useRef(null);
  const poolIndexRef = useRef(0);
  const lastPosRef = useRef(null);
  const [pops, setPops] = useState([]);
  const [hasPointer, setHasPointer] = useState(false);
  const [prefersFinePointer, setPrefersFinePointer] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
      : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setPrefersFinePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const openPhoto = useCallback(
    (photo) => {
      if (!photo?.gallery) return;
      onOpenPhoto({
        ...photo.gallery,
        startIndex: photo.index,
      });
    },
    [onOpenPhoto]
  );

  const spawnNear = useCallback(
    (x, y, force = false) => {
      if (!pool.length) return;

      const last = lastPosRef.current;
      if (!force && last) {
        const dist = Math.hypot(x - last.x, y - last.y);
        if (dist < PHOTOSHOOT_SPAWN_DISTANCE) return;
      }

      lastPosRef.current = { x, y };
      const photo = pool[poolIndexRef.current % pool.length];
      poolIndexRef.current += 1;

      const key = `${photo.id}-${Date.now()}-${poolIndexRef.current}`;
      const rotate = (Math.random() - 0.5) * 8;
      const offsetX = (Math.random() - 0.5) * 28;
      const offsetY = (Math.random() - 0.5) * 28;

      setPops((prev) => {
        const next = [
          ...prev,
          {
            key,
            photo,
            x: x + offsetX,
            y: y + offsetY,
            rotate,
          },
        ];
        return next.slice(-PHOTOSHOOT_MAX_POPS);
      });
    },
    [pool]
  );

  const onPointerEnter = useCallback(
    (e) => {
      if (!prefersFinePointer) return;
      setHasPointer(true);
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      spawnNear(e.clientX - rect.left, e.clientY - rect.top, true);
    },
    [prefersFinePointer, spawnNear]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!prefersFinePointer) return;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      spawnNear(e.clientX - rect.left, e.clientY - rect.top);
    },
    [prefersFinePointer, spawnNear]
  );

  const onPointerLeave = useCallback(() => {
    setHasPointer(false);
    lastPosRef.current = null;
    setPops([]);
  }, []);

  if (!pool.length) return null;

  return (
    <section id="photoshoot" className="work-section">
      <div className="section-head">
        <p className="eyebrow">06 — Photoshoot</p>
        <h2>Light, subject, and frame.</h2>
        <p className="section-copy">
          Still photography in two formats — portrait and landscape.
        </p>
      </div>

      <div
        ref={stageRef}
        className={`photoshoot-stage${hasPointer ? " photoshoot-stage--active" : ""}`}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <p className="photoshoot-stage__hint" aria-hidden="true">
          Move to reveal
        </p>

        <div
          className="photoshoot-stage__field"
          aria-hidden={!prefersFinePointer}
        >
          {pops.map((pop, i) => (
            <PhotoshootPop
              key={pop.key}
              pop={pop}
              depth={pops.length - 1 - i}
              onOpen={openPhoto}
            />
          ))}
        </div>

        <ul className="photoshoot-scatter" aria-label="Photoshoot gallery">
          {pool.map((photo, i) => (
            <li
              key={photo.id}
              className={`photoshoot-scatter__item photoshoot-scatter__item--${photo.type}`}
              style={{ "--scatter-i": i }}
            >
              <button
                type="button"
                className="photoshoot-scatter__btn"
                aria-label={`${photo.gallery.title} ${photo.index + 1} — open gallery`}
                onClick={() => openPhoto(photo)}
              >
                <img
                  src={photo.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const LAYOUTS = {
  feature: FeatureLayout,
  campaign: CampaignLayout,
  editorial: EditorialLayout,
  modeling: ModelingLayout,
  more: MoreLayout,
};

export default function WorkSections({ projects = GALLERY_PROJECTS }) {
  const [activeMedia, setActiveMedia] = useState(null);
  const closeMedia = useCallback(() => setActiveMedia(null), []);

  return (
    <>
      {SECTIONS.map((section) => {
        const list = projects.filter((p) => p.category === section.category && p.src);
        if (!list.length) return null;
        const Layout = LAYOUTS[section.layout] || FeatureLayout;
        return (
          <section key={section.id} id={section.id} className="work-section">
            <div className="section-head">
              <p className="eyebrow">{section.eyebrow}</p>
              <h2>{section.title}</h2>
              <p className="section-copy">{section.copy}</p>
            </div>
            <Layout
              projects={list}
              sectionId={section.id}
              onOpenVideo={setActiveMedia}
            />
          </section>
        );
      })}
      <PhotoshootSection onOpenPhoto={setActiveMedia} />
      {activeMedia ? (
        <MediaLightbox item={activeMedia} onClose={closeMedia} />
      ) : null}
    </>
  );
}
