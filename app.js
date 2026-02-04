// ===========================================
// SISTEMA DE GESTÃO DE EQUIPAMENTOS - APP PRINCIPAL
// ===========================================

class EquipamentosApp {
    constructor() {
        this.data = null;
        this.equipamentos = [];
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: ''
        };
        this.equipamentoSelecionado = null;
        this.viewMode = 'grid';
        this.modals = {};
        this.usuarioAtual = null;
        this.nivelUsuario = null;
        
        this.init();
    }
    
    async init() {
        try {
            // 1. Verificar sessão
            if (!this.verificarSessao()) {
                return;
            }
            
            // 2. Carregar informações do usuário
            this.carregarUsuario();
            
            // 3. Registrar login no sistema
            this.registrarLogin();
            
            // 4. Configurar interface baseada nas permissões
            this.configurarInterfacePorPermissao();
            
            // 5. Inicializar componentes
            this.initModals();
            this.initEvents();
            
            // 6. Carregar dados
            await this.carregarDados();
            
            // 7. Inicializar interface
            this.renderizarEquipamentos();
            this.atualizarEstatisticas();
            this.atualizarStatusSincronizacao(true);
            
            // 8. Configurar atualizações automáticas
            this.configurarAtualizacoes();
            
            console.log('Aplicação inicializada com sucesso');
            
            // 9. Adicionar indicador de nível
            this.adicionarIndicadorNivel();
            
        } catch (error) {
            console.error('Erro na inicialização da aplicação:', error);
            this.mostrarMensagem('Erro ao inicializar aplicação. Recarregue a página.', 'error');
        }
    }
    
    // ================== SISTEMA DE SESSÃO E PERMISSÕES ==================
    
    verificarSessao() {
        const sessao = localStorage.getItem('gestao_equipamentos_sessao');
        
        if (!sessao) {
            window.location.href = 'login.html';
            return false;
        }
        
        try {
            const sessaoData = JSON.parse(sessao);
            const agora = new Date().getTime();
            
            // Verificar expiração
            if (agora > sessaoData.expira) {
                localStorage.removeItem('gestao_equipamentos_sessao');
                localStorage.removeItem('gestao_equipamentos_usuario');
                localStorage.removeItem('gestao_equipamentos_nivel');
                window.location.href = 'login.html?expired=true';
                return false;
            }
            
            // Renovar sessão (extender por mais 8 horas)
            sessaoData.expira = agora + (8 * 60 * 60 * 1000);
            localStorage.setItem('gestao_equipamentos_sessao', JSON.stringify(sessaoData));
            
            return true;
        } catch (e) {
            console.error('Erro ao verificar sessão:', e);
            localStorage.removeItem('gestao_equipamentos_sessao');
            localStorage.removeItem('gestao_equipamentos_usuario');
            localStorage.removeItem('gestao_equipamentos_nivel');
            window.location.href = 'login.html';
            return false;
        }
    }
    
    carregarUsuario() {
        this.usuarioAtual = localStorage.getItem('gestao_equipamentos_usuario');
        this.nivelUsuario = localStorage.getItem('gestao_equipamentos_nivel');
        
        // Atualizar display do usuário
        this.atualizarDisplayUsuario();
    }
    
    registrarLogin() {
        // Registrar atividade de login
        if (window.registrarAtividade) {
            window.registrarAtividade('LOGIN', `Usuário ${this.usuarioAtual} (${this.getNomeNivel()}) acessou o sistema`);
        }
        
        // Atualizar último acesso
        localStorage.setItem('gestao_equipamentos_ultimo_acesso', new Date().toISOString());
    }
    
    // ================== SISTEMA DE PERMISSÕES ==================
    
    verificarPermissao(permissao) {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            console.warn('Sistema de permissões não carregado');
            return false;
        }
        
        return window.PERMISSOES.verificarPermissao(this.nivelUsuario, permissao);
    }
    
    podeExecutar(acao, recurso, donoRecurso = null) {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            return false;
        }
        
        return window.PERMISSOES.podeExecutarAcao(this.nivelUsuario, acao, recurso, donoRecurso);
    }
    
    getNomeNivel() {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            return 'Usuário';
        }
        
        return window.PERMISSOES.getNomeNivel(this.nivelUsuario);
    }
    
    getCorNivel() {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            return '#95a5a6';
        }
        
        return window.PERMISSOES.getCorNivel(this.nivelUsuario);
    }
    
    getIconeNivel() {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            return 'fa-user';
        }
        
        return window.PERMISSOES.getIconeNivel(this.nivelUsuario);
    }
    
    atualizarDisplayUsuario() {
        const userElement = document.getElementById('current-user');
        if (userElement && this.usuarioAtual) {
            const nomeFormatado = this.usuarioAtual.charAt(0).toUpperCase() + this.usuarioAtual.slice(1);
            const nivelNome = this.getNomeNivel();
            userElement.innerHTML = `
                <i class="fas ${this.getIconeNivel()}"></i>
                <span>${nomeFormatado}</span>
            `;
        }
    }
    
    adicionarIndicadorNivel() {
        // Verificar se deve mostrar indicador
        if (!window.APP_CONFIG || !window.APP_CONFIG.appSettings.mostrarIndicadorNivel) {
            return;
        }
        
        const cor = this.getCorNivel();
        const nomeNivel = this.getNomeNivel();
        
        // Remover indicador anterior se existir
        const indicadorAnterior = document.querySelector('.nivel-indicator');
        if (indicadorAnterior) {
            indicadorAnterior.remove();
        }
        
        // Criar indicador
        const indicador = document.createElement('div');
        indicador.className = 'nivel-indicator no-select';
        indicador.style.cssText = `
            background: ${cor};
            color: white;
        `;
        indicador.textContent = nomeNivel;
        indicador.title = `Nível de acesso: ${nomeNivel}`;
        
        // Adicionar hover effect
        indicador.addEventListener('mouseenter', () => {
            indicador.style.opacity = '1';
        });
        
        indicador.addEventListener('mouseleave', () => {
            indicador.style.opacity = '0.9';
        });
        
        document.body.appendChild(indicador);
    }
    
    configurarInterfacePorPermissao() {
        // Botão "Novo Equipamento" - Apenas admin/engenharia
        const addEquipamentoBtn = document.getElementById('add-equipamento');
        if (addEquipamentoBtn) {
            const podeCriar = this.verificarPermissao('criar_equipamentos');
            addEquipamentoBtn.style.display = podeCriar ? 'flex' : 'none';
            addEquipamentoBtn.title = podeCriar ? 'Adicionar novo equipamento' : 'Sem permissão para criar equipamentos';
        }
        
        // Botão "Exportar Dados" - Apenas supervisor+
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            const podeExportar = this.verificarPermissao('exportar_dados');
            exportDataBtn.style.display = podeExportar ? 'flex' : 'none';
            exportDataBtn.title = podeExportar ? 'Exportar dados para Excel' : 'Sem permissão para exportar dados';
        }
        
        // Botões de sistema - Apenas admin
        const systemInfoBtn = document.getElementById('system-info');
        const exportConfigBtn = document.getElementById('export-config');
        
        if (systemInfoBtn) {
            const podeConfigurar = this.verificarPermissao('configurar_sistema');
            systemInfoBtn.style.display = podeConfigurar ? 'flex' : 'none';
            systemInfoBtn.title = podeConfigurar ? 'Informações do sistema' : 'Sem permissão para configurar sistema';
        }
        
        if (exportConfigBtn) {
            const podeConfigurar = this.verificarPermissao('configurar_sistema');
            exportConfigBtn.style.display = podeConfigurar ? 'flex' : 'none';
            exportConfigBtn.title = podeConfigurar ? 'Exportar configurações' : 'Sem permissão para exportar configurações';
        }
    }
    
    // ================== FUNÇÕES ORIGINAIS ATUALIZADAS ==================
    
    initModals() {
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
        
        document.getElementById('setor-filter').addEventListener('change', (e) => {
            this.filtros.setor = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('search').addEventListener('input', (e) => {
            this.filtros.busca = e.target.value.toLowerCase();
            this.renderizarEquipamentos();
        });
        
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetarFiltros();
        });
        
        // Botões de ação (com verificação de permissão)
        document.getElementById('add-equipamento').addEventListener('click', () => {
            if (this.verificarPermissao('criar_equipamentos')) {
                this.abrirModalEquipamento();
            } else {
                this.mostrarMensagem('Você não tem permissão para criar equipamentos', 'error');
            }
        });
        
        document.getElementById('add-pendencia').addEventListener('click', () => {
            if (this.verificarPermissao('criar_pendencias')) {
                this.abrirModalPendencia();
            } else {
                this.mostrarMensagem('Você não tem permissão para criar pendências', 'error');
            }
        });
        
        document.getElementById('export-data').addEventListener('click', () => {
            if (this.verificarPermissao('exportar_dados')) {
                this.exportarDadosExcel();
            } else {
                this.mostrarMensagem('Você não tem permissão para exportar dados', 'error');
            }
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
        
        // Botões no modal de detalhes
        document.getElementById('editar-equipamento').addEventListener('click', () => {
            if (this.equipamentoSelecionado) {
                const podeEditar = this.podeExecutar('editar', 'equipamento');
                if (podeEditar) {
                    this.fecharModal(this.modals.detalhes);
                    this.abrirModalEquipamento(this.equipamentoSelecionado.id);
                } else {
                    this.mostrarMensagem('Você não tem permissão para editar equipamentos', 'error');
                }
            }
        });
        
        document.getElementById('nova-pendencia-detalhes').addEventListener('click', () => {
            if (this.equipamentoSelecionado && this.verificarPermissao('criar_pendencias')) {
                this.fecharModal(this.modals.detalhes);
                this.abrirModalPendencia(this.equipamentoSelecionado.id);
            } else {
                this.mostrarMensagem('Selecione um equipamento e tenha permissão para criar pendências', 'error');
            }
        });
        
        // Botões de sistema
        document.getElementById('system-info').addEventListener('click', () => {
            if (window.mostrarInfoSistema) {
                window.mostrarInfoSistema();
            }
        });
        
        document.getElementById('export-config').addEventListener('click', () => {
            if (window.exportarConfiguracoes) {
                window.exportarConfiguracoes();
            }
        });
    }
    
    async carregarDados() {
        try {
            this.mostrarLoading(true);
            
            console.log('Carregando dados do JSONBin...');
            
            // Verificar se a configuração está disponível
            if (!window.JSONBIN_CONFIG || !window.JSONBIN_CONFIG.BASE_URL) {
                throw new Error('Configuração do JSONBin não encontrada');
            }
            
            const response = await fetch(`${window.JSONBIN_CONFIG.BASE_URL}/${window.JSONBIN_CONFIG.BIN_ID}/latest`, {
                headers: window.JSONBIN_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar dados do servidor: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Dados recebidos do JSONBin:', result);
            
            if (result.record && result.record.equipamentos) {
                this.data = result.record;
                this.equipamentos = this.data.equipamentos;
                
                // Atualizar status baseado nas pendências
                this.equipamentos.forEach((equipamento, index) => {
                    this.atualizarStatusEquipamentoPorPendencias(index);
                });
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('CARREGAR_DADOS', `Carregou ${this.equipamentos.length} equipamentos do servidor`);
                }
                
                console.log(`Carregados ${this.equipamentos.length} equipamentos do JSONBin`);
            } else {
                // Se não houver dados válidos, usar dados iniciais
                console.log('Usando dados iniciais');
                if (window.INITIAL_DATA) {
                    this.data = window.INITIAL_DATA;
                    this.equipamentos = window.INITIAL_DATA.equipamentos;
                    
                    // Registrar atividade
                    if (window.registrarAtividade) {
                        window.registrarAtividade('CARREGAR_DADOS', 'Usando dados iniciais do sistema');
                    }
                } else {
                    throw new Error('Dados iniciais não encontrados');
                }
            }
            
            this.atualizarStatusSincronizacao(true);
            
            // Atualizar última sincronização
            localStorage.setItem('gestao_equipamentos_ultima_sinc', new Date().toISOString());
            
            // Atualizar estado do botão de pendência
            this.atualizarEstadoBotaoPendencia();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            
            // Fallback para dados iniciais
            if (window.INITIAL_DATA) {
                this.data = window.INITIAL_DATA;
                this.equipamentos = window.INITIAL_DATA.equipamentos;
                
                this.atualizarStatusSincronizacao(false);
                this.mostrarMensagem('Erro ao conectar com o servidor. Usando dados locais.', 'error');
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('ERRO_CARREGAR', `Erro ao carregar dados: ${error.message}`);
                }
            } else {
                throw error; // Relançar o erro se não houver dados iniciais
            }
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    async salvarDados() {
        try {
            this.atualizarNextIds();
            
            const response = await fetch(`${window.JSONBIN_CONFIG.BASE_URL}/${window.JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: window.JSONBIN_CONFIG.headers,
                body: JSON.stringify(this.data)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao salvar dados');
            }
            
            this.atualizarStatusSincronizacao(true);
            
            // Atualizar última sincronização
            localStorage.setItem('gestao_equipamentos_ultima_sinc', new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.atualizarStatusSincronizacao(false);
            
            this.mostrarMensagem('Erro ao salvar dados no servidor. Alterações podem ser perdidas.', 'error');
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('ERRO_SALVAR', `Erro ao salvar dados: ${error.message}`);
            }
            
            return false;
        }
    }
    
    atualizarNextIds() {
        if (!this.data) {
            this.data = {};
        }
        
        let maxEquipamentoId = 0;
        this.equipamentos.forEach(eqp => {
            if (eqp.id > maxEquipamentoId) maxEquipamentoId = eqp.id;
        });
        this.data.nextEquipamentoId = maxEquipamentoId + 1;
        
        let maxPendenciaId = 0;
        this.equipamentos.forEach(eqp => {
            if (eqp.pendencias) {
                eqp.pendencias.forEach(pend => {
                    if (pend.id > maxPendenciaId) maxPendenciaId = pend.id;
                });
            }
        });
        this.data.nextPendenciaId = maxPendenciaId + 1;
    }
    
    resetarFiltros() {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('pendencia-filter').value = 'all';
        document.getElementById('setor-filter').value = 'all';
        document.getElementById('search').value = '';
        
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: ''
        };
        
        this.renderizarEquipamentos();
    }
    
    filtrarEquipamentos() {
        return this.equipamentos.filter(equipamento => {
            // Filtrar por status
            if (this.filtros.status !== 'all' && equipamento.status !== this.filtros.status) {
                return false;
            }
            
            // Filtrar por pendência
            if (this.filtros.pendencia !== 'all') {
                const temPendenciasAtivas = equipamento.pendencias && equipamento.pendencias.some(p => 
                    p.status === 'aberta' || p.status === 'em-andamento'
                );
                
                const temPendenciasCriticas = equipamento.pendencias && equipamento.pendencias.some(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                );
                
                if (this.filtros.pendencia === 'com-pendencia' && !temPendenciasAtivas) {
                    return false;
                }
                
                if (this.filtros.pendencia === 'sem-pendencia' && temPendenciasAtivas) {
                    return false;
                }
                
                if (this.filtros.pendencia === 'com-criticas' && !temPendenciasCriticas) {
                    return false;
                }
            }
            
            // Filtrar por setor
            if (this.filtros.setor !== 'all' && equipamento.setor !== this.filtros.setor) {
                return false;
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
        
        // Atualizar contador
        const totalElement = document.getElementById('total-filtrado');
        if (totalElement) {
            totalElement.textContent = `(${equipamentosFiltrados.length})`;
        }
        
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
        
        container.className = `equipamentos-container ${this.viewMode}-view`;
        
        container.innerHTML = equipamentosFiltrados.map(equipamento => {
            const temPendenciasAtivas = equipamento.pendencias && equipamento.pendencias.some(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            );
            
            const temPendenciasCriticasAbertas = equipamento.pendencias && equipamento.pendencias.some(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            );
            
            let classesCard = 'equipamento-card';
            if (equipamento.status === 'nao-apto') classesCard += ' nao-apto';
            if (temPendenciasAtivas) classesCard += ' com-pendencia';
            if (temPendenciasCriticasAbertas) classesCard += ' critica';
            
            const dataInspecao = equipamento.ultimaInspecao ? 
                this.formatarData(equipamento.ultimaInspecao) : 
                'Não registrada';
            
            const setorFormatado = window.APP_CONFIG && window.APP_CONFIG.setores ? 
                (window.APP_CONFIG.setores[equipamento.setor]?.nome || equipamento.setor) : 
                equipamento.setor;
            
            // Contar pendencias
            const pendencias = equipamento.pendencias || [];
            const pendenciasAbertas = pendencias.filter(p => p.status === 'aberta').length;
            const pendenciasAndamento = pendencias.filter(p => p.status === 'em-andamento').length;
            const pendenciasResolvidas = pendencias.filter(p => p.status === 'resolvida').length;
            const pendenciasCriticas = pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
            
            // Verificar permissões para ações
            const podeCriarPendencia = this.verificarPermissao('criar_pendencias');
            
            return `
                <div class="${classesCard}" data-id="${equipamento.id}">
                    <div class="equipamento-header">
                        <div class="equipamento-info">
                            <h4>${equipamento.nome}</h4>
                            <div class="equipamento-codigo">${equipamento.codigo}</div>
                        </div>
                        <div class="status-chip ${equipamento.status}">
                            ${window.APP_CONFIG && window.APP_CONFIG.statusEquipamento ? 
                                window.APP_CONFIG.statusEquipamento[equipamento.status]?.nome || equipamento.status : 
                                equipamento.status}
                            ${temPendenciasCriticasAbertas ? ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>` : ''}
                        </div>
                    </div>
                    
                    <p class="equipamento-descricao">${equipamento.descricao}</p>
                    
                    <div class="equipamento-metadata">
                        <div><i class="fas fa-building"></i> ${setorFormatado}</div>
                        <div><i class="fas fa-calendar"></i> ${dataInspecao}</div>
                    </div>
                    
                    ${pendencias.length > 0 ? `
                        <div class="equipamento-pendencias">
                            <strong>Pendências:</strong>
                            ${pendenciasAbertas > 0 ? `<span class="pendencia-badge aberta">${pendenciasAbertas} Aberta(s)</span>` : ''}
                            ${pendenciasAndamento > 0 ? `<span class="pendencia-badge em-andamento">${pendenciasAndamento} Em Andamento</span>` : ''}
                            ${pendenciasResolvidas > 0 ? `<span class="pendencia-badge resolvida">${pendenciasResolvidas} Resolvida(s)</span>` : ''}
                            ${pendenciasCriticas > 0 ? `<span class="pendencia-badge critica">${pendenciasCriticas} Crítica(s)</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="equipamento-actions">
                        <button class="action-btn secondary btn-detalhes" data-id="${equipamento.id}">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                        <button class="action-btn primary btn-pendencia" data-id="${equipamento.id}" 
                                ${!podeCriarPendencia ? 'disabled title="Sem permissão para criar pendências"' : ''}>
                            <i class="fas fa-plus-circle"></i> Pendência
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos
        container.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.btn-detalhes').dataset.id);
                this.verDetalhesEquipamento(id);
            });
        });
        
        container.querySelectorAll('.btn-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;
                
                const id = parseInt(e.target.closest('.btn-pendencia').dataset.id);
                this.abrirModalPendencia(id);
            });
        });
    }
    
    atualizarEstatisticas() {
        const totalEquipamentos = this.equipamentos.length;
        const aptosOperar = this.equipamentos.filter(e => e.status === 'apto').length;
        const naoAptos = this.equipamentos.filter(e => e.status === 'nao-apto').length;
        
        let totalPendenciasAtivas = 0;
        let totalPendenciasCriticas = 0;
        
        this.equipamentos.forEach(equipamento => {
            if (equipamento.pendencias) {
                totalPendenciasAtivas += equipamento.pendencias.filter(p => 
                    p.status === 'aberta' || p.status === 'em-andamento'
                ).length;
                
                totalPendenciasCriticas += equipamento.pendencias.filter(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                ).length;
            }
        });
        
        document.getElementById('total-equipamentos').textContent = totalEquipamentos;
        document.getElementById('aptos-operar').textContent = aptosOperar;
        document.getElementById('nao-aptos').textContent = naoAptos;
        document.getElementById('total-pendencias').textContent = totalPendenciasAtivas;
        
        // Destacar se houver pendências críticas
        if (totalPendenciasCriticas > 0) {
            const pendenciasElement = document.getElementById('total-pendencias');
            pendenciasElement.style.color = '#8b0000';
            pendenciasElement.title = `${totalPendenciasCriticas} pendência(s) crítica(s)`;
        }
    }
    
    atualizarStatusSincronizacao(conectado) {
        const statusIndicator = document.getElementById('sync-status');
        if (!statusIndicator) return;
        
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (conectado) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Conectado';
            statusText.style.color = '';
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Desconectado';
            statusText.style.color = 'var(--cor-erro)';
        }
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        document.getElementById('view-list').classList.toggle('active', mode === 'list');
        document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
        
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
            
            document.getElementById('equipamento-codigo').value = equipamento.codigo;
            document.getElementById('equipamento-nome').value = equipamento.nome;
            document.getElementById('equipamento-descricao').value = equipamento.descricao;
            document.getElementById('equipamento-setor').value = equipamento.setor;
            document.getElementById('equipamento-ultima-inspecao').value = equipamento.ultimaInspecao || '';
            
            // Status será determinado automaticamente
            this.atualizarDisplayStatusEquipamento(equipamento);
            
            form.dataset.editId = equipamentoId;
        } else {
            // Modo criação
            titulo.textContent = 'Novo Equipamento';
            form.reset();
            
            document.getElementById('equipamento-setor').value = 'moagem-moagem';
            this.atualizarDisplayStatusEquipamento();
            
            delete form.dataset.editId;
        }
        
        modal.classList.add('active');
    }
    
    abrirModalPendencia(equipamentoId = null) {
        const modal = this.modals.pendencia;
        const form = document.getElementById('pendencia-form');
        const titulo = document.getElementById('pendencia-modal-title');
        
        if (!equipamentoId && this.equipamentoSelecionado) {
            equipamentoId = this.equipamentoSelecionado.id;
        }
        
        if (!equipamentoId) {
            this.mostrarMensagem('Selecione um equipamento primeiro', 'error');
            return;
        }
        
        const isEdit = form.dataset.editId;
        
        if (isEdit) {
            titulo.textContent = 'Editar Pendência';
            // Mostrar campo de comentário para edição
            document.getElementById('pendencia-comentario-group').style.display = 'block';
        } else {
            titulo.textContent = 'Nova Pendência';
            // Ocultar campo de comentário para nova pendência
            document.getElementById('pendencia-comentario-group').style.display = 'none';
        }
        
        form.reset();
        
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('pendencia-data').value = hoje;
        document.getElementById('pendencia-equipamento-id').value = equipamentoId;
        
        modal.classList.add('active');
    }
    
    atualizarDisplayStatusEquipamento(equipamento = null) {
        const statusDisplay = document.getElementById('equipamento-status-display');
        if (!statusDisplay) return;
        
        if (equipamento) {
            const temPendenciasCriticasAbertas = equipamento.pendencias && equipamento.pendencias.some(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            );
            
            const status = temPendenciasCriticasAbertas ? 'nao-apto' : 'apto';
            const statusTexto = status === 'apto' ? 'Apto a Operar' : 'Não Apto';
            const classeStatus = status === 'apto' ? 'status-chip apto' : 'status-chip nao-apto';
            
            statusDisplay.innerHTML = `<span class="${classeStatus}">${statusTexto}</span>`;
            
            if (temPendenciasCriticasAbertas) {
                const pendenciasCriticas = equipamento.pendencias.filter(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                ).length;
                
                statusDisplay.innerHTML += `
                    <div class="status-info">
                        <small><i class="fas fa-exclamation-triangle"></i> 
                        ${pendenciasCriticas} pendência(s) crítica(s) aberta(s)</small>
                    </div>
                `;
            }
        } else {
            statusDisplay.innerHTML = '<span class="status-chip apto">Apto a Operar</span>';
        }
    }
    
    atualizarStatusEquipamentoPorPendencias(equipamentoIndex) {
        const equipamento = this.equipamentos[equipamentoIndex];
        
        const temPendenciasCriticasAbertas = equipamento.pendencias && equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        
        if (temPendenciasCriticasAbertas) {
            equipamento.status = 'nao-apto';
        } else {
            equipamento.status = 'apto';
        }
    }
    
    async salvarEquipamento() {
        const form = document.getElementById('equipamento-form');
        const isEdit = form.dataset.editId;
        
        const equipamento = {
            codigo: document.getElementById('equipamento-codigo').value.trim(),
            nome: document.getElementById('equipamento-nome').value.trim(),
            descricao: document.getElementById('equipamento-descricao').value.trim(),
            setor: document.getElementById('equipamento-setor').value,
            status: 'apto',
            ultimaInspecao: document.getElementById('equipamento-ultima-inspecao').value || null,
            pendencias: []
        };
        
        // Validação
        if (!equipamento.codigo || !equipamento.nome) {
            this.mostrarMensagem('Código e nome são obrigatórios', 'error');
            return;
        }
        
        if (isEdit) {
            // Atualizar equipamento existente
            const id = parseInt(isEdit);
            const index = this.equipamentos.findIndex(e => e.id === id);
            
            if (index !== -1) {
                // Manter dados existentes
                equipamento.id = id;
                equipamento.pendencias = this.equipamentos[index].pendencias || [];
                equipamento.dataCriacao = this.equipamentos[index].dataCriacao;
                equipamento.criadoPor = this.equipamentos[index].criadoPor || this.usuarioAtual;
                
                // Atualizar status baseado nas pendências
                const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                );
                equipamento.status = temPendenciasCriticasAbertas ? 'nao-apto' : 'apto';
                
                this.equipamentos[index] = equipamento;
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('EDITAR_EQUIPAMENTO', `Editou equipamento: ${equipamento.codigo} - ${equipamento.nome}`);
                }
                
                this.mostrarMensagem('Equipamento atualizado com sucesso', 'success');
            }
        } else {
            // Criar novo equipamento
            equipamento.id = this.data.nextEquipamentoId || 1;
            equipamento.dataCriacao = new Date().toISOString().split('T')[0];
            equipamento.criadoPor = this.usuarioAtual;
            
            this.equipamentos.push(equipamento);
            
            // Atualizar próximo ID
            this.data.nextEquipamentoId = (this.data.nextEquipamentoId || 1) + 1;
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('CRIAR_EQUIPAMENTO', `Criou equipamento: ${equipamento.codigo} - ${equipamento.nome}`);
            }
            
            this.mostrarMensagem('Equipamento criado com sucesso', 'success');
        }
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Fechar modal e atualizar
        this.fecharModal(this.modals.equipamento);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        this.atualizarEstadoBotaoPendencia();
    }
    
    async salvarPendencia() {
        const form = document.getElementById('pendencia-form');
        const equipamentoId = parseInt(document.getElementById('pendencia-equipamento-id').value);
        const isEdit = form.dataset.editId;
        
        const usuarioAtual = this.usuarioAtual;
        const timestamp = new Date().toISOString();
        
        const pendencia = {
            titulo: document.getElementById('pendencia-titulo').value.trim(),
            descricao: document.getElementById('pendencia-descricao').value.trim(),
            responsavel: document.getElementById('pendencia-responsavel').value,
            prioridade: document.getElementById('pendencia-prioridade').value,
            data: document.getElementById('pendencia-data').value || new Date().toISOString().split('T')[0],
            status: document.getElementById('pendencia-status').value
        };
        
        // Validação
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
            // ATUALIZADO: Modo edição com histórico
            const pendenciaId = parseInt(isEdit);
            const pendenciaIndex = this.equipamentos[equipamentoIndex].pendencias.findIndex(p => p.id === pendenciaId);
            
            if (pendenciaIndex !== -1) {
                const pendenciaAntiga = this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex];
                
                // Verificar se houve alteração de status
                const statusAlterado = pendenciaAntiga.status !== pendencia.status;
                
                // Inicializar histórico se não existir
                if (!pendenciaAntiga.historico) {
                    pendenciaAntiga.historico = [];
                }
                
                // Registrar alteração no histórico
                const alteracoes = this.detectarAlteracoesPendencia(pendenciaAntiga, pendencia);
                
                if (Object.keys(alteracoes).length > 0) {
                    const entradaHistorico = {
                        timestamp: timestamp,
                        usuario: usuarioAtual,
                        acao: 'ATUALIZAR_PENDENCIA',
                        alteracoes: alteracoes,
                        comentario: document.getElementById('pendencia-comentario')?.value || ''
                    };
                    
                    pendenciaAntiga.historico.push(entradaHistorico);
                    
                    // Se houve alteração de status, registrar separadamente
                    if (statusAlterado) {
                        const historicoStatus = {
                            timestamp: timestamp,
                            usuario: usuarioAtual,
                            acao: 'ALTERAR_STATUS',
                            de: pendenciaAntiga.status,
                            para: pendencia.status,
                            comentario: document.getElementById('pendencia-comentario')?.value || 'Alteração de status'
                        };
                        
                        if (!pendenciaAntiga.historicoStatus) {
                            pendenciaAntiga.historicoStatus = [];
                        }
                        pendenciaAntiga.historicoStatus.push(historicoStatus);
                        
                        // Registrar quem concluiu se status for "resolvida"
                        if (pendencia.status === 'resolvida') {
                            pendenciaAntiga.resolvidoPor = usuarioAtual;
                            pendenciaAntiga.dataResolucao = timestamp;
                            
                            // Registrar no histórico principal também
                            pendenciaAntiga.historico.push({
                                timestamp: timestamp,
                                usuario: usuarioAtual,
                                acao: 'RESOLVER_PENDENCIA',
                                comentario: `Pendência resolvida por ${usuarioAtual}`
                            });
                        }
                    }
                }
                
                // Atualizar dados da pendência
                pendencia.id = pendenciaId;
                pendencia.criadoPor = pendenciaAntiga.criadoPor;
                pendencia.criadoEm = pendenciaAntiga.criadoEm;
                pendencia.historico = pendenciaAntiga.historico;
                pendencia.historicoStatus = pendenciaAntiga.historicoStatus;
                pendencia.ultimaAtualizacao = timestamp;
                pendencia.atualizadoPor = usuarioAtual;
                
                // Manter dados de resolução se existirem
                if (pendenciaAntiga.resolvidoPor) pendencia.resolvidoPor = pendenciaAntiga.resolvidoPor;
                if (pendenciaAntiga.dataResolucao) pendencia.dataResolucao = pendenciaAntiga.dataResolucao;
                
                this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex] = pendencia;
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('EDITAR_PENDENCIA', `Editou pendência: ${pendencia.titulo} (${Object.keys(alteracoes).length} alterações)`);
                }
                
                this.mostrarMensagem('Pendência atualizada com sucesso', 'success');
            }
        } else {
            // Modo criação - NOVO: Já inclui primeira entrada no histórico
            pendencia.id = this.data.nextPendenciaId || 1;
            pendencia.criadoPor = usuarioAtual;
            pendencia.criadoEm = timestamp;
            pendencia.ultimaAtualizacao = timestamp;
            pendencia.atualizadoPor = usuarioAtual;
            
            // Inicializar histórico
            pendencia.historico = [{
                timestamp: timestamp,
                usuario: usuarioAtual,
                acao: 'CRIAR_PENDENCIA',
                alteracoes: {},
                comentario: 'Pendência criada'
            }];
            
            pendencia.historicoStatus = [{
                timestamp: timestamp,
                usuario: usuarioAtual,
                acao: 'CRIAR_PENDENCIA',
                status: 'aberta',
                comentario: 'Status inicial: Aberta'
            }];
            
            // Garantir que o array de pendencias existe
            if (!this.equipamentos[equipamentoIndex].pendencias) {
                this.equipamentos[equipamentoIndex].pendencias = [];
            }
            
            this.equipamentos[equipamentoIndex].pendencias.push(pendencia);
            
            // Atualizar próximo ID
            this.data.nextPendenciaId = (this.data.nextPendenciaId || 1) + 1;
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('CRIAR_PENDENCIA', `Criou pendência: ${pendencia.titulo} no equipamento ${this.equipamentos[equipamentoIndex].codigo}`);
            }
            
            this.mostrarMensagem('Pendência registrada com sucesso', 'success');
        }
        
        // Atualizar status do equipamento
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Fechar modal e atualizar
        this.fecharModal(this.modals.pendencia);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
    }
    
    // NOVO: Função para detectar alterações em pendências
    detectarAlteracoesPendencia(pendenciaAntiga, pendenciaNova) {
        const alteracoes = {};
        
        // Comparar cada campo
        const campos = ['titulo', 'descricao', 'responsavel', 'prioridade', 'data', 'status'];
        
        campos.forEach(campo => {
            if (pendenciaAntiga[campo] !== pendenciaNova[campo]) {
                alteracoes[campo] = {
                    anterior: pendenciaAntiga[campo],
                    novo: pendenciaNova[campo],
                    data: new Date().toISOString()
                };
            }
        });
        
        return alteracoes;
    }
    
    // NOVO: Método para adicionar comentário à pendência
    async adicionarComentarioPendencia(pendenciaId, comentario, equipamentoId = null) {
        if (!equipamentoId && this.equipamentoSelecionado) {
            equipamentoId = this.equipamentoSelecionado.id;
        }
        
        if (!equipamentoId || !pendenciaId || !comentario.trim()) {
            this.mostrarMensagem('Dados incompletos para adicionar comentário', 'error');
            return false;
        }
        
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === equipamentoId);
        if (equipamentoIndex === -1) {
            this.mostrarMensagem('Equipamento não encontrado', 'error');
            return false;
        }
        
        const pendenciaIndex = this.equipamentos[equipamentoIndex].pendencias.findIndex(p => p.id === pendenciaId);
        if (pendenciaIndex === -1) {
            this.mostrarMensagem('Pendência não encontrada', 'error');
            return false;
        }
        
        const pendencia = this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex];
        const timestamp = new Date().toISOString();
        
        // Inicializar histórico se não existir
        if (!pendencia.historico) {
            pendencia.historico = [];
        }
        
        // Adicionar entrada de comentário
        pendencia.historico.push({
            timestamp: timestamp,
            usuario: this.usuarioAtual,
            acao: 'ADICIONAR_COMENTARIO',
            comentario: comentario.trim()
        });
        
        pendencia.ultimaAtualizacao = timestamp;
        pendencia.atualizadoPor = this.usuarioAtual;
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        if (salvou) {
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('COMENTAR_PENDENCIA', `Comentou na pendência: ${pendencia.titulo}`);
            }
            
            this.mostrarMensagem('Comentário adicionado com sucesso', 'success');
            return true;
        }
        
        return false;
    }
    
    verDetalhesEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        
        this.equipamentoSelecionado = equipamento;
        
        // Preencher informações
        document.getElementById('detalhes-titulo').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `Código: ${equipamento.codigo}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        
        const setorFormatado = window.APP_CONFIG && window.APP_CONFIG.setores ? 
            (window.APP_CONFIG.setores[equipamento.setor]?.nome || equipamento.setor) : 
            equipamento.setor;
        document.getElementById('detalhes-setor').textContent = setorFormatado;
        
        document.getElementById('detalhes-criacao').textContent = this.formatarData(equipamento.dataCriacao);
        document.getElementById('detalhes-criador').textContent = equipamento.criadoPor || 'N/A';
        
        // Data de inspeção
        const dataInspecao = equipamento.ultimaInspecao ? 
            this.formatarData(equipamento.ultimaInspecao) : 
            'Não registrada';
        document.getElementById('detalhes-inspecao').textContent = dataInspecao;
        
        // Status
        const statusChip = document.getElementById('detalhes-status');
        const statusNome = window.APP_CONFIG && window.APP_CONFIG.statusEquipamento ? 
            window.APP_CONFIG.statusEquipamento[equipamento.status]?.nome || equipamento.status : 
            equipamento.status;
        statusChip.textContent = statusNome;
        statusChip.className = `status-chip ${equipamento.status}`;
        
        // Adicionar ícone de alerta se houver pendências críticas
        const temPendenciasCriticasAbertas = equipamento.pendencias && equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        if (temPendenciasCriticasAbertas) {
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
            statusChip.innerHTML += ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>`;
        }
        
        // Renderizar pendencias
        this.renderizarPendenciasDetalhes(equipamento.pendencias || []);
        
        // Configurar botões de ação baseado nas permissões
        this.configurarBotoesDetalhes();
        
        // Abrir modal
        this.modals.detalhes.classList.add('active');
    }
    
    configurarBotoesDetalhes() {
        const editarBtn = document.getElementById('editar-equipamento');
        const pendenciaBtn = document.getElementById('nova-pendencia-detalhes');
        
        if (editarBtn) {
            const podeEditar = this.verificarPermissao('editar_equipamentos');
            editarBtn.style.display = podeEditar ? 'flex' : 'none';
            editarBtn.disabled = !podeEditar;
            if (!podeEditar) {
                editarBtn.title = 'Sem permissão para editar equipamentos';
            }
        }
        
        if (pendenciaBtn) {
            const podeCriarPendencia = this.verificarPermissao('criar_pendencias');
            pendenciaBtn.disabled = !podeCriarPendencia;
            if (!podeCriarPendencia) {
                pendenciaBtn.title = 'Sem permissão para criar pendências';
            }
        }
    }
    
    renderizarPendenciasDetalhes(pendencias) {
        const container = document.getElementById('detalhes-pendencias');
        
        if (!pendencias || pendencias.length === 0) {
            container.innerHTML = `
                <div class="no-pendencias">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma pendência registrada para este equipamento.</p>
                </div>
            `;
            return;
        }
        
        // Ordenar pendencias
        const pendenciasOrdenadas = [...pendencias].sort((a, b) => {
            const statusOrder = { 'aberta': 0, 'em-andamento': 1, 'resolvida': 2, 'cancelada': 3 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            
            const prioridadeOrder = { 'critica': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
            if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]) {
                return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
            }
            
            return new Date(b.data) - new Date(a.data);
        });
        
        container.innerHTML = pendenciasOrdenadas.map(pendencia => {
            const dataFormatada = this.formatarData(pendencia.data);
            const criadoEmFormatado = pendencia.criadoEm ? this.formatarDataHora(pendencia.criadoEm) : 'Data não registrada';
            const atualizadoEmFormatado = pendencia.ultimaAtualizacao ? this.formatarDataHora(pendencia.ultimaAtualizacao) : 'Nunca atualizado';
            
            const isCritica = pendencia.prioridade === 'critica';
            const podeEditar = this.podeExecutar('editar', 'pendencia', pendencia.criadoPor);
            const podeExcluir = this.podeExecutar('excluir', 'pendencia', pendencia.criadoPor);
            const podeComentar = this.verificarPermissao('adicionar_comentarios');
            const podeVerHistorico = this.verificarPermissao('ver_historico_completo');
            
            // Contar histórico
            const totalHistorico = pendencia.historico ? pendencia.historico.length : 0;
            const historicoStatus = pendencia.historicoStatus ? pendencia.historicoStatus.length : 0;
            
            // Verificar se foi resolvida
            const foiResolvida = pendencia.status === 'resolvida';
            const resolvidoPor = pendencia.resolvidoPor || 'Não resolvida';
            const dataResolucao = pendencia.dataResolucao ? this.formatarDataHora(pendencia.dataResolucao) : '';
            
            return `
                <div class="pendencia-item ${pendencia.status} ${isCritica ? 'critica' : ''}">
                    <div class="pendencia-header">
                        <div>
                            <div class="pendencia-titulo">
                                ${isCritica ? '<i class="fas fa-exclamation-triangle"></i> ' : ''}
                                ${pendencia.titulo}
                                <small style="color: var(--cor-texto-secundario); margin-left: 8px;">
                                    Criada por: ${pendencia.criadoPor || 'N/A'} em ${criadoEmFormatado}
                                </small>
                            </div>
                            <div class="pendencia-data">
                                <i class="far fa-calendar"></i> ${dataFormatada} 
                                | Prioridade: ${window.APP_CONFIG && window.APP_CONFIG.prioridades ? 
                                    window.APP_CONFIG.prioridades[pendencia.prioridade]?.nome || pendencia.prioridade : 
                                    pendencia.prioridade}
                                ${foiResolvida ? `| Resolvida por: ${resolvidoPor} em ${dataResolucao}` : ''}
                            </div>
                            <div class="pendencia-metadata">
                                <small>
                                    <i class="fas fa-history"></i> ${totalHistorico} alterações 
                                    | Última atualização: ${atualizadoEmFormatado} por ${pendencia.atualizadoPor || pendencia.criadoPor}
                                </small>
                            </div>
                        </div>
                        <div class="pendencia-badge ${pendencia.status}">
                            ${window.APP_CONFIG && window.APP_CONFIG.statusPendencia ? 
                                window.APP_CONFIG.statusPendencia[pendencia.status]?.nome || pendencia.status : 
                                pendencia.status}
                        </div>
                    </div>
                    <p class="pendencia-descricao">${pendencia.descricao}</p>
                    <div class="pendencia-footer">
                        <div class="pendencia-responsavel">
                            <i class="fas fa-user"></i> Responsável: ${pendencia.responsavel}
                        </div>
                        <div class="pendencia-acoes">
                            ${podeEditar ? `
                                <button class="btn-editar-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                            ` : ''}
                            ${podeComentar ? `
                                <button class="btn-comentar-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-comment"></i> Comentar
                                </button>
                            ` : ''}
                            ${podeExcluir ? `
                                <button class="btn-excluir-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                            ` : ''}
                            ${podeVerHistorico && totalHistorico > 0 ? `
                                <button class="btn-historico-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-history"></i> Histórico
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Seção para adicionar comentário (inicialmente oculta) -->
                    <div class="comentario-section" id="comentario-${pendencia.id}" style="display: none; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <textarea class="comentario-textarea" id="comentario-text-${pendencia.id}" 
                                  placeholder="Adicione um comentário sobre a alteração..." 
                                  rows="3" style="width: 100%; margin-bottom: 10px;"></textarea>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="btn-cancelar-comentario" data-id="${pendencia.id}">
                                Cancelar
                            </button>
                            <button class="btn-enviar-comentario" data-id="${pendencia.id}">
                                Enviar Comentário
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos
        this.configurarEventosPendencias(container);
    }
    
    // NOVO: Configurar eventos das pendências
    configurarEventosPendencias(container) {
        // Evento para editar
        container.querySelectorAll('.btn-editar-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-editar-pendencia').dataset.id);
                this.editarPendencia(pendenciaId);
            });
        });
        
        // Evento para excluir
        container.querySelectorAll('.btn-excluir-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-excluir-pendencia').dataset.id);
                this.excluirPendencia(pendenciaId);
            });
        });
        
        // Evento para comentar
        container.querySelectorAll('.btn-comentar-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-comentar-pendencia').dataset.id);
                const comentarioSection = document.getElementById(`comentario-${pendenciaId}`);
                
                // Alternar visibilidade
                if (comentarioSection.style.display === 'none') {
                    comentarioSection.style.display = 'block';
                    document.getElementById(`comentario-text-${pendenciaId}`).focus();
                } else {
                    comentarioSection.style.display = 'none';
                }
            });
        });
        
        // Evento para enviar comentário
        container.querySelectorAll('.btn-enviar-comentario').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-enviar-comentario').dataset.id);
                const textarea = document.getElementById(`comentario-text-${pendenciaId}`);
                const comentario = textarea.value.trim();
                
                if (!comentario) {
                    this.mostrarMensagem('Digite um comentário antes de enviar', 'error');
                    return;
                }
                
                const sucesso = await this.adicionarComentarioPendencia(pendenciaId, comentario);
                
                if (sucesso) {
                    textarea.value = '';
                    document.getElementById(`comentario-${pendenciaId}`).style.display = 'none';
                    
                    // Atualizar a visualização
                    if (this.equipamentoSelecionado) {
                        this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
                    }
                }
            });
        });
        
        // Evento para cancelar comentário
        container.querySelectorAll('.btn-cancelar-comentario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-cancelar-comentario').dataset.id);
                document.getElementById(`comentario-${pendenciaId}`).style.display = 'none';
                document.getElementById(`comentario-text-${pendenciaId}`).value = '';
            });
        });
        
        // Evento para ver histórico
        container.querySelectorAll('.btn-historico-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-historico-pendencia').dataset.id);
                this.mostrarHistoricoPendencia(pendenciaId);
            });
        });
    }
    
    editarPendencia(pendenciaId) {
        if (!this.equipamentoSelecionado) return;
        
        const pendencia = this.equipamentoSelecionado.pendencias.find(p => p.id === pendenciaId);
        if (!pendencia) return;
        
        // Verificar se usuário tem permissão para editar
        const podeEditar = this.podeExecutar('editar', 'pendencia', pendencia.criadoPor);
        if (!podeEditar) {
            this.mostrarMensagem('Você não tem permissão para editar esta pendência', 'error');
            return;
        }
        
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
        
        // Mostrar campo de comentário
        const comentarioGroup = document.getElementById('pendencia-comentario-group');
        if (comentarioGroup) {
            comentarioGroup.style.display = 'block';
            document.getElementById('pendencia-comentario').value = '';
        }
        
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
        
        const pendencia = this.equipamentoSelecionado.pendencias.find(p => p.id === pendenciaId);
        if (!pendencia) return;
        
        // Verificar se usuário tem permissão para excluir
        const podeExcluir = this.podeExecutar('excluir', 'pendencia', pendencia.criadoPor);
        if (!podeExcluir) {
            this.mostrarMensagem('Você não tem permissão para excluir esta pendência', 'error');
            return;
        }
        
        if (!confirm('Tem certeza que deseja excluir esta pendência?')) {
            return;
        }
        
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === this.equipamentoSelecionado.id);
        if (equipamentoIndex === -1) return;
        
        // Remover pendência
        this.equipamentos[equipamentoIndex].pendencias = this.equipamentos[equipamentoIndex].pendencias.filter(p => p.id !== pendenciaId);
        
        // Atualizar status do equipamento
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        // Atualizar equipamento selecionado
        this.equipamentoSelecionado = this.equipamentos[equipamentoIndex];
        
        // Registrar atividade
        if (window.registrarAtividade) {
            window.registrarAtividade('EXCLUIR_PENDENCIA', `Excluiu pendência: ${pendencia.titulo} do equipamento ${this.equipamentoSelecionado.codigo}`);
        }
        
        // Salvar dados
        await this.salvarDados();
        
        // Atualizar interface
        this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        this.mostrarMensagem('Pendência excluída com sucesso', 'success');
    }
    
    // NOVO: Método para mostrar histórico completo da pendência
    mostrarHistoricoPendencia(pendenciaId) {
        if (!this.equipamentoSelecionado) return;
        
        const pendencia = this.equipamentoSelecionado.pendencias.find(p => p.id === pendenciaId);
        if (!pendencia) return;
        
        const historico = pendencia.historico || [];
        const historicoStatus = pendencia.historicoStatus || [];
        
        // Criar modal para histórico
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> Histórico da Pendência: ${pendencia.titulo}</h3>
                    <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body" style="overflow-y: auto;">
                    <div class="info-resumo" style="background: var(--cor-fundo-secundario); padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <p><strong>Criada por:</strong> ${pendencia.criadoPor} em ${this.formatarDataHora(pendencia.criadoEm)}</p>
                        <p><strong>Status atual:</strong> ${pendencia.status}</p>
                        <p><strong>Total de alterações:</strong> ${historico.length}</p>
                        ${pendencia.resolvidoPor ? `<p><strong>Resolvida por:</strong> ${pendencia.resolvidoPor} em ${this.formatarDataHora(pendencia.dataResolucao)}</p>` : ''}
                    </div>
                    
                    <div class="historico-timeline">
                        <h4><i class="fas fa-stream"></i> Linha do Tempo de Alterações</h4>
                        
                        <div class="timeline-container" style="position: relative; padding-left: 30px;">
                            <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: var(--cor-primaria); opacity: 0.3;"></div>
                            
                            ${historico.map((item, index) => `
                                <div class="timeline-item" style="position: relative; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--cor-borda);">
                                    <div class="timeline-marker" style="position: absolute; left: -30px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--cor-primaria); border: 2px solid white; box-shadow: 0 0 0 2px var(--cor-primaria);"></div>
                                    <div class="timeline-content">
                                        <div class="timeline-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                            <strong>${this.getNomeAcao(item.acao)}</strong>
                                            <small>${this.formatarDataHora(item.timestamp)} por ${item.usuario}</small>
                                        </div>
                                        ${item.alteracoes && Object.keys(item.alteracoes).length > 0 ? `
                                            <div class="timeline-alteracoes" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px; border-left: 3px solid var(--cor-primaria);">
                                                <strong>Alterações:</strong>
                                                <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                                                    ${Object.entries(item.alteracoes).map(([campo, alteracao]) => `
                                                        <li style="margin-bottom: 5px; font-size: 13px;"><strong>${this.getNomeCampo(campo)}:</strong> 
                                                            ${alteracao.anterior || '(vazio)'} → ${alteracao.novo || '(vazio)'}
                                                        </li>
                                                    `).join('')}
                                                </ul>
                                            </div>
                                        ` : ''}
                                        ${item.comentario ? `
                                            <div class="timeline-comentario" style="background: #e8f4fd; padding: 10px; border-radius: 5px; font-style: italic; border-left: 3px solid #3498db;">
                                                <strong>Comentário:</strong> ${item.comentario}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${historicoStatus.length > 0 ? `
                        <div class="historico-status" style="margin-top: 30px;">
                            <h4><i class="fas fa-exchange-alt"></i> Histórico de Status</h4>
                            <table class="status-table" style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
                                <thead>
                                    <tr>
                                        <th style="padding: 8px; border: 1px solid var(--cor-borda); background: var(--cor-fundo-secundario); font-weight: 600;">Data/Hora</th>
                                        <th style="padding: 8px; border: 1px solid var(--cor-borda); background: var(--cor-fundo-secundario); font-weight: 600;">Usuário</th>
                                        <th style="padding: 8px; border: 1px solid var(--cor-borda); background: var(--cor-fundo-secundario); font-weight: 600;">Status Anterior</th>
                                        <th style="padding: 8px; border: 1px solid var(--cor-borda); background: var(--cor-fundo-secundario); font-weight: 600;">Status Novo</th>
                                        <th style="padding: 8px; border: 1px solid var(--cor-borda); background: var(--cor-fundo-secundario); font-weight: 600;">Comentário</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${historicoStatus.map(item => `
                                        <tr style="border: 1px solid var(--cor-borda); ${item.para === 'resolvida' ? 'background: rgba(46, 204, 113, 0.1);' : ''}">
                                            <td style="padding: 8px; border: 1px solid var(--cor-borda);">${this.formatarDataHora(item.timestamp)}</td>
                                            <td style="padding: 8px; border: 1px solid var(--cor-borda);">${item.usuario}</td>
                                            <td style="padding: 8px; border: 1px solid var(--cor-borda);">${item.de || '-'}</td>
                                            <td style="padding: 8px; border: 1px solid var(--cor-borda);">${item.para || '-'}</td>
                                            <td style="padding: 8px; border: 1px solid var(--cor-borda);">${item.comentario || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}
                    
                    <div class="form-actions" style="margin-top: 20px;">
                        <button onclick="this.closest('.modal').remove()" class="btn-primary">
                            <i class="fas fa-times"></i> Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fechar ao clicar fora
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
        
        // Registrar atividade
        if (window.registrarAtividade) {
            window.registrarAtividade('VISUALIZAR_HISTORICO', `Visualizou histórico da pendência: ${pendencia.titulo}`);
        }
    }
    
    // NOVO: Métodos auxiliares para histórico
    getNomeAcao(acao) {
        const nomes = {
            'CRIAR_PENDENCIA': 'Criação da Pendência',
            'ATUALIZAR_PENDENCIA': 'Atualização',
            'ALTERAR_STATUS': 'Alteração de Status',
            'RESOLVER_PENDENCIA': 'Resolução',
            'ADICIONAR_COMENTARIO': 'Comentário Adicionado'
        };
        
        return nomes[acao] || acao;
    }
    
    getNomeCampo(campo) {
        const nomes = {
            'titulo': 'Título',
            'descricao': 'Descrição',
            'responsavel': 'Responsável',
            'prioridade': 'Prioridade',
            'data': 'Data',
            'status': 'Status'
        };
        
        return nomes[campo] || campo;
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
        if (btnPendencia) {
            btnPendencia.disabled = this.equipamentos.length === 0 || !this.verificarPermissao('criar_pendencias');
            
            if (btnPendencia.disabled) {
                if (this.equipamentos.length === 0) {
                    btnPendencia.title = 'Não há equipamentos disponíveis';
                } else {
                    btnPendencia.title = 'Sem permissão para criar pendências';
                }
            }
        }
    }
    
    async sincronizarDados() {
        this.mostrarMensagem('Sincronizando dados...', 'info');
        
        // Registrar atividade
        if (window.registrarAtividade) {
            window.registrarAtividade('SINCRONIZAR', 'Iniciou sincronização manual de dados');
        }
        
        await this.carregarDados();
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        this.mostrarMensagem('Dados sincronizados com sucesso', 'success');
    }
    
    exportarDadosExcel() {
        try {
            // Verificar permissão
            if (!this.verificarPermissao('exportar_dados')) {
                this.mostrarMensagem('Você não tem permissão para exportar dados', 'error');
                return;
            }
            
            const dataAtual = new Date().toISOString().split('T')[0];
            const usuario = this.usuarioAtual || 'sistema';
            
            // Criar cabeçalhos
            let csvEquipamentos = 'ID,Código,Nome,Descrição,Setor,Status Operacional,Última Inspeção,Data Criação,Criado Por,Total Pendências,Pendências Abertas,Pendências Em Andamento,Pendências Resolvidas,Pendências Críticas\n';
            
            // Adicionar dados dos equipamentos
            this.equipamentos.forEach(equipamento => {
                const pendencias = equipamento.pendencias || [];
                const totalPendencias = pendencias.length;
                const pendenciasAbertas = pendencias.filter(p => p.status === 'aberta').length;
                const pendenciasAndamento = pendencias.filter(p => p.status === 'em-andamento').length;
                const pendenciasResolvidas = pendencias.filter(p => p.status === 'resolvida').length;
                const pendenciasCriticas = pendencias.filter(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                ).length;
                
                const escapeCSV = (str) => {
                    if (str === null || str === undefined) return '';
                    const string = String(str);
                    if (string.includes(',') || string.includes('"') || string.includes('\n')) {
                        return `"${string.replace(/"/g, '""')}"`;
                    }
                    return string;
                };
                
                const setorFormatado = window.APP_CONFIG && window.APP_CONFIG.setores ? 
                    (window.APP_CONFIG.setores[equipamento.setor]?.nome || equipamento.setor) : 
                    equipamento.setor;
                
                const statusFormatado = window.APP_CONFIG && window.APP_CONFIG.statusEquipamento ? 
                    window.APP_CONFIG.statusEquipamento[equipamento.status]?.nome || equipamento.status : 
                    equipamento.status;
                
                csvEquipamentos += [
                    equipamento.id,
                    escapeCSV(equipamento.codigo),
                    escapeCSV(equipamento.nome),
                    escapeCSV(equipamento.descricao),
                    escapeCSV(setorFormatado),
                    escapeCSV(statusFormatado),
                    equipamento.ultimaInspecao || '',
                    equipamento.dataCriacao || '',
                    equipamento.criadoPor || '',
                    totalPendencias,
                    pendenciasAbertas,
                    pendenciasAndamento,
                    pendenciasResolvidas,
                    pendenciasCriticas
                ].join(',') + '\n';
            });
            
            // Criar arquivo de pendências
            let csvPendencias = 'ID Equipamento,Código Equipamento,Nome Equipamento,ID Pendência,Título,Descrição,Responsável,Prioridade,Data,Status,Criado Por,Criado Em,Última Atualização,Atualizado Por,Resolvido Por,Data Resolução\n';
            
            this.equipamentos.forEach(equipamento => {
                const pendencias = equipamento.pendencias || [];
                pendencias.forEach(pendencia => {
                    const escapeCSV = (str) => {
                        if (str === null || str === undefined) return '';
                        const string = String(str);
                        if (string.includes(',') || string.includes('"') || string.includes('\n')) {
                            return `"${string.replace(/"/g, '""')}"`;
                        }
                        return string;
                    };
                    
                    const prioridadeFormatada = window.APP_CONFIG && window.APP_CONFIG.prioridades ? 
                        window.APP_CONFIG.prioridades[pendencia.prioridade]?.nome || pendencia.prioridade : 
                        pendencia.prioridade;
                    
                    const statusFormatado = window.APP_CONFIG && window.APP_CONFIG.statusPendencia ? 
                        window.APP_CONFIG.statusPendencia[pendencia.status]?.nome || pendencia.status : 
                        pendencia.status;
                    
                    csvPendencias += [
                        equipamento.id,
                        escapeCSV(equipamento.codigo),
                        escapeCSV(equipamento.nome),
                        pendencia.id,
                        escapeCSV(pendencia.titulo),
                        escapeCSV(pendencia.descricao),
                        escapeCSV(pendencia.responsavel),
                        escapeCSV(prioridadeFormatada),
                        pendencia.data,
                        escapeCSV(statusFormatado),
                        pendencia.criadoPor || '',
                        pendencia.criadoEm || '',
                        pendencia.ultimaAtualizacao || '',
                        pendencia.atualizadoPor || '',
                        pendencia.resolvidoPor || '',
                        pendencia.dataResolucao || ''
                    ].join(',') + '\n';
                });
            });
            
            // Criar arquivo ZIP ou CSV
            this.criarArquivoZIP(csvEquipamentos, csvPendencias, dataAtual, usuario);
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('EXPORTAR_DADOS', `Exportou dados para Excel. Equipamentos: ${this.equipamentos.length}, Pendências: ${this.equipamentos.reduce((acc, eqp) => acc + (eqp.pendencias ? eqp.pendencias.length : 0), 0)}`);
            }
            
            this.mostrarMensagem('Dados exportados para Excel com sucesso', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar dados para Excel:', error);
            this.mostrarMensagem('Erro ao exportar dados para Excel', 'error');
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('ERRO_EXPORTAR', `Erro ao exportar dados: ${error.message}`);
            }
        }
    }
    
    criarArquivoZIP(csvEquipamentos, csvPendencias, dataAtual, usuario) {
        // Usar a biblioteca JSZip se disponível
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            zip.file(`equipamentos_${dataAtual}_${usuario}.csv`, csvEquipamentos);
            zip.file(`pendencias_${dataAtual}_${usuario}.csv`, csvPendencias);
            
            zip.generateAsync({type: "blob"})
                .then(function(content) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `gestao_equipamentos_${dataAtual}_${usuario}.zip`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                });
        } else {
            // Fallback: criar dois arquivos CSV separados
            this.downloadCSV(csvEquipamentos, `equipamentos_${dataAtual}_${usuario}.csv`);
            setTimeout(() => {
                this.downloadCSV(csvPendencias, `pendencias_${dataAtual}_${usuario}.csv`);
            }, 500);
        }
    }
    
    downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, fileName);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
    }
    
    // ================== FUNÇÕES AUXILIARES ==================
    
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
        // Remover mensagem anterior
        const mensagemAnterior = document.querySelector('.mensagem-flutuante');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
        // Cores para diferentes tipos
        const cores = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        // Ícones para diferentes tipos
        const icones = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        // Criar nova mensagem
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-flutuante ${tipo}`;
        mensagem.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            min-width: 300px;
            max-width: 400px;
            border-left: 4px solid ${cores[tipo]};
        `;
        
        mensagem.innerHTML = `
            <div class="mensagem-conteudo" style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${icones[tipo]}" style="font-size: 20px; color: ${cores[tipo]}"></i>
                <span>${texto}</span>
            </div>
        `;
        
        document.body.appendChild(mensagem);
        
        setTimeout(() => {
            mensagem.style.transform = 'translateX(0)';
        }, 10);
        
        // Remover após 5 segundos
        setTimeout(() => {
            mensagem.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (mensagem.parentNode) {
                    mensagem.remove();
                }
            }, 300);
        }, 5000);
    }
    
    formatarData(dataString) {
        if (!dataString) return 'Não informada';
        
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dataString;
        }
    }
    
    formatarDataHora(dataString) {
        if (!dataString) return 'Não informada';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return dataString;
            
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            console.warn('Erro ao formatar data/hora:', dataString, e);
            return dataString;
        }
    }
    
    configurarAtualizacoes() {
        // Atualizar informações de sessão periodicamente
        setInterval(() => {
            this.atualizarInfoSessao();
        }, 60000); // A cada minuto
        
        // Atualizar informações de sincronização
        setInterval(() => {
            this.atualizarInfoSincronizacao();
        }, 30000); // A cada 30 segundos
        
        // Executar inicialmente
        this.atualizarInfoSessao();
        this.atualizarInfoSincronizacao();
    }
    
    atualizarInfoSessao() {
        const sessao = localStorage.getItem('gestao_equipamentos_sessao');
        const userSessionElement = document.getElementById('user-session');
        
        if (!userSessionElement || !sessao) return;
        
        try {
            const sessaoData = JSON.parse(sessao);
            const expiracao = new Date(sessaoData.expira);
            const agora = new Date();
            
            const diffMs = expiracao - agora;
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (diffMs > 0) {
                userSessionElement.textContent = `Sessão: ${diffHrs}h ${diffMins}m restantes`;
                userSessionElement.style.color = diffHrs < 1 ? 'var(--cor-erro)' : 'var(--cor-sucesso)';
            } else {
                userSessionElement.textContent = 'Sessão expirada';
                userSessionElement.style.color = 'var(--cor-erro)';
            }
        } catch (e) {
            console.error('Erro ao atualizar info sessão:', e);
        }
    }
    
    atualizarInfoSincronizacao() {
        const lastSync = localStorage.getItem('gestao_equipamentos_ultima_sinc');
        const lastSyncElement = document.getElementById('last-sync');
        
        if (!lastSyncElement) return;
        
        if (lastSync) {
            try {
                const syncDate = new Date(lastSync);
                const agora = new Date();
                const diffMinutos = Math.floor((agora - syncDate) / (1000 * 60));
                
                lastSyncElement.textContent = `Última sincronização: ${syncDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
                
                // Destacar se faz mais de 10 minutos
                if (diffMinutos > 10) {
                    lastSyncElement.style.color = 'var(--cor-alerta)';
                } else {
                    lastSyncElement.style.color = '';
                }
                
            } catch (e) {
                lastSyncElement.textContent = 'Última sincronização: N/A';
            }
        } else {
            lastSyncElement.textContent = 'Última sincronização: N/A';
        }
    }
}

// ================== INICIALIZAÇÃO DA APLICAÇÃO ==================

document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos globais
    configurarEventosGlobais();
    
    // Inicializar aplicação
    try {
        const app = new EquipamentosApp();
        window.app = app; // Para acesso global
        
        console.log('Sistema carregado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        alert('Erro ao carregar o sistema. Verifique o console para mais detalhes.');
    }
});

function configurarEventosGlobais() {
    // Botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Tem certeza que deseja sair do sistema?')) {
                // Registrar atividade
                if (window.registrarAtividade) {
                    const usuario = localStorage.getItem('gestao_equipamentos_usuario');
                    window.registrarAtividade('LOGOUT', `Usuário ${usuario} saiu do sistema`);
                }
                
                // Limpar sessão
                localStorage.removeItem('gestao_equipamentos_sessao');
                localStorage.removeItem('gestao_equipamentos_usuario');
                localStorage.removeItem('gestao_equipamentos_nivel');
                
                // Redirecionar para login
                window.location.href = 'login.html?logout=true';
            }
        });
    }
    
    // Botão de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Alternar tema usando a função global
            if (window.alternarTema) {
                const novoTema = window.alternarTema();
                
                // Atualizar título do botão
                if (novoTema === 'escuro') {
                    this.title = 'Alternar para tema claro';
                } else {
                    this.title = 'Alternar para tema escuro';
                }
            }
        });
    }
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl+T para alternar tema
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.click();
            }
        }
        
        // Ctrl+F para focar na busca
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Esc para limpar busca
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('search');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.value = '';
                if (window.app) {
                    window.app.filtros.busca = '';
                    window.app.renderizarEquipamentos();
                }
            }
        }
    });
}
