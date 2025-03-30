// Utilities
const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
const tooltipList = tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// Registro do Service Worker para funcionalidade offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/assets/js/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.error('Falha ao registrar o Service Worker:', error);
            });
    });
}

// Sistema de detecção de conexão para interface
function updateOnlineStatus() {
    const statusIndicator = document.getElementById('connection-status');
    if (statusIndicator) {
        if (navigator.onLine) {
            statusIndicator.textContent = 'Online';
            statusIndicator.className = 'badge bg-success';
        } else {
            statusIndicator.textContent = 'Offline';
            statusIndicator.className = 'badge bg-warning';
        }
    }
}

// Monitora alterações no status de conexão
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
document.addEventListener('DOMContentLoaded', updateOnlineStatus);

// Authentication check
(async function() {
    const isLogged = await isLoggedIn();
    if (!isLogged) {
        logout();
        window.location.href = '../../auth/login.html';
    }
})();

function desconectar() {
    logout();
    window.location.href = '../../auth/login.html';
}

/**
 * Sistema de notificações para substituir os alerts
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificação (success, error, warning, info)
 * @param {number} duration - Duração em ms (padrão: 3000ms)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Verifica se o container de notificações já existe
    let notificationContainer = document.getElementById('notificationContainer');
    
    // Se não existir, cria um novo
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'position-fixed top-0 end-0 p-3';
        notificationContainer.style.zIndex = '1050';
        document.body.appendChild(notificationContainer);
    }
    
    // Mapeia os tipos para as classes do Bootstrap
    const typeClass = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };
    
    // Cria o elemento de toast
    const toastId = `toast-${Date.now()}`;
    const toastHtml = `\
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${typeClass[type] || 'bg-info'} text-white">
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Adiciona o toast ao container
    notificationContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Inicializa e mostra o toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
    toast.show();
    
    // Remove o elemento após fechar
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

/**
 * Mostra uma caixa de confirmação personalizada usando Bootstrap
 * @param {string} title - Título da confirmação
 * @param {string} message - Mensagem a ser exibida
 * @param {Function} confirmCallback - Função a ser executada ao confirmar
 * @param {Function} cancelCallback - Função a ser executada ao cancelar (opcional)
 */
function showConfirmDialog(title, message, confirmCallback, cancelCallback = null) {
    const modalBody = document.createElement('div');
    modalBody.innerHTML = message;
    
    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'btn btn-danger';
    confirmButton.textContent = 'Confirmar';
    confirmButton.addEventListener('click', () => {
        modal.hide();
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'Cancelar';
    cancelButton.setAttribute('data-bs-dismiss', 'modal');
    cancelButton.addEventListener('click', () => {
        if (typeof cancelCallback === 'function') {
            cancelCallback();
        }
    });
    
    const modal = createModal(title, modalBody, [cancelButton, confirmButton]);
    modal.show();
}

/**
 * Função para criar ou atualizar um modal bootstrap acessível na página com o título, corpo e botões passados como parâmetros
 * @param {string} title 
 * @param {HTMLElement} body 
 * @param {HTMLElement[]|HTMLElement|string} buttons - Array de botões, elemento HTML único ou string HTML
 * 
 * @returns {object} modalInstance - Instância do modal bootstrap criada ou atualizada
 */
function createModal(title, body, buttons) {
    const modalId = "genericModalId";
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal fade";
        modal.id = modalId;
        modal.tabIndex = "-1";
        modal.setAttribute("aria-labelledby", `${modalId}Label`);
        modal.setAttribute("aria-hidden", "true");

        const modalDialog = document.createElement("div");
        modalDialog.className = "modal-dialog";

        const modalContent = document.createElement("div");
        modalContent.className = "modal-content";

        const modalHeader = document.createElement("div");
        modalHeader.className = "modal-header";

        const modalTitle = document.createElement("h5");
        modalTitle.className = "modal-title";
        modalTitle.id = `${modalId}Label`;

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "btn-close";
        closeButton.setAttribute("data-bs-dismiss", "modal");
        closeButton.setAttribute("aria-label", "Close");

        const modalBody = document.createElement("div");
        modalBody.className = "modal-body";

        const modalFooter = document.createElement("div");
        modalFooter.className = "modal-footer";

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalDialog.appendChild(modalContent);
        modal.appendChild(modalDialog);
        document.body.appendChild(modal);
    }

    // Update modal content
    const modalTitle = modal.querySelector(".modal-title");
    const modalBody = modal.querySelector(".modal-body");
    const modalFooter = modal.querySelector(".modal-footer");

    modalTitle.innerText = title;
    modalBody.innerHTML = ""; // Clear previous content
    modalBody.appendChild(body);

    modalFooter.innerHTML = ""; // Clear previous buttons
    
    // Verifica o tipo de dado recebido para o footer
    if (Array.isArray(buttons)) {
        // Se for um array de botões
        buttons.forEach(button => modalFooter.appendChild(button));
    } else if (buttons instanceof HTMLElement) {
        // Se for um único elemento HTML
        modalFooter.appendChild(buttons);
    } else if (typeof buttons === 'string') {
        // Se for uma string HTML
        modalFooter.innerHTML = buttons;
    }
    
    const modalInstance = new bootstrap.Modal(modal);
    return modalInstance;
}

/**
 * Cria um elemento de loading spinner
 * @param {string} containerId - ID do elemento que conterá o spinner
 * @param {string} size - Tamanho do spinner (sm, md, lg)
 * @param {string} message - Mensagem opcional a ser mostrada junto com o spinner
 */
function showLoadingSpinner(containerId, size = 'md', message = 'Carregando...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Limpa o conteúdo do container
    container.innerHTML = '';
    
    // Mapeia os tamanhos para as classes do Bootstrap
    const spinnerSize = {
        sm: '',
        md: 'spinner-border-md',
        lg: 'spinner-border-lg'
    };
    
    // Cria o elemento de spinner
    const spinnerHtml = `\
        <div class="d-flex flex-column align-items-center justify-content-center">
            <div class="spinner-border ${spinnerSize[size] || ''} text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            ${message ? `<p class="mt-2">${message}</p>` : ''}
        </div>
    `;
    
    container.innerHTML = spinnerHtml;
}

/**
 * Função para formatar data para exibição
 * @param {string} dateString - Data em formato string (geralmente vinda da API)
 * @param {string} format - Formato desejado (short, medium, long)
 * @returns {string} - Data formatada
 */
function formatDate(dateString, format = 'medium') {
    const date = new Date(dateString);
    
    const options = {
        short: { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        },
        medium: { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        },
        long: { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        }
    };
    
    return date.toLocaleDateString('pt-BR', options[format] || options.medium);
}

/**
 * Formata valor monetário
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado como moeda brasileira
 */
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    });
}

