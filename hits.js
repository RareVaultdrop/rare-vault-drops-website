(() => {
  const API_BASE = 'https://floral-recipe-85e9.cgunnels1234.workers.dev';
  const form = document.querySelector('#hit-upload-form');
  const photoInput = document.querySelector('#hit-photo');
  const previewWrap = document.querySelector('#photo-preview-wrap');
  const preview = document.querySelector('#photo-preview');
  const status = document.querySelector('#hit-upload-status');
  const submit = document.querySelector('#hit-submit');
  const gallery = document.querySelector('#hits-gallery');
  const filters = [...document.querySelectorAll('.hit-filter')];
  let hits = [];
  let currentFilter = 'all';

  function setStatus(message, type='') {
    if (!status) return;
    status.textContent = message;
    status.className = 'form-status' + (type ? ' ' + type : '');
  }

  photoInput?.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) {
      previewWrap.hidden = true;
      preview.removeAttribute('src');
      return;
    }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      photoInput.value = '';
      previewWrap.hidden = true;
      setStatus('Please choose a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      photoInput.value = '';
      previewWrap.hidden = true;
      setStatus('Photo must be 8 MB or smaller.', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    preview.src = url;
    previewWrap.hidden = false;
    preview.onload = () => URL.revokeObjectURL(url);
    setStatus('');
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const file = photoInput.files?.[0];
    if (!file) return setStatus('Please choose a photo.', 'error');
    submit.disabled = true;
    submit.textContent = 'Uploading…';
    setStatus('Uploading your hit…');

    try {
      const response = await fetch(`${API_BASE}/api/hits`, { method:'POST', body:new FormData(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.message || 'Upload failed.');
      form.reset();
      previewWrap.hidden = true;
      preview.removeAttribute('src');
      setStatus('Your hit was submitted! It will appear after RVD approval.', 'success');
      await loadHits();
    } catch (err) {
      const notConfigured = /Failed to fetch|NetworkError/i.test(String(err));
      setStatus(notConfigured ? 'Hit uploads are being connected now. Please try again soon.' : (err.message || 'Upload failed. Please try again.'), 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Submit My Hit';
    }
  });

  function esc(value='') {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function renderHits() {
    if (!gallery) return;
    const visible = hits.filter(h => currentFilter === 'all' || h.hitType === currentFilter);
    if (!visible.length) {
      gallery.innerHTML = '<div class="gallery-empty">No approved hits in this category yet.</div>';
      return;
    }
    gallery.innerHTML = visible.map(hit => `
      <article class="hit-card">
        <img src="${esc(hit.imageUrl)}" alt="${esc(hit.hitType)} shared by an RVD customer" loading="lazy">
        <div class="hit-card-body">
          <span class="hit-badge ${hit.hitType === 'Vault Drop' ? 'vault' : hit.hitType === 'Chase Slab Drop' ? 'chase' : ''}">${esc(hit.hitType)}</span>
          <h3>${esc(hit.displayName || 'RVD Collector')}</h3>
          <p>${esc(hit.caption || '')}</p>
          <small>${esc(hit.machineId || '')}</small>
        </div>
      </article>`).join('');
  }

  async function loadHits() {
    try {
      const response = await fetch(`${API_BASE}/api/hits`, { headers:{Accept:'application/json'} });
      if (!response.ok) throw new Error('Unable to load hits');
      const data = await response.json();
      hits = Array.isArray(data.hits) ? data.hits : [];
      renderHits();
    } catch {
      if (gallery) gallery.innerHTML = '<div class="gallery-empty">The Hit Vault will appear here once the upload service is connected.</div>';
    }
  }

  filters.forEach(button => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter || 'all';
    filters.forEach(b => b.classList.toggle('active', b === button));
    renderHits();
  }));

  loadHits();
})();