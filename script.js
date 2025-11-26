// script.js
let eventSlugFromUrl = null; // Armazena o slug do evento da URL para uso posterior

let allEvents = []; // Armazena todos os eventos para filtragem
let favoritedEventSlugs = new Set(); // Armazena os slugs dos eventos favoritados para consulta rápida

document.addEventListener('DOMContentLoaded', () => {
    const sheetId = '1LAfG4Nt2g_P12HMCx-wEmWpXoX3yp1qAKdw89eLbeWU';
    const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    // Primeiro, lê os parâmetros da URL para saber se um evento específico deve ser aberto.
    applyFiltersFromURL();
    loadFavorites(); // Carrega os favoritos do localStorage antes de exibir os eventos
    loadAndDisplayEvents(googleSheetUrl);
    setupFilters();
    setupModal();
    setupContactModal();
    setupBackToTopButton();
    setupThemeToggle();
    setupNavigation(); 
    setupProducersFeature(); // Configura a aba de produtoras
    setupSetsFeature(); // Configura a aba de sets (carregamento e busca)
});

/**
 * Envia um evento para o Google Analytics.
 * @param {string} action - O nome da ação do evento (ex: 'click_button').
 * @param {Object} params - Um objeto com parâmetros adicionais para o evento.
 */
function trackGAEvent(action, params) {
  if (typeof gtag === 'function') {
    gtag('event', action, params);
  } else {
    console.warn(`gtag function not found. Analytics event not tracked: ${action}`, params);
  }
}

/**
 * Mapeamento de nomes de eventos para imagens locais específicas.
 * Isso substitui a longa cadeia de if/else if, tornando o código mais limpo e fácil de manter.
 * As chaves devem estar em minúsculas para corresponder à verificação.
 */
const eventImageMap = {
    'na pista': 'assets/napista.PNG',
    'beije': 'assets/beije.PNG',
    'wav & friends': 'assets/wav.PNG',
    'wav & sunset': 'assets/wavsunset.PNG',
    'kolaje na estação': 'assets/kolaje.jpg',
    'papoco: ignição': 'assets/papoco.jpg',
    'numalaje 3 anos': 'assets/numalaje.PNG',
    'numalaje 3 anos - after': 'assets/numalaje.PNG',
    'nandi bota tudo': 'assets/nandi.PNG',
    'bateu convida badsista & friends': 'assets/bateubadsista.PNG',
    'fritaria': 'assets/fritaria.PNG',
    'bunker': 'assets/bunker.jpg',
    'baile do ddzin': 'assets/bailedoddzin.jpg',
    'titanica': 'assets/titanica.jpg',
    'fabrika': 'assets/fabrika.jpg',
    'insana 2': 'assets/insana.PNG',
    'bleed': 'assets/bleed.PNG',
    'cade o funk que tava aqui?': 'assets/funkbateu.PNG',
    'mare alta': 'assets/marealta.PNG',
    'psy club vs progressive psy': 'assets/psy.PNG',
    'after da kolaje': 'assets/afterkolaje.jpg',
    'loren day party: candy edition': 'assets/lorenday.PNG',
    'addams halloween': 'assets/adams.PNG',
    'elas na areia': 'assets/elasnaareia.PNG',
    'lobbotomia': 'assets/lobotomia.PNG',
    'puro êxtase': 'assets/extase.jpg',
    'mysterious': 'assets/vintage.PNG',
    'vulgaris': 'assets/vulgaris.PNG',
    'esquenta da ignis erótica: preliminar':  'assets/preliminar.PNG',
    'zep club': 'assets/zepelim.PNG',
    'ziohm': 'assets/ziohm.PNG',
    'link': 'assets/link.jpg',
    'baguncinha': 'assets/baguncinha.PNG',
    'clube fatal': 'assets/clubefatal.PNG',
    'delorean night': 'assets/delorean.PNG',
    'calunia dance club': 'assets/calunia.PNG',
    'penumbra 7 anos': 'assets/penumbra.PNG',
    'baile da bateu': 'assets/bailebateu.PNG',
    'honeyball': 'assets/honeyball.jpg',
    '4rtin': 'assets/4tin.PNG',
    'quental e friends': 'assets/quental.PNG',
    'atrita house music': 'assets/atritahm.PNG',
    'verãodoismil': 'assets/verao2k.PNG',
    'na pista praia': 'assets/napista2.PNG',
    'voyage fliperama': 'assets/voyagefliperama.PNG',
    'pacific eletrohits vol. 2': 'assets/pacificeletrohits.PNG',
    'sexpressions': 'assets/sexpressions.PNG',
    'batrita 3': 'assets/batrita.jpg',
    'frenetica': 'assets/frenetica.PNG',
    'submundo coletivo noiz4': 'assets/lajenoiz4.PNG',
    'melange': 'assets/melange.PNG',
    'ovo frito': 'assets/ovofrito.PNG',
    'joao rave': 'assets/joaorave.PNG',
    'beije': 'assets/beije.PNG',
    'abstracto sessions': 'assets/abstractosessions.PNG',
    'argel e firma': 'assets/argelefirma.PNG',
    'sunset trance': 'assets/sunsettrance1.PNG',
    'dark club de natal': 'assets/darkclubnatal.PNG',
    'boiler fuzz': 'assets/boilerfuzz.PNG',
    'radar feat bateu': 'assets/bateuradar.PNG',
    'gasguita feroz':  'assets/gasguitaferoz.PNG',
    'baile do ddzin convida baile do brota': 'assets/bailedoddzinbrota.jpg',
    'clandestina': 'assets/clandestina.PNG',
    'mirage djs': 'assets/miragedjs.PNG'

}

/**
 * Renderiza a lista de sets na seção de sets.
 * @param {Array<Object>} sets - O array de sets a ser renderizado.
 */
