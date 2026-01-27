// ===========================================
// SISTEMA DE GESTÃO DE EQUIPAMENTOS COM PERMISSÕES
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
        
        // Adicionar indicador visual do nível
        this.adicionarIndicadorNivel();
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
            return false;
        }
        
        // Permissões básicas que todos têm
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes'];
        if (permissoesBasicas.includes(permissao)) {
            return true;
        }
        
        return window.PERMISSOES.verificarPermissao(this.nivelUsuario, permissao);
    }
    
    podeExecutar(acao, recurso, donoRecurso = null) {
        if (!this.nivelUsuario || !window.podeExecutar) {
            return false;
        }
        
        return window.podeExecutar(acao, recurso, donoRecurso);
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
                <span>${nomeFormatado} <small>(${nivelNome})</small></span>
            `;
        }
    }
    
    adicionarIndicadorNivel() {
        // Remover indicador anterior se existir
        const indicadorAnterior = document.querySelector('.nivel-indicator');
        if (indicadorAnterior) {
            indicadorAnterior.remove();
        }
        
        // Verificar se deve mostrar indicador
        if (!window.APP_CONFIG || !window.APP_CONFIG.appSettings.mostrarIndicadorNivel) {
            return;
        }
        
        const cor = this.getCorNivel();
        const nomeNivel = this.getNomeNivel();
        
        // Criar indicador
        const indicador = document.createElement('div');
        indicador.className = 'nivel-indicator';
        indicador.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: ${cor};
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.9;
            transition: opacity 0.3s;
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
        
        // Adicionar badge de nível no cabeçalho
        this.adicionarBadgeNivel();
    }
    
    adicionarBadgeNivel() {
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            // Remover badge anterior se existir
            const badgeAnterior = userInfo.querySelector('.user-level-badge');
            if (badgeAnterior) {
                badgeAnterior.remove();
            }
            
            const badge = document.createElement('span');
            badge.className = 'user-level-badge';
            badge.style.cssText = `
                display: inline-block;
                background: ${this.getCorNivel()};
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
                margin-left: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            badge.textContent = this.getNomeNivel().substring(0, 3);
            badge.title = `Nível: ${this.getNomeNivel()}`;
            
            userInfo.appendChild(badge);
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
        
        // Carregar equipamentos do bin principal
        const response = await fetch(
            `${JSONBIN_CONFIG.BIN_EQUIPAMENTOS.BASE_URL}/${JSONBIN_CONFIG.BIN_EQUIPAMENTOS.ID}/latest`,
            { headers: JSONBIN_CONFIG.headers }
        );
        
        if (!response.ok) {
            throw new Error('Erro ao carregar dados do servidor');
        }
        
        const result = await response.json();
        
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
        } else {
            this.data = INITIAL_DATA;
            this.equipamentos = INITIAL_DATA.equipamentos;
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('CARREGAR_DADOS', 'Usando dados iniciais do sistema');
            }
        }
        
        this.atualizarStatusSincronizacao(true);
        localStorage.setItem('gestao_equipamentos_ultima_sinc', new Date().toISOString());
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        
        this.data = INITIAL_DATA;
        this.equipamentos = INITIAL_DATA.equipamentos;
        
        this.atualizarStatusSincronizacao(false);
        this.mostrarMensagem('Erro ao conectar com o servidor. Usando dados locais.', 'error');
        
        // Registrar atividade
        if (window.registrarAtividade) {
            window.registrarAtividade('ERRO_CARREGAR', `Erro ao carregar dados: ${error.message}`);
        }
    } finally {
        this.mostrarLoading(false);
    }
}
    
