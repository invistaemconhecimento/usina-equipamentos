// CONFIGURAÇÃO COMPACTA
const JSONBIN_CONFIG = {
    BIN_ID: '696fa19fae596e708fe90a63',
    BIN_USUARIOS: { ID: '6978e17b43b1c97be94efa1b', BASE_URL: 'https://api.jsonbin.io/v3/b' },
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': '$2a$10$gHdA8KAK/9HnnagDiMTlHeBUzNo9cWC0lR8EL0IaUpJg5ChpGiz/i', 'X-Bin-Versioning': 'false' }
};

const PERMISSOES = {
    niveis: {
        "operador": { nome: "Operador", nivel: 1, cor: "#3498db", icone: "fa-user", permissoes: ["visualizar_equipamentos","ver_detalhes","criar_pendencias","editar_pendencias_proprias"] },
        "supervisor": { nome: "Supervisor", nivel: 2, cor: "#f39c12", icone: "fa-user-tie", permissoes: ["visualizar_equipamentos","ver_detalhes","criar_pendencias","editar_pendencias","excluir_pendencias","exportar_dados","gerar_relatorios"] },
        "manutencao": { nome: "Técnico", nivel: 2, cor: "#9b59b6", icone: "fa-tools", permissoes: ["visualizar_equipamentos","ver_detalhes","criar_pendencias","editar_pendencias","excluir_pendencias","exportar_dados","marcar_pendencias_resolvidas"] },
        "engenharia": { nome: "Engenharia", nivel: 3, cor: "#2ecc71", icone: "fa-user-cog", permissoes: ["visualizar_equipamentos","ver_detalhes","criar_pendencias","editar_pendencias","excluir_pendencias","criar_equipamentos","editar_equipamentos","exportar_dados","gerar_relatorios","configurar_setores"] },
        "administrador": { nome: "Administrador", nivel: 4, cor: "#e74c3c", icone: "fa-user-shield", permissoes: ["visualizar_equipamentos","ver_detalhes","criar_pendencias","editar_pendencias","excluir_pendencias","criar_equipamentos","editar_equipamentos","exportar_dados","gerar_relatorios","configurar_sistema","gerenciar_usuarios","visualizar_logs","backup_dados","restaurar_dados"] }
    },
    verificarPermissao: function(usuario, permissao) {
        if (!usuario) return false;
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes'];
        if (permissoesBasicas.includes(permissao)) return true;
        return this.niveis[usuario]?.permissoes.includes(permissao) || false;
    },
    getNomeNivel: function(usuario) { return this.niveis[usuario]?.nome || 'Usuário'; },
    getCorNivel: function(usuario) { return this.niveis[usuario]?.cor || '#95a5a6'; },
    getIconeNivel: function(usuario) { return this.niveis[usuario]?.icone || 'fa-user'; }
};

// Funções essenciais apenas
function logout() {
    localStorage.removeItem('gestao_equipamentos_sessao');
    localStorage.removeItem('gestao_equipamentos_usuario');
    window.location.href = 'login.html';
}

function alternarTema() {
    const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    localStorage.setItem('gestao_equipamentos_tema', novoTema);
    document.documentElement.setAttribute('data-tema', novoTema);
    return novoTema;
}

function aplicarTema() {
    const tema = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    document.documentElement.setAttribute('data-tema', tema);
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.JSONBIN_CONFIG = JSONBIN_CONFIG;
    window.PERMISSOES = PERMISSOES;
    window.logout = logout;
    window.alternarTema = alternarTema;
    window.aplicarTema = aplicarTema;
}
