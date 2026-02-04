// ===========================================
// CONFIGURAÇÃO DO SISTEMA DE GESTÃO DE EQUIPAMENTOS
// ===========================================

// Configuração do JSONBin.io
const JSONBIN_CONFIG = {
    // ID do bin que você criou no JSONBin.io
    BIN_ID: '696fa19fae596e708fe90a63',

    // ID do bin para usuários (NOVO)
    BIN_USUARIOS: {
        ID: '6978e17b43b1c97be94efa1b',
        BASE_URL: 'https://api.jsonbin.io/v3/b'
    },
    
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
            pendencias: [
                {
                    id: 1,
                    titulo: "Vibração acima do normal",
                    descricao: "Detectada vibração 15% acima do normal durante operação em carga máxima",
                    responsavel: "Elétrica",
                    prioridade: "alta",
                    data: "2023-10-10",
                    status: "em-andamento",
                    criadoPor: "supervisor",
                    criadoEm: "2023-10-10T10:30:00"
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
            pendencias: [
                {
                    id: 2,
                    titulo: "Vazamento de óleo isolante",
                    descricao: "Identificado vazamento no tanque principal",
                    responsavel: "Instrumentação",
                    prioridade: "critica",
                    data: "2023-10-05",
                    status: "aberta",
                    criadoPor: "operador",
                    criadoEm: "2023-10-05T08:15:00"
                },
                {
                    id: 3,
                    titulo: "Sistema de refrigeração com ruído",
                    descricao: "Ventiladores apresentando ruído anormal",
                    responsavel: "Mecânica",
                    prioridade: "media",
                    data: "2023-09-30",
                    status: "resolvida",
                    criadoPor: "manutencao",
                    criadoEm: "2023-09-30T14:20:00",
                    resolvidoPor: "manutencao",
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
            criadoPor: "engenharia",
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
        "operador": {
            nome: "Operador",
            nivel: 1,
            cor: "#3498db",
            icone: "fa-user",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias_proprias"
            ],
            restricoes: [
                "nao_pode_criar_equipamentos",
                "nao_pode_excluir_pendencias_outros",
                "nao_pode_exportar_dados"
            ]
        },
        "supervisor": {
            nome: "Supervisor",
            nivel: 2,
            cor: "#f39c12",
            icone: "fa-user-tie",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "exportar_dados",
                "gerar_relatorios"
            ],
            restricoes: [
                "nao_pode_criar_equipamentos",
                "nao_pode_editar_equipamentos",
                "nao_pode_configurar_sistema"
            ]
        },
        "manutencao": {
            nome: "Técnico de Manutenção",
            nivel: 2,
            cor: "#9b59b6",
            icone: "fa-tools",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "exportar_dados",
                "marcar_pendencias_resolvidas"
            ],
            restricoes: [
                "nao_pode_criar_equipamentos",
                "nao_pode_editar_equipamentos",
                "nao_pode_configurar_sistema"
            ]
        },
        "engenharia": {
            nome: "Engenharia",
            nivel: 3,
            cor: "#2ecc71",
            icone: "fa-user-cog",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "criar_equipamentos",
                "editar_equipamentos",
                "exportar_dados",
                "gerar_relatorios",
                "configurar_setores"
            ],
            restricoes: [
                "nao_pode_gerenciar_usuarios",
                "nao_pode_configurar_sistema_completo"
            ]
        },
        "administrador": {
            nome: "Administrador",
            nivel: 4,
            cor: "#e74c3c",
            icone: "fa-user-shield",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "criar_equipamentos",
                "editar_equipamentos",
                "exportar_dados",
                "gerar_relatorios",
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
        if (!usuario) return false;
        
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
        return nivel ? nivel.nome : 'Usuário';
    },
    
    // Obter nível numérico
    getNivelNumerico: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.nivel : 0;
    },
    
    // Obter cor do nível
    getCorNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.cor : '#95a5a6';
    },
    
    // Obter ícone do nível
    getIconeNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.icone : 'fa-user';
    },
    
    // Listar todos os níveis disponíveis
    getTodosNiveis: function() {
        return Object.keys(this.niveis);
    },
    
    // Verificar se usuário pode executar ação específica
    podeExecutarAcao: function(usuario, acao, recurso, donoRecurso = null) {
        if (!usuario) return false;
        
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
                if (recurso === 'pendencia') {
                    if (donoRecurso === usuario) {
                        return true; // Dono sempre pode excluir
                    }
                    return nivel.permissoes.includes('excluir_pendencias');
                }
                break;
                
            case 'exportar':
                return nivel.permissoes.includes('exportar_dados');
                
            case 'configurar':
                return nivel.permissoes.includes('configurar_sistema');
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
    versao: "2.1.0",
    
    // Setores da usina
    setores: {

        // BRITAGEM
        "britagem-britagem": "BRITAGEM / BRITAGEM",
        
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
        CRIAR_PENDENCIA: "CRIAR_PENDENCIA",
        EDITAR_PENDENCIA: "EDITAR_PENDENCIA",
        EXCLUIR_PENDENCIA: "EXCLUIR_PENDENCIA",
        EXPORTAR_DADOS: "EXPORTAR_DADOS",
        ALTERAR_TEMA: "ALTERAR_TEMA",
        CONFIGURAR_SISTEMA: "CONFIGURAR_SISTEMA"
    }
    // Tipos de ações registradas nos logs (ATUALIZADO)
    tiposAcao: {
        LOGIN: "LOGIN",
        LOGOUT: "LOGOUT",
        CRIAR_EQUIPAMENTO: "CRIAR_EQUIPAMENTO",
        EDITAR_EQUIPAMENTO: "EDITAR_EQUIPAMENTO",
        CRIAR_PENDENCIA: "CRIAR_PENDENCIA",
        EDITAR_PENDENCIA: "EDITAR_PENDENCIA",
        EXCLUIR_PENDENCIA: "EXCLUIR_PENDENCIA",
        EXPORTAR_DADOS: "EXPORTAR_DADOS",
        ALTERAR_TEMA: "ALTERAR_TEMA",
        CONFIGURAR_SISTEMA: "CONFIGURAR_SISTEMA",
        // NOVOS
        ALTERAR_STATUS_PENDENCIA: "ALTERAR_STATUS_PENDENCIA",
        ATUALIZAR_PENDENCIA: "ATUALIZAR_PENDENCIA",
        ADICIONAR_COMENTARIO: "ADICIONAR_COMENTARIO"
    },
    
    // Configurações para histórico
    historicoConfig: {
        manterHistoricoCompleto: true,
        diasRetencaoHistorico: 365, // Manter histórico por 1 ano
        maxAlteracoesPorPendencia: 50 // Limitar para não ficar muito grande
    }
};

