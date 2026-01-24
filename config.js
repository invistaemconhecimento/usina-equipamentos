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
        'X-Bin-Versioning': 'false' // Desabilita versionamento para simplicidade
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
            pendencias: [
                {
                    id: 1,
                    titulo: "Vibração acima do normal",
                    descricao: "Detectada vibração 15% acima do normal durante operação em carga máxima",
                    responsavel: "Elétrica",
                    prioridade: "alta",
                    data: "2023-10-10",
                    status: "em-andamento"
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
            pendencias: [
                {
                    id: 2,
                    titulo: "Vazamento de óleo isolante",
                    descricao: "Identificado vazamento no tanque principal",
                    responsavel: "Instrumentação",
                    prioridade: "critica",
                    data: "2023-10-05",
                    status: "aberta"
                },
                {
                    id: 3,
                    titulo: "Sistema de refrigeração com ruído",
                    descricao: "Ventiladores apresentando ruído anormal",
                    responsavel: "Mecânica",
                    prioridade: "media",
                    data: "2023-09-30",
                    status: "resolvida"
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
            pendencias: []
        },
        {
            id: 4,
            codigo: "EQP-078",
            nome: "Bomba de Água Principal",
            descricao: "Bomba centrífuga de alta vazão para sistema de resfriamento",
            setor: "torre-resfriamento-torre-resfriamento",
            status: "apto",
            ultimaInspecao: "2023-11-05",
            dataCriacao: "2023-02-15",
            pendencias: [
                {
                    id: 4,
                    titulo: "Vazamento no selo mecânico",
                    descricao: "Pequeno vazamento identificado no selo da bomba",
                    responsavel: "Mecânica",
                    prioridade: "media",
                    data: "2023-11-01",
                    status: "aberta"
                }
            ]
        },
        {
            id: 5,
            codigo: "EQP-155",
            nome: "Sistema de Dosagem PAX",
            descricao: "Sistema automatizado de dosagem de reagente PAX",
            setor: "reagentes-pax",
            status: "nao-apto",
            ultimaInspecao: "2023-09-30",
            dataCriacao: "2023-01-25",
            pendencias: [
                {
                    id: 5,
                    titulo: "Falha na bomba dosadora",
                    descricao: "Bomba dosadora apresentando intermitência na operação",
                    responsavel: "Automação",
                    prioridade: "critica",
                    data: "2023-10-25",
                    status: "aberta"
                },
                {
                    id: 6,
                    titulo: "Calibração de sensores",
                    descricao: "Sensores de nível necessitam calibração",
                    responsavel: "Instrumentação",
                    prioridade: "baixa",
                    data: "2023-10-20",
                    status: "em-andamento"
                }
            ]
        }
    ],
    // Contador para IDs únicos
    nextEquipamentoId: 6,
    nextPendenciaId: 7
};

// Configurações da aplicação
const APP_CONFIG = {
    nome: "Gestão de Equipamentos - Usina",
    versao: "2.0.0",
    
    // Setores da usina (atualizado conforme especificado)
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
    
    // Configurações de cores para status
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
        
        // Itens por página (para futura implementação de paginação)
        itensPorPagina: 20,
        
        // Atualização automática dos dados (em minutos)
        atualizacaoAutomaticaMinutos: 5,
        
        // Habilitar/desabilitar notificações
        notificacoesAtivas: true
    }
};

// Funções auxiliares para a aplicação

// Sistema de Permissões por Nível de Acesso
const PERMISSOES = {
    niveis: {
        "operador": {
            nome: "Operador",
            nivel: 1,
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias_proprias"
            ]
        },
        "supervisor": {
            nome: "Supervisor",
            nivel: 2,
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "exportar_dados"
            ]
        },
        "administrador": {
            nome: "Administrador",
            nivel: 3,
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "criar_equipamentos",
                "editar_equipamentos",
                "exportar_dados",
                "gerenciar_usuarios",
                "configurar_sistema"
            ]
        },
        "manutencao": {
            nome: "Técnico de Manutenção",
            nivel: 2,
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "exportar_dados"
            ]
        },
        "engenharia": {
            nome: "Engenharia",
            nivel: 3,
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "criar_equipamentos",
                "editar_equipamentos",
                "exportar_dados"
            ]
        }
    },
    
    // Verificar se usuário tem permissão
    verificarPermissao: function(usuario, permissao) {
        const nivelUsuario = this.niveis[usuario];
        if (!nivelUsuario) return false;
        
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
    }
};

// Atualizar as credenciais no login.html também!
const USUARIOS_AUTORIZADOS = {
    'operador': { senha: 'operador123', nivel: 'operador' },
    'supervisor': { senha: 'supervisor456', nivel: 'supervisor' },
    'administrador': { senha: 'admin789', nivel: 'administrador' },
    'manutencao': { senha: 'manutencao2024', nivel: 'manutencao' },
    'engenharia': { senha: 'engenharia789', nivel: 'engenharia' }
};

