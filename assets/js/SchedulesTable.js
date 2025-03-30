/**
 * Componente para exibir tabelas de agendamentos
 */

/**
 * Popula uma tabela de agendamentos com dados da API
 * @param {Array} schedules_ids - IDs dos agendamentos a serem exibidos
 * @param {Object} options - Opções de configuração
 */
async function populateSchedulesTable(schedules_ids, options = {}) {
    // Opções padrão
    const defaultOptions = {
        tableId: "schedules-table-body",
        tableContainerId: "schedules-table-container",
        showMedic: true,             // Mostrar coluna de médico
        showClient: true,            // Mostrar coluna de cliente
        showExam: true,              // Mostrar coluna de exame
        statusIcons: true,           // Usar ícones para status
        pageUrl: "../../exames/agendamento.html" // URL base para visualização
    };
    
    // Mescla opções padrão com as fornecidas
    const config = { ...defaultOptions, ...options };
    
    const tableBody = document.getElementById(config.tableId);
    if (!tableBody) {
        console.error(`Tabela com ID ${config.tableId} não encontrada.`);
        return;
    }
    
    // Adiciona atributos de acessibilidade à tabela-pai, se existir
    const tableContainer = document.getElementById(config.tableContainerId);
    if (tableContainer) {
        const table = tableContainer.querySelector('table');
        if (table) {
            table.setAttribute('role', 'grid');
            table.setAttribute('aria-label', 'Lista de agendamentos');
            
            // Adiciona indicador de região de atualização em tempo real
            const caption = table.querySelector('caption') || document.createElement('caption');
            if (!table.querySelector('caption')) {
                caption.className = 'sr-only';
                caption.textContent = 'Lista de agendamentos médicos';
                table.prepend(caption);
            }
            
            // Corrige cabeçalhos para acessibilidade
            const headerRow = table.querySelector('thead tr');
            if (headerRow) {
                const headers = headerRow.querySelectorAll('th');
                headers.forEach(header => {
                    header.setAttribute('scope', 'col');
                    header.setAttribute('role', 'columnheader');
                });
            }
        }
    }
    
    // Limpa a tabela
    tableBody.innerHTML = "";
    
    // Adiciona indicador de carregamento
    if (!schedules_ids || schedules_ids.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="6" class="text-center" role="status" aria-live="polite">
                <p class="my-3">Nenhum agendamento encontrado.</p>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Adiciona indicador de status de carregamento
    const loadingRow = document.createElement("tr");
    loadingRow.setAttribute('aria-live', 'polite');
    loadingRow.setAttribute('role', 'status');
    loadingRow.innerHTML = `
        <td colspan="6" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando agendamentos...</span>
            </div>
            <p>Carregando agendamentos...</p>
        </td>
    `;
    tableBody.appendChild(loadingRow);
    
    // Carrega dados reais
    const schedules = await Promise.all(
        schedules_ids.map(id => showExamSchedule(id))
    );
    
    // Limpa a tabela novamente para remover o indicador de carregamento
    tableBody.innerHTML = "";
    
    // Se não houver agendamentos válidos após carregar
    const validSchedules = schedules.filter(schedule => schedule);
    if (validSchedules.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="6" class="text-center" role="status" aria-live="polite">
                <p class="my-3">Nenhum agendamento encontrado.</p>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Atualiza o status para anunciar para tecnologias assistivas
    if (tableContainer) {
        const statusAnnouncer = document.createElement('div');
        statusAnnouncer.className = 'visually-hidden';
        statusAnnouncer.setAttribute('aria-live', 'polite');
        statusAnnouncer.textContent = `${validSchedules.length} agendamentos carregados.`;
        tableContainer.appendChild(statusAnnouncer);
        
        // Remove o anúncio após a leitura
        setTimeout(() => {
            tableContainer.removeChild(statusAnnouncer);
        }, 3000);
    }
    
    // Preenche com os dados reais
    validSchedules.forEach(schedule => {
        const row = document.createElement("tr");
        row.setAttribute('role', 'row');
        
        // Define a classe de acordo com o status
        if (schedule.status === "cancelado") {
            row.classList.add("table-danger", "text-muted");
        } else if (schedule.status === "concluido") {
            row.classList.add("table-success");
        } else if (schedule.times_rescheduled > 0) {
            row.classList.add("table-warning");
        }
        
        // Prepara o status com ícone se necessário
        let statusHtml = '';
        if (config.statusIcons) {
            const statusIcons = {
                'agendado': '<span class="material-icons text-primary" aria-hidden="true">event_available</span>',
                'cancelado': '<span class="material-icons text-danger" aria-hidden="true">event_busy</span>',
                'concluido': '<span class="material-icons text-success" aria-hidden="true">event_note</span>',
                'reagendado': '<span class="material-icons text-warning" aria-hidden="true">update</span>'
            };
            
            const icon = statusIcons[schedule.status] || statusIcons['agendado'];
            statusHtml = `<div class="d-flex align-items-center">
                ${icon}
                <span class="ms-2">${schedule.status}</span>
            </div>`;
        } else {
            statusHtml = schedule.status;
        }
        
        // Constrói a linha da tabela com acessibilidade melhorada
        row.innerHTML = `
            <td role="gridcell">${schedule.date_time_scheduled}</td>
            ${config.showExam ? `<td role="gridcell">${schedule.exam.name}</td>` : ''}
            ${config.showMedic ? `<td role="gridcell">${schedule.medic.name}</td>` : ''}
            ${config.showClient ? `<td role="gridcell">${schedule.client.name}</td>` : ''}
            <td role="gridcell">${statusHtml}</td>
            <td role="gridcell">
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                            type="button" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                            aria-label="Ações para o agendamento de ${schedule.client.name}">
                        Ações
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="${config.pageUrl}?id=${schedule.id}">Ver</a></li>
                        ${schedule.result ? 
                            `<li><a class="dropdown-item" href="../../exames/result.html?id=${schedule.result.id}">Ver resultado</a></li>` : 
                            ''}
                        <li><a class="dropdown-item text-danger" href="#" 
                               onclick="confirmDeleteSchedule(${schedule.id})"
                               aria-label="Excluir agendamento de ${schedule.client.name}">Excluir</a></li>
                    </ul>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Confirma a exclusão de um agendamento
 * @param {number} id - ID do agendamento a ser excluído
 */
function confirmDeleteSchedule(id) {
    showConfirmDialog(
        'Excluir Agendamento',
        'Você tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.',
        async () => {
            try {
                const result = await deleteExamSchedule(id);
                if (result) {
                    showNotification('Agendamento excluído com sucesso!', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showNotification('Erro ao excluir agendamento. Tente novamente.', 'error');
                }
            } catch (error) {
                console.error('Erro ao excluir agendamento:', error);
                showNotification('Erro ao excluir agendamento. Tente novamente mais tarde.', 'error');
            }
        }
    );
}