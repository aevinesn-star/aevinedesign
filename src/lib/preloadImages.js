/**
 * Preload image URLs and report progress (0–1).
 * Failed loads still count as settled so a missing asset cannot stall forever.
 */
export function preloadImages(urls, { onProgress } = {}) {
  const unique = [...new Set((urls || []).filter(Boolean))];
  const total = unique.length;

  if (total === 0) {
    onProgress?.(1);
    return Promise.resolve();
  }

  let settled = 0;
  const bump = () => {
    settled += 1;
    onProgress?.(settled / total);
  };

  return Promise.all(
    unique.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => {
            bump();
            resolve();
          };
          img.onerror = () => {
            bump();
            resolve();
          };
          img.src = src;
        })
    )
  );
}

/** Homepage images that should be ready before the first paint of work. */
export function getHomepageImageUrls({ galleryProjects, photoshoot, aboutSrc }) {
  const urls = [];

  for (const project of galleryProjects || []) {
    if (project?.src) urls.push(project.src);
  }

  for (const set of Object.values(photoshoot || {})) {
    if (set?.src) urls.push(set.src);
    if (Array.isArray(set?.gallery)) urls.push(...set.gallery);
  }

  if (aboutSrc) urls.push(aboutSrc);

  return urls;
}
