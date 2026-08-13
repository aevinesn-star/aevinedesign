/**
 * Vanilla runtime for Aevine.design loading screen.
 * Mirrors components/LoadingScreen.jsx for the static site (no build step).
 */
(() => {
  const LINE_TOP = "Aevine";
  const LINE_BOTTOM = ".design";
  const LOGO_CHARS = [...LINE_TOP, ...LINE_BOTTOM];
  const STAGE1_MS = 2000;
  const LETTER_DELAY_S = 0.12;
  const LETTER_BOUNCE_S = 0.7;
  const EXIT_MS = 700;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderLine = (text, startIndex) =>
    Array.from(text)
      .map(
        (ch, i) =>
          `<span class="aevine-loader__char" style="animation-delay:${
            (startIndex + i) * LETTER_DELAY_S
          }s">${ch === " " ? "&nbsp;" : ch}</span>`
      )
      .join("");

  const mount = () => {
    document.documentElement.classList.add("is-loading");

    const root = document.createElement("div");
    root.className = "aevine-loader";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-label", "Loading 0%");

    root.innerHTML = `
      <div class="aevine-loader__inner">
        <div class="aevine-loader__logo-slot">
          <p class="aevine-loader__logo" aria-hidden="true">
            <span class="aevine-loader__line">${renderLine(LINE_TOP, 0)}</span>
            <span class="aevine-loader__line">${renderLine(LINE_BOTTOM, LINE_TOP.length)}</span>
          </p>
          <canvas class="aevine-loader__canvas is-active" aria-hidden="true"></canvas>
        </div>
        <div class="aevine-loader__progress-block">
          <div class="aevine-loader__meta">
            <span data-progress>0%</span>
            <span>100%</span>
          </div>
          <div class="aevine-loader__track" aria-hidden="true">
            <div class="aevine-loader__fill" data-fill style="width:0%"></div>
          </div>
        </div>
      </div>
    `;

    document.body.prepend(root);

    const slot = root.querySelector(".aevine-loader__logo-slot");
    const canvas = root.querySelector("canvas");
    const logoEl = root.querySelector(".aevine-loader__logo");
    const progressEl = root.querySelector("[data-progress]");
    const fillEl = root.querySelector("[data-fill]");
    const ctx = canvas.getContext("2d", { alpha: true });

    let particles = [];
    let raf = 0;

    const setProgressUI = (pct) => {
      const p = Math.max(0, Math.min(100, Math.round(pct)));
      progressEl.textContent = `${p}%`;
      fillEl.style.width = `${p}%`;
      root.setAttribute("aria-label", `Loading ${p}%`);
    };

    const buildParticles = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const logoStyle = getComputedStyle(logoEl);
      const fontFamily = logoStyle.fontFamily || '"Syne", sans-serif';
      const fontWeight = logoStyle.fontWeight || "800";
      const fontSize = parseFloat(logoStyle.fontSize) || 48;
      const letterSpacing = logoStyle.letterSpacing;
      const spacingPx =
        letterSpacing === "normal" ? fontSize * -0.045 : parseFloat(letterSpacing) || 0;

      // Logo stays in layout (invisible) so metrics match the bounce text exactly
      const logoRect = logoEl.getBoundingClientRect();
      const cssW = Math.max(1, Math.ceil(logoRect.width));
      const cssH = Math.max(1, Math.ceil(logoRect.height));

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#000";
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      // Draw each character at its live DOM position → same Y as bounce stage
      const chars = logoEl.querySelectorAll(".aevine-loader__char");
      chars.forEach((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left - logoRect.left;
        const y = r.top - logoRect.top + r.height / 2;
        const ch = el.textContent || "";
        if (!ch) return;
        ctx.fillText(ch, x, y);
        // Compensate canvas letter-spacing vs DOM: DOM already spaced via CSS.
        // fillText draws glyph at x; DOM box already includes spacing in layout.
      });

      const sample = Math.max(2, Math.round(fontSize / 28));
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;
      const list = [];
      const maxX = Math.max(cssW, 1);

      for (let py = 0; py < canvas.height; py += sample * dpr) {
        for (let px = 0; px < canvas.width; px += sample * dpr) {
          const i = (Math.floor(py) * canvas.width + Math.floor(px)) * 4;
          if (data[i + 3] > 28) {
            list.push({
              x: px / dpr,
              y: py / dpr,
              size: sample,
              threshold: px / dpr / maxX,
              jitter: Math.random() * 0.08,
            });
          }
        }
      }

      particles = list;
      ctx.clearRect(0, 0, cssW, cssH);
    };

    const finish = () => {
      root.classList.add("is-exiting");
      window.setTimeout(() => {
        document.documentElement.classList.remove("is-loading");
        document.documentElement.classList.add("is-ready");
        root.remove();
        window.dispatchEvent(new CustomEvent("aevine:loading-complete"));
      }, EXIT_MS);
    };

    const startBounce = () => {
      canvas.classList.remove("is-active");
      logoEl.classList.add("is-active");
      logoEl.setAttribute("aria-hidden", "false");
      void logoEl.offsetWidth;
      logoEl.classList.add("is-bouncing");

      const bounceTotalMs =
        (Math.max(LOGO_CHARS.length - 1, 0) * LETTER_DELAY_S + LETTER_BOUNCE_S) *
        1000;

      window.setTimeout(finish, bounceTotalMs + 180);
    };

    const runPixelStage = () => {
      buildParticles();
      const start = performance.now();
      let done = false;

      const paint = (now) => {
        if (done) return;
        const elapsed = now - start;
        const t = Math.min(1, elapsed / STAGE1_MS);
        setProgressUI(t * 100);

        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.fillStyle = "#000";

        for (const p of particles) {
          const local = (t - (p.threshold * 0.85 + p.jitter)) / 0.18;
          const alpha = Math.min(1, Math.max(0, local));
          if (alpha <= 0) continue;
          ctx.globalAlpha = alpha;
          ctx.fillRect(p.x, p.y, p.size * 0.92, p.size * 0.92);
        }
        ctx.globalAlpha = 1;

        if (t >= 1) {
          done = true;
          setProgressUI(100);
          startBounce();
          return;
        }
        raf = requestAnimationFrame(paint);
      };

      raf = requestAnimationFrame(paint);
      const watchdog = window.setInterval(() => {
        if (done) {
          window.clearInterval(watchdog);
          return;
        }
        paint(performance.now());
      }, 50);
    };

    if (reduced) {
      setProgressUI(100);
      canvas.classList.remove("is-active");
      logoEl.classList.add("is-active");
      logoEl.setAttribute("aria-hidden", "false");
      window.setTimeout(finish, 400);
      return;
    }

    const boot = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* ignore */
      }
      // Ensure layout is settled before measuring glyph boxes
      void slot.offsetWidth;
      runPixelStage();
    };

    boot();

    window.addEventListener(
      "pagehide",
      () => {
        cancelAnimationFrame(raf);
      },
      { once: true }
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
