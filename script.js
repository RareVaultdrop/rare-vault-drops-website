const menu = document.querySelector('.menu');
const navigation = document.querySelector('.nav nav');

menu?.addEventListener('click', () => {
  const isOpen = navigation?.classList.toggle('open') ?? false;
  menu.setAttribute('aria-expanded', String(isOpen));
  menu.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  menu.textContent = isOpen ? '×' : '☰';
});

document.querySelectorAll('.nav nav a').forEach(link => {
  link.addEventListener('click', () => {
    navigation?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    if (menu) {
      menu.setAttribute('aria-label', 'Open navigation menu');
      menu.textContent = '☰';
    }
  });
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('show'));
}


const contactForm = document.querySelector('#contact-form');
contactForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const status = document.querySelector('#contact-status');
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalLabel = submitButton?.textContent || 'Send Message';

  if (status) status.textContent = 'Sending your message…';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
  }

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' }
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Message could not be sent.');
    }

    contactForm.reset();
    if (status) {
      status.textContent = 'Thank you! Your message was sent to Rare Vault Drop.';
      status.classList.remove('error');
      status.classList.add('success');
    }
  } catch (error) {
    if (status) {
      status.textContent = 'Your message could not be sent. Please try again or email support@rarevaultdrop.com.';
      status.classList.remove('success');
      status.classList.add('error');
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  }
});
