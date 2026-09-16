document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Elementos ---------- */
  const grid          = document.getElementById('projects-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput   = document.getElementById('search');
  const modal         = document.getElementById('modal');
  const closeModalBtn = document.getElementById('close-modal');
  const themeToggle   = document.getElementById('theme-toggle');
  const progressBar   = document.getElementById('scroll-progress');
  const backToTop     = document.getElementById('back-to-top');

  let projects      = [];
  let currentFilter = 'todos';
  let searchTerm    = '';

  /* =========================================================
     1. TEMA (dark/light com persistência)
     ========================================================= */
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
  });

  /* =========================================================
     2. CARREGAR PROJETOS
     ========================================================= */
  fetch('data/projects.json')
    .then(r => r.json())
    .then(data => {
      projects = data;
      renderProjects();
    })
    .catch(err => {
      console.error('Erro ao carregar projetos:', err);
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-light)">Não foi possível carregar os projetos.</p>';
    });

  /* =========================================================
     3. RENDERIZAR
     ========================================================= */
  function renderProjects() {
    const filtered = filterProjects();
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <p style="grid-column:1/-1;text-align:center;color:var(--text-light);padding:3rem 0;font-size:1.05rem">
          Nenhum projeto encontrado 🔍
        </p>`;
      return;
    }

    filtered.forEach((project, index) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('data-id', project.id);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Ver detalhes de ${project.titulo}`);
      card.style.transitionDelay = `${index * 70}ms`;
      card.innerHTML = `
        <img src="${project.imagem}" alt="${project.titulo}" loading="lazy">
        <div class="card-content">
          <h3>${project.titulo}</h3>
          <p>${project.descricaoCurta}</p>
          <div class="tags">
            ${project.tecnologias.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      `;

      card.addEventListener('click', () => openModal(project.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(project.id);
        }
      });

      grid.appendChild(card);
      initTilt(card);
    });

    // Reveal após renderizar
    observeCards();
  }

  /* =========================================================
     4. FILTRAGEM
     ========================================================= */
  function filterProjects() {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter(p => {
      const matchFilter = currentFilter === 'todos' || p.categoria === currentFilter;
      const matchSearch =
        term === '' ||
        p.titulo.toLowerCase().includes(term) ||
        p.descricaoCurta.toLowerCase().includes(term) ||
        p.tecnologias.some(t => t.toLowerCase().includes(term));
      return matchFilter && matchSearch;
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProjects();
    });
  });

  /* Busca com debounce */
  let searchTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTerm = e.target.value;
      renderProjects();
    }, 220);
  });

  /* =========================================================
     5. REVEAL COM INTERSECTION OBSERVER
     ========================================================= */
  let cardObserver;
  function observeCards() {
    if (cardObserver) cardObserver.disconnect();
    cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.card').forEach(c => cardObserver.observe(c));
  }

  /* =========================================================
     6. TILT 3D + BRILHO QUE SEGUE O MOUSE
     ========================================================= */
  function initTilt(card) {
    const MAX_TILT = 7;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -MAX_TILT;
      const rotY = ((x - cx) / cx) * MAX_TILT;

      // Brilho segue o mouse
      card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
      card.style.setProperty('--my', `${(y / rect.height) * 100}%`);

      // Tilt
      card.style.transform =
        `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  /* =========================================================
     7. MODAL
     ========================================================= */
  let lastFocused = null;

  function openModal(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    lastFocused = document.activeElement;

    document.getElementById('modal-img').src       = project.imagem;
    document.getElementById('modal-img').alt       = project.titulo;
    document.getElementById('modal-title').textContent = project.titulo;
    document.getElementById('modal-desc').textContent  = project.descricaoLonga;

    document.getElementById('modal-tech').innerHTML =
      project.tecnologias.map(t => `<span class="tag">${t}</span>`).join('');

    toggleLink('modal-link', project.link);
    toggleLink('modal-repo', project.repositorio);

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeModalBtn.focus(), 100);
  }

  function toggleLink(elId, url) {
    const el = document.getElementById(elId);
    if (url) {
      el.href = url;
      el.style.display = 'inline-flex';
    } else {
      el.style.display = 'none';
    }
  }

  function closeModalHandler() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  closeModalBtn.addEventListener('click', closeModalHandler);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalHandler();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModalHandler();
    }
  });

  /* =========================================================
     8. SCROLL: progresso + back-to-top
     ========================================================= */
  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    progressBar.style.width = pct + '%';

    if (scrollTop > 500) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});