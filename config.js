// CONFIGURAÇÃO ESSENCIAL
const JSONBIN_CONFIG = {
    BIN_ID: '696fa19fae596e708fe90a63',
    BIN_USUARIOS: { ID: '6978e17b43b1c97be94efa1b', BASE_URL: 'https://api.jsonbin.io/v3/b' },
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$gHdA8KAK/9HnnagDiMTlHeBUzNo9cWC0lR8EL0IaUpJg5ChpGiz/i',
        'X-Bin-Versioning': 'false'
    }
};

// DADOS INICIAIS ESSENCIAIS
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
                    descricao: "Detectada vibração 15% acima do normal",
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
    nextEquipamentoId: 4,
    nextPendenciaId: 3
};

// PERMISSÕES BÁSICAS
const PERMISSOES = {
    niveis: {
        "operador": {
            nome: "Operador",
            nivel: 1,
            cor: "#3498db",
            icone: "fa-user",
            permissoes: ["visualizar_equipamentos", "ver_detalhes", "criar_pendencias"]
        },
        "supervisor": {
            nome: "Supervisor",
            nivel: 2,
            cor: "#f39c12",
            icone: "fa-user-tie",
            permissoes: ["visualizar_equipamentos", "ver_detalhes", "criar_pendencias", "editar_pendencias", "excluir_pendencias", "exportar_dados"]
        },
        "manutencao": {
            nome: "Técnico de Manutenção",
            nivel: 2,
            cor: "#9b59b6",
            icone: "fa-tools",
            permissoes: ["visualizar_equipamentos", "ver_detalhes", "criar_pendencias", "editar_pendencias", "excluir_pendencias", "exportar_dados"]
        },
        "engenharia": {
            nome: "Engenharia",
            nivel: 3,
            cor: "#2ecc71",
            icone: "fa-user-cog",
            permissoes: ["visualizar_equipamentos", "ver_detalhes", "criar_pendencias", "editar_pendencias", "excluir_pendencias", "criar_equipamentos", "editar_equipamentos", "exportar_dados"]
        },
        "administrador": {
            nome: "Administrador",
            nivel: 4,
            cor: "#e74c3c",
            icone: "fa-user-shield",
            permissoes: ["visualizar_equipamentos", "ver_detalhes", "criar_pendencias", "editar_pendencias", "excluir_pendencias", "criar_equipamentos", "editar_equipamentos", "exportar_dados", "configurar_sistema", "gerenciar_usuarios"]
        }
    },
    
    verificarPermissao: function(usuario, permissao) {
        if (!usuario) return false;
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes'];
        if (permissoesBasicas.includes(permissao)) return true;
        const nivel = this.niveis[usuario];
        return nivel ? nivel.permissoes.includes(permissao) : false;
    },
    
    getNomeNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.nome : 'Usuário';
    },
    
    getCorNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.cor : '#95a5a6';
    },
    
    getIconeNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.icone : 'fa-user';
    }
};

// CONFIGURAÇÃO DA APLICAÇÃO
const APP_CONFIG = {
    setores: {
        "moagem-moagem": "MOAGEM / MOAGEM",
        "flotacao-flot-rougher": "FLOTAÇÃO / FLOT ROUGHER",
        "flotacao-flot-cleaner-scavenger": "FLOTAÇÃO / FLOT CLEANER-SCAVENGER",
        "flotacao-flot-pirita": "FLOTAÇÃO / FLOT PIRITA",
        "filtragem-filtragem-concentrado": "FILTRAGEM / FILTRAGEM DE CONCENTRADO",
        "filtragem-filtragem-rejeito": "FILTRAGEM / FILTRAGEM DE REJEITO",
        "reagentes-pax": "REAGENTES / PAX",
        "reagentes-dtf": "REAGENTES / DTF",
        "reagentes-espumante": "REAGENTES / ESPUMANTE",
        "reagentes-leite-de-cal": "REAGENTES / LEITE DE CAL",
        "reagentes-acido-sulfurico": "REAGENTES / ÁCIDO SULFÚRICO",
        "reagentes-floculante": "REAGENTES / FLOCULANTE",
        "utilidades-distribuicao-agua": "UTILIDADES / DISTRIBUIÇÃO DE ÁGUA",
        "torre-resfriamento-torre-resfriamento": "TORRE DE RESFRIAMENTO / TORRE DE RESFRIAMENTO"
    },
    
    statusEquipamento: {
        "apto": "Apto a Operar",
        "nao-apto": "Não Apto"
    },
    
    statusPendencia: {
        "aberta": "Aberta",
        "em-andamento": "Em Andamento",
        "resolvida": "Resolvida",
        "cancelada": "Cancelada"
    },
    
    prioridades: {
        "baixa": "Baixa",
        "media": "Média",
        "alta": "Alta",
        "critica": "Crítica"
    }
};

// FUNÇÕES ESSENCIAIS
function logout() {
    localStorage.removeItem('gestao_equipamentos_sessao');
    localStorage.removeItem('gestao_equipamentos_usuario');
    localStorage.removeItem('gestao_equipamentos_nivel');
    window.location.href = 'login.html';
}

function alternarTema() {
    const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    localStorage.setItem('gestao_equipamentos_tema', novoTema);
    document.documentElement.setAttribute('data-tema', novoTema);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = novoTema === 'escuro' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    return novoTema;
}

function aplicarTema() {
    const tema = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    document.documentElement.setAttribute('data-tema', tema);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = tema === 'escuro' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// USUÁRIOS AUTORIZADOS
const USUARIOS_AUTORIZADOS = {
    'operador': { senha: 'operador123', nivel: 'operador' },
    'supervisor': { senha: 'supervisor456', nivel: 'supervisor' },
    'administrador': { senha: 'admin789', nivel: 'administrador' },
    'manutencao': { senha: 'manutencao2024', nivel: 'manutencao' },
    'engenharia': { senha: 'engenharia789', nivel: 'engenharia' }
};

// EXPORTAR PARA GLOBAL
if (typeof window !== 'undefined') {
    window.JSONBIN_CONFIG = JSONBIN_CONFIG;
    window.INITIAL_DATA = INITIAL_DATA;
    window.PERMISSOES = PERMISSOES;
    window.APP_CONFIG = APP_CONFIG;
    window.USUARIOS_AUTORIZADOS = USUARIOS_AUTORIZADOS;
    window.logout = logout;
    window.alternarTema = alternarTema;
    window.aplicarTema = aplicarTema;
}

// APLICAR TEMA AO CARREGAR
document.addEventListener('DOMContentLoaded', aplicarTema);