function renderSets(sets) {
    const grid = document.getElementById('sets-grid');
    if (!grid) {
        console.error('Container da grade de sets não encontrado.');
        return;
    }

    if (sets.length === 0) {
        grid.innerHTML = '<p class="empty-grid-message">Nenhum set encontrado.</p>';
        return;
    }

    const setsHtml = sets.map(set => {
        // Formata a data de publicação para o formato DD/MM/AAAA
        let formattedDate = '';
        if (set.publishedDate) {
            const publicationDate = new Date(set.publishedDate);
            // toLocaleDateString garante o formato local correto (ex: 25/11/2025)
            formattedDate = publicationDate.toLocaleDateString('pt-BR');
        }

        const playerHtml = `<iframe width="100%" height="315" src="${set.embedUrl}" title="YouTube video player for ${set.setName}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

        return `
            <div class="set-card">
                <h3 class="set-card__title">${set.setName}</h3>
                <p class="set-card__details">Produtora: ${set.produtora || 'N/A'} &bull; Artista: ${set.artist}${formattedDate ? ` &bull; Publicado em: ${formattedDate}` : ''}</p>
                ${playerHtml}
            </div>
        `;
    }).join('');

    grid.innerHTML = setsHtml;
}
function setupNavigation() {
    const navEventsBtn = document.getElementById('nav-events-btn');
    const navSetsBtn = document.getElementById('nav-sets-btn');
    const navProducersBtn = document.getElementById('nav-producers-btn'); // Novo botão
    const eventsContent = document.querySelector('.main-content'); // Container principal dos eventos
    const setsSection = document.getElementById('sets-section');
    const producersSection = document.getElementById('producers-section'); // Nova seção
    const weeklySection = document.getElementById('weekly-events-section');
    const filtersWrapper = document.querySelector('.filters-wrapper');
    const setsFiltersWrapper = document.getElementById('sets-filters-wrapper');
    const producersFiltersWrapper = document.getElementById('producers-filters-wrapper'); // Novo filtro

    if (!navEventsBtn || !navSetsBtn || !navProducersBtn || !eventsContent || !setsSection || !producersSection || !weeklySection || !filtersWrapper || !setsFiltersWrapper || !producersFiltersWrapper) {
        console.warn('Elementos de navegação ou filtros não encontrados. A troca de abas não funcionará completamente.');
        return;
    }

    navEventsBtn.addEventListener('click', () => {
        eventsContent.style.display = 'block';
        filtersWrapper.style.display = 'flex'; // Mostra os filtros de eventos
        setsFiltersWrapper.style.display = 'none'; // Esconde os filtros de sets
        producersFiltersWrapper.style.display = 'none'; // Esconde os filtros de produtoras

        // Mostra a seção de eventos da semana apenas se nenhum filtro estiver ativo
        const anyFilterActive = document.getElementById('clear-all-filters-btn').hidden === false;
        if (!anyFilterActive) {
            weeklySection.style.display = 'block';
        }
        setsSection.style.display = 'none';
        producersSection.style.display = 'none';
        
        navEventsBtn.classList.add('is-active');
        navSetsBtn.classList.remove('is-active');
        navProducersBtn.classList.remove('is-active');
    });

    navSetsBtn.addEventListener('click', () => {
        eventsContent.style.display = 'none';        
        filtersWrapper.style.display = 'none'; // Esconde os filtros de eventos
        setsFiltersWrapper.style.display = 'flex'; // Mostra os filtros de sets
        producersFiltersWrapper.style.display = 'none'; // Esconde os filtros de produtoras
        weeklySection.style.display = 'none'; // Oculta os eventos da semana
        setsSection.style.display = 'block';
        producersSection.style.display = 'none';

        navSetsBtn.classList.add('is-active');
        navEventsBtn.classList.remove('is-active');
        navProducersBtn.classList.remove('is-active');

        // Carrega os sets apenas na primeira vez que a aba é clicada.
        // A verificação `allSets.length === 0` previne recarregamentos desnecessários.
        if (typeof loadSets === 'function' && window.allSets.length === 0) {
            loadSets();
        }
    });

    navProducersBtn.addEventListener('click', () => {
        eventsContent.style.display = 'none';
        filtersWrapper.style.display = 'none'; // Esconde os filtros de eventos
        setsFiltersWrapper.style.display = 'none'; // Esconde os filtros de sets
        producersFiltersWrapper.style.display = 'flex'; // Mostra os filtros de produtoras
        weeklySection.style.display = 'none'; // Oculta os eventos da semana
        setsSection.style.display = 'none';
        producersSection.style.display = 'block';

        navProducersBtn.classList.add('is-active');
        navEventsBtn.classList.remove('is-active');
        navSetsBtn.classList.remove('is-active');

        // O carregamento das produtoras é disparado em setupProducersFeature
    });
}

/**
 * Configura a aba de "Sets Gravados", incluindo o carregamento dos dados e a funcionalidade de busca.
 */
function setupSetsFeature() {
    // URL da aba principal de sets ("SetsPublicados")
    const setsSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQSJHdHpGeR9FMMOt1ZwPmxu7bcWZSoxV1igHKduAYtReCgn3VqJeVJwrWkCg9amHWYa3gn1WCGvIup/pub?gid=1607121527&single=true&output=csv';
    // URL da aba de cache de vídeos, que contém a data de publicação ("VideoCache")
    const videoCacheSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQSJHdHpGeR9FMMOt1ZwPmxu7bcWZSoxV1igHKduAYtReCgn3VqJeVJwrWkCg9amHWYa3gn1WCGvIup/pub?gid=1975133328&single=true&output=csv';

    const searchInput = document.getElementById('sets-search-input');
    const clearBtn = document.getElementById('clear-sets-search-btn');
    const loader = document.getElementById('sets-search-loader');
    const grid = document.getElementById('sets-grid');
    let debounceTimer;
    
    // A verificação dos elementos deve ser feita aqui, no início da configuração.
    if (!searchInput || !clearBtn || !loader || !grid) {
        console.warn('Elementos da seção de sets não encontrados. A funcionalidade estará desativada.');
        return;
    }

    /**
     * Extrai o ID de um vídeo do YouTube de várias URLs possíveis.
     * @param {string} url - A URL do YouTube.
     * @returns {string|null} O ID do vídeo ou null se não for encontrado.
     */
    function getYouTubeID(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Expõe `allSets` e `loadSets` globalmente para que a navegação possa acessá-los.
    window.allSets = []; 
    window.loadSets = async function() {
        if (!setsSheetUrl || !videoCacheSheetUrl) {
            grid.innerHTML = '<p class="empty-grid-message">As URLs das planilhas de sets não foram configuradas.</p>';
            return;
        }

        grid.innerHTML = '<p class="empty-grid-message">Carregando sets...</p>';

        // Busca os dados mais recentes em segundo plano
        try {
            // 1. Busca dados das duas planilhas em paralelo
            const [setsResponse, cacheResponse] = await Promise.all([
                fetch(setsSheetUrl),
                fetch(videoCacheSheetUrl)
            ]);

            if (!setsResponse.ok) throw new Error(`Falha ao carregar a planilha de sets (Status: ${setsResponse.status})`);
            if (!cacheResponse.ok) throw new Error(`Falha ao carregar o cache de vídeos (Status: ${cacheResponse.status})`);
            
            const [setsCsv, cacheCsv] = await Promise.all([
                setsResponse.text(),
                cacheResponse.text()
            ]);

            const setsData = parseCSV(setsCsv);
            const cacheData = parseCSV(cacheCsv);

            // 2. Cria um mapa de datas a partir do VideoCache para busca rápida
            // A chave do mapa será o "Nome do Set" para encontrar a data correspondente.
            const dateMap = new Map();
            cacheData.forEach(row => {
                const setName = getProp(row, 'SetName');
                const publishedDate = getProp(row, 'Data de Publicação');
                if (setName && publishedDate) {
                    dateMap.set(setName, publishedDate);
                }
            });

            // 3. Processa os dados da planilha principal (SetsPublicados) e adiciona a data do mapa
            window.allSets = setsData.map(row => {
                const setName = getProp(row, 'SetName') || '';
                const videoId = getYouTubeID(getProp(row, 'VideoURL'));
                
                return {
                    setName: setName.replace(/#/g, ''),
                    artist: getProp(row, 'Artist') || (setName.split(' - ')[0] || 'Artista Desconhecido').trim(),
                    produtora: getProp(row, 'Produtora'),
                    embedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null,
                    // Busca a data no mapa usando o nome do set como chave
                    publishedDate: dateMap.get(setName) || null
                };
            }).filter(set => set.embedUrl); // Garante que apenas sets com vídeo válido sejam mostrados

            // 4. Ordena os sets pela data de publicação, do mais novo para o mais antigo
            window.allSets.sort((a, b) => {
                // Coloca sets sem data no final da lista
                if (!a.publishedDate) return 1;
                if (!b.publishedDate) return -1;
                return new Date(b.publishedDate) - new Date(a.publishedDate);
            });
            
            renderSets(window.allSets);

        } catch (error) {
            console.error("Falha ao carregar ou processar os sets:", error);
            grid.innerHTML = `<p class="empty-grid-message" style="color: red;">Ocorreu um erro ao carregar os sets.</p>`;
        }
    }

    /**
     * Aplica o filtro de busca aos sets.
     */
    function applySetFilter() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        clearBtn.hidden = !searchTerm;

        const filteredSets = window.allSets.filter(set => {
            const setName = set.setName.toLowerCase();
            const artist = set.artist.toLowerCase();
            const produtora = set.produtora.toLowerCase();
            return setName.includes(searchTerm) || artist.includes(searchTerm) || produtora.includes(searchTerm);
        });

        // Reordena a lista filtrada para garantir que a ordem cronológica seja mantida.
        const sortedFilteredSets = filteredSets.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));

        renderSets(sortedFilteredSets);
    }

    // Listeners
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applySetFilter, 300);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applySetFilter();
        searchInput.focus();
    });
}

/**
 * Configura a aba de "Produtoras", incluindo o carregamento dos dados e a funcionalidade de busca.
 */
function setupProducersFeature() {
    // IMPORTANTE: Crie uma nova aba na sua planilha para as produtoras e cole a URL de publicação CSV aqui.
    // Colunas esperadas: Nome, Logo (URL), Instagram (URL)
    const producersSheetUrl = ''; // <-- COLE A URL DA SUA PLANILHA DE PRODUTORAS AQUI

    const searchInput = document.getElementById('producers-search-input');
    const clearBtn = document.getElementById('clear-producers-search-btn');
    const grid = document.getElementById('producers-grid');
    let debounceTimer;
    let allProducers = [];

    if (!searchInput || !clearBtn || !grid) {
        console.warn('Elementos da seção de produtoras não encontrados. A funcionalidade estará desativada.');
        return;
    }

    /**
     * Carrega e processa as produtoras da planilha.
     */
    async function loadProducers() {
        if (!producersSheetUrl) {
            grid.innerHTML = '<p class="empty-grid-message">A URL da planilha de produtoras não foi configurada.</p>';
            return;
        }

        showSkeletonLoader(grid, 6);

        try {
            const response = await fetch(producersSheetUrl);
            if (!response.ok) throw new Error(`Falha ao carregar a planilha de produtoras (Status: ${response.status})`);

            const csvText = await response.text();
            allProducers = parseCSV(csvText).map(producer => ({
                name: getProp(producer, 'Nome') || 'Produtora Desconhecida',
                logoUrl: getProp(producer, 'Logo (URL)'),
                instagramUrl: getProp(producer, 'Instagram (URL)')
            })).sort((a, b) => a.name.localeCompare(b.name)); // Ordena por nome
            
            renderProducers(allProducers);

        } catch (error) {
            console.error("Falha ao carregar ou processar as produtoras:", error);
            grid.innerHTML = `<p class="empty-grid-message" style="color: red;">Ocorreu um erro ao carregar as produtoras.</p>`;
        }
    }

    /**
     * Renderiza a lista de produtoras na grade.
     * @param {Array<Object>} producers - O array de produtoras a ser renderizado.
     */
    function renderProducers(producers) {
        if (!grid) return;

        if (producers.length === 0) {
            grid.innerHTML = '<p class="empty-grid-message">Nenhuma produtora encontrada.</p>';
            return;
        }

        const instagramIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
        const placeholderSvg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3e%3crect width='100%25' height='100%25' fill='%23e9ecef'/%3e%3ctext x='50%25' y='50%25' fill='%236c757d' font-size='20' text-anchor='middle' dominant-baseline='middle'%3eLogo%3c/text%3e%3c/svg%3e";

        const producersHtml = producers.map(producer => `
            <article class="event-card" data-producer-name="${producer.name}" style="cursor: pointer;" title="Ver eventos de ${producer.name}">
                <img src="${producer.logoUrl || placeholderSvg}" alt="Logo de ${producer.name}" class="event-card__image" loading="lazy">
                <div class="event-card__info">
                    <h2 class="event-card__name">${producer.name}</h2>
                </div>
                <div class="event-card__footer">
                    ${producer.instagramUrl ? `
                        <a href="${producer.instagramUrl}" target="_blank" rel="noopener noreferrer" class="event-card__tickets-btn" onclick="event.stopPropagation(); trackGAEvent('click_instagram', { producer_name: '${producer.name.replace(/'/g, "\\'")}' });">
                            ${instagramIconSvg} Instagram
                        </a>
                    ` : ''}
                </div>
            </article>
        `).join('');
 
        grid.innerHTML = producersHtml;

        // Adiciona o listener de clique para cada card de produtora
        grid.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Impede que o clique no link do Instagram propague para o card
                if (e.target.closest('a')) return;

                const producerName = card.dataset.producerName;
                if (!producerName) return;

                // 1. Muda para a aba de eventos
                document.getElementById('nav-events-btn').click();

                // 2. Preenche o campo de busca e dispara o filtro
                const searchInput = document.getElementById('search-input');
                searchInput.value = producerName;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    }

    function applyProducerFilter() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        clearBtn.hidden = !searchTerm;

        const filteredProducers = allProducers.filter(producer => 
            producer.name.toLowerCase().includes(searchTerm)
        );

        renderProducers(filteredProducers);
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyProducerFilter, 300);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applyProducerFilter();
        searchInput.focus();
    });

    loadProducers();
}

/**
 * Orquestra o carregamento, análise e exibição dos eventos.
 * @param {string} csvPath - O caminho para o arquivo CSV.
 */
async function loadAndDisplayEvents(csvPath) {
  const grid = document.getElementById('event-grid');
  if (!grid) {
    console.error("Erro Crítico: Container da grade de eventos não encontrado.");
    return;
  }

  const cacheKey = 'events_cache';

  // Função para processar e renderizar os eventos a partir do texto CSV
  const processAndRender = (csvText) => {
    const parsedEvents = parseCSV(csvText);
    
    allEvents = parsedEvents.filter(event => {
      const oculto = (getProp(event, 'Oculto') || '').toLowerCase();
      return oculto !== 'sim' && oculto !== 'true';
    });
    
    renderWeeklyEvents(allEvents);

    const parseDate = (dateString) => {
      if (!dateString || typeof dateString !== 'string') return null;
      const parts = dateString.split('/');
      if (parts.length !== 3) return null;
      return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureEvents = allEvents.filter(event => {
      const eventDate = parseDate(getProp(event, 'Data') || getProp(event, 'Date'));
      return eventDate && eventDate >= today;
    });

    renderEvents(getSortedEvents(futureEvents), grid);
    populateGenreFilter(allEvents);

    if (eventSlugFromUrl) {
      const eventToOpen = allEvents.find(e => createEventSlug(getProp(e, 'Evento') || getProp(e, 'Nome')) === eventSlugFromUrl);
      if (eventToOpen) openModal(eventToOpen);
    }
  };

  // Tenta carregar do cache primeiro
  const cachedData = sessionStorage.getItem(cacheKey);
  if (cachedData) {
    processAndRender(cachedData);
  } else {
    showSkeletonLoader(grid, 6);
  }

  // Busca os dados mais recentes em segundo plano
  try {
    const response = await fetch(csvPath);
    if (!response.ok) {
      throw new Error(`Falha ao carregar a planilha (Status: ${response.status})`);
    }
    const freshCsvText = await response.text();

    // Se os dados novos forem diferentes do cache (ou se não houver cache),
    // atualiza a tela e o cache.
    if (freshCsvText !== cachedData) {
      sessionStorage.setItem(cacheKey, freshCsvText);
      if (cachedData) { // Se já havia cache, significa que estamos atualizando
        console.log("Dados dos eventos atualizados em segundo plano.");
      }
      processAndRender(freshCsvText);
    }
  } catch (error) {
    console.error("Falha ao carregar ou renderizar os eventos:", error);
    // Só mostra o erro na tela se não houver dados em cache para exibir.
    if (!cachedData) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        grid.innerHTML = `<p style="color: #c0392b;"><b>Falha na conexão.</b> Verifique sua internet e tente recarregar a página.</p>`;
      } else {
        grid.innerHTML = `<p style="color: red;">Ocorreu um erro inesperado ao carregar os eventos. Verifique o console para mais detalhes.</p>`;
      }
    }
  }
}

/**
 * Lê os parâmetros da URL na inicialização e aplica os filtros correspondentes.
 */
function applyFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const date = params.get('date');
    const genre = params.get('genre');
    eventSlugFromUrl = params.get('event'); // Apenas captura o slug do evento para uso posterior

    let filtersApplied = false;

    if (search) {
        document.getElementById('search-input').value = search;
        filtersApplied = true;
    }
    if (date) {
        document.getElementById('date-filter').value = date;
        filtersApplied = true;
    }
    if (genre) {
        document.getElementById('genre-filter').value = genre;
        filtersApplied = true;
    }

    // Se algum filtro foi aplicado pela URL, chamamos applyFilters para atualizar a UI (ex: texto do campo de data)
    // Isso será chamado novamente em setupFilters, mas a primeira chamada garante a UI inicial correta.
    // if (filtersApplied) applyFilters();
    // A chamada foi movida para o final de setupFilters() para evitar chamadas duplas e garantir que todos os elementos
    // da UI (como o texto do campo de data) sejam atualizados após a configuração dos listeners.
}
/**
 * Analisa uma string de texto CSV em um array de objetos de produto.
 * Esta função é mais robusta e lida com campos entre aspas que podem conter vírgulas.
 * @param {string} text - O conteúdo bruto do arquivo CSV.
 * @returns {Array<Object>} Um array de objetos, onde cada objeto representa um evento.
 */
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    let headerLine = lines.shift();
    if (headerLine.charCodeAt(0) === 0xFEFF) {
        headerLine = headerLine.substring(1);
    }

    // Regex para extrair cabeçalhos, lidando com cabeçalhos entre aspas que podem ter vírgulas.
    const headerRegex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]+))(?:,|$)/g;
    const headers = [];
    let match;
    while (match = headerRegex.exec(headerLine)) {
        headers.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
    }

    return lines.map(line => {
        if (line.trim() === '') return null;

        const event = {};
        let headerIndex = 0;
        // Regex para extrair valores da linha, similar à de cabeçalhos.
        const valueRegex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g;
        valueRegex.lastIndex = 0; // Reseta o índice da regex para cada linha.

        // Itera sobre a linha para extrair cada valor de célula
        while (headerIndex < headers.length) {
            const match = valueRegex.exec(line);
            const value = (match && match[1]) ? match[1].replace(/""/g, '"') : (match && match[2]) ? match[2] : '';
            event[headers[headerIndex]] = value.trim();
            headerIndex++;
        }
        return event;
    }).filter(Boolean); // Filtra quaisquer linhas nulas (malformadas)
}

/**
 * Renderiza a lista de eventos no elemento grid fornecido.
 * @param {Array<Object>} events - O array de eventos a ser renderizado.
 * @param {HTMLElement} gridElement - O elemento container onde os eventos serão inseridos.
 */
function renderEvents(events, gridElement) {
    const dateInput = document.getElementById('date-filter');
    const selectedDate = dateInput ? dateInput.value : null;
    loadFavorites(); // Garante que os favoritos estejam atualizados antes de renderizar

    gridElement.innerHTML = ''; // Limpa os skeletons ou a mensagem "Carregando..."
    if (events.length === 0) {
        if (selectedDate) {
            gridElement.innerHTML = '<p class="empty-grid-message">Nenhuma festa agendada para esta data.</p>';
        } else {
            gridElement.innerHTML = '<p class="empty-grid-message">Nenhuma festa encontrada com os filtros aplicados.</p>';
        }
        return;
    }

    const fragment = document.createDocumentFragment();
    events.forEach((event, index) => {
        const card = createEventCardElement(event);
        card.style.animationDelay = `${index * 75}ms`; // Adiciona um atraso escalonado
        fragment.appendChild(card);
    });
    gridElement.appendChild(fragment);
}

/**
 * Preenche o dropdown de filtro de gênero com base nos gêneros encontrados nos eventos.
 * @param {Array<Object>} events - A lista de todos os eventos.
 */
function populateGenreFilter(events) {
    const genreFilter = document.getElementById('genre-filter');
    if (!genreFilter) return;
    
    // Usamos um Map para garantir que os gêneros sejam únicos, ignorando maiúsculas/minúsculas.
    // A chave será o gênero em minúsculas, e o valor será o gênero com a capitalização original.
    const uniqueGenres = new Map();

    events.forEach(event => {
        const genresString = getProp(event, 'Gênero');
        if (genresString) {
            const genres = genresString.split(',').map(g => g.trim());
            genres.forEach(genre => {
                if (genre && !uniqueGenres.has(genre.toLowerCase())) {
                    uniqueGenres.set(genre.toLowerCase(), genre);
                }
            });
        }
    });

    const sortedGenres = Array.from(uniqueGenres.values()).sort((a, b) => a.localeCompare(b));
    sortedGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.toLowerCase();
        option.textContent = genre;
        genreFilter.appendChild(option);
    });
}

/**
 * Renderiza a seção "Eventos da Semana" com os próximos eventos.
 * @param {Array<Object>} allEvents - A lista completa de todos os eventos.
 */
function renderWeeklyEvents(allEvents) {
    const weeklySection = document.getElementById('weekly-events-section');
    if (!weeklySection) return;

    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextFiveDays = new Date(today);
    nextFiveDays.setDate(today.getDate() + 5);

    const upcomingEvents = allEvents
        .map(event => ({ ...event, parsedDate: parseDate(getProp(event, 'Data') || getProp(event, 'Date')) }))
        .filter(event => event.parsedDate && event.parsedDate >= today && event.parsedDate <= nextFiveDays)
        .sort((a, b) => a.parsedDate - b.parsedDate);

    if (upcomingEvents.length > 0) {
        weeklySection.style.display = 'block'; // Mostra a seção
        
        const eventsHtml = upcomingEvents.map(event => {
            const name = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento';
            const date = getProp(event, 'Data') || getProp(event, 'Date');
            const location = getProp(event, 'Local') || 'Local a confirmar';
            let imageUrl = getProp(event, 'Imagem (URL)');
            
            const eventNameLower = name.trim().toLowerCase();
            if (eventImageMap[eventNameLower]) {
                imageUrl = eventImageMap[eventNameLower];
            }

            const placeholderSvg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100%25' height='100%25' fill='%23333'/%3e%3c/svg%3e";

            return `
                <a href="#" class="weekly-event-card" data-event-slug="${createEventSlug(name)}">
                    <img src="${imageUrl || placeholderSvg}" alt="${name}" class="weekly-event-card__image" loading="lazy">
                    <div class="weekly-event-card__info">
                        <h3>${name}</h3>
                        <p>${date} &bull; ${location}</p>
                    </div>
                </a>
            `;
        }).join('');

        weeklySection.innerHTML = `
            <h2 id="weekly-events-title">Eventos da semana</h2>
            <div class="weekly-events-grid">${eventsHtml}</div>
        `;

        // Adiciona listeners para abrir o modal ao clicar nos cards da semana
        weeklySection.querySelectorAll('.weekly-event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const slug = card.dataset.eventSlug;
                const eventToOpen = allEvents.find(ev => createEventSlug(getProp(ev, 'Evento') || getProp(ev, 'Nome')) === slug);
                if (eventToOpen) openModal(eventToOpen);
            });
        });
    }
}
/**
 * Retorna uma cópia dos eventos ordenados por data.
 * @param {Array<Object>} events - A lista de eventos a ser ordenada.
 * @returns {Array<Object>} A lista de eventos ordenada.
 */
function getSortedEvents(events) {
    // Cria uma cópia para não modificar o array original
    const eventsToSort = [...events];

    // Helper para converter "DD/MM/YYYY" para um objeto Date
    const parseDate = (dateString) => {
        // Adiciona uma verificação para garantir que dateString é um texto válido
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        // Formato: new Date(ano, mês - 1, dia)
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    // Ordena os eventos pela data, do mais antigo para o mais recente
    eventsToSort.sort((a, b) => {
        const dateA = parseDate(getProp(a, 'Data') || getProp(a, 'Date'));
        const dateB = parseDate(getProp(b, 'Data') || getProp(b, 'Date'));

        // Trata casos onde a data pode ser inválida ou não existir
        if (!dateB) return -1;
        if (!dateA) return 1;

        // Compara as datas (b - a para ordem decrescente)
        return dateA - dateB;
    });

    return eventsToSort;
}

/**
 * Configura os filtros de busca por texto e por data.
 */
function setupFilters() {
    let debounceTimer;
    const searchInput = document.getElementById('search-input');
    const dateInput = document.getElementById('date-filter');
    const genreFilter = document.getElementById('genre-filter');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const favoritesFilterBtn = document.getElementById('favorites-filter-btn');
    const clearDateBtn = document.getElementById('clear-date-btn');
    const clearAllBtn = document.getElementById('clear-all-filters-btn');
    const datePickerTrigger = document.querySelector('.date-picker-trigger');
    const dateValueDisplay = document.getElementById('date-filter-value');
    const shareFiltersBtn = document.getElementById('share-filters-btn');
    const searchLoader = document.getElementById('search-loader');
    const grid = document.getElementById('event-grid');

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedDate = dateInput.value;
        const selectedGenre = genreFilter.value;
        const favoritesOnly = favoritesFilterBtn.classList.contains('is-active');

        // Adiciona/remove a classe 'is-active' para feedback visual
        searchInput.classList.toggle('is-active', !!searchTerm);        
        dateInput.classList.toggle('is-active', !!selectedDate);
        genreFilter.classList.toggle('is-active', !!selectedGenre);
        // O estado do botão de favoritos é controlado por clique, não aqui.

        // Mostra/esconde botões de limpar e define se algum filtro está ativo
        clearSearchBtn.hidden = !searchTerm;
        clearDateBtn.hidden = !selectedDate;
        const anyFilterActive = !!searchTerm || !!selectedDate || (!!selectedGenre && selectedGenre !== '') || favoritesOnly;
        clearAllBtn.hidden = !anyFilterActive;
        shareFiltersBtn.hidden = !anyFilterActive;

        // Oculta a seção "Eventos da semana" se qualquer filtro estiver ativo
        const weeklySection = document.getElementById('weekly-events-section');
        if (weeklySection) {
            weeklySection.style.display = anyFilterActive ? 'none' : 'block';
        }

        // Atualiza o display do filtro de data com o novo estilo
        if (selectedDate) {
            const [year, month, day] = selectedDate.split('-');
            dateValueDisplay.textContent = `${day}/${month}/${year}`;
            dateValueDisplay.classList.add('has-value');
        } else {
            dateValueDisplay.textContent = 'Calendário';
            dateValueDisplay.classList.remove('has-value');
        }

        // Atualiza a URL com os parâmetros de filtro
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedDate) params.set('date', selectedDate);
        if (selectedGenre) params.set('genre', selectedGenre);
        if (favoritesOnly) params.set('favorites', 'true');

        const queryString = params.toString();

        if (anyFilterActive && !shareFiltersBtn.dataset.initialLoad) {
            trackGAEvent('filter_used', { search_term: searchTerm, date: selectedDate, genre: selectedGenre, favorites: favoritesOnly });
        }

        const newUrl = queryString 
            ? `${window.location.pathname}?${queryString}`
            : window.location.pathname;
        
        // Usa replaceState para não poluir o histórico do navegador a cada tecla
        window.history.replaceState({ path: newUrl }, '', newUrl);

        let filteredEvents;

        // 1. Filtra por data PRIMEIRO, pois ele define a base de eventos.
        if (selectedDate) {
            // Se uma data for selecionada, a busca é feita em TODOS os eventos.
            const [year, month, day] = selectedDate.split('-'); // 'YYYY', 'MM', 'DD'
            // Remove o zero à esquerda do dia e do mês para corresponder ao formato da planilha (ex: '1/11/2024' em vez de '01/11/2024')
            const formattedDate = `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
            
            filteredEvents = allEvents.filter(event => {
                const eventDate = getProp(event, 'Data') || getProp(event, 'Date');
                return eventDate === formattedDate;
            });
        } else {

            // Por padrão, mostra apenas eventos futuros.
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const parseDateForFilter = (dateString) => {
                if (!dateString || typeof dateString !== 'string') return null;
                const parts = dateString.split('/');
                if (parts.length !== 3) return null;
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };
            filteredEvents = allEvents.filter(event => {
                const eventDate = parseDateForFilter(getProp(event, 'Data') || getProp(event, 'Date'));
                return eventDate && eventDate >= today;
            });
        }

        // 2. Filtra por termo de busca (sobre o resultado do filtro de data)
        if (searchTerm) {
            filteredEvents = filteredEvents.filter(event => {
                const name = (getProp(event, 'Evento') || getProp(event, 'Nome') || '').toLowerCase();
                const location = (getProp(event, 'Local') || '').toLowerCase();
                const producer = (getProp(event, 'Produtora') || '').toLowerCase(); // Adicionado
                const attractions = (getProp(event, 'Atrações') || '').toLowerCase();
                return name.includes(searchTerm) || location.includes(searchTerm) || attractions.includes(searchTerm) || producer.includes(searchTerm);
            });
        }

        // 3. Filtra por gênero (sobre o resultado dos filtros anteriores)
        if (selectedGenre) {
            filteredEvents = filteredEvents.filter(event => {
                const genresString = getProp(event, 'Gênero');
                if (!genresString) return false;
                // Converte a string de gêneros do evento para um array de minúsculas
                const eventGenres = genresString.split(',').map(g => g.trim().toLowerCase());
                // Verifica se o gênero selecionado está na lista de gêneros do evento
                return eventGenres.includes(selectedGenre);
            });
        }

        // 4. Filtra por favoritos (sobre o resultado dos filtros anteriores)
        if (favoritesOnly) {
            filteredEvents = filteredEvents.filter(event => {
                const eventSlug = createEventSlug(getProp(event, 'Evento') || getProp(event, 'Nome'));
                return favoritedEventSlugs.has(eventSlug);
            });
        }

        renderEvents(getSortedEvents(filteredEvents), grid);
    };

    // Adiciona listeners
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        
        // Mostra o spinner imediatamente se houver texto
        if (searchInput.value) {
            searchLoader.hidden = false;
            clearSearchBtn.hidden = true; // Esconde o 'x' para não sobrepor o spinner
        } else {
            searchLoader.hidden = true;
            clearSearchBtn.hidden = true;
        }

        debounceTimer = setTimeout(() => {
            applyFilters();
            // Esconde o spinner após a filtragem
            searchLoader.hidden = true;
        }, 300); // Atraso de 300ms
    });

    dateInput.addEventListener('change', applyFilters);
    // Impede a digitação manual no campo de data, forçando o uso do calendário.
    dateInput.addEventListener('keydown', (e) => {
        e.preventDefault();
    });

    genreFilter.addEventListener('change', applyFilters);

    favoritesFilterBtn.addEventListener('click', () => {
        favoritesFilterBtn.classList.toggle('is-active');
        applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        applyFilters();
        searchInput.focus(); // Devolve o foco para a barra de busca
    });

    clearDateBtn.addEventListener('click', () => {
        dateInput.value = '';
        applyFilters();
        dateInput.classList.remove('is-active'); // Garante que o placeholder customizado reapareça
    });

    clearAllBtn.addEventListener('click', () => {
        searchInput.value = '';
        dateInput.value = '';
        genreFilter.value = '';
        favoritesFilterBtn.classList.remove('is-active');
        applyFilters();
    });

    // Chama applyFilters uma vez na inicialização para definir o estado dos botões com base nos parâmetros da URL
    applyFilters();
    // Marca que a carga inicial foi concluída para não rastrear o primeiro `applyFilters` como uma ação do usuário.
    shareFiltersBtn.dataset.initialLoad = 'true';

    shareFiltersBtn.addEventListener('click', () => {
        // A URL já está correta na barra de endereço
        navigator.clipboard.writeText(window.location.href).then(() => {
            const originalHtml = shareFiltersBtn.innerHTML;
            const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            shareFiltersBtn.innerHTML = `${checkIconSvg} <span>Link Copiado!</span>`;
            shareFiltersBtn.disabled = true;

            trackGAEvent('share', { method: 'Copy Filter Link', content_type: 'filters' });
            
            setTimeout(() => {
                shareFiltersBtn.innerHTML = originalHtml;
                shareFiltersBtn.disabled = false;
            }, 2000);
        }).catch(err => {
            console.error('Falha ao copiar o link do filtro: ', err);
            alert('Não foi possível copiar o link.');
        });
    });
}

