// ===========================================
// SISTEMA DE GESTÃO DE EQUIPAMENTOS - APP PRINCIPAL
// Versão 2.2.0 - Com Filtros Avançados e Correções
// ===========================================

class EquipamentosApp {
    constructor() {
        this.data = null;
        this.equipamentos = [];
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: '',
            dataInicio: null,
            dataFim: null,
            prioridades: [],
            responsaveis: [],
            responsavel: null
        };
        this.filtrosAvancados = {
            criterios: [],
            combinacao: 'E'
        };
        this.equipamentoSelecionado = null;
        this.viewMode = 'grid';
        this.modals = {};
        this.usuarioAtual = null;
        this.nivelUsuario = null;
        this.userId = null;
        this.isSystemAdmin = false;
        this.sugestoesAtuais = [];
        this.sugestaoSelecionada = -1;
        this.modalConfirmacaoCallback = null;
        
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
            this.initFiltrosAvancados();
            
            // 6. Carregar dados
            await this.carregarDados();
            
            // 7. Inicializar interface
            this.renderizarEquipamentos();
            this.atualizarEstatisticas();
            this.atualizarStatusSincronizacao(true);
            this.atualizarContadoresPrioridade();
            this.carregarFiltrosSalvos();
            
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
                this.limparSessao();
                window.location.href = 'login.html?expired=true';
                return false;
            }
            
            // Renovar sessão (extender por mais 8 horas)
            sessaoData.expira = agora + (8 * 60 * 60 * 1000);
            localStorage.setItem('gestao_equipamentos_sessao', JSON.stringify(sessaoData));
            
            return true;
        } catch (e) {
            console.error('Erro ao verificar sessão:', e);
            this.limparSessao();
            window.location.href = 'login.html';
            return false;
        }
    }
    
    limparSessao() {
        ['gestao_equipamentos_sessao', 'gestao_equipamentos_usuario', 
         'gestao_equipamentos_nivel', 'gestao_equipamentos_user_id',
         'gestao_equipamentos_is_system_admin'].forEach(item => localStorage.removeItem(item));
    }
    
    carregarUsuario() {
        this.usuarioAtual = localStorage.getItem('gestao_equipamentos_usuario');
        this.nivelUsuario = localStorage.getItem('gestao_equipamentos_nivel');
        this.userId = localStorage.getItem('gestao_equipamentos_user_id');
        this.isSystemAdmin = localStorage.getItem('gestao_equipamentos_is_system_admin') === 'true';
        
        // Atualizar display do usuário
        this.atualizarDisplayUsuario();
    }
    
    registrarLogin() {
        // Registrar atividade de login
        this.registrarAtividade('LOGIN', `Usuário ${this.usuarioAtual} (${this.getNomeNivel()}) acessou o sistema`);
        
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
            const nivelCor = this.getCorNivel();
            const nivelIcone = this.getIconeNivel();
            
            userElement.innerHTML = `
                <i class="fas ${nivelIcone}"></i>
                <span>${nomeFormatado}</span>
                <span class="user-level-badge" style="background: ${nivelCor}">${nivelNome}</span>
                ${this.isSystemAdmin ? '<span class="system-admin-badge"><i class="fas fa-shield-alt"></i> SISTEMA</span>' : ''}
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
        const icone = this.getIconeNivel();
        
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
        indicador.innerHTML = `<i class="fas ${icone}"></i> ${nomeNivel}`;
        indicador.title = `Nível de acesso: ${nomeNivel}`;
        
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
        
        // Botão de admin - apenas administradores
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.style.display = this.nivelUsuario === 'administrador' ? 'flex' : 'none';
        }
    }
    
    // ================== INICIALIZAÇÃO DE COMPONENTES ==================
    
    initModals() {
        this.modals.equipamento = document.getElementById('equipamento-modal');
        this.modals.pendencia = document.getElementById('pendencia-modal');
        this.modals.detalhes = document.getElementById('detalhes-modal');
        this.modals.confirmacao = document.getElementById('modal-confirmacao');
        
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
        // Filtros básicos
        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.filtros.status = e.target.value;
            this.renderizarEquipamentos();
            this.atualizarIndicadoresFiltros();
        });
        
        document.getElementById('pendencia-filter')?.addEventListener('change', (e) => {
            this.filtros.pendencia = e.target.value;
            this.renderizarEquipamentos();
            this.atualizarIndicadoresFiltros();
        });
        
        document.getElementById('setor-filter')?.addEventListener('change', (e) => {
            this.filtros.setor = e.target.value;
            this.renderizarEquipamentos();
            this.atualizarIndicadoresFiltros();
        });
        
        document.getElementById('search')?.addEventListener('input', (e) => {
            this.filtros.busca = e.target.value.toLowerCase();
            this.renderizarEquipamentos();
            this.atualizarIndicadoresFiltros();
        });
        
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.limparTodosFiltros();
        });
        
        // Botões de ação (com verificação de permissão)
        document.getElementById('add-equipamento')?.addEventListener('click', () => {
            if (this.verificarPermissao('criar_equipamentos')) {
                this.abrirModalEquipamento();
            } else {
                this.mostrarMensagem('Você não tem permissão para criar equipamentos', 'error');
            }
        });
        
        document.getElementById('add-pendencia')?.addEventListener('click', () => {
            if (this.verificarPermissao('criar_pendencias')) {
                this.abrirModalPendencia();
            } else {
                this.mostrarMensagem('Você não tem permissão para criar pendências', 'error');
            }
        });
        
        document.getElementById('export-data')?.addEventListener('click', () => {
            if (this.verificarPermissao('exportar_dados')) {
                this.exportarDadosExcel();
            } else {
                this.mostrarMensagem('Você não tem permissão para exportar dados', 'error');
            }
        });
        
        document.getElementById('manual-sync')?.addEventListener('click', () => {
            this.sincronizarDados();
        });
        
        // Controles de visualização
        document.getElementById('view-list')?.addEventListener('click', () => {
            this.setViewMode('list');
        });
        
        document.getElementById('view-grid')?.addEventListener('click', () => {
            this.setViewMode('grid');
        });
        
        // Formulários
        document.getElementById('equipamento-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEquipamento();
        });
        
        document.getElementById('pendencia-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarPendencia();
        });
        
        // Botões no modal de detalhes
        document.getElementById('editar-equipamento')?.addEventListener('click', () => {
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
        
        document.getElementById('nova-pendencia-detalhes')?.addEventListener('click', () => {
            if (this.equipamentoSelecionado && this.verificarPermissao('criar_pendencias')) {
                this.fecharModal(this.modals.detalhes);
                this.abrirModalPendencia(this.equipamentoSelecionado.id);
            } else {
                this.mostrarMensagem('Selecione um equipamento e tenha permissão para criar pendências', 'error');
            }
        });
        
        // Botões de sistema
        document.getElementById('system-info')?.addEventListener('click', () => {
            if (window.mostrarInfoSistema) {
                window.mostrarInfoSistema();
            }
        });
        
        document.getElementById('export-config')?.addEventListener('click', () => {
            if (window.exportarConfiguracoes) {
                window.exportarConfiguracoes();
            }
        });
    }
    
    // ================== FILTROS AVANÇADOS ==================
    
    initFiltrosAvancados() {
        this.configurarFiltrosRapidos();
        this.configurarBuscaSugestoes();
        this.configurarFiltrosData();
        this.configurarFiltrosPrioridade();
        this.configurarFiltrosResponsavel();
    }
    
    configurarFiltrosRapidos() {
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filtro = btn.dataset.filter;
                this.aplicarFiltroRapido(filtro);
                
                // Marcar como ativo (exceto para "todos")
                document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
                if (filtro !== 'todos') {
                    btn.classList.add('active');
                }
            });
        });
    }
    
    aplicarFiltroRapido(tipo) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const hojeStr = hoje.toISOString().split('T')[0];
        
        switch(tipo) {
            case 'hoje':
                this.filtros.dataInicio = hojeStr;
                this.filtros.dataFim = hojeStr;
                document.getElementById('data-inicio').value = hojeStr;
                document.getElementById('data-fim').value = hojeStr;
                break;
                
            case 'semana': {
                const umaSemanaAtras = new Date(hoje);
                umaSemanaAtras.setDate(hoje.getDate() - 7);
                this.filtros.dataInicio = umaSemanaAtras.toISOString().split('T')[0];
                this.filtros.dataFim = hojeStr;
                document.getElementById('data-inicio').value = this.filtros.dataInicio;
                document.getElementById('data-fim').value = hojeStr;
                break;
            }
            
            case 'mes': {
                const umMesAtras = new Date(hoje);
                umMesAtras.setMonth(hoje.getMonth() - 1);
                this.filtros.dataInicio = umMesAtras.toISOString().split('T')[0];
                this.filtros.dataFim = hojeStr;
                document.getElementById('data-inicio').value = this.filtros.dataInicio;
                document.getElementById('data-fim').value = hojeStr;
                break;
            }
            
            case 'trimestre': {
                const tresMesesAtras = new Date(hoje);
                tresMesesAtras.setMonth(hoje.getMonth() - 3);
                this.filtros.dataInicio = tresMesesAtras.toISOString().split('T')[0];
                this.filtros.dataFim = hojeStr;
                document.getElementById('data-inicio').value = this.filtros.dataInicio;
                document.getElementById('data-fim').value = hojeStr;
                break;
            }
            
            case 'criticos':
                this.filtros.pendencia = 'com-criticas';
                document.getElementById('pendencia-filter').value = 'com-criticas';
                break;
                
            case 'sem-pendencias':
                this.filtros.pendencia = 'sem-pendencia';
                document.getElementById('pendencia-filter').value = 'sem-pendencia';
                break;
                
            case 'minhas-pendencias':
                this.filtros.responsavel = this.usuarioAtual;
                break;
                
            case 'todos':
                // Limpar todos os filtros
                this.limparTodosFiltros();
                return;
        }
        
        this.renderizarEquipamentos();
        this.atualizarIndicadoresFiltros();
    }
    
    configurarBuscaSugestoes() {
        const searchInput = document.getElementById('search');
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!searchInput || !suggestionsContainer) return;
        
        let timeoutId;
        
        searchInput.addEventListener('input', () => {
            clearTimeout(timeoutId);
            const termo = searchInput.value.trim();
            
            if (termo.length < 2) {
                suggestionsContainer.classList.remove('show');
                return;
            }
            
            timeoutId = setTimeout(() => {
                this.buscarSugestoes(termo);
            }, 300);
        });
        
        // Fechar sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestionsContainer.classList.remove('show');
            }
        });
        
        // Navegação por teclado nas sugestões
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navegarSugestoes(e.key);
            } else if (e.key === 'Enter' && suggestionsContainer.classList.contains('show')) {
                e.preventDefault();
                this.selecionarPrimeiraSugestao();
            }
        });
    }
    
    buscarSugestoes(termo) {
        const sugestoes = [];
        const termoLower = termo.toLowerCase();
        
        // Buscar em equipamentos
        this.equipamentos.forEach(equip => {
            if (equip.nome.toLowerCase().includes(termoLower)) {
                sugestoes.push({
                    texto: equip.nome,
                    tipo: 'Equipamento',
                    icone: 'fa-cog',
                    acao: () => this.verDetalhesEquipamento(equip.id)
                });
            }
            if (equip.codigo.toLowerCase().includes(termoLower)) {
                sugestoes.push({
                    texto: equip.codigo,
                    tipo: 'Código',
                    icone: 'fa-barcode',
                    acao: () => this.verDetalhesEquipamento(equip.id)
                });
            }
            if (equip.descricao && equip.descricao.toLowerCase().includes(termoLower)) {
                sugestoes.push({
                    texto: equip.descricao.substring(0, 50) + '...',
                    tipo: 'Descrição',
                    icone: 'fa-align-left',
                    acao: () => this.verDetalhesEquipamento(equip.id)
                });
            }
        });
        
        // Buscar em pendências
        this.equipamentos.forEach(equip => {
            equip.pendencias?.forEach(pend => {
                if (pend.titulo.toLowerCase().includes(termoLower)) {
                    sugestoes.push({
                        texto: pend.titulo,
                        tipo: 'Pendência',
                        icone: 'fa-exclamation-circle',
                        acao: () => {
                            this.equipamentoSelecionado = equip;
                            this.mostrarHistoricoPendencia(pend.id);
                        }
                    });
                }
            });
        });
        
        // Remover duplicatas e limitar
        const sugestoesUnicas = this.removerDuplicatasSugestoes(sugestoes);
        this.mostrarSugestoes(sugestoesUnicas.slice(0, 5));
    }
    
    removerDuplicatasSugestoes(sugestoes) {
        const seen = new Set();
        return sugestoes.filter(sug => {
            const key = `${sug.tipo}-${sug.texto}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    
    mostrarSugestoes(sugestoes) {
        const container = document.getElementById('search-suggestions');
        if (!container) return;
        
        if (sugestoes.length === 0) {
            container.classList.remove('show');
            return;
        }
        
        container.innerHTML = sugestoes.map((sug, index) => `
            <div class="suggestion-item" data-index="${index}" onclick="app.executarSugestao(${index})">
                <i class="fas ${sug.icone}"></i>
                <span class="suggestion-text">${this.escapeHTML(sug.texto)}</span>
                <span class="suggestion-type">${sug.tipo}</span>
            </div>
        `).join('');
        
        container.classList.add('show');
        
        // Armazenar sugestões para navegação
        this.sugestoesAtuais = sugestoes;
        this.sugestaoSelecionada = -1;
    }
    
    executarSugestao(index) {
        if (this.sugestoesAtuais && this.sugestoesAtuais[index]) {
            this.sugestoesAtuais[index].acao();
            document.getElementById('search-suggestions').classList.remove('show');
        }
    }
    
    navegarSugestoes(tecla) {
        const container = document.getElementById('search-suggestions');
        if (!container.classList.contains('show') || !this.sugestoesAtuais) return;
        
        const items = container.querySelectorAll('.suggestion-item');
        
        // Remover seleção anterior
        items.forEach(item => item.classList.remove('selected'));
        
        if (tecla === 'ArrowDown') {
            this.sugestaoSelecionada = Math.min(this.sugestaoSelecionada + 1, items.length - 1);
        } else {
            this.sugestaoSelecionada = Math.max(this.sugestaoSelecionada - 1, 0);
        }
        
        items[this.sugestaoSelecionada]?.classList.add('selected');
        items[this.sugestaoSelecionada]?.scrollIntoView({ block: 'nearest' });
    }
    
    selecionarPrimeiraSugestao() {
        if (this.sugestoesAtuais && this.sugestoesAtuais.length > 0) {
            this.executarSugestao(0);
        }
    }
    
    configurarFiltrosData() {
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.aplicarFiltroPeriodo(btn.dataset.period);
            });
        });
        
        document.getElementById('data-inicio')?.addEventListener('change', () => {
            this.atualizarFiltrosData();
        });
        
        document.getElementById('data-fim')?.addEventListener('change', () => {
            this.atualizarFiltrosData();
        });
    }
    
    aplicarFiltroPeriodo(periodo) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const hojeStr = hoje.toISOString().split('T')[0];
        let dataInicio = new Date(hoje);
        
        switch(periodo) {
            case 'hoje':
                dataInicio = hoje;
                break;
            case 'semana':
                dataInicio.setDate(hoje.getDate() - 7);
                break;
            case 'mes':
                dataInicio.setMonth(hoje.getMonth() - 1);
                break;
            case 'trimestre':
                dataInicio.setMonth(hoje.getMonth() - 3);
                break;
        }
        
        document.getElementById('data-inicio').value = dataInicio.toISOString().split('T')[0];
        document.getElementById('data-fim').value = hojeStr;
        
        this.atualizarFiltrosData();
    }
    
    atualizarFiltrosData() {
        const dataInicio = document.getElementById('data-inicio')?.value;
        const dataFim = document.getElementById('data-fim')?.value;
        
        // Validar se data início é maior que data fim
        if (dataInicio && dataFim && dataInicio > dataFim) {
            this.mostrarMensagem('Data inicial não pode ser maior que data final', 'warning');
            return;
        }
        
        this.filtros.dataInicio = dataInicio || null;
        this.filtros.dataFim = dataFim || null;
        
        this.renderizarEquipamentos();
        this.atualizarIndicadoresFiltros();
    }
    
    configurarFiltrosPrioridade() {
        document.querySelectorAll('.priority-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.filtros.prioridades = Array.from(document.querySelectorAll('.priority-checkbox input:checked'))
                    .map(cb => cb.value);
                this.renderizarEquipamentos();
                this.atualizarIndicadoresFiltros();
            });
        });
    }
    
    configurarFiltrosResponsavel() {
        document.getElementById('filtro-responsavel')?.addEventListener('change', (e) => {
            this.filtros.responsaveis = Array.from(e.target.selectedOptions).map(opt => opt.value);
            this.renderizarEquipamentos();
            this.atualizarIndicadoresFiltros();
        });
    }
    
    // ================== FILTROS SALVOS ==================
    
    carregarFiltrosSalvos() {
        const filtrosSalvos = JSON.parse(localStorage.getItem('gestao_equipamentos_filtros_salvos') || '[]');
        this.renderizarFiltrosSalvos(filtrosSalvos);
    }
    
    renderizarFiltrosSalvos(filtros) {
        const container = document.getElementById('saved-filters');
        if (!container) return;
        
        if (filtros.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--cor-texto-secundario); padding: 10px;">Nenhum filtro salvo</p>';
            return;
        }
        
        container.innerHTML = filtros.map((filtro, index) => {
            const count = this.calcularResultadosFiltro(filtro.criterios);
            
            return `
                <div class="saved-filter-item">
                    <div class="saved-filter-info" onclick="app.aplicarFiltroSalvo(${index})">
                        <i class="fas fa-filter"></i>
                        <span class="saved-filter-name">${this.escapeHTML(filtro.nome)}</span>
                        <span class="saved-filter-count">(${count} resultados)</span>
                    </div>
                    <div class="saved-filter-actions">
                        <button onclick="app.renomearFiltroSalvo(${index})" title="Renomear">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.excluirFiltroSalvo(${index})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    salvarFiltroAtual() {
        const nome = document.getElementById('filter-name')?.value.trim();
        if (!nome) {
            this.mostrarMensagem('Digite um nome para o filtro', 'error');
            return;
        }
        
        const filtrosSalvos = JSON.parse(localStorage.getItem('gestao_equipamentos_filtros_salvos') || '[]');
        
        filtrosSalvos.push({
            nome: nome,
            criterios: { ...this.filtros },
            data: new Date().toISOString()
        });
        
        localStorage.setItem('gestao_equipamentos_filtros_salvos', JSON.stringify(filtrosSalvos));
        this.carregarFiltrosSalvos();
        document.getElementById('filter-name').value = '';
        this.mostrarMensagem('Filtro salvo com sucesso!', 'success');
        this.registrarAtividade('SALVAR_FILTRO', `Salvou filtro: ${nome}`);
    }
    
    aplicarFiltroSalvo(index) {
        const filtrosSalvos = JSON.parse(localStorage.getItem('gestao_equipamentos_filtros_salvos') || '[]');
        const filtro = filtrosSalvos[index];
        
        this.filtros = { ...filtro.criterios };
        
        // Atualizar interface
        this.atualizarInterfaceFiltros();
        this.renderizarEquipamentos();
        this.atualizarIndicadoresFiltros();
        
        this.mostrarMensagem(`Filtro "${filtro.nome}" aplicado`, 'success');
        this.registrarAtividade('APLICAR_FILTRO', `Aplicou filtro: ${filtro.nome}`);
    }
    
    renomearFiltroSalvo(index) {
        const filtrosSalvos = JSON.parse(localStorage.getItem('gestao_equipamentos_filtros_salvos') || '[]');
        const novoNome = prompt('Digite o novo nome para o filtro:', filtrosSalvos[index].nome);
        
        if (novoNome && novoNome.trim()) {
            filtrosSalvos[index].nome = novoNome.trim();
            localStorage.setItem('gestao_equipamentos_filtros_salvos', JSON.stringify(filtrosSalvos));
            this.carregarFiltrosSalvos();
            this.mostrarMensagem('Filtro renomeado com sucesso!', 'success');
        }
    }
    
    excluirFiltroSalvo(index) {
        if (confirm('Tem certeza que deseja excluir este filtro?')) {
            const filtrosSalvos = JSON.parse(localStorage.getItem('gestao_equipamentos_filtros_salvos') || '[]');
            filtrosSalvos.splice(index, 1);
            localStorage.setItem('gestao_equipamentos_filtros_salvos', JSON.stringify(filtrosSalvos));
            this.carregarFiltrosSalvos();
            this.mostrarMensagem('Filtro excluído com sucesso!', 'success');
        }
    }
    
    calcularResultadosFiltro(criterios) {
        const filtrosAntigos = { ...this.filtros };
        this.filtros = { ...criterios };
        const count = this.filtrarEquipamentos().length;
        this.filtros = filtrosAntigos;
        return count;
    }
    
    atualizarInterfaceFiltros() {
        document.getElementById('status-filter').value = this.filtros.status || 'all';
        document.getElementById('pendencia-filter').value = this.filtros.pendencia || 'all';
        document.getElementById('setor-filter').value = this.filtros.setor || 'all';
        document.getElementById('search').value = this.filtros.busca || '';
        document.getElementById('data-inicio').value = this.filtros.dataInicio || '';
        document.getElementById('data-fim').value = this.filtros.dataFim || '';
        
        // Atualizar checkboxes de prioridade
        document.querySelectorAll('.priority-checkbox input').forEach(cb => {
            cb.checked = this.filtros.prioridades?.includes(cb.value) || false;
        });
        
        // Atualizar select de responsáveis
        const selectResponsavel = document.getElementById('filtro-responsavel');
        if (selectResponsavel && this.filtros.responsaveis) {
            Array.from(selectResponsavel.options).forEach(opt => {
                opt.selected = this.filtros.responsaveis.includes(opt.value);
            });
        }
    }
    
    // ================== INDICADORES DE FILTROS ==================
    
    atualizarIndicadoresFiltros() {
        const container = document.getElementById('active-filters');
        const tagsContainer = document.getElementById('filter-tags');
        if (!container || !tagsContainer) return;
        
        const filtrosAtivos = [];
        
        if (this.filtros.status !== 'all') {
            const nome = this.getNomeStatus(this.filtros.status);
            filtrosAtivos.push({ tipo: 'status', valor: this.filtros.status, nome: `Status: ${nome}` });
        }
        
        if (this.filtros.pendencia !== 'all') {
            const nome = this.getNomePendencia(this.filtros.pendencia);
            filtrosAtivos.push({ tipo: 'pendencia', valor: this.filtros.pendencia, nome: `Pendência: ${nome}` });
        }
        
        if (this.filtros.setor !== 'all') {
            const nome = this.getNomeSetor(this.filtros.setor);
            filtrosAtivos.push({ tipo: 'setor', valor: this.filtros.setor, nome: `Setor: ${nome}` });
        }
        
        if (this.filtros.busca) {
            filtrosAtivos.push({ tipo: 'busca', valor: this.filtros.busca, nome: `Busca: "${this.filtros.busca}"` });
        }
        
        // Indicador de data das pendências
        if (this.filtros.dataInicio || this.filtros.dataFim) {
            let periodo = 'Data das Pendências: ';
            if (this.filtros.dataInicio && this.filtros.dataFim) {
                if (this.filtros.dataInicio === this.filtros.dataFim) {
                    periodo += this.formatarData(this.filtros.dataInicio);
                } else {
                    periodo += `de ${this.formatarData(this.filtros.dataInicio)} até ${this.formatarData(this.filtros.dataFim)}`;
                }
            } else if (this.filtros.dataInicio) {
                periodo += `a partir de ${this.formatarData(this.filtros.dataInicio)}`;
            } else if (this.filtros.dataFim) {
                periodo += `até ${this.formatarData(this.filtros.dataFim)}`;
            }
            filtrosAtivos.push({ tipo: 'data', valor: 'periodo', nome: periodo });
        }
        
        if (this.filtros.prioridades?.length > 0) {
            const prioridades = this.filtros.prioridades.map(p => 
                window.APP_CONFIG?.prioridades[p]?.nome || p
            ).join(', ');
            filtrosAtivos.push({ tipo: 'prioridades', valor: 'prioridades', nome: `Prioridades: ${prioridades}` });
        }
        
        if (this.filtros.responsaveis?.length > 0) {
            filtrosAtivos.push({ tipo: 'responsaveis', valor: 'responsaveis', nome: `Responsáveis: ${this.filtros.responsaveis.join(', ')}` });
        }
        
        if (this.filtros.responsavel) {
            filtrosAtivos.push({ tipo: 'responsavel', valor: this.filtros.responsavel, nome: `Minhas pendências` });
        }
        
        if (filtrosAtivos.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        tagsContainer.innerHTML = filtrosAtivos.map(filtro => `
            <span class="filter-tag">
                ${filtro.nome}
                <i class="fas fa-times" onclick="app.removerFiltro('${filtro.tipo}')"></i>
            </span>
        `).join('');
        
        container.style.display = 'flex';
    }
    
    removerFiltro(tipo) {
        switch(tipo) {
            case 'status':
                this.filtros.status = 'all';
                document.getElementById('status-filter').value = 'all';
                break;
            case 'pendencia':
                this.filtros.pendencia = 'all';
                document.getElementById('pendencia-filter').value = 'all';
                break;
            case 'setor':
                this.filtros.setor = 'all';
                document.getElementById('setor-filter').value = 'all';
                break;
            case 'busca':
                this.filtros.busca = '';
                document.getElementById('search').value = '';
                break;
            case 'data':
                this.filtros.dataInicio = null;
                this.filtros.dataFim = null;
                document.getElementById('data-inicio').value = '';
                document.getElementById('data-fim').value = '';
                break;
            case 'prioridades':
                this.filtros.prioridades = [];
                document.querySelectorAll('.priority-checkbox input').forEach(cb => cb.checked = false);
                break;
            case 'responsaveis':
                this.filtros.responsaveis = [];
                const selectResponsavel = document.getElementById('filtro-responsavel');
                if (selectResponsavel) {
                    Array.from(selectResponsavel.options).forEach(opt => opt.selected = false);
                }
                break;
            case 'responsavel':
                this.filtros.responsavel = null;
                // Remover active class do botão "Minhas Pendências"
                document.querySelectorAll('.quick-filter-btn').forEach(btn => {
                    if (btn.dataset.filter === 'minhas-pendencias') {
                        btn.classList.remove('active');
                    }
                });
                break;
        }
        
        this.renderizarEquipamentos();
        this.atualizarIndicadoresFiltros();
    }
    
    limparTodosFiltros() {
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: '',
            dataInicio: null,
            dataFim: null,
            prioridades: [],
            responsaveis: [],
            responsavel: null
        };
        
        this.atualizarInterfaceFiltros();
        this.renderizarEquipamentos();
        this.atualizarIndicadoresFiltros();
        
        // Remover classe active de todos os botões de filtro rápido
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.mostrarMensagem('Todos os filtros foram removidos', 'info');
    }
    
    getNomeStatus(status) {
        return window.APP_CONFIG?.statusEquipamento[status]?.nome || status;
    }
    
    getNomePendencia(pendencia) {
        const nomes = {
            'com-pendencia': 'Com Pendência',
            'sem-pendencia': 'Sem Pendência',
            'com-criticas': 'Com Críticas'
        };
        return nomes[pendencia] || pendencia;
    }
    
    getNomeSetor(setor) {
        return window.APP_CONFIG?.setores[setor]?.nome || setor;
    }
    
    // ================== FUNÇÕES DE DADOS ==================
    
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
                this.atualizarStatusTodosEquipamentos();
                
                // Registrar atividade
                this.registrarAtividade('CARREGAR_DADOS', `Carregou ${this.equipamentos.length} equipamentos do servidor`);
                
                console.log(`Carregados ${this.equipamentos.length} equipamentos do JSONBin`);
            } else {
                // Se não houver dados válidos, usar dados iniciais
                console.log('Usando dados iniciais');
                if (window.INITIAL_DATA) {
                    this.data = window.INITIAL_DATA;
                    this.equipamentos = window.INITIAL_DATA.equipamentos;
                    this.atualizarStatusTodosEquipamentos();
                    
                    this.registrarAtividade('CARREGAR_DADOS', 'Usando dados iniciais do sistema');
                } else {
                    throw new Error('Dados iniciais não encontrados');
                }
            }
            
            this.atualizarStatusSincronizacao(true);
            localStorage.setItem('gestao_equipamentos_ultima_sinc', new Date().toISOString());
            this.atualizarEstadoBotaoPendencia();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            
            // Fallback para dados iniciais
            if (window.INITIAL_DATA) {
                this.data = window.INITIAL_DATA;
                this.equipamentos = window.INITIAL_DATA.equipamentos;
                this.atualizarStatusTodosEquipamentos();
                
                this.atualizarStatusSincronizacao(false);
                this.mostrarMensagem('Erro ao conectar com o servidor. Usando dados locais.', 'error');
                
                this.registrarAtividade('ERRO_CARREGAR', `Erro ao carregar dados: ${error.message}`);
            } else {
                throw error;
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
            localStorage.setItem('gestao_equipamentos_ultima_sinc', new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.atualizarStatusSincronizacao(false);
            this.mostrarMensagem('Erro ao salvar dados no servidor. Alterações podem ser perdidas.', 'error');
            this.registrarAtividade('ERRO_SALVAR', `Erro ao salvar dados: ${error.message}`);
            
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
    
    atualizarStatusTodosEquipamentos() {
        this.equipamentos.forEach((equipamento, index) => {
            this.atualizarStatusEquipamentoPorPendencias(index);
        });
    }
    
    resetarFiltros() {
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: '',
            dataInicio: null,
            dataFim: null,
            prioridades: [],
            responsaveis: [],
            responsavel: null
        };
        
        document.getElementById('status-filter').value = 'all';
        document.getElementById('pendencia-filter').value = 'all';
        document.getElementById('setor-filter').value = 'all';
        document.getElementById('search').value = '';
        document.getElementById('data-inicio').value = '';
        document.getElementById('data-fim').value = '';
        document.querySelectorAll('.priority-checkbox input').forEach(cb => cb.checked = false);
        
        this.renderizarEquipamentos();
        this.atualizarIndicadoresFiltros();
    }
    
    filtrarEquipamentos() {
        return this.equipamentos.filter(equipamento => {
            // Aplicar filtros básicos
            if (!this.filtrarBasico(equipamento)) return false;
            
            // Aplicar filtros avançados
            if (this.filtrosAvancados.criterios.length > 0) {
                return this.aplicarFiltrosAvancados(equipamento);
            }
            
            return true;
        });
    }
    
    filtrarBasico(equipamento) {
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
        
        // Filtrar por data das pendências
        if (this.filtros.dataInicio || this.filtros.dataFim) {
            // Se não houver pendências, não atende ao filtro de data
            if (!equipamento.pendencias || equipamento.pendencias.length === 0) {
                return false;
            }
            
            // Verificar se alguma pendência está dentro do período
            const temPendenciaNoPeriodo = equipamento.pendencias.some(pendencia => {
                // Usar a data da pendência (campo 'data')
                const dataPendencia = pendencia.data;
                if (!dataPendencia) return false;
                
                const data = new Date(dataPendencia);
                data.setHours(0, 0, 0, 0); // Normalizar para início do dia
                
                if (this.filtros.dataInicio) {
                    const dataInicio = new Date(this.filtros.dataInicio);
                    dataInicio.setHours(0, 0, 0, 0);
                    if (data < dataInicio) return false;
                }
                
                if (this.filtros.dataFim) {
                    const dataFim = new Date(this.filtros.dataFim);
                    dataFim.setHours(23, 59, 59, 999); // Final do dia
                    if (data > dataFim) return false;
                }
                
                return true;
            });
            
            if (!temPendenciaNoPeriodo) {
                return false;
            }
        }
        
        // Filtrar por prioridades
        if (this.filtros.prioridades && this.filtros.prioridades.length > 0) {
            const temPrioridade = equipamento.pendencias?.some(p => 
                this.filtros.prioridades.includes(p.prioridade) && 
                (p.status === 'aberta' || p.status === 'em-andamento')
            );
            if (!temPrioridade) return false;
        }
        
        // Filtrar por responsáveis
        if (this.filtros.responsaveis && this.filtros.responsaveis.length > 0) {
            const temResponsavel = equipamento.pendencias?.some(p => 
                this.filtros.responsaveis.includes(p.responsavel) && 
                (p.status === 'aberta' || p.status === 'em-andamento')
            );
            if (!temResponsavel) return false;
        }
        
        // Filtrar por responsável atual (minhas pendências)
        if (this.filtros.responsavel) {
            const minhasPendencias = equipamento.pendencias?.some(p => 
                p.responsavel === this.filtros.responsavel && 
                (p.status === 'aberta' || p.status === 'em-andamento')
            );
            if (!minhasPendencias) return false;
        }
        
        return true;
    }
    
    aplicarFiltrosAvancados(equipamento) {
        const resultados = this.filtrosAvancados.criterios.map(criterio => {
            return this.avaliarCriterio(equipamento, criterio);
        });
        
        if (this.filtrosAvancados.combinacao === 'E') {
            return resultados.every(r => r === true);
        } else {
            return resultados.some(r => r === true);
        }
    }
    
    avaliarCriterio(equipamento, criterio) {
        const { campo, operador, valor } = criterio;
        let valorEquipamento = this.obterValorCampo(equipamento, campo);
        
        switch(operador) {
            case 'igual': return valorEquipamento == valor;
            case 'diferente': return valorEquipamento != valor;
            case 'contem': return String(valorEquipamento).toLowerCase().includes(String(valor).toLowerCase());
            case 'nao_contem': return !String(valorEquipamento).toLowerCase().includes(String(valor).toLowerCase());
            case 'maior_que': return parseFloat(valorEquipamento) > parseFloat(valor);
            case 'menor_que': return parseFloat(valorEquipamento) < parseFloat(valor);
            case 'entre': return valorEquipamento >= valor[0] && valorEquipamento <= valor[1];
            case 'vazio': return !valorEquipamento || valorEquipamento.length === 0;
            case 'nao_vazio': return valorEquipamento && valorEquipamento.length > 0;
            default: return true;
        }
    }
    
    obterValorCampo(equipamento, campo) {
        const campos = {
            'nome': equipamento.nome,
            'codigo': equipamento.codigo,
            'setor': equipamento.setor,
            'status': equipamento.status,
            'ultimaInspecao': equipamento.ultimaInspecao,
            'dataCriacao': equipamento.dataCriacao,
            'criadoPor': equipamento.criadoPor,
            'totalPendencias': equipamento.pendencias?.length || 0,
            'pendenciasAbertas': equipamento.pendencias?.filter(p => p.status === 'aberta').length || 0,
            'pendenciasCriticas': equipamento.pendencias?.filter(p => p.prioridade === 'critica' && p.status !== 'resolvida').length || 0
        };
        return campos[campo];
    }
    
    // ================== RENDERIZAÇÃO ==================
    
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
            return this.renderizarCardEquipamento(equipamento);
        }).join('');
        
        // Adicionar eventos
        this.adicionarEventosCards(container);
        
        // Atualizar estatísticas
        this.atualizarEstatisticas();
        this.atualizarContadoresPrioridade();
        this.atualizarEstatisticasFiltros();
    }
    
    renderizarCardEquipamento(equipamento) {
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
                        <h4>
                            <i class="fas fa-cog" style="color: var(--cor-secundaria);"></i>
                            ${this.escapeHTML(equipamento.nome)}
                        </h4>
                        <div class="equipamento-codigo">${this.escapeHTML(equipamento.codigo)}</div>
                    </div>
                    <div class="status-chip ${equipamento.status}">
                        ${window.APP_CONFIG && window.APP_CONFIG.statusEquipamento ? 
                            window.APP_CONFIG.statusEquipamento[equipamento.status]?.nome || equipamento.status : 
                            equipamento.status}
                        ${temPendenciasCriticasAbertas ? ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>` : ''}
                    </div>
                </div>
                
                <p class="equipamento-descricao">${this.escapeHTML(equipamento.descricao)}</p>
                
                <div class="equipamento-metadata">
                    <div><i class="fas fa-building"></i> ${this.escapeHTML(setorFormatado)}</div>
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
    }
    
    adicionarEventosCards(container) {
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
    
    // ================== ESTATÍSTICAS ==================
    
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
    
    atualizarEstatisticasFiltros() {
        const total = this.equipamentos.length;
        const filtrados = this.filtrarEquipamentos().length;
        const aptos = this.equipamentos.filter(e => e.status === 'apto').length;
        const naoAptos = this.equipamentos.filter(e => e.status === 'nao-apto').length;
        
        document.getElementById('stats-total').textContent = total;
        document.getElementById('stats-filtrados').textContent = filtrados;
        document.getElementById('stats-aptos').textContent = aptos;
        document.getElementById('stats-nao-aptos').textContent = naoAptos;
        
        const percentualApto = total > 0 ? (aptos / total) * 100 : 0;
        document.getElementById('stats-progress-apto').style.width = `${percentualApto}%`;
    }
    
    atualizarContadoresPrioridade() {
        const contadores = {
            critica: 0,
            alta: 0,
            media: 0,
            baixa: 0
        };
        
        this.equipamentos.forEach(equip => {
            equip.pendencias?.forEach(pend => {
                if (pend.status !== 'resolvida' && pend.status !== 'cancelada') {
                    contadores[pend.prioridade] = (contadores[pend.prioridade] || 0) + 1;
                }
            });
        });
        
        document.getElementById('count-critica').textContent = contadores.critica;
        document.getElementById('count-alta').textContent = contadores.alta;
        document.getElementById('count-media').textContent = contadores.media;
        document.getElementById('count-baixa').textContent = contadores.baixa;
    }
    
    // ================== FUNÇÕES DE INTERFACE ==================
    
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
    
    // ================== MODAIS E FORMULÁRIOS ==================
    
    abrirModalEquipamento(equipamentoId = null) {
        const modal = this.modals.equipamento;
        const form = document.getElementById('equipamento-form');
        const titulo = document.getElementById('modal-title').querySelector('span');
        
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
        const titulo = document.getElementById('pendencia-modal-title').querySelector('span');
        
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
            document.getElementById('pendencia-comentario-group').style.display = 'block';
        } else {
            titulo.textContent = 'Nova Pendência';
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
                
                this.registrarAtividade('EDITAR_EQUIPAMENTO', `Editou equipamento: ${equipamento.codigo} - ${equipamento.nome}`);
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
            
            this.registrarAtividade('CRIAR_EQUIPAMENTO', `Criou equipamento: ${equipamento.codigo} - ${equipamento.nome}`);
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
            // Modo edição com histórico
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
                
                this.registrarAtividade('EDITAR_PENDENCIA', `Editou pendência: ${pendencia.titulo} (${Object.keys(alteracoes).length} alterações)`);
                this.mostrarMensagem('Pendência atualizada com sucesso', 'success');
            }
        } else {
            // Modo criação
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
            
            this.registrarAtividade('CRIAR_PENDENCIA', `Criou pendência: ${pendencia.titulo} no equipamento ${this.equipamentos[equipamentoIndex].codigo}`);
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
            this.registrarAtividade('COMENTAR_PENDENCIA', `Comentou na pendência: ${pendencia.titulo}`);
            this.mostrarMensagem('Comentário adicionado com sucesso', 'success');
            return true;
        }
        
        return false;
    }
    
    // ================== DETALHES DO EQUIPAMENTO ==================
    
    verDetalhesEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        
        this.equipamentoSelecionado = equipamento;
        
        // Preencher informações
        document.getElementById('detalhes-titulo').querySelector('span').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `Código: ${equipamento.codigo}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        
        const setorFormatado = window.APP_CONFIG && window.APP_CONFIG.setores ? 
            (window.APP_CONFIG.setores[equipamento.setor]?.nome || equipamento.setor) : 
            equipamento.setor;
        document.getElementById('detalhes-setor').textContent = setorFormatado;
        
        document.getElementById('detalhes-criacao').textContent = this.formatarData(equipamento.dataCriacao);
        document.getElementById('detalhes-criador').textContent = equipamento.criadoPor || 'N/A';
        document.getElementById('detalhes-atualizacao').textContent = this.formatarDataHora(equipamento.ultimaAtualizacao || equipamento.dataCriacao);
        
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
        const pendenciasOrdenadas = this.ordenarPendencias(pendencias);
        
        container.innerHTML = pendenciasOrdenadas.map(pendencia => {
            return this.renderizarPendenciaItem(pendencia);
        }).join('');
        
        // Adicionar eventos
        this.configurarEventosPendencias(container);
    }
    
    ordenarPendencias(pendencias) {
        return [...pendencias].sort((a, b) => {
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
    }
    
    renderizarPendenciaItem(pendencia) {
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
                            ${this.escapeHTML(pendencia.titulo)}
                            <small style="color: var(--cor-texto-secundario); margin-left: 8px;">
                                Criada por: ${this.escapeHTML(pendencia.criadoPor || 'N/A')} em ${criadoEmFormatado}
                            </small>
                        </div>
                        <div class="pendencia-data">
                            <i class="far fa-calendar"></i> ${dataFormatada} 
                            | Prioridade: ${window.APP_CONFIG && window.APP_CONFIG.prioridades ? 
                                window.APP_CONFIG.prioridades[pendencia.prioridade]?.nome || pendencia.prioridade : 
                                pendencia.prioridade}
                            ${foiResolvida ? `| Resolvida por: ${this.escapeHTML(resolvidoPor)} em ${dataResolucao}` : ''}
                        </div>
                        <div class="pendencia-metadata">
                            <small>
                                <i class="fas fa-history"></i> ${totalHistorico} alterações 
                                | Última atualização: ${atualizadoEmFormatado} por ${this.escapeHTML(pendencia.atualizadoPor || pendencia.criadoPor)}
                            </small>
                        </div>
                    </div>
                    <div class="pendencia-badge ${pendencia.status}">
                        ${window.APP_CONFIG && window.APP_CONFIG.statusPendencia ? 
                            window.APP_CONFIG.statusPendencia[pendencia.status]?.nome || pendencia.status : 
                            pendencia.status}
                    </div>
                </div>
                <p class="pendencia-descricao">${this.escapeHTML(pendencia.descricao)}</p>
                <div class="pendencia-footer">
                    <div class="pendencia-responsavel">
                        <i class="fas fa-user"></i> Responsável: ${this.escapeHTML(pendencia.responsavel)}
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
                
                <!-- Seção para adicionar comentário -->
                <div class="comentario-section" id="comentario-${pendencia.id}" style="display: none; margin-top: 10px; padding: 10px; background: var(--cor-fundo-secundario); border-radius: 5px;">
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
    }
    
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
        const titulo = document.getElementById('pendencia-modal-title').querySelector('span');
        
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
        
        const confirmar = await this.mostrarConfirmacao(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir a pendência "${pendencia.titulo}"?`
        );
        
        if (!confirmar) return;
        
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === this.equipamentoSelecionado.id);
        if (equipamentoIndex === -1) return;
        
        // Remover pendência
        this.equipamentos[equipamentoIndex].pendencias = this.equipamentos[equipamentoIndex].pendencias.filter(p => p.id !== pendenciaId);
        
        // Atualizar status do equipamento
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        // Atualizar equipamento selecionado
        this.equipamentoSelecionado = this.equipamentos[equipamentoIndex];
        
        // Registrar atividade
        this.registrarAtividade('EXCLUIR_PENDENCIA', `Excluiu pendência: ${pendencia.titulo} do equipamento ${this.equipamentoSelecionado.codigo}`);
        
        // Salvar dados
        await this.salvarDados();
        
        // Atualizar interface
        this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        this.mostrarMensagem('Pendência excluída com sucesso', 'success');
    }
    
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
                    <h3><i class="fas fa-history"></i> Histórico da Pendência: ${this.escapeHTML(pendencia.titulo)}</h3>
                    <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body" style="overflow-y: auto;">
                    <div class="info-resumo" style="background: var(--cor-fundo-secundario); padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <p><strong>Criada por:</strong> ${this.escapeHTML(pendencia.criadoPor)} em ${this.formatarDataHora(pendencia.criadoEm)}</p>
                        <p><strong>Status atual:</strong> ${pendencia.status}</p>
                        <p><strong>Total de alterações:</strong> ${historico.length}</p>
                        ${pendencia.resolvidoPor ? `<p><strong>Resolvida por:</strong> ${this.escapeHTML(pendencia.resolvidoPor)} em ${this.formatarDataHora(pendencia.dataResolucao)}</p>` : ''}
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
                                            <small>${this.formatarDataHora(item.timestamp)} por ${this.escapeHTML(item.usuario)}</small>
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
                                                <strong>Comentário:</strong> ${this.escapeHTML(item.comentario)}
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
                                            <td style="padding: 8px; border: 1px solid var(--cor-borda);">${this.escapeHTML(item.usuario)}</td>
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
        
        this.registrarAtividade('VISUALIZAR_HISTORICO', `Visualizou histórico da pendência: ${pendencia.titulo}`);
    }
    
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
    
    // ================== CONFIRMAÇÃO ==================
    
    mostrarConfirmacao(titulo, mensagem) {
        return new Promise((resolve) => {
            const modal = this.modals.confirmacao;
            document.getElementById('modal-confirmacao-titulo').innerHTML = 
                `<i class="fas fa-question-circle"></i> ${titulo}`;
            document.getElementById('modal-confirmacao-mensagem').textContent = mensagem;
            
            const confirmarBtn = document.getElementById('modal-confirmacao-confirmar');
            
            const handleConfirmar = () => {
                this.fecharModalConfirmacao();
                resolve(true);
            };
            
            const handleCancelar = () => {
                this.fecharModalConfirmacao();
                resolve(false);
            };
            
            // Remover eventos anteriores
            confirmarBtn.replaceWith(confirmarBtn.cloneNode(true));
            const novoConfirmarBtn = document.getElementById('modal-confirmacao-confirmar');
            
            novoConfirmarBtn.addEventListener('click', handleConfirmar);
            
            this.modalConfirmacaoCallback = {
                confirmar: handleConfirmar,
                cancelar: handleCancelar
            };
            
            modal.classList.add('active');
            
            // Fechar ao clicar no X
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.onclick = handleCancelar;
            
            // Fechar ao clicar fora
            modal.onclick = (e) => {
                if (e.target === modal) handleCancelar();
            };
        });
    }
    
    fecharModalConfirmacao() {
        const modal = this.modals.confirmacao;
        modal.classList.remove('active');
        this.modalConfirmacaoCallback = null;
    }
    
    // ================== FUNÇÕES AUXILIARES ==================
    
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
        
        this.registrarAtividade('SINCRONIZAR', 'Iniciou sincronização manual de dados');
        
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
            this.registrarAtividade('EXPORTAR_DADOS', `Exportou dados para Excel. Equipamentos: ${this.equipamentos.length}, Pendências: ${this.equipamentos.reduce((acc, eqp) => acc + (eqp.pendencias ? eqp.pendencias.length : 0), 0)}`);
            
            this.mostrarMensagem('Dados exportados para Excel com sucesso', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar dados para Excel:', error);
            this.mostrarMensagem('Erro ao exportar dados para Excel', 'error');
            
            this.registrarAtividade('ERRO_EXPORTAR', `Erro ao exportar dados: ${error.message}`);
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
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
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
    
    mostrarMensagem(texto, tipo = 'info') {
        // Remover mensagem anterior
        const mensagemAnterior = document.querySelector('.mensagem-flutuante');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
        // Criar nova mensagem
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-flutuante ${tipo}`;
        
        const icones = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        mensagem.innerHTML = `
            <div class="mensagem-conteudo">
                <i class="fas fa-${icones[tipo] || 'info-circle'}"></i>
                <span>${texto}</span>
            </div>
        `;
        
        document.body.appendChild(mensagem);
        
        setTimeout(() => {
            mensagem.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            mensagem.classList.remove('show');
            setTimeout(() => mensagem.remove(), 300);
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
    
    escapeHTML(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
    
    registrarAtividade(acao, detalhes) {
        if (window.registrarAtividade) {
            window.registrarAtividade(acao, detalhes);
        } else {
            console.log(`[${acao}] ${detalhes}`);
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
                userSessionElement.innerHTML = `<i class="fas fa-clock"></i> Sessão: ${diffHrs}h ${diffMins}m restantes`;
                userSessionElement.style.color = diffHrs < 1 ? '#e74c3c' : '';
            } else {
                userSessionElement.innerHTML = `<i class="fas fa-clock"></i> Sessão expirada`;
                userSessionElement.style.color = '#e74c3c';
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
                
                lastSyncElement.innerHTML = `<i class="fas fa-sync-alt"></i> Última sincronização: ${syncDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
                
                // Destacar se faz mais de 10 minutos
                if (diffMinutos > 10) {
                    lastSyncElement.style.color = '#f39c12';
                } else {
                    lastSyncElement.style.color = '';
                }
                
            } catch (e) {
                lastSyncElement.innerHTML = `<i class="fas fa-sync-alt"></i> Última sincronização: N/A`;
            }
        } else {
            lastSyncElement.innerHTML = `<i class="fas fa-sync-alt"></i> Última sincronização: N/A`;
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
                ['gestao_equipamentos_sessao', 'gestao_equipamentos_usuario', 
                 'gestao_equipamentos_nivel', 'gestao_equipamentos_user_id',
                 'gestao_equipamentos_is_system_admin'].forEach(item => localStorage.removeItem(item));
                
                // Redirecionar para login
                window.location.href = 'login.html?logout=true';
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
                searchInput.select();
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
                    window.app.atualizarIndicadoresFiltros();
                }
            }
        }
    });
}
