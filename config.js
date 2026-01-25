// ===========================================
// CONFIGURAÇÃO DO SISTEMA DE GESTÃO DE EQUIPAMENTOS
// ===========================================

// Configuração do JSONBin.io
const JSONBIN_CONFIG = {
    // ID do bin que você criou no JSONBin.io
    BIN_ID: '696fa19fae596e708fe90a63',
    
    // URL base da API
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    
    // Cabeçalhos para as requisições
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$gHdA8KAK/9HnnagDiMTlHeBUzNo9cWC0lR8EL0IaUpJg5ChpGiz/i',
        'X-Bin-Versioning': 'false'
    }
};

// Estrutura inicial dos dados
const INITIAL_DATA = {
    equipamentos: [
        {
            id: 1,
            codigo: "EQP-001",
            nome: "Turbina Principal",
            descricao: "Turbina de alta pressão para geração de energia",
            setor: "moagem-moagem",
            status: "apto",
            ultimaInspecao: "2023-10-15",
            dataCriacao: "2023-01-10",
            criadoPor: "administrador",
            editadoPor: null,
            editadoEm: null,
            pendencias: [
                {
                    id: 1,
                    titulo: "Vibração acima do normal",
                    descricao: "Detectada vibração 15% acima do normal durante operação em carga máxima",
                    responsavel: "Elétrica",
                    prioridade: "alta",
                    data: "2023-10-10",
                    status: "em-andamento",
                    criadoPor: "administrador",
                    criadoEm: "2023-10-10T10:30:00",
                    editadoPor: null,
                    editadoEm: null
                }
            ]
        },
        {
            id: 2,
            codigo: "EQP-042",
            nome: "Transformador T-42",
            descricao: "Transformador de potência 500kV",
            setor: "utilidades-distribuicao-agua",
            status: "nao-apto",
            ultimaInspecao: "2023-09-22",
            dataCriacao: "2022-11-05",
            criadoPor: "administrador",
            editadoPor: null,
            editadoEm: null,
            pendencias: [
                {
                    id: 2,
                    titulo: "Vazamento de óleo isolante",
                    descricao: "Identificado vazamento no tanque principal",
                    responsavel: "Instrumentação",
                    prioridade: "critica",
                    data: "2023-10-05",
                    status: "aberta",
                    criadoPor: "administrador",
                    criadoEm: "2023-10-05T08:15:00",
                    editadoPor: null,
                    editadoEm: null
                },
                {
                    id: 3,
                    titulo: "Sistema de refrigeração com ruído",
                    descricao: "Ventiladores apresentando ruído anormal",
                    responsavel: "Mecânica",
                    prioridade: "media",
                    data: "2023-09-30",
                    status: "resolvida",
                    criadoPor: "administrador",
                    criadoEm: "2023-09-30T14:20:00",
                    editadoPor: null,
                    editadoEm: null,
                    resolvidoPor: "administrador",
                    resolvidoEm: "2023-10-02T09:45:00"
                }
            ]
        },
        {
            id: 3,
            codigo: "EQP-123",
            nome: "Gerador G-12",
            descricao: "Gerador síncrono de 200MW",
            setor: "flotacao-flot-pirita",
            status: "apto",
            ultimaInspecao: "2023-10-18",
            dataCriacao: "2023-03-20",
            criadoPor: "administrador",
            editadoPor: null,
            editadoEm: null,
            pendencias: []
        }
    ],
    // Contador para IDs únicos
    nextEquipamentoId: 4,
    nextPendenciaId: 4,
    
    // Logs de auditoria
    logs: [
        {
            id: 1,
            usuario: "administrador",
            acao: "CRIAR_SISTEMA",
            detalhes: "Sistema inicializado com dados de exemplo",
            timestamp: "2023-01-01T00:00:00",
            ip: "local"
        }
    ],
    nextLogId: 2
};