/**
 * Valida um formulário baseado nos atributos HTML5
 * @param {HTMLFormElement} form - Elemento de formulário a ser validado
 * @returns {boolean} - Verdadeiro se o formulário é válido
 */
function validateForm(form) {
    if (!form || !(form instanceof HTMLFormElement)) {
        console.error('Um elemento de formulário válido deve ser fornecido');
        return false;
    }
    
    // Adiciona a classe 'was-validated' para mostrar feedback visual
    form.classList.add('was-validated');
    
    return form.checkValidity();
}

// Atualiza o contador de operações pendentes na interface
function updatePendingOperationsCount() {
    const pendingBadge = document.getElementById('pending-operations-count');
    if (!pendingBadge) return;
    
    // Recupera as operações pendentes do localStorage
    const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
    
    if (pendingOps.length > 0) {
        pendingBadge.textContent = pendingOps.length;
        pendingBadge.classList.remove('d-none');
        
        // Adiciona classe de animação pulsante se não existir
        if (!pendingBadge.classList.contains('badge-pulse')) {
            pendingBadge.classList.add('badge-pulse');
        }
        
        // Cria uma tooltip detalhada com informações sobre as operações pendentes
        let tooltipText = 'Operações pendentes para sincronização:\n';
        
        // Agrupa operações por tipo (POST, PUT, DELETE) e endpoint
        const groupedOps = pendingOps.reduce((acc, op) => {
            const key = `${op.method} - ${op.endpoint.split('/')[0]}`;
            if (!acc[key]) acc[key] = 0;
            acc[key]++;
            return acc;
        }, {});
        
        // Cria a lista de operações para a tooltip
        Object.entries(groupedOps).forEach(([type, count]) => {
            tooltipText += `- ${count} ${type}\n`;
        });
        
        // Atualiza a tooltip
        if (pendingBadge._tippy) {
            pendingBadge._tippy.setContent(tooltipText);
        } else if (typeof tippy !== 'undefined') {
            tippy(pendingBadge, {
                content: tooltipText,
                placement: 'bottom',
                theme: 'light-border',
                allowHTML: false
            });
        } else {
            // Fallback para o atributo title se tippy não estiver disponível
            pendingBadge.setAttribute('title', tooltipText.replace(/\n/g, ' | '));
        }
    } else {
        pendingBadge.classList.add('d-none');
        pendingBadge.classList.remove('badge-pulse');
    }
}

// Adiciona listener para quando as operações pendentes mudarem
window.addEventListener('pendingOperationsChanged', updatePendingOperationsCount);