/**
 * Módulo para gerenciar formulários, validações e formatações
 */

/**
 * Configura validação em tempo real para um formulário
 * @param {string} formId - ID do elemento de formulário
 */
function setupFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Obtém todos os campos do formulário
    const formInputs = form.querySelectorAll('input, textarea, select');
    
    // Adiciona validação para cada campo
    formInputs.forEach(input => {
        // Validação ao perder o foco
        input.addEventListener('blur', function() {
            validateInput(this);
        });
        
        // Validação ao digitar (depois de um pequeno delay)
        input.addEventListener('input', debounce(function() {
            validateInput(this);
        }, 300));
        
        // Configurações específicas para tipos especiais de campos
        setupSpecialFieldType(input);
    });
    
    // Configura validação ao enviar o formulário
    form.addEventListener('submit', function(event) {
        if (!validateForm(form)) {
            event.preventDefault();
            event.stopPropagation();
            showNotification('Por favor, corrija os erros no formulário antes de enviar.', 'warning');
        }
    });
}

/**
 * Valida um campo de formulário individual
 * @param {HTMLElement} input - Campo de entrada a ser validado
 * @returns {boolean} - Verdadeiro se o campo for válido
 */
function validateInput(input) {
    // Verifica se o campo tem validações
    if (!input.hasAttribute('required') && 
        !input.hasAttribute('pattern') && 
        !input.hasAttribute('min') && 
        !input.hasAttribute('max') && 
        !input.hasAttribute('minlength') && 
        !input.hasAttribute('maxlength')) {
        return true;
    }
    
    let isValid = true;
    
    // Verifica se está vazio mas é obrigatório
    if (input.hasAttribute('required') && !input.value.trim()) {
        isValid = false;
    }
    
    // Verifica padrão (regex)
    if (input.hasAttribute('pattern') && input.value.trim()) {
        const pattern = new RegExp(input.getAttribute('pattern'));
        if (!pattern.test(input.value)) {
            isValid = false;
        }
    }
    
    // Verifica valores mínimos e máximos para inputs numéricos
    if (input.type === 'number') {
        const value = parseFloat(input.value);
        if (input.hasAttribute('min') && value < parseFloat(input.getAttribute('min'))) {
            isValid = false;
        }
        if (input.hasAttribute('max') && value > parseFloat(input.getAttribute('max'))) {
            isValid = false;
        }
    }
    
    // Verifica tamanho mínimo e máximo de texto
    if (input.hasAttribute('minlength') && input.value.length < parseInt(input.getAttribute('minlength'))) {
        isValid = false;
    }
    if (input.hasAttribute('maxlength') && input.value.length > parseInt(input.getAttribute('maxlength'))) {
        isValid = false;
    }
    
    // Para e-mails, usa validação específica
    if (input.type === 'email' && input.value.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(input.value)) {
            isValid = false;
        }
    }
    
    // Adiciona ou remove a classe de validação
    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
    }
    
    return isValid;
}

/**
 * Configuração para tipos especiais de campos
 * @param {HTMLElement} input - Campo de entrada
 */
function setupSpecialFieldType(input) {
    // Verifica a ID ou outro atributo para identificar o tipo de campo
    const id = input.id.toLowerCase();
    
    // CPF
    if (id.includes('cpf') || input.hasAttribute('data-type-cpf')) {
        input.addEventListener('input', function() {
            this.value = formatCPF(this.value);
        });
    }
    
    // Telefone
    if (id.includes('phone') || input.hasAttribute('data-type-phone')) {
        input.addEventListener('input', function() {
            this.value = formatPhone(this.value);
        });
    }
    
    // CRM
    if (id.includes('crm') || input.hasAttribute('data-type-crm')) {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 6);
        });
    }
    
    // Preço
    if (id.includes('price') || input.hasAttribute('data-type-price')) {
        input.addEventListener('input', function() {
            if (this.value) {
                const value = parseFloat(this.value);
                if (!isNaN(value) && value < 0) {
                    this.value = '0';
                }
            }
        });
    }
}

/**
 * Formata um valor de CPF com a máscara padrão
 * @param {string} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatCPF(value) {
    if (!value) return '';
    
    // Remove caracteres não numéricos
    value = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    value = value.slice(0, 11);
    
    // Aplica a formatação
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
        value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
    } else if (value.length > 3) {
        value = value.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
    }
    
    return value;
}

/**
 * Formata um número de telefone com a máscara padrão
 * @param {string} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatPhone(value) {
    if (!value) return '';
    
    // Remove caracteres não numéricos
    value = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    value = value.slice(0, 11);
    
    // Aplica a formatação
    if (value.length > 10) {
        // Celular com 9 dígitos + DDD (11 dígitos)
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 9) {
        // Telefone fixo com 8 dígitos + DDD (10 dígitos)
        value = value.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 5) {
        // Telefone local
        value = value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
        // Apenas DDD
        value = value.replace(/^(\d{0,2})(\d{0,5}).*/, '($1) $2');
    } else if (value.length > 0) {
        // Início do DDD
        value = value.replace(/^(\d{0,2}).*/, '($1');
    }
    
    return value;
}

/**
 * Função debounce para impedir chamadas repetidas
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} - Função com debounce
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Extrai dados de um formulário em formato de objeto
 * @param {string} formId - ID do formulário 
 * @returns {Object} - Objeto com os dados do formulário
 */
function extractFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        // Trata campos especiais
        if (key.includes('cpf')) {
            data[key] = value.replace(/\D/g, '');
        } else if (key.includes('phone')) {
            data[key] = value.replace(/\D/g, '');
        } else if (key.includes('price') && value !== '') {
            data[key] = parseFloat(value);
        } else {
            data[key] = value;
        }
    });
    
    return data;
}

/**
 * Preenche um formulário com dados
 * @param {string} formId - ID do formulário
 * @param {Object} data - Dados para preencher o formulário
 */
function fillFormData(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Para cada campo no formulário
    for (const field in data) {
        const input = form.elements[field];
        if (input) {
            // Trata tipos especiais
            if (field.includes('cpf') && data[field]) {
                input.value = formatCPF(data[field]);
            } else if (field.includes('phone') && data[field]) {
                input.value = formatPhone(data[field]);
            } else {
                input.value = data[field];
            }
        }
    }
}