// Sistema de Permissões por Nível de Acesso
const PERMISSOES = {
    niveis: {
        "visitante": {
            nome: "Visitante",
            nivel: 1,
            cor: "#95a5a6",
            icone: "fa-eye",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes"
            ],
            restricoes: [
                "nao_pode_criar",
                "nao_pode_editar",
                "nao_pode_excluir",
                "nao_pode_exportar",
                "nao_pode_configurar"
            ]
        },
        "operador": {
            nome: "Operador",
            nivel: 2,
            cor: "#3498db",
            icone: "fa-user-cog",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_equipamentos",
                "editar_equipamentos",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias_proprias",
                "exportar_dados"
            ],
            restricoes: [
                "nao_pode_excluir_equipamentos",
                "nao_pode_excluir_pendencias_outros",
                "nao_pode_configurar_sistema",
                "nao_pode_gerenciar_usuarios"
            ]
        },
        "administrador": {
            nome: "Administrador",
            nivel: 3,
            cor: "#e74c3c",
            icone: "fa-user-shield",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_equipamentos",
                "editar_equipamentos",
                "excluir_equipamentos",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "exportar_dados",
                "configurar_sistema",
                "gerenciar_usuarios",
                "visualizar_logs",
                "backup_dados",
                "restaurar_dados"
            ],
            restricoes: []
        }
    },
    
    // Verificar se usuário tem permissão específica
    verificarPermissao: function(usuario, permissao) {
        const nivelUsuario = this.niveis[usuario];
        if (!nivelUsuario) {
            console.warn(`Usuário ${usuario} não encontrado nos níveis de permissão`);
            return false;
        }
        
        // Permissões básicas que todos têm
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes'];
        if (permissoesBasicas.includes(permissao)) {
            return true;
        }
        
        return nivelUsuario.permissoes.includes(permissao);
    },
    
    // Obter nome do nível do usuário
    getNomeNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.nome : 'Visitante';
    },
    
    // Obter nível numérico
    getNivelNumerico: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.nivel : 1;
    },
    
    // Obter cor do nível
    getCorNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.cor : '#95a5a6';
    },
    
    // Obter ícone do nível
    getIconeNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.icone : 'fa-eye';
    },
    
    // Listar todos os níveis disponíveis
    getTodosNiveis: function() {
        return Object.keys(this.niveis);
    },
    
    // Verificar se usuário pode executar ação específica
    podeExecutarAcao: function(usuario, acao, recurso, donoRecurso = null) {
        const nivel = this.niveis[usuario];
        if (!nivel) return false;
        
        switch(acao) {
            case 'criar':
                if (recurso === 'equipamento') {
                    return nivel.permissoes.includes('criar_equipamentos');
                }
                if (recurso === 'pendencia') {
                    return nivel.permissoes.includes('criar_pendencias');
                }
                break;
                
            case 'editar':
                if (recurso === 'equipamento') {
                    return nivel.permissoes.includes('editar_equipamentos');
                }
                if (recurso === 'pendencia') {
                    if (donoRecurso === usuario) {
                        return true; // Dono sempre pode editar
                    }
                    return nivel.permissoes.includes('editar_pendencias');
                }
                break;
                
            case 'excluir':
                if (recurso === 'equipamento') {
                    return nivel.permissoes.includes('excluir_equipamentos');
                }
                if (recurso === 'pendencia') {
                    if (donoRecurso === usuario) {
                        return nivel.permissoes.includes('excluir_pendencias_proprias');
                    }
                    return nivel.permissoes.includes('excluir_pendencias');
                }
                break;
                
            case 'exportar':
                return nivel.permissoes.includes('exportar_dados');
                
            case 'configurar':
                return nivel.permissoes.includes('configurar_sistema');
                
            case 'gerenciar_usuarios':
                return nivel.permissoes.includes('gerenciar_usuarios');
                
            case 'visualizar_logs':
                return nivel.permissoes.includes('visualizar_logs');
        }
        
        return false;
    },
    
    // Gerar relatório de permissões
    gerarRelatorioPermissoes: function() {
        let relatorio = "=== RELATÓRIO DE PERMISSÕES ===\n\n";
        
        Object.entries(this.niveis).forEach(([key, nivel]) => {
            relatorio += `${nivel.nome} (${key}):\n`;
            relatorio += `Nível: ${nivel.nivel}\n`;
            relatorio += `Permissões: ${nivel.permissoes.length}\n`;
            relatorio += `Restrições: ${nivel.restricoes.length}\n\n`;
        });
        
        return relatorio;
    }
};

