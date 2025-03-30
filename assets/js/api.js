const API_URL = 'http://3.132.228.81/api';

// Sistema de cache para armazenar respostas
const apiCache = {
    data: {},
    timeouts: {},
    // Tempo padrão de expiração do cache em ms (5 minutos)
    defaultExpiration: 5 * 60 * 1000,
    
    // Salva dados no cache
    set(key, data, expiration = this.defaultExpiration) {
        this.data[key] = {
            data,
            timestamp: Date.now()
        };
        
        // Limpa o timeout existente se houver
        if (this.timeouts[key]) {
            clearTimeout(this.timeouts[key]);
        }
        
        // Define um novo timeout para expirar o cache
        this.timeouts[key] = setTimeout(() => {
            delete this.data[key];
            delete this.timeouts[key];
        }, expiration);
    },
    
    // Recupera dados do cache
    get(key) {
        return this.data[key]?.data || null;
    },
    
    // Verifica se um item está no cache
    has(key) {
        return !!this.data[key];
    },
    
    // Remove um item específico do cache
    remove(key) {
        delete this.data[key];
        if (this.timeouts[key]) {
            clearTimeout(this.timeouts[key]);
            delete this.timeouts[key];
        }
    },
    
    // Limpa o cache para um recurso específico ou prefixo
    invalidate(resourcePrefix) {
        Object.keys(this.data).forEach(key => {
            if (key.startsWith(resourcePrefix)) {
                this.remove(key);
            }
        });
    },
    
    // Limpa todo o cache
    clear() {
        Object.keys(this.timeouts).forEach(key => {
            clearTimeout(this.timeouts[key]);
        });
        this.data = {};
        this.timeouts = {};
    }
};

// Sistema de operações pendentes offline
const offlineQueue = {
    // Chave para armazenamento local
    STORAGE_KEY: 'pendingOperations',
    
    // Obter lista de operações pendentes
    getOperations() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },
    
    // Adicionar operação à fila
    addOperation(operation) {
        const operations = this.getOperations();
        // Adiciona ID único e timestamp
        operation.id = this.generateId();
        operation.timestamp = Date.now();
        operations.push(operation);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(operations));
        
        // Dispara evento para atualizar a UI
        this.notifyChange();
        return operation.id;
    },
    
    // Remover operação da fila
    removeOperation(id) {
        const operations = this.getOperations();
        const newOperations = operations.filter(op => op.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newOperations));
        
        // Dispara evento para atualizar a UI
        this.notifyChange();
        return true;
    },
    
    // Gerar ID único para operação
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    // Limpar todas as operações pendentes
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        
        // Dispara evento para atualizar a UI
        this.notifyChange();
    },
    
    // Notificar mudanças na fila
    notifyChange() {
        const event = new CustomEvent('offlineQueueUpdated', {
            detail: {
                pendingCount: this.getOperations().length
            }
        });
        document.dispatchEvent(event);
    }
};

// Função para adicionar operações à fila de pendentes
function addToPendingOperations(method, endpoint, data) {
    return offlineQueue.addOperation({
        method,
        endpoint,
        data,
        status: 'pending'
    });
}

// Função para sincronizar operações pendentes
async function syncPendingOperations() {
    // Se estiver offline, não tenta sincronizar
    if (!navigator.onLine) {
        console.log("Ainda offline, não é possível sincronizar operações pendentes");
        return false;
    }
    
    const operations = offlineQueue.getOperations();
    
    if (operations.length === 0) {
        console.log("Nenhuma operação pendente para sincronizar");
        return true;
    }
    
    console.log(`Sincronizando ${operations.length} operações pendentes...`);
    
    // Mostrar notificação ao usuário
    showToast("Sincronizando operações realizadas offline...", "info");
    
    let successCount = 0;
    let failCount = 0;
    
    // Processa cada operação pendente
    for (const operation of operations) {
        try {
            console.log(`Processando operação ${operation.method} ${operation.endpoint}`);
            
            // Executa a operação pendente
            const result = await apiRequest(
                operation.method,
                operation.endpoint,
                operation.data,
                false // Não usa cache para operações pendentes
            );
            
            if (result.success) {
                // Remove a operação da fila se for bem-sucedida
                offlineQueue.removeOperation(operation.id);
                successCount++;
            } else {
                // Marca como falha mas mantém na fila para tentar novamente
                console.error(`Falha ao sincronizar operação: ${operation.method} ${operation.endpoint}`, result.error);
                failCount++;
            }
        } catch (error) {
            console.error(`Erro ao sincronizar operação: ${operation.method} ${operation.endpoint}`, error);
            failCount++;
        }
    }
    
    // Notifica o usuário sobre o resultado
    if (failCount === 0 && successCount > 0) {
        showToast(`${successCount} operações sincronizadas com sucesso!`, "success");
    } else if (failCount > 0) {
        showToast(`${successCount} operações sincronizadas. ${failCount} falhas.`, "warning");
    }
    
    return failCount === 0;
}

