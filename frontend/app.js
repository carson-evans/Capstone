document.addEventListener('DOMContentLoaded', () => {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('nav');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
});