/**
 * Configura o botão para alternar entre tema claro e escuro.
 */
function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');

    // Função para aplicar o tema e atualizar o ícone
    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-theme');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            body.classList.remove('light-theme');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    };

    // Verifica o tema salvo no localStorage ao carregar a página
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Adiciona o listener de clique para o botão
    themeToggleBtn.addEventListener('click', () => {
        const isLight = body.classList.contains('light-theme');
        const newTheme = isLight ? 'dark' : 'light';
        
        applyTheme(newTheme);
        
        // Salva a preferência do usuário
        localStorage.setItem('theme', newTheme);

        trackGAEvent('change_theme', { theme: newTheme });
    });
}

/**
 * Exibe uma interface de "esqueleto" para melhorar a percepção de velocidade.
 * @param {HTMLElement} gridElement - O container onde os esqueletos serão inseridos.
 * @param {number} count - O número de cartões de esqueleto a serem exibidos.
 */
function showSkeletonLoader(gridElement, count) {
    gridElement.innerHTML = ''; // Limpa a mensagem "Carregando..."
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const card = document.createElement('article');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton-info">
                <div class="skeleton skeleton-text" style="width: 40%;"></div>
                <div class="skeleton skeleton-text" style="width: 80%; height: 1.2em; margin-bottom: 1rem;"></div>
                <div class="skeleton skeleton-text" style="width: 60%; height: 1.5em;"></div>
            </div>
        `;
        fragment.appendChild(card);
    }
    gridElement.appendChild(fragment);
}


/**
 * Cria um único elemento de cartão de evento.
 * @param {Object} event - O objeto do evento.
 * @returns {HTMLElement} O elemento do cartão pronto para ser inserido no DOM.
 */
function createEventCardElement(event) {
    const card = document.createElement('article');
    card.className = 'event-card';

    const eventName = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento sem nome';
    const eventSlug = createEventSlug(eventName);
    const isEventFavorited = isFavorited(eventSlug);

    // Tenta buscar por "Evento" e, se não encontrar, tenta por "Nome".
    const name = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento sem nome';
    const date = getProp(event, 'Data') || getProp(event, 'Date') || 'Data a confirmar';
    const location = getProp(event, 'Local') || 'Localização não divulgada';
    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');
    const attractions = getProp(event, 'Atrações') || '';
    let imageUrl = getProp(event, 'Imagem (URL)');
    const genres = getProp(event, 'Gênero');
    const ticketUrl = getProp(event, 'Ingressos (URL)');
    const instagramUrl = getProp(event, 'Instagram (URL)');
    const coupon = getProp(event, 'Cupom');

    // Usando Data URI para o placeholder, garantindo que funcione offline.
    // ... (código do placeholder)
    const placeholderSvg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3e%3crect width='100%25' height='100%25' fill='%23e9ecef'/%3e%3ctext x='50%25' y='50%25' fill='%236c757d' font-size='20' text-anchor='middle' dominant-baseline='middle'%3eEvento%3c/text%3e%3c/svg%3e";
    const errorSvg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3e%3crect width='100%25' height='100%25' fill='%23e9ecef'/%3e%3ctext x='50%25' y='50%25' fill='%23dc3545' font-size='20' text-anchor='middle' dominant-baseline='middle'%3eImagem Inválida%3c/text%3e%3c/svg%3e";

    // Verifica se há uma imagem local específica para este evento no mapa.
    const eventNameLower = name.trim().toLowerCase();
    if (eventImageMap[eventNameLower]) {
        imageUrl = eventImageMap[eventNameLower];
    }

    // Formata a string de horário
    const timeString = formatTimeString(startTime, endTime);
    
    const dateTimeString = timeString ? `${date} - ${timeString}` : date;

    const instagramIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;

    let genreTagsHtml = '';
    if (genres) {
        const genreList = genres.split(',').map(g => g.trim());
        // Junta os gêneros em uma única string, separados por um ponto.
        const genreText = genreList.join(' &bull; ');
        genreTagsHtml = `<p class="event-card__genres">${genreText}</p>`;
    }

    // Helper para converter "DD/MM/YYYY" para um objeto Date
    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera o horário para comparar apenas o dia

    const eventDate = parseDate(date);
    const isPastEvent = eventDate && eventDate < today;

    const favoriteButtonHtml = `
        <button class="favorite-btn ${isEventFavorited ? 'favorited' : ''}" data-event-slug="${eventSlug}" title="${isEventFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
            ${getHeartIcon(isEventFavorited)}
        </button>
    `;

    let ticketHtml = '';
    if (isPastEvent) {
        ticketHtml = `<div class="event-card__footer"><span class="event-card__tickets-btn event-card__tickets-btn--free event-card__status--highlight">Evento já realizado</span></div>`;
    } else if (ticketUrl) {
        const ticketInfo = ticketUrl.toLowerCase().trim();
        if (ticketInfo === 'gratuito') {
            ticketHtml = `<div class="event-card__footer"><span class="event-card__tickets-btn event-card__tickets-btn--free">Gratuito</span></div>`;
        } else if (ticketInfo === 'couvert') {
            ticketHtml = `<div class="event-card__footer"><span class="event-card__tickets-btn event-card__tickets-btn--free">Couvert no local</span></div>`;
        } else {
            ticketHtml = `<div class="event-card__footer"><a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" class="event-card__tickets-btn" onclick="trackGAEvent('click_ticket', { event_name: '${name.replace(/'/g, "\\'")}', source: 'card' }); event.stopPropagation();">Comprar Ingresso</a></div>`;
        }
    } else {
        ticketHtml = `<div class="event-card__footer"><span class="event-card__tickets-btn event-card__tickets-btn--free">Vendas não divulgadas</span></div>`;
    }

    card.innerHTML = `
        <img src="${imageUrl || placeholderSvg}" alt="${name}" class="event-card__image" loading="lazy" onerror="this.onerror=null;this.src='${errorSvg}';">
        <div class="event-card__info">
            <h2 class="event-card__name">${name}</h2>
            ${genreTagsHtml}
            <p class="event-card__details">${dateTimeString}</p>
            ${attractions ? `<p class="event-card__attractions">${attractions}</p>` : ''}
            ${instagramUrl ? `<p class="event-card__instagram"><a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" onclick="trackGAEvent('click_instagram', { event_name: '${name.replace(/'/g, "\\'")}', source: 'card' }); event.stopPropagation();">${instagramIconSvg} Instagram</a></p>` : ''}
            <p class="event-card__location">${location}</p>
        </div>
        ${favoriteButtonHtml}
        ${ticketHtml}
    `;

    card.addEventListener('click', () => {
        const eventSlug = createEventSlug(name);
        const params = new URLSearchParams(window.location.search);
        params.set('event', eventSlug);
        const newUrl = `${window.location.pathname}?${params.toString()}`;

        // Atualiza a URL sem recarregar a página
        window.history.pushState({ path: newUrl }, '', newUrl);

        openModal(event);
    });

    // Adiciona listener para o botão de favorito
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique no botão abra o modal
        toggleFavorite(event, favoriteBtn);
    });

    return card;
}

/**
 * Formata a string de horário com a primeira letra maiúscula.
 * @param {string} name O nome do evento.
 * @returns {string} O slug formatado para URL.
 */
function createEventSlug(name) {
    if (!name) return 'evento-sem-nome';
    return name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais, exceto espaços e hífens
        .trim()
        .replace(/\s+/g, '-'); // Substitui espaços por hífens
}
/**
 * Formata a string de horário com a primeira letra maiúscula.
 * @param {string} startTime - O horário de início.
 * @param {string} endTime - O horário de término.
 * @returns {string} A string de horário formatada.
 */
function formatTimeString(startTime, endTime) {
    let timeString = '';
    if (startTime && endTime) {
        timeString = `de ${startTime}h até ${endTime}h`;
    } else if (startTime) {
        timeString = `às ${startTime}h`;
    }

    if (timeString) {
        return timeString.charAt(0).toUpperCase() + timeString.slice(1);
    }
    return '';
}

/**
 * Helper para encontrar uma propriedade em um objeto de forma flexível.
 * Ignora maiúsculas/minúsculas, espaços e aspas nos nomes das chaves.
 * @param {Object} obj O objeto a ser pesquisado.
 * @param {string} propName O nome da propriedade a ser encontrada.
 */
function getProp(obj, propName) {
    // Como os cabeçalhos já foram normalizados, podemos fazer uma busca mais simples.
    const key = Object.keys(obj).find(k => k.toLowerCase() === propName.toLowerCase());
    return obj[key];
}

/**
 * Carrega os slugs dos eventos favoritados do localStorage.
 */
function loadFavorites() {
    const favorites = localStorage.getItem('favoritedEvents');
    if (favorites) {
        favoritedEventSlugs = new Set(JSON.parse(favorites));
    }
}

/**
 * Salva os slugs dos eventos favoritados no localStorage.
 */
function saveFavorites() {
    localStorage.setItem('favoritedEvents', JSON.stringify(Array.from(favoritedEventSlugs)));
}

/**
 * Verifica se um evento está favoritado.
 * @param {string} eventSlug - O slug do evento.
 * @returns {boolean} - True se o evento estiver favoritado.
 */
function isFavorited(eventSlug) {
    return favoritedEventSlugs.has(eventSlug);
}

/**
 * Retorna o SVG do ícone de coração, preenchido ou não.
 * @param {boolean} isFilled - Se o coração deve ser preenchido.
 * @returns {string} O HTML do SVG.
 */
function getHeartIcon(isFilled) {
    const fill = isFilled ? 'currentColor' : 'none';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
}

/**
 * Adiciona ou remove um evento dos favoritos e atualiza a UI de todos os botões de favorito para esse evento.
 * @param {Object} event - O objeto do evento.
 * @param {HTMLElement} clickedButtonElement - O botão de favorito que foi clicado (para feedback imediato).
 */
function toggleFavorite(event, clickedButtonElement) {
    const eventSlug = createEventSlug(getProp(event, 'Evento') || getProp(event, 'Nome'));
    const isCurrentlyFavorited = favoritedEventSlugs.has(eventSlug);

    if (isCurrentlyFavorited) {
        favoritedEventSlugs.delete(eventSlug);
    } else {
        favoritedEventSlugs.add(eventSlug);
    }
    saveFavorites();

    trackGAEvent(isCurrentlyFavorited ? 'unfavorite_event' : 'favorite_event', { event_name: getProp(event, 'Evento') || getProp(event, 'Nome') });

    // Atualiza todos os botões de favorito associados a este slug de evento
    document.querySelectorAll(`.favorite-btn[data-event-slug="${eventSlug}"]`).forEach(btn => {
        const isNowFavorited = favoritedEventSlugs.has(eventSlug);
        if (isNowFavorited) {
            btn.classList.add('favorited');
        } else {
            btn.classList.remove('favorited');
        }
        btn.innerHTML = getHeartIcon(isNowFavorited);
        btn.title = isNowFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    });

    // Se o filtro de favoritos estiver ativo, reaplica os filtros para remover o card da tela
    if (document.getElementById('favorites-filter-btn').classList.contains('is-active')) applyFilters();
}

/**
 * Renderiza os eventos favoritados na seção "Meus Favoritos".
 */
function renderFavorites() {
    const favoritesSection = document.getElementById('favorites-section');
}
/**
 * Configura os listeners para abrir e fechar o modal.
 */
function setupModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');

    const closeModal = () => {
        overlay.classList.remove('is-visible');
        document.body.style.overflow = '';

        // Limpa o parâmetro 'event' da URL ao fechar o modal
        const params = new URLSearchParams(window.location.search);
        params.delete('event');
        const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    // Fecha ao clicar no botão
    closeBtn.addEventListener('click', closeModal);

    // Fecha ao clicar fora do modal (no overlay)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Fecha ao pressionar a tecla "Escape"
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-visible')) {
            closeModal();
        }
    });
}

/**
 * Configura os listeners para abrir e fechar o modal de contato.
 */
function setupContactModal() {
    const triggerBtn = document.getElementById('contact-trigger-btn');
    const overlay = document.getElementById('contact-modal-overlay');
    const closeBtn = document.getElementById('contact-modal-close-btn');

    if (!triggerBtn || !overlay || !closeBtn) return;

    const openModal = (e) => {
        e.preventDefault();
        overlay.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
        trackGAEvent('open_contact_modal');
    };

    const closeModal = () => {
        overlay.classList.remove('is-visible');
        document.body.style.overflow = '';
    };

    triggerBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-visible')) {
            closeModal();
        }
    });
}
/**
 * Abre o modal e o preenche com os detalhes do evento.
 * @param {Object} event - O objeto do evento a ser exibido.
 */
function openModal(event) {
    const overlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    const eventName = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento sem nome';
    const eventSlug = createEventSlug(eventName);
    const isEventFavorited = isFavorited(eventSlug);

    const name = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento sem nome';
    const date = getProp(event, 'Data') || getProp(event, 'Date') || 'Data a confirmar';
    const location = getProp(event, 'Local') || 'Localização não divulgada';
    const attractions = getProp(event, 'Atrações') || 'Não informado';
    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');
    const ticketUrl = getProp(event, 'Ingressos (URL)');
    const instagramUrl = getProp(event, 'Instagram (URL)');
    const coupon = getProp(event, 'Cupom');

    let locationHtml = `<span>${location}</span>`;

    const mapPinIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

    // Se houver um local válido, cria um link para o Google Maps
    if (location && location !== 'Localização não divulgada') {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        locationHtml = `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${mapPinIconSvg} ${location}</a>`;
    }

    const timeString = formatTimeString(startTime, endTime);

    const instagramIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
    let instagramDetailHtml = '';
    if (instagramUrl) {
        let profileName = 'Instagram'; // Texto padrão
        try {
            // Extrai o nome do perfil da URL do Instagram
            const url = new URL(instagramUrl.startsWith('http') ? instagramUrl : `https://${instagramUrl}`);
            const pathParts = url.pathname.split('/').filter(part => part); // Remove partes vazias
            if (pathParts.length > 0) {
                // Pega a primeira parte do caminho que não seja 'p', 'reel', etc.
                const handle = pathParts.find(p => !['p', 'reel', 'reels', 'tv', 'stories'].includes(p.toLowerCase()));
                if (handle) profileName = `@${handle}`;
            }
        } catch (e) {
            console.error("URL do Instagram inválida:", instagramUrl, e);
        }
        instagramDetailHtml = `
            <div class="modal-detail-item">
                <span class="modal-detail-label">Instagram</span>
                <span class="modal-detail-value"><a href="${instagramUrl}" target="_blank" rel="noopener noreferrer">${instagramIconSvg} ${profileName}</a></span>
            </div>
        `;
    }

    let couponDetailHtml = '';
    if (coupon) {
        couponDetailHtml = `
            <div class="modal-detail-item">
                <span class="modal-detail-label">Cupom de Desconto</span>
                <div class="coupon-container">
                    <span class="modal-detail-value coupon-code">${coupon}</span>
                    <button class="copy-coupon-btn" data-coupon="${coupon}">Copiar</button>
                </div>
            </div>
        `;
    }
    const copyLinkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>`;
    const whatsappIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.357 1.849 6.081l-1.214 4.425 4.56-1.195z"/></svg>`;
    const instagramIconSvgModal = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;

    // Verifica se o evento já passou para definir o botão de ação
    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastEvent = parseDate(date) && parseDate(date) < today;

    let ticketActionHtml = '';
    if (isPastEvent) {
        ticketActionHtml = `<span class="share-btn tickets-btn tickets-btn--free event-card__status--highlight">Evento já realizado</span>`;
    } else if (ticketUrl) {
        const ticketInfo = ticketUrl.toLowerCase().trim();
        if (ticketInfo === 'gratuito') {
            ticketActionHtml = `<span class="share-btn tickets-btn tickets-btn--free">Gratuito</span>`;
        } else if (ticketInfo === 'couvert') {
            ticketActionHtml = `<span class="share-btn tickets-btn tickets-btn--free">Couvert no local</span>`;
        } else {
            ticketActionHtml = `<a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" class="share-btn tickets-btn" onclick="trackGAEvent('click_ticket', { event_name: '${name.replace(/'/g, "\\'")}', source: 'modal' })">Comprar Ingresso</a>`;
        }
    } else {
        ticketActionHtml = `<span class="share-btn tickets-btn tickets-btn--free">Vendas não divulgadas</span>`;
    }

    modalContent.innerHTML = `
        <button class="favorite-btn modal-favorite-btn ${isEventFavorited ? 'favorited' : ''}" data-event-slug="${eventSlug}" title="${isEventFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
            ${getHeartIcon(isEventFavorited)}
        </button>

        <h2>${name}</h2>
        <div class="modal-details-grid">
            <div class="modal-detail-item">
                <span class="modal-detail-label">Data</span>
                <span class="modal-detail-value">${date}</span>
            </div>
            ${timeString ? `
            <div class="modal-detail-item">
                <span class="modal-detail-label">Horário</span>
                <span class="modal-detail-value">${timeString}</span>
            </div>` : ''}
            <div class="modal-detail-item">
                <span class="modal-detail-label">Local</span>
                <span class="modal-detail-value location-container">${locationHtml}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">Atrações</span>
                <span class="modal-detail-value">${attractions}</span>
            </div>
            ${instagramDetailHtml}
            ${couponDetailHtml}
        </div>

        <hr class="modal-separator">
        <div class="modal-actions">
            ${ticketActionHtml}
            <button class="share-btn whatsapp-btn">${whatsappIconSvg} Compartilhar no WhatsApp</button>
            <button class="share-btn instagram-story-btn">${instagramIconSvgModal} Compartilhar nos stories</button>
            <button class="share-btn copy-link-btn">${copyLinkIconSvg} Copiar link</button>
        </div>
    `;

    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';

    /* Copiar link */
    const copyLinkBtn = modalContent.querySelector('.copy-link-btn');

    // Adiciona listener para o botão de favorito no modal
    const modalFavoriteBtn = modalContent.querySelector('.modal-favorite-btn');
    modalFavoriteBtn.addEventListener('click', () => {
        toggleFavorite(event, modalFavoriteBtn);
    });

    const copyCouponBtn = modalContent.querySelector('.copy-coupon-btn');
    if (copyCouponBtn) {
        copyCouponBtn.addEventListener('click', () => {
            const couponCode = copyCouponBtn.dataset.coupon;
            navigator.clipboard.writeText(couponCode).then(() => {
                const originalText = copyCouponBtn.textContent;
                copyCouponBtn.textContent = 'Copiado!';
                copyCouponBtn.disabled = true;
                setTimeout(() => {
                    copyCouponBtn.textContent = originalText;
                    copyCouponBtn.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Falha ao copiar o cupom: ', err);
            });
        });
    }
    if (copyLinkBtn) {
       
        const shareUrl = window.location.href;

        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                const originalHtml = copyLinkBtn.innerHTML;
                copyLinkBtn.innerHTML = `${checkIconSvg} Link Copiado!`;
                copyLinkBtn.disabled = true;
                trackGAEvent('share', { method: 'Copy Link', content_type: 'event', item_id: name });
                setTimeout(() => {
                    copyLinkBtn.innerHTML = originalHtml;
                    copyLinkBtn.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Falha ao copiar o link: ', err);
            });
        });
    }

    /* Compartilhar no Whats */
    const whatsappBtn = modalContent.querySelector('.whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const shareUrl = window.location.href;
            const shareText = `Confira este evento: *${name}* em ${date}! Saiba mais aqui: ${shareUrl}`;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;            
            trackGAEvent('share', { method: 'WhatsApp', content_type: 'event', item_id: name });
            window.open(whatsappUrl, '_blank');
        });
    }

    /* Compartilhar nos Stories */
    const storyBtn = modalContent.querySelector('.instagram-story-btn');
    if (storyBtn) {
        if (!navigator.canShare || !navigator.share) {
            storyBtn.hidden = true;
        }

        let stickerFile = null; // Variável para armazenar o arquivo gerado

        const handleShareClick = async () => {
            const originalText = storyBtn.innerHTML;

            // Se o arquivo ainda não foi gerado, gera primeiro.
            if (!stickerFile) {
                storyBtn.disabled = true;
                try {
                    // Etapa 1: Copia o link do evento para a área de transferência IMEDIATAMENTE.
                    const shareUrl = window.location.href;
                    await navigator.clipboard.writeText(shareUrl);

                    // Etapa 2: Mostra feedback visual de que o link foi copiado.
                    const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    storyBtn.innerHTML = `${checkIconSvg} Link copiado!`;

                    // Etapa 3: Após um breve momento, começa a gerar a imagem.
                    setTimeout(async () => {
                        storyBtn.innerHTML = 'Gerando imagem...';
                        try {
                            await document.fonts.ready;
                            const stickerBlob = await createStorySticker(event);
                            stickerFile = new File([stickerBlob], `story-${createEventSlug(name)}.png`, { type: 'image/png' });
                            
                            // Atualiza o botão para a etapa de compartilhamento
                            storyBtn.innerHTML = 'Compartilhar';
                            storyBtn.disabled = false;
                        } catch (err) {
                            // Trata erro na geração da imagem
                            throw err;
                        }
                    }, 1200); // Aguarda 1.2 segundos para o usuário ver a mensagem.

                } catch (err) {
                    console.error('Erro ao gerar o sticker:', err);
                    alert(err.message || 'Não foi possível copiar o link ou gerar a imagem.');
                    storyBtn.innerHTML = originalText;
                    storyBtn.disabled = false;
                }
                return; // Sai da função para esperar o próximo clique do usuário
            }

            // Se o arquivo já foi gerado, compartilha imediatamente.
            if (stickerFile) {
                try {
                    if (!navigator.canShare || !navigator.canShare({ files: [stickerFile] })) {
                        throw new Error("Seu navegador não suporta o compartilhamento de arquivos. Tente usar o Safari no iPhone.");
                    }
                    await navigator.share({ files: [stickerFile] });
                    trackGAEvent('share', { method: 'Instagram Stories', content_type: 'event', item_id: name });

                    // Após o compartilhamento, instrui o usuário a usar o link copiado.
                    storyBtn.innerHTML = 'Link copiado! Cole no sticker de link';
                    storyBtn.disabled = true;
                    setTimeout(() => {
                        storyBtn.innerHTML = originalText;
                        storyBtn.disabled = false;
                        stickerFile = null; // Reseta para o próximo uso
                    }, 3500);

                } catch (err) {
                    alert(err.message || 'Não foi possível compartilhar a imagem.');
                }
            }
        };

        storyBtn.addEventListener('click', handleShareClick);
    }
}

