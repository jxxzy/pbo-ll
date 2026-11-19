const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionObserver;

function registerMotionItems(root = document) {
  const items = root.querySelectorAll('.motion-item:not([data-motion-ready])');
  if (motionQuery.matches || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  if (!motionObserver) {
    motionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        item.classList.add('is-visible');
        observer.unobserve(item);
      });
    }, { threshold: 0.12 });
  }

  items.forEach((item) => {
    item.dataset.motionReady = 'true';
    item.style.animationName = `motion-${item.dataset.motion}`;
    motionObserver.observe(item);
  });
}

window.registerMotionItems = registerMotionItems;

const topbar = document.querySelector('.main-topbar');
const scrollProgress = document.querySelector('#topbar-scroll-progress');
let scrollUpdatePending = false;

function updateScrollState() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollRatio = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  topbar?.classList.toggle('is-scrolled', window.scrollY > 12);
  if (scrollProgress) {
    scrollProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollRatio))})`;
  }
  scrollUpdatePending = false;
}

window.addEventListener('scroll', () => {
  if (scrollUpdatePending) return;
  scrollUpdatePending = true;
  window.requestAnimationFrame(updateScrollState);
}, { passive: true });

updateScrollState();

const quickLinks = [...document.querySelectorAll('.topbar-link')]
  .map((link) => ({ link, target: document.querySelector(link.hash) }))
  .filter(({ target }) => target);

function setActiveQuickLink(target) {
  const firstLinkForTarget = quickLinks.find((item) => item.target === target);
  quickLinks.forEach(({ link, target: linkTarget }) => {
    const isActive = firstLinkForTarget?.link === link && linkTarget === target;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function getVisibleHashTarget() {
  const matchingLink = quickLinks.find(({ link }) => link.hash === window.location.hash);
  if (!matchingLink) return null;
  const bounds = matchingLink.target.getBoundingClientRect();
  return bounds.bottom > 0 && bounds.top < window.innerHeight * 0.9
    ? matchingLink.target
    : null;
}

quickLinks.forEach(({ link, target }) => {
  link.addEventListener('click', () => setActiveQuickLink(target));
});
window.addEventListener('hashchange', () => {
  const target = getVisibleHashTarget();
  if (target) setActiveQuickLink(target);
});
window.addEventListener('scroll', () => {
  window.requestAnimationFrame(() => {
    const target = getVisibleHashTarget();
    if (target) setActiveQuickLink(target);
  });
}, { passive: true });

if (quickLinks.length && 'IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const hashTarget = getVisibleHashTarget();
    if (hashTarget) {
      setActiveQuickLink(hashTarget);
      return;
    }

    const active = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
    if (!active) return;
    setActiveQuickLink(active.target);
  }, { rootMargin: '-18% 0px -65% 0px', threshold: [0, 0.1, 0.35, 0.65] });

  quickLinks.forEach(({ target }) => sectionObserver.observe(target));
}

document.documentElement.classList.add('motion-ready');
registerMotionItems();
