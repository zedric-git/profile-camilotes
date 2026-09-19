// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Subtle reveal-on-scroll for each section
const sections = document.querySelectorAll('.section');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

sections.forEach((section) => observer.observe(section));

// Fallback: if IntersectionObserver isn't supported, just show everything
if (!('IntersectionObserver' in window)) {
  sections.forEach((section) => section.classList.add('is-visible'));
}
