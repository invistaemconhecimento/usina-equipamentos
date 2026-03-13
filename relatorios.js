// ===========================================
// SISTEMA DE RELATÓRIOS EM PDF
// Gestão de Equipamentos - Usina
// Versão 1.0.0 - CORRIGIDA
// ===========================================

class RelatoriosApp {
    constructor(app) {
        this.app = app;
        // CORREÇÃO: Acesso correto à biblioteca jsPDF
        this.jsPDF = window.jspdf?.jsPDF;
    }

    /**
     * Gera relatório geral de todos os equipamentos
     */
    gerarRelatorioGeral() {
        try {
            this.mostrarMensagem('Gerando relatório geral...', 'info');
            
            const equipamentos = this.app.equipamentos;
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
            
            this.app.registrarAtividade('RELATORIO_GERAL', 'Gerou relatório geral em PDF');
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
            const equipamento = this.app.equipamentos.find(e => e.id === equipamentoId);
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
            
            this.app.registrarAtividade('RELATORIO_EQUIPAMENTO', `Gerou relatório do equipamento: ${equipamento.nome}`);
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
            this.mostrarMensagem('Gerando relatório de pendências...', 'info');
            
            const equipamentos = this.app.equipamentos;
            const dataAtual = new Date();
            const usuario = this.app.usuarioAtual || 'Sistema';
            
            // Coletar todas as pendências ativas
            const pendenciasAtivas = [];
            equipamentos.forEach(equip => {
                if (equip.pendencias) {
                    equip.pendencias.forEach(pend => {
                        if (pend.status !== 'resolvida' && pend.status !== 'cancelada') {
                            pendenciasAtivas.push({
                                ...pend,
                                equipamentoNome: equip.nome,
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
                return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
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
            
            this.app.registrarAtividade('RELATORIO_PENDENCIAS', 'Gerou relatório de pendências');
            this.mostrarMensagem('Relatório de pendências gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório de pendências:', error);
            this.mostrarMensagem('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    // ================== MÉTODOS AUXILIARES ==================

    adicionarCabecalho(doc, titulo, data, usuario, y) {
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
        doc.text(`Gerado por: ${usuario}`, 20, y);
        y += 5;
        doc.text(`Sistema: Gestão de Equipamentos v2.4.0`, 20, y);
        y += 8;
        
        // Linha separadora
        doc.setDrawColor(189, 195, 199); // #bdc3c7
        doc.line(20, y, 280, y);
        y += 5;
        
        return y;
    }

    adicionarRodape(doc) {
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
    }

    adicionarEstatisticasGerais(doc, equipamentos, y) {
        const total = equipamentos.length;
        const aptos = equipamentos.filter(e => e.status === 'apto').length;
        const naoAptos = equipamentos.filter(e => e.status === 'nao-apto').length;
        const operantes = equipamentos.filter(e => e.emLinha?.ativo).length;
        
        let totalPendencias = 0;
        let criticas = 0;
        
        equipamentos.forEach(e => {
            if (e.pendencias) {
                const ativas = e.pendencias.filter(p => p.status !== 'resolvida' && p.status !== 'cancelada');
                totalPendencias += ativas.length;
                criticas += ativas.filter(p => p.prioridade === 'critica').length;
            }
        });
        
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
            doc.setFillColor(52, 152, 219);
            doc.rect(x, colY, 45, 20, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text(stat.value.toString(), x + 5, colY + 12);
            
            doc.setFontSize(8);
            doc.text(stat.label, x + 5, colY + 17);
            
            x += 50;
            
            if ((index + 1) % 3 === 0) {
                x = 20;
                colY += 25;
            }
        });
        
        return colY + 25;
    }

    adicionarTabelaEquipamentos(doc, equipamentos, y) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('LISTA DE EQUIPAMENTOS', 20, y);
        y += 5;
        
        const headers = [['ID', 'Nome', 'Setor', 'Status', 'Operacional', 'Pendências', 'Tempo']];
        
        const data = equipamentos.map(e => {
            const tempo = this.app.calcularTempoOperacaoAtual(e);
            const tempoFormatado = this.app.formatarTempoAmigavel(tempo);
            
            const pendenciasAtivas = e.pendencias ? 
                e.pendencias.filter(p => p.status !== 'resolvida' && p.status !== 'cancelada').length : 0;
            
            const setorNome = window.APP_CONFIG?.setores[e.setor]?.nome || e.setor;
            
            return [
                e.id.toString(),
                e.nome,
                setorNome,
                e.status === 'apto' ? 'Apto' : 'Não Apto',
                e.emLinha?.ativo ? 'OPERANTE' : 'INOPERANTE',
                pendenciasAtivas.toString(),
                tempoFormatado
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
        
        return doc.lastAutoTable.finalY + 10;
    }

    adicionarInfoEquipamento(doc, equipamento, y) {
        const setorNome = window.APP_CONFIG?.setores[equipamento.setor]?.nome || equipamento.setor;
        
        doc.setFontSize(16);
        doc.setTextColor(52, 152, 219);
        doc.text(equipamento.nome, 20, y);
        y += 8;
        
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        
        const info = [
            ['ID:', equipamento.id.toString()],
            ['Setor:', setorNome],
            ['Status:', equipamento.status === 'apto' ? 'Apto a Operar' : 'Não Apto'],
            ['Descrição:', equipamento.descricao || 'Sem descrição'],
            ['Data de Criação:', this.app.formatarData(equipamento.dataCriacao)],
            ['Criado por:', equipamento.criadoPor || 'Sistema'],
            ['Última Inspeção:', equipamento.ultimaInspecao ? this.app.formatarData(equipamento.ultimaInspecao) : 'Não registrada']
        ];
        
        info.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(value, 60, y);
            y += 7;
        });
        
        return y;
    }

    adicionarEstatisticasEquipamento(doc, equipamento, y) {
        const tempoTotal = this.app.calcularTempoOperacaoAtual(equipamento);
        const horas = Math.floor(tempoTotal / 60);
        const minutos = tempoTotal % 60;
        
        const pendencias = equipamento.pendencias || [];
        const abertas = pendencias.filter(p => p.status === 'aberta').length;
        const andamento = pendencias.filter(p => p.status === 'em-andamento').length;
        const resolvidas = pendencias.filter(p => p.status === 'resolvida').length;
        const criticas = pendencias.filter(p => p.prioridade === 'critica' && p.status !== 'resolvida').length;
        
        const acionamentos = equipamento.historicoAcionamentos?.length || 0;
        
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
    }

    adicionarHistoricoAcionamentos(doc, equipamento, y) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('HISTÓRICO DE ACIONAMENTOS', 20, y);
        y += 5;
        
        const historico = equipamento.historicoAcionamentos || [];
        
        if (historico.length === 0) {
            doc.setFontSize(11);
            doc.text('Nenhum acionamento registrado.', 20, y + 10);
            return y + 15;
        }
        
        const headers = [['Data/Hora', 'Ação', 'Operador', 'Tempo', 'Observação']];
        
        const data = historico.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(h => {
            const data = new Date(h.timestamp);
            const dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
            
            const acao = h.tipo === 'LIGADO' ? 'OPERANTE' : (h.tipo === 'DESLIGADO' ? 'INOPERANTE' : h.tipo);
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
        
        return doc.lastAutoTable.finalY + 10;
    }

    adicionarPendenciasEquipamento(doc, equipamento, y) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('PENDÊNCIAS DO EQUIPAMENTO', 20, y);
        y += 5;
        
        const pendencias = equipamento.pendencias || [];
        
        if (pendencias.length === 0) {
            doc.setFontSize(11);
            doc.text('Nenhuma pendência registrada.', 20, y + 10);
            return y + 15;
        }
        
        const headers = [['ID', 'Título', 'Prioridade', 'Status', 'Responsável', 'Data']];
        
        const data = pendencias.sort((a, b) => new Date(b.data) - new Date(a.data)).map(p => {
            const prioridadeNome = window.APP_CONFIG?.prioridades[p.prioridade]?.nome || p.prioridade;
            const statusNome = window.APP_CONFIG?.statusPendencia[p.status]?.nome || p.status;
            
            return [
                p.id.toString(),
                p.titulo,
                prioridadeNome,
                statusNome,
                p.responsavel,
                this.app.formatarData(p.data)
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
        
        return doc.lastAutoTable.finalY + 10;
    }

    adicionarEstatisticasPendencias(doc, pendencias, y) {
        const total = pendencias.length;
        const criticas = pendencias.filter(p => p.prioridade === 'critica').length;
        const altas = pendencias.filter(p => p.prioridade === 'alta').length;
        const medias = pendencias.filter(p => p.prioridade === 'media').length;
        const baixas = pendencias.filter(p => p.prioridade === 'baixa').length;
        
        const abertas = pendencias.filter(p => p.status === 'aberta').length;
        const andamento = pendencias.filter(p => p.status === 'em-andamento').length;
        
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
    }

    adicionarTabelaPendencias(doc, pendencias, y) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('LISTA DE PENDÊNCIAS ATIVAS', 20, y);
        y += 5;
        
        const headers = [['ID', 'Equipamento', 'Título', 'Prioridade', 'Status', 'Responsável', 'Data']];
        
        const data = pendencias.map(p => {
            const prioridadeNome = window.APP_CONFIG?.prioridades[p.prioridade]?.nome || p.prioridade;
            const statusNome = window.APP_CONFIG?.statusPendencia[p.status]?.nome || p.status;
            
            return [
                p.id.toString(),
                p.equipamentoNome,
                p.titulo,
                prioridadeNome,
                statusNome,
                p.responsavel,
                this.app.formatarData(p.data)
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
                1: { cellWidth: 45 },
                2: { cellWidth: 50 }
            }
        });
        
        return doc.lastAutoTable.finalY + 10;
    }

    adicionarGraficoPendencias(doc, equipamentos, y) {
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
        
        equipamentos.forEach(equip => {
            equip.pendencias?.forEach(pend => {
                if (pend.status !== 'resolvida' && pend.status !== 'cancelada') {
                    contadores[pend.prioridade] = (contadores[pend.prioridade] || 0) + 1;
                }
            });
        });
        
        const cores = {
            critica: [192, 57, 43],
            alta: [231, 76, 60],
            media: [243, 156, 18],
            baixa: [46, 204, 113]
        };
        
        const labels = ['Crítica', 'Alta', 'Média', 'Baixa'];
        const valores = [contadores.critica, contadores.alta, contadores.media, contadores.baixa];
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
            const altura = (valores[i] / maxValor) * maxBarHeight;
            
            // Barra
            doc.setFillColor(cores[label.toLowerCase()][0], cores[label.toLowerCase()][1], cores[label.toLowerCase()][2]);
            doc.rect(x + (i * 45), barY + (maxBarHeight - altura), barWidth, altura, 'F');
            
            // Valor
            doc.setFontSize(10);
            doc.setTextColor(44, 62, 80);
            doc.text(valores[i].toString(), x + (i * 45) + 12, barY + maxBarHeight - altura - 3);
            
            // Label
            doc.setFontSize(9);
            doc.text(label, x + (i * 45) + 8, barY + maxBarHeight + 8);
        });
        
        return barY + maxBarHeight + 15;
    }

    adicionarEstatisticasOperacao(doc, equipamentos, y) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('ESTATÍSTICAS DE OPERAÇÃO', 20, y);
        y += 8;
        
        const operantes = equipamentos.filter(e => e.emLinha?.ativo).length;
        const inoperantes = equipamentos.length - operantes;
        
        const tempoTotal = equipamentos.reduce((acc, e) => acc + this.app.calcularTempoOperacaoAtual(e), 0);
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
    }

    adicionarResumoPendencias(doc, equipamentos, y) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('RESUMO DE PENDÊNCIAS POR EQUIPAMENTO', 20, y);
        y += 5;
        
        const dados = [];
        
        equipamentos.forEach(equip => {
            if (equip.pendencias && equip.pendencias.length > 0) {
                const ativas = equip.pendencias.filter(p => p.status !== 'resolvida' && p.status !== 'cancelada');
                if (ativas.length > 0) {
                    const criticas = ativas.filter(p => p.prioridade === 'critica').length;
                    dados.push([
                        equip.nome,
                        ativas.length.toString(),
                        criticas.toString()
                    ]);
                }
            }
        });
        
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
        
        return doc.lastAutoTable.finalY + 10;
    }

    contarAcionamentosHoje(equipamentos) {
        const hoje = new Date().toDateString();
        let total = 0;
        
        equipamentos.forEach(e => {
            if (e.historicoAcionamentos) {
                total += e.historicoAcionamentos.filter(h => {
                    return h.tipo === 'LIGADO' && new Date(h.timestamp).toDateString() === hoje;
                }).length;
            }
        });
        
        return total;
    }

    formatarDataCompleta(data) {
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatarDataParaArquivo(data) {
        return data.toISOString().split('T')[0];
    }

    mostrarMensagem(texto, tipo) {
        if (this.app && this.app.mostrarMensagem) {
            this.app.mostrarMensagem(texto, tipo);
        } else {
            console.log(`[${tipo}] ${texto}`);
        }
    }
}