// Configurações da aplicação
const APP_CONFIG = {
    nome: "Gestão de Equipamentos - Usina",
    versao: "2.2.0",
    
    // Setores da usina
    setores: {
        // MOAGEM
        "moagem-moagem": "MOAGEM / MOAGEM",
        
        // FLOTAÇÃO
        "flotacao-flot-rougher": "FLOTAÇÃO / FLOT ROUGHER",
        "flotacao-flot-cleaner-scavenger": "FLOTAÇÃO / FLOT CLEANER-SCAVENGER",
        "flotacao-flot-pirita": "FLOTAÇÃO / FLOT PIRITA",
        
        // FILTRAGEM
        "filtragem-filtragem-concentrado": "FILTRAGEM / FILTRAGEM DE CONCENTRADO",
        "filtragem-filtragem-rejeito": "FILTRAGEM / FILTRAGEM DE REJEITO",
        
        // REAGENTES
        "reagentes-pax": "REAGENTES / PAX",
        "reagentes-dtf": "REAGENTES / DTF",
        "reagentes-espumante": "REAGENTES / ESPUMANTE",
        "reagentes-leite-de-cal": "REAGENTES / LEITE DE CAL",
        "reagentes-acido-sulfurico": "REAGENTES / ÁCIDO SULFÚRICO",
        "reagentes-floculante": "REAGENTES / FLOCULANTE",
        
        // UTILIDADES
        "utilidades-distribuicao-agua": "UTILIDADES / DISTRIBUIÇÃO DE ÁGUA",
        
        // TORRE DE RESFRIAMENTO
        "torre-resfriamento-torre-resfriamento": "TORRE DE RESFRIAMENTO / TORRE DE RESFRIAMENTO"
    },
    
    // Status dos equipamentos
    statusEquipamento: {
        "apto": "Apto a Operar",
        "nao-apto": "Não Apto"
    },
    
    // Status das pendências
    statusPendencia: {
        "aberta": "Aberta",
        "em-andamento": "Em Andamento",
        "resolvida": "Resolvida",
        "cancelada": "Cancelada"
    },
    
    // Prioridades das pendências
    prioridades: {
        "baixa": "Baixa",
        "media": "Média",
        "alta": "Alta",
        "critica": "Crítica"
    },
    
    // Responsáveis pelas pendências
    responsaveis: [
        "Elétrica",
        "Instrumentação",
        "Mecânica",
        "Preventiva_Engenharia",
        "Automação",
        "Externo"
    ],
    
    // Configurações de cores
    coresStatus: {
        "apto": "#2ecc71",
        "nao-apto": "#e74c3c",
        "aberta": "#f39c12",
        "em-andamento": "#3498db",
        "resolvida": "#27ae60",
        "cancelada": "#95a5a6"
    },
    
    // Configurações da aplicação
    appSettings: {
        // Tempo de expiração da sessão (em horas)
        sessaoExpiracaoHoras: 8,
        
        // Itens por página
        itensPorPagina: 20,
        
        // Atualização automática dos dados (em minutos)
        atualizacaoAutomaticaMinutos: 5,
        
        // Habilitar/desabilitar notificações
        notificacoesAtivas: true,
        
        // Mantém logs de atividades
        manterLogs: true,
        
        // Número máximo de logs a manter
        maxLogs: 1000,
        
        // Mostrar indicador de nível
        mostrarIndicadorNivel: true
    },
    
    // Tipos de ações registradas nos logs
    tiposAcao: {
        LOGIN: "LOGIN",
        LOGOUT: "LOGOUT",
        CRIAR_EQUIPAMENTO: "CRIAR_EQUIPAMENTO",
        EDITAR_EQUIPAMENTO: "EDITAR_EQUIPAMENTO",
        EXCLUIR_EQUIPAMENTO: "EXCLUIR_EQUIPAMENTO",
        CRIAR_PENDENCIA: "CRIAR_PENDENCIA",
        EDITAR_PENDENCIA: "EDITAR_PENDENCIA",
        EXCLUIR_PENDENCIA: "EXCLUIR_PENDENCIA",
        EXPORTAR_DADOS: "EXPORTAR_DADOS",
        ALTERAR_TEMA: "ALTERAR_TEMA",
        CONFIGURAR_SISTEMA: "CONFIGURAR_SISTEMA",
        VISUALIZAR_DETALHES: "VISUALIZAR_DETALHES",
        FILTRAR_EQUIPAMENTOS: "FILTRAR_EQUIPAMENTOS",
        EXPORTAR_LOGS: "EXPORTAR_LOGS",
        VISUALIZAR_LOGS: "VISUALIZAR_LOGS"
    }
};

// Funções utilitárias para a aplicação
const APP_UTILS = {
    // Formatar data para exibição
    formatarData: function(dataString) {
        if (!dataString) return 'Não informada';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return dataString;
            
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            console.warn('Erro ao formatar data:', dataString, e);
            return dataString;
        }
    },
    
    // Formatar data e hora
    formatarDataHora: function(dataString) {
        if (!dataString) return 'Não informada';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return dataString;
            
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.warn('Erro ao formatar data/hora:', dataString, e);
            return dataString;
        }
    },
    
    // Obter cor do status
    getCorStatus: function(status) {
        return APP_CONFIG.coresStatus[status] || '#95a5a6';
    },
    
    // Gerar código único para equipamentos
    gerarCodigoEquipamento: function(prefixo = "EQP") {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefixo}-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
    },
    
    // Validar e-mail
    validarEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Formatar número de telefone
    formatarTelefone: function(telefone) {
        const cleaned = ('' + telefone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return telefone;
    },
    
    // Sanitizar entrada de dados
    sanitizarTexto: function(texto) {
        if (typeof texto !== 'string') return texto;
        
        // Remover tags HTML
        const semTags = texto.replace(/<[^>]*>/g, '');
        
        // Escapar caracteres especiais
        return semTags
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    
    // Validar data (não pode ser futura)
    validarDataNaoFutura: function(dataString) {
        try {
            const data = new Date(dataString);
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999); // Fim do dia de hoje
            
            return data <= hoje;
        } catch (e) {
            return false;
        }
    },
    
    // Calcular diferença entre datas em dias
    diferencaDias: function(data1, data2 = new Date()) {
        try {
            const d1 = new Date(data1);
            const d2 = new Date(data2);
            
            const diffTime = Math.abs(d2 - d1);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
            return null;
        }
    }
};

