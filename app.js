// Aplicação de Gestão de Equipamentos
class EquipamentosApp {
    constructor() {
        this.data = null;
        this.equipamentos = [];
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            busca: ''
        };
        this.equipamentoSelecionado = null;
        this.viewMode = 'grid'; // 'grid' ou 'list'
        this.modals = {};
        
        this.init();
    }
    
    async init() {
        // Inicializar modais
        this.initModals();
        
        // Inicializar eventos
        this.initEvents();
        
        // Carregar dados
        await this.carregarDados();
        
        // Renderizar equipamentos
        this.renderizarEquipamentos();
        
        // Atualizar estatísticas
        this.atualizarEstatisticas();
        
        // Atualizar status da sincronização
        this.atualizarStatusSincronizacao(true);
    }
    
    initModals() {
        // Obter referências aos modais
        this.modals.equipamento = document.getElementById('equipamento-modal');
        this.modals.pendencia = document.getElementById('pendencia-modal');
        this.modals.detalhes = document.getElementById('detalhes-modal');
        
        // Fechar modais ao clicar no X
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.fecharTodosModais();
            });
        });
        
        // Fechar modais ao clicar fora
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.fecharTodosModais();
            }
        });
    }
    
    initEvents() {
        // Filtros
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filtros.status = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('pendencia-filter').addEventListener('change', (e) => {
            this.filtros.pendencia = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('search').addEventListener('input', (e) => {
            this.filtros.busca = e.target.value.toLowerCase();
            this.renderizarEquipamentos();
        });
        
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetarFiltros();
        });
        
        // Botões de ação
        document.getElementById('add-equipamento').addEventListener('click', () => {
            this.abrirModalEquipamento();
        });
        
        document.getElementById('add-pendencia').addEventListener('click', () => {
            this.abrirModalPendencia();
        });
        
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportarDados();
        });
        
        document.getElementById('manual-sync').addEventListener('click', () => {
            this.sincronizarDados();
        });
        
        // Controles de visualização
        document.getElementById('view-list').addEventListener('click', () => {
            this.setViewMode('list');
        });
        
        document.getElementById('view-grid').addEventListener('click', () => {
            this.setViewMode('grid');
        });
        
        // Formulários
        document.getElementById('equipamento-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEquipamento();
        });
        
        document.getElementById('pendencia-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarPendencia();
        });
        
        // Botão de editar no modal de detalhes
        document.getElementById('editar-equipamento').addEventListener('click', () => {
            this.fecharModal(this.modals.detalhes);
            this.abrirModalEquipamento(this.equipamentoSelecionado);
        });
        
        // Botão de nova pendência no modal de detalhes
        document.getElementById('nova-pendencia-detalhes').addEventListener('click', () => {
            this.fecharModal(this.modals.detalhes);
            this.abrirModalPendencia(this.equipamentoSelecionado);
        });
    }
    
    async carregarDados() {
        try {
            // Mostrar estado de carregamento
            this.mostrarLoading(true);
            
            // Tentar carregar dados do JSONBin.io
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}/latest`, {
                headers: JSONBIN_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do servidor');
            }
            
            const result = await response.json();
            
            if (result.record && result.record.equipamentos) {
                this.data = result.record;
                this.equipamentos = this.data.equipamentos;
                console.log('Dados carregados do JSONBin.io:', this.equipamentos.length, 'equipamentos');
            } else {
                // Usar dados iniciais se o bin estiver vazio
                this.data = INITIAL_DATA;
                this.equipamentos = INITIAL_DATA.equipamentos;
                console.log('Usando dados iniciais');
            }
            
            this.atualizarStatusSincronizacao(true);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            
            // Usar dados iniciais em caso de erro
            this.data = INITIAL_DATA;
            this.equipamentos = INITIAL_DATA.equipamentos;
            console.log('Usando dados iniciais devido a erro de conexão');
            
            this.atualizarStatusSincronizacao(false);
            
            // Mostrar mensagem de erro
            this.mostrarMensagem('Erro ao conectar com o servidor. Usando dados locais.', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    async salvarDados() {
        try {
            // Garantir que os próximos IDs estejam atualizados
            this.atualizarNextIds();
            
            // Atualizar dados no JSONBin.io
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: JSONBIN_CONFIG.headers,
                body: JSON.stringify(this.data)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao salvar dados');
            }
            
            console.log('Dados salvos com sucesso no JSONBin.io');
            this.atualizarStatusSincronizacao(true);
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.atualizarStatusSincronizacao(false);
            
            // Mostrar mensagem de erro
            this.mostrarMensagem('Erro ao salvar dados no servidor. Alterações podem ser perdidas.', 'error');
            return false;
        }
    }
    
    atualizarNextIds() {
        // Encontrar o maior ID de equipamento
        let maxEquipamentoId = 0;
        this.equipamentos.forEach(eqp => {
            if (eqp.id > maxEquipamentoId) maxEquipamentoId = eqp.id;
        });
        this.data.nextEquipamentoId = maxEquipamentoId + 1;
        
        // Encontrar o maior ID de pendência
        let maxPendenciaId = 0;
        this.equipamentos.forEach(eqp => {
            eqp.pendencias.forEach(pend => {
                if (pend.id > maxPendenciaId) maxPendenciaId = pend.id;
            });
        });
        this.data.nextPendenciaId = maxPendenciaId + 1;
    }
    
    resetarFiltros() {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('pendencia-filter').value = 'all';
        document.getElementById('search').value = '';
        
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            busca: ''
        };
        
        this.renderizarEquipamentos();
    }
    
    filtrarEquipamentos() {
        return this.equipamentos.filter(equipamento => {
            // Filtrar por status operacional
            if (this.filtros.status !== 'all' && equipamento.status !== this.filtros.status) {
                return false;
            }
            
            // Filtrar por pendência
            if (this.filtros.pendencia !== 'all') {
                const temPendenciasAtivas = equipamento.pendencias.some(p => 
                    p.status === 'aberta' || p.status === 'em-andamento'
                );
                
                if (this.filtros.pendencia === 'com-pendencia' && !temPendenciasAtivas) {
                    return false;
                }
                
                if (this.filtros.pendencia === 'sem-pendencia' && temPendenciasAtivas) {
                    return false;
                }
            }
            
            // Filtrar por busca
            if (this.filtros.busca) {
                const busca = this.filtros.busca.toLowerCase();
                const nomeMatch = equipamento.nome.toLowerCase().includes(busca);
                const codigoMatch = equipamento.codigo.toLowerCase().includes(busca);
                const descricaoMatch = equipamento.descricao.toLowerCase().includes(busca);
                
                if (!nomeMatch && !codigoMatch && !descricaoMatch) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    renderizarEquipamentos() {
        const container = document.getElementById('equipamentos-container');
        const equipamentosFiltrados = this.filtrarEquipamentos();
        
        if (equipamentosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum equipamento encontrado</h3>
                    <p>Tente ajustar os filtros de busca</p>
                </div>
            `;
            return;
        }
        
        // Aplicar classe de modo de visualização
        container.className = `equipamentos-container ${this.viewMode}-view`;
        
        // Gerar HTML dos equipamentos
        container.innerHTML = equipamentosFiltrados.map(equipamento => {
            const temPendenciasAtivas = equipamento.pendencias.some(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            );
            
            let classesCard = 'equipamento-card';
            if (equipamento.status === 'nao-apto') classesCard += ' nao-apto';
            if (temPendenciasAtivas) classesCard += ' com-pendencia';
            
            // Formatar data de inspeção
            const dataInspecao = equipamento.ultimaInspecao ? 
                new Date(equipamento.ultimaInspecao).toLocaleDateString('pt-BR') : 
                'Não registrada';
            
            // Contar pendencias por status
            const pendenciasAbertas = equipamento.pendencias.filter(p => p.status === 'aberta').length;
            const pendenciasAndamento = equipamento.pendencias.filter(p => p.status === 'em-andamento').length;
            const pendenciasResolvidas = equipamento.pendencias.filter(p => p.status === 'resolvida').length;
            
            return `
                <div class="${classesCard}" data-id="${equipamento.id}">
                    <div class="equipamento-header">
                        <div class="equipamento-info">
                            <h4>${equipamento.nome}</h4>
                            <div class="equipamento-codigo">${equipamento.codigo}</div>
                        </div>
                        <div class="status-chip ${equipamento.status}">
                            ${APP_CONFIG.statusEquipamento[equipamento.status]}
                        </div>
                    </div>
                    
                    <p class="equipamento-descricao">${equipamento.descricao}</p>
                    
                    <div class="equipamento-metadata">
                        <div><i class="fas fa-building"></i> ${APP_CONFIG.setores[equipamento.setor]}</div>
                        <div><i class="fas fa-calendar"></i> ${dataInspecao}</div>
                    </div>
                    
                    ${equipamento.pendencias.length > 0 ? `
                        <div class="equipamento-pendencias">
                            <strong>Pendências:</strong>
                            ${pendenciasAbertas > 0 ? `<span class="pendencia-badge aberta">${pendenciasAbertas} Aberta(s)</span>` : ''}
                            ${pendenciasAndamento > 0 ? `<span class="pendencia-badge em-andamento">${pendenciasAndamento} Em Andamento</span>` : ''}
                            ${pendenciasResolvidas > 0 ? `<span class="pendencia-badge resolvida">${pendenciasResolvidas} Resolvida(s)</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="equipamento-actions">
                        <button class="action-btn secondary btn-detalhes" data-id="${equipamento.id}">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                        <button class="action-btn primary btn-pendencia" data-id="${equipamento.id}">
                            <i class="fas fa-plus-circle"></i> Pendência
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos aos botões dos equipamentos
        container.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.btn-detalhes').dataset.id);
                this.verDetalhesEquipamento(id);
            });
        });
        
        container.querySelectorAll('.btn-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.btn-pendencia').dataset.id);
                this.abrirModalPendencia(id);
            });
        });
    }
    
    atualizarEstatisticas() {
        const totalEquipamentos = this.equipamentos.length;
        const aptosOperar = this.equipamentos.filter(e => e.status === 'apto').length;
        const naoAptos = this.equipamentos.filter(e => e.status === 'nao-apto').length;
        
        // Contar pendencias ativas (abertas ou em andamento)
        let totalPendenciasAtivas = 0;
        this.equipamentos.forEach(equipamento => {
            totalPendenciasAtivas += equipamento.pendencias.filter(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            ).length;
        });
        
        document.getElementById('total-equipamentos').textContent = totalEquipamentos;
        document.getElementById('aptos-operar').textContent = aptosOperar;
        document.getElementById('nao-aptos').textContent = naoAptos;
        document.getElementById('total-pendencias').textContent = totalPendenciasAtivas;
    }
    
    atualizarStatusSincronizacao(conectado) {
        const statusIndicator = document.getElementById('sync-status');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (conectado) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Conectado';
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Desconectado';
        }
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Atualizar botões de visualização
        document.getElementById('view-list').classList.toggle('active', mode === 'list');
        document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
        
        // Re-renderizar equipamentos
        this.renderizarEquipamentos();
    }
    
    abrirModalEquipamento(equipamentoId = null) {
        const modal = this.modals.equipamento;
        const form = document.getElementById('equipamento-form');
        const titulo = document.getElementById('modal-title');
        
        if (equipamentoId) {
            // Modo edição
            const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
            if (!equipamento) return;
            
            titulo.textContent = 'Editar Equipamento';
            
            // Preencher formulário
            document.getElementById('equipamento-codigo').value = equipamento.codigo;
            document.getElementById('equipamento-nome').value = equipamento.nome;
            document.getElementById('equipamento-descricao').value = equipamento.descricao;
            document.getElementById('equipamento-setor').value = equipamento.setor;
            document.getElementById('equipamento-status').value = equipamento.status;
            document.getElementById('equipamento-ultima-inspecao').value = equipamento.ultimaInspecao || '';
            
            // Armazenar ID para referência
            form.dataset.editId = equipamentoId;
        } else {
            // Modo criação
            titulo.textContent = 'Novo Equipamento';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.classList.add('active');
    }
    
    abrirModalPendencia(equipamentoId = null) {
        const modal = this.modals.pendencia;
        const form = document.getElementById('pendencia-form');
        const titulo = document.getElementById('pendencia-modal-title');
        
        // Se equipamentoId não foi fornecido, usar o selecionado
        if (!equipamentoId && this.equipamentoSelecionado) {
            equipamentoId = this.equipamentoSelecionado.id;
        }
        
        if (!equipamentoId) {
            this.mostrarMensagem('Selecione um equipamento primeiro', 'error');
            return;
        }
        
        titulo.textContent = 'Nova Pendência';
        form.reset();
        
        // Definir data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('pendencia-data').value = hoje;
        
        // Armazenar ID do equipamento
        document.getElementById('pendencia-equipamento-id').value = equipamentoId;
        delete form.dataset.editId;
        
        modal.classList.add('active');
    }
    
    async salvarEquipamento() {
        const form = document.getElementById('equipamento-form');
        const isEdit = form.dataset.editId;
        
        const equipamento = {
            codigo: document.getElementById('equipamento-codigo').value.trim(),
            nome: document.getElementById('equipamento-nome').value.trim(),
            descricao: document.getElementById('equipamento-descricao').value.trim(),
            setor: document.getElementById('equipamento-setor').value,
            status: document.getElementById('equipamento-status').value,
            ultimaInspecao: document.getElementById('equipamento-ultima-inspecao').value || null,
            pendencias: []
        };
        
        // Validação básica
        if (!equipamento.codigo || !equipamento.nome) {
            this.mostrarMensagem('Código e nome são obrigatórios', 'error');
            return;
        }
        
        if (isEdit) {
            // Atualizar equipamento existente
            const id = parseInt(isEdit);
            const index = this.equipamentos.findIndex(e => e.id === id);
            
            if (index !== -1) {
                // Manter o ID e pendencias existentes
                equipamento.id = id;
                equipamento.pendencias = this.equipamentos[index].pendencias;
                equipamento.dataCriacao = this.equipamentos[index].dataCriacao;
                
                this.equipamentos[index] = equipamento;
                
                this.mostrarMensagem('Equipamento atualizado com sucesso', 'success');
            }
        } else {
            // Criar novo equipamento
            equipamento.id = this.data.nextEquipamentoId++;
            equipamento.dataCriacao = new Date().toISOString().split('T')[0];
            
            this.equipamentos.push(equipamento);
            
            this.mostrarMensagem('Equipamento criado com sucesso', 'success');
        }
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Fechar modal e atualizar interface
        this.fecharModal(this.modals.equipamento);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        // Habilitar/desabilitar botão de pendência
        this.atualizarEstadoBotaoPendencia();
    }
    
    async salvarPendencia() {
        const form = document.getElementById('pendencia-form');
        const equipamentoId = parseInt(document.getElementById('pendencia-equipamento-id').value);
        const isEdit = form.dataset.editId;
        
        const pendencia = {
            titulo: document.getElementById('pendencia-titulo').value.trim(),
            descricao: document.getElementById('pendencia-descricao').value.trim(),
            responsavel: document.getElementById('pendencia-responsavel').value.trim(),
            prioridade: document.getElementById('pendencia-prioridade').value,
            data: document.getElementById('pendencia-data').value || new Date().toISOString().split('T')[0],
            status: document.getElementById('pendencia-status').value
        };
        
        // Validação básica
        if (!pendencia.titulo || !pendencia.descricao || !pendencia.responsavel) {
            this.mostrarMensagem('Título, descrição e responsável são obrigatórios', 'error');
            return;
        }
        
        // Encontrar equipamento
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === equipamentoId);
        if (equipamentoIndex === -1) {
            this.mostrarMensagem('Equipamento não encontrado', 'error');
            return;
        }
        
        if (isEdit) {
            // Atualizar pendência existente
            const pendenciaId = parseInt(isEdit);
            const pendenciaIndex = this.equipamentos[equipamentoIndex].pendencias.findIndex(p => p.id === pendenciaId);
            
            if (pendenciaIndex !== -1) {
                pendencia.id = pendenciaId;
                this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex] = pendencia;
                
                this.mostrarMensagem('Pendência atualizada com sucesso', 'success');
            }
        } else {
            // Criar nova pendência
            pendencia.id = this.data.nextPendenciaId++;
            this.equipamentos[equipamentoIndex].pendencias.push(pendencia);
            
            this.mostrarMensagem('Pendência registrada com sucesso', 'success');
        }
        
        // Atualizar status do equipamento se necessário
        // (Se uma pendência crítica for aberta, o equipamento pode se tornar não apto)
        if (pendencia.status === 'aberta' && pendencia.prioridade === 'critica') {
            this.equipamentos[equipamentoIndex].status = 'nao-apto';
        }
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Fechar modal e atualizar interface
        this.fecharModal(this.modals.pendencia);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
    }
    
    verDetalhesEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        
        this.equipamentoSelecionado = equipamento;
        
        // Preencher informações do equipamento
        document.getElementById('detalhes-titulo').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `Código: ${equipamento.codigo}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        document.getElementById('detalhes-setor').textContent = APP_CONFIG.setores[equipamento.setor];
        
        // Status
        const statusChip = document.getElementById('detalhes-status');
        statusChip.textContent = APP_CONFIG.statusEquipamento[equipamento.status];
        statusChip.className = `status-chip ${equipamento.status}`;
        
        // Data de inspeção
        const dataInspecao = equipamento.ultimaInspecao ? 
            new Date(equipamento.ultimaInspecao).toLocaleDateString('pt-BR') : 
            'Não registrada';
        document.getElementById('detalhes-inspecao').textContent = dataInspecao;
        
        // Renderizar pendencias
        this.renderizarPendenciasDetalhes(equipamento.pendencias);
        
        // Abrir modal
        this.modals.detalhes.classList.add('active');
    }
    
    renderizarPendenciasDetalhes(pendencias) {
        const container = document.getElementById('detalhes-pendencias');
        
        if (pendencias.length === 0) {
            container.innerHTML = `
                <div class="no-pendencias">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma pendência registrada para este equipamento.</p>
                </div>
            `;
            return;
        }
        
        // Ordenar pendencias: abertas primeiro, depois por data (mais recente primeiro)
        const pendenciasOrdenadas = [...pendencias].sort((a, b) => {
            // Primeiro por status (abertas primeiro)
            const statusOrder = { 'aberta': 0, 'em-andamento': 1, 'resolvida': 2, 'cancelada': 3 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            
            // Depois por data (mais recente primeiro)
            return new Date(b.data) - new Date(a.data);
        });
        
        container.innerHTML = pendenciasOrdenadas.map(pendencia => {
            const dataFormatada = new Date(pendencia.data).toLocaleDateString('pt-BR');
            
            return `
                <div class="pendencia-item ${pendencia.status}">
                    <div class="pendencia-header">
                        <div>
                            <div class="pendencia-titulo">${pendencia.titulo}</div>
                            <div class="pendencia-data">
                                <i class="far fa-calendar"></i> ${dataFormatada} 
                                | Prioridade: ${APP_CONFIG.prioridades[pendencia.prioridade]}
                            </div>
                        </div>
                        <div class="pendencia-badge ${pendencia.status}">
                            ${APP_CONFIG.statusPendencia[pendencia.status]}
                        </div>
                    </div>
                    <p class="pendencia-descricao">${pendencia.descricao}</p>
                    <div class="pendencia-footer">
                        <div class="pendencia-responsavel">
                            <i class="fas fa-user"></i> Responsável: ${pendencia.responsavel}
                        </div>
                        <div class="pendencia-acoes">
                            <button class="btn-editar-pendencia" data-id="${pendencia.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-excluir-pendencia" data-id="${pendencia.id}">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos aos botões de pendências
        container.querySelectorAll('.btn-editar-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-editar-pendencia').dataset.id);
                this.editarPendencia(pendenciaId);
            });
        });
        
        container.querySelectorAll('.btn-excluir-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-excluir-pendencia').dataset.id);
                this.excluirPendencia(pendenciaId);
            });
        });
    }
    
    editarPendencia(pendenciaId) {
        if (!this.equipamentoSelecionado) return;
        
        const pendencia = this.equipamentoSelecionado.pendencias.find(p => p.id === pendenciaId);
        if (!pendencia) return;
        
        const modal = this.modals.pendencia;
        const form = document.getElementById('pendencia-form');
        const titulo = document.getElementById('pendencia-modal-title');
        
        titulo.textContent = 'Editar Pendência';
        
        // Preencher formulário
        document.getElementById('pendencia-titulo').value = pendencia.titulo;
        document.getElementById('pendencia-descricao').value = pendencia.descricao;
        document.getElementById('pendencia-responsavel').value = pendencia.responsavel;
        document.getElementById('pendencia-prioridade').value = pendencia.prioridade;
        document.getElementById('pendencia-data').value = pendencia.data;
        document.getElementById('pendencia-status').value = pendencia.status;
        
        // Armazenar IDs
        document.getElementById('pendencia-equipamento-id').value = this.equipamentoSelecionado.id;
        document.getElementById('pendencia-id').value = pendenciaId;
        form.dataset.editId = pendenciaId;
        
        // Fechar modal atual e abrir modal de pendência
        this.fecharModal(this.modals.detalhes);
        modal.classList.add('active');
    }
    
    async excluirPendencia(pendenciaId) {
        if (!this.equipamentoSelecionado) return;
        
        if (!confirm('Tem certeza que deseja excluir esta pendência?')) {
            return;
        }
        
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === this.equipamentoSelecionado.id);
        if (equipamentoIndex === -1) return;
        
        // Remover pendência
        this.equipamentos[equipamentoIndex].pendencias = this.equipamentos[equipamentoIndex].pendencias.filter(p => p.id !== pendenciaId);
        
        // Atualizar equipamento selecionado
        this.equipamentoSelecionado = this.equipamentos[equipamentoIndex];
        
        // Salvar dados
        await this.salvarDados();
        
        // Atualizar interface
        this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        this.mostrarMensagem('Pendência excluída com sucesso', 'success');
    }
    
    fecharModal(modal) {
        modal.classList.remove('active');
    }
    
    fecharTodosModais() {
        Object.values(this.modals).forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    atualizarEstadoBotaoPendencia() {
        const btnPendencia = document.getElementById('add-pendencia');
        btnPendencia.disabled = this.equipamentos.length === 0;
    }
    
    async sincronizarDados() {
        this.mostrarMensagem('Sincronizando dados...', 'info');
        await this.carregarDados();
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        this.mostrarMensagem('Dados sincronizados com sucesso', 'success');
    }
    
    exportarDados() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `equipamentos-usina-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.mostrarMensagem('Dados exportados com sucesso', 'success');
    }
    
    mostrarLoading(mostrar) {
        const container = document.getElementById('equipamentos-container');
        if (mostrar) {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-cog fa-spin"></i>
                    <p>Carregando equipamentos...</p>
                </div>
            `;
        }
    }
    
    mostrarMensagem(texto, tipo) {
        // Remover mensagem anterior se existir
        const mensagemAnterior = document.querySelector('.mensagem-flutuante');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
        // Criar nova mensagem
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-flutuante ${tipo}`;
        mensagem.innerHTML = `
            <div class="mensagem-conteudo">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${texto}</span>
            </div>
        `;
        
        // Adicionar ao corpo
        document.body.appendChild(mensagem);
        
        // Mostrar
        setTimeout(() => {
            mensagem.classList.add('show');
        }, 10);
        
        // Remover após 5 segundos
        setTimeout(() => {
            mensagem.classList.remove('show');
            setTimeout(() => {
                if (mensagem.parentNode) {
                    mensagem.remove();
                }
            }, 300);
        }, 5000);
        
        // Adicionar estilos para a mensagem se não existirem
        if (!document.querySelector('#mensagem-estilos')) {
            const estilos = document.createElement('style');
            estilos.id = 'mensagem-estilos';
            estilos.textContent = `
                .mensagem-flutuante {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    transform: translateX(100%);
                    opacity: 0;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    max-width: 400px;
                    border-left: 4px solid #3498db;
                }
                .mensagem-flutuante.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                .mensagem-flutuante.success {
                    border-left-color: #2ecc71;
                }
                .mensagem-flutuante.error {
                    border-left-color: #e74c3c;
                }
                .mensagem-flutuante.info {
                    border-left-color: #3498db;
                }
                .mensagem-conteudo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .mensagem-conteudo i {
                    font-size: 20px;
                }
                .mensagem-flutuante.success .mensagem-conteudo i {
                    color: #2ecc71;
                }
                .mensagem-flutuante.error .mensagem-conteudo i {
                    color: #e74c3c;
                }
                .mensagem-flutuante.info .mensagem-conteudo i {
                    color: #3498db;
                }
            `;
            document.head.appendChild(estilos);
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const app = new EquipamentosApp();
    window.app = app; // Para depuração
});
