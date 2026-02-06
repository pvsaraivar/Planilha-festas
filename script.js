// script.js
let eventSlugFromUrl = null; // Armazena o slug do evento da URL para uso posterior

let allEvents = []; // Armazena todos os eventos para filtragem
let favoritedEventSlugs = new Set(); // Armazena os slugs dos eventos favoritados para consulta rápida

document.addEventListener('DOMContentLoaded', () => {
    const sheetId = '1LAfG4Nt2g_P12HMCx-wEmWpXoX3yp1qAKdw89eLbeWU';
    const eventsGid = '0'; // GID da aba "eventos" (geralmente 0 se for a primeira aba criada)
    // A URL agora aponta especificamente para a aba de eventos usando o GID.
    const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${eventsGid}`;
    
    setupThemeToggle();

    // Verifica se estamos na página de detalhes
    const detailContainer = document.getElementById('event-detail-container');
    if (detailContainer) {
        loadEventDetails(googleSheetUrl);
        setupFloatingBackButton();
    } else {
        // Estamos na página inicial (index.html)
        applyFiltersFromURL();
        loadFavorites(); 
        loadAndDisplayEvents(googleSheetUrl);
        setupFilters();
        setupModal();
        setupContactModal();
        setupBackToTopButton();
        setupNavigation(); 
        setupPreCarnavalFeature(); 
        setupSetsFeature(); 
        setupSoundCloudSetsFeature(); 
        setupVideoObserver(); 
        setupVideoRedirects();
        setupSundayVideo();
    }
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
    'fabrika tunnel edition': 'assets/fabrika.jpg',
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
    'mirage djs': 'assets/miragedjs.PNG',
    'boiler fuzz 2': 'assets/boilerfuzz2.PNG',
    'wav sunset': 'assets/wavsunset2.PNG',
    'showcase ignis': 'assets/showcaseignis.PNG',
    'fritaria parquelândia': 'assets/fritariaparq.PNG',
    'ovo frito': 'assets/ovofrito2.PNG',
    'mirage 4 anos': 'assets/mirage4.PNG',
    'festa do fim do mundo': 'assets/discovoador.PNG',
    'deep after':'assets/deepafter.PNG',
    'baile da bateu - pré carnaval': 'assets/bailedabateu2.PNG',
    'plano aberto': 'assets/planoaberto.PNG',
    'hypno': 'assets/hypno.PNG',
    'maré alta': 'assets/marealta2.PNG',
    'mare alta': 'assets/marealta2.PNG',
    'festa lá em cima 4 anos': 'assets/flec4anos.PNG',
    'atrita intima - última do ano': 'assets/atritaintima.PNG',
    'radar ft bateu': 'assets/radarftbateu.PNG',
    'calunia showcase': 'assets/caluniashowcase.PNG',
    'festa portal': 'assets/festaportal.PNG',
    'meu bloco é neon': 'assets/bloconeon1.PNG',
    'verão 2000 - pré carnaval': 'assets/verao2kpre.PNG',
    'pra quem gosta é bom': 'assets/pgb.PNG',
    'bloquinho psy': 'assets/bloquinhopsy.PNG',
    'voyage e luxxxas': 'assets/voyageluxxas.PNG',
    'fuga sessions #6': 'assets/fugasessions6.PNG',
    'kaza convida festa base': 'assets/kazaconvidabase.PNG',
    'papoco batuke kent': 'assets/papoco.mp4',
    'balanço no mormaço': 'assets/balançomormaço.PNG',
    'house music - clube da prancha': 'assets/clubedaprancha1.PNG',
    'longdreams numa tubulosa': 'assets/tubulosalongdreams.mp4',
    'abertura pré carnaval': 'assets/prefortaleza1601.PNG',
    'segundo dia pré carnaval': 'assets/prefortaleza1701.PNG',
    'meu bloco é neon 2': 'assets/bloconeon2.PNG',
    'bloquinho de verão 2': 'assets/bloquinhodeverao2.PNG',
    'segundo dia pré carnaval 2': 'assets/prefortaleza1701.PNG',
    'terceiro dia pré carnaval': 'assets/prefortaleza2401.PNG',
    'carnahard': 'assets/carnahard.mp4',
    'pacific de janeiro': 'assets/pacificdejaneiro.PNG',
    'dabysha': 'assets/dabysha.PNG',
    'longdreams showcase': 'assets/longdreamsshowcase.PNG',
    'loren party - all black': 'assets/lorendayallblack.PNG',
    'plano aberto - germinação': 'assets/planoabertogerminasao.PNG',
    'house music culture 3': 'assets/hmc3.PNG',
    'oscvra - impuria': 'assets/oscvraimpuria.PNG',
    'baile freak 2026': 'assets/blocofreak.mp4',
    'trance on board': 'assets/tranceonboard.PNG',
    'hibrida': 'assets/hibrida.mp4',
    'melange no arrumação': 'assets/melange2.PNG',
    'kaliente': 'assets/kaliente.PNG',
    'kaza sessions - ebony e duquesa': 'assets/kazasessionsnandi.PNG',
    'splash party': 'assets/splashparty.PNG',
    'boate fantasma': 'assets/boatefantasma.PNG',
    'radio nix - ram': 'assets/radionixram.PNG',
    'pre carnaval fortaleza - 30/01 - mercado': 'assets/prefortaleza3001.PNG',
    'pre carnaval fortaleza - 30/01 - praça dos leões': 'assets/prefortaleza30012.PNG',
    'pre carnaval fortaleza - 30/01 - aerolândia': 'assets/prefortaleza30013.PNG',
    'pre carnaval fortaleza - 30/01 - centro cultural belchior': 'assets/prefortaleza30014.PNG',
    'pre carnaval fortaleza - 31/01 - mocinha': 'assets/prefortaleza3101.PNG',
    'pre carnaval fortaleza - 31/01 - mercado': 'assets/prefortaleza31012.PNG',
    'pre carnaval fortaleza - 31/01 - aterro da praia de iracema': 'assets/prefortaleza31013.PNG',
    'pre carnaval fortaleza - 31/01 - aterrinho da praia de iracema': 'assets/prefortaleza31014.PNG',
    'pre carnaval fortaleza - 31/01 - gentilândia': 'assets/prefortaleza31015.PNG',
    'pre carnaval fortaleza - 31/01 - praça rachel de queiroz': 'assets/prefortaleza31016.PNG',
    'pre carnaval fortaleza - 31/01 - praça das flores': 'assets/prefortaleza31017.PNG',
    'pre carnaval fortaleza - 31/01 - bom jardim': 'assets/prefortaleza31018.PNG',
    'pre carnaval fortaleza - 31/01 - henrique jorge': 'assets/prefortaleza31019.PNG',
    'pre carnaval fortaleza - 01/02 - benfica': 'assets/prefortaleza0102.PNG',
    'pre carnaval fortaleza - 01/02 - raimundo dos queijos': 'assets/prefortaleza01022.PNG',
    'calúnia - delírio tropical': 'assets/calunia3.PNG',
    'jackwav bday': 'assets/jackwav.PNG',
    'festa base': 'assets/clubedaprancha2.PNG',
    'bateu long set - lucas bmr': 'assets/longsetbmr.PNG',
    'baile do radar - carlos do complexo': 'assets/baileradarcdc.mp4',
    'bunker 7': 'assets/bunker7.mp4',
    'isaknaja y convidados': 'assets/isaknaja.PNG',
    'bloco é sal': 'assets/blocoesal.PNG',
    'fuzuê bar - 04/02': 'assets/fuzue0402.PNG',
    'budega dos pinhões - 05/02': 'assets/budega0502.PNG',
    'pré delas no clube da prancha': 'assets/clubedaprancha3.PNG'
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

        // Extrai o videoId da embedUrl para usar na thumbnail e no carregamento sob demanda
        // Adiciona uma verificação para garantir que embedUrl não seja nulo
        const videoId = set.embedUrl ? set.embedUrl.split('/').pop() : null;
        if (!videoId) {
            return ''; // Se não houver ID de vídeo, não renderiza o card
        }
        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        // Em vez de um iframe, criamos um container com a thumbnail que, ao ser clicado, carregará o vídeo.
        const playerHtml = `
            <div class="set-player-container" data-video-id="${videoId}" style="background-image: url('${thumbnailUrl}');">
                <button class="set-play-button" aria-label="Play set ${set.setName}"></button>
            </div>
        `;

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
    const navPreCarnavalBtn = document.getElementById('nav-precarnaval-btn');
    const navSetsBtn = document.getElementById('nav-sets-btn');
    const navSoundCloudSetsBtn = document.getElementById('nav-soundcloud-sets-btn'); // Botão SoundCloud
    const eventsContent = document.querySelector('.main-content'); // Container principal dos eventos
    const preCarnavalSection = document.getElementById('precarnaval-section');
    const setsSection = document.getElementById('sets-section');
    const soundCloudSetsSection = document.getElementById('soundcloud-sets-section'); // Seção SoundCloud
    const weeklySection = document.getElementById('weekly-events-section');
    const filtersWrapper = document.querySelector('.filters-wrapper');
    const preCarnavalFiltersWrapper = document.getElementById('precarnaval-filters-wrapper');
    const setsFiltersWrapper = document.getElementById('sets-filters-wrapper');
    const soundCloudSetsFiltersWrapper = document.getElementById('soundcloud-sets-filters-wrapper'); // Filtro SoundCloud

    if (!navEventsBtn || !navSetsBtn || !eventsContent || !setsSection || !weeklySection || !filtersWrapper || !setsFiltersWrapper) {
        console.warn('Elementos de navegação ou filtros não encontrados. A troca de abas não funcionará completamente.');
        return;
    }

    navEventsBtn.addEventListener('click', () => {
        eventsContent.style.display = 'block';
        filtersWrapper.style.display = 'flex'; // Mostra os filtros de eventos
        if (preCarnavalFiltersWrapper) preCarnavalFiltersWrapper.style.display = 'none';
        setsFiltersWrapper.style.display = 'none'; // Esconde os filtros de sets
        if (soundCloudSetsFiltersWrapper) soundCloudSetsFiltersWrapper.style.display = 'none';

        weeklySection.classList.remove('precarnaval-mode');

        // Mostra a seção de eventos da semana apenas se nenhum filtro estiver ativo
        const anyFilterActive = document.getElementById('clear-all-filters-btn').hidden === false;
        if (!anyFilterActive) {
            weeklySection.style.display = 'block';
        }
        renderWeeklyEvents(allEvents); // Restaura os eventos da semana da aba principal
        if (preCarnavalSection) preCarnavalSection.style.display = 'none';
        setsSection.style.display = 'none';
        if (soundCloudSetsSection) soundCloudSetsSection.style.display = 'none';
        
        navEventsBtn.classList.add('is-active');
        if (navPreCarnavalBtn) navPreCarnavalBtn.classList.remove('is-active');
        navSetsBtn.classList.remove('is-active');
        if (navSoundCloudSetsBtn) navSoundCloudSetsBtn.classList.remove('is-active');
    });

    if (navPreCarnavalBtn) {
        navPreCarnavalBtn.addEventListener('click', () => {
            eventsContent.style.display = 'none';
            filtersWrapper.style.display = 'none';
            if (preCarnavalFiltersWrapper) preCarnavalFiltersWrapper.style.display = 'flex';
            setsFiltersWrapper.style.display = 'none';
            if (soundCloudSetsFiltersWrapper) soundCloudSetsFiltersWrapper.style.display = 'none';

            weeklySection.style.display = 'none';
            if (preCarnavalSection) preCarnavalSection.style.display = 'block';
            setsSection.style.display = 'none';
            if (soundCloudSetsSection) soundCloudSetsSection.style.display = 'none';

            navPreCarnavalBtn.classList.add('is-active');
            navEventsBtn.classList.remove('is-active');
            navSetsBtn.classList.remove('is-active');
            if (navSoundCloudSetsBtn) navSoundCloudSetsBtn.classList.remove('is-active');

            if (typeof loadPreCarnavalEvents === 'function' && window.allPreCarnavalEvents.length === 0) {
                loadPreCarnavalEvents();
            }
        });
    }

    navSetsBtn.addEventListener('click', () => {
        eventsContent.style.display = 'none';        
        filtersWrapper.style.display = 'none'; // Esconde os filtros de eventos
        if (preCarnavalFiltersWrapper) preCarnavalFiltersWrapper.style.display = 'none';
        setsFiltersWrapper.style.display = 'flex'; // Mostra os filtros de sets
        if (soundCloudSetsFiltersWrapper) soundCloudSetsFiltersWrapper.style.display = 'none';
        weeklySection.style.display = 'none'; // Oculta os eventos da semana
        if (preCarnavalSection) preCarnavalSection.style.display = 'none';
        setsSection.style.display = 'block';
        if (soundCloudSetsSection) soundCloudSetsSection.style.display = 'none';

        navSetsBtn.classList.add('is-active');
        if (navPreCarnavalBtn) navPreCarnavalBtn.classList.remove('is-active');
        navEventsBtn.classList.remove('is-active');
        if (navSoundCloudSetsBtn) navSoundCloudSetsBtn.classList.remove('is-active');

        // Carrega os sets apenas na primeira vez que a aba é clicada.
        // A verificação `allSets.length === 0` previne recarregamentos desnecessários.
        if (typeof loadSets === 'function' && window.allSets.length === 0) {
            loadSets();
        }
    });

    if (navSoundCloudSetsBtn) {
        navSoundCloudSetsBtn.addEventListener('click', () => {
            eventsContent.style.display = 'none';
            filtersWrapper.style.display = 'none';
            if (preCarnavalFiltersWrapper) preCarnavalFiltersWrapper.style.display = 'none';
            setsFiltersWrapper.style.display = 'none';
            if (soundCloudSetsFiltersWrapper) soundCloudSetsFiltersWrapper.style.display = 'flex';

            weeklySection.style.display = 'none';
            if (preCarnavalSection) preCarnavalSection.style.display = 'none';
            setsSection.style.display = 'none';
            if (soundCloudSetsSection) soundCloudSetsSection.style.display = 'block';

            navSoundCloudSetsBtn.classList.add('is-active');
            if (navPreCarnavalBtn) navPreCarnavalBtn.classList.remove('is-active');
            navEventsBtn.classList.remove('is-active');
            navSetsBtn.classList.remove('is-active');

            // Carrega os sets do SoundCloud apenas na primeira vez
            if (typeof loadSoundCloudSets === 'function' && window.allSoundCloudSets.length === 0) {
                loadSoundCloudSets();
            }
        });
    }
}

/**
 * Verifica se o evento já terminou.
 * @param {Object} event - O objeto do evento.
 * @returns {boolean} True se o evento já passou.
 */
function isEventOver(event) {
    let dateStr = getProp(event, 'Data') || getProp(event, 'Date');
    if (!dateStr) return true;

    // Remove horário se estiver junto da data
    dateStr = dateStr.split(' ')[0].trim();
    const parts = dateStr.split('/');
    if (parts.length !== 3) return true;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return true;

    const eventDate = new Date(year, month, day);
    const now = new Date();

    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');

    if (endTime) {
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const eventEndDate = new Date(eventDate);
        eventEndDate.setHours(endHour, endMinute || 0, 0, 0);

        // Se o fim for menor que o início (virada de noite) ou menor que 12h (heurística), adiciona 1 dia
        if (startTime) {
            const [startHour] = startTime.split(':').map(Number);
            if (endHour < startHour) {
                eventEndDate.setDate(eventEndDate.getDate() + 1);
            }
        } else if (endHour < 12) {
            eventEndDate.setDate(eventEndDate.getDate() + 1);
        }

        return now > eventEndDate;
    }

    // Se não tiver fim, considera o final do dia
    const endOfDay = new Date(eventDate);
    endOfDay.setHours(23, 59, 59, 999);
    return now > endOfDay;
}

/**
 * Configura a aba de "Pré Carnaval".
 */
function setupPreCarnavalFeature() {
    // URL da planilha de Pré Carnaval. 
    // Substitua o GID pelo ID da aba correta na sua planilha.
    const sheetId = '1LAfG4Nt2g_P12HMCx-wEmWpXoX3yp1qAKdw89eLbeWU';
    const preCarnavalGid = '1076861730'; // <-- ALTERE AQUI PARA O GID DA ABA DE PRÉ CARNAVAL
    const preCarnavalSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${preCarnavalGid}`;

    const searchInput = document.getElementById('precarnaval-search-input');
    const clearBtn = document.getElementById('clear-precarnaval-search-btn');
    const grid = document.getElementById('precarnaval-grid');

    let debounceTimer;

    if (!searchInput || !clearBtn || !grid) return;

    window.allPreCarnavalEvents = [];
    window.loadPreCarnavalEvents = async function() {
        // Injeta CSS responsivo para garantir layout correto em mobile (2 colunas) e desktop
        if (!document.getElementById('precarnaval-style')) {
            const style = document.createElement('style');
            style.id = 'precarnaval-style';
            style.textContent = `
                #precarnaval-grid {
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                    width: 100%;
                }
                #precarnaval-grid .event-card__image {
                    min-height: 0;
                }
                @media (max-width: 600px) {
                    #precarnaval-grid {
                        gap: 1rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        grid.innerHTML = '<p class="empty-grid-message">Carregando pré-carnavais...</p>';

        try {
            // Adiciona timestamp para evitar cache e garantir dados frescos
            const response = await fetch(preCarnavalSheetUrl + '&_t=' + Date.now());
            if (!response.ok) throw new Error(`Falha ao carregar a planilha (Status: ${response.status})`);
            
            const csvText = await response.text();
            const events = parseCSV(csvText);

            // Normaliza os dados para garantir que o layout fique igual ao dos eventos principais,
            // mapeando colunas com nomes diferentes para o padrão esperado.
            const normalizedEvents = events.map(event => ({
                ...event,
                'Evento': getProp(event, 'Evento') || getProp(event, 'Nome') || getProp(event, 'Nome do Bloco') || getProp(event, 'Bloco'),
                'Data': getProp(event, 'Data') || getProp(event, 'Date') || getProp(event, 'Dia'),
                'Local': getProp(event, 'Local') || getProp(event, 'Localização') || getProp(event, 'Localizacao'),
                'Imagem (URL)': getProp(event, 'Imagem (URL)') || getProp(event, 'Imagem') || getProp(event, 'Foto') || getProp(event, 'Flyer'),
                'Ingressos (URL)': getProp(event, 'Ingressos (URL)') || getProp(event, 'Ingressos') || getProp(event, 'Link') || getProp(event, 'Valor') || getProp(event, 'Preço') || getProp(event, 'Preco'),
                'Instagram (URL)': getProp(event, 'Instagram (URL)') || getProp(event, 'Instagram'),
                'Atrações': getProp(event, 'Atrações') || getProp(event, 'Lineup') || getProp(event, 'Line-up') || getProp(event, 'Atracoes'),
                'Início': getProp(event, 'Início') || getProp(event, 'Inicio') || getProp(event, 'Horário') || getProp(event, 'Horario') || getProp(event, 'Hora'),
                'Fim': getProp(event, 'Fim') || getProp(event, 'Término') || getProp(event, 'Termino'),
                'Gênero': getProp(event, 'Gênero') || getProp(event, 'Estilo') || getProp(event, 'Gêneros') || getProp(event, 'Genero'),
                'Cupom': getProp(event, 'Cupom') || getProp(event, 'Desconto')
            }));

            // Filtra eventos ocultos e passados
            window.allPreCarnavalEvents = normalizedEvents.filter(event => {
                const oculto = (getProp(event, 'Oculto') || '').toLowerCase();
                if (oculto === 'sim' || oculto === 'true') return false;

                return !isEventOver(event);
            });

            // Ordena por data
            const sortedEvents = getSortedEvents(window.allPreCarnavalEvents);
            
            renderEvents(sortedEvents, grid);

        } catch (error) {
            console.error("Falha ao carregar pré-carnavais:", error);
            grid.innerHTML = `<p class="empty-grid-message" style="color: red;">Ocorreu um erro ao carregar os eventos.</p>`;
        }
    }

    function applyPreCarnavalFilter() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        clearBtn.hidden = !searchTerm;

        const filteredEvents = window.allPreCarnavalEvents.filter(event => {
            const name = (getProp(event, 'Evento') || getProp(event, 'Nome') || '').toLowerCase();
            const location = (getProp(event, 'Local') || '').toLowerCase();
            const attractions = (getProp(event, 'Atrações') || '').toLowerCase();
            return name.includes(searchTerm) || location.includes(searchTerm) || attractions.includes(searchTerm);
        });

        renderEvents(getSortedEvents(filteredEvents), grid);
    }

    // Re-aplica o filtro ao redimensionar a tela para ajustar o número de colunas
    window.addEventListener('resize', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyPreCarnavalFilter, 300);
    });

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyPreCarnavalFilter, 300);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applyPreCarnavalFilter();
        searchInput.focus();
    });
}

/**
 * Configura a aba de "Sets Gravados", incluindo o carregamento dos dados e a funcionalidade de busca.
 */
function setupSetsFeature() {
    // URL da planilha de sets (SetsPublicados)
    const setsSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQSJHdHpGeR9FMMOt1ZwPmxu7bcWZSoxV1igHKduAYtReCgn3VqJeVJwrWkCg9amHWYa3gn1WCGvIup/pub?gid=1162863361&single=true&output=csv';
    // URL da planilha de cache de vídeos (VideoCache)
    const videoCacheSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQSJHdHpGeR9FMMOt1ZwPmxu7bcWZSoxV1igHKduAYtReCgn3VqJeVJwrWkCg9amHWYa3gn1WCGvIup/pub?gid=1607121527&single=true&output=csv';

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
                const publishedDate = getProp(row, 'publisheddate');
                if (setName && publishedDate) {
                    dateMap.set(setName, publishedDate);
                }
            });

            // 3. Processa os dados da planilha principal (SetsPublicados) e adiciona a data do mapa
            window.allSets = setsData.map(row => {
                const setName = getProp(row, 'SetName') || '';
                const videoUrl = getProp(row, 'VideoURL');
                const videoId = getYouTubeID(videoUrl);
                
                return {
                    setName: setName.replace(/#/g, ''),
                    artist: getProp(row, 'Artist') || (setName.split(' - ')[0] || 'Artista Desconhecido').trim(),
                    produtora: getProp(row, 'Produtora'),
                    embedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null,
                    isShort: videoUrl ? videoUrl.includes('/shorts/') : false, // Verifica se é um Short
                    publishedDate: dateMap.get(setName) || null
                };
            }).filter(set => set.embedUrl && !set.isShort); // Garante que apenas sets com vídeo válido e que não sejam Shorts sejam mostrados

            // 4. Embaralha os sets para que não apareçam sempre na mesma ordem.
            // Algoritmo de Fisher-Yates para um embaralhamento eficiente.
            for (let i = window.allSets.length - 1; i > 0; i--) {
                // Escolhe um índice aleatório antes do elemento atual
                const j = Math.floor(Math.random() * (i + 1));
                // Troca o elemento atual com o elemento do índice aleatório
                [window.allSets[i], window.allSets[j]] = [window.allSets[j], window.allSets[i]];
            }
            
            renderSets(window.allSets);

        } catch (error) {
            console.error("Falha ao carregar ou processar os sets:", error);
            let msg = 'Ocorreu um erro ao carregar os sets.';
            if (error.message && error.message.includes('Failed to fetch')) {
                msg = 'Erro de permissão: A planilha não está publicada na web ou o link mudou.';
            }
            grid.innerHTML = `<p class="empty-grid-message" style="color: red;">${msg}</p>`;
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
            const produtora = (set.produtora || '').toLowerCase();
            return setName.includes(searchTerm) || artist.includes(searchTerm) || produtora.includes(searchTerm);
        });

        // A lista principal (window.allSets) já está ordenada.
        // Apenas renderizamos o resultado filtrado.
        renderSets(filteredSets);
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

    // Adiciona um único listener na grade para lidar com o clique em qualquer vídeo (event delegation)
    grid.addEventListener('click', (e) => {
        const playerContainer = e.target.closest('.set-player-container');

        if (playerContainer) {
            const videoId = playerContainer.dataset.videoId;
            if (videoId) {
                // Cria o iframe e o configura para autoplay
                const iframe = document.createElement('iframe');
                iframe.className = 'set-video-iframe'; // Adiciona uma classe para estilização
                iframe.setAttribute('src', `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`);
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                iframe.setAttribute('allowfullscreen', 'true');
                
                // Substitui o container da thumbnail pelo iframe
                playerContainer.parentNode.replaceChild(iframe, playerContainer);
            }
        }
    });
}

/**
 * Configura a aba de "Sets SoundCloud", incluindo o carregamento dos dados e a funcionalidade de busca.
 */
function setupSoundCloudSetsFeature() {
    // URL da planilha de sets do SoundCloud
    // Colunas esperadas na Principal: SetName, SoundCloudURL, Artist, Produtora, ImageURL, PublishedDate
    const soundCloudSetsSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQSJHdHpGeR9FMMOt1ZwPmxu7bcWZSoxV1igHKduAYtReCgn3VqJeVJwrWkCg9amHWYa3gn1WCGvIup/pub?gid=911654646&single=true&output=csv'; // <-- Cole o link novo que você acabou de gerar

    const searchInput = document.getElementById('soundcloud-sets-search-input');
    const clearBtn = document.getElementById('clear-soundcloud-sets-search-btn');
    const grid = document.getElementById('soundcloud-sets-grid');

    let debounceTimer;

    // Se os elementos não existirem (ex: HTML ainda não atualizado), sai silenciosamente ou avisa
    if (!searchInput || !clearBtn || !grid) {
        return;
    }

    window.allSoundCloudSets = [];
    window.loadSoundCloudSets = async function() {
        if (!soundCloudSetsSheetUrl) {
            grid.innerHTML = '<p class="empty-grid-message">A URL da planilha de sets do SoundCloud não foi configurada.</p>';
            return;
        }

        grid.innerHTML = '<p class="empty-grid-message">Carregando sets do SoundCloud...</p>';

        try {
            // Carrega apenas a planilha principal, que agora já contém as imagens
            // Adiciona um timestamp para evitar cache do navegador
            const response = await fetch(soundCloudSetsSheetUrl + '&_t=' + Date.now());
            
            if (!response.ok) throw new Error(`Falha ao carregar sets (Status: ${response.status})`);
            
            const csvText = await response.text();
            
            // Verificação de segurança: se o retorno for HTML (página de login), lança erro
            if (csvText.trim().toLowerCase().startsWith('<!doctype html') || csvText.trim().toLowerCase().startsWith('<html')) {
                throw new Error('A URL da planilha não retornou um CSV válido. Verifique se a planilha está publicada na web.');
            }

            const setsData = parseCSV(csvText);
            
            if (setsData.length === 0) {
                grid.innerHTML = '<p class="empty-grid-message">A planilha foi carregada, mas parece estar vazia ou com formato inválido.</p>';
                return;
            }

            window.allSoundCloudSets = setsData.map(row => {
                let setName = getProp(row, 'SetName') || getProp(row, 'Set Name') || getProp(row, 'Nome') || '';
                let url = getProp(row, 'SoundCloudURL') || getProp(row, 'SoundCloud URL') || getProp(row, 'Link') || getProp(row, 'URL') || getProp(row, 'SoundCloud');
                let artist = getProp(row, 'Artist') || getProp(row, 'Artista');
                let produtora = getProp(row, 'Produtora');

                // Correção para colunas trocadas: Artist com URL e SoundCloudURL com Produtora
                if (artist && (artist.includes('http') || artist.includes('soundcloud.com'))) {
                    const realUrl = artist;
                    const realProdutora = url; // O valor na coluna SoundCloudURL é a produtora
                    
                    url = realUrl;
                    produtora = realProdutora;
                    artist = ''; // Força a extração do artista pelo nome do set
                }

                // Limpeza e validação da URL para evitar erros no player
                if (url) {
                    url = url.trim(); // Remove espaços em branco extras
                    // Adiciona https se estiver faltando (comum em cópias manuais)
                    if (!url.startsWith('http')) {
                        url = `https://${url}`;
                    }
                }
                
                return {
                    setName: setName,
                    artist: artist || (setName.split(' - ')[0] || 'Artista Desconhecido').trim(),
                    produtora: produtora,
                    url: url,
                    // Pega a imagem diretamente da planilha principal
                    imageUrl: getProp(row, 'ImageURL'),
                    publishedDate: getProp(row, 'PublishedDate') ? new Date(getProp(row, 'PublishedDate')) : null
                };
            }).filter(set => set.url && set.url.toLowerCase().includes('soundcloud.com')); // Garante que tem URL válida do SoundCloud

            if (window.allSoundCloudSets.length === 0) {
                const headers = setsData.length > 0 ? Object.keys(setsData[0]).join(', ') : 'Nenhum';
                // Debug: Mostra a primeira linha para entender o que está vindo
                const firstRow = setsData.length > 0 ? JSON.stringify(setsData[0], null, 2) : 'Sem dados';
                
                grid.innerHTML = `<p class="empty-grid-message">Nenhum set válido encontrado.<br><br>
                <strong>Colunas identificadas:</strong> ${headers}<br>
                <strong>Exemplo de dados (1ª linha):</strong> <pre style="text-align: left; background: #222; color: #fff; padding: 10px; border-radius: 5px; overflow: auto; font-size: 12px;">${firstRow}</pre><br>
                Verifique se a coluna <b>SoundCloudURL</b> contém links válidos (ex: https://soundcloud.com/...).</p>`;
                return;
            }

            // Embaralha os sets
            for (let i = window.allSoundCloudSets.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [window.allSoundCloudSets[i], window.allSoundCloudSets[j]] = [window.allSoundCloudSets[j], window.allSoundCloudSets[i]];
            }
            
            renderSoundCloudSets(window.allSoundCloudSets);

        } catch (error) {
            console.error("Falha ao carregar sets do SoundCloud:", error);
            let msg = 'Ocorreu um erro ao carregar os sets.';
            if (error.message && error.message.includes('Failed to fetch')) {
                msg = 'Erro de permissão: A planilha não está publicada na web ou o link mudou.';
            }
            grid.innerHTML = `<p class="empty-grid-message" style="color: red;">${msg}</p>`;
        }
    }

    function renderSoundCloudSets(sets) {
        if (sets.length === 0) {
            grid.innerHTML = '<p class="empty-grid-message">Nenhum set encontrado.</p>';
            return;
        }

        const setsHtml = sets.map(set => {
            let formattedDate = '';
            if (set.publishedDate) {
                formattedDate = set.publishedDate.toLocaleDateString('pt-BR');
            }

            // Renderiza o iframe diretamente para mostrar a pré-visualização do SoundCloud
            const playerHtml = `
                <div class="set-player-container soundcloud-player-container" style="background: none; height: auto; padding-bottom: 0;">
                    <iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay"
                        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(set.url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true">
                    </iframe>
                </div>
            `;

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

    function applySoundCloudSetFilter() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        clearBtn.hidden = !searchTerm;

        const filteredSets = window.allSoundCloudSets.filter(set => {
            const setName = set.setName.toLowerCase();
            const artist = set.artist.toLowerCase();
            const produtora = (set.produtora || '').toLowerCase();
            return setName.includes(searchTerm) || artist.includes(searchTerm) || produtora.includes(searchTerm);
        });

        renderSoundCloudSets(filteredSets);
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applySoundCloudSetFilter, 300);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applySoundCloudSetFilter();
        searchInput.focus();
    });
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

    populateGenreFilter(allEvents);

    // Verifica se há filtros ativos para reaplicá-los após o carregamento
    const searchInput = document.getElementById('search-input');
    const dateInput = document.getElementById('date-filter');
    const genreFilter = document.getElementById('genre-filter');
    const favoritesBtn = document.getElementById('favorites-filter-btn');
    
    const hasActiveFilters = (searchInput && searchInput.value) || (dateInput && dateInput.value) || (genreFilter && genreFilter.value) || (favoritesBtn && favoritesBtn.classList.contains('is-active'));

    if (hasActiveFilters && genreFilter) {
        genreFilter.dispatchEvent(new Event('change'));
    } else {
        const futureEvents = allEvents.filter(event => !isEventOver(event));
        renderEvents(getSortedEvents(futureEvents), grid);
    }

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
    const headerRegex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g;
    const headers = [];
    let match;
    while (match = headerRegex.exec(headerLine)) {
        if (match.index === headerRegex.lastIndex) {
            headerRegex.lastIndex++;
        }
        const header = match[1] ? match[1].replace(/""/g, '"') : match[2];
        headers.push(header ? header.trim() : '');
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
            if (match && match.index === valueRegex.lastIndex) {
                valueRegex.lastIndex++;
            }
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
    
    loadFavorites(); // Garante que os favoritos estejam atualizados.
    gridElement.innerHTML = ''; // Limpa os skeletons ou a mensagem anterior.

    if (events.length === 0) {
        if (selectedDate) {
            gridElement.innerHTML = '<p class="empty-grid-message">Nenhuma festa agendada para esta data.</p>';
        } else {
            gridElement.innerHTML = '<p class="empty-grid-message">Nenhuma festa encontrada com os filtros aplicados.</p>';
        }
        return;
    }

    // Determina o número de colunas com base na largura da tela
    const width = window.innerWidth;
    let numCols = 4;

    if (gridElement.id === 'precarnaval-grid') {
        if (width < 600) numCols = 1;
        else if (width < 900) numCols = 2;
        else numCols = 3;
    } else {
        if (width < 600) numCols = 2;
        else if (width < 900) numCols = 3;
    }

    // Cria as colunas
    const columns = [];
    for (let i = 0; i < numCols; i++) {
        const col = document.createElement('div');
        col.className = 'masonry-column';
        columns.push(col);
        gridElement.appendChild(col);
    }

    // Distribui os cards nas colunas (Round-Robin: 1 na col 1, 2 na col 2, etc.)
    events.forEach((event, index) => {
        const card = createEventCardElement(event);
        columns[index % numCols].appendChild(card);
    });
}