// Banco de usuários (em produção, isso estaria em um backend seguro)
const USUARIOS_AUTORIZADOS = {
    'visitante': { 
        senha: 'visitante123', 
        nivel: 'visitante',
        nome: 'Visitante',
        email: 'visitante@empresa.com',
        departamento: 'Visitante'
    },
    'operador': { 
        senha: 'operador456', 
        nivel: 'operador',
        nome: 'Operador',
        email: 'operador@empresa.com',
        departamento: 'Operações'
    },
    'administrador': { 
        senha: 'admin789', 
        nivel: 'administrador',
        nome: 'Administrador',
        email: 'admin@empresa.com',
        departamento: 'TI'
    }
};

// ===========================================
// SISTEMA DE LOGS DE AUDITORIA
// ===========================================

// Função para registrar logs com mais detalhes
function registrarLogAuditoria(acao, detalhes, equipamentoId = null, pendenciaId = null) {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    const timestamp = new Date().toISOString();
    const ip = 'local';
    const userAgent = navigator.userAgent;
    
    const logEntry = {
        id: gerarIdUnico(),
        usuario: usuario || 'sistema',
        nivel: nivel || 'sistema',
        acao: acao,
        detalhes: detalhes,
        equipamentoId: equipamentoId,
        pendenciaId: pendenciaId,
        timestamp: timestamp,
        ip: ip,
        userAgent: userAgent,
        dataHoraBR: new Date().toLocaleString('pt-BR')
    };
    
    console.log('LOG DE AUDITORIA:', logEntry);
    
    // Salvar no localStorage
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs_auditoria') || '[]');
        logs.unshift(logEntry);
        
        // Limitar a 1000 logs
        if (logs.length > 1000) {
            logs = logs.slice(0, 1000);
        }
        
        localStorage.setItem('gestao_equipamentos_logs_auditoria', JSON.stringify(logs));
        
        // Também salvar no log geral
        registrarAtividade(acao, detalhes);
        
    } catch (e) {
        console.error('Erro ao salvar log de auditoria:', e);
    }
    
    return logEntry;
}

// Função para gerar ID único
function gerarIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Função para obter logs de auditoria
function getLogsAuditoria(filtro = {}) {
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs_auditoria') || '[]');
        
        // Aplicar filtros
        if (filtro.usuario) {
            logs = logs.filter(log => log.usuario === filtro.usuario);
        }
        if (filtro.acao) {
            logs = logs.filter(log => log.acao === filtro.acao);
        }
        if (filtro.dataInicio) {
            const dataInicio = new Date(filtro.dataInicio);
            logs = logs.filter(log => new Date(log.timestamp) >= dataInicio);
        }
        if (filtro.dataFim) {
            const dataFim = new Date(filtro.dataFim);
            logs = logs.filter(log => new Date(log.timestamp) <= dataFim);
        }
        if (filtro.limite) {
            logs = logs.slice(0, filtro.limite);
        }
        
        return logs;
    } catch (e) {
        console.error('Erro ao obter logs de auditoria:', e);
        return [];
    }
}

