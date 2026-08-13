(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Header reveals immediately + solid state after hero
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  if (header) {
    requestAnimationFrame(() => header.classList.add("is-visible"));

    const syncHeader = () => {
      if (document.body.classList.contains("page-project")) {
        header.classList.add("is-scrolled");
        return;
      }
      const threshold = hero ? hero.offsetHeight * 0.72 : 120;
      header.classList.toggle("is-scrolled", window.scrollY > threshold);
    };
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
  }

  const toggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  if (toggle && mobileNav) {
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
      document.body.style.overflow = "";
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        mobileNav.hidden = false;
        document.body.style.overflow = "hidden";
      }
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  // Soft parallax on hero placeholder
  const heroPh = document.querySelector(".ph-hero");
  if (heroPh && hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const rect = hero.getBoundingClientRect();
          const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
          heroPh.style.translate = `0 ${progress * 8}%`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }
})();