async salvarDados() {
    try {
        this.atualizarNextIds();
        
        // Salvar apenas equipamentos no bin principal
        const dadosEquipamentos = {
            equipamentos: this.equipamentos,
            nextEquipamentoId: this.data.nextEquipamentoId,
            nextPendenciaId: this.data.nextPendenciaId,
            logs: this.data.logs || []
        };
        
        const response = await fetch(
            `${JSONBIN_CONFIG.BIN_EQUIPAMENTOS.BASE_URL}/${JSONBIN_CONFIG.BIN_EQUIPAMENTOS.ID}`,
            {
                method: 'PUT',
                headers: JSONBIN_CONFIG.headers,
                body: JSON.stringify(dadosEquipamentos)
            }
        );
        
        if (!response.ok) {
            throw new Error('Erro ao salvar dados');
        }
        
        this.atualizarStatusSincronizacao(true);
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
        let maxEquipamentoId = 0;
        this.equipamentos.forEach(eqp => {
            if (eqp.id > maxEquipamentoId) maxEquipamentoId = eqp.id;
        });
        this.data.nextEquipamentoId = maxEquipamentoId + 1;
        
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
            const temPendenciasAtivas = equipamento.pendencias.some(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            );
            
            const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            );
            
            let classesCard = 'equipamento-card';
            if (equipamento.status === 'nao-apto') classesCard += ' nao-apto';
            if (temPendenciasAtivas) classesCard += ' com-pendencia';
            if (temPendenciasCriticasAbertas) classesCard += ' critica';
            
            const dataInspecao = equipamento.ultimaInspecao ? 
                this.formatarData(equipamento.ultimaInspecao) : 
                'Não registrada';
            
            const setorFormatado = APP_CONFIG.setores[equipamento.setor] || equipamento.setor;
            
            // Contar pendencias
            const pendenciasAbertas = equipamento.pendencias.filter(p => p.status === 'aberta').length;
            const pendenciasAndamento = equipamento.pendencias.filter(p => p.status === 'em-andamento').length;
            const pendenciasResolvidas = equipamento.pendencias.filter(p => p.status === 'resolvida').length;
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
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
                            ${APP_CONFIG.statusEquipamento[equipamento.status]}
                            ${temPendenciasCriticasAbertas ? ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>` : ''}
                        </div>
                    </div>
                    
                    <p class="equipamento-descricao">${equipamento.descricao}</p>
                    
                    <div class="equipamento-metadata">
                        <div><i class="fas fa-building"></i> ${setorFormatado}</div>
                        <div><i class="fas fa-calendar"></i> ${dataInspecao}</div>
                    </div>
                    
                    ${equipamento.pendencias.length > 0 ? `
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
            totalPendenciasAtivas += equipamento.pendencias.filter(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            ).length;
            
            totalPendenciasCriticas += equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
        });
        
        document.getElementById('total-equipamentos').textContent = totalEquipamentos;
        document.getElementById('aptos-operar').textContent = aptosOperar;
        document.getElementById('nao-aptos').textContent = naoAptos;
        document.getElementById('total-pendencias').textContent = totalPendenciasAtivas;
        
        // Destacar se houver pendências críticas
        if (totalPendenciasCriticas > 0) {
            const pendenciasElement = document.getElementById('total-pendencias');
            pendenciasElement.style.color = 'var(--cor-erro)';
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
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Desconectado';
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
        
        titulo.textContent = 'Nova Pendência';
        form.reset();
        
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('pendencia-data').value = hoje;
        document.getElementById('pendencia-responsavel').value = '';
        document.getElementById('pendencia-equipamento-id').value = equipamentoId;
        
        delete form.dataset.editId;
        
        modal.classList.add('active');
    }
    
    atualizarDisplayStatusEquipamento(equipamento = null) {
        const statusDisplay = document.getElementById('equipamento-status-display');
        if (!statusDisplay) return;
        
        if (equipamento) {
            const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
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
        
        const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
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
                equipamento.pendencias = this.equipamentos[index].pendencias;
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
            equipamento.id = this.data.nextEquipamentoId++;
            equipamento.dataCriacao = new Date().toISOString().split('T')[0];
            equipamento.criadoPor = this.usuarioAtual;
            
            this.equipamentos.push(equipamento);
            
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
            // Atualizar pendência existente
            const pendenciaId = parseInt(isEdit);
            const pendenciaIndex = this.equipamentos[equipamentoIndex].pendencias.findIndex(p => p.id === pendenciaId);
            
            if (pendenciaIndex !== -1) {
                pendencia.id = pendenciaId;
                pendencia.criadoPor = this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex].criadoPor || this.usuarioAtual;
                pendencia.criadoEm = this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex].criadoEm;
                
                this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex] = pendencia;
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('EDITAR_PENDENCIA', `Editou pendência: ${pendencia.titulo} no equipamento ${this.equipamentos[equipamentoIndex].codigo}`);
                }
                
                this.mostrarMensagem('Pendência atualizada com sucesso', 'success');
            }
        } else {
            // Criar nova pendência
            pendencia.id = this.data.nextPendenciaId++;
            pendencia.criadoPor = this.usuarioAtual;
            pendencia.criadoEm = new Date().toISOString();
            
            this.equipamentos[equipamentoIndex].pendencias.push(pendencia);
            
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
    
    verDetalhesEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        
        this.equipamentoSelecionado = equipamento;
        
        // Preencher informações
        document.getElementById('detalhes-titulo').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `Código: ${equipamento.codigo}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        document.getElementById('detalhes-setor').textContent = APP_CONFIG.setores[equipamento.setor] || equipamento.setor;
        document.getElementById('detalhes-criacao').textContent = this.formatarData(equipamento.dataCriacao);
        
        // Status
        const statusChip = document.getElementById('detalhes-status');
        statusChip.textContent = APP_CONFIG.statusEquipamento[equipamento.status];
        statusChip.className = `status-chip ${equipamento.status}`;
        
        // Adicionar ícone de alerta se houver pendências críticas
        const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        if (temPendenciasCriticasAbertas) {
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
            statusChip.innerHTML += ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>`;
        }
        
        // Data de inspeção
        const dataInspecao = equipamento.ultimaInspecao ? 
            this.formatarData(equipamento.ultimaInspecao) : 
            'Não registrada';
        document.getElementById('detalhes-inspecao').textContent = dataInspecao;
        
        // Renderizar pendencias
        this.renderizarPendenciasDetalhes(equipamento.pendencias);
        
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
        
        if (pendencias.length === 0) {
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
            const isCritica = pendencia.prioridade === 'critica';
            const podeEditar = this.podeExecutar('editar', 'pendencia', pendencia.criadoPor);
            const podeExcluir = this.podeExecutar('excluir', 'pendencia', pendencia.criadoPor);
            
            return `
                <div class="pendencia-item ${pendencia.status} ${isCritica ? 'critica' : ''}">
                    <div class="pendencia-header">
                        <div>
                            <div class="pendencia-titulo">
                                ${isCritica ? '<i class="fas fa-exclamation-triangle"></i> ' : ''}
                                ${pendencia.titulo}
                                ${pendencia.criadoPor ? `<small style="color: var(--cor-texto-secundario); margin-left: 8px;">Criada por: ${pendencia.criadoPor}</small>` : ''}
                            </div>
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
                            ${podeEditar ? `
                                <button class="btn-editar-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                            ` : ''}
                            ${podeExcluir ? `
                                <button class="btn-excluir-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos
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

    // Função para validar login com dados do JSONBin
async function validarLoginComJSONBin(username, password) {
    try {
        // Carregar usuários do bin específico
        const response = await fetch(
            `${JSONBIN_CONFIG.BIN_USUARIOS.BASE_URL}/${JSONBIN_CONFIG.BIN_USUARIOS.ID}/latest`,
            { headers: JSONBIN_CONFIG.headers }
        );
        
        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }
        
        const result = await response.json();
        const usuarios = result.record?.usuarios || [];
        
        // Buscar usuário
        const usuario = usuarios.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            (u.ativo === true || u.ativo === undefined)
        );
        
        if (!usuario) {
            return { sucesso: false, mensagem: 'Usuário não encontrado ou inativo' };
        }
        
        // Verificar senha (em produção, use bcrypt ou similar)
        if (usuario.senha !== password) {
            return { sucesso: false, mensagem: 'Senha incorreta' };
        }
        
        return { 
            sucesso: true, 
            usuario: {
                username: usuario.username,
                nivel: usuario.nivel,
                nome: usuario.nome,
                email: usuario.email,
                departamento: usuario.departamento
            }
        };
        
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return { 
            sucesso: false, 
            mensagem: 'Erro de conexão. Tente novamente mais tarde.' 
        };
    }
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
                const totalPendencias = equipamento.pendencias.length;
                const pendenciasAbertas = equipamento.pendencias.filter(p => p.status === 'aberta').length;
                const pendenciasAndamento = equipamento.pendencias.filter(p => p.status === 'em-andamento').length;
                const pendenciasResolvidas = equipamento.pendencias.filter(p => p.status === 'resolvida').length;
                const pendenciasCriticas = equipamento.pendencias.filter(p => 
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
                
                csvEquipamentos += [
                    equipamento.id,
                    escapeCSV(equipamento.codigo),
                    escapeCSV(equipamento.nome),
                    escapeCSV(equipamento.descricao),
                    escapeCSV(APP_CONFIG.setores[equipamento.setor] || equipamento.setor),
                    escapeCSV(APP_CONFIG.statusEquipamento[equipamento.status]),
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
            let csvPendencias = 'ID Equipamento,Código Equipamento,Nome Equipamento,ID Pendência,Título,Descrição,Responsável,Prioridade,Data,Status,Criado Por,Criado Em\n';
            
            this.equipamentos.forEach(equipamento => {
                equipamento.pendencias.forEach(pendencia => {
                    const escapeCSV = (str) => {
                        if (str === null || str === undefined) return '';
                        const string = String(str);
                        if (string.includes(',') || string.includes('"') || string.includes('\n')) {
                            return `"${string.replace(/"/g, '""')}"`;
                        }
                        return string;
                    };
                    
                    csvPendencias += [
                        equipamento.id,
                        escapeCSV(equipamento.codigo),
                        escapeCSV(equipamento.nome),
                        pendencia.id,
                        escapeCSV(pendencia.titulo),
                        escapeCSV(pendencia.descricao),
                        escapeCSV(pendencia.responsavel),
                        escapeCSV(APP_CONFIG.prioridades[pendencia.prioridade]),
                        pendencia.data,
                        escapeCSV(APP_CONFIG.statusPendencia[pendencia.status]),
                        pendencia.criadoPor || '',
                        pendencia.criadoEm || ''
                    ].join(',') + '\n';
                });
            });
            
            // Criar arquivo ZIP ou CSV
            this.criarArquivoZIP(csvEquipamentos, csvPendencias, dataAtual, usuario);
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('EXPORTAR_DADOS', `Exportou dados para Excel. Equipamentos: ${this.equipamentos.length}, Pendências: ${this.equipamentos.reduce((acc, eqp) => acc + eqp.pendencias.length, 0)}`);
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
        
        // Criar nova mensagem
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-flutuante ${tipo}`;
        mensagem.innerHTML = `
            <div class="mensagem-conteudo">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${texto}</span>
            </div>
        `;
        
        document.body.appendChild(mensagem);
        
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
    const app = new EquipamentosApp();
    window.app = app; // Para depuração
    
    // Configurar tema
    configurarTema();
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
        themeToggle.addEventListener('click', function() {
            const novoTema = window.alternarTema ? window.alternarTema() : 'claro';
            const icon = this.querySelector('i');
            
            if (novoTema === 'escuro') {
                icon.className = 'fas fa-sun';
                themeToggle.title = 'Alternar para tema claro';
            } else {
                icon.className = 'fas fa-moon';
                themeToggle.title = 'Alternar para tema escuro';
            }
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('ALTERAR_TEMA', `Tema alterado para ${novoTema}`);
            }
        });
        
        // Configurar ícone inicial
        const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
        const icon = themeToggle.querySelector('i');
        if (temaAtual === 'escuro') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Alternar para tema claro';
        }
    }
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
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

function configurarTema() {
    // Aplicar tema salvo
    const tema = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    document.documentElement.setAttribute('data-tema', tema);
    
    // Configurar ícone do botão de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (tema === 'escuro') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Alternar para tema claro';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Alternar para tema escuro';
        }
    }
}

// Adicionar estilos CSS dinâmicos se necessário
if (!document.querySelector('#app-estilos-dinamicos')) {
    const estilos = document.createElement('style');
    estilos.id = 'app-estilos-dinamicos';
    estilos.textContent = `
        .user-level-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .nivel-indicator {
            position: fixed;
            top: 10px;
            left: 10px;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.9;
            transition: opacity 0.3s;
        }
        
        .nivel-indicator:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(estilos);
}
