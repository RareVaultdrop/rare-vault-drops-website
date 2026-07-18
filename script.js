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


function setupAjaxForm(formSelector, statusSelector, successMessage, fallbackLabel) {
  const form = document.querySelector(formSelector);
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const status = document.querySelector(statusSelector);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton?.textContent || fallbackLabel;

    if (status) {
      status.textContent = 'Sending…';
      status.classList.remove('success', 'error');
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
    }

    try {
      const endpoint = form.dataset.endpoint;
      if (!endpoint || !endpoint.startsWith('https://')) {
        throw new Error('Secure form endpoint is missing.');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        const message = result.message || 'The form could not be sent.';
        if (/activation/i.test(message)) throw new Error('ACTIVATION_REQUIRED');
        throw new Error(message);
      }

      form.reset();
      if (status) {
        status.textContent = successMessage;
        status.classList.remove('error');
        status.classList.add('success');
      }
    } catch (error) {
      if (status) {
        status.textContent = error.message === 'ACTIVATION_REQUIRED'
          ? 'This form needs one-time activation. Check support@rarevaultdrop.com and click the Activate Form link, then submit again.'
          : 'Your request could not be sent. Please try again later or email support@rarevaultdrop.com.';
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
}

setupAjaxForm(
  '#contact-form',
  '#contact-status',
  'Thank you! Your message was sent to Rare Vault Drop.',
  'Send Message'
);

setupAjaxForm(
  '#machine-request-form',
  '#machine-request-status',
  'Thank you! Your machine request was sent to Rare Vault Drop.',
  'Submit Request'
);