const APP_UTILS = {
    // Formatar data para exibição
    formatarData: function(dataString) {
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
    },
    
    // Formatar data e hora
    formatarDataHora: function(dataString) {
        if (!dataString) return 'Não informada';
        
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dataString;
        }
    },
    
    // Obter cor do status
    getCorStatus: function(status) {
        return APP_CONFIG.coresStatus[status] || '#95a5a6';
    },
    
    // Gerar código único para equipamentos
    gerarCodigoEquipamento: function() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `EQP-${timestamp}-${random}`.toUpperCase();
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
    }
};

// Função para logout (compatibilidade com o sistema de login)
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        // Limpar dados da sessão
        localStorage.removeItem('gestao_equipamentos_sessao');
        localStorage.removeItem('gestao_equipamentos_usuario');
        localStorage.removeItem('gestao_equipamentos_filtros');
        
        // Redirecionar para página de login
        window.location.href = 'login.html';
    }
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
            localStorage.removeItem('gestao_equipamentos_sessao');
            localStorage.removeItem('gestao_equipamentos_usuario');
            return false;
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

// Função para obter informações do usuário logado
function getUsuarioLogado() {
    const usuario = localStorage.getItem('gestao_equipamentos_usuario');
    return usuario || null;
}

// Função para registrar atividade (log)
function registrarAtividade(acao, detalhes) {
    const usuario = getUsuarioLogado();
    const timestamp = new Date().toISOString();
    
    const logEntry = {
        usuario: usuario,
        acao: acao,
        detalhes: detalhes,
        timestamp: timestamp,
        ip: 'local' // Em ambiente real, seria obtido do servidor
    };
    
    // Em ambiente real, enviaria para um servidor de logs
    // Por enquanto, apenas console.log
    console.log('LOG DE ATIVIDADE:', logEntry);
    
    // Salvar no localStorage para histórico local
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs') || '[]');
        logs.unshift(logEntry); // Adicionar no início
        logs = logs.slice(0, 100); // Manter apenas os últimos 100 logs
        localStorage.setItem('gestao_equipamentos_logs', JSON.stringify(logs));
    } catch (e) {
        console.error('Erro ao salvar log:', e);
    }
}