// Função auxiliar para mostrar toast (requer implementação)
function showToast(message, type = "info") {
    // Verificar se a função já existe no escopo global
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`Toast (${type}): ${message}`);
        // Implementação básica de fallback se não existir uma global
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '10px 20px';
        toast.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                    type === 'warning' ? '#FF9800' : 
                                    type === 'error' ? '#F44336' : '#2196F3';
        toast.style.color = 'white';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '9999';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }
}

// Configurar evento para sincronizar quando a conexão for restabelecida
window.addEventListener('online', () => {
    console.log('Conexão restabelecida! Sincronizando operações pendentes...');
    syncPendingOperations();
});

// Configurar evento para notificar o usuário quando ficar offline
window.addEventListener('offline', () => {
    console.log('Dispositivo está offline. Operações serão armazenadas localmente.');
    showToast("Você está offline. As operações serão armazenadas e sincronizadas posteriormente.", "warning");
});

// Verificar e tentar sincronizar na inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (navigator.onLine && offlineQueue.getOperations().length > 0) {
        console.log('Há operações pendentes. Tentando sincronizar na inicialização...');
        syncPendingOperations();
    }
    
    // Atualiza contador de operações pendentes
    updatePendingOperationsCount();
});

// Função para atualizar o contador de operações pendentes na UI
function updatePendingOperationsCount() {
    const pendingCount = offlineQueue.getOperations().length;
    
    // Atualiza o contador na barra de navegação, se existir
    const counterElement = document.getElementById('pending-operations-counter');
    if (counterElement) {
        if (pendingCount > 0) {
            counterElement.textContent = pendingCount;
            counterElement.style.display = 'inline-block';
        } else {
            counterElement.style.display = 'none';
        }
    }
}

// Escuta por mudanças na fila offline para atualizar UI
document.addEventListener('offlineQueueUpdated', () => {
    updatePendingOperationsCount();
});

const token = localStorage.getItem('token');