/**
 * Preenche o dropdown de filtro de gênero com base nos gêneros.
 * @param {Array<Object>} events - A lista de eventos.
 */
function populateGenreFilter(events) {
    const genreFilter = document.getElementById('genre-filter');
    if (!genreFilter) return;
    const currentValue = genreFilter.value;

    // Limpa opções anteriores (exceto a primeira)
    while (genreFilter.options.length > 1) {
        genreFilter.remove(1);
    }

    const uniqueGenres = new Set();

    events.forEach(event => {
        const genresString = getProp(event, 'Gênero');
        if (genresString) {
            const genres = genresString.split(',').map(g => g.trim());
            genres.forEach(genre => {
                if (genre) {
                    uniqueGenres.add(genre.toLowerCase());
                }
            });
        }
    });

    const sortedGenres = Array.from(uniqueGenres).sort((a, b) => a.localeCompare(b));

    sortedGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
        genreFilter.appendChild(option);
    });

    if (currentValue) {
        genreFilter.value = currentValue;
    }
}

/**
 * @param {Array<Object>} allEvents - A lista completa de todos os eventos.
 */
function renderWeeklyEvents(allEvents) {
    const weeklySection = document.getElementById('weekly-events-section');
    if (!weeklySection) return;

    // Se estiver no modo domingo, não exibe a seção semanal
    if (document.body.classList.contains('sunday-mode')) return;

    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const cleanDateStr = dateString.split(' ')[0].trim();
        const parts = cleanDateStr.split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return (isNaN(day) || isNaN(month) || isNaN(year)) ? null : new Date(year, month, day);
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
        
        const eventsHtml = upcomingEvents.map((event, index) => {
            const name = getProp(event, 'Evento') || getProp(event, 'Nome') || 'Evento';
            const date = getProp(event, 'Data') || getProp(event, 'Date');
            const location = getProp(event, 'Local') || 'Local a confirmar';
            let imageUrl = getProp(event, 'Imagem (URL)');
            
            const eventNameLower = name.trim().toLowerCase();
            if (eventImageMap[eventNameLower]) {
                imageUrl = eventImageMap[eventNameLower];
            }

            const placeholderSvg = "data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3e%3crect width=%27100%25%27 height=%27100%25%27 fill=%27%23333%27/%3e%3c/svg%3e";

            const isVideo = imageUrl && /\.(mp4|webm|ogg)($|\?)/i.test(imageUrl);
            const mediaHtml = isVideo 
                ? `<video src="${imageUrl}#t=0.1" class="weekly-event-card__image lazy-video" loop muted playsinline webkit-playsinline preload="metadata" onerror='this.outerHTML="<img src=\\"${placeholderSvg}\\" class=\\"weekly-event-card__image\\" loading=\\"lazy\\">"'></video>`
                : `<img src="${imageUrl || placeholderSvg}" alt="${name}" class="weekly-event-card__image" loading="lazy">`;

            return `
                <a href="#" class="weekly-event-card" data-event-slug="${createEventSlug(name)}" style="animation-delay: ${index * 0.1}s">
                    ${mediaHtml}
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

        // Observa os vídeos para tocar apenas quando visíveis
        if (window.videoObserver) {
            weeklySection.querySelectorAll('.lazy-video').forEach(video => window.videoObserver.observe(video));
        }

        // Adiciona listeners para abrir o modal ao clicar nos cards da semana
        weeklySection.querySelectorAll('.weekly-event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // e.preventDefault(); // Removemos o preventDefault para permitir o link normal se fosse um <a>, mas aqui vamos redirecionar via JS
                const slug = card.dataset.eventSlug;
                // Redireciona para a página de detalhes
                window.location.href = `detalhes.html?event=${slug}`;
            });
        });
    } else {
        weeklySection.style.display = 'none'; // Oculta a seção se não houver eventos na semana
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
        const cleanDateStr = dateString.split(' ')[0].trim();
        const parts = cleanDateStr.split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        // Formato: new Date(ano, mês - 1, dia)
        return (isNaN(day) || isNaN(month) || isNaN(year)) ? null : new Date(year, month, day);
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
    const floatingClearBtn = document.getElementById('floating-clear-filters-btn');

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

        // Atualiza a visibilidade do botão flutuante
        if (floatingClearBtn) {
            const isScrolled = window.scrollY > 200;
            if (anyFilterActive && isScrolled) {
                floatingClearBtn.classList.add('visible');
            } else {
                floatingClearBtn.classList.remove('visible');
            }
        }

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
            
            const targetDay = parseInt(day, 10);
            const targetMonth = parseInt(month, 10);
            const targetYear = parseInt(year, 10);
            
            filteredEvents = allEvents.filter(event => {
                const eventDate = getProp(event, 'Data') || getProp(event, 'Date');
                if (!eventDate) return false;
                const parts = eventDate.split('/');
                if (parts.length !== 3) return false;
                
                return parseInt(parts[0], 10) === targetDay && parseInt(parts[1], 10) === targetMonth && parseInt(parts[2], 10) === targetYear;
            });
        } else {

            // Por padrão, mostra apenas eventos futuros.
            filteredEvents = allEvents.filter(event => {
                return !isEventOver(event);
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

    // Re-aplica o filtro ao redimensionar a tela para ajustar o número de colunas
    window.addEventListener('resize', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 300);
    });

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

    // Listeners para o botão flutuante
    if (floatingClearBtn) {
        floatingClearBtn.addEventListener('click', () => {
            clearAllBtn.click(); // Reutiliza a lógica do botão principal
        });

        window.addEventListener('scroll', () => {
            const anyFilterActive = !clearAllBtn.hidden;
            const isScrolled = window.scrollY > 200;
            if (anyFilterActive && isScrolled) {
                floatingClearBtn.classList.add('visible');
            } else {
                floatingClearBtn.classList.remove('visible');
            }
        });
    }

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
 * Configura o vídeo especial de domingo.
 * Verifica se é domingo (dia 0). Se for, mostra o vídeo e configura o redirecionamento.
 */
async function setupSundayVideo() {
    const wrapper = document.getElementById('sunday-video-wrapper');
    const video = document.getElementById('sunday-video');
    
    if (!wrapper || !video) return;

    const today = new Date().getDay();
    
    // 0 representa Domingo no JavaScript
    // Verificação ajustada para teste imediato (true)
    if (true || today === 0 || window.location.search.includes('teste')) {
        document.body.classList.add('sunday-mode');
        wrapper.style.display = 'block';
        
        // Esconde os demais elementos da página para foco total no vídeo
        const elementsToHide = [
            '.site-header',
            '.main-nav', 
            '.filters-wrapper', 
            '#weekly-events-section', 
            '#event-grid',
            '.site-footer',
            '#back-to-top-btn',
            '#floating-clear-filters-btn'
        ];

        elementsToHide.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.setProperty('display', 'none', 'important');
        });

        // Estilização para centralizar o vídeo como uma "Splash Screen"
        wrapper.style.position = 'fixed';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.maxWidth = 'none';
        wrapper.style.padding = '0';
        wrapper.style.margin = '0';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.zIndex = '9999';
        wrapper.style.backgroundColor = '#000';

        // Mensagem de aviso
        const message = document.createElement('div');
        message.className = 'rotate-message';
        // Estado inicial: Carregando
        message.innerHTML = `
            <div class="video-loader"></div>
            <span id="loading-progress-text">Carregando experiência... 0%</span>
        `;
        wrapper.appendChild(message);

        // Ajustes para o vídeo cobrir a tela inteira e remover autoplay
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.maxWidth = 'none';
        video.style.borderRadius = '0';
        video.style.boxShadow = 'none';
        video.style.objectFit = 'contain';
        
        // Lógica de Carregamento do Blob (Cache Local)
        const videoUrl = 'assets/tubulosalongdreams.mp4';
        try {
            let blob = await getBlob(videoUrl);
            if (!blob) {
                // Download com progresso usando XMLHttpRequest para feedback visual
                blob = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', videoUrl, true);
                    xhr.responseType = 'blob';

                    xhr.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percent = Math.floor((event.loaded / event.total) * 100);
                            const progressText = document.getElementById('loading-progress-text');
                            if (progressText) progressText.textContent = `Carregando experiência... ${percent}%`;
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status === 200) resolve(xhr.response);
                        else reject(new Error(`Erro no download: ${xhr.status}`));
                    };

                    xhr.onerror = () => reject(new Error('Erro de rede'));
                    xhr.send();
                });

                // Salva em background para próximos acessos
                saveBlob(videoUrl, blob).catch(console.warn);
            } else {
                const progressText = document.getElementById('loading-progress-text');
                if (progressText) progressText.textContent = `Carregando experiência... 100%`;
            }
            video.src = URL.createObjectURL(blob);
        } catch (e) {
            console.error('Erro ao carregar vídeo via blob, usando fallback:', e);
            video.src = videoUrl;
        }

        // Atualiza para a mensagem de "Vire a tela" após o carregamento
        message.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotate-icon">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <path d="M12 18h.01"></path>
            </svg>
            <span>Vire a tela</span>
        `;

        video.muted = false; 
        video.style.opacity = '0';

        setTimeout(() => {
            message.style.display = 'none';
            video.style.opacity = '1';
            video.play().catch(() => {
                video.muted = true;
                video.play();
            });
        }, 5000);

        video.addEventListener('ended', () => {
            window.location.href = 'https://www.stratussounds.com/';
        });
    }
}

/**
 * Configura o botão para alternar entre tema claro e escuro.
 */
function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (!themeToggleBtn) return;

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

    let couponBadgeHtml = '';
    if (coupon) {
        const tagIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`;
        couponBadgeHtml = `<div class="coupon-badge">${tagIcon} Cupom</div>`;
    }

    // Usando Data URI para o placeholder, garantindo que funcione offline.
    // ... (código do placeholder)
    const placeholderSvg = "data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3e%3crect width=%27100%25%27 height=%27100%25%27 fill=%27%23e9ecef%27/%3e%3ctext x=%2750%25%27 y=%2750%25%27 fill=%27%236c757d%27 font-size=%2720%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3eEvento%3c/text%3e%3c/svg%3e";
    const errorSvg = "data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3e%3crect width=%27100%25%27 height=%27100%25%27 fill=%27%23e9ecef%27/%3e%3ctext x=%2750%25%27 y=%2750%25%27 fill=%27%23dc3545%27 font-size=%2720%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3eImagem Inválida%3c/text%3e%3c/svg%3e";

    // Verifica se há uma imagem local específica para este evento no mapa.
    const eventNameLower = name.trim().toLowerCase();
    if (eventImageMap[eventNameLower]) {
        imageUrl = eventImageMap[eventNameLower];
    }
    
    const isVideo = imageUrl && /\.(mp4|webm|ogg)($|\?)/i.test(imageUrl);

    // Formata a string de horário
    const timeString = formatTimeString(startTime, endTime);
    
    const dateTimeString = timeString ? `${date} - ${timeString}` : date;

    const instagramIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;

    // Lógica para o Badge de Data
    let dateBadgeHtml = '';
    if (date && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
            const day = parts[0];
            const monthIndex = parseInt(parts[1], 10) - 1;
            const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
            const monthName = months[monthIndex] || '';
            
            dateBadgeHtml = `
                <div class="event-card__date-badge">
                    <span class="event-card__date-day">${day}</span>
                    <span class="event-card__date-month">${monthName}</span>
                </div>
            `;
        }
    }

    let genreTagsHtml = '';
    if (genres) {
        const genreList = genres.split(',').map(g => g.trim());
        // Cria chips para cada gênero
        const genreChips = genreList.map(g => `<span class="genre-chip">${g}</span>`).join('');
        genreTagsHtml = `<div class="event-card__genres">${genreChips}</div>`;
    }

    // Helper para converter "DD/MM/YYYY" para um objeto Date
    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const cleanDateStr = dateString.split(' ')[0].trim();
        const parts = cleanDateStr.split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return (isNaN(day) || isNaN(month) || isNaN(year)) ? null : new Date(year, month, day);
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

    let mediaHtml;
    let playButtonHtml = '';

    if (isVideo) {
        mediaHtml = `<video src="${imageUrl}#t=0.1" class="event-card__image" loop muted playsinline webkit-playsinline preload="metadata" oncontextmenu="return false;" onerror='this.outerHTML="<img src=\\"${errorSvg}\\" class=\\"event-card__image\\" loading=\\"lazy\\">"'></video>`;
        const playIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        playButtonHtml = `<div class="video-play-button">${playIconSvg}</div>`;
    } else {
        mediaHtml = `<img src="${imageUrl || placeholderSvg}" alt="${name}" class="event-card__image" loading="lazy" onerror="this.onerror=null;this.src='${errorSvg}';">`;
    }

    card.innerHTML = `
        <div class="event-card__image-wrapper">
            ${mediaHtml}
            ${playButtonHtml}
            ${favoriteButtonHtml}
            ${couponBadgeHtml}
        </div>
        <div class="event-card__info">
            <div class="event-card__header">
                ${dateBadgeHtml}
                <h2 class="event-card__name">${name}</h2>
            </div>
            ${genreTagsHtml}
            <p class="event-card__details">${dateTimeString}</p>
            ${attractions ? `<p class="event-card__attractions">${attractions}</p>` : ''}
            ${instagramUrl ? `<p class="event-card__instagram"><a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" onclick="trackGAEvent('click_instagram', { event_name: '${name.replace(/'/g, "\\'")}', source: 'card' }); event.stopPropagation();">${instagramIconSvg} Instagram</a></p>` : ''}
            <p class="event-card__location">${location}</p>
        </div>
        ${ticketHtml}
    `;

    card.addEventListener('click', () => {
        const eventSlug = createEventSlug(name);
        // Redireciona para a página de detalhes
        window.location.href = `detalhes.html?event=${eventSlug}`;
    });

    // Lógica para tocar o vídeo ao clicar na imagem/botão (sem abrir o modal)
    if (isVideo) {
        const videoEl = card.querySelector('video');
        const playBtn = card.querySelector('.video-play-button');

        const togglePlay = (e) => {
            e.preventDefault();
            e.stopPropagation(); // Impede abrir o modal
            
            if (videoEl.paused) {
                videoEl.play().then(() => {
                    if (playBtn) {
                        playBtn.style.opacity = '0';
                        playBtn.style.pointerEvents = 'none';
                    }
                }).catch(err => console.error("Erro ao reproduzir vídeo:", err));
            } else {
                videoEl.pause();
                if (playBtn) {
                    playBtn.style.opacity = '1';
                    playBtn.style.pointerEvents = 'auto';
                }
            }
        };

        if (videoEl) videoEl.addEventListener('click', togglePlay);
        if (playBtn) playBtn.addEventListener('click', togglePlay);
    }

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
        .replace(/[^\w\s-]/g, '') // Remove todos os caracteres não alfanuméricos, exceto espaços e hífens
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
        document.title = 'Logística Clubber';
    };

    // SEO Dinâmico: Restaura o título original da página ao fechar o modal
    document.title = 'Logística Clubber';

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
    // SEO Dinâmico: Atualiza o título da página com o nome do evento
    document.title = `${getProp(event, 'Evento') || getProp(event, 'Nome')} | Logística Clubber`;

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

    // Lógica da imagem (copiada de createEventCardElement)
    let imageUrl = getProp(event, 'Imagem (URL)');
    const eventNameLower = name.trim().toLowerCase();
    if (eventImageMap[eventNameLower]) {
        imageUrl = eventImageMap[eventNameLower];
    }
    const isVideo = imageUrl && /\.(mp4|webm|ogg)($|\?)/i.test(imageUrl);
    const placeholderSvg = "data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3e%3crect width=%27100%25%27 height=%27100%25%27 fill=%27%231a1a1a%27/%3e%3ctext x=%2750%25%27 y=%2750%25%27 fill=%27%23333%27 font-size=%2720%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3eSem Imagem%3c/text%3e%3c/svg%3e";

    const mediaHtml = isVideo ? `<video src="${imageUrl}" class="modal-image" controls autoplay loop muted playsinline></video>` : `<img src="${imageUrl || placeholderSvg}" alt="${name}" class="modal-image" onerror="this.src='${placeholderSvg}'">`;

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
        <div class="modal-image-wrapper">
            ${mediaHtml}
            <button class="favorite-btn modal-favorite-btn ${isEventFavorited ? 'favorited' : ''}" data-event-slug="${eventSlug}" title="${isEventFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                ${getHeartIcon(isEventFavorited)}
            </button>
        </div>

        <div class="modal-body">
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
                <button class="share-btn copy-link-btn">${copyLinkIconSvg} Copiar link</button>
            </div>
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

// --- Funções Auxiliares para IndexedDB (Cache de Vídeo) ---
const DB_NAME = 'LogisticaClubberDB';
const STORE_NAME = 'assets';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function getBlob(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveBlob(key, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(blob, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Configura o botão flutuante de voltar na página de detalhes.
 */
function setupFloatingBackButton() {
    const backBtn = document.getElementById('floating-back-btn');
    if (!backBtn) return;

    // Mostra o botão apenas quando rolar a página, pois o header já tem um botão de voltar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 150) {
            backBtn.classList.add('visible');
        } else {
            backBtn.classList.remove('visible');
        }
    });
}

/**
 * Configura o IntersectionObserver para vídeos.
 * Isso garante que os vídeos só toquem quando estiverem visíveis na tela,
 * economizando MUITA performance e dados.
 */
function setupVideoObserver() {
    if ('IntersectionObserver' in window) {
        window.videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(() => {}); // Ignora erros de interrupção
                    }
                } else {
                    if (!video.paused) {
                        video.pause();
                    }
                }
            });
        }, { threshold: 0.5 }); // Requer 50% de visibilidade para evitar bugs ao rolar
    }
}

/**
 * Carrega e exibe os detalhes do evento na página detalhes.html
 */
async function loadEventDetails(csvPath) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('event');
    const container = document.getElementById('event-detail-container');

    if (!slug) {
        container.innerHTML = '<p class="empty-grid-message">Evento não especificado.</p>';
        return;
    }

    try {
        // Tenta usar cache se disponível (mesma lógica da home)
        const cacheKey = 'events_cache';
        let csvText = sessionStorage.getItem(cacheKey);

        if (!csvText) {
            const response = await fetch(csvPath);
            if (!response.ok) throw new Error('Falha ao carregar dados');
            csvText = await response.text();
            sessionStorage.setItem(cacheKey, csvText);
        }

        const events = parseCSV(csvText);
        const event = events.find(e => createEventSlug(getProp(e, 'Evento') || getProp(e, 'Nome')) === slug);

        if (!event) {
            container.innerHTML = '<p class="empty-grid-message">Evento não encontrado.</p>';
            return;
        }

        // Renderiza o conteúdo (reutilizando lógica visual do modal, mas adaptada para página)
        renderEventDetailPage(event, container, events);
        
        // Atualiza título da página
        document.title = `${getProp(event, 'Evento') || getProp(event, 'Nome')} | Logística Clubber`;

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="empty-grid-message">Erro ao carregar evento.</p>';
    }
}

function renderEventDetailPage(event, container, allEvents = []) {
    const name = getProp(event, 'Evento') || getProp(event, 'Nome');
    const date = getProp(event, 'Data') || getProp(event, 'Date');
    const location = getProp(event, 'Local');
    const address = getProp(event, 'Endereço') || getProp(event, 'Endereco') || getProp(event, 'Address');
    const attractions = getProp(event, 'Atrações') || 'Não informado';
    const startTime = getProp(event, 'Início');
    const endTime = getProp(event, 'Fim');
    const ticketUrl = getProp(event, 'Ingressos (URL)');
    const instagramUrl = getProp(event, 'Instagram (URL)');
    const coupon = getProp(event, 'Cupom');
    const producer = getProp(event, 'Produtora');
    
    let imageUrl = getProp(event, 'Imagem (URL)');
    const eventNameLower = name.trim().toLowerCase();
    if (eventImageMap[eventNameLower]) imageUrl = eventImageMap[eventNameLower];
    
    const isVideo = imageUrl && /\.(mp4|webm|ogg)($|\?)/i.test(imageUrl);
    const placeholderSvg = "data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3e%3crect width=%27100%25%27 height=%27100%25%27 fill=%27%231a1a1a%27/%3e%3ctext x=%2750%25%27 y=%2750%25%27 fill=%27%23333%27 font-size=%2720%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3eSem Imagem%3c/text%3e%3c/svg%3e";

    const mediaHtml = isVideo 
        ? `<video src="${imageUrl}" class="detail-page-image" controls autoplay loop muted playsinline></video>` 
        : `<img src="${imageUrl || placeholderSvg}" alt="${name}" class="detail-page-image" onerror="this.src='${placeholderSvg}'">`;

    const timeString = formatTimeString(startTime, endTime);
    
    // Reutilizando lógica de botões e links
    let ticketActionHtml = '';
    if (ticketUrl) {
        const ticketInfo = ticketUrl.toLowerCase().trim();
        if (ticketInfo === 'gratuito' || ticketInfo === 'couvert') {
            ticketActionHtml = `<span class="share-btn tickets-btn tickets-btn--free">${ticketInfo === 'gratuito' ? 'Gratuito' : 'Couvert no local'}</span>`;
        } else {
            ticketActionHtml = `<a href="${ticketUrl}" target="_blank" class="share-btn tickets-btn">Comprar Ingresso</a>`;
        }
    }

    let instagramHtml = '';
    if (instagramUrl) {
        instagramHtml = `<a href="${instagramUrl}" target="_blank" class="share-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> Instagram</a>`;
    }

    let producerHtml = '';
    if (producer) {
        producerHtml = `
            <div class="detail-section producer-section">
                <h3>Organizado por</h3>
                <div class="producer-info">
                    <span class="producer-name">${producer}</span>
                    <a href="index.html?search=${encodeURIComponent(producer)}" class="producer-link">
                        Ver mais eventos
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </a>
                </div>
            </div>
        `;
    }

    let mapHtml = '';
    const mapQuery = address ? `${location}, ${address}` : location;

    let directionsHtml = '';
    if (location && location !== 'Localização não divulgada') {
        const encodedQuery = encodeURIComponent(mapQuery);
        directionsHtml = `
            <div class="directions-buttons">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodedQuery}" target="_blank" class="direction-btn google-maps-btn" title="Abrir no Google Maps">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                    Maps
                </a>
                <a href="https://waze.com/ul?q=${encodedQuery}&navigate=yes" target="_blank" class="direction-btn waze-btn" title="Abrir no Waze">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-2.7 8.5c-.2.7.3 1.4 1 1.4H2c.6 0 1-.4 1-1v-1c0-.9.7-1.7 1.5-1.9.1-.2.3-.4.5-.6V16c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-1h6v1c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-1h1v1c0 .6.4 1 1 1z"></path></svg>
                    Waze
                </a>
                <a href="https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedQuery}" target="_blank" class="direction-btn uber-btn" title="Solicitar Uber">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>
                    Uber
                </a>
            </div>
        `;
    }

    if (location && location !== 'Localização não divulgada') {
        mapHtml = `
            <div class="detail-map">
                <h3>Localização</h3>
                <iframe class="map-iframe" src="https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="detail-content-wrapper">
            <div class="detail-media-column">
                ${mediaHtml}
            </div>
            <div class="detail-info-column">
                <h1 class="detail-title">${name}</h1>
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <span class="detail-label">Data e Hora</span>
                        <span class="detail-value">${date} ${timeString ? `• ${timeString}` : ''}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-label">Local</span>
                        <span class="detail-value">${location}</span>
                        ${address ? `<span class="detail-address">${address}</span>` : ''}
                        ${directionsHtml}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Atrações</h3>
                    <p>${attractions}</p>
                </div>

                ${producerHtml}

                ${coupon ? `<div class="detail-coupon-box"><strong>Cupom:</strong> <span>${coupon}</span></div>` : ''}

                <div class="detail-actions">
                    ${ticketActionHtml}
                    ${instagramHtml}
                </div>
                ${mapHtml}
            </div>
        </div>
        <div id="related-events-section" class="related-events-section">
            <h2>Eventos Relacionados</h2>
            <div class="related-events-grid" id="related-events-grid"></div>
        </div>
    `;

    // Lógica para Eventos Relacionados
    if (allEvents && allEvents.length > 0) {
        const currentGenres = (getProp(event, 'Gênero') || '').toLowerCase().split(',').map(g => g.trim()).filter(g => g);
        const currentSlug = createEventSlug(name);

        // Filtra eventos: não ocultos, futuros, não é o atual, e tem gênero em comum
        let related = allEvents.filter(e => {
            const oculto = (getProp(e, 'Oculto') || '').toLowerCase();
            if (oculto === 'sim' || oculto === 'true') return false;
            
            if (isEventOver(e)) return false;

            const eSlug = createEventSlug(getProp(e, 'Evento') || getProp(e, 'Nome'));
            if (eSlug === currentSlug) return false;

            const eGenres = (getProp(e, 'Gênero') || '').toLowerCase().split(',').map(g => g.trim());
            return currentGenres.some(g => eGenres.includes(g));
        });

        if (related.length > 0) {
            // Ordena por data e pega os 3 primeiros
            related = getSortedEvents(related).slice(0, 3);
            
            const relatedGrid = document.getElementById('related-events-grid');
            related.forEach(e => {
                const card = createEventCardElement(e);
                relatedGrid.appendChild(card);
            });
        } else {
            document.getElementById('related-events-section').style.display = 'none';
        }
    } else {
        document.getElementById('related-events-section').style.display = 'none';
    }
}

/**
 * Configura redirecionamento automático ao fim de vídeos específicos.
 * Procura por vídeos com o atributo 'data-redirect-url'.
 */
function setupVideoRedirects() {
    const videos = document.querySelectorAll('video[data-redirect-url]');
    
    videos.forEach(video => {
        video.addEventListener('ended', () => {
            const url = video.getAttribute('data-redirect-url');
            if (url) {
                window.location.href = url;
            }
        });
    });
}
