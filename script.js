// Configurações e estado da aplicação
const AppState = {
    currentTheme: 'cyberpunk',
    visitedSections: new Set(),
    commandsCopied: 0,
    sessionStart: new Date(),
    searchTerm: '',
    demoStep: 0,
    demoCommands: [
        "git init",
        "git add .",
        "git commit -m \"Initial commit\"",
        "git branch feature/new-feature",
        "git push origin main"
    ]
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializeMenu();
    initializeSearch();
    initializeCopyButtons();
    initializeDemo();
    initializeTheme();
    initializeProgress();
    initializeStats();
    initializeModals();
    initializeScrollEvents();
    
    // Iniciar temporizador da sessão
    startSessionTimer();
    
    // Mostrar toast de boas-vindas
    setTimeout(() => {
        showToast('Bem-vindo ao Guia Cyberpunk GitHub!', 'success');
    }, 1000);
}

// Menu e Navegação
function initializeMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const menuItems = document.querySelectorAll('.menu-item');
    const scrollTopBtn = document.getElementById('scrollTop');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Fechar menu ao clicar em um link (mobile)
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Botão scroll to top
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Fechar menu ao clicar fora (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Sistema de Pesquisa
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    searchInput.addEventListener('input', function() {
        AppState.searchTerm = this.value.toLowerCase();
        filterSections(AppState.searchTerm);
        updateSearchClear();
    });

    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        AppState.searchTerm = '';
        filterSections('');
        searchInput.focus();
        updateSearchClear();
    });

    function updateSearchClear() {
        searchClear.style.display = AppState.searchTerm ? 'block' : 'none';
    }
}

function filterSections(searchTerm) {
    const sections = document.querySelectorAll('.section');
    let foundAny = false;

    sections.forEach(section => {
        const content = section.textContent.toLowerCase();
        const sectionId = section.id;
        
        if (searchTerm === '' || content.includes(searchTerm)) {
            section.style.display = 'block';
            foundAny = true;
            
            if (searchTerm !== '') {
                highlightText(section, searchTerm);
            } else {
                removeHighlights(section);
            }
        } else {
            section.style.display = 'none';
            removeHighlights(section);
        }
    });

    // Atualizar menu ativo baseado na primeira seção visível
    updateActiveMenu();
    
    // Mostrar mensagem se nenhum resultado for encontrado
    showNoResultsMessage(!foundAny && searchTerm !== '');
}

function highlightText(element, searchTerm) {
    removeHighlights(element);
    
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    const nodes = [];
    
    while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(searchTerm)) {
            nodes.push(node);
        }
    }
    
    nodes.forEach(node => {
        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
        const newText = node.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
        const temp = document.createElement('div');
        temp.innerHTML = newText;
        
        // Substituir o nó de texto pelos spans
        const parent = node.parentNode;
        while (temp.firstChild) {
            parent.insertBefore(temp.firstChild, node);
        }
        parent.removeChild(node);
    });
}

