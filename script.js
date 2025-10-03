// script.js

let allEvents = []; // Armazena todos os eventos para filtragem

/**
 * Ponto de entrada principal. Aguarda o DOM carregar antes de executar.
 */
document.addEventListener('DOMContentLoaded', () => {
    // URL da sua planilha do Google publicada como CSV.
    // Qualquer alteração na planilha será refletida aqui automaticamente.
    const sheetId = '1LAfG4Nt2g_P12HMCx-wEmWpXoX3yp1qAKdw89eLbeWU';
    const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    loadAndDisplayEvents(googleSheetUrl);
    setupSearchFilter();
    setupModal();
});

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
        
        // Renderiza os eventos ordenados
        renderEvents(getSortedEvents(allEvents), grid);

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
    gridElement.innerHTML = ''; // Limpa os skeletons ou a mensagem "Carregando..."
    if (events.length === 0) {
        gridElement.innerHTML = '<p>Nenhum evento encontrado.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    events.forEach(event => {
        const card = createEventCardElement(event);
        fragment.appendChild(card);
    });
    gridElement.appendChild(fragment);
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
 * Configura o filtro de busca.
 */
function setupSearchFilter() {
    const searchInput = document.getElementById('search-input');
    const dateInput = document.getElementById('date-filter');
    const clearBtn = document.getElementById('clear-search-btn');
    const clearDateBtn = document.getElementById('clear-date-btn');
    const loader = document.getElementById('search-loader');
    const grid = document.getElementById('event-grid');

    let searchTimeout;

    const applyFilters = () => {
        clearTimeout(searchTimeout);
        grid.classList.add('event-grid--filtering');
        loader.hidden = false;
        clearBtn.hidden = true;

        searchTimeout = setTimeout(() => {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedDate = dateInput.value; // Formato YYYY-MM-DD

            // Mostra ou esconde o botão de limpar
            clearBtn.hidden = !searchTerm;
            clearDateBtn.hidden = !selectedDate;
            loader.hidden = true;

            let filteredEvents = allEvents.filter(event => {
                // Filtro de texto
                const name = (getProp(event, 'Evento') || getProp(event, 'Nome') || '').toLowerCase();
                const location = (getProp(event, 'Local') || '').toLowerCase();
                const textMatch = name.includes(searchTerm) || location.includes(searchTerm);

                // Filtro de data
                if (selectedDate) {
                    const eventDateStr = getProp(event, 'Data') || getProp(event, 'Date');
                    if (!eventDateStr) return false;

                    // Converte DD/MM/YYYY para YYYY-MM-DD para comparação
                    const [day, month, year] = eventDateStr.split('/');
                    const formattedEventDate = `${year}-${month}-${day}`;
                    
                    return textMatch && formattedEventDate === selectedDate;
                }

                return textMatch;
            });

            // Renderiza os eventos filtrados e ordenados
            renderEvents(getSortedEvents(filteredEvents), grid);
            
            grid.classList.remove('event-grid--filtering');
        }, 300); // Aguarda 300ms para a animação de fade-out
    };

    searchInput.addEventListener('input', applyFilters);
    dateInput.addEventListener('change', applyFilters);

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.hidden = true;
        applyFilters(); // Re-aplica filtros (agora sem o texto)
        searchInput.focus(); // Devolve o foco para a barra de busca
    });

    clearDateBtn.addEventListener('click', () => {
        dateInput.value = '';
        clearDateBtn.hidden = true;
        applyFilters(); // Re-aplica filtros (agora sem a data)
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
    const location = getProp(event, 'Local') || 'Local a confirmar';
    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');
    const attractions = getProp(event, 'Atrações') || '';
    let imageUrl = getProp(event, 'Imagem (URL)');
    const ticketUrl = getProp(event, 'Ingressos (URL)');
    const instagramUrl = getProp(event, 'Instagram (URL)');

    // Usando Data URI para o placeholder, garantindo que funcione offline.
    // ... (código do placeholder)
    const placeholderSvg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3e%3crect width='100%25' height='100%25' fill='%23e9ecef'/%3e%3ctext x='50%25' y='50%25' fill='%236c757d' font-size='20' text-anchor='middle' dominant-baseline='middle'%3eEvento%3c/text%3e%3c/svg%3e";
    const errorSvg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3e%3crect width='100%25' height='100%25' fill='%23e9ecef'/%3e%3ctext x='50%25' y='50%25' fill='%23dc3545' font-size='20' text-anchor='middle' dominant-baseline='middle'%3eImagem Inválida%3c/text%3e%3c/svg%3e";

    // Sobrescreve a imagem para eventos específicos
    const eventNameLower = name.trim().toLowerCase();
    if (eventNameLower === 'na pista') {
        imageUrl = './assets/napista.PNG'; // Exemplo: alterado para .png. Ajuste para a extensão correta do seu arquivo.
    } else if (eventNameLower === 'beije') {
        imageUrl = './assets/beije.PNG'; // Ajuste a extensão (.jpg, .png, etc.) para corresponder ao seu arquivo.
    }

    // Formata a string de horário
    const timeString = formatTimeString(startTime, endTime);
    
    const dateTimeString = timeString ? `${date} - ${timeString}` : date;

    const instagramIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;

    let ticketHtml = '';
    if (ticketUrl) {
        if (ticketUrl.toLowerCase().trim() === 'gratuito') {
            ticketHtml = `<div class="event-card__footer"><span class="event-card__tickets-btn event-card__tickets-btn--free">Gratuito</span></div>`;
        } else {
            ticketHtml = `<div class="event-card__footer"><a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" class="event-card__tickets-btn" onclick="event.stopPropagation()">Ver Ingressos</a></div>`;
        }
    }

    card.innerHTML = `
        <img src="${imageUrl || placeholderSvg}" alt="${name}" class="event-card__image" loading="lazy" onerror="this.onerror=null;this.src='${errorSvg}';">
        <div class="event-card__info">
            <p class="event-card__details">${dateTimeString}</p>
            <h2 class="event-card__name">${name}</h2>
            ${attractions ? `<p class="event-card__attractions">${attractions}</p>` : ''}
            ${instagramUrl ? `<p class="event-card__instagram"><a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${instagramIconSvg} Instagram</a></p>` : ''}
            <p class="event-card__location">${location}</p>
        </div>
        ${ticketHtml}
    `;

    card.addEventListener('click', () => {
        openModal(event);
    });

    return card;
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
 * Abre o modal e o preenche com os detalhes do evento.
 * @param {Object} event - O objeto do evento a ser exibido.
 */
function openModal(event) {
    const overlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    const name = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento sem nome';
    const date = getProp(event, 'Data') || getProp(event, 'Date') || 'Data a confirmar';
    const location = getProp(event, 'Local') || 'Local a confirmar';
    const attractions = getProp(event, 'Atrações') || 'Não informado';
    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');
    const imageUrl = getProp(event, 'Imagem (URL)');
    const ticketUrl = getProp(event, 'Ingressos (URL)');
    const instagramUrl = getProp(event, 'Instagram (URL)');

    let locationHtml = `<span>${location}</span>`;

    // Se houver um local válido, cria um link para o Google Maps
    if (location && location !== 'Local a confirmar') {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        locationHtml = `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${location}</a>`;
    }

    const timeString = formatTimeString(startTime, endTime);
    const dateTimeString = timeString ? `${date}, ${timeString}` : date;

    let ticketHtml = '';
    if (ticketUrl) {
        if (ticketUrl.toLowerCase().trim() === 'gratuito') {
            ticketHtml = `<p><strong>Ingressos:</strong> <span class="free-entry">Gratuito</span></p>`;
        } else {
            ticketHtml = `<p><a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" class="tickets-link"><strong>Comprar Ingressos &rarr;</strong></a></p>`;
        }
    }
    
    const instagramIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
    const instagramHtml = instagramUrl
        ? `<p><strong>Instagram:</strong> <a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" class="event-card__instagram a">${instagramIconSvg} Perfil do Evento</a></p>`
        : '';

    const shareIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`;

    modalContent.innerHTML = `
        <h2>${name}</h2>
        <p><strong>Data:</strong> ${dateTimeString}</p>
        <p><strong>Atrações:</strong> ${attractions}</p>
        <p><strong>Local:</strong> <span class="location-container">${locationHtml}</span></p>
        ${instagramHtml}
        ${ticketHtml}
        <button class="share-btn">${shareIconSvg} Compartilhar Evento</button>
    `;

    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden'; // Impede o scroll da página ao fundo

    // Adiciona a funcionalidade de compartilhamento
    const shareBtn = modalContent.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                const originalHtml = shareBtn.innerHTML;
                shareBtn.innerHTML = `${checkIconSvg} Link Copiado!`;
                shareBtn.disabled = true;
                setTimeout(() => {
                    shareBtn.innerHTML = originalHtml;
                    shareBtn.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Falha ao copiar o link: ', err);
            });
        });
    }
}
