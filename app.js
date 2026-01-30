class EquipamentosApp {
    constructor() {
        this.data = null;
        this.equipamentos = [];
        this.filtros = { status: 'all', pendencia: 'all', setor: 'all', busca: '' };
        this.equipamentoSelecionado = null;
        this.viewMode = 'grid';
        this.modals = {};
        this.usuarioAtual = null;
        this.nivelUsuario = null;
        this.init();
    }
    
    async init() {
        try {
            if (!this.verificarSessao()) return;
            this.carregarUsuario();
            this.registrarLogin();
            this.configurarInterfacePorPermissao();
            this.initModals();
            this.initEvents();
            await this.carregarDados();
            this.renderizarEquipamentos();
            this.atualizarEstatisticas();
            this.atualizarStatusSincronizacao(true);
            console.log('Aplicação inicializada');
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.mostrarMensagem('Erro ao inicializar. Recarregue a página.', 'error');
        }
    }
    
    verificarSessao() {
        const sessao = localStorage.getItem('gestao_equipamentos_sessao');
        if (!sessao) { window.location.href = 'login.html'; return false; }
        try {
            const sessaoData = JSON.parse(sessao);
            const agora = new Date().getTime();
            if (agora > sessaoData.expira) {
                localStorage.removeItem('gestao_equipamentos_sessao');
                localStorage.removeItem('gestao_equipamentos_usuario');
                localStorage.removeItem('gestao_equipamentos_nivel');
                window.location.href = 'login.html?expired=true';
                return false;
            }
            sessaoData.expira = agora + (8 * 60 * 60 * 1000);
            localStorage.setItem('gestao_equipamentos_sessao', JSON.stringify(sessaoData));
            return true;
        } catch (e) {
            localStorage.removeItem('gestao_equipamentos_sessao');
            window.location.href = 'login.html';
            return false;
        }
    }
    
    carregarUsuario() {
        this.usuarioAtual = localStorage.getItem('gestao_equipamentos_usuario');
        this.nivelUsuario = localStorage.getItem('gestao_equipamentos_nivel');
        this.atualizarDisplayUsuario();
    }
    
    atualizarDisplayUsuario() {
        const userElement = document.getElementById('current-user');
        if (userElement && this.usuarioAtual) {
            const nomeFormatado = this.usuarioAtual.charAt(0).toUpperCase() + this.usuarioAtual.slice(1);
            const nivelNome = window.PERMISSOES?.getNomeNivel(this.nivelUsuario) || 'Usuário';
            userElement.innerHTML = `<i class="fas fa-user"></i><span>${nomeFormatado} <small>(${nivelNome})</small></span>`;
        }
    }
    
    registrarLogin() {
        localStorage.setItem('gestao_equipamentos_ultimo_acesso', new Date().toISOString());
    }
    
    configurarInterfacePorPermissao() {
        const addEquipamentoBtn = document.getElementById('add-equipamento');
        if (addEquipamentoBtn) {
            const podeCriar = this.verificarPermissao('criar_equipamentos');
            addEquipamentoBtn.style.display = podeCriar ? 'flex' : 'none';
        }
    }
    
    initModals() {
        this.modals.equipamento = document.getElementById('equipamento-modal');
        this.modals.pendencia = document.getElementById('pendencia-modal');
        this.modals.detalhes = document.getElementById('detalhes-modal');
        
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.fecharTodosModais());
        });
    }
    
    initEvents() {
        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.filtros.status = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('pendencia-filter')?.addEventListener('change', (e) => {
            this.filtros.pendencia = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('setor-filter')?.addEventListener('change', (e) => {
            this.filtros.setor = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('search')?.addEventListener('input', (e) => {
            this.filtros.busca = e.target.value.toLowerCase();
            this.renderizarEquipamentos();
        });
        
        document.getElementById('add-equipamento')?.addEventListener('click', () => {
            if (this.verificarPermissao('criar_equipamentos')) {
                this.abrirModalEquipamento();
            }
        });
        
        document.getElementById('view-list')?.addEventListener('click', () => this.setViewMode('list'));
        document.getElementById('view-grid')?.addEventListener('click', () => this.setViewMode('grid'));
    }
    
    async carregarDados() {
        try {
            this.mostrarLoading(true);
            
            if (!window.JSONBIN_CONFIG || !window.JSONBIN_CONFIG.BASE_URL) {
                throw new Error('Configuração do JSONBin não encontrada');
            }
            
            const response = await fetch(`${window.JSONBIN_CONFIG.BASE_URL}/${window.JSONBIN_CONFIG.BIN_ID}/latest`, {
                headers: window.JSONBIN_CONFIG.headers
            });
            
            if (!response.ok) throw new Error(`Erro ao carregar dados: ${response.status}`);
            
            const result = await response.json();
            
            if (result.record && result.record.equipamentos) {
                this.data = result.record;
                this.equipamentos = this.data.equipamentos;
                console.log(`Carregados ${this.equipamentos.length} equipamentos`);
            } else if (window.INITIAL_DATA) {
                this.data = window.INITIAL_DATA;
                this.equipamentos = window.INITIAL_DATA.equipamentos;
                console.log('Usando dados iniciais');
            } else {
                throw new Error('Dados iniciais não encontrados');
            }
            
            this.atualizarStatusSincronizacao(true);
            localStorage.setItem('gestao_equipamentos_ultima_sinc', new Date().toISOString());
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            
            if (window.INITIAL_DATA) {
                this.data = window.INITIAL_DATA;
                this.equipamentos = window.INITIAL_DATA.equipamentos;
                this.atualizarStatusSincronizacao(false);
                this.mostrarMensagem('Erro ao conectar com o servidor. Usando dados locais.', 'error');
            }
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    filtrarEquipamentos() {
        return this.equipamentos.filter(equipamento => {
            if (this.filtros.status !== 'all' && equipamento.status !== this.filtros.status) return false;
            if (this.filtros.pendencia !== 'all') {
                const temPendenciasAtivas = equipamento.pendencias?.some(p => 
                    p.status === 'aberta' || p.status === 'em-andamento'
                );
                if (this.filtros.pendencia === 'com-pendencia' && !temPendenciasAtivas) return false;
                if (this.filtros.pendencia === 'sem-pendencia' && temPendenciasAtivas) return false;
            }
            if (this.filtros.setor !== 'all' && equipamento.setor !== this.filtros.setor) return false;
            if (this.filtros.busca) {
                const busca = this.filtros.busca;
                return equipamento.nome.toLowerCase().includes(busca) || 
                       equipamento.codigo.toLowerCase().includes(busca) || 
                       equipamento.descricao.toLowerCase().includes(busca);
            }
            return true;
        });
    }
    
    renderizarEquipamentos() {
        const container = document.getElementById('equipamentos-container');
        const equipamentosFiltrados = this.filtrarEquipamentos();
        
        document.getElementById('total-filtrado')?.textContent = `(${equipamentosFiltrados.length})`;
        
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
            const temPendenciasAtivas = equipamento.pendencias?.some(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            );
            
            const pendencias = equipamento.pendencias || [];
            const pendenciasAbertas = pendencias.filter(p => p.status === 'aberta').length;
            const pendenciasAndamento = pendencias.filter(p => p.status === 'em-andamento').length;
            const pendenciasResolvidas = pendencias.filter(p => p.status === 'resolvida').length;
            
            let classesCard = 'equipamento-card';
            if (equipamento.status === 'nao-apto') classesCard += ' nao-apto';
            if (temPendenciasAtivas) classesCard += ' com-pendencia';
            
            return `
                <div class="${classesCard}" data-id="${equipamento.id}">
                    <div class="equipamento-header">
                        <div class="equipamento-info">
                            <h4>${equipamento.nome}</h4>
                            <div class="equipamento-codigo">${equipamento.codigo}</div>
                        </div>
                        <div class="status-chip ${equipamento.status}">
                            ${window.APP_CONFIG?.statusEquipamento?.[equipamento.status] || equipamento.status}
                        </div>
                    </div>
                    
                    <p class="equipamento-descricao">${equipamento.descricao}</p>
                    
                    <div class="equipamento-metadata">
                        <div><i class="fas fa-building"></i> ${window.APP_CONFIG?.setores?.[equipamento.setor] || equipamento.setor}</div>
                        <div><i class="fas fa-calendar"></i> ${this.formatarData(equipamento.ultimaInspecao) || 'Não registrada'}</div>
                    </div>
                    
                    ${pendencias.length > 0 ? `
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
        
        let totalPendenciasAtivas = 0;
        this.equipamentos.forEach(equipamento => {
            if (equipamento.pendencias) {
                totalPendenciasAtivas += equipamento.pendencias.filter(p => 
                    p.status === 'aberta' || p.status === 'em-andamento'
                ).length;
            }
        });
        
        document.getElementById('total-equipamentos')?.textContent = totalEquipamentos;
        document.getElementById('aptos-operar')?.textContent = aptosOperar;
        document.getElementById('nao-aptos')?.textContent = naoAptos;
        document.getElementById('total-pendencias')?.textContent = totalPendenciasAtivas;
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
        document.getElementById('view-list')?.classList.toggle('active', mode === 'list');
        document.getElementById('view-grid')?.classList.toggle('active', mode === 'grid');
        this.renderizarEquipamentos();
    }
    
    abrirModalEquipamento(equipamentoId = null) {
        const modal = this.modals.equipamento;
        const form = document.getElementById('equipamento-form');
        const titulo = document.getElementById('modal-title');
        
        if (equipamentoId) {
            const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
            if (!equipamento) return;
            titulo.textContent = 'Editar Equipamento';
            document.getElementById('equipamento-codigo').value = equipamento.codigo;
            document.getElementById('equipamento-nome').value = equipamento.nome;
            document.getElementById('equipamento-descricao').value = equipamento.descricao;
            document.getElementById('equipamento-setor').value = equipamento.setor;
            document.getElementById('equipamento-ultima-inspecao').value = equipamento.ultimaInspecao || '';
            form.dataset.editId = equipamentoId;
        } else {
            titulo.textContent = 'Novo Equipamento';
            form.reset();
            document.getElementById('equipamento-setor').value = 'moagem-moagem';
            delete form.dataset.editId;
        }
        
        modal.classList.add('active');
    }
    
    verificarPermissao(permissao) {
        if (!this.nivelUsuario || !window.PERMISSOES) return false;
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes'];
        if (permissoesBasicas.includes(permissao)) return true;
        return window.PERMISSOES.verificarPermissao(this.nivelUsuario, permissao);
    }
    
    verDetalhesEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        this.equipamentoSelecionado = equipamento;
        
        document.getElementById('detalhes-titulo').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `Código: ${equipamento.codigo}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        
        const setorFormatado = window.APP_CONFIG?.setores?.[equipamento.setor] || equipamento.setor;
        document.getElementById('detalhes-setor').textContent = setorFormatado;
        
        document.getElementById('detalhes-criacao').textContent = this.formatarData(equipamento.dataCriacao);
        
        const statusChip = document.getElementById('detalhes-status');
        statusChip.textContent = window.APP_CONFIG?.statusEquipamento?.[equipamento.status] || equipamento.status;
        statusChip.className = `status-chip ${equipamento.status}`;
        
        const dataInspecao = equipamento.ultimaInspecao ? this.formatarData(equipamento.ultimaInspecao) : 'Não registrada';
        document.getElementById('detalhes-inspecao').textContent = dataInspecao;
        
        this.renderizarPendenciasDetalhes(equipamento.pendencias || []);
        this.modals.detalhes.classList.add('active');
    }
    
    renderizarPendenciasDetalhes(pendencias) {
        const container = document.getElementById('detalhes-pendencias');
        
        if (!pendencias || pendencias.length === 0) {
            container.innerHTML = `
                <div class="no-pendencias">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma pendência registrada.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = pendencias.map(pendencia => {
            const dataFormatada = this.formatarData(pendencia.data);
            const isCritica = pendencia.prioridade === 'critica';
            
            return `
                <div class="pendencia-item ${pendencia.status} ${isCritica ? 'critica' : ''}">
                    <div class="pendencia-header">
                        <div>
                            <div class="pendencia-titulo">
                                ${isCritica ? '<i class="fas fa-exclamation-triangle"></i> ' : ''}
                                ${pendencia.titulo}
                            </div>
                            <div class="pendencia-data">
                                <i class="far fa-calendar"></i> ${dataFormatada} 
                                | Prioridade: ${window.APP_CONFIG?.prioridades?.[pendencia.prioridade] || pendencia.prioridade}
                            </div>
                        </div>
                        <div class="pendencia-badge ${pendencia.status}">
                            ${window.APP_CONFIG?.statusPendencia?.[pendencia.status] || pendencia.status}
                        </div>
                    </div>
                    <p class="pendencia-descricao">${pendencia.descricao}</p>
                    <div class="pendencia-footer">
                        <div class="pendencia-responsavel">
                            <i class="fas fa-user"></i> Responsável: ${pendencia.responsavel}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
        document.getElementById('pendencia-equipamento-id').value = equipamentoId;
        
        modal.classList.add('active');
    }
    
    resetarFiltros() {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('pendencia-filter').value = 'all';
        document.getElementById('setor-filter').value = 'all';
        document.getElementById('search').value = '';
        
        this.filtros = { status: 'all', pendencia: 'all', setor: 'all', busca: '' };
        this.renderizarEquipamentos();
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
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-flutuante ${tipo}`;
        mensagem.innerHTML = `
            <div class="mensagem-conteudo">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${texto}</span>
            </div>
        `;
        
        document.body.appendChild(mensagem);
        setTimeout(() => mensagem.classList.add('show'), 10);
        setTimeout(() => {
            mensagem.classList.remove('show');
            setTimeout(() => mensagem.remove(), 300);
        }, 5000);
    }
    
    formatarData(dataString) {
        if (!dataString) return 'Não informada';
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return dataString;
        }
    }
    
    fecharTodosModais() {
        Object.values(this.modals).forEach(modal => {
            modal?.classList.remove('active');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new EquipamentosApp();
        window.app = app;
        console.log('Sistema carregado');
    } catch (error) {
        console.error('Erro ao inicializar:', error);
        alert('Erro ao carregar o sistema.');
    }
});
