(() => {
  const API_BASE = 'https://floral-recipe-85e9.cgunnels1234.workers.dev';
  const loginForm = document.querySelector('#admin-login-form');
  const keyInput = document.querySelector('#admin-key');
  const status = document.querySelector('#admin-status');
  const dashboard = document.querySelector('#admin-dashboard');
  const list = document.querySelector('#admin-hit-list');
  const summary = document.querySelector('#admin-summary');
  const filter = document.querySelector('#admin-filter');
  const refresh = document.querySelector('#admin-refresh');
  const lock = document.querySelector('#admin-lock');
  let adminKey = '';
  let hits = [];

  function setStatus(message, type='') {
    status.textContent = message;
    status.className = 'form-status' + (type ? ' ' + type : '');
  }

  function esc(value='') {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function prettyDate(value) {
    if (!value) return 'Unknown date';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'Unknown date' : d.toLocaleString();
  }

  async function api(path, options={}) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${adminKey}`);
    if (!headers.has('Accept')) headers.set('Accept','application/json');
    const response = await fetch(`${API_BASE}${path}`, {...options, headers});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      const err = new Error(data.message || `Request failed (${response.status})`);
      err.status = response.status;
      throw err;
    }
    return data;
  }

  function render() {
    const chosen = filter.value;
    const visible = hits.filter(hit => chosen === 'all' || (hit.status || 'pending') === chosen);
    const counts = hits.reduce((acc, hit) => {
      const s = hit.status || 'pending';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    summary.innerHTML = `<strong>${counts.pending || 0}</strong> pending &nbsp;•&nbsp; <strong>${counts.approved || 0}</strong> approved &nbsp;•&nbsp; <strong>${counts.rejected || 0}</strong> rejected`;

    if (!visible.length) {
      list.innerHTML = `<div class="gallery-empty">No ${esc(chosen === 'all' ? '' : chosen + ' ')}submissions found.</div>`;
      return;
    }

    list.innerHTML = visible.map(hit => {
      const state = hit.status || 'pending';
      const buttons = state === 'pending' ? `
        <div class="admin-card-actions">
          <button type="button" data-action="approved" data-key="${encodeURIComponent(hit.key)}">Approve</button>
          <button type="button" class="reject-action" data-action="rejected" data-key="${encodeURIComponent(hit.key)}">Reject</button>
        </div>` : `<div class="admin-state ${esc(state)}">${esc(state.toUpperCase())}</div>`;
      return `
        <article class="admin-hit-card">
          <div class="admin-hit-photo"><img src="${esc(hit.imageUrl)}" alt="Customer hit submission" loading="lazy"></div>
          <div class="admin-hit-details">
            <div class="admin-hit-topline">
              <span class="hit-badge ${hit.hitType === 'Vault Drop' ? 'vault' : hit.hitType === 'Chase Slab Drop' ? 'chase' : ''}">${esc(hit.hitType || 'Big Hit')}</span>
              <span class="admin-state ${esc(state)}">${esc(state)}</span>
            </div>
            <h3>${esc(hit.displayName || 'RVD Collector')}</h3>
            <dl>
              <div><dt>Machine ID</dt><dd>${esc(hit.machineId || '—')}</dd></div>
              <div><dt>Submitted</dt><dd>${esc(prettyDate(hit.submittedAt))}</dd></div>
            </dl>
            <p>${esc(hit.caption || 'No caption provided.')}</p>
            ${buttons}
          </div>
        </article>`;
    }).join('');
  }

  async function loadQueue() {
    setStatus('Loading submissions…');
    try {
      const data = await api('/api/admin/hits');
      hits = Array.isArray(data.hits) ? data.hits : [];
      dashboard.hidden = false;
      render();
      setStatus('Review queue unlocked.', 'success');
    } catch (err) {
      if (err.status === 401) {
        adminKey = '';
        dashboard.hidden = true;
        setStatus('Admin key is incorrect.', 'error');
      } else {
        setStatus(err.message || 'Could not load submissions.', 'error');
      }
    }
  }

  async function changeStatus(encodedKey, newStatus, button) {
    button.disabled = true;
    const original = button.textContent;
    button.textContent = newStatus === 'approved' ? 'Approving…' : 'Rejecting…';
    try {
      await api(`/api/admin/hits/${encodedKey}`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({status:newStatus})
      });
      const decoded = decodeURIComponent(encodedKey);
      const hit = hits.find(h => h.key === decoded);
      if (hit) hit.status = newStatus;
      render();
      setStatus(newStatus === 'approved' ? 'Hit approved and published to the Hit Vault.' : 'Hit rejected.', 'success');
    } catch (err) {
      button.disabled = false;
      button.textContent = original;
      setStatus(err.message || 'Could not update submission.', 'error');
    }
  }

  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    adminKey = keyInput.value.trim();
    if (!adminKey) return setStatus('Enter the admin key.', 'error');
    loadQueue();
  });

  filter.addEventListener('change', render);
  refresh.addEventListener('click', loadQueue);
  lock.addEventListener('click', () => {
    adminKey = '';
    keyInput.value = '';
    hits = [];
    dashboard.hidden = true;
    setStatus('Admin review locked.');
    keyInput.focus();
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-action][data-key]');
    if (!button) return;
    changeStatus(button.dataset.key, button.dataset.action, button);
  });
})();
