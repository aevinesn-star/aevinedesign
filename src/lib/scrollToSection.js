/** Keep in sync with public/project.js */
export const RETURN_KEY = "aevine-return-section";

export function rememberReturnSection(sectionId) {
  if (!sectionId) return;
  try {
    sessionStorage.setItem(RETURN_KEY, sectionId);
  } catch {
    /* ignore */
  }
  if (window.location.hash !== `#${sectionId}`) {
    history.replaceState(null, "", `#${sectionId}`);
  }
}

let storedOnce = "";
let didReadStore = false;

export function consumeReturnSection() {
  const fromHash = window.location.hash.replace(/^#/, "");
  if (fromHash && fromHash !== "top") {
    try {
      sessionStorage.removeItem(RETURN_KEY);
    } catch {
      /* ignore */
    }
    return fromHash;
  }

  // Cache so React StrictMode's double effect doesn't drop the value.
  if (!didReadStore) {
    didReadStore = true;
    try {
      storedOnce = sessionStorage.getItem(RETURN_KEY) || "";
      if (storedOnce) sessionStorage.removeItem(RETURN_KEY);
    } catch {
      storedOnce = "";
    }
  }

  const fromProject = /project\.html/i.test(document.referrer || "");
  return fromProject ? storedOnce : "";
}

function jumpTo(el) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  try {
    el.scrollIntoView({ behavior: "instant", block: "start" });
  } catch {
    el.scrollIntoView(true);
  }
  html.style.scrollBehavior = prev;
}

/**
 * Scroll to a homepage section after React layout (and sticky gallery) settles.
 * Jump last — ScrollTrigger.refresh() can steal scroll if it runs afterward.
 */
export function scrollToSection(
  sectionId,
  { retries = [0, 80, 250, 600, 1200, 2000] } = {}
) {
  if (!sectionId || sectionId === "top" || typeof document === "undefined") return;

  const run = () => {
    const el = document.getElementById(sectionId);
    if (!el) return false;

    jumpTo(el);

    import("gsap/ScrollTrigger")
      .then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
        requestAnimationFrame(() => jumpTo(el));
      })
      .catch(() => {});

    return true;
  };

  retries.forEach((ms) => {
    window.setTimeout(run, ms);
  });
}
