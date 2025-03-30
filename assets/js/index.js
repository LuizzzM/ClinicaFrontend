// Variáveis globais para controle
let allExams = [];
let currentPage = 1;
let itemsPerPage = 8;
let editingExamId = null;
let filteredExams = [];

/**
 * Função para carregar os indicadores do dashboard
 */
async function loadDashboardStats() {
    try {
        // Carregar totais para o dashboard
        const [exams, clients, medics, schedules] = await Promise.all([
            getExams(),
            getClients(),
            getMedics(),
            getExamSchedules()
        ]);
        
        // Atualizar os contadores no dashboard
        document.getElementById('dash-total-exams').textContent = exams.length;
        document.getElementById('dash-total-clients').textContent = clients.length;
        document.getElementById('dash-total-medics').textContent = medics.length;
        document.getElementById('dash-total-schedules').textContent = schedules.length;
        
        // Guardar todos os exames para uso posterior
        allExams = exams;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas do dashboard:', error);
        showNotification('Erro ao carregar informações do dashboard', 'error');
    }
}

/**
 * Função para carregar exames e plotar na tela
 */
async function loadExames() {
    // Mostra spinner de carregamento
    document.getElementById('loadingExams').classList.remove('d-none');
    document.getElementById('exames-row').classList.add('d-none');
    document.getElementById('noExamsFound').classList.add('d-none');
    
    try {
        // Se ainda não carregamos os exames via dashboard, carrega agora
        if (allExams.length === 0) {
            allExams = await getExams();
        }
        
        // Preenche os exames filtrados
        filteredExams = [...allExams];
        
        // Verifica se temos exames para exibir
        if (filteredExams.length === 0) {
            document.getElementById('loadingExams').classList.add('d-none');
            document.getElementById('noExamsFound').classList.remove('d-none');
            return;
        }
        
        // Exibe os exames
        renderExamCards();
        
        // Esconde o spinner e mostra os resultados
        document.getElementById('loadingExams').classList.add('d-none');
        document.getElementById('exames-row').classList.remove('d-none');
        
    } catch (error) {
        console.error('Erro ao carregar exames:', error);
        showNotification('Erro ao carregar a lista de exames', 'error');
        document.getElementById('loadingExams').classList.add('d-none');
    }
}

/**
 * Função para filtrar exames baseado no texto de pesquisa
 * @param {Event} event - Evento de input
 */