if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/* ==== Funções genéricas de requisição ==== */
async function apiRequest(method, endpoint, data = null, useCache = true, retryCount = 0) {
    // Máximo de tentativas
    const MAX_RETRIES = 3;
    // Tempo de espera entre tentativas (em ms) - aumenta exponencialmente
    const RETRY_DELAY = 1000 * Math.pow(2, retryCount);
    
    // Cria uma chave para o cache
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;
    
    // Se estiver offline e tiver cache para GET, use o cache
    if (!navigator.onLine && method.toLowerCase() === 'get' && apiCache.has(cacheKey)) {
        console.log(`Offline: Usando cache para ${method} ${endpoint}`);
        return {
            success: true,
            data: apiCache.get(cacheKey),
            status: 200,
            fromCache: true,
            offline: true
        };
    }
    
    // Se estiver offline e for uma operação de escrita, armazene em fila pendente
    if (!navigator.onLine && method.toLowerCase() !== 'get') {
        console.log(`Offline: Operação ${method} ${endpoint} armazenada para execução posterior`);
        // Adicione à fila de operações pendentes
        addToPendingOperations(method, endpoint, data);
        return {
            success: false,
            offline: true,
            queued: true,
            error: new Error('Operação armazenada para execução quando a conexão for restabelecida')
        };
    }
    
    // Para métodos GET, verifica se a resposta está em cache (quando online)
    if (method.toLowerCase() === 'get' && useCache && apiCache.has(cacheKey)) {
        return {
            success: true,
            data: apiCache.get(cacheKey),
            status: 200,
            fromCache: true
        };
    }
    
    try {
        const config = {
            method,
            url: `${API_URL}/${endpoint}`,
            data: method !== 'get' && method !== 'delete' ? data : undefined,
            timeout: 8000 // Timeout de 8 segundos para requisições
        };
        
        const response = await axios(config);
        
        // Para métodos GET, armazena a resposta em cache
        if (method.toLowerCase() === 'get' && useCache) {
            apiCache.set(cacheKey, response.data);
        }
        
        return {
            success: true,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        // Verificar se o erro é de rede ou timeout
        const isNetworkError = !error.response && 
                              (error.code === 'ECONNABORTED' || 
                               error.message.includes('Network Error') ||
                               error.message.includes('timeout'));
        
        // Se for erro de rede e ainda não atingiu o número máximo de tentativas, tenta novamente
        if (isNetworkError && retryCount < MAX_RETRIES) {
            console.log(`Tentativa ${retryCount + 1} falhou para ${method} ${endpoint}. Tentando novamente em ${RETRY_DELAY}ms...`);
            
            // Espera antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            
            // Tenta novamente com contador incrementado
            return apiRequest(method, endpoint, data, useCache, retryCount + 1);
        }
        
        // Verificar se o erro é de autenticação
        if (error.response && error.response.status === 401) {
            // Token expirado ou inválido
            if (endpoint !== 'login' && endpoint !== 'logout') {
                // Redireciona para a página de login, mas guarda a URL atual para redirecionamento posterior
                const currentPage = window.location.pathname;
                localStorage.setItem('redirectAfterLogin', currentPage);
                window.location.href = '/auth/login.html';
                return { success: false, error, redirected: true };
            }
        }
        
        // Para GET e com cache disponível em caso de falha de rede, usa o cache mesmo que expirado
        if (method.toLowerCase() === 'get' && apiCache.has(cacheKey) && isNetworkError) {
            console.warn(`Falha de rede para ${method} ${endpoint}. Usando cache disponível.`);
            return {
                success: true,
                data: apiCache.get(cacheKey),
                status: 200,
                fromCache: true,
                staleCache: true
            };
        }
        
        console.error(`API error (${method} ${endpoint}):`, error);
        return {
            success: false,
            error,
            status: error.response?.status
        };
    }
}

// Versões das funções básicas de API que usam e gerenciam cache

async function getAll(resource, useCache = true) {
    const response = await apiRequest('get', resource, null, useCache);
    return response.success ? response.data : [];
}

async function getOne(resource, id, useCache = true) {
    const response = await apiRequest('get', `${resource}/${id}`, null, useCache);
    return response.success ? response.data : null;
}

async function create(resource, data) {
    const response = await apiRequest('post', resource, data, false);
    // Invalida o cache para este recurso quando um novo item é criado
    if (response.success) {
        apiCache.invalidate(resource);
    }
    return response.success ? response.data : null;
}

async function update(resource, id, data) {
    const response = await apiRequest('put', `${resource}/${id}`, data, false);
    // Invalida o cache para este recurso quando um item é atualizado
    if (response.success) {
        apiCache.invalidate(resource);
        // Invalida também o cache específico deste item
        apiCache.remove(`get:${resource}/${id}:{}`);
    }
    return response.success ? response.data : null;
}

async function remove(resource, id) {
    const response = await apiRequest('delete', `${resource}/${id}`, null, false);
    // Invalida o cache para este recurso quando um item é excluído
    if (response.success) {
        apiCache.invalidate(resource);
        // Invalida também o cache específico deste item
        apiCache.remove(`get:${resource}/${id}:{}`);
    }
    return response.success ? response.status === 204 : false;
}

/* ==== Rotas da API ==== */

/* ---- Autenticação ----*/
async function login(email, password) {
    const response = await apiRequest('post', 'login', {email, password});
    
    if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        return true;
    }
    
    return false;
}

function logout() {
    try {
        apiRequest('post', 'logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
}

async function me() {
    const response = await apiRequest('get', 'me');
    
    if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    }
    
    return null;
}

/* ---- Clientes ---- */
async function getClients() {
    return getAll('clients');
}

async function createClient(client) {
    return create('clients', client);
}

async function showClient(id) {
    return getOne('clients', id);
}

async function updateClient(id, client) {
    return update('clients', id, client);
}

async function deleteClient(id) {
    return remove('clients', id);
}

/* ---- Exames ---- */
async function getExams() {
    return getAll('exams');
}

async function createExam(exam) {
    return create('exams', exam);
}

async function showExam(id) {
    return getOne('exams', id);
}

async function updateExam(id, exam) {
    return update('exams', id, exam);
}

async function deleteExam(id) {
    return remove('exams', id);
}

/* ---- Resultados ---- */
async function getResults() {
    return getAll('exam-results');
}

async function createResult(result) {
    return create('exam-results', result);
}

async function showResult(id) {
    return getOne('exam-results', id);
}

async function updateResult(id, result) {
    return update('exam-results', id, result);
}

async function deleteResult(id) {
    return remove('exam-results', id);
}

/* ---- Agendamentos de Exames ---- */
async function getExamSchedules() {
    return getAll('exam-schedulings');
}

async function createExamSchedule(schedule) {
    return create('exam-schedulings', schedule);
}

async function showExamSchedule(id) {
    return getOne('exam-schedulings', id);
}

async function updateExamSchedule(id, schedule) {
    return update('exam-schedulings', id, schedule);
}

async function deleteExamSchedule(id) {
    return remove('exam-schedulings', id);
}

/* ---- Medicos ---- */
async function getMedics() {
    return getAll('medics');
}

async function createMedic(medic) {
    return create('medics', medic);
}

async function showMedic(id) {
    return getOne('medics', id);
}

async function updateMedic(id, medic) {
    return update('medics', id, medic);
}

async function deleteMedic(id) {
    return remove('medics', id);
}

/* ==== Funções auxiliares ==== */
function getUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user;
}

