import { Component, useCallback, useEffect, useState } from "react";
import LoadingScreen from "../components/LoadingScreen.jsx";
import ProjectGallery from "./components/ProjectGallery.jsx";
import WorkSections from "./components/WorkSections.jsx";
import { GALLERY_PROJECTS } from "./data/galleryProjects.js";
import { PHOTOSHOOT } from "./data/photoshoot.js";
import { withBase } from "./lib/base.js";
import {
  getHomepageImageUrls,
  preloadImages,
} from "./lib/preloadImages.js";
import { consumeReturnSection, scrollToSection } from "./lib/scrollToSection.js";
import "./styles/global.css";
import "../styles.css";

const ABOUT_SRC = withBase("/about/aevine.jpg");
const LOAD_TIMEOUT_MS = 20000;

class GalleryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("ProjectGallery error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <section
          className="project-gallery3d"
          style={{ display: "grid", placeItems: "center", background: "#000" }}
        >
          <p style={{ color: "#f2f5f1" }}>
            Gallery failed to load. Refresh to retry.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}

/**
 * Homepage — spiral hero, then category work grids (3D opens video inline).
 */
export default function App() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timedOut = false;

    const urls = getHomepageImageUrls({
      galleryProjects: GALLERY_PROJECTS,
      photoshoot: PHOTOSHOOT,
      aboutSrc: ABOUT_SRC,
    });

    const markReady = () => {
      if (cancelled) return;
      setLoadProgress(100);
      setAssetsReady(true);
    };

    const timeout = window.setTimeout(() => {
      timedOut = true;
      markReady();
    }, LOAD_TIMEOUT_MS);

    preloadImages(urls, {
      onProgress: (ratio) => {
        if (cancelled || timedOut) return;
        setLoadProgress(Math.round(ratio * 100));
      },
    }).then(() => {
      if (cancelled || timedOut) return;
      window.clearTimeout(timeout);
      markReady();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    if (showLoader) return undefined;

    const fromProject = /project\.html/i.test(document.referrer || "");

    // After the intro loader, land on the spiral — not a leftover #branding hash.
    if (!fromProject) {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && hash !== "top" && hash !== "gallery") {
        history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
      }
      try {
        sessionStorage.removeItem("aevine-return-section");
      } catch {
        /* ignore */
      }
    }

    const lockToSpiral = () => {
      window.scrollTo(0, 0);
      import("gsap/ScrollTrigger")
        .then(({ ScrollTrigger }) => {
          ScrollTrigger.refresh();
          requestAnimationFrame(() => window.scrollTo(0, 0));
        })
        .catch(() => {});
    };

    lockToSpiral();
    const t1 = window.setTimeout(lockToSpiral, 80);
    const t2 = window.setTimeout(lockToSpiral, 250);

    // Only jump to a work section when returning from a project detail page.
    if (fromProject) {
      const target = consumeReturnSection();
      if (target && target !== "top" && target !== "gallery") {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        scrollToSection(target);
      }
    }

    const scrollFromHash = (retries) => {
      const id = window.location.hash.replace(/^#/, "");
      if (id && id !== "top" && id !== "gallery") {
        scrollToSection(id, retries ? { retries } : undefined);
      } else if (!id || id === "top" || id === "gallery") {
        window.scrollTo(0, 0);
      }
    };

    const onHashChange = () => scrollFromHash([0, 80, 250]);
    const onPageShow = (e) => {
      if (e.persisted) scrollFromHash();
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [showLoader]);

  return (
    <>
      {showLoader ? (
        <LoadingScreen
          loadProgress={loadProgress}
          canFinish={assetsReady}
          onComplete={handleLoaderComplete}
        />
      ) : null}

      <div className="noise" aria-hidden="true" />

      <header className="site-header is-visible">
        <a className="logo" href="#top">
          Aevine.design
        </a>
        <nav className="nav" aria-label="Primary">
          <a href="#branding">Branding</a>
          <a href="#campaign">Campaign</a>
          <a href="#editorial">Editorial</a>
          <a href="#modeling">3D</a>
          <a href="#more">More</a>
          <a href="#photoshoot">Photoshoot</a>
          <a href="#about">About</a>
        </nav>
        <a className="header-cta" href="#about">
          Contact
        </a>
      </header>

      <main id="top">
        <GalleryErrorBoundary>
          <ProjectGallery className={showLoader ? "" : "is-revealed"} />
        </GalleryErrorBoundary>

        <WorkSections />

        <section id="about" className="about">
          <div className="about-copy">
            <p className="eyebrow">About Me</p>
            <h2>Aevine</h2>
            <p>
              Hello there! This is Aiwen. I am a graphic designer and also a
              student at the School of Visual Arts in New York City. If you're
              looking to upgrade your brand's narrative or simply want to
              discuss potential collaborations, don’t hesitate to reach out.
              Let’s connect and create something unforgettable together! 🎨
            </p>
            <div className="about-links">
              <a
                href="https://www.instagram.com/aevineartss/"
                target="_blank"
                rel="noopener noreferrer"
              >
                @aevineartss
              </a>
              <a href={withBase("/resume.pdf")} target="_blank" rel="noopener noreferrer">
                Resume
              </a>
            </div>
          </div>
          <figure className="about-portrait">
            <img
              src={ABOUT_SRC}
              alt="Aevine"
              width={1280}
              height={1920}
              loading="eager"
              decoding="async"
            />
          </figure>
        </section>
      </main>

      <footer className="site-footer">
        <p className="footer-brand">Aevine.design</p>
        <p className="footer-note">© {new Date().getFullYear()}</p>
        <a className="footer-top" href="#top">
          Back to top
        </a>
      </footer>
    </>
  );
}
