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
    const typeButtons = [...root.querySelectorAll('input[data-post-type]')];
    const allTypes = root.querySelector('[data-type-all]');
    const allTags = root.querySelector('[data-tag-all]');
    const selectedTypes = new Set();
    let newest = true;
    function update() {
      const query = input.value.trim().toLowerCase();
      let count = 0;
      for (const entry of entries) {
        const tags = JSON.parse(entry.dataset.tags);
        const matches = entry.dataset.searchText.includes(query) && [...selected].every(tag => tags.includes(tag)) && (selectedTypes.size === 0 || selectedTypes.has(entry.dataset.postType));
        entry.hidden = !matches;
        if (matches) count++;
      }
      entries.slice().sort((a,b) => newest ? Number(b.dataset.date)-Number(a.dataset.date) : Number(a.dataset.date)-Number(b.dataset.date)).forEach(entry => list.append(entry));
      buttons.forEach(button => { button.checked = selected.has(button.dataset.tag); });
      typeButtons.forEach(button => { button.checked = selectedTypes.has(button.dataset.postType); });
      if (allTypes) allTypes.checked = selectedTypes.size === 0;
      allTags.checked = selected.size === 0;
      const typeSummary = root.querySelector('[data-type-summary]');
      if (typeSummary) typeSummary.textContent = selectedTypes.size ? `${selectedTypes.size} selected` : 'All';
      root.querySelector('[data-tag-summary]').textContent = selected.size ? `${selected.size} selected` : 'All';
      root.querySelector('[data-count]').textContent = String(count);
      root.querySelector('[data-empty]').hidden = count !== 0;
      clear.hidden = selected.size === 0 && selectedTypes.size === 0 && !query;
      sort.textContent = newest ? 'Newest first ↓' : 'Oldest first ↑';
    }
    buttons.forEach(button => button.addEventListener('change', () => { const tag = button.dataset.tag; selected.has(tag) ? selected.delete(tag) : selected.add(tag); update(); }));
    typeButtons.forEach(button => button.addEventListener('change', () => { const type = button.dataset.postType; selectedTypes.has(type) ? selectedTypes.delete(type) : selectedTypes.add(type); update(); }));
    if (allTypes) allTypes.addEventListener('change', () => { selectedTypes.clear(); update(); });
    allTags.addEventListener('change', () => { selected.clear(); update(); });
    for (const filter of root.querySelectorAll('[data-filter]')) {
      let timer;
      const cancel = () => { clearTimeout(timer); timer = undefined; };
      const schedule = () => {
        if (filter.open && timer === undefined) timer = setTimeout(() => {
          filter.open = false;
          timer = undefined;
        }, 15000);
      };
      document.addEventListener('pointerdown', event => {
        if (filter.contains(event.target)) cancel();
        else schedule();
      });
      filter.addEventListener('pointerenter', cancel);
      filter.addEventListener('focusin', cancel);
      filter.addEventListener('focusout', event => {
        if (!filter.contains(event.relatedTarget)) schedule();
      });
      filter.addEventListener('toggle', () => { if (!filter.open) cancel(); });
      filter.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          filter.open = false;
          cancel();
          filter.querySelector('summary').focus();
        }
      });
    }
    input.addEventListener('input',update);
    clear.addEventListener('click',() => { selected.clear(); selectedTypes.clear(); input.value=''; update(); });
    sort.addEventListener('click',() => { newest=!newest; update(); });
    root.querySelector('.collection-controls').hidden = false;
    sort.hidden = false;
    root.classList.add('enhanced');
    update();
  }
})();
