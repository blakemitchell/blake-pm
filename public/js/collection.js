(() => {
  for (const root of document.querySelectorAll('[data-collection]')) {
    if (root.dataset.ready) continue;
    root.dataset.ready = 'true';
    const input = root.querySelector('[data-search]');
    const list = root.querySelector('[data-entries]');
    const entries = [...list.querySelectorAll('[data-entry]')];
    const buttons = [...root.querySelectorAll('[data-tag]')];
    const clear = root.querySelector('[data-clear]');
    const sort = root.querySelector('[data-sort]');
    const selected = new Set();
    let newest = true;
    function update() {
      const query = input.value.trim().toLowerCase();
      let count = 0;
      for (const entry of entries) {
        const tags = JSON.parse(entry.dataset.tags);
        const matches = entry.dataset.searchText.includes(query) && [...selected].every(tag => tags.includes(tag));
        entry.hidden = !matches;
        if (matches) count++;
      }
      entries.slice().sort((a,b) => newest ? Number(b.dataset.date)-Number(a.dataset.date) : Number(a.dataset.date)-Number(b.dataset.date)).forEach(entry => list.append(entry));
      buttons.forEach(button => button.setAttribute('aria-pressed',String(selected.has(button.dataset.tag))));
      root.querySelector('[data-count]').textContent = String(count);
      root.querySelector('[data-empty]').hidden = count !== 0;
      clear.hidden = selected.size === 0 && !query;
      sort.textContent = newest ? 'Newest first ↓' : 'Oldest first ↑';
    }
    buttons.forEach(button => button.addEventListener('click', () => { const tag = button.dataset.tag; selected.has(tag) ? selected.delete(tag) : selected.add(tag); update(); }));
    input.addEventListener('input',update);
    clear.addEventListener('click',() => { selected.clear(); input.value=''; update(); });
    sort.addEventListener('click',() => { newest=!newest; update(); });
    root.querySelector('.collection-controls').hidden = false;
    sort.hidden = false;
    root.classList.add('enhanced');
    update();
  }
})();