// Adicionar funções utilitárias para histórico
const APP_UTILS = {
    // ... funções existentes
    
    // Nova função para criar entrada de histórico
    criarEntradaHistorico: function(acao, usuario, alteracoes = {}, comentario = '') {
        return {
            timestamp: new Date().toISOString(),
            usuario: usuario,
            acao: acao,
            alteracoes: alteracoes,
            comentario: comentario,
            ip: 'local' // Em produção, pegar do servidor
        };
    },
    
    // Comparar objetos para detectar alterações
    compararObjetos: function(obj1, obj2) {
        const alteracoes = {};
        
        // Verificar todas as propriedades do novo objeto
        for (const key in obj2) {
            if (obj1[key] !== obj2[key]) {
                alteracoes[key] = {
                    anterior: obj1[key],
                    novo: obj2[key],
                    data: new Date().toISOString()
                };
            }
        }
        
        return alteracoes;
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
    'operador': { 
        senha: 'operador123', 
        nivel: 'operador',
        nome: 'João Silva',
        email: 'joao.silva@empresa.com',
        departamento: 'Operações'
    },
    'supervisor': { 
        senha: 'supervisor456', 
        nivel: 'supervisor',
        nome: 'Maria Santos',
        email: 'maria.santos@empresa.com',
        departamento: 'Supervisão'
    },
    'administrador': { 
        senha: 'admin789', 
        nivel: 'administrador',
        nome: 'Alexandre Oliveira',
        email: 'alexandre.oliveira@ero.com',
        departamento: 'Beneficiamento'
    },
    'manutencao': { 
        senha: 'manutencao2024', 
        nivel: 'manutencao',
        nome: 'Pedro Costa',
        email: 'pedro.costa@empresa.com',
        departamento: 'Manutenção'
    },
    'engenharia': { 
        senha: 'engenharia789', 
        nivel: 'engenharia',
        nome: 'Ana Rodrigues',
        email: 'ana.rodrigues@empresa.com',
        departamento: 'Engenharia'
    }
};

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

Criação: Aline Suene & Alexandre Oliveira
Programação: Alexandre Oliveira

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

// Função para aplicar tema em qualquer página
function aplicarTema() {
    const tema = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    document.documentElement.setAttribute('data-tema', tema);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (tema === 'escuro') {
                icon.className = 'fas fa-sun';
                themeToggle.title = 'Alternar para tema claro';
            } else {
                icon.className = 'fas fa-moon';
                themeToggle.title = 'Alternar para tema escuro';
            }
        }
    }
}

