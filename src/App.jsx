import { Component, useEffect } from "react";
import ProjectGallery from "./components/ProjectGallery.jsx";
import WorkSections from "./components/WorkSections.jsx";
import { withBase } from "./lib/base.js";
import { consumeReturnSection, scrollToSection } from "./lib/scrollToSection.js";
import "./styles/global.css";
import "../styles.css";

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
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const target = consumeReturnSection();
    if (target) {
      scrollToSection(target);
    }

    const scrollFromHash = (retries) => {
      const id = window.location.hash.replace(/^#/, "");
      if (id && id !== "top") scrollToSection(id, retries ? { retries } : undefined);
    };

    const onHashChange = () => scrollFromHash([0, 80, 250]);
    const onPageShow = (e) => {
      if (e.persisted) scrollFromHash();
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    <>
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
          <ProjectGallery />
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
              src={withBase("/about/aevine.jpg")}
              alt="Aevine"
              width={1280}
              height={1920}
              loading="lazy"
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
