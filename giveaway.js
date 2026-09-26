(() => {
  const OPEN_AT = new Date('2026-10-01T14:00:00-05:00').getTime();
  const CLOSE_AT = new Date('2026-11-25T14:00:00-06:00').getTime();
  const ANNOUNCE_AT = new Date('2026-11-25T18:00:00-06:00').getTime();

  const SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyRHsJiM9vSPk0OA5mxbT9bx7Lk4WknaViCWqK6Jr8LjVuCTf_kTgtD8EGyv-p2y-k1/exec';

  const form = document.getElementById('giveaway-form');
  const button = document.getElementById('enter-btn');
  const gateTitle = document.getElementById('gate-title');
  const gateCountdown = document.getElementById('gate-countdown');
  const status = document.getElementById('giveaway-status');
  const entryId = document.getElementById('entry-id');
  const entryTime = document.getElementById('entry-time');

  if (!form || !button) return;

  function formatCountdown(ms) {
    if (ms <= 0) return '';
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    parts.push(`${hours}h`, `${minutes}m`, `${seconds}s`);
    return parts.join(' ');
  }

  function updateGate() {
    const now = Date.now();

    if (now < OPEN_AT) {
      button.disabled = true;
      button.textContent = 'GIVEAWAY OPENS OCT 1';
      if (gateTitle) gateTitle.textContent = 'GIVEAWAY OPENS OCTOBER 1, 2026 • 2:00 PM CT';
      if (gateCountdown) gateCountdown.textContent = `Opens in ${formatCountdown(OPEN_AT - now)}`;
      return;
    }

    if (now < CLOSE_AT) {
      button.disabled = false;
      button.textContent = 'ENTER GIVEAWAY';
      if (gateTitle) gateTitle.textContent = 'GIVEAWAY IS OPEN • FREE ENTRY';
      if (gateCountdown) gateCountdown.textContent = `Entries close in ${formatCountdown(CLOSE_AT - now)}`;
      return;
    }

    button.disabled = true;
    button.textContent = 'ENTRIES CLOSED';

    if (now < ANNOUNCE_AT) {
      if (gateTitle) gateTitle.textContent = 'GIVEAWAY ENTRIES ARE CLOSED';
      if (gateCountdown) gateCountdown.textContent = `Winner announced in ${formatCountdown(ANNOUNCE_AT - now)}`;
    } else {
      if (gateTitle) gateTitle.textContent = 'GIVEAWAY CLOSED';
      if (gateCountdown) gateCountdown.textContent = 'Winner announcement scheduled for November 25, 2026 • 6:00 PM CT';
    }
  }

  function makeEntryId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID().split('-')[0].toUpperCase();
    }
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  async function logToGoogleSheet() {
    const data = new URLSearchParams();
    data.set('full_name', form.elements['name']?.value || '');
    data.set('email', form.elements['email']?.value || '');
    data.set('phone', form.elements['phone']?.value || '');
    data.set('age_confirmed', form.elements['age_confirmed']?.checked ? 'Yes' : '');
    data.set('rules_accepted', form.elements['rules_accepted']?.checked ? 'Yes' : '');
    data.set('entry_id', entryId?.value || '');
    data.set('entry_time', entryTime?.value || '');
    data.set('promotion', 'RVD 30th Anniversary ETB Giveaway');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(SHEET_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: data.toString(),
        keepalive: true,
        signal: controller.signal
      });
      return true;
    } catch (err) {
      console.warn('RVD sheet logging did not confirm:', err);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const now = Date.now();

    if (now < OPEN_AT) {
      status.textContent = 'The giveaway opens October 1, 2026 at 2:00 PM CT.';
      updateGate();
      return;
    }

    if (now >= CLOSE_AT) {
      status.textContent = 'Entries are closed.';
      updateGate();
      return;
    }

    const honey = form.elements['_honey'];
    if (honey && honey.value) {
      status.textContent = 'Unable to submit entry.';
      return;
    }

    if (!form.reportValidity()) return;

    button.disabled = true;
    button.textContent = 'SUBMITTING...';
    status.textContent = 'Submitting your entry...';

    if (entryId) entryId.value = makeEntryId();
    if (entryTime) entryTime.value = new Date().toISOString();

    // Log to the private RVD Google Sheet first.
    // If Google is temporarily unavailable, FormSubmit still proceeds so the
    // entrant is not blocked and the Yahoo email remains a backup record.
    await logToGoogleSheet();

    status.textContent = 'Entry received. Sending confirmation...';

    // Submit the original FormSubmit form to preserve:
    // 1) RVD Yahoo entry notification
    // 2) entrant autoresponse email
    // 3) redirect to giveaway-thanks.html
    HTMLFormElement.prototype.submit.call(form);
  });

  updateGate();
  setInterval(updateGate, 1000);
})();