// Função para exportar logs
function exportarLogsAuditoria() {
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'visualizar_logs')) {
        alert('Você não tem permissão para exportar logs.');
        return;
    }
    
    const logs = getLogsAuditoria();
    if (logs.length === 0) {
        alert('Nenhum log encontrado para exportar.');
        return;
    }
    
    // Criar CSV
    let csv = 'ID,Data/Hora,Usuário,Nível,Ação,Detalhes,ID Equipamento,ID Pendência\n';
    
    logs.forEach(log => {
        const linha = [
            log.id,
            `"${log.dataHoraBR || new Date(log.timestamp).toLocaleString('pt-BR')}"`,
            `"${log.usuario}"`,
            `"${log.nivel}"`,
            `"${log.acao}"`,
            `"${log.detalhes.replace(/"/g, '""')}"`,
            log.equipamentoId || '',
            log.pendenciaId || ''
        ].join(',');
        csv += linha + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dataAtual = new Date().toISOString().split('T')[0];
    
    link.href = URL.createObjectURL(blob);
    link.download = `logs_auditoria_${dataAtual}_${usuario}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    registrarLogAuditoria('EXPORTAR_LOGS', `Exportou ${logs.length} logs de auditoria`);
}

// Função para visualizar logs (interface)
function visualizarLogsAuditoria() {
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'visualizar_logs')) {
        alert('Você não tem permissão para visualizar logs.');
        return;
    }
    
    const logs = getLogsAuditoria({ limite: 100 });
    
    let html = `
        <div class="logs-header">
            <h3><i class="fas fa-clipboard-list"></i> Logs de Auditoria</h3>
            <p>Total de registros: ${logs.length}</p>
        </div>
        
        <div class="logs-filtros">
            <button onclick="filtrarLogsPorUsuario(this)" class="btn-small">
                <i class="fas fa-user"></i> Filtrar por usuário
            </button>
            <button onclick="filtrarLogsPorAcao(this)" class="btn-small">
                <i class="fas fa-filter"></i> Filtrar por ação
            </button>
            <button onclick="exportarLogsAuditoria()" class="btn-small">
                <i class="fas fa-download"></i> Exportar CSV
            </button>
        </div>
        
        <div class="logs-container">
            <table class="logs-table">
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Usuário</th>
                        <th>Nível</th>
                        <th>Ação</th>
                        <th>Detalhes</th>
                        <th>IDs</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    logs.forEach(log => {
        const dataHora = log.dataHoraBR || new Date(log.timestamp).toLocaleString('pt-BR');
        const ids = [];
        if (log.equipamentoId) ids.push(`Eqp: ${log.equipamentoId}`);
        if (log.pendenciaId) ids.push(`Pend: ${log.pendenciaId}`);
        
        html += `
            <tr class="log-item ${log.nivel}">
                <td>${dataHora}</td>
                <td><span class="log-usuario">${log.usuario}</span></td>
                <td><span class="log-nivel ${log.nivel}">${log.nivel}</span></td>
                <td><span class="log-acao">${log.acao}</span></td>
                <td class="log-detalhes">${log.detalhes}</td>
                <td>${ids.join(', ') || '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <style>
            .logs-container {
                max-height: 500px;
                overflow-y: auto;
                margin-top: 15px;
                border: 1px solid var(--cor-borda);
                border-radius: 5px;
            }
            
            .logs-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .logs-table th {
                position: sticky;
                top: 0;
                background: var(--cor-fundo-secundario);
                z-index: 10;
                padding: 12px;
                text-align: left;
                border-bottom: 2px solid var(--cor-borda);
            }
            
            .logs-table td {
                padding: 10px 12px;
                border-bottom: 1px solid var(--cor-borda);
            }
            
            .log-item:hover {
                background: var(--cor-fundo-secundario);
            }
            
            .log-nivel {
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .log-nivel.administrador { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
            .log-nivel.operador { background: rgba(52, 152, 219, 0.2); color: #3498db; }
            .log-nivel.visitante { background: rgba(149, 165, 166, 0.2); color: #95a5a6; }
            
            .log-usuario {
                font-weight: 500;
            }
            
            .log-acao {
                font-family: monospace;
                font-size: 12px;
                color: var(--cor-texto);
            }
            
            .log-detalhes {
                max-width: 300px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .logs-filtros {
                display: flex;
                gap: 10px;
                margin: 15px 0;
                flex-wrap: wrap;
            }
        </style>
    `;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content large" style="max-width: 1200px;">
            <div class="modal-header">
                <h3><i class="fas fa-history"></i> Logs de Auditoria do Sistema</h3>
                <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                ${html}
                <div class="form-actions">
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
    
    registrarLogAuditoria('VISUALIZAR_LOGS', 'Visualizou logs de auditoria');
}

// Funções auxiliares para filtros
function filtrarLogsPorUsuario(button) {
    const usuario = prompt('Digite o nome do usuário para filtrar:');
    if (usuario) {
        const logs = getLogsAuditoria({ usuario: usuario });
        alert(`Encontrados ${logs.length} registros para o usuário "${usuario}"`);
    }
}

function filtrarLogsPorAcao(button) {
    const acao = prompt('Digite o tipo de ação (ex: CRIAR_EQUIPAMENTO, EDITAR_PENDENCIA):');
    if (acao) {
        const logs = getLogsAuditoria({ acao: acao });
        alert(`Encontrados ${logs.length} registros para a ação "${acao}"`);
    }
}

// ===========================================
// FUNÇÕES DE SISTEMA
// ===========================================

// Função para logout
function logout() {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    
    // Registrar atividade de logout
    if (usuario) {
        registrarAtividade('LOGOUT', `Usuário ${usuario} (${PERMISSOES.getNomeNivel(nivel)}) saiu do sistema`);
    }
    
    // Limpar dados da sessão
    localStorage.removeItem('gestao_equipamentos_sessao');
    localStorage.removeItem('gestao_equipamentos_usuario');
    localStorage.removeItem('gestao_equipamentos_nivel');
    localStorage.removeItem('gestao_equipamentos_ultimo_acesso');
    
    // Redirecionar para página de login
    window.location.href = 'login.html';
}

// Função para verificar sessão ativa
function verificarSessaoAtiva() {
    const sessao = localStorage.getItem('gestao_equipamentos_sessao');
    
    if (!sessao) {
        return false;
    }
    
    try {
        const sessaoData = JSON.parse(sessao);
        const agora = new Date().getTime();
        
        if (agora > sessaoData.expira) {
            // Sessão expirada
            registrarAtividade('SESSAO_EXPIRADA', `Sessão expirou para usuário ${sessaoData.usuario}`);
            
            localStorage.removeItem('gestao_equipamentos_sessao');
            localStorage.removeItem('gestao_equipamentos_usuario');
            localStorage.removeItem('gestao_equipamentos_nivel');
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('Erro ao verificar sessão:', e);
        return false;
    }
}

// Função para obter informações do usuário logado
function getUsuarioLogado() {
    return localStorage.getItem('gestao_equipamentos_usuario');
}

// Função para obter nível do usuário
function getNivelUsuario() {
    return localStorage.getItem('gestao_equipamentos_nivel');
}

// Função para obter informações completas do usuário
function getUsuarioInfo() {
    const usuario = getUsuarioLogado();
    if (!usuario) return null;
    
    return {
        usuario: usuario,
        nivel: getNivelUsuario(),
        nome: USUARIOS_AUTORIZADOS[usuario]?.nome || usuario,
        email: USUARIOS_AUTORIZADOS[usuario]?.email || '',
        departamento: USUARIOS_AUTORIZADOS[usuario]?.departamento || '',
        nivelNome: PERMISSOES.getNomeNivel(getNivelUsuario()),
        corNivel: PERMISSOES.getCorNivel(getNivelUsuario()),
        iconeNivel: PERMISSOES.getIconeNivel(getNivelUsuario())
    };
}

// Função para registrar atividade (log de auditoria)
function registrarAtividade(acao, detalhes) {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    const timestamp = new Date().toISOString();
    
    // Só registra se a configuração permitir
    if (!APP_CONFIG.appSettings.manterLogs) return;
    
    const logEntry = {
        usuario: usuario || 'sistema',
        nivel: nivel || 'sistema',
        acao: acao,
        detalhes: detalhes,
        timestamp: timestamp,
        ip: 'local',
        userAgent: navigator.userAgent
    };
    
    // Em ambiente real, enviaria para um servidor de logs
    console.log('LOG DE ATIVIDADE:', logEntry);
    
    // Salvar no localStorage para histórico local
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs') || '[]');
        logEntry.id = logs.length > 0 ? Math.max(...logs.map(l => l.id || 0)) + 1 : 1;
        logs.unshift(logEntry); // Adicionar no início
        
        // Limitar número de logs armazenados
        if (logs.length > APP_CONFIG.appSettings.maxLogs) {
            logs = logs.slice(0, APP_CONFIG.appSettings.maxLogs);
        }
        
        localStorage.setItem('gestao_equipamentos_logs', JSON.stringify(logs));
        
        // Em produção, também enviaria para servidor
        // enviarLogParaServidor(logEntry);
        
    } catch (e) {
        console.error('Erro ao salvar log:', e);
    }
}

// Função para obter logs de atividades
function getLogsAtividades(limite = 50) {
    try {
        const logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs') || '[]');
        return logs.slice(0, limite);
    } catch (e) {
        console.error('Erro ao obter logs:', e);
        return [];
    }
}

// Função para exportar configurações
function exportarConfiguracoes() {
    // Verificar permissão
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'configurar_sistema')) {
        alert('Você não tem permissão para exportar configurações do sistema.');
        return;
    }
    
    const configExport = {
        appConfig: APP_CONFIG,
        permissoes: PERMISSOES.gerarRelatorioPermissoes(),
        jsonBinConfig: {
            BIN_ID: JSONBIN_CONFIG.BIN_ID,
            BASE_URL: JSONBIN_CONFIG.BASE_URL
        },
        exportDate: new Date().toISOString(),
        version: APP_CONFIG.versao,
        exportadoPor: usuario
    };
    
    const dataStr = JSON.stringify(configExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `config_gestao_equipamentos_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    
    registrarAtividade('EXPORT_CONFIG', 'Configurações exportadas');
}

// Função para gerar relatório de configuração
function gerarRelatorioConfiguracao() {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    const usuarioInfo = getUsuarioInfo();
    
    const relatorio = `
SISTEMA DE GESTÃO DE EQUIPAMENTOS - USINA
==========================================

VERSÃO: ${APP_CONFIG.versao}
DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}
HORA: ${new Date().toLocaleTimeString('pt-BR')}

INFORMAÇÕES DO USUÁRIO
----------------------
• Usuário: ${usuarioInfo?.nome || 'Não autenticado'}
• Nível de Acesso: ${usuarioInfo?.nivelNome || 'N/A'}
• Departamento: ${usuarioInfo?.departamento || 'N/A'}
• E-mail: ${usuarioInfo?.email || 'N/A'}

CONFIGURAÇÕES DO SISTEMA
-------------------------
• Total de Setores Configurados: ${Object.keys(APP_CONFIG.setores).length}
• Status de Equipamentos: ${Object.keys(APP_CONFIG.statusEquipamento).length}
• Prioridades de Pendência: ${Object.keys(APP_CONFIG.prioridades).length}
• Responsáveis: ${APP_CONFIG.responsaveis.length}

SETORES CONFIGURADOS
--------------------
${Object.entries(APP_CONFIG.setores).map(([key, value]) => `• ${value}`).join('\n')}

NÍVEIS DE ACESSO CONFIGURADOS
-----------------------------
${Object.entries(PERMISSOES.niveis).map(([key, nivel]) => 
    `• ${nivel.nome} (${key}): Nível ${nivel.nivel}, ${nivel.permissoes.length} permissões`
).join('\n')}

CONFIGURAÇÃO DE ARMAZENAMENTO
-----------------------------
• Servidor: JSONBin.io
• Bin ID: ${JSONBIN_CONFIG.BIN_ID}
• Status: ${navigator.onLine ? 'Online' : 'Offline'}

CONFIGURAÇÕES DE APLICAÇÃO
--------------------------
• Expiração de Sessão: ${APP_CONFIG.appSettings.sessaoExpiracaoHoras} horas
• Atualização Automática: ${APP_CONFIG.appSettings.atualizacaoAutomaticaMinutos} minutos
• Notificações: ${APP_CONFIG.appSettings.notificacoesAtivas ? 'Ativas' : 'Inativas'}
• Logs de Atividade: ${APP_CONFIG.appSettings.manterLogs ? 'Ativos' : 'Inativos'}

ESTATÍSTICAS DE USO
-------------------
• Último Acesso: ${localStorage.getItem('gestao_equipamentos_ultimo_acesso') ? 
    APP_UTILS.formatarDataHora(localStorage.getItem('gestao_equipamentos_ultimo_acesso')) : 'N/A'}
• Total de Logs: ${getLogsAtividades().length}
• Filtros Salvos: ${localStorage.getItem('gestao_equipamentos_filtros') ? 'Sim' : 'Não'}
• Tema Preferido: ${localStorage.getItem('gestao_equipamentos_tema') || 'claro'}

`;
    
    return relatorio;
}

// Função para mostrar informações do sistema
function mostrarInfoSistema() {
    // Verificar permissão
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'configurar_sistema')) {
        alert('Você não tem permissão para visualizar informações do sistema.');
        return;
    }
    
    const info = gerarRelatorioConfiguracao();
    
    // Criar modal para mostrar informações
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3><i class="fas fa-info-circle"></i> Informações do Sistema</h3>
                <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; max-height: 500px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px;">${info}</pre>
                <div class="form-actions">
                    <button onclick="copiarInformacoesSistema()" class="btn-secondary">
                        <i class="fas fa-copy"></i> Copiar Informações
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
    
    registrarAtividade('VIEW_SYSTEM_INFO', 'Visualizou informações do sistema');
}

// Função para copiar informações do sistema
function copiarInformacoesSistema() {
    const info = gerarRelatorioConfiguracao();
    
    navigator.clipboard.writeText(info).then(() => {
        alert('Informações copiadas para a área de transferência!');
        registrarAtividade('COPY_SYSTEM_INFO', 'Copiou informações do sistema');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar informações.');
    });
}

// Inicializar configurações padrão
function inicializarConfiguracoes() {
    // Configuração de filtros
    if (!localStorage.getItem('gestao_equipamentos_filtros')) {
        localStorage.setItem('gestao_equipamentos_filtros', JSON.stringify({
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: '',
            viewMode: 'grid'
        }));
    }
    
    // Configuração de tema
    if (!localStorage.getItem('gestao_equipamentos_tema')) {
        localStorage.setItem('gestao_equipamentos_tema', 'claro');
    }
    
    // Inicializar logs se não existirem
    if (!localStorage.getItem('gestao_equipamentos_logs')) {
        localStorage.setItem('gestao_equipamentos_logs', JSON.stringify([]));
    }
    
    // Inicializar logs de auditoria se não existirem
    if (!localStorage.getItem('gestao_equipamentos_logs_auditoria')) {
        localStorage.setItem('gestao_equipamentos_logs_auditoria', JSON.stringify([]));
    }
    
    // Aplicar tema
    const tema = localStorage.getItem('gestao_equipamentos_tema');
    document.documentElement.setAttribute('data-tema', tema);
}

// Função para alternar tema
function alternarTema() {
    const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    
    localStorage.setItem('gestao_equipamentos_tema', novoTema);
    document.documentElement.setAttribute('data-tema', novoTema);
    
    registrarAtividade('ALTERAR_TEMA', `Tema alterado para ${novoTema}`);
    
    return novoTema;
}

// Função para verificar permissão do usuário atual
function temPermissao(permissao) {
    const usuario = getUsuarioLogado();
    return PERMISSOES.verificarPermissao(usuario, permissao);
}

// Função para verificar se pode executar ação
function podeExecutar(acao, recurso, donoRecurso = null) {
    const usuario = getUsuarioLogado();
    return PERMISSOES.podeExecutarAcao(usuario, acao, recurso, donoRecurso);
}

// Função para obter usuários disponíveis (apenas admin)
function getUsuariosDisponiveis() {
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'gerenciar_usuarios')) {
        return [];
    }
    
    return Object.entries(USUARIOS_AUTORIZADOS).map(([username, info]) => ({
        username,
        nome: info.nome,
        email: info.email,
        departamento: info.departamento,
        nivel: info.nivel,
        nivelNome: PERMISSOES.getNomeNivel(info.nivel)
    }));
}

// ===========================================
// EXPORTAÇÃO PARA USO GLOBAL
// ===========================================

if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
    window.JSONBIN_CONFIG = JSONBIN_CONFIG;
    window.INITIAL_DATA = INITIAL_DATA;
    window.PERMISSOES = PERMISSOES;
    window.APP_UTILS = APP_UTILS;
    window.USUARIOS_AUTORIZADOS = USUARIOS_AUTORIZADOS;
    
    // Funções de sistema
    window.logout = logout;
    window.verificarSessaoAtiva = verificarSessaoAtiva;
    window.getUsuarioLogado = getUsuarioLogado;
    window.getNivelUsuario = getNivelUsuario;
    window.getUsuarioInfo = getUsuarioInfo;
    window.registrarAtividade = registrarAtividade;
    window.getLogsAtividades = getLogsAtividades;
    window.exportarConfiguracoes = exportarConfiguracoes;
    window.gerarRelatorioConfiguracao = gerarRelatorioConfiguracao;
    window.mostrarInfoSistema = mostrarInfoSistema;
    window.copiarInformacoesSistema = copiarInformacoesSistema;
    window.inicializarConfiguracoes = inicializarConfiguracoes;
    window.alternarTema = alternarTema;
    window.temPermissao = temPermissao;
    window.podeExecutar = podeExecutar;
    window.getUsuariosDisponiveis = getUsuariosDisponiveis;
    
    // Sistema de logs de auditoria
    window.registrarLogAuditoria = registrarLogAuditoria;
    window.getLogsAuditoria = getLogsAuditoria;
    window.exportarLogsAuditoria = exportarLogsAuditoria;
    window.visualizarLogsAuditoria = visualizarLogsAuditoria;
    window.filtrarLogsPorUsuario = filtrarLogsPorUsuario;
    window.filtrarLogsPorAcao = filtrarLogsPorAcao;
}

// Exportar para módulos (se usando Node.js/CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        JSONBIN_CONFIG,
        INITIAL_DATA,
        APP_CONFIG,
        PERMISSOES,
        APP_UTILS,
        USUARIOS_AUTORIZADOS,
        // Funções de sistema
        logout,
        verificarSessaoAtiva,
        getUsuarioLogado,
        getNivelUsuario,
        getUsuarioInfo,
        registrarAtividade,
        getLogsAtividades,
        exportarConfiguracoes,
        gerarRelatorioConfiguracao,
        mostrarInfoSistema,
        copiarInformacoesSistema,
        inicializarConfiguracoes,
        alternarTema,
        temPermissao,
        podeExecutar,
        getUsuariosDisponiveis,
        // Sistema de logs de auditoria
        registrarLogAuditoria,
        getLogsAuditoria,
        exportarLogsAuditoria,
        visualizarLogsAuditoria
    };
}

// Inicializar configurações quando o script carregar
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarConfiguracoes);
} else {
    inicializarConfiguracoes();
}

// Registrar inicialização do sistema
setTimeout(() => {
    if (typeof window !== 'undefined') {
        registrarAtividade('SISTEMA_INICIADO', 'Sistema de gestão de equipamentos carregado');
    }
}, 1000);