function searchExams(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredExams = [...allExams];
    } else {
        filteredExams = allExams.filter(exam => 
            exam.name.toLowerCase().includes(searchTerm) ||
            exam.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Resetar para a primeira página quando pesquisar
    currentPage = 1;
    
    // Verificar se há resultados
    if (filteredExams.length === 0) {
        document.getElementById('exames-row').classList.add('d-none');
        document.getElementById('noExamsFound').classList.remove('d-none');
        document.getElementById('noExamsFound').textContent = 'Nenhum exame encontrado para a pesquisa realizada.';
        document.getElementById('exam-pagination').innerHTML = '';
    } else {
        document.getElementById('exames-row').classList.remove('d-none');
        document.getElementById('noExamsFound').classList.add('d-none');
        renderExamCards();
    }
}

/**
 * Renderiza os cards de exames na interface
 */
function renderExamCards() {
    const examesRow = document.getElementById('exames-row');
    examesRow.innerHTML = '';
    
    // Calcular paginação
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredExams.length);
    const currentExams = filteredExams.slice(startIndex, endIndex);
    
    // Criar os cards
    currentExams.forEach((exame, index) => {
        const delayAnimation = index * 50; // Escalonar a animação de entrada
        const examCard = document.createElement('div');
        examCard.className = 'col-12 col-md-6 col-lg-3 mb-4 animate-fadein';
        examCard.style.animationDelay = `${delayAnimation}ms`;
        
        examCard.innerHTML = `
            <div class="card exam-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${exame.name}</h5>
                    <p class="card-text">${exame.description}</p>
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">Preço</span>
                            <span class="info-value">${formatCurrency(exame.price)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Duração</span>
                            <span class="info-value">${formatDuration(exame.duration)}</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-sm btn-primary" onclick="agendarExame(${exame.id})">
                        <span class="material-icons fs-6">event</span> Agendar
                    </button>
                    <div>
                        <a href="./exames/detalhes.html?id=${exame.id}" class="btn btn-sm btn-outline-info me-1">
                            <span class="material-icons fs-6">visibility</span>
                        </a>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="editExame(${exame.id})">
                            <span class="material-icons fs-6">edit</span>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteExameConfirm(${exame.id})">
                            <span class="material-icons fs-6">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        examesRow.appendChild(examCard);
    });
    
    // Atualizar paginação
    updatePagination();
}

/**
 * Atualiza a paginação baseada no número total de itens filtrados
 */
function updatePagination() {
    const pagination = document.getElementById('exam-pagination');
    pagination.innerHTML = '';
    
    // Calcular número total de páginas
    const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
    
    // Se só tiver uma página, não mostrar paginação
    if (totalPages <= 1) {
        return;
    }
    
    // Adicionar botão "Anterior"
    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = `
        <a class="page-link" href="#" aria-label="Anterior" ${currentPage > 1 ? `onclick="changePage(${currentPage - 1}); return false;"` : ''}>
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    pagination.appendChild(prevButton);
    
    // Determinar quais páginas mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar para mostrar sempre 5 páginas quando possível
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Adicionar páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `
            <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
        `;
        pagination.appendChild(pageItem);
    }
    
    // Adicionar botão "Próximo"
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = `
        <a class="page-link" href="#" aria-label="Próximo" ${currentPage < totalPages ? `onclick="changePage(${currentPage + 1}); return false;"` : ''}>
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    pagination.appendChild(nextButton);
}

/**
 * Muda para a página especificada na paginação
 * @param {number} page - Número da página
 */
function changePage(page) {
    currentPage = page;
    renderExamCards();
    
    // Rolar para o topo da seção de exames
    document.getElementById('exames').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Formata a duração do exame para exibição mais amigável
 * @param {string} duration - Duração no formato HH:MM:SS
 * @returns {string} - Duração formatada
 */
function formatDuration(duration) {
    if (!duration) return "-";
    
    const parts = duration.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    
    if (hours === 0 && minutes === 0) return "< 1 min";
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    
    return `${hours}h ${minutes}min`;
}

/**
 * Preenche o formulário com os dados do exame para edição
 * @param {number} id - ID do exame a ser editado
 */
async function editExame(id) {
    // Busca o exame na API
    const exam = await showExam(id);
    
    if (!exam) {
        showNotification('Erro ao carregar dados do exame', 'error');
        return;
    }
    
    // Salva o ID do exame em edição
    editingExamId = id;
    
    // Preenche o formulário
    document.getElementById('exame-name').value = exam.name;
    document.getElementById('exame-description').value = exam.description;
    document.getElementById('exame-price').value = exam.price;
    
    // Formata a duração para o formato de input time (HH:MM)
    const duration = exam.duration.split(':');
    document.getElementById('exame-duration').value = `${duration[0]}:${duration[1]}`;
    
    // Atualiza o título do modal e o botão de salvar
    document.getElementById('addExameModalLabel').textContent = 'Editar Exame';
    const saveButton = document.querySelector('#addExameModal .btn-primary');
    saveButton.setAttribute('data-is-editing', 'true');
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('addExameModal'));
    modal.show();
}

/**
 * Mostra confirmação antes de deletar um exame
 * @param {number} id - ID do exame a ser deletado
 */
function deleteExameConfirm(id) {
    showConfirmDialog(
        'Excluir Exame',
        'Tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.',
        async () => {
            await deleteExame(id);
        }
    );
}

/**
 * Exclui um exame
 * @param {number} id - ID do exame a ser excluído
 */
async function deleteExame(id) {
    try {
        // Tenta excluir o exame
        const result = await deleteExam(id);
        
        if (result) {
            showNotification('Exame excluído com sucesso!', 'success');
            
            // Atualiza a lista de exames
            allExams = allExams.filter(exam => exam.id !== id);
            filteredExams = filteredExams.filter(exam => exam.id !== id);
            
            // Recarrega a interface com a lista atualizada
            if (filteredExams.length === 0) {
                document.getElementById('exames-row').classList.add('d-none');
                document.getElementById('noExamsFound').classList.remove('d-none');
                document.getElementById('noExamsFound').textContent = 'Nenhum exame encontrado.';
            } else {
                renderExamCards();
            }
            
            // Atualiza contador do dashboard
            document.getElementById('dash-total-exams').textContent = allExams.length;
        } else {
            showNotification('Erro ao excluir exame. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir exame:', error);
        showNotification('Erro ao excluir exame. Tente novamente.', 'error');
    }
}

/**
 * Salva um exame (novo ou em edição)
 */
async function saveExames() {
    // Obtém o formulário
    const form = document.getElementById('add-exame-form');
    
    // Valida o formulário
    if (!validateForm(form)) {
        return;
    }
    
    // Obtém os dados do formulário
    const exameName = document.getElementById('exame-name').value;
    const exameDescription = document.getElementById('exame-description').value;
    const examePrice = document.getElementById('exame-price').value;
    const exameDuration = document.getElementById('exame-duration').value + ':00';
    
    // Formata os dados para envio
    const exameData = {
        name: exameName,
        description: exameDescription,
        price: parseFloat(examePrice),
        duration: exameDuration,
    };
    
    // Obtém o botão de salvar e o spinner
    const saveButton = document.querySelector('#addExameModal .btn-primary');
    const saveSpinner = document.getElementById('saveSpinner');
    
    // Verifica se está editando ou criando
    const isEditing = saveButton.getAttribute('data-is-editing') === 'true';
    
    // Desabilita o botão e mostra o spinner
    saveButton.disabled = true;
    saveSpinner.classList.remove('d-none');
    
    try {
        let response;
        
        if (isEditing) {
            response = await updateExam(editingExamId, exameData);
            
            // Atualiza os arrays de exames
            const index = allExams.findIndex(exam => exam.id === editingExamId);
            if (index !== -1) {
                allExams[index] = response;
            }
            
            const filteredIndex = filteredExams.findIndex(exam => exam.id === editingExamId);
            if (filteredIndex !== -1) {
                filteredExams[filteredIndex] = response;
            }
            
            // Reseta o estado de edição
            saveButton.setAttribute('data-is-editing', 'false');
            document.getElementById('addExameModalLabel').textContent = 'Adicionar Exame';
            editingExamId = null;
            
            showNotification('Exame atualizado com sucesso!', 'success');
        } else {
            response = await createExam(exameData);
            
            // Adiciona o novo exame aos arrays
            allExams.push(response);
            filteredExams.push(response);
            
            // Atualiza contador do dashboard
            document.getElementById('dash-total-exams').textContent = allExams.length;
            
            showNotification('Exame adicionado com sucesso!', 'success');
        }
        
        if (response) {
            // Limpa o formulário
            form.reset();
            
            // Fecha o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addExameModal'));
            modal.hide();
            
            // Recarrega os exames
            renderExamCards();
            
            // Exibe a seção de exames caso esteja oculta
            document.getElementById('exames-row').classList.remove('d-none');
            document.getElementById('noExamsFound').classList.add('d-none');
        } else {
            throw new Error('Falha na operação');
        }
    } catch (error) {
        console.error('Erro ao salvar exame:', error);
        showNotification('Erro ao salvar exame. Tente novamente.', 'error');
    } finally {
        // Reabilita o botão e esconde o spinner
        saveButton.disabled = false;
        saveSpinner.classList.add('d-none');
    }
}

/**
 * Redireciona para a página de agendamento
 * @param {number} id - ID do exame a ser agendado
 */
function agendarExame(id) {
    window.location.href = `./exames/agendar.html?examId=${id}`;
}

// Função para rodar quando a página carregar
window.onload = async function () {
    // Inicializa o módulo de formulários
    setupFormValidation('add-exame-form');
    
    // Carrega as estatísticas do dashboard
    await loadDashboardStats();
    
    // Carrega os exames
    await loadExames();
    
    // Adiciona evento de pesquisa
    document.getElementById('search-exams').addEventListener('input', searchExams);
};