function removeHighlights(element) {
    const highlights = element.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showNoResultsMessage(show) {
    let message = document.getElementById('noResultsMessage');
    
    if (show && !message) {
        message = document.createElement('div');
        message.id = 'noResultsMessage';
        message.className = 'no-results';
        message.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>Nenhum resultado encontrado</h3>
            <p>Tente usar termos diferentes ou verifique a ortografia.</p>
        `;
        message.style.textAlign = 'center';
        message.style.padding = '3rem';
        message.style.color = 'var(--text-muted)';
        
        const mainContent = document.querySelector('.main-content');
        const firstSection = mainContent.querySelector('.section');
        mainContent.insertBefore(message, firstSection);
    } else if (!show && message) {
        message.remove();
    }
}

// Botões de Copiar
function initializeCopyButtons() {
    // Botões de copiar comandos individuais
    document.querySelectorAll('.btn-copy').forEach(button => {
        button.addEventListener('click', function() {
            const command = this.getAttribute('data-copy');
            copyToClipboard(command);
            AppState.commandsCopied++;
            updateStats();
            showToast('Comando copiado para a área de transferência!', 'success');
        });
    });

    // Botões de copiar seções inteiras
    document.querySelectorAll('.btn-section-copy').forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            const sectionText = extractSectionText(section);
            copyToClipboard(sectionText);
            showToast('Seção copiada para a área de transferência!', 'success');
        });
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Erro ao copiar texto: ', err);
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

function extractSectionText(section) {
    const title = section.querySelector('h2').textContent;
    const paragraphs = Array.from(section.querySelectorAll('p'))
        .map(p => p.textContent)
        .join('\n\n');
    const commands = Array.from(section.querySelectorAll('.command'))
        .map(cmd => cmd.textContent.trim())
        .join('\n');
    
    return `${title}\n\n${paragraphs}\n\nComandos:\n${commands}`;
}

// Demonstração Interativa
function initializeDemo() {
    const demoPrev = document.getElementById('demoPrev');
    const demoNext = document.getElementById('demoNext');
    const demoRestart = document.getElementById('demoRestart');
    const typingText = document.getElementById('typingText');

    demoPrev.addEventListener('click', () => {
        if (AppState.demoStep > 0) {
            AppState.demoStep--;
            updateDemo();
        }
    });

    demoNext.addEventListener('click', () => {
        if (AppState.demoStep < AppState.demoCommands.length - 1) {
            AppState.demoStep++;
            updateDemo();
        }
    });

    demoRestart.addEventListener('click', () => {
        AppState.demoStep = 0;
        updateDemo();
    });

    function updateDemo() {
        const currentCommand = AppState.demoCommands[AppState.demoStep];
        const demoStep = document.querySelector('.demo-step');
        
        // Atualizar contador
        demoStep.textContent = `${AppState.demoStep + 1}/${AppState.demoCommands.length}`;
        
        // Efeito de digitação
        typeText(typingText, currentCommand);
        
        // Atualizar estado dos botões
        demoPrev.disabled = AppState.demoStep === 0;
        demoNext.disabled = AppState.demoStep === AppState.demoCommands.length - 1;
    }

    // Iniciar demonstração
    updateDemo();
}

function typeText(element, text) {
    element.textContent = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, 50);
        }
    }
    
    type();
}

// Sistema de Temas
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const toggleDarkMode = document.getElementById('toggleDarkMode');
    
    const themes = ['cyberpunk', 'matrix', 'purple'];
    let currentThemeIndex = 0;

    themeToggle.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        setTheme(themes[currentThemeIndex]);
    });

    toggleDarkMode.addEventListener('click', () => {
        // Alternar entre cyberpunk e matrix
        const newTheme = AppState.currentTheme === 'cyberpunk' ? 'matrix' : 'cyberpunk';
        setTheme(newTheme);
    });

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('githubGuideTheme');
    if (savedTheme) {
        setTheme(savedTheme);
        currentThemeIndex = themes.indexOf(savedTheme);
    }
}

function setTheme(themeName) {
    AppState.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('githubGuideTheme', themeName);
    showToast(`Tema alterado para: ${themeName}`, 'success');
}

// Barra de Progresso
function initializeProgress() {
    window.addEventListener('scroll', updateProgressBar);
}

function updateProgressBar() {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset;
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
    const progressBar = document.getElementById('readingProgress');
    
    if (progressBar) {
        progressBar.style.width = Math.min(scrollPercent, 100) + '%';
    }
}

// Estatísticas
function initializeStats() {
    updateStats();
}

function updateStats() {
    // Seções visitadas
    const visitedSectionsElement = document.getElementById('visitedSections');
    if (visitedSectionsElement) {
        visitedSectionsElement.textContent = AppState.visitedSections.size;
    }
    
    // Comandos copiados
    const commandsCopiedElement = document.getElementById('commandsCopied');
    if (commandsCopiedElement) {
        commandsCopiedElement.textContent = AppState.commandsCopied;
    }
}

function startSessionTimer() {
    const sessionTimeElement = document.getElementById('sessionTime');
    
    if (sessionTimeElement) {
        setInterval(() => {
            const now = new Date();
            const diff = now - AppState.sessionStart;
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            sessionTimeElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
}

// Modais
function initializeModals() {
    const exportGuide = document.getElementById('exportGuide');
    const exportModal = document.getElementById('exportModal');
    const modalClose = document.getElementById('modalClose');
    const exportOptions = document.querySelectorAll('.export-option');

    if (exportGuide && exportModal) {
        exportGuide.addEventListener('click', () => {
            exportModal.style.display = 'block';
        });

        modalClose.addEventListener('click', () => {
            exportModal.style.display = 'none';
        });

        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === exportModal) {
                exportModal.style.display = 'none';
            }
        });

        // Opções de exportação
        exportOptions.forEach(option => {
            option.addEventListener('click', function() {
                const format = this.getAttribute('data-format');
                exportGuide(format);
                exportModal.style.display = 'none';
            });
        });
    }
}

function exportGuide(format) {
    let content = '';
    const title = 'Guia Cyberpunk - Comandos GitHub\n\n';
    
    // Coletar conteúdo de todas as seções
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.style.display !== 'none') {
            const sectionTitle = section.querySelector('h2').textContent + '\n';
            const sectionText = extractSectionText(section);
            content += sectionTitle + sectionText + '\n\n';
        }
    });
    
    const fullContent = title + content;
    
    switch (format) {
        case 'txt':
            downloadText(fullContent, 'guia-github-cyberpunk.txt');
            break;
        case 'pdf':
            // Simulação - em um ambiente real, usaria uma biblioteca como jsPDF
            showToast('Exportação PDF em desenvolvimento', 'success');
            break;
        case 'html':
            downloadHTML(fullContent);
            break;
    }
}

function downloadText(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Guia exportado com sucesso!', 'success');
}

function downloadHTML(content) {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Guia Cyberpunk - Comandos GitHub</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2rem; }
                h1 { color: #00f3ff; }
                h2 { color: #00ff9d; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
                .command { background: #f4f4f4; padding: 0.5rem; border-left: 4px solid #00f3ff; margin: 0.5rem 0; font-family: monospace; }
            </style>
        </head>
        <body>
            <pre>${content}</pre>
        </body>
        </html>
    `;
    downloadText(htmlContent, 'guia-github-cyberpunk.html');
}

// Eventos de Scroll
function initializeScrollEvents() {
    // Atualizar menu ativo e marcar seções visitadas
    window.addEventListener('scroll', () => {
        updateActiveMenu();
        markVisitedSections();
    });
}

function updateActiveMenu() {
    const sections = document.querySelectorAll('.section');
    const menuItems = document.querySelectorAll('.menu-item');
    
    let currentSection = '';
    const scrollPosition = window.pageYOffset + 200;
    
    sections.forEach(section => {
        if (section.style.display !== 'none') {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.id;
            }
        }
    });
    
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === currentSection) {
            item.classList.add('active');
        }
    });
}

function markVisitedSections() {
    const sections = document.querySelectorAll('.section');
    const viewportHeight = window.innerHeight;
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < viewportHeight * 0.8 && rect.bottom > 0) {
            const sectionId = section.id;
            if (!AppState.visitedSections.has(sectionId)) {
                AppState.visitedSections.add(sectionId);
                section.setAttribute('data-visited', 'true');
                updateStats();
                
                // Efeito visual para nova seção visitada
                section.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    section.style.animation = '';
                }, 500);
            }
        }
    });
}

// Sistema de Notificações Toast
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remover toast após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Adicionar estilo para animação de saída do toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .search-highlight {
        background-color: rgba(255, 0, 255, 0.3) !important;
        color: var(--accent-2) !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
        font-weight: bold !important;
    }
    
    .no-results {
        text-align: center;
        padding: 3rem;
        color: var(--text-muted);
    }
    
    .no-results i {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
        color: var(--accent-1);
    }
    
    .no-results h3 {
        color: var(--text-muted);
        margin-bottom: 1rem;
    }
`;
document.head.appendChild(style);