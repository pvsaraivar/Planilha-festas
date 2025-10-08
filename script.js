// script.js
let eventSlugFromUrl = null; // Armazena o slug do evento da URL para uso posterior

let allEvents = []; // Armazena todos os eventos para filtragem

document.addEventListener('DOMContentLoaded', () => {
    const sheetId = '1LAfG4Nt2g_P12HMCx-wEmWpXoX3yp1qAKdw89eLbeWU';
    const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    // Primeiro, lê os parâmetros da URL para saber se um evento específico deve ser aberto.
    applyFiltersFromURL();
    loadAndDisplayEvents(googleSheetUrl);
    setupFilters();
    setupModal();
    setupContactModal();
    setupBackToTopButton();
    setupThemeToggle();
});

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
    'puro êxtase': 'assets/extase.jpg'
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

    showSkeletonLoader(grid, 6); // Mostra 6 cartões de esqueleto imediatamente

    try {
        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`Falha ao carregar o arquivo '${csvPath}'. Verifique se o nome do arquivo está correto e se ele está na mesma pasta do index.html. (Status: ${response.status})`);
        }
        const csvText = await response.text();
        const parsedEvents = parseCSV(csvText);
        
        // Filtra os eventos que não estão marcados como "Oculto" na planilha
        allEvents = parsedEvents.filter(event => {
            const oculto = (getProp(event, 'Oculto') || '').toLowerCase();
            return oculto !== 'sim' && oculto !== 'true';
        });
        
        // Helper para converter "DD/MM/YYYY" para um objeto Date
        const parseDate = (dateString) => {
            if (!dateString || typeof dateString !== 'string') return null;
            const parts = dateString.split('/');
            if (parts.length !== 3) return null;
            return new Date(parts[2], parts[1] - 1, parts[0]);
        };

        // Pega a data de hoje, zerando o horário para comparar apenas o dia
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filtra para mostrar apenas eventos futuros na carga inicial
        const futureEvents = allEvents.filter(event => {
            const eventDate = parseDate(getProp(event, 'Data') || getProp(event, 'Date'));
            return eventDate && eventDate >= today;
        });

        // Renderiza apenas os eventos futuros ordenados
        renderEvents(getSortedEvents(futureEvents), grid);
        // Preenche o filtro de gênero com base nos eventos carregados
        populateGenreFilter(allEvents);
        // Se um slug de evento foi passado na URL, tenta abrir o modal correspondente
        if (eventSlugFromUrl) {
            const eventToOpen = allEvents.find(e => createEventSlug(getProp(e, 'Evento') || getProp(e, 'Nome')) === eventSlugFromUrl);
            if (eventToOpen) openModal(eventToOpen);
        }

    } catch (error) {
        console.error("Falha ao carregar ou renderizar os eventos:", error);
        // Verifica se o erro é uma falha de rede (como ERR_NAME_NOT_RESOLVED)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            grid.innerHTML = `<p style="color: #c0392b;"><b>Falha na conexão.</b> Verifique sua internet e tente recarregar a página.</p>`;
        } else {
            // Para outros tipos de erro (ex: CSV malformado)
            grid.innerHTML = `<p style="color: red;">Ocorreu um erro inesperado ao carregar os eventos. Verifique o console para mais detalhes.</p>`;
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

}
/**
 * Analisa uma string de texto CSV em um array de objetos de produto.
 * Esta função é mais robusta e lida com campos entre aspas que podem conter vírgulas.
 * @param {string} text - O conteúdo bruto do arquivo CSV.
 * @returns {Array<Object>} Um array de objetos, onde cada objeto representa um evento.
 */