/**
 * Gera uma imagem (Blob) de um sticker de story para o evento.
 * @param {Object} event O objeto do evento.
 * @returns {Promise<Blob>} Uma promessa que resolve com o Blob da imagem.
 */
async function createStorySticker(event) {
    const name = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento';
    const date = getProp(event, 'Data') || getProp(event, 'Date') || 'Em breve';
    const location = getProp(event, 'Local') || 'Local a confirmar';
    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');
    const attractions = getProp(event, 'Atrações') || '';
    let imageUrl = eventImageMap[name.toLowerCase()] || getProp(event, 'Imagem (URL)') || '';

    // Se a imagem for uma URL externa (começa com http), usa um proxy de imagem para evitar problemas de CORS.
    // Isso garante que o html2canvas consiga renderizar a imagem.
    if (imageUrl.startsWith('http')) {
        // Remove o 'https://' ou 'http://' para passar a URL limpa para o proxy.
        const cleanUrl = imageUrl.replace(/^(https?:\/\/)/, '');
        imageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
    }

    // Cria um container temporário para o sticker
    const stickerContainer = document.createElement('div');
    stickerContainer.className = 'story-sticker-container';
    document.body.appendChild(stickerContainer);

    try {
        // Otimização de Performance para iOS: Pré-carrega TODAS as imagens (evento e fundo)
        // e as converte para Data URL antes de passar para o html2canvas.
        const [eventImageBlob, mapImageBlob] = await Promise.all([
            fetch(imageUrl).then(res => res.blob()),
            fetch('assets/mapa.jpg').then(res => res.blob())
        ]);

        const readBlobAsDataURL = (blob) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const [eventImageAsDataUrl, mapImageAsDataUrl] = await Promise.all([
            readBlobAsDataURL(eventImageBlob),
            readBlobAsDataURL(mapImageBlob)
        ]);

        // Formata a string de horário para incluir no sticker
        const timeString = formatTimeString(startTime, endTime);
        const detailsParts = [date];
        if (timeString) detailsParts.push(timeString);
        detailsParts.push(location);
        const detailsText = detailsParts.join(' &bull; ');

        // Aplica o fundo do mapa com um gradiente mais suave
        stickerContainer.style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.6), rgba(18, 18, 18, 0.9)), url(${mapImageAsDataUrl})`;

        // Etapa 2: Monta o HTML do sticker com a imagem já embutida.
        stickerContainer.innerHTML = `
            <div class="story-sticker__main-content">
                <img src="${eventImageAsDataUrl}" class="story-sticker__image" />
                <div class="story-sticker__text-wrapper">
                    <h1 class="story-sticker__title">${name}</h1>
                    ${attractions ? `<p class="story-sticker__attractions">${attractions}</p>` : ''}
                    <p class="story-sticker__details">${detailsText}</p>
                </div>
            </div>
            <div class="story-sticker__footer">Onde é hoje?</div>
        `;

        // Etapa 3: Gera o canvas. Agora, este passo será muito mais rápido.
        const canvas = await html2canvas(stickerContainer, { 
            useCORS: true, 
            backgroundColor: null, 
            allowTaint: true,
            // Otimização de performance: Força a escala para 1.
            // Evita que o html2canvas use o devicePixelRatio (2x ou 3x em iPhones),
            // o que torna a geração da imagem muito mais rápida. Aumentamos a resolução base no CSS.
            scale: 1 
        });
        return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    } catch (error) {
        console.error("Falha ao criar o sticker:", error);
        throw new Error("Não foi possível carregar a imagem do evento para o sticker.");
    } finally {
        // Remove o container temporário do DOM após a captura
        document.body.removeChild(stickerContainer);
    }
}

/**
 * Configura o botão "Voltar ao Topo".
 */
function setupBackToTopButton() {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (!backToTopBtn) return;

    // Mostra ou esconde o botão com base na rolagem
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) { // Mostra o botão após rolar 300px
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

    });

    // Rola para o topo ao clicar
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Previne o comportamento padrão do link '#'
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Rolagem suave
        });
    });
}
