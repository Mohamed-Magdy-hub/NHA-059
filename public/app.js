(async function () {
  const form = document.getElementById('shortenForm');
  const urlInput = document.getElementById('urlInput');
  const result = document.getElementById('result');
  const shortLink = document.getElementById('shortLink');
  const meta = document.getElementById('meta');
  const errorEl = document.getElementById('error');
  const recentList = document.getElementById('recentList');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    result.style.display = 'none';
  }

  function hideError() {
    errorEl.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const url = urlInput.value.trim();
    if (!url) {
      return showError('Please provide a URL');
    }
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) {
        return showError(data.error || 'Failed to shorten URL');
      }
      shortLink.href = data.shortUrl;
      shortLink.textContent = data.shortUrl;
      meta.textContent = `Original: ${data.originalUrl} • Visits: ${data.visits || 0}`;
      result.style.display = 'block';
      // refresh list
      loadRecent();
    } catch (err) {
      console.error(err);
      showError('Network error');
    }
  });

  async function loadRecent() {
    try {
      const res = await fetch('/api/urls');
      if (!res.ok) return;
      const rows = await res.json();
      recentList.innerHTML = '';
      rows.slice(0, 10).forEach((r) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-start';
        li.innerHTML = `<div><a href="${r.shortUrl}" target="_blank" rel="noopener noreferrer">${r.shortUrl}</a><div class="small text-muted">${r.originalUrl}</div></div><span class="badge bg-secondary rounded-pill">${r.visits}</span>`;
        recentList.appendChild(li);
      });
    } catch (err) {
      // ignore
    }
  }

  // initial load
  loadRecent();
})();