function parseCSV(text) {
    // Divide as linhas tratando tanto \n (Unix) quanto \r\n (Windows)
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    let headerLine = lines.shift();
    // Remove o caractere BOM (Byte Order Mark) invisível que o Google Sheets pode adicionar.
    if (headerLine.charCodeAt(0) === 0xFEFF) {
        headerLine = headerLine.substring(1);
    }
    // Normaliza os cabeçalhos: remove espaços e aspas no início/fim.
    const headers = headerLine.split(',').map(h => 
        h.trim().replace(/^"|"$/g, '')
    );    
    // Regex aprimorada para evitar loops infinitos em linhas que terminam com vírgula.
    const regex = /("([^"]*(""[^"]*)*)"|([^,]*))(,|$)/g;

    return lines.map(line => {
        if (line.trim() === '') return null; // Pula linhas completamente vazias

        const event = {};
        let headerIndex = 0;
        let match;
        // Redefine o índice da regex para cada nova linha
        regex.lastIndex = 0;

        while (match = regex.exec(line)) {
            if (headerIndex < headers.length) {
                const value = match[2] !== undefined ? match[2].replace(/""/g, '"') : match[4];
                event[headers[headerIndex]] = value.trim();
            }
            headerIndex++;
            if (match[5] === '') break;
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
    const clearDateBtn = document.getElementById('clear-date-btn');
    const clearAllBtn = document.getElementById('clear-all-filters-btn');
    const shareFiltersBtn = document.getElementById('share-filters-btn');
    const searchLoader = document.getElementById('search-loader');
    const grid = document.getElementById('event-grid');

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedDate = dateInput.value;
        const selectedGenre = genreFilter.value;

        // Adiciona/remove a classe 'is-active' para feedback visual
        searchInput.classList.toggle('is-active', !!searchTerm);
        dateInput.classList.toggle('is-active', !!selectedDate);
        genreFilter.classList.toggle('is-active', !!selectedGenre);

        // Mostra/esconde botões de limpar
        clearSearchBtn.hidden = !searchTerm;
        clearDateBtn.hidden = !selectedDate;
        const anyFilterActive = !!searchTerm || !!selectedDate || (!!selectedGenre && selectedGenre !== '');
        clearAllBtn.hidden = !anyFilterActive;
        shareFiltersBtn.hidden = !anyFilterActive;

        // Atualiza a URL com os parâmetros de filtro
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedDate) params.set('date', selectedDate);
        if (selectedGenre) params.set('genre', selectedGenre);

        const queryString = params.toString();
        const newUrl = queryString 
            ? `${window.location.pathname}?${queryString}`
            : window.location.pathname;
        
        // Usa replaceState para não poluir o histórico do navegador a cada tecla
        window.history.replaceState({ path: newUrl }, '', newUrl);

        let filteredEvents = allEvents;

        // 1. Filtra por texto
        if (searchTerm) {
            filteredEvents = filteredEvents.filter(event => {
                const name = (getProp(event, 'Evento') || getProp(event, 'Nome') || '').toLowerCase();
                const location = (getProp(event, 'Local') || '').toLowerCase();
                return name.includes(searchTerm) || location.includes(searchTerm);
            });
        }

        // 2. Filtra por data
        if (selectedDate) {
            // Converte YYYY-MM-DD para DD/MM/YYYY para comparar com o formato da planilha
            const [year, month, day] = selectedDate.split('-');
            const formattedDate = `${day}/${month}/${year}`;
            
            filteredEvents = filteredEvents.filter(event => {
                const eventDate = getProp(event, 'Data') || getProp(event, 'Date');
                return eventDate === formattedDate;
            });
        }

        // 3. Filtra por gênero
        if (selectedGenre) {
            filteredEvents = filteredEvents.filter(event => {
                const eventGenres = (getProp(event, 'Gênero') || '').toLowerCase();
                // Verifica se a string de gêneros do evento inclui o gênero selecionado
                // Isso funciona para "Techno, House" contendo "techno"
                return eventGenres.split(',').map(g => g.trim()).includes(selectedGenre);
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
        applyFilters();
    });

    // Chama applyFilters uma vez na inicialização para definir o estado dos botões com base nos parâmetros da URL
    applyFilters();

    shareFiltersBtn.addEventListener('click', () => {
        // A URL já está correta na barra de endereço
        navigator.clipboard.writeText(window.location.href).then(() => {
            const originalHtml = shareFiltersBtn.innerHTML;
            const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            shareFiltersBtn.innerHTML = `${checkIconSvg} <span>Link Copiado!</span>`;
            shareFiltersBtn.disabled = true;
            
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

    let ticketHtml = '';
    if (isPastEvent) {
        ticketHtml = `<div class="event-card__footer"><span class="event-card__tickets-btn event-card__tickets-btn--free">Evento já realizado</span></div>`;
    } else if (ticketUrl) {
        if (ticketUrl.toLowerCase().trim() === 'gratuito') {
            ticketHtml = `<div class="event-card__footer"><span class="event-card__tickets-btn event-card__tickets-btn--free">Gratuito</span></div>`;
        } else {
            ticketHtml = `<div class="event-card__footer"><a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" class="event-card__tickets-btn" onclick="event.stopPropagation()">Comprar ingresso</a></div>`;
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
            ${instagramUrl ? `<p class="event-card__instagram"><a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${instagramIconSvg} Instagram</a></p>` : ''}
            <p class="event-card__location">${location}</p>
        </div>
        ${ticketHtml}
    `;

    // card.addEventListener('click', () => {
    //     openModal(event);
    // });

    card.addEventListener('click', () => {
        const eventSlug = createEventSlug(name);
        const params = new URLSearchParams(window.location.search);
        params.set('event', eventSlug);
        const newUrl = `${window.location.pathname}?${params.toString()}`;

        // Atualiza a URL sem recarregar a página
        window.history.pushState({ path: newUrl }, '', newUrl);

        openModal(event);
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

    const name = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento sem nome';
    const date = getProp(event, 'Data') || getProp(event, 'Date') || 'Data a confirmar';
    const location = getProp(event, 'Local') || 'Localização não divulgada';
    const attractions = getProp(event, 'Atrações') || 'Não informado';
    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');
    const ticketUrl = getProp(event, 'Ingressos (URL)');
    const instagramUrl = getProp(event, 'Instagram (URL)');

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

    const copyLinkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>`;
    const whatsappIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.357 1.849 6.081l-1.214 4.425 4.56-1.195z"/></svg>`;

    let ticketActionHtml = '';
    if (ticketUrl) {
        if (ticketUrl.toLowerCase().trim() === 'gratuito') {
            ticketActionHtml = `<span class="share-btn tickets-btn tickets-btn--free">Gratuito</span>`;
        } else {
            ticketActionHtml = `<a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" class="share-btn tickets-btn">Comprar ingresso</a>`;
        }
    } else {
        ticketActionHtml = `<span class="share-btn tickets-btn tickets-btn--free">Vendas não divulgadas</span>`;
    }

    modalContent.innerHTML = `
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
        </div>

        <hr class="modal-separator">
        <div class="modal-actions">
            ${ticketActionHtml}
            <button class="share-btn whatsapp-btn">${whatsappIconSvg} Compartilhar no WhatsApp</button>
            <button class="share-btn copy-link-btn">${copyLinkIconSvg} Copiar link</button>
        </div>
    `;

    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden'; // Impede o scroll da página ao fundo

    // Adiciona a funcionalidade de compartilhamento
    const copyLinkBtn = modalContent.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
        // A URL na barra de endereço já contém todos os filtros e o slug do evento.
        const shareUrl = window.location.href;

        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                const originalHtml = copyLinkBtn.innerHTML;
                copyLinkBtn.innerHTML = `${checkIconSvg} Link Copiado!`;
                copyLinkBtn.disabled = true;
                setTimeout(() => {
                    copyLinkBtn.innerHTML = originalHtml;
                    copyLinkBtn.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Falha ao copiar o link: ', err);
            });
        });
    }

    // Adiciona a funcionalidade de compartilhar no WhatsApp
    const whatsappBtn = modalContent.querySelector('.whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            // A URL na barra de endereço já contém todos os filtros e o slug do evento.
            const shareUrl = window.location.href;
            const shareText = `Confira este evento: *${name}* em ${date}! Saiba mais aqui: ${shareUrl}`;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;            
            window.open(whatsappUrl, '_blank');
        });
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
