// ===========================================
// SISTEMA DE GESTÃO DE EQUIPAMENTOS - APP PRINCIPAL
// Versão 2.3.0 - Com Controle de Linha e Histórico de Acionamentos
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
        
        // NOVAS PROPRIEDADES PARA CONTROLE DE LINHA
        this.tempoUpdateInterval = null;
        this.equipamentosEmLinha = new Set();
        
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
            
            // 7. Garantir IDs únicos após carregar dados
            this.garantirIdsUnicos();
            
            // 8. Inicializar controle de linha
            this.initControleLinha();
            
            // 9. Inicializar interface
            this.renderizarEquipamentos();
            this.atualizarEstatisticas();
            this.atualizarStatusSincronizacao(true);
            this.atualizarContadoresPrioridade();
            this.carregarFiltrosSalvos();
            
            // 10. Configurar atualizações automáticas
            this.configurarAtualizacoes();
            
            console.log('Aplicação inicializada com sucesso');
            
            // 11. Adicionar indicador de nível
            this.adicionarIndicadorNivel();
            
        } catch (error) {
            console.error('Erro na inicialização da aplicação:', error);
            this.mostrarMensagem('Erro ao inicializar aplicação. Recarregue a página.', 'error');
        }
    }
    
    // ================== NOVO: CONTROLE DE LINHA ==================
    
    initControleLinha() {
        // Atualizar equipamentos em linha a cada minuto
        this.tempoUpdateInterval = setInterval(() => {
            this.atualizarTempoOperacao();
        }, 60000); // 1 minuto
        
        // Verificar equipamentos com tempo excessivo
        setInterval(() => {
            this.verificarTempoExcessivo();
        }, 300000); // 5 minutos
    }
    
    atualizarTempoOperacao() {
        let atualizacoes = false;
        
        this.equipamentos.forEach(equip => {
            if (equip.emLinha && equip.emLinha.ativo) {
                // Atualizar tempo total
                equip.emLinha.tempoTotalOperacao += 1; // +1 minuto
                atualizacoes = true;
            }
        });
        
        if (atualizacoes) {
            this.atualizarCardsEquipamentos();
            this.salvarDados();
        }
    }
    
    verificarTempoExcessivo() {
        const limite = window.APP_CONFIG?.controleLinha?.alertaTempoMaximo || 480;
        
        this.equipamentos.forEach(equip => {
            if (equip.emLinha && equip.emLinha.ativo) {
                if (equip.emLinha.tempoTotalOperacao >= limite) {
                    this.mostrarMensagem(
                        `⚠️ ATENÇÃO: ${equip.nome} está em operação há mais de ${Math.floor(limite/60)} horas!`,
                        'warning'
                    );
                    
                    this.registrarAtividade('ALERTA_TEMPO_EXCESSIVO', 
                        `${equip.nome} em operação por ${equip.emLinha.tempoTotalOperacao} minutos`);
                }
            }
        });
    }
    
    async toggleEquipamentoLinha(equipamentoId, justificativa = '') {
        const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
        if (!equipamento) return;
        
        // Verificar permissão
        const podeOperar = this.verificarPermissao('operar_equipamentos');
        
        if (!podeOperar) {
            this.mostrarMensagem('Você não tem permissão para operar equipamentos', 'error');
            return;
        }
        
        // Verificar se equipamento está apto
        if (equipamento.status === 'nao-apto' && !equipamento.emLinha?.ativo) {
            const confirmar = await this.mostrarConfirmacao(
                'Equipamento Não Apto',
                'Este equipamento possui pendências críticas. Deseja torná-lo OPERANTE mesmo assim?'
            );
            if (!confirmar) return;
        }
        
        const novoEstado = !equipamento.emLinha?.ativo;
        const timestamp = new Date().toISOString();
        
        // Validar justificativa para desligamento
        if (!novoEstado && !justificativa && window.APP_CONFIG?.controleLinha?.exigirJustificativaDesligamento) {
            justificativa = await this.solicitarJustificativa();
            if (!justificativa) return;
        }
        
        // Verificar tempo mínimo entre acionamentos
        if (novoEstado && equipamento.emLinha?.ultimoDesligamento) {
            const ultimoDesligamento = new Date(equipamento.emLinha.ultimoDesligamento);
            const agora = new Date();
            const diferencaMinutos = Math.floor((agora - ultimoDesligamento) / (1000 * 60));
            const tempoMinimo = window.APP_CONFIG?.controleLinha?.tempoMinimoEntreAcionamentos || 5;
            
            if (diferencaMinutos < tempoMinimo) {
                const confirmar = await this.mostrarConfirmacao(
                    'Tempo Mínimo não Respeitado',
                    `Aguarde ${tempoMinimo - diferencaMinutos} minutos antes de tornar OPERANTE novamente. Deseja prosseguir mesmo assim?`
                );
                if (!confirmar) return;
            }
        }
        
        // Inicializar estrutura se não existir
        if (!equipamento.emLinha) {
            equipamento.emLinha = {
                ativo: false,
                ultimoAcionamento: null,
                ultimoDesligamento: null,
                tempoTotalOperacao: 0,
                operadorAtual: null
            };
        }
        
        if (!equipamento.historicoAcionamentos) {
            equipamento.historicoAcionamentos = [];
        }
        
        // Atualizar estado
        equipamento.emLinha.ativo = novoEstado;
        
        if (novoEstado) {
            // TORNANDO OPERANTE
            equipamento.emLinha.ultimoAcionamento = timestamp;
            equipamento.emLinha.operadorAtual = this.usuarioAtual;
            this.equipamentosEmLinha.add(equipamentoId);
            
            equipamento.historicoAcionamentos.push({
                tipo: 'LIGADO',
                timestamp: timestamp,
                operador: this.usuarioAtual,
                turno: this.obterTurnoAtual(),
                observacao: justificativa || 'Equipamento tornou-se OPERANTE'
            });
            
            this.registrarAtividade('EQUIPAMENTO_LIGADO', 
                `${equipamento.nome} tornou-se OPERANTE por ${this.usuarioAtual}`);
            
            this.mostrarMensagem(`✅ ${equipamento.nome} agora está OPERANTE`, 'success');
            
        } else {
            // TORNANDO INOPERANTE
            const tempoOperacao = equipamento.emLinha.tempoTotalOperacao || 0;
            equipamento.emLinha.ultimoDesligamento = timestamp;
            equipamento.emLinha.operadorAtual = null;
            this.equipamentosEmLinha.delete(equipamentoId);
            
            equipamento.historicoAcionamentos.push({
                tipo: 'DESLIGADO',
                timestamp: timestamp,
                operador: this.usuarioAtual,
                tempoOperacao: tempoOperacao,
                turno: this.obterTurnoAtual(),
                observacao: justificativa || 'Equipamento tornou-se INOPERANTE'
            });
            
            this.registrarAtividade('EQUIPAMENTO_DESLIGADO', 
                `${equipamento.nome} tornou-se INOPERANTE por ${this.usuarioAtual} (${tempoOperacao} min operação)`);
            
            this.mostrarMensagem(`⏹️ ${equipamento.nome} agora está INOPERANTE`, 'info');
        }
        
        // Salvar dados
        await this.salvarDados();
        
        // Atualizar interface
        this.atualizarCardsEquipamentos();
        
        // Atualizar estatísticas de operação
        this.atualizarEstatisticasOperacao();
    }
    
    obterTurnoAtual() {
        const hora = new Date().getHours();
        
        if (hora >= 6 && hora < 14) return 'TURNO_A';
        if (hora >= 14 && hora < 22) return 'TURNO_B';
        return 'TURNO_C';
    }
    
    solicitarJustificativa() {
        return new Promise((resolve) => {
            const justificativa = prompt('Por favor, informe o motivo da alteração para INOPERANTE:');
            resolve(justificativa ? justificativa.trim() : '');
        });
    }
    
    mostrarHistoricoAcionamentos(equipamentoId) {
        const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
        if (!equipamento) return;
        
        if (!equipamento.historicoAcionamentos) {
            equipamento.historicoAcionamentos = [];
        }
        
        const historico = equipamento.historicoAcionamentos;
        
        // Agrupar por período
        const agora = new Date();
        const ultimas24h = historico.filter(h => {
            const data = new Date(h.timestamp);
            return (agora - data) <= 24 * 60 * 60 * 1000;
        });
        
        const ultimaSemana = historico.filter(h => {
            const data = new Date(h.timestamp);
            return (agora - data) <= 7 * 24 * 60 * 60 * 1000;
        });
        
        const tempoTotalHoras = Math.floor((equipamento.emLinha?.tempoTotalOperacao || 0) / 60);
        const tempoTotalMinutos = (equipamento.emLinha?.tempoTotalOperacao || 0) % 60;
        
        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'historico-acionamentos-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 80vh;">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> Histórico de Acionamentos - ${this.escapeHTML(equipamento.nome)}</h3>
                    <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body" style="overflow-y: auto;">
                    <div class="historico-stats" style="display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 20px;">
                        <div class="stat-card" style="background: var(--cor-fundo-secundario); padding: 15px; border-radius: 5px; text-align: center;">
                            <i class="fas fa-bolt" style="color: #27ae60; font-size: 20px;"></i>
                            <div style="font-size: 24px; font-weight: bold;">${historico.filter(h => h.tipo === 'LIGADO').length}</div>
                            <div style="font-size: 12px;">Operante</div>
                        </div>
                        <div class="stat-card" style="background: var(--cor-fundo-secundario); padding: 15px; border-radius: 5px; text-align: center;">
                            <i class="fas fa-power-off" style="color: #e74c3c; font-size: 20px;"></i>
                            <div style="font-size: 24px; font-weight: bold;">${historico.filter(h => h.tipo === 'DESLIGADO').length}</div>
                            <div style="font-size: 12px;">Inoperante</div>
                        </div>
                        <div class="stat-card" style="background: var(--cor-fundo-secundario); padding: 15px; border-radius: 5px; text-align: center;">
                            <i class="fas fa-clock" style="color: #f39c12; font-size: 20px;"></i>
                            <div style="font-size: 24px; font-weight: bold;">${tempoTotalHoras}h ${tempoTotalMinutos}min</div>
                            <div style="font-size: 12px;">Tempo Total</div>
                        </div>
                        <div class="stat-card" style="background: var(--cor-fundo-secundario); padding: 15px; border-radius: 5px; text-align: center;">
                            <i class="fas fa-calendar" style="color: #3498db; font-size: 20px;"></i>
                            <div style="font-size: 24px; font-weight: bold;">${ultimas24h.length}</div>
                            <div style="font-size: 12px;">Últimas 24h</div>
                        </div>
                    </div>
                    
                    <div class="historico-tabs" style="display: flex; gap: 5px; border-bottom: 1px solid var(--cor-borda); padding-bottom: 10px; margin-bottom: 20px;">
                        <button class="tab-btn active" onclick="document.querySelectorAll('.tab-pane').forEach(p => p.style.display='none'); document.getElementById('tab-todos').style.display='block'; this.classList.add('active'); document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); this.classList.add('active');">Todos</button>
                        <button class="tab-btn" onclick="document.querySelectorAll('.tab-pane').forEach(p => p.style.display='none'); document.getElementById('tab-ultimas24h').style.display='block'; document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); this.classList.add('active');">Últimas 24h</button>
                        <button class="tab-btn" onclick="document.querySelectorAll('.tab-pane').forEach(p => p.style.display='none'); document.getElementById('tab-semana').style.display='block'; document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); this.classList.add('active');">Última Semana</button>
                    </div>
                    
                    <div id="tab-todos" class="tab-pane" style="display: block;">
                        ${this.renderizarTabelaHistorico(historico)}
                    </div>
                    
                    <div id="tab-ultimas24h" class="tab-pane" style="display: none;">
                        ${this.renderizarTabelaHistorico(ultimas24h)}
                    </div>
                    
                    <div id="tab-semana" class="tab-pane" style="display: none;">
                        ${this.renderizarTabelaHistorico(ultimaSemana)}
                    </div>
                    
                    <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="app.exportarHistoricoAcionamentos(${equipamentoId})" class="btn-secondary">
                            <i class="fas fa-download"></i> Exportar Histórico (CSV)
                        </button>
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
        
        this.registrarAtividade('VISUALIZAR_HISTORICO_ACIONAMENTOS', 
            `Visualizou histórico de acionamentos do equipamento ${equipamento.nome}`);
    }
    
    renderizarTabelaHistorico(historico) {
        if (!historico || historico.length === 0) {
            return '<p style="text-align: center; padding: 40px; color: var(--cor-texto-secundario);"><i class="fas fa-info-circle"></i> Nenhum registro neste período</p>';
        }
        
        return `
            <table class="historico-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: var(--cor-fundo-secundario);">
                        <th style="padding: 10px; border-bottom: 2px solid var(--cor-borda); text-align: left;">Data/Hora</th>
                        <th style="padding: 10px; border-bottom: 2px solid var(--cor-borda); text-align: left;">Ação</th>
                        <th style="padding: 10px; border-bottom: 2px solid var(--cor-borda); text-align: left;">Operador</th>
                        <th style="padding: 10px; border-bottom: 2px solid var(--cor-borda); text-align: left;">Turno</th>
                        <th style="padding: 10px; border-bottom: 2px solid var(--cor-borda); text-align: left;">Tempo</th>
                        <th style="padding: 10px; border-bottom: 2px solid var(--cor-borda); text-align: left;">Observação</th>
                    </tr>
                </thead>
                <tbody>
                    ${historico.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(h => {
                        const data = new Date(h.timestamp);
                        const dataStr = data.toLocaleDateString('pt-BR');
                        const horaStr = data.toLocaleTimeString('pt-BR');
                        
                        let acaoClass = '';
                        let acaoIcon = '';
                        let acaoTexto = '';
                        
                        if (h.tipo === 'LIGADO') {
                            acaoClass = 'status-chip apto';
                            acaoIcon = 'fa-bolt';
                            acaoTexto = 'OPERANTE';
                        } else if (h.tipo === 'DESLIGADO') {
                            acaoClass = 'status-chip nao-apto';
                            acaoIcon = 'fa-power-off';
                            acaoTexto = 'INOPERANTE';
                        } else {
                            acaoClass = 'status-chip cancelada';
                            acaoIcon = 'fa-flag';
                            acaoTexto = 'MARCO';
                        }
                        
                        const tempoFormatado = h.tempoOperacao ? 
                            `${Math.floor(h.tempoOperacao / 60)}h ${h.tempoOperacao % 60}min` : '-';
                        
                        return `
                            <tr style="border-bottom: 1px solid var(--cor-borda);">
                                <td style="padding: 8px;">${dataStr} ${horaStr}</td>
                                <td style="padding: 8px;">
                                    <span class="${acaoClass}" style="display: inline-flex; align-items: center; gap: 5px;">
                                        <i class="fas ${acaoIcon}"></i> ${acaoTexto}
                                    </span>
                                </td>
                                <td style="padding: 8px;">${this.escapeHTML(h.operador)}</td>
                                <td style="padding: 8px;">${h.turno || '-'}</td>
                                <td style="padding: 8px;">${tempoFormatado}</td>
                                <td style="padding: 8px;">${h.observacao || '-'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }
    
    exportarHistoricoAcionamentos(equipamentoId) {
        const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
        if (!equipamento || !equipamento.historicoAcionamentos) return;
        
        let csv = 'Data,Hora,Ação,Operador,Turno,Tempo Operação (min),Observação\n';
        
        equipamento.historicoAcionamentos.forEach(h => {
            const data = new Date(h.timestamp);
            const dataStr = data.toLocaleDateString('pt-BR');
            const horaStr = data.toLocaleTimeString('pt-BR');
            
            const acao = h.tipo === 'LIGADO' ? 'OPERANTE' : (h.tipo === 'DESLIGADO' ? 'INOPERANTE' : h.tipo);
            
            csv += [
                dataStr,
                horaStr,
                acao,
                h.operador,
                h.turno || '',
                h.tempoOperacao || '',
                `"${(h.observacao || '').replace(/"/g, '""')}"`
            ].join(',') + '\n';
        });
        
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const fileName = `historico_${equipamento.nome}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        
        this.registrarAtividade('EXPORTAR_HISTORICO_ACIONAMENTOS', 
            `Exportou histórico de acionamentos do equipamento ${equipamento.nome}`);
        
        this.mostrarMensagem('Histórico exportado com sucesso!', 'success');
    }
    
    atualizarEstatisticasOperacao() {
        const stats = {
            emLinha: this.equipamentos.filter(e => e.emLinha?.ativo).length,
            tempoTotal: this.equipamentos.reduce((acc, e) => acc + (e.emLinha?.tempoTotalOperacao || 0), 0),
            ligacoesHoje: 0
        };
        
        const hoje = new Date().toDateString();
        this.equipamentos.forEach(e => {
            if (e.historicoAcionamentos) {
                stats.ligacoesHoje += e.historicoAcionamentos.filter(h => {
                    return h.tipo === 'LIGADO' && new Date(h.timestamp).toDateString() === hoje;
                }).length;
            }
        });
        
        // Atualizar interface se houver elementos específicos
        const statsElement = document.getElementById('operacao-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div><i class="fas fa-bolt"></i> ${stats.emLinha} operante(s)</div>
                <div><i class="fas fa-clock"></i> ${Math.floor(stats.tempoTotal / 60)}h totais</div>
                <div><i class="fas fa-power-off"></i> ${stats.ligacoesHoje} ligações hoje</div>
            `;
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
            
            if (agora > sessaoData.expira) {
                this.limparSessao();
                window.location.href = 'login.html?expired=true';
                return false;
            }
            
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
        
        this.atualizarDisplayUsuario();
    }
    
    registrarLogin() {
        this.registrarAtividade('LOGIN', `Usuário ${this.usuarioAtual} (${this.getNomeNivel()}) acessou o sistema`);
        localStorage.setItem('gestao_equipamentos_ultimo_acesso', new Date().toISOString());
    }
    
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
        if (!window.APP_CONFIG || !window.APP_CONFIG.appSettings.mostrarIndicadorNivel) {
            return;
        }
        
        const cor = this.getCorNivel();
        const nomeNivel = this.getNomeNivel();
        const icone = this.getIconeNivel();
        
        const indicadorAnterior = document.querySelector('.nivel-indicator');
        if (indicadorAnterior) {
            indicadorAnterior.remove();
        }
        
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
        const addEquipamentoBtn = document.getElementById('add-equipamento');
        if (addEquipamentoBtn) {
            const podeCriar = this.verificarPermissao('criar_equipamentos');
            addEquipamentoBtn.style.display = podeCriar ? 'flex' : 'none';
            addEquipamentoBtn.title = podeCriar ? 'Adicionar novo equipamento' : 'Sem permissão para criar equipamentos';
        }
        
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            const podeExportar = this.verificarPermissao('exportar_dados');
            exportDataBtn.style.display = podeExportar ? 'flex' : 'none';
            exportDataBtn.title = podeExportar ? 'Exportar dados para Excel' : 'Sem permissão para exportar dados';
        }
        
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
        
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.fecharTodosModais();
            });
        });
        
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.fecharTodosModais();
            }
        });
    }
    
    initEvents() {
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
        
        document.getElementById('view-list')?.addEventListener('click', () => {
            this.setViewMode('list');
        });
        
        document.getElementById('view-grid')?.addEventListener('click', () => {
            this.setViewMode('grid');
        });
        
        document.getElementById('equipamento-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEquipamento();
        });
        
        document.getElementById('pendencia-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarPendencia();
        });
        
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
    
    // ================== GARANTIA DE IDS ÚNICOS ==================

    garantirIdsUnicos() {
        if (!this.equipamentos || this.equipamentos.length === 0) return;
        
        const ids = new Set();
        const duplicados = [];
        
        this.equipamentos.forEach((equip, index) => {
            if (ids.has(equip.id)) {
                duplicados.push(index);
            } else {
                ids.add(equip.id);
            }
        });
        
        if (duplicados.length > 0) {
            console.warn(`Encontrados ${duplicados.length} equipamentos com ID duplicado. Corrigindo...`);
            
            let maxId = Math.max(...this.equipamentos.map(e => e.id));
            
            duplicados.forEach(index => {
                maxId++;
                this.equipamentos[index].id = maxId;
            });
            
            if (this.data) {
                this.data.nextEquipamentoId = maxId + 1;
            }
            
            this.mostrarMensagem(`${duplicados.length} IDs duplicados foram corrigidos`, 'info');
        }
        
        if (this.equipamentos.length > 0) {
            const maxId = Math.max(...this.equipamentos.map(e => e.id));
            if (!this.data) this.data = {};
            if (!this.data.nextEquipamentoId || this.data.nextEquipamentoId <= maxId) {
                this.data.nextEquipamentoId = maxId + 1;
                console.log(`nextEquipamentoId ajustado para: ${this.data.nextEquipamentoId}`);
            }
        }
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
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestionsContainer.classList.remove('show');
            }
        });
        
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
        
        this.equipamentos.forEach(equip => {
            if (equip.nome.toLowerCase().includes(termoLower)) {
                sugestoes.push({
                    texto: equip.nome,
                    tipo: 'Equipamento',
                    icone: 'fa-cog',
                    acao: () => this.verDetalhesEquipamento(equip.id)
                });
            }
            
            if (equip.id.toString().includes(termoLower)) {
                sugestoes.push({
                    texto: `ID: ${equip.id} - ${equip.nome}`,
                    tipo: 'ID',
                    icone: 'fa-hashtag',
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
        
        document.querySelectorAll('.priority-checkbox input').forEach(cb => {
            cb.checked = this.filtros.prioridades?.includes(cb.value) || false;
        });
        
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
                
                // Garantir estrutura de controle de linha para equipamentos antigos
                this.equipamentos.forEach(equip => {
                    if (!equip.emLinha) {
                        equip.emLinha = {
                            ativo: false,
                            ultimoAcionamento: null,
                            ultimoDesligamento: null,
                            tempoTotalOperacao: 0,
                            operadorAtual: null
                        };
                    }
                    if (!equip.historicoAcionamentos) {
                        equip.historicoAcionamentos = [];
                    }
                });
                
                if (!this.data.nextEquipamentoId && this.equipamentos.length > 0) {
                    const maxId = Math.max(...this.equipamentos.map(e => e.id));
                    this.data.nextEquipamentoId = maxId + 1;
                } else if (!this.data.nextEquipamentoId) {
                    this.data.nextEquipamentoId = 1;
                }
                
                this.atualizarStatusTodosEquipamentos();
                
                this.registrarAtividade('CARREGAR_DADOS', `Carregou ${this.equipamentos.length} equipamentos do servidor`);
                
                console.log(`Carregados ${this.equipamentos.length} equipamentos do JSONBin`);
            } else {
                console.log('Usando dados iniciais');
                if (window.INITIAL_DATA) {
                    this.data = window.INITIAL_DATA;
                    this.equipamentos = window.INITIAL_DATA.equipamentos;
                    
                    // Garantir estrutura de controle de linha
                    this.equipamentos.forEach(equip => {
                        if (!equip.emLinha) {
                            equip.emLinha = {
                                ativo: false,
                                ultimoAcionamento: null,
                                ultimoDesligamento: null,
                                tempoTotalOperacao: 0,
                                operadorAtual: null
                            };
                        }
                        if (!equip.historicoAcionamentos) {
                            equip.historicoAcionamentos = [];
                        }
                    });
                    
                    if (!this.data.nextEquipamentoId && this.equipamentos.length > 0) {
                        const maxId = Math.max(...this.equipamentos.map(e => e.id));
                        this.data.nextEquipamentoId = maxId + 1;
                    }
                    
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
            
            if (window.INITIAL_DATA) {
                this.data = window.INITIAL_DATA;
                this.equipamentos = window.INITIAL_DATA.equipamentos;
                
                // Garantir estrutura de controle de linha
                this.equipamentos.forEach(equip => {
                    if (!equip.emLinha) {
                        equip.emLinha = {
                            ativo: false,
                            ultimoAcionamento: null,
                            ultimoDesligamento: null,
                            tempoTotalOperacao: 0,
                            operadorAtual: null
                        };
                    }
                    if (!equip.historicoAcionamentos) {
                        equip.historicoAcionamentos = [];
                    }
                });
                
                if (!this.data.nextEquipamentoId && this.equipamentos.length > 0) {
                    const maxId = Math.max(...this.equipamentos.map(e => e.id));
                    this.data.nextEquipamentoId = maxId + 1;
                }
                
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
            if (!this.filtrarBasico(equipamento)) return false;
            
            if (this.filtrosAvancados.criterios.length > 0) {
                return this.aplicarFiltrosAvancados(equipamento);
            }
            
            return true;
        });
    }
    
    filtrarBasico(equipamento) {
        if (this.filtros.status !== 'all' && equipamento.status !== this.filtros.status) {
            return false;
        }
        
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
        
        if (this.filtros.setor !== 'all' && equipamento.setor !== this.filtros.setor) {
            return false;
        }
        
        if (this.filtros.busca) {
            const busca = this.filtros.busca.toLowerCase();
            const nomeMatch = equipamento.nome.toLowerCase().includes(busca);
            const idMatch = equipamento.id.toString().includes(busca);
            const descricaoMatch = equipamento.descricao.toLowerCase().includes(busca);
            
            if (!nomeMatch && !idMatch && !descricaoMatch) {
                return false;
            }
        }
        
        if (this.filtros.dataInicio || this.filtros.dataFim) {
            if (!equipamento.pendencias || equipamento.pendencias.length === 0) {
                return false;
            }
            
            const temPendenciaNoPeriodo = equipamento.pendencias.some(pendencia => {
                const dataPendencia = pendencia.data;
                if (!dataPendencia) return false;
                
                const data = new Date(dataPendencia);
                data.setHours(0, 0, 0, 0);
                
                if (this.filtros.dataInicio) {
                    const dataInicio = new Date(this.filtros.dataInicio);
                    dataInicio.setHours(0, 0, 0, 0);
                    if (data < dataInicio) return false;
                }
                
                if (this.filtros.dataFim) {
                    const dataFim = new Date(this.filtros.dataFim);
                    dataFim.setHours(23, 59, 59, 999);
                    if (data > dataFim) return false;
                }
                
                return true;
            });
            
            if (!temPendenciaNoPeriodo) {
                return false;
            }
        }
        
        if (this.filtros.prioridades && this.filtros.prioridades.length > 0) {
            const temPrioridade = equipamento.pendencias?.some(p => 
                this.filtros.prioridades.includes(p.prioridade) && 
                (p.status === 'aberta' || p.status === 'em-andamento')
            );
            if (!temPrioridade) return false;
        }
        
        if (this.filtros.responsaveis && this.filtros.responsaveis.length > 0) {
            const temResponsavel = equipamento.pendencias?.some(p => 
                this.filtros.responsaveis.includes(p.responsavel) && 
                (p.status === 'aberta' || p.status === 'em-andamento')
            );
            if (!temResponsavel) return false;
        }
        
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
            'id': equipamento.id,
            'nome': equipamento.nome,
            'setor': equipamento.setor,
            'status': equipamento.status,
            'ultimaInspecao': equipamento.ultimaInspecao,
            'dataCriacao': equipamento.dataCriacao,
            'criadoPor': equipamento.criadoPor,
            'totalPendencias': equipamento.pendencias?.length || 0,
            'pendenciasAbertas': equipamento.pendencias?.filter(p => p.status === 'aberta').length || 0,
            'pendenciasCriticas': equipamento.pendencias?.filter(p => p.prioridade === 'critica' && p.status !== 'resolvida').length || 0,
            // NOVO: Campos de operação
            'emLinha': equipamento.emLinha?.ativo || false,
            'tempoOperacao': equipamento.emLinha?.tempoTotalOperacao || 0
        };
        return campos[campo];
    }
    
    // ================== RENDERIZAÇÃO ==================
    
    renderizarEquipamentos() {
        const container = document.getElementById('equipamentos-container');
        const equipamentosFiltrados = this.filtrarEquipamentos();
        
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
        
        this.adicionarEventosCards(container);
        
        this.atualizarEstatisticas();
        this.atualizarContadoresPrioridade();
        this.atualizarEstatisticasFiltros();
        this.atualizarEstatisticasOperacao();
    }
    
    atualizarCardsEquipamentos() {
        const container = document.getElementById('equipamentos-container');
        if (!container) return;
        
        const equipamentosFiltrados = this.filtrarEquipamentos();
        
        container.innerHTML = equipamentosFiltrados.map(equipamento => {
            return this.renderizarCardEquipamento(equipamento);
        }).join('');
        
        this.adicionarEventosCards(container);
    }
    
    renderizarCardEquipamento(equipamento) {
        const temPendenciasAtivas = equipamento.pendencias && equipamento.pendencias.some(p => 
            p.status === 'aberta' || p.status === 'em-andamento'
        );
        
        const temPendenciasCriticasAbertas = equipamento.pendencias && equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        
        // Dados de controle de linha
        const operante = equipamento.emLinha?.ativo || false;
        const tempoOperacao = equipamento.emLinha?.tempoTotalOperacao || 0;
        const horasOperacao = Math.floor(tempoOperacao / 60);
        const minutosOperacao = tempoOperacao % 60;
        const tempoExcessivo = operante && tempoOperacao >= (window.APP_CONFIG?.controleLinha?.alertaTempoMaximo || 480);
        
        const podeOperar = this.verificarPermissao('operar_equipamentos');
        
        let classesCard = 'equipamento-card';
        if (equipamento.status === 'nao-apto') classesCard += ' nao-apto';
        if (temPendenciasAtivas) classesCard += ' com-pendencia';
        if (temPendenciasCriticasAbertas) classesCard += ' critica';
        if (operante) classesCard += ' operante';
        
        const dataInspecao = equipamento.ultimaInspecao ? 
            this.formatarData(equipamento.ultimaInspecao) : 
            'Não registrada';
        
        const setorFormatado = window.APP_CONFIG && window.APP_CONFIG.setores ? 
            (window.APP_CONFIG.setores[equipamento.setor]?.nome || equipamento.setor) : 
            equipamento.setor;
        
        const pendencias = equipamento.pendencias || [];
        const pendenciasAbertas = pendencias.filter(p => p.status === 'aberta').length;
        const pendenciasAndamento = pendencias.filter(p => p.status === 'em-andamento').length;
        const pendenciasResolvidas = pendencias.filter(p => p.status === 'resolvida').length;
        const pendenciasCriticas = pendencias.filter(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        ).length;
        
        const podeCriarPendencia = this.verificarPermissao('criar_pendencias');
        
        return `
            <div class="${classesCard}" data-id="${equipamento.id}">
                <div class="equipamento-header">
                    <div class="equipamento-info">
                        <h4>
                            <i class="fas fa-cog" style="color: var(--cor-secundaria);"></i>
                            ${this.escapeHTML(equipamento.nome)}
                        </h4>
                        <div class="equipamento-codigo">
                            <i class="fas fa-hashtag"></i> ID: ${equipamento.id}
                        </div>
                    </div>
                    <div class="status-chip ${equipamento.status}">
                        ${window.APP_CONFIG?.statusEquipamento[equipamento.status]?.nome || equipamento.status}
                        ${temPendenciasCriticasAbertas ? ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>` : ''}
                    </div>
                </div>
                
                <!-- CHAVE TOGGLE SIMPLES: OPERANTE / INOPERANTE -->
                <div class="toggle-container">
                    <button class="toggle-btn ${operante ? 'active' : ''}" 
                            onclick="app.toggleEquipamentoLinha(${equipamento.id})"
                            ${!podeOperar ? 'disabled title="Sem permissão para operar equipamentos"' : ''}
                            ${equipamento.status === 'nao-apto' && !operante ? 'title="Equipamento não apto"' : ''}>
                        <i class="fas ${operante ? 'fa-bolt' : 'fa-power-off'}"></i>
                        <span>${operante ? 'OPERANTE' : 'INOPERANTE'}</span>
                    </button>
                    
                    ${operante ? `
                        <div class="tempo-operacao">
                            <i class="fas fa-clock"></i>
                            <span>${horasOperacao}h ${minutosOperacao}min</span>
                            <small>desde ${this.formatarHora(equipamento.emLinha.ultimoAcionamento)}</small>
                        </div>
                    ` : ''}
                    
                    ${equipamento.emLinha?.ultimoDesligamento ? `
                        <div class="ultimo-desligamento">
                            <small>Último inoperante: ${this.formatarDataHora(equipamento.emLinha.ultimoDesligamento)}</small>
                        </div>
                    ` : ''}
                </div>
                
                ${equipamento.historicoAcionamentos && equipamento.historicoAcionamentos.length > 0 ? `
                    <button class="historico-btn" onclick="app.mostrarHistoricoAcionamentos(${equipamento.id})" title="Ver histórico de acionamentos">
                        <i class="fas fa-history"></i> ${equipamento.historicoAcionamentos.length} acionamentos
                    </button>
                ` : ''}
                
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
        const operantes = this.equipamentos.filter(e => e.emLinha?.ativo).length;
        
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
        
        // Adicionar estatística de equipamentos operantes
        const operantesElement = document.getElementById('operantes');
        if (operantesElement) {
            operantesElement.textContent = operantes;
        }
        
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
            const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
            if (!equipamento) return;
            
            titulo.textContent = 'Editar Equipamento';
            
            document.getElementById('equipamento-nome').value = equipamento.nome;
            document.getElementById('equipamento-descricao').value = equipamento.descricao;
            document.getElementById('equipamento-setor').value = equipamento.setor;
            document.getElementById('equipamento-ultima-inspecao').value = equipamento.ultimaInspecao || '';
            
            this.atualizarDisplayStatusEquipamento(equipamento);
            
            form.dataset.editId = equipamentoId;
        } else {
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
        
        if (!this.data) {
            this.data = { nextEquipamentoId: 1 };
        }
        
        const equipamento = {
            nome: document.getElementById('equipamento-nome').value.trim(),
            descricao: document.getElementById('equipamento-descricao').value.trim(),
            setor: document.getElementById('equipamento-setor').value,
            status: 'apto',
            ultimaInspecao: document.getElementById('equipamento-ultima-inspecao').value || null,
            pendencias: [],
            // NOVO: Inicializar estrutura de controle de linha
            emLinha: {
                ativo: false,
                ultimoAcionamento: null,
                ultimoDesligamento: null,
                tempoTotalOperacao: 0,
                operadorAtual: null
            },
            historicoAcionamentos: []
        };
        
        if (!equipamento.nome) {
            this.mostrarMensagem('Nome do equipamento é obrigatório', 'error');
            return;
        }
        
        if (isEdit) {
            const id = parseInt(isEdit);
            const index = this.equipamentos.findIndex(e => e.id === id);
            
            if (index !== -1) {
                equipamento.id = id;
                equipamento.pendencias = this.equipamentos[index].pendencias || [];
                equipamento.dataCriacao = this.equipamentos[index].dataCriacao;
                equipamento.criadoPor = this.equipamentos[index].criadoPor || this.usuarioAtual;
                
                // Manter dados de controle de linha existentes
                equipamento.emLinha = this.equipamentos[index].emLinha || {
                    ativo: false,
                    ultimoAcionamento: null,
                    ultimoDesligamento: null,
                    tempoTotalOperacao: 0,
                    operadorAtual: null
                };
                equipamento.historicoAcionamentos = this.equipamentos[index].historicoAcionamentos || [];
                
                const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                );
                equipamento.status = temPendenciasCriticasAbertas ? 'nao-apto' : 'apto';
                
                this.equipamentos[index] = equipamento;
                
                this.registrarAtividade('EDITAR_EQUIPAMENTO', `Editou equipamento: ${equipamento.nome} (ID: ${equipamento.id})`);
                this.mostrarMensagem('Equipamento atualizado com sucesso', 'success');
            }
        } else {
            let nextId = 1;
            
            if (this.equipamentos && this.equipamentos.length > 0) {
                const maxId = Math.max(...this.equipamentos.map(e => e.id));
                nextId = maxId + 1;
            }
            
            if (this.data && this.data.nextEquipamentoId) {
                nextId = Math.max(nextId, this.data.nextEquipamentoId);
            }
            
            equipamento.id = nextId;
            equipamento.dataCriacao = new Date().toISOString().split('T')[0];
            equipamento.criadoPor = this.usuarioAtual;
            
            this.equipamentos.push(equipamento);
            
            this.data.nextEquipamentoId = nextId + 1;
            
            this.registrarAtividade('CRIAR_EQUIPAMENTO', `Criou equipamento: ${equipamento.nome} (ID: ${equipamento.id})`);
            this.mostrarMensagem(`Equipamento criado com sucesso! ID: ${equipamento.id}`, 'success');
        }
        
        const salvou = await this.salvarDados();
        
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
        
        if (!pendencia.titulo || !pendencia.descricao || !pendencia.responsavel) {
            this.mostrarMensagem('Título, descrição e responsável são obrigatórios', 'error');
            return;
        }
        
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === equipamentoId);
        if (equipamentoIndex === -1) {
            this.mostrarMensagem('Equipamento não encontrado', 'error');
            return;
        }
        
        if (!this.equipamentos[equipamentoIndex].pendencias) {
            this.equipamentos[equipamentoIndex].pendencias = [];
        }
        
        if (isEdit) {
            const pendenciaId = parseInt(isEdit);
            const pendenciaIndex = this.equipamentos[equipamentoIndex].pendencias.findIndex(p => p.id === pendenciaId);
            
            if (pendenciaIndex !== -1) {
                const pendenciaAntiga = this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex];
                
                const statusAlterado = pendenciaAntiga.status !== pendencia.status;
                
                if (!pendenciaAntiga.historico) {
                    pendenciaAntiga.historico = [];
                }
                
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
                    
                    if (statusAlterado) {
                        if (!pendenciaAntiga.historicoStatus) {
                            pendenciaAntiga.historicoStatus = [];
                        }
                        
                        const historicoStatus = {
                            timestamp: timestamp,
                            usuario: usuarioAtual,
                            acao: 'ALTERAR_STATUS',
                            de: pendenciaAntiga.status,
                            para: pendencia.status,
                            comentario: document.getElementById('pendencia-comentario')?.value || 'Alteração de status'
                        };
                        
                        pendenciaAntiga.historicoStatus.push(historicoStatus);
                        
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
                
                pendencia.id = pendenciaId;
                pendencia.criadoPor = pendenciaAntiga.criadoPor;
                pendencia.criadoEm = pendenciaAntiga.criadoEm;
                pendencia.historico = pendenciaAntiga.historico;
                pendencia.historicoStatus = pendenciaAntiga.historicoStatus;
                pendencia.ultimaAtualizacao = timestamp;
                pendencia.atualizadoPor = usuarioAtual;
                
                if (pendenciaAntiga.resolvidoPor) pendencia.resolvidoPor = pendenciaAntiga.resolvidoPor;
                if (pendenciaAntiga.dataResolucao) pendencia.dataResolucao = pendenciaAntiga.dataResolucao;
                
                this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex] = pendencia;
                
                this.registrarAtividade('EDITAR_PENDENCIA', `Editou pendência: ${pendencia.titulo} (${Object.keys(alteracoes).length} alterações)`);
                this.mostrarMensagem('Pendência atualizada com sucesso', 'success');
            }
        } else {
            if (!this.data.nextPendenciaId) {
                let maxPendenciaId = 0;
                this.equipamentos.forEach(equip => {
                    if (equip.pendencias) {
                        equip.pendencias.forEach(pend => {
                            if (pend.id > maxPendenciaId) maxPendenciaId = pend.id;
                        });
                    }
                });
                this.data.nextPendenciaId = maxPendenciaId + 1;
            }
            
            pendencia.id = this.data.nextPendenciaId;
            pendencia.criadoPor = usuarioAtual;
            pendencia.criadoEm = timestamp;
            pendencia.ultimaAtualizacao = timestamp;
            pendencia.atualizadoPor = usuarioAtual;
            
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
                de: null,
                para: 'aberta',
                comentario: 'Status inicial: Aberta'
            }];
            
            this.equipamentos[equipamentoIndex].pendencias.push(pendencia);
            
            this.data.nextPendenciaId = pendencia.id + 1;
            
            this.registrarAtividade('CRIAR_PENDENCIA', `Criou pendência: ${pendencia.titulo} no equipamento ${this.equipamentos[equipamentoIndex].nome} (ID: ${pendencia.id})`);
            this.mostrarMensagem(`Pendência registrada com sucesso! ID: ${pendencia.id}`, 'success');
        }
        
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        const salvou = await this.salvarDados();
        
        this.fecharModal(this.modals.pendencia);
        
        document.getElementById('pendencia-form').reset();
        delete document.getElementById('pendencia-form').dataset.editId;
        
        if (this.equipamentoSelecionado && this.equipamentoSelecionado.id === equipamentoId) {
            this.equipamentoSelecionado = this.equipamentos[equipamentoIndex];
            this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
        }
        
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
    }
    
    detectarAlteracoesPendencia(pendenciaAntiga, pendenciaNova) {
        const alteracoes = {};
        
        const campos = ['titulo', 'descricao', 'responsavel', 'prioridade', 'data', 'status'];
        
        campos.forEach(campo => {
            if (pendenciaAntiga[campo] !== pendenciaNova[campo]) {
                alteracoes[campo] = {
                    anterior: pendenciaAntiga[campo],
                    novo: pendenciaNova[campo]
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
        
        if (!pendencia.historico) {
            pendencia.historico = [];
        }
        
        pendencia.historico.push({
            timestamp: timestamp,
            usuario: this.usuarioAtual,
            acao: 'ADICIONAR_COMENTARIO',
            comentario: comentario.trim()
        });
        
        pendencia.ultimaAtualizacao = timestamp;
        pendencia.atualizadoPor = this.usuarioAtual;
        
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
        
        document.getElementById('detalhes-titulo').querySelector('span').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `ID: ${equipamento.id}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        
        const setorFormatado = window.APP_CONFIG && window.APP_CONFIG.setores ? 
            (window.APP_CONFIG.setores[equipamento.setor]?.nome || equipamento.setor) : 
            equipamento.setor;
        document.getElementById('detalhes-setor').textContent = setorFormatado;
        
        document.getElementById('detalhes-criacao').textContent = this.formatarData(equipamento.dataCriacao);
        document.getElementById('detalhes-criador').textContent = equipamento.criadoPor || 'N/A';
        document.getElementById('detalhes-atualizacao').textContent = this.formatarDataHora(equipamento.ultimaAtualizacao || equipamento.dataCriacao);
        
        const dataInspecao = equipamento.ultimaInspecao ? 
            this.formatarData(equipamento.ultimaInspecao) : 
            'Não registrada';
        document.getElementById('detalhes-inspecao').textContent = dataInspecao;
        
        const statusChip = document.getElementById('detalhes-status');
        const statusNome = window.APP_CONFIG && window.APP_CONFIG.statusEquipamento ? 
            window.APP_CONFIG.statusEquipamento[equipamento.status]?.nome || equipamento.status : 
            equipamento.status;
        statusChip.textContent = statusNome;
        statusChip.className = `status-chip ${equipamento.status}`;
        
        const temPendenciasCriticasAbertas = equipamento.pendencias && equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        if (temPendenciasCriticasAbertas) {
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
            statusChip.innerHTML += ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>`;
        }
        
        // Informações de operação
        const operante = equipamento.emLinha?.ativo || false;
        const tempoOperacao = equipamento.emLinha?.tempoTotalOperacao || 0;
        const horasOperacao = Math.floor(tempoOperacao / 60);
        const minutosOperacao = tempoOperacao % 60;
        const totalAcionamentos = equipamento.historicoAcionamentos?.length || 0;
        
        document.getElementById('detalhes-em-linha').textContent = operante ? 'OPERANTE' : 'INOPERANTE';
        document.getElementById('detalhes-tempo-operacao').textContent = operante ? 
            `${horasOperacao}h ${minutosOperacao}min (desde ${this.formatarHora(equipamento.emLinha.ultimoAcionamento)})` : 
            `${horasOperacao}h ${minutosOperacao}min (total histórico)`;
        document.getElementById('detalhes-total-acionamentos').textContent = totalAcionamentos;
        
        this.renderizarPendenciasDetalhes(equipamento.pendencias || []);
        
        this.configurarBotoesDetalhes();
        
        this.modals.detalhes.classList.add('active');
    }
    
    configurarBotoesDetalhes() {
        const editarBtn = document.getElementById('editar-equipamento');
        const pendenciaBtn = document.getElementById('nova-pendencia-detalhes');
        const excluirBtn = document.getElementById('excluir-equipamento');
        
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
        
        if (excluirBtn) {
            const isAdmin = this.nivelUsuario === 'administrador';
            const temPendenciasAtivas = this.equipamentoSelecionado?.pendencias?.some(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            ) || false;
            
            excluirBtn.style.display = isAdmin ? 'flex' : 'none';
            excluirBtn.disabled = temPendenciasAtivas;
            
            if (temPendenciasAtivas) {
                excluirBtn.title = 'Não é possível excluir: equipamento possui pendências ativas';
            } else if (!isAdmin) {
                excluirBtn.title = 'Apenas administradores podem excluir equipamentos';
            } else {
                excluirBtn.title = 'Excluir equipamento';
            }
            
            excluirBtn.replaceWith(excluirBtn.cloneNode(true));
            const novoExcluirBtn = document.getElementById('excluir-equipamento');
            
            novoExcluirBtn.addEventListener('click', () => {
                if (this.equipamentoSelecionado) {
                    this.excluirEquipamento(this.equipamentoSelecionado.id);
                }
            });
        }
    }
    
    // ================== EXCLUSÃO DE EQUIPAMENTO ==================

    async excluirEquipamento(equipamentoId) {
        const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
        if (!equipamento) return;
        
        if (this.nivelUsuario !== 'administrador') {
            this.mostrarMensagem('Apenas administradores podem excluir equipamentos', 'error');
            return;
        }
        
        const pendenciasAtivas = equipamento.pendencias?.filter(p => 
            p.status === 'aberta' || p.status === 'em-andamento'
        ) || [];
        
        if (pendenciasAtivas.length > 0) {
            this.mostrarMensagem(`Não é possível excluir: equipamento possui ${pendenciasAtivas.length} pendência(s) ativa(s)`, 'error');
            return;
        }
        
        const totalPendencias = equipamento.pendencias?.length || 0;
        
        let mensagem = `Tem certeza que deseja excluir o equipamento "${equipamento.nome}" (ID: ${equipamento.id})?`;
        
        if (totalPendencias > 0) {
            mensagem += `\n\n⚠️ Este equipamento possui ${totalPendencias} pendência(s) no histórico que também serão excluídas.`;
        }
        
        mensagem += `\n\nEsta ação não pode ser desfeita!`;
        
        const confirmar = await this.mostrarConfirmacao(
            'Excluir Equipamento',
            mensagem
        );
        
        if (!confirmar) return;
        
        if (totalPendencias > 0) {
            const confirmarNovamente = await this.mostrarConfirmacao(
                'Confirmação Adicional',
                `ÚLTIMA CHANCE: Tem CERTEZA que deseja excluir "${equipamento.nome}" com ${totalPendencias} pendência(s)?`
            );
            
            if (!confirmarNovamente) return;
        }
        
        const index = this.equipamentos.findIndex(e => e.id === equipamentoId);
        if (index !== -1) {
            this.equipamentos.splice(index, 1);
            
            this.registrarAtividade('EXCLUIR_EQUIPAMENTO', 
                `Administrador excluiu equipamento: ${equipamento.nome} (ID: ${equipamento.id}) com ${totalPendencias} pendências`);
            
            await this.salvarDados();
            
            if (this.equipamentoSelecionado && this.equipamentoSelecionado.id === equipamentoId) {
                this.fecharModal(this.modals.detalhes);
                this.equipamentoSelecionado = null;
            }
            
            this.renderizarEquipamentos();
            this.atualizarEstatisticas();
            this.atualizarEstadoBotaoPendencia();
            
            this.mostrarMensagem(`Equipamento "${equipamento.nome}" excluído com sucesso!`, 'success');
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
        
        const pendenciasOrdenadas = this.ordenarPendencias(pendencias);
        
        container.innerHTML = pendenciasOrdenadas.map(pendencia => {
            return this.renderizarPendenciaItem(pendencia);
        }).join('');
        
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
        
        const totalHistorico = pendencia.historico ? pendencia.historico.length : 0;
        
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
                                <i class="fas fa-hashtag"></i> ID: ${pendencia.id} | 
                                Criada por: ${this.escapeHTML(pendencia.criadoPor || 'N/A')} em ${criadoEmFormatado}
                            </small>
                        </div>
                        <div class="pendencia-data">
                            <i class="far fa-calendar"></i> ${dataFormatada} 
                            | Prioridade: ${window.APP_CONFIG?.prioridades[pendencia.prioridade]?.nome || pendencia.prioridade}
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
                        ${window.APP_CONFIG?.statusPendencia[pendencia.status]?.nome || pendencia.status}
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
        
        container.querySelectorAll('.btn-comentar-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-comentar-pendencia').dataset.id);
                const comentarioSection = document.getElementById(`comentario-${pendenciaId}`);
                
                if (comentarioSection.style.display === 'none') {
                    comentarioSection.style.display = 'block';
                    document.getElementById(`comentario-text-${pendenciaId}`).focus();
                } else {
                    comentarioSection.style.display = 'none';
                }
            });
        });
        
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
                    
                    if (this.equipamentoSelecionado) {
                        this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
                    }
                }
            });
        });
        
        container.querySelectorAll('.btn-cancelar-comentario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-cancelar-comentario').dataset.id);
                document.getElementById(`comentario-${pendenciaId}`).style.display = 'none';
                document.getElementById(`comentario-text-${pendenciaId}`).value = '';
            });
        });
        
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
        
        const podeEditar = this.podeExecutar('editar', 'pendencia', pendencia.criadoPor);
        if (!podeEditar) {
            this.mostrarMensagem('Você não tem permissão para editar esta pendência', 'error');
            return;
        }
        
        const modal = this.modals.pendencia;
        const form = document.getElementById('pendencia-form');
        const titulo = document.getElementById('pendencia-modal-title').querySelector('span');
        
        titulo.textContent = 'Editar Pendência';
        
        document.getElementById('pendencia-titulo').value = pendencia.titulo;
        document.getElementById('pendencia-descricao').value = pendencia.descricao;
        document.getElementById('pendencia-responsavel').value = pendencia.responsavel;
        document.getElementById('pendencia-prioridade').value = pendencia.prioridade;
        document.getElementById('pendencia-data').value = pendencia.data;
        document.getElementById('pendencia-status').value = pendencia.status;
        
        const comentarioGroup = document.getElementById('pendencia-comentario-group');
        if (comentarioGroup) {
            comentarioGroup.style.display = 'block';
            document.getElementById('pendencia-comentario').value = '';
        }
        
        document.getElementById('pendencia-equipamento-id').value = this.equipamentoSelecionado.id;
        document.getElementById('pendencia-id').value = pendenciaId;
        form.dataset.editId = pendenciaId;
        
        this.fecharModal(this.modals.detalhes);
        modal.classList.add('active');
    }
    
    async excluirPendencia(pendenciaId) {
        if (!this.equipamentoSelecionado) return;
        
        const pendencia = this.equipamentoSelecionado.pendencias.find(p => p.id === pendenciaId);
        if (!pendencia) return;
        
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
        
        this.equipamentos[equipamentoIndex].pendencias = this.equipamentos[equipamentoIndex].pendencias.filter(p => p.id !== pendenciaId);
        
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        this.equipamentoSelecionado = this.equipamentos[equipamentoIndex];
        
        this.registrarAtividade('EXCLUIR_PENDENCIA', `Excluiu pendência: ${pendencia.titulo} do equipamento ${this.equipamentoSelecionado.nome}`);
        
        await this.salvarDados();
        
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
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> Histórico da Pendência: ${this.escapeHTML(pendencia.titulo)} (ID: ${pendencia.id})</h3>
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
            
            confirmarBtn.replaceWith(confirmarBtn.cloneNode(true));
            const novoConfirmarBtn = document.getElementById('modal-confirmacao-confirmar');
            
            novoConfirmarBtn.addEventListener('click', handleConfirmar);
            
            this.modalConfirmacaoCallback = {
                confirmar: handleConfirmar,
                cancelar: handleCancelar
            };
            
            modal.classList.add('active');
            
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.onclick = handleCancelar;
            
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
        this.garantirIdsUnicos();
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        this.mostrarMensagem('Dados sincronizados com sucesso', 'success');
    }
    
    exportarDadosExcel() {
        try {
            if (!this.verificarPermissao('exportar_dados')) {
                this.mostrarMensagem('Você não tem permissão para exportar dados', 'error');
                return;
            }
            
            const dataAtual = new Date().toISOString().split('T')[0];
            const usuario = this.usuarioAtual || 'sistema';
            
            let csvEquipamentos = 'ID,Nome,Descrição,Setor,Status Operacional,Última Inspeção,Data Criação,Criado Por,Total Pendências,Pendências Abertas,Pendências Em Andamento,Pendências Resolvidas,Pendências Críticas,Status Operacional,Tempo Total Operação (min),Total Acionamentos\n';
            
            this.equipamentos.forEach(equipamento => {
                const pendencias = equipamento.pendencias || [];
                const totalPendencias = pendencias.length;
                const pendenciasAbertas = pendencias.filter(p => p.status === 'aberta').length;
                const pendenciasAndamento = pendencias.filter(p => p.status === 'em-andamento').length;
                const pendenciasResolvidas = pendencias.filter(p => p.status === 'resolvida').length;
                const pendenciasCriticas = pendencias.filter(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                ).length;
                
                // Dados de controle de linha
                const statusOperacional = equipamento.emLinha?.ativo ? 'OPERANTE' : 'INOPERANTE';
                const tempoOperacao = equipamento.emLinha?.tempoTotalOperacao || 0;
                const totalAcionamentos = equipamento.historicoAcionamentos?.length || 0;
                
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
                    pendenciasCriticas,
                    statusOperacional,
                    tempoOperacao,
                    totalAcionamentos
                ].join(',') + '\n';
            });
            
            let csvPendencias = 'ID Pendência,ID Equipamento,Nome Equipamento,Título,Descrição,Responsável,Prioridade,Data,Status,Criado Por,Criado Em,Última Atualização,Atualizado Por,Resolvido Por,Data Resolução\n';
            
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
                        pendencia.id,
                        equipamento.id,
                        escapeCSV(equipamento.nome),
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
            
            // Exportar histórico de acionamentos
            let csvAcionamentos = 'ID Equipamento,Nome Equipamento,Data,Hora,Ação,Operador,Turno,Tempo Operação,Observação\n';
            
            this.equipamentos.forEach(equipamento => {
                if (equipamento.historicoAcionamentos) {
                    equipamento.historicoAcionamentos.forEach(h => {
                        const data = new Date(h.timestamp);
                        const dataStr = data.toLocaleDateString('pt-BR');
                        const horaStr = data.toLocaleTimeString('pt-BR');
                        
                        const acao = h.tipo === 'LIGADO' ? 'OPERANTE' : (h.tipo === 'DESLIGADO' ? 'INOPERANTE' : h.tipo);
                        
                        const escapeCSV = (str) => {
                            if (str === null || str === undefined) return '';
                            const string = String(str);
                            if (string.includes(',') || string.includes('"') || string.includes('\n')) {
                                return `"${string.replace(/"/g, '""')}"`;
                            }
                            return string;
                        };
                        
                        csvAcionamentos += [
                            equipamento.id,
                            escapeCSV(equipamento.nome),
                            dataStr,
                            horaStr,
                            acao,
                            h.operador,
                            h.turno || '',
                            h.tempoOperacao || '',
                            escapeCSV(h.observacao || '')
                        ].join(',') + '\n';
                    });
                }
            });
            
            if (typeof JSZip !== 'undefined') {
                const zip = new JSZip();
                zip.file(`equipamentos_${dataAtual}_${usuario}.csv`, csvEquipamentos);
                zip.file(`pendencias_${dataAtual}_${usuario}.csv`, csvPendencias);
                zip.file(`acionamentos_${dataAtual}_${usuario}.csv`, csvAcionamentos);
                
                zip.generateAsync({type: "blob"})
                    .then(function(content) {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(content);
                        link.download = `gestao_equipamentos_${dataAtual}_${usuario}.zip`;
                        link.click();
                        URL.revokeObjectURL(link.href);
                    });
            } else {
                this.downloadCSV(csvEquipamentos, `equipamentos_${dataAtual}_${usuario}.csv`);
                setTimeout(() => {
                    this.downloadCSV(csvPendencias, `pendencias_${dataAtual}_${usuario}.csv`);
                }, 500);
                setTimeout(() => {
                    this.downloadCSV(csvAcionamentos, `acionamentos_${dataAtual}_${usuario}.csv`);
                }, 1000);
            }
            
            this.registrarAtividade('EXPORTAR_DADOS', `Exportou dados para Excel. Equipamentos: ${this.equipamentos.length}, Pendências: ${this.equipamentos.reduce((acc, eqp) => acc + (eqp.pendencias ? eqp.pendencias.length : 0), 0)}, Acionamentos: ${this.equipamentos.reduce((acc, eqp) => acc + (eqp.historicoAcionamentos ? eqp.historicoAcionamentos.length : 0), 0)}`);
            
            this.mostrarMensagem('Dados exportados para Excel com sucesso', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar dados para Excel:', error);
            this.mostrarMensagem('Erro ao exportar dados para Excel', 'error');
            
            this.registrarAtividade('ERRO_EXPORTAR', `Erro ao exportar dados: ${error.message}`);
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
        const mensagemAnterior = document.querySelector('.mensagem-flutuante');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
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
    
    formatarHora(dataString) {
        if (!dataString) return '';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return '';
            
            return data.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '';
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
        setInterval(() => {
            this.atualizarInfoSessao();
        }, 60000);
        
        setInterval(() => {
            this.atualizarInfoSincronizacao();
        }, 30000);
        
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
    configurarEventosGlobais();
    
    try {
        const app = new EquipamentosApp();
        window.app = app;
        
        console.log('Sistema carregado com sucesso');
        console.log('Controle de Linha: Ativado');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        alert('Erro ao carregar o sistema. Verifique o console para mais detalhes.');
    }
});

function configurarEventosGlobais() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Tem certeza que deseja sair do sistema?')) {
                if (window.registrarAtividade) {
                    const usuario = localStorage.getItem('gestao_equipamentos_usuario');
                    window.registrarAtividade('LOGOUT', `Usuário ${usuario} saiu do sistema`);
                }
                
                ['gestao_equipamentos_sessao', 'gestao_equipamentos_usuario', 
                 'gestao_equipamentos_nivel', 'gestao_equipamentos_user_id',
                 'gestao_equipamentos_is_system_admin'].forEach(item => localStorage.removeItem(item));
                
                window.location.href = 'login.html?logout=true';
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.click();
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
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