async function isLoggedIn() {
    try {
        const response = await apiRequest('get', 'me');
        return response.success;
    } catch (error) {
        return false;
    }
}

async function checkAvailability(date, time) {
    // Verifica se a data está no formato correto (YYYY-MM-DD)
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) {
        console.error('Data inválida. O formato correto é YYYY-MM-DD.');
        return false;
    }

    const response = await apiRequest('get', `check-availability/${date}/${time}`);
    return response.success ? response.data.available : false;
}

// Nova função para forçar a atualização de dados do cache
async function refreshData(resource, id = null) {
    if (id) {
        // Atualiza um item específico
        return await getOne(resource, id, false);
    } else {
        // Atualiza todos os itens de um recurso
        return await getAll(resource, false);
    }
}

// Função para verificar se há conexão com a internet
function isOnline() {
    return navigator.onLine;
}

// Eventos para gerenciar cache baseado no estado da conexão
window.addEventListener('online', () => {
    console.log('Conexão restabelecida. Atualizando dados...');
    // Podemos adicionar lógica para atualizar automaticamente os dados quando ficar online
});

window.addEventListener('offline', () => {
    console.log('Sem conexão. Usando dados em cache quando disponíveis.');
});

// Sistema de gerenciamento de operações pendentes para processamento offline
const pendingOperations = {
    // Chave para o localStorage
    STORAGE_KEY: 'pending_operations',
    
    // Adiciona uma operação à fila para processamento posterior
    add(method, endpoint, data) {
        const operations = this.getAll();
        operations.push({
            id: Date.now(), // ID único baseado em timestamp
            method,
            endpoint,
            data,
            timestamp: Date.now()
        });
        this.saveAll(operations);
        
        // Dispara um evento para notificar a interface
        const event = new CustomEvent('pendingOperationsChanged', {
            detail: { count: operations.length }
        });
        window.dispatchEvent(event);
        
        return true;
    },
    
    // Obtém todas as operações pendentes
    getAll() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },
    
    // Salva todas as operações pendentes
    saveAll(operations) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(operations));
    },
    
    // Remove uma operação específica
    remove(id) {
        const operations = this.getAll().filter(op => op.id !== id);
        this.saveAll(operations);
        
        // Dispara um evento para notificar a interface
        const event = new CustomEvent('pendingOperationsChanged', {
            detail: { count: operations.length }
        });
        window.dispatchEvent(event);
    },
    
    // Limpa todas as operações pendentes
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        
        // Dispara um evento para notificar a interface
        const event = new CustomEvent('pendingOperationsChanged', {
            detail: { count: 0 }
        });
        window.dispatchEvent(event);
    },
    
    // Obtém o número de operações pendentes
    count() {
        return this.getAll().length;
    },
    
    // Processa todas as operações pendentes
    async processAll() {
        if (!navigator.onLine) {
            console.log('Não é possível processar operações pendentes: dispositivo offline');
            return { success: false, processed: 0, failed: 0 };
        }
        
        const operations = this.getAll();
        let processed = 0;
        let failed = 0;
        
        for (const operation of operations) {
            try {
                // Processa a operação
                const result = await apiRequest(
                    operation.method,
                    operation.endpoint,
                    operation.data,
                    false // Não usar cache
                );
                
                if (result.success) {
                    // Remove a operação processada com sucesso
                    this.remove(operation.id);
                    processed++;
                } else {
                    // Mantém a operação para nova tentativa
                    failed++;
                }
            } catch (error) {
                console.error('Erro ao processar operação pendente:', error);
                failed++;
            }
        }
        
        return { success: processed > 0, processed, failed };
    }
};

// Função auxiliar para adicionar à fila de operações pendentes
function addToPendingOperations(method, endpoint, data) {
    return pendingOperations.add(method, endpoint, data);
}

// Processa operações pendentes quando a conexão é restabelecida
window.addEventListener('online', async () => {
    console.log('Conexão restabelecida. Processando operações pendentes...');
    const result = await pendingOperations.processAll();
    console.log(`Operações processadas: ${result.processed}, falhas: ${result.failed}`);
    
    // Atualiza os dados após processar operações pendentes
    if (result.processed > 0) {
        // Força atualização dos dados na tela atual
        if (typeof refreshCurrentView === 'function') {
            refreshCurrentView();
        }
    }
});
