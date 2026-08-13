(() => {
  const root = document.getElementById("project-root");
  const projects = window.AEVINE_PROJECTS || [];
  if (!root) return;

  const BASE = (() => {
    const path = window.location.pathname;
    if (path.endsWith("project.html")) {
      return path.slice(0, -"project.html".length) || "/";
    }
    const dir = path.endsWith("/") ? path : path.replace(/[^/]+$/, "");
    return dir || "/";
  })();

  const withBase = (src) => {
    if (!src || /^(https?:|data:|blob:|#)/i.test(src)) return src;
    if (src.startsWith("./") || src.startsWith(BASE)) return src;
    return `${BASE.replace(/\/?$/, "/")}${String(src).replace(/^\//, "")}`;
  };

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const index = projects.findIndex((p) => p.id === id);
  const project = index >= 0 ? projects[index] : null;

  if (!project) {
    root.innerHTML = `
      <section class="project-missing">
        <p class="eyebrow">Project</p>
        <h1>Not found</h1>
        <p class="project-summary">This project doesn’t exist yet — or the link is incomplete.</p>
        <a class="btn btn-primary" href="${BASE}">Back to home</a>
      </section>
    `;
    document.title = "Not found — Aevine.design";
    return;
  }

  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  // Keep in sync with src/lib/scrollToSection.js
  const RETURN_KEY = "aevine-return-section";
  const persistReturnSection = (sectionId) => {
    if (!sectionId) return;
    try {
      sessionStorage.setItem(RETURN_KEY, sectionId);
    } catch {
      /* ignore */
    }
  };
  const readReturnSection = () => {
    try {
      return sessionStorage.getItem(RETURN_KEY) || "";
    } catch {
      return "";
    }
  };

  const sectionId = project.section || readReturnSection();
  persistReturnSection(sectionId);
  const backHref = sectionId ? `${BASE}#${sectionId}` : BASE;

  const ratioClass = {
    wide: "ph-wide",
    square: "ph-square",
    tall: "ph-tall",
    spread: "ph-spread",
  };

  const toneClass = project.tone ? `tone-${project.tone}` : "";

  const renderPh = (img, extraClass = "") => {
    const cls = [
      "ph",
      img.src ? "ph-photo" : "",
      img.aspect ? "ph-native" : ratioClass[img.ratio] || "ph-wide",
      img.alt ? "ph-alt" : "",
      !img.src ? toneClass : "",
      extraClass,
    ]
      .filter(Boolean)
      .join(" ");

    const style = img.aspect ? ` style="aspect-ratio:${img.aspect}"` : "";

    if (img.src) {
      const isVideo =
        img.type === "video" ||
        /\.(mp4|webm|m4v|mov)(\?|$)/i.test(img.src);
      if (isVideo) {
        const videoCls = `${cls} ph-video`.trim();
        const loopAttr = img.loop === false ? "" : "loop ";
        const autoplayAttr = img.autoplay === false ? "" : "autoplay ";
        const controlsAttr = img.controls === false ? "" : "controls ";
        return `<div class="${videoCls}"${style}><video src="${withBase(img.src)}" ${
          img.poster ? `poster="${withBase(img.poster)}" ` : ""
        }playsinline muted ${loopAttr}${autoplayAttr}${controlsAttr}preload="metadata" aria-label="${
          img.label || "Video"
        }"></video></div>`;
      }
      return `<div class="${cls}"${style}><img src="${withBase(img.src)}" alt="${img.label || ""}" loading="lazy" decoding="async" /></div>`;
    }
    return `<div class="${cls}"${style} data-label="${img.label}"></div>`;
  };

  const renderFigures = (images = [], { captions = true } = {}) =>
    images
      .map(
        (img) => `
      <figure class="project-figure">
        ${renderPh(img)}
        ${captions ? `<figcaption>${img.label}</figcaption>` : ""}
      </figure>`
      )
      .join("");

  const pagedGalleryStore = new Map();
  let pagedGallerySeq = 0;

  const renderShowcaseGroup = (group) => {
    const layout = group.layout || "grid";
    const captions =
      group.captions === true ||
      layout === "product" ||
      layout === "app" ||
      layout === "motion";
    return `
      <div class="app-group app-group--showcase app-group--${layout}">
        <p class="eyebrow app-group__title">${group.title}</p>
        <div class="app-group__grid">
          ${renderFigures(group.images || [], { captions })}
        </div>
      </div>`;
  };

  const renderApplicationGallery = (chapter) => {
    if (!chapter.groups || !chapter.groups.length) {
      return `<div class="chapter-gallery">${renderFigures(chapter.images || [], { captions: false })}</div>`;
    }

    const phoneGroups = chapter.groups.filter((g) => g.layout === "phones");
    const pagedGroups = chapter.groups.filter(
      (g) => g.layout === "tools" || g.layout === "paged"
    );
    const showcaseGroups = chapter.groups.filter(
      (g) => !["phones", "tools", "paged"].includes(g.layout)
    );

    const phonesHtml = phoneGroups
      .map(
        (group) => `
        <div class="app-group app-group--phones">
          <p class="eyebrow app-group__title">${group.title}</p>
          <div class="app-group__grid">
            ${renderFigures(group.images, { captions: false })}
          </div>
        </div>`
      )
      .join("");

    const showcaseHtml = showcaseGroups.map(renderShowcaseGroup).join("");

    let pagedHtml = "";
    if (pagedGroups.length) {
      const pages = pagedGroups.map((group) => ({
        title: group.title,
        images: (group.images || []).slice(0, 8),
      }));
      const galleryId = `tools-${++pagedGallerySeq}`;
      pagedGalleryStore.set(galleryId, pages);
      const slots = Array.from(
        { length: 8 },
        () => `<div class="app-page-slot"></div>`
      ).join("");
      pagedHtml = `
        <div class="app-group app-group--tools" data-paged-gallery data-gallery-id="${galleryId}">
          <p class="eyebrow app-group__title" data-page-title></p>
          <div class="app-page-grid" data-page-grid>${slots}</div>
          <div class="app-carousel__nav app-page-nav">
            <button type="button" class="app-carousel__btn" data-dir="prev" aria-label="Previous page">←</button>
            <span class="app-page-indicator" data-page-indicator></span>
            <button type="button" class="app-carousel__btn" data-dir="next" aria-label="Next page">→</button>
          </div>
        </div>`;
    }

    return `${phonesHtml}${showcaseHtml}${pagedHtml}`;
  };

  const chapterDefsAll = [
    { key: "concept", id: "concept", label: "Concept" },
    { key: "brandSystem", id: "brand-system", label: "Brand System" },
    { key: "application", id: "application", label: "Application" },
  ];

  const chapters = project.chapters || {};
  const cover = project.cover || (chapters.concept?.images?.[0] ?? { label: "Cover", ratio: "wide" });

  const chapterDefs = chapterDefsAll
    .filter(({ key }) => chapters[key])
    .map((def, i) => ({
      ...def,
      index: String(i + 1).padStart(2, "0"),
    }));

  const chapterHtml = chapterDefs
    .map(({ key, id: chapterId, label, index: num }) => {
      const chapter = chapters[key];
      const layout = key === "brandSystem" ? "is-system" : key === "application" ? "is-application" : "is-concept";
      const showCaptions = key === "brandSystem";
      const gallery =
        key === "application"
          ? renderApplicationGallery(chapter)
          : `<div class="chapter-gallery">${renderFigures(chapter.images, { captions: showCaptions })}</div>`;
      return `
        <section id="${chapterId}" class="project-chapter ${layout}" data-reveal>
          <div class="chapter-head">
            <p class="eyebrow">${num} — ${label}</p>
            <h2>${label}</h2>
            <p class="chapter-text">${chapter.text}</p>
          </div>
          ${gallery}
        </section>
      `;
    })
    .join("");

  const chapterNav = chapterDefs
    .map(({ id: chapterId, label }) => `<a href="#${chapterId}">${label}</a>`)
    .join("\n        ");

  root.innerHTML = `
    <section class="project-hero-block" data-reveal>
      <a class="project-back" href="${backHref}">← All work</a>
      <p class="eyebrow">${project.category} · ${project.year}</p>
      <h1>${project.title}</h1>
      <p class="project-role">${project.role}</p>
      <p class="project-summary">${project.summary}</p>
      <nav class="chapter-nav" aria-label="Project sections">
        ${chapterNav}
      </nav>
    </section>

    <section class="project-cover" data-reveal>
      <figure class="project-figure is-hero">
        ${renderPh(cover)}
        <figcaption>${cover.label}</figcaption>
      </figure>
    </section>

    ${chapterHtml}

    <section class="project-body" data-reveal>
      <h2>Project info</h2>
      <dl class="project-meta">
        <div>
          <dt>Category</dt>
          <dd>${project.category}</dd>
        </div>
        <div>
          <dt>Year</dt>
          <dd>${project.year}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>${project.role}</dd>
        </div>
      </dl>
    </section>

    <nav class="project-pager" aria-label="More projects" data-reveal>
      <a class="pager-link prev" href="project.html?id=${prev.id}">
        <span class="pager-label">Previous</span>
        <span class="pager-title">${prev.title}</span>
      </a>
      <a class="pager-link next" href="project.html?id=${next.id}">
        <span class="pager-label">Next</span>
        <span class="pager-title">${next.title}</span>
      </a>
    </nav>
  `;

  document.title = `${project.title} — Aevine.design`;

  const bindHomeLink = (el) => {
    if (!el || !sectionId) return;
    el.setAttribute("href", backHref);
    el.addEventListener("click", () => persistReturnSection(sectionId));
  };

  bindHomeLink(document.querySelector(".site-header .logo"));
  bindHomeLink(root.querySelector(".project-back"));

  const revealEls = root.querySelectorAll("[data-reveal]");
  const show = (el) => el.classList.add("is-visible");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) show(el);
      else io.observe(el);
    });
  } else {
    revealEls.forEach(show);
  }

  document.querySelector(".site-header")?.classList.add("is-scrolled", "is-visible");

  const PAGE_SIZE = 8;
  const FLIP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const FLIP_MS = 520;

  const fillSlot = (slot, image) => {
    if (!image) {
      slot.innerHTML = "";
      slot.hidden = true;
      return;
    }
    slot.hidden = false;
    slot.innerHTML = `
      <figure class="project-figure app-page-card">
        <div class="ph ph-photo ph-native" style="aspect-ratio:4/3">
          <img src="${withBase(image.src)}" alt="${image.label || ""}" loading="lazy" decoding="async" />
        </div>
      </figure>`;
  };

  const initPagedGalleries = () => {
    root.querySelectorAll("[data-paged-gallery]").forEach((group) => {
      const galleryId = group.getAttribute("data-gallery-id");
      const pages = pagedGalleryStore.get(galleryId);
      const grid = group.querySelector("[data-page-grid]");
      const titleEl = group.querySelector("[data-page-title]");
      const indicator = group.querySelector("[data-page-indicator]");
      const prevBtn = group.querySelector('[data-dir="prev"]');
      const nextBtn = group.querySelector('[data-dir="next"]');
      if (!pages || !pages.length || !grid || !prevBtn || !nextBtn) return;

      // Each source group becomes one page of exactly 8 card slots
      const pageCards = pages.map((page) => {
        const imgs = (page.images || []).slice(0, PAGE_SIZE);
        while (imgs.length < PAGE_SIZE) imgs.push(null);
        return { title: page.title, images: imgs };
      });

      const slots = [...grid.querySelectorAll(".app-page-slot")];
      let pageIndex = 0;
      let animating = false;

      const syncNav = () => {
        prevBtn.disabled = pageIndex <= 0 || animating;
        nextBtn.disabled = pageIndex >= pageCards.length - 1 || animating;
        if (indicator) {
          indicator.textContent = `${pageIndex + 1} / ${pageCards.length}`;
        }
        if (titleEl) titleEl.textContent = pageCards[pageIndex].title;
      };

      const paintPage = (index) => {
        const page = pageCards[index];
        slots.forEach((slot, i) => fillSlot(slot, page.images[i]));
      };

      const flipToPage = (nextIndex) => {
        if (animating || nextIndex === pageIndex) return;
        if (nextIndex < 0 || nextIndex >= pageCards.length) return;
        animating = true;
        syncNav();

        const cards = slots
          .map((slot) => slot.querySelector(".app-page-card"))
          .filter(Boolean);

        // FIRST
        const firstRects = cards.map((card) => card.getBoundingClientRect());
        const ghosts = cards.map((card, i) => {
          const rect = firstRects[i];
          const ghost = card.cloneNode(true);
          ghost.classList.add("app-page-ghost");
          ghost.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            margin: 0;
            z-index: 30;
            pointer-events: none;
            transition: opacity ${FLIP_MS}ms ${FLIP_EASE}, transform ${FLIP_MS}ms ${FLIP_EASE};
            transform-origin: center center;
          `;
          document.body.appendChild(ghost);
          return ghost;
        });

        // Swap page content (LAST layout — same grid geometry)
        paintPage(nextIndex);
        const newCards = slots
          .map((slot) => slot.querySelector(".app-page-card"))
          .filter(Boolean);

        // LAST
        const lastRects = newCards.map((card) => card.getBoundingClientRect());

        newCards.forEach((card, i) => {
          const first = firstRects[i] || lastRects[i];
          const last = lastRects[i];
          if (!first || !last || !last.width || !last.height) return;

          const dx = first.left - last.left;
          const dy = first.top - last.top;
          const sx = first.width / last.width;
          const sy = first.height / last.height;
          const delay = i * 28;

          card.style.transition = "none";
          card.style.transformOrigin = "top left";
          card.style.opacity = "0";
          card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              card.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE} ${delay}ms, opacity ${FLIP_MS * 0.85}ms ${FLIP_EASE} ${delay}ms`;
              card.style.transform = "none";
              card.style.opacity = "1";
            });
          });
        });

        // Outgoing ghosts: FLIP toward last slot positions, then fade
        ghosts.forEach((ghost, i) => {
          const first = firstRects[i];
          const last = lastRects[i] || first;
          if (!first || !last) {
            ghost.remove();
            return;
          }
          const dx = last.left - first.left;
          const dy = last.top - first.top;
          const sx = last.width / first.width;
          const sy = last.height / first.height;
          const delay = i * 28;

          requestAnimationFrame(() => {
            ghost.style.transitionDelay = `${delay}ms`;
            ghost.style.opacity = "0";
            ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
          });
          setTimeout(() => ghost.remove(), FLIP_MS + delay + 80);
        });

        pageIndex = nextIndex;
        setTimeout(() => {
          newCards.forEach((card) => {
            card.style.transition = "";
            card.style.transform = "";
            card.style.opacity = "";
          });
          animating = false;
          syncNav();
        }, FLIP_MS + PAGE_SIZE * 28 + 40);
      };

      paintPage(0);
      syncNav();

      prevBtn.addEventListener("click", () => flipToPage(pageIndex - 1));
      nextBtn.addEventListener("click", () => flipToPage(pageIndex + 1));
    });
  };

  initPagedGalleries();
})();