// Função para alternar tema - ATUALIZADA
function alternarTema() {
    const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    
    // Salvar tema no localStorage
    localStorage.setItem('gestao_equipamentos_tema', novoTema);
    
    // Aplicar tema imediatamente
    document.documentElement.setAttribute('data-tema', novoTema);
    
    // Atualizar ícone do botão se ele existir na página
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (novoTema === 'escuro') {
                icon.className = 'fas fa-sun';
                themeToggle.title = 'Alternar para tema claro';
            } else {
                icon.className = 'fas fa-moon';
                themeToggle.title = 'Alternar para tema escuro';
            }
        }
    }
    
    // Registrar atividade
    registrarAtividade('ALTERAR_TEMA', `Tema alterado para ${novoTema}`);
    
    return novoTema;
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
    
    // Aplicar tema
    aplicarTema();
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

// Função para salvar usuários no JSONBin (para admin)
async function salvarUsuariosNoJSONBin(usuarios) {
    try {
        const response = await fetch(
            `${JSONBIN_CONFIG.BIN_USUARIOS.BASE_URL}/${JSONBIN_CONFIG.BIN_USUARIOS.ID}`,
            {
                method: 'PUT',
                headers: JSONBIN_CONFIG.headers,
                body: JSON.stringify({ usuarios })
            }
        );
        
        if (!response.ok) {
            throw new Error('Erro ao salvar usuários');
        }
        
        const result = await response.json();
        console.log('Usuários salvos com sucesso:', result);
        return result;
    } catch (error) {
        console.error('Erro ao salvar usuários:', error);
        throw error;
    }
}

// Função para adicionar novo usuário
async function adicionarNovoUsuario(novoUsuario) {
    try {
        // 1. Carregar usuários existentes
        const response = await fetch(
            `${JSONBIN_CONFIG.BIN_USUARIOS.BASE_URL}/${JSONBIN_CONFIG.BIN_USUARIOS.ID}/latest`,
            { headers: JSONBIN_CONFIG.headers }
        );
        
        if (!response.ok) throw new Error('Erro ao carregar usuários');
        
        const result = await response.json();
        const usuariosAtuais = result.record?.usuarios || USUARIOS_AUTORIZADOS;
        
        // 2. Verificar se usuário já existe
        if (usuariosAtuais.some(u => u.username === novoUsuario.username)) {
            throw new Error('Usuário já existe');
        }
        
        // 3. Adicionar novo usuário
        novoUsuario.dataCriacao = new Date().toISOString().split('T')[0];
        novoUsuario.ativo = true;
        
        const usuariosAtualizados = [...usuariosAtuais, novoUsuario];
        
        // 4. Salvar de volta no JSONBin
        return await salvarUsuariosNoJSONBin(usuariosAtualizados);
        
    } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        throw error;
    }
}

// Adicionar ao objeto window para acesso global
if (typeof window !== 'undefined') {
    window.salvarUsuariosNoJSONBin = salvarUsuariosNoJSONBin;
    window.adicionarNovoUsuario = adicionarNovoUsuario;
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
    window.aplicarTema = aplicarTema;
    window.alternarTema = alternarTema;
    window.temPermissao = temPermissao;
    window.podeExecutar = podeExecutar;
    window.getUsuariosDisponiveis = getUsuariosDisponiveis;
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
        aplicarTema,
        alternarTema,
        temPermissao,
        podeExecutar,
        getUsuariosDisponiveis
    };
}

// Aplicar tema imediatamente ao carregar
aplicarTema();

// Inicializar configurações quando o script carregar
document.addEventListener('DOMContentLoaded', function() {
    inicializarConfiguracoes();
});