// Função para exportar configurações (para backup)
function exportarConfiguracoes() {
    const configExport = {
        appConfig: APP_CONFIG,
        jsonBinConfig: {
            BIN_ID: JSONBIN_CONFIG.BIN_ID,
            BASE_URL: JSONBIN_CONFIG.BASE_URL
        },
        exportDate: new Date().toISOString(),
        version: APP_CONFIG.versao
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
    const relatorio = `
SISTEMA DE GESTÃO DE EQUIPAMENTOS - USINA
==========================================

VERSÃO: ${APP_CONFIG.versao}
DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}

CONFIGURAÇÕES DO SISTEMA
-------------------------
• Total de Setores Configurados: ${Object.keys(APP_CONFIG.setores).length}
• Status de Equipamentos Disponíveis: ${Object.keys(APP_CONFIG.statusEquipamento).length}
• Prioridades de Pendência: ${Object.keys(APP_CONFIG.prioridades).length}
• Responsáveis: ${APP_CONFIG.responsaveis.length}

SETORES CONFIGURADOS
--------------------
${Object.entries(APP_CONFIG.setores).map(([key, value]) => `• ${value}`).join('\n')}

CONFIGURAÇÃO DE ARMAZENAMENTO
-----------------------------
• Servidor: JSONBin.io
• Bin ID: ${JSONBIN_CONFIG.BIN_ID}
• Modo: ${JSONBIN_CONFIG.headers['X-Bin-Versioning'] === 'false' ? 'Sem versionamento' : 'Com versionamento'}

CONFIGURAÇÕES DE APLICAÇÃO
--------------------------
• Expiração de Sessão: ${APP_CONFIG.appSettings.sessaoExpiracaoHoras} horas
• Atualização Automática: ${APP_CONFIG.appSettings.atualizacaoAutomaticaMinutos} minutos
• Notificações: ${APP_CONFIG.appSettings.notificacoesAtivas ? 'Ativas' : 'Inativas'}

DADOS INICIAIS
--------------
• Equipamentos Cadastrados: ${INITIAL_DATA.equipamentos.length}
• Próximo ID de Equipamento: ${INITIAL_DATA.nextEquipamentoId}
• Próximo ID de Pendência: ${INITIAL_DATA.nextPendenciaId}

USUÁRIO ATUAL
-------------
• Logado: ${getUsuarioLogado() || 'Não autenticado'}

`;
    
    return relatorio;
}

// Função para mostrar informações do sistema
function mostrarInfoSistema() {
    const info = `
=== INFORMAÇÕES DO SISTEMA ===

Aplicação: ${APP_CONFIG.nome}
Versão: ${APP_CONFIG.versao}
Usuário: ${getUsuarioLogado() || 'Não autenticado'}
Data/Hora: ${new Date().toLocaleString('pt-BR')}
Dados Locais: ${localStorage.length} itens
Equipamentos em Memória: ${window.app?.equipamentos?.length || 'N/A'}

Configuração JSONBin:
• Bin ID: ${JSONBIN_CONFIG.BIN_ID}
• Status: ${navigator.onLine ? 'Online' : 'Offline'}

Setores Disponíveis: ${Object.keys(APP_CONFIG.setores).length}
`;
    
    console.log(info);
    alert(info);
}

// Inicializar configurações padrão se necessário
function inicializarConfiguracoes() {
    // Verificar se existe configuração de filtros salvos
    if (!localStorage.getItem('gestao_equipamentos_filtros')) {
        localStorage.setItem('gestao_equipamentos_filtros', JSON.stringify({
            status: 'all',
            pendencia: 'all',
            busca: '',
            viewMode: 'grid'
        }));
    }
    
    // Verificar se existe configuração de tema
    if (!localStorage.getItem('gestao_equipamentos_tema')) {
        localStorage.setItem('gestao_equipamentos_tema', 'claro');
    }
    
    // Aplicar tema
    const tema = localStorage.getItem('gestao_equipamentos_tema');
    if (tema === 'escuro') {
        document.documentElement.setAttribute('data-tema', 'escuro');
    }
}

// Função para alternar tema (claro/escuro)
function alternarTema() {
    const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    
    localStorage.setItem('gestao_equipamentos_tema', novoTema);
    document.documentElement.setAttribute('data-tema', novoTema);
    
    // Registrar atividade
    registrarAtividade('ALTERAR_TEMA', `Tema alterado para ${novoTema}`);
    
    return novoTema;
}

// Exportar configurações para uso global
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
    window.JSONBIN_CONFIG = JSONBIN_CONFIG;
    window.INITIAL_DATA = INITIAL_DATA;
    window.APP_UTILS = APP_UTILS;
    window.logout = logout;
    window.verificarSessaoAtiva = verificarSessaoAtiva;
    window.getUsuarioLogado = getUsuarioLogado;
    window.registrarAtividade = registrarAtividade;
    window.exportarConfiguracoes = exportarConfiguracoes;
    window.gerarRelatorioConfiguracao = gerarRelatorioConfiguracao;
    window.mostrarInfoSistema = mostrarInfoSistema;
    window.inicializarConfiguracoes = inicializarConfiguracoes;
    window.alternarTema = alternarTema;
}

// Exportar para módulos (se usando Node.js/CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        JSONBIN_CONFIG,
        INITIAL_DATA,
        APP_CONFIG,
        APP_UTILS,
        logout,
        verificarSessaoAtiva,
        getUsuarioLogado,
        registrarAtividade,
        exportarConfiguracoes,
        gerarRelatorioConfiguracao,
        mostrarInfoSistema,
        inicializarConfiguracoes,
        alternarTema
    };
}

// Inicializar configurações quando o script carregar
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarConfiguracoes);
} else {
    inicializarConfiguracoes();
}

// Adicionar CSS para tema escuro
const temaCSS = `
[data-tema="escuro"] {
    --cor-fundo: #1a1a2e;
    --cor-texto: #e6e6e6;
    --cor-cabecalho: #16213e;
    --cor-card: #0f3460;
    --cor-borda: #2d4059;
    --cor-destaque: #3498db;
}

[data-tema="escuro"] body {
    background-color: var(--cor-fundo);
    color: var(--cor-texto);
}

[data-tema="escuro"] header {
    background: linear-gradient(135deg, var(--cor-cabecalho), #0f3460);
}

[data-tema="escuro"] .filters,
[data-tema="escuro"] .actions,
[data-tema="escuro"] .equipamento-card,
[data-tema="escuro"] .modal-content {
    background-color: var(--cor-card);
    border-color: var(--cor-borda);
}

[data-tema="escuro"] .btn-primary {
    background-color: var(--cor-destaque);
}

[data-tema="escuro"] .filter-group label,
[data-tema="escuro"] .actions h3,
[data-tema="escuro"] .filters h3 {
    color: var(--cor-texto);
}

[data-tema="escuro"] .btn-secondary {
    background-color: var(--cor-borda);
    color: var(--cor-texto);
}

[data-tema="escuro"] input,
[data-tema="escuro"] select,
[data-tema="escuro"] textarea {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--cor-texto);
    border-color: var(--cor-borda);
}
`;

// Adicionar estilo de tema se não existir
if (!document.querySelector('#tema-css')) {
    const style = document.createElement('style');
    style.id = 'tema-css';
    style.textContent = temaCSS;
    document.head.appendChild(style);
}
