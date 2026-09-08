// Aguarda o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  // Elementos
  const grid = document.getElementById('projects-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('search');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('close-modal');
  
  let projects = [];
  let currentFilter = 'todos';
  let searchTerm = '';

  // Carrega os projetos do JSON
  fetch('data/projects.json')
    .then(response => response.json())
    .then(data => {
      projects = data;
      renderProjects();
    })
    .catch(error => console.error('Erro ao carregar projetos:', error));

  // Renderiza os cards na grade
  function renderProjects() {
    const filtered = filterProjects();
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Nenhum projeto encontrado.</p>';
      return;
    }

    filtered.forEach(project => {
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('data-id', project.id);
      card.innerHTML = `
        <img src="${project.imagem}" alt="${project.titulo}" loading="lazy">
        <div class="card-content">
          <h3>${project.titulo}</h3>
          <p>${project.descricaoCurta}</p>
          <div class="tags">
            ${project.tecnologias.map(tech => `<span class="tag">${tech}</span>`).join('')}
          </div>
        </div>
      `;
      card.addEventListener('click', () => openModal(project.id));
      grid.appendChild(card);
    });
  }

  // Filtra projetos com base no filtro e busca
  function filterProjects() {
    return projects.filter(project => {
      const matchesFilter = currentFilter === 'todos' || project.categoria === currentFilter;
      const matchesSearch = searchTerm === '' || 
        project.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.descricaoCurta.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }

  // Event listeners para filtros
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProjects();
    });
  });

  // Busca em tempo real
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderProjects();
  });

  // Abre o modal com detalhes do projeto
  function openModal(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    document.getElementById('modal-img').src = project.imagem;
    document.getElementById('modal-img').alt = project.titulo;
    document.getElementById('modal-title').textContent = project.titulo;
    document.getElementById('modal-desc').textContent = project.descricaoLonga;

    const techContainer = document.getElementById('modal-tech');
    techContainer.innerHTML = project.tecnologias.map(tech => `<span class="tag">${tech}</span>`).join('');

    const link = document.getElementById('modal-link');
    if (project.link) {
      link.href = project.link;
      link.style.display = 'inline-block';
    } else {
      link.style.display = 'none';
    }

    const repo = document.getElementById('modal-repo');
    if (project.repositorio) {
      repo.href = project.repositorio;
      repo.style.display = 'inline-block';
    } else {
      repo.style.display = 'none';
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // trava scroll
  }

  // Fecha o modal
  function closeModalHandler() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  closeModal.addEventListener('click', closeModalHandler);

  // Fecha o modal ao clicar fora do conteúdo
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModalHandler();
    }
  });

  // Fecha modal com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      closeModalHandler();
    }
  });
});