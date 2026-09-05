(function () {
  const STORAGE_KEY = 'sellos-album-data-v1';

  const SECTIONS = [
    {
      id: 'reyes',
      icon: '👑',
      title: 'Reyes y Jefes de Estado',
      description: 'Retratos de monarcas y jefes de estado en la filatelia española',
      slots: 8,
    },
    {
      id: 'fauna-flora',
      icon: '🦅',
      title: 'Fauna y Flora Ibérica',
      description: 'Especies animales y vegetales de la península',
      slots: 8,
    },
    {
      id: 'monumentos',
      icon: '🏰',
      title: 'Monumentos y Patrimonio',
      description: 'Catedrales, castillos y lugares Patrimonio de la Humanidad',
      slots: 8,
    },
    {
      id: 'historia-postal',
      icon: '✉️',
      title: 'Historia Postal y Correos',
      description: 'Emisiones históricas y aniversarios del servicio de correos',
      slots: 8,
    },
    {
      id: 'fiestas',
      icon: '🎉',
      title: 'Fiestas y Tradiciones',
      description: 'Celebraciones populares y folclore español',
      slots: 8,
    },
  ];

  /** @type {Record<string, {image:string,name:string,year:string,value:string}>} */
  let data = loadData();

  let pages = []; // ['cover', 'reyes', 'fauna-flora', ...]
  let currentPageIndex = 0;
  let activeSlotKey = null;

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      alert('No se pudo guardar la imagen. Puede que el almacenamiento local esté lleno.');
    }
  }

  function totalSlots() {
    return SECTIONS.reduce((sum, s) => sum + s.slots, 0);
  }

  function filledSlots() {
    return Object.keys(data).length;
  }

  function buildPages() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';
    pages = ['cover'];

    SECTIONS.forEach((section) => {
      pages.push(section.id);

      const page = document.createElement('section');
      page.className = 'page';
      page.dataset.page = section.id;

      const header = document.createElement('div');
      header.className = 'page-header';
      header.innerHTML = `
        <div class="page-icon">${section.icon}</div>
        <h2>${section.title}</h2>
        <p>${section.description}</p>
        <div class="page-progress" data-progress-for="${section.id}"></div>
      `;
      page.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'stamp-grid';

      for (let i = 1; i <= section.slots; i++) {
        const key = `${section.id}-${i}`;
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.key = key;
        slot.addEventListener('click', () => openModal(key));
        grid.appendChild(slot);
      }

      page.appendChild(grid);
      container.appendChild(page);
    });
  }

  function renderSlot(key) {
    const slot = document.querySelector(`.slot[data-key="${key}"]`);
    if (!slot) return;
    const stamp = data[key];

    if (!stamp) {
      slot.className = 'slot empty';
      slot.innerHTML = '';
      return;
    }

    slot.className = 'slot filled';
    slot.innerHTML = `
      <img src="${stamp.image}" alt="${escapeHtml(stamp.name || 'Sello')}">
      <div class="slot-caption">
        <b>${escapeHtml(stamp.name || 'Sin nombre')}</b>
        ${escapeHtml([stamp.year, stamp.value].filter(Boolean).join(' · '))}
      </div>
    `;
  }

  function renderAllSlots() {
    SECTIONS.forEach((section) => {
      for (let i = 1; i <= section.slots; i++) {
        renderSlot(`${section.id}-${i}`);
      }
    });
    renderProgress();
  }

  function renderProgress() {
    document.getElementById('cover-stats').textContent =
      `${filledSlots()} / ${totalSlots()} sellos coleccionados`;

    SECTIONS.forEach((section) => {
      let count = 0;
      for (let i = 1; i <= section.slots; i++) {
        if (data[`${section.id}-${i}`]) count++;
      }
      const el = document.querySelector(`[data-progress-for="${section.id}"]`);
      if (el) el.textContent = `${count} / ${section.slots} completado`;
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  /* ---------- Navegación entre páginas ---------- */

  function goToPage(index) {
    if (index < 0 || index >= pages.length) return;
    currentPageIndex = index;
    const pageId = pages[index];

    document.querySelectorAll('.page, .cover').forEach((el) => el.classList.remove('active'));
    const target = document.querySelector(`[data-page="${pageId}"]`);
    if (target) target.classList.add('active');

    const nav = document.getElementById('album-nav');
    const title = document.getElementById('nav-title');
    if (pageId === 'cover') {
      nav.style.display = 'none';
      title.textContent = 'Portada';
    } else {
      nav.style.display = 'flex';
      const section = SECTIONS.find((s) => s.id === pageId);
      title.textContent = section ? `${section.icon} ${section.title}` : '';
    }

    document.getElementById('prev-page').disabled = index <= 1;
    document.getElementById('next-page').disabled = index >= pages.length - 1;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Modal ---------- */

  const backdrop = document.getElementById('modal-backdrop');
  const inputImage = document.getElementById('input-image');
  const inputName = document.getElementById('input-name');
  const inputYear = document.getElementById('input-year');
  const inputValue = document.getElementById('input-value');
  const previewImg = document.getElementById('modal-preview-img');
  const previewPlaceholder = document.getElementById('modal-preview-placeholder');
  let pendingImageData = null;

  function openModal(key) {
    activeSlotKey = key;
    pendingImageData = null;
    const stamp = data[key];

    document.getElementById('modal-title').textContent = stamp ? 'Editar sello' : 'Añadir sello';
    document.getElementById('btn-delete').hidden = !stamp;

    inputImage.value = '';
    inputName.value = stamp ? stamp.name || '' : '';
    inputYear.value = stamp ? stamp.year || '' : '';
    inputValue.value = stamp ? stamp.value || '' : '';

    if (stamp) {
      pendingImageData = stamp.image;
      previewImg.src = stamp.image;
      previewImg.hidden = false;
      previewPlaceholder.hidden = true;
    } else {
      previewImg.hidden = true;
      previewPlaceholder.hidden = false;
    }

    backdrop.classList.add('open');
  }

  function closeModal() {
    backdrop.classList.remove('open');
    activeSlotKey = null;
    pendingImageData = null;
  }

  inputImage.addEventListener('change', () => {
    const file = inputImage.files && inputImage.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingImageData = e.target.result;
      previewImg.src = pendingImageData;
      previewImg.hidden = false;
      previewPlaceholder.hidden = true;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-cancel').addEventListener('click', closeModal);

  document.getElementById('btn-save').addEventListener('click', () => {
    if (!activeSlotKey) return;
    if (!pendingImageData) {
      alert('Selecciona una imagen para el sello.');
      return;
    }
    data[activeSlotKey] = {
      image: pendingImageData,
      name: inputName.value.trim(),
      year: inputYear.value.trim(),
      value: inputValue.value.trim(),
    };
    saveData();
    renderSlot(activeSlotKey);
    renderProgress();
    closeModal();
  });

  document.getElementById('btn-delete').addEventListener('click', () => {
    if (!activeSlotKey) return;
    delete data[activeSlotKey];
    saveData();
    renderSlot(activeSlotKey);
    renderProgress();
    closeModal();
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  /* ---------- Inicialización ---------- */

  document.getElementById('btn-start').addEventListener('click', () => goToPage(1));
  document.getElementById('prev-page').addEventListener('click', () => goToPage(currentPageIndex - 1));
  document.getElementById('next-page').addEventListener('click', () => goToPage(currentPageIndex + 1));

  buildPages();
  renderAllSlots();
  goToPage(0);
})();
