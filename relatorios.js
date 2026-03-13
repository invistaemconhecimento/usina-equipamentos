// ===========================================
// SISTEMA DE RELATÓRIOS EM PDF
// Gestão de Equipamentos - Usina
// Versão 1.0.0 - CORRIGIDA
// ===========================================

class RelatoriosApp {
    constructor(app) {
        this.app = app;
        // CORREÇÃO: Validar se a biblioteca existe
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error('Biblioteca jsPDF não carregada corretamente');
        }
        this.jsPDF = window.jspdf?.jsPDF;
    }

    /**
     * Gera relatório geral de todos os equipamentos
     */
    gerarRelatorioGeral() {
        try {
            // CORREÇÃO: Validar dados antes de prosseguir
            if (!this.app || !this.app.equipamentos) {
                this.mostrarMensagem('Dados não disponíveis para gerar relatório', 'error');
                return;
            }
            
            this.mostrarMensagem('Gerando relatório geral...', 'info');
            
            const equipamentos = this.app.equipamentos || [];
            const dataAtual = new Date();
            const usuario = this.app.usuarioAtual || 'Sistema';
            
            // CORREÇÃO: Inicialização correta do jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            let yPos = 20; // Controlador de posição vertical
            
            // Cabeçalho do relatório
            yPos = this.adicionarCabecalho(doc, 'RELATÓRIO GERAL DE EQUIPAMENTOS', dataAtual, usuario, yPos);
            
            // Estatísticas gerais
            yPos = this.adicionarEstatisticasGerais(doc, equipamentos, yPos);
            
            // Tabela de equipamentos
            yPos = this.adicionarTabelaEquipamentos(doc, equipamentos, yPos + 10);
            
            // Verificar se precisa de nova página
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            // Estatísticas de pendências (gráfico)
            yPos = this.adicionarGraficoPendencias(doc, equipamentos, yPos + 10);
            
            // Verificar se precisa de nova página
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            // Estatísticas de operação
            yPos = this.adicionarEstatisticasOperacao(doc, equipamentos, yPos + 10);
            
            // Resumo de pendências ativas
            if (yPos > 200) {
                doc.addPage();
                yPos = 20;
            }
            this.adicionarResumoPendencias(doc, equipamentos, yPos + 10);
            
            // Rodapé em todas as páginas
            this.adicionarRodape(doc);
            
            // Salvar PDF
            const nomeArquivo = `relatorio_geral_${this.formatarDataParaArquivo(dataAtual)}.pdf`;
            doc.save(nomeArquivo);
            
            if (this.app && this.app.registrarAtividade) {
                this.app.registrarAtividade('RELATORIO_GERAL', 'Gerou relatório geral em PDF');
            }
            this.mostrarMensagem('Relatório geral gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório geral:', error);
            this.mostrarMensagem('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    /**
     * Gera relatório detalhado de um equipamento específico
     */
    gerarRelatorioEquipamento(equipamentoId) {
        try {
            if (!this.app || !this.app.equipamentos) {
                this.mostrarMensagem('Dados não disponíveis para gerar relatório', 'error');
                return;
            }
            
            const equipamento = this.app.equipamentos.find(e => e && e.id === equipamentoId);
            if (!equipamento) {
                this.mostrarMensagem('Equipamento não encontrado', 'error');
                return;
            }
            
            this.mostrarMensagem(`Gerando relatório de ${equipamento.nome}...`, 'info');
            
            const dataAtual = new Date();
            const usuario = this.app.usuarioAtual || 'Sistema';
            
            // CORREÇÃO: Inicialização correta do jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            let yPos = 20;
            
            // Cabeçalho
            yPos = this.adicionarCabecalho(doc, `RELATÓRIO DO EQUIPAMENTO`, dataAtual, usuario, yPos);
            
            // Informações do equipamento
            yPos = this.adicionarInfoEquipamento(doc, equipamento, yPos + 10);
            
            // Estatísticas de operação
            yPos = this.adicionarEstatisticasEquipamento(doc, equipamento, yPos + 10);
            
            // Histórico de acionamentos
            if (yPos > 200) {
                doc.addPage();
                yPos = 20;
            }
            yPos = this.adicionarHistoricoAcionamentos(doc, equipamento, yPos + 10);
            
            // Pendências do equipamento
            if (equipamento.pendencias && equipamento.pendencias.length > 0) {
                if (yPos > 200) {
                    doc.addPage();
                    yPos = 20;
                }
                this.adicionarPendenciasEquipamento(doc, equipamento, yPos + 10);
            }
            
            // Rodapé
            this.adicionarRodape(doc);
            
            // Salvar PDF
            const nomeArquivo = `relatorio_${equipamento.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${this.formatarDataParaArquivo(dataAtual)}.pdf`;
            doc.save(nomeArquivo);
            
            if (this.app && this.app.registrarAtividade) {
                this.app.registrarAtividade('RELATORIO_EQUIPAMENTO', `Gerou relatório do equipamento: ${equipamento.nome}`);
            }
            this.mostrarMensagem(`Relatório de ${equipamento.nome} gerado com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório do equipamento:', error);
            this.mostrarMensagem('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    /**
     * Gera relatório de pendências (todas as pendências ativas)
     */
    gerarRelatorioPendencias() {
        try {
            if (!this.app || !this.app.equipamentos) {
                this.mostrarMensagem('Dados não disponíveis para gerar relatório', 'error');
                return;
            }
            
            this.mostrarMensagem('Gerando relatório de pendências...', 'info');
            
            const equipamentos = this.app.equipamentos || [];
            const dataAtual = new Date();
            const usuario = this.app.usuarioAtual || 'Sistema';
            
            // Coletar todas as pendências ativas
            const pendenciasAtivas = [];
            equipamentos.forEach(equip => {
                if (equip && equip.pendencias) {
                    equip.pendencias.forEach(pend => {
                        if (pend && pend.status !== 'resolvida' && pend.status !== 'cancelada') {
                            pendenciasAtivas.push({
                                ...pend,
                                equipamentoNome: equip.nome || 'Desconhecido',
                                equipamentoId: equip.id,
                                equipamentoSetor: equip.setor
                            });
                        }
                    });
                }
            });
            
            // Ordenar por prioridade (crítica primeiro)
            pendenciasAtivas.sort((a, b) => {
                const prioridadeOrder = { 'critica': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
                const prioridadeA = (a && a.prioridade) ? prioridadeOrder[a.prioridade] : 999;
                const prioridadeB = (b && b.prioridade) ? prioridadeOrder[b.prioridade] : 999;
                return prioridadeA - prioridadeB;
            });
            
            // CORREÇÃO: Inicialização correta do jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            let yPos = 20;
            
            yPos = this.adicionarCabecalho(doc, 'RELATÓRIO DE PENDÊNCIAS ATIVAS', dataAtual, usuario, yPos);
            
            // Estatísticas de pendências
            yPos = this.adicionarEstatisticasPendencias(doc, pendenciasAtivas, yPos + 10);
            
            // Tabela de pendências
            if (yPos > 200) {
                doc.addPage();
                yPos = 20;
            }
            this.adicionarTabelaPendencias(doc, pendenciasAtivas, yPos + 10);
            
            this.adicionarRodape(doc);
            
            const nomeArquivo = `relatorio_pendencias_${this.formatarDataParaArquivo(dataAtual)}.pdf`;
            doc.save(nomeArquivo);
            
            if (this.app && this.app.registrarAtividade) {
                this.app.registrarAtividade('RELATORIO_PENDENCIAS', 'Gerou relatório de pendências');
            }
            this.mostrarMensagem('Relatório de pendências gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório de pendências:', error);
            this.mostrarMensagem('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    // ================== MÉTODOS AUXILIARES ==================

    adicionarCabecalho(doc, titulo, data, usuario, y) {
        try {
            // Logo da empresa (texto)
            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80); // #2c3e50
            doc.text('USINA DE BENEFICIAMENTO', 20, y);
            y += 8;
            
            doc.setFontSize(16);
            doc.setTextColor(52, 152, 219); // #3498db
            doc.text(titulo, 20, y);
            y += 8;
            
            doc.setFontSize(10);
            doc.setTextColor(127, 140, 141); // #7f8c8d
            doc.text(`Data: ${this.formatarDataCompleta(data)}`, 20, y);
            y += 5;
            doc.text(`Gerado por: ${usuario || 'Sistema'}`, 20, y);
            y += 5;
            doc.text(`Sistema: Gestão de Equipamentos v2.4.0`, 20, y);
            y += 8;
            
            // Linha separadora
            doc.setDrawColor(189, 195, 199); // #bdc3c7
            doc.line(20, y, 280, y);
            y += 5;
            
            return y;
        } catch (error) {
            console.error('Erro ao adicionar cabeçalho:', error);
            return y + 20;
        }
    }

    adicionarRodape(doc) {
        try {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(127, 140, 141);
                doc.text(
                    `Página ${i} de ${pageCount} - Relatório gerado automaticamente pelo Sistema de Gestão de Equipamentos`,
                    20,
                    285
                );
            }
        } catch (error) {
            console.error('Erro ao adicionar rodapé:', error);
        }
    }

    adicionarEstatisticasGerais(doc, equipamentos, y) {
        try {
            const total = (equipamentos && equipamentos.length) || 0;
            const aptos = (equipamentos && equipamentos.filter(e => e && e.status === 'apto').length) || 0;
            const naoAptos = (equipamentos && equipamentos.filter(e => e && e.status === 'nao-apto').length) || 0;
            const operantes = (equipamentos && equipamentos.filter(e => e && e.emLinha && e.emLinha.ativo).length) || 0;
            
            let totalPendencias = 0;
            let criticas = 0;
            
            if (equipamentos && equipamentos.length > 0) {
                equipamentos.forEach(e => {
                    if (e && e.pendencias) {
                        const ativas = e.pendencias.filter(p => p && p.status !== 'resolvida' && p.status !== 'cancelada');
                        totalPendencias += ativas.length;
                        criticas += ativas.filter(p => p && p.prioridade === 'critica').length;
                    }
                });
            }
            
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('ESTATÍSTICAS GERAIS', 20, y);
            y += 8;
            
            doc.setFontSize(11);
            
            const stats = [
                { label: 'Total de Equipamentos', value: total },
                { label: 'Aptos a Operar', value: aptos },
                { label: 'Não Aptos', value: naoAptos },
                { label: 'Operantes', value: operantes },
                { label: 'Pendências Ativas', value: totalPendencias },
                { label: 'Pendências Críticas', value: criticas }
            ];
            
            let x = 20;
            let colY = y;
            
            stats.forEach((stat, index) => {
                if (stat) {
                    doc.setFillColor(52, 152, 219);
                    doc.rect(x, colY, 45, 20, 'F');
                    
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(16);
                    doc.text((stat.value || 0).toString(), x + 5, colY + 12);
                    
                    doc.setFontSize(8);
                    doc.text(stat.label || 'Desconhecido', x + 5, colY + 17);
                    
                    x += 50;
                    
                    if ((index + 1) % 3 === 0) {
                        x = 20;
                        colY += 25;
                    }
                }
            });
            
            return colY + 25;
        } catch (error) {
            console.error('Erro ao adicionar estatísticas gerais:', error);
            return y + 50;
        }
    }

    adicionarTabelaEquipamentos(doc, equipamentos, y) {
        try {
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('LISTA DE EQUIPAMENTOS', 20, y);
            y += 5;
            
            const headers = [['ID', 'Nome', 'Setor', 'Status', 'Operacional', 'Pendências', 'Tempo']];
            
            // CORREÇÃO: Verificar se equipamentos existe
            const data = equipamentos && equipamentos.length > 0 ? 
                equipamentos.map(e => {
                    if (!e) return ['', '', '', '', '', '', ''];
                    
                    const tempo = e ? this.app.calcularTempoOperacaoAtual(e) : 0;
                    const tempoFormatado = this.app.formatarTempoAmigavel(tempo);
                    
                    const pendenciasAtivas = e && e.pendencias ? 
                        e.pendencias.filter(p => p && p.status !== 'resolvida' && p.status !== 'cancelada').length : 0;
                    
                    const setorNome = (e && e.setor && window.APP_CONFIG && window.APP_CONFIG.setores && window.APP_CONFIG.setores[e.setor] && window.APP_CONFIG.setores[e.setor].nome) || 
                                     (e && e.setor) || 'Não definido';
                    
                    return [
                        (e.id && e.id.toString()) || '',
                        e.nome || '',
                        setorNome,
                        e.status === 'apto' ? 'Apto' : (e.status === 'nao-apto' ? 'Não Apto' : (e.status || '')),
                        (e.emLinha && e.emLinha.ativo) ? 'OPERANTE' : 'INOPERANTE',
                        pendenciasAtivas.toString(),
                        tempoFormatado
                    ];
                }) : [];
            
            doc.autoTable({
                head: headers,
                body: data,
                startY: y,
                theme: 'grid',
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 50 },
                    2: { cellWidth: 45 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 30 }
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });
            
            return (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : y + 50;
        } catch (error) {
            console.error('Erro ao adicionar tabela de equipamentos:', error);
            return y + 50;
        }
    }

    adicionarInfoEquipamento(doc, equipamento, y) {
        try {
            const setorNome = (equipamento && equipamento.setor && window.APP_CONFIG && window.APP_CONFIG.setores && window.APP_CONFIG.setores[equipamento.setor] && window.APP_CONFIG.setores[equipamento.setor].nome) || 
                             (equipamento && equipamento.setor) || 'Não definido';
            
            doc.setFontSize(16);
            doc.setTextColor(52, 152, 219);
            doc.text((equipamento && equipamento.nome) || 'Equipamento', 20, y);
            y += 8;
            
            doc.setFontSize(11);
            doc.setTextColor(44, 62, 80);
            
            const info = [
                ['ID:', (equipamento && equipamento.id && equipamento.id.toString()) || ''],
                ['Setor:', setorNome],
                ['Status:', (equipamento && equipamento.status === 'apto') ? 'Apto a Operar' : 'Não Apto'],
                ['Descrição:', (equipamento && equipamento.descricao) || 'Sem descrição'],
                ['Data de Criação:', (equipamento && this.app.formatarData(equipamento.dataCriacao)) || ''],
                ['Criado por:', (equipamento && equipamento.criadoPor) || 'Sistema'],
                ['Última Inspeção:', (equipamento && equipamento.ultimaInspecao) ? this.app.formatarData(equipamento.ultimaInspecao) : 'Não registrada']
            ];
            
            info.forEach(([label, value]) => {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(value, 60, y);
                y += 7;
            });
            
            return y;
        } catch (error) {
            console.error('Erro ao adicionar informações do equipamento:', error);
            return y + 50;
        }
    }

    adicionarEstatisticasEquipamento(doc, equipamento, y) {
        try {
            const tempoTotal = (equipamento && this.app.calcularTempoOperacaoAtual(equipamento)) || 0;
            const horas = Math.floor(tempoTotal / 60);
            const minutos = tempoTotal % 60;
            
            const pendencias = (equipamento && equipamento.pendencias) || [];
            const abertas = pendencias.filter(p => p && p.status === 'aberta').length;
            const andamento = pendencias.filter(p => p && p.status === 'em-andamento').length;
            const resolvidas = pendencias.filter(p => p && p.status === 'resolvida').length;
            const criticas = pendencias.filter(p => p && p.prioridade === 'critica' && p.status !== 'resolvida').length;
            
            const acionamentos = (equipamento && equipamento.historicoAcionamentos && equipamento.historicoAcionamentos.length) || 0;
            
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('ESTATÍSTICAS DO EQUIPAMENTO', 20, y);
            y += 8;
            
            doc.setFontSize(11);
            
            const stats = [
                ['Tempo Total de Operação:', `${horas}h ${minutos}min`],
                ['Total de Acionamentos:', acionamentos.toString()],
                ['Pendências Abertas:', abertas.toString()],
                ['Pendências em Andamento:', andamento.toString()],
                ['Pendências Resolvidas:', resolvidas.toString()],
                ['Pendências Críticas:', criticas.toString()]
            ];
            
            stats.forEach(([label, value]) => {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(value, 90, y);
                y += 7;
            });
            
            return y;
        } catch (error) {
            console.error('Erro ao adicionar estatísticas do equipamento:', error);
            return y + 50;
        }
    }

    adicionarHistoricoAcionamentos(doc, equipamento, y) {
        try {
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('HISTÓRICO DE ACIONAMENTOS', 20, y);
            y += 5;
            
            const historico = (equipamento && equipamento.historicoAcionamentos) || [];
            
            if (historico.length === 0) {
                doc.setFontSize(11);
                doc.text('Nenhum acionamento registrado.', 20, y + 10);
                return y + 15;
            }
            
            const headers = [['Data/Hora', 'Ação', 'Operador', 'Tempo', 'Observação']];
            
            const data = historico.sort((a, b) => {
                if (!a || !a.timestamp) return 1;
                if (!b || !b.timestamp) return -1;
                return new Date(b.timestamp) - new Date(a.timestamp);
            }).map(h => {
                if (!h) return ['', '', '', '', ''];
                
                const data = new Date(h.timestamp);
                const dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
                
                const acao = h.tipo === 'LIGADO' ? 'OPERANTE' : (h.tipo === 'DESLIGADO' ? 'INOPERANTE' : (h.tipo || '-'));
                const tempoFormatado = h.tempoOperacao ? this.app.formatarTempoAmigavel(h.tempoOperacao) : '-';
                
                return [
                    dataStr,
                    acao,
                    h.operador || '-',
                    tempoFormatado,
                    h.observacao || '-'
                ];
            });
            
            doc.autoTable({
                head: headers,
                body: data,
                startY: y,
                theme: 'grid',
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                }
            });
            
            return (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : y + 50;
        } catch (error) {
            console.error('Erro ao adicionar histórico de acionamentos:', error);
            return y + 50;
        }
    }

    adicionarPendenciasEquipamento(doc, equipamento, y) {
        try {
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('PENDÊNCIAS DO EQUIPAMENTO', 20, y);
            y += 5;
            
            const pendencias = (equipamento && equipamento.pendencias) || [];
            
            if (pendencias.length === 0) {
                doc.setFontSize(11);
                doc.text('Nenhuma pendência registrada.', 20, y + 10);
                return y + 15;
            }
            
            const headers = [['ID', 'Título', 'Prioridade', 'Status', 'Responsável', 'Data']];
            
            const data = pendencias.sort((a, b) => {
                if (!a || !a.data) return 1;
                if (!b || !b.data) return -1;
                return new Date(b.data) - new Date(a.data);
            }).map(p => {
                if (!p) return ['', '', '', '', '', ''];
                
                const prioridadeNome = (p.prioridade && window.APP_CONFIG && window.APP_CONFIG.prioridades && window.APP_CONFIG.prioridades[p.prioridade] && window.APP_CONFIG.prioridades[p.prioridade].nome) || 
                                       p.prioridade || '';
                const statusNome = (p.status && window.APP_CONFIG && window.APP_CONFIG.statusPendencia && window.APP_CONFIG.statusPendencia[p.status] && window.APP_CONFIG.statusPendencia[p.status].nome) || 
                                  p.status || '';
                
                return [
                    (p.id && p.id.toString()) || '',
                    p.titulo || '',
                    prioridadeNome,
                    statusNome,
                    p.responsavel || '',
                    (p.data && this.app.formatarData(p.data)) || ''
                ];
            });
            
            doc.autoTable({
                head: headers,
                body: data,
                startY: y,
                theme: 'grid',
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 50 }
                }
            });
            
            return (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : y + 50;
        } catch (error) {
            console.error('Erro ao adicionar pendências do equipamento:', error);
            return y + 50;
        }
    }

    adicionarEstatisticasPendencias(doc, pendencias, y) {
        try {
            const total = (pendencias && pendencias.length) || 0;
            const criticas = (pendencias && pendencias.filter(p => p && p.prioridade === 'critica').length) || 0;
            const altas = (pendencias && pendencias.filter(p => p && p.prioridade === 'alta').length) || 0;
            const medias = (pendencias && pendencias.filter(p => p && p.prioridade === 'media').length) || 0;
            const baixas = (pendencias && pendencias.filter(p => p && p.prioridade === 'baixa').length) || 0;
            
            const abertas = (pendencias && pendencias.filter(p => p && p.status === 'aberta').length) || 0;
            const andamento = (pendencias && pendencias.filter(p => p && p.status === 'em-andamento').length) || 0;
            
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('ESTATÍSTICAS DE PENDÊNCIAS', 20, y);
            y += 8;
            
            doc.setFontSize(11);
            
            const stats = [
                ['Total de Pendências:', total.toString()],
                ['Críticas:', criticas.toString()],
                ['Altas:', altas.toString()],
                ['Médias:', medias.toString()],
                ['Baixas:', baixas.toString()],
                ['Abertas:', abertas.toString()],
                ['Em Andamento:', andamento.toString()]
            ];
            
            stats.forEach(([label, value]) => {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(value, 70, y);
                y += 7;
            });
            
            return y;
        } catch (error) {
            console.error('Erro ao adicionar estatísticas de pendências:', error);
            return y + 50;
        }
    }

    adicionarTabelaPendencias(doc, pendencias, y) {
        try {
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('LISTA DE PENDÊNCIAS ATIVAS', 20, y);
            y += 5;
            
            const headers = [['ID', 'Equipamento', 'Título', 'Prioridade', 'Status', 'Responsável', 'Data']];
            
            const data = (pendencias && pendencias.length > 0) ? 
                pendencias.map(p => {
                    if (!p) return ['', '', '', '', '', '', ''];
                    
                    const prioridadeNome = (p.prioridade && window.APP_CONFIG && window.APP_CONFIG.prioridades && window.APP_CONFIG.prioridades[p.prioridade] && window.APP_CONFIG.prioridades[p.prioridade].nome) || 
                                           p.prioridade || '';
                    const statusNome = (p.status && window.APP_CONFIG && window.APP_CONFIG.statusPendencia && window.APP_CONFIG.statusPendencia[p.status] && window.APP_CONFIG.statusPendencia[p.status].nome) || 
                                      p.status || '';
                    
                    return [
                        (p.id && p.id.toString()) || '',
                        p.equipamentoNome || '',
                        p.titulo || '',
                        prioridadeNome,
                        statusNome,
                        p.responsavel || '',
                        (p.data && this.app.formatarData(p.data)) || ''
                    ];
                }) : [];
            
            doc.autoTable({
                head: headers,
                body: data,
                startY: y,
                theme: 'grid',
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 50 }
                }
            });
            
            return (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : y + 50;
        } catch (error) {
            console.error('Erro ao adicionar tabela de pendências:', error);
            return y + 50;
        }
    }

    adicionarGraficoPendencias(doc, equipamentos, y) {
        try {
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('PENDÊNCIAS POR PRIORIDADE', 20, y);
            y += 5;
            
            const contadores = {
                critica: 0,
                alta: 0,
                media: 0,
                baixa: 0
            };
            
            // CORREÇÃO: Verificar se equipamentos existe
            if (equipamentos && equipamentos.length > 0) {
                equipamentos.forEach(equip => {
                    if (equip && equip.pendencias && equip.pendencias.length > 0) {
                        equip.pendencias.forEach(pend => {
                            if (pend && pend.status !== 'resolvida' && pend.status !== 'cancelada' && pend.prioridade) {
                                if (contadores.hasOwnProperty(pend.prioridade)) {
                                    contadores[pend.prioridade] = (contadores[pend.prioridade] || 0) + 1;
                                }
                            }
                        });
                    }
                });
            }
            
            const cores = {
                critica: [192, 57, 43],
                alta: [231, 76, 60],
                media: [243, 156, 18],
                baixa: [46, 204, 113]
            };
            
            const labels = ['Crítica', 'Alta', 'Média', 'Baixa'];
            const prioridades = ['critica', 'alta', 'media', 'baixa'];
            const valores = prioridades.map(p => contadores[p] || 0);
            const maxValor = Math.max(...valores, 1);
            
            let barY = y + 10;
            let x = 30;
            const barWidth = 35;
            const maxBarHeight = 60;
            
            // Título do gráfico
            doc.setFontSize(10);
            doc.setTextColor(44, 62, 80);
            doc.text('Distribuição de Pendências por Prioridade', 20, barY - 5);
            
            // Desenhar barras
            labels.forEach((label, i) => {
                const prioridade = prioridades[i];
                if (prioridade && cores[prioridade]) {
                    const altura = (valores[i] / maxValor) * maxBarHeight;
                    
                    // CORREÇÃO: Verificar se a cor existe
                    const cor = cores[prioridade] || [52, 152, 219]; // Azul como fallback
                    
                    // Barra
                    doc.setFillColor(cor[0], cor[1], cor[2]);
                    doc.rect(x + (i * 45), barY + (maxBarHeight - altura), barWidth, altura, 'F');
                    
                    // Valor
                    doc.setFontSize(10);
                    doc.setTextColor(44, 62, 80);
                    doc.text((valores[i] || 0).toString(), x + (i * 45) + 12, barY + maxBarHeight - altura - 3);
                    
                    // Label
                    doc.setFontSize(9);
                    doc.text(label, x + (i * 45) + 8, barY + maxBarHeight + 8);
                }
            });
            
            return barY + maxBarHeight + 15;
        } catch (error) {
            console.error('Erro ao adicionar gráfico de pendências:', error);
            return y + 50;
        }
    }

    adicionarEstatisticasOperacao(doc, equipamentos, y) {
        try {
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('ESTATÍSTICAS DE OPERAÇÃO', 20, y);
            y += 8;
            
            const operantes = (equipamentos && equipamentos.filter(e => e && e.emLinha && e.emLinha.ativo).length) || 0;
            const inoperantes = ((equipamentos && equipamentos.length) || 0) - operantes;
            
            const tempoTotal = (equipamentos && equipamentos.reduce((acc, e) => {
                if (e) {
                    return acc + this.app.calcularTempoOperacaoAtual(e);
                }
                return acc;
            }, 0)) || 0;
            const horasTotal = Math.floor(tempoTotal / 60);
            
            const acionamentosHoje = this.contarAcionamentosHoje(equipamentos);
            
            const stats = [
                ['Equipamentos Operantes:', operantes.toString()],
                ['Equipamentos Inoperantes:', inoperantes.toString()],
                ['Tempo Total Operação:', `${horasTotal} horas`],
                ['Acionamentos Hoje:', acionamentosHoje.toString()]
            ];
            
            doc.setFontSize(11);
            
            stats.forEach(([label, value]) => {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(value, 80, y);
                y += 7;
            });
            
            return y;
        } catch (error) {
            console.error('Erro ao adicionar estatísticas de operação:', error);
            return y + 50;
        }
    }

    adicionarResumoPendencias(doc, equipamentos, y) {
        try {
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text('RESUMO DE PENDÊNCIAS POR EQUIPAMENTO', 20, y);
            y += 5;
            
            const dados = [];
            
            if (equipamentos && equipamentos.length > 0) {
                equipamentos.forEach(equip => {
                    if (equip && equip.pendencias && equip.pendencias.length > 0) {
                        const ativas = equip.pendencias.filter(p => p && p.status !== 'resolvida' && p.status !== 'cancelada');
                        if (ativas.length > 0) {
                            const criticas = ativas.filter(p => p && p.prioridade === 'critica').length;
                            dados.push([
                                equip.nome || 'Desconhecido',
                                ativas.length.toString(),
                                criticas.toString()
                            ]);
                        }
                    }
                });
            }
            
            if (dados.length === 0) {
                doc.setFontSize(11);
                doc.text('Nenhuma pendência ativa no momento.', 20, y + 10);
                return y + 15;
            }
            
            const headers = [['Equipamento', 'Total Pendências', 'Críticas']];
            
            doc.autoTable({
                head: headers,
                body: dados,
                startY: y,
                theme: 'grid',
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                }
            });
            
            return (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : y + 50;
        } catch (error) {
            console.error('Erro ao adicionar resumo de pendências:', error);
            return y + 50;
        }
    }

    contarAcionamentosHoje(equipamentos) {
        try {
            const hoje = new Date().toDateString();
            let total = 0;
            
            if (equipamentos && equipamentos.length > 0) {
                equipamentos.forEach(e => {
                    if (e && e.historicoAcionamentos) {
                        total += e.historicoAcionamentos.filter(h => {
                            return h && h.tipo === 'LIGADO' && h.timestamp && new Date(h.timestamp).toDateString() === hoje;
                        }).length;
                    }
                });
            }
            
            return total;
        } catch (error) {
            console.error('Erro ao contar acionamentos hoje:', error);
            return 0;
        }
    }

    formatarDataCompleta(data) {
        try {
            if (!data) return '';
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
        }
    }

    formatarDataParaArquivo(data) {
        try {
            if (!data) return '';
            return data.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    }

    mostrarMensagem(texto, tipo) {
        if (this.app && this.app.mostrarMensagem) {
            this.app.mostrarMensagem(texto, tipo);
        } else {
            console.log(`[${tipo}] ${texto}`);
        }
    }
}
