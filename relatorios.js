// ===========================================
// SISTEMA DE RELATÓRIOS EM PDF
// Gestão de Equipamentos - Usina
// Versão 1.0.0
// ===========================================

class RelatoriosApp {
    constructor(app) {
        this.app = app;
        this.jsPDF = window.jspdf?.jsPDF || window.jspdf;
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
            
            // Criar documento PDF
            const doc = new this.jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Cabeçalho do relatório
            this.adicionarCabecalho(doc, 'RELATÓRIO GERAL DE EQUIPAMENTOS', dataAtual, usuario);
            
            // Estatísticas gerais
            this.adicionarEstatisticasGerais(doc, equipamentos);
            
            // Tabela de equipamentos
            doc.addPage();
            this.adicionarTabelaEquipamentos(doc, equipamentos);
            
            // Estatísticas de pendências por prioridade
            doc.addPage();
            this.adicionarGraficoPendencias(doc, equipamentos);
            
            // Estatísticas de operação
            this.adicionarEstatisticasOperacao(doc, equipamentos);
            
            // Resumo de pendências ativas
            doc.addPage();
            this.adicionarResumoPendencias(doc, equipamentos);
            
            // Rodapé
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
            
            // Criar documento PDF (retrato para relatório individual)
            const doc = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Cabeçalho
            this.adicionarCabecalho(doc, `RELATÓRIO DO EQUIPAMENTO`, dataAtual, usuario);
            
            // Informações do equipamento
            this.adicionarInfoEquipamento(doc, equipamento);
            
            // Estatísticas de operação
            this.adicionarEstatisticasEquipamento(doc, equipamento);
            
            // Histórico de acionamentos
            doc.addPage();
            this.adicionarHistoricoAcionamentos(doc, equipamento);
            
            // Pendências do equipamento
            if (equipamento.pendencias && equipamento.pendencias.length > 0) {
                doc.addPage();
                this.adicionarPendenciasEquipamento(doc, equipamento);
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
            
            const doc = new this.jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            this.adicionarCabecalho(doc, 'RELATÓRIO DE PENDÊNCIAS ATIVAS', dataAtual, usuario);
            
            // Estatísticas de pendências
            this.adicionarEstatisticasPendencias(doc, pendenciasAtivas);
            
            // Tabela de pendências
            doc.addPage();
            this.adicionarTabelaPendencias(doc, pendenciasAtivas);
            
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

    adicionarCabecalho(doc, titulo, data, usuario) {
        // Logo da empresa (texto)
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80); // #2c3e50
        doc.text('USINA DE BENEFICIAMENTO', 20, 20);
        
        doc.setFontSize(16);
        doc.setTextColor(52, 152, 219); // #3498db
        doc.text(titulo, 20, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(127, 140, 141); // #7f8c8d
        doc.text(`Data: ${this.formatarDataCompleta(data)}`, 20, 38);
        doc.text(`Gerado por: ${usuario}`, 20, 44);
        doc.text(`Sistema: Gestão de Equipamentos v2.3.0`, 20, 50);
        
        // Linha separadora
        doc.setDrawColor(189, 195, 199); // #bdc3c7
        doc.line(20, 55, 280, 55);
        
        doc.setY(60);
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

    adicionarEstatisticasGerais(doc, equipamentos) {
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
        doc.text('ESTATÍSTICAS GERAIS', 20, 70);
        
        doc.setFontSize(11);
        
        // Grid de estatísticas
        const stats = [
            { label: 'Total de Equipamentos', value: total, color: [52, 152, 219] },
            { label: 'Aptos a Operar', value: aptos, color: [46, 204, 113] },
            { label: 'Não Aptos', value: naoAptos, color: [231, 76, 60] },
            { label: 'Operantes', value: operantes, color: [46, 204, 113] },
            { label: 'Pendências Ativas', value: totalPendencias, color: [243, 156, 18] },
            { label: 'Pendências Críticas', value: criticas, color: [192, 57, 43] }
        ];
        
        let x = 20;
        let y = 80;
        let col = 0;
        
        stats.forEach((stat, index) => {
            doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
            doc.rect(x, y, 45, 25, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text(stat.value.toString(), x + 5, y + 15);
            
            doc.setFontSize(8);
            doc.text(stat.label, x + 5, y + 22);
            
            x += 50;
            col++;
            
            if (col === 3) {
                x = 20;
                y += 30;
            }
        });
        
        doc.setY(y + 20);
    }

    adicionarTabelaEquipamentos(doc, equipamentos) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('LISTA DE EQUIPAMENTOS', 20, 20);
        
        const headers = [
            ['ID', 'Nome', 'Setor', 'Status', 'Operacional', 'Pendências', 'Tempo Operação']
        ];
        
        const data = equipamentos.map(e => {
            const tempo = this.app.calcularTempoOperacaoAtual(e);
            const tempoFormatado = this.app.formatarTempoAmigavel(tempo);
            
            const pendenciasAtivas = e.pendencias ? 
                e.pendencias.filter(p => p.status !== 'resolvida' && p.status !== 'cancelada').length : 0;
            
            const setorNome = window.APP_CONFIG?.setores[e.setor]?.nome || e.setor;
            
            return [
                e.id,
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
            startY: 25,
            theme: 'grid',
            headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 50 },
                2: { cellWidth: 40 },
                3: { cellWidth: 25 },
                4: { cellWidth: 30 },
                5: { cellWidth: 25 },
                6: { cellWidth: 35 }
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });
    }

    adicionarInfoEquipamento(doc, equipamento) {
        const setorNome = window.APP_CONFIG?.setores[equipamento.setor]?.nome || equipamento.setor;
        
        doc.setFontSize(16);
        doc.setTextColor(52, 152, 219);
        doc.text(equipamento.nome, 20, 70);
        
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
        
        let y = 80;
        info.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(value, 60, y);
            y += 8;
        });
    }

    adicionarEstatisticasEquipamento(doc, equipamento) {
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
        doc.text('ESTATÍSTICAS DO EQUIPAMENTO', 20, 140);
        
        doc.setFontSize(11);
        
        const stats = [
            ['Tempo Total de Operação:', `${horas}h ${minutos}min`],
            ['Total de Acionamentos:', acionamentos.toString()],
            ['Pendências Abertas:', abertas.toString()],
            ['Pendências em Andamento:', andamento.toString()],
            ['Pendências Resolvidas:', resolvidas.toString()],
            ['Pendências Críticas:', criticas.toString()]
        ];
        
        let y = 150;
        stats.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(value, 90, y);
            y += 8;
        });
    }

    adicionarHistoricoAcionamentos(doc, equipamento) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('HISTÓRICO DE ACIONAMENTOS', 20, 20);
        
        const historico = equipamento.historicoAcionamentos || [];
        
        if (historico.length === 0) {
            doc.setFontSize(11);
            doc.text('Nenhum acionamento registrado.', 20, 30);
            return;
        }
        
        const headers = [['Data/Hora', 'Ação', 'Operador', 'Turno', 'Tempo', 'Observação']];
        
        const data = historico.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(h => {
            const data = new Date(h.timestamp);
            const dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
            
            const acao = h.tipo === 'LIGADO' ? 'OPERANTE' : (h.tipo === 'DESLIGADO' ? 'INOPERANTE' : h.tipo);
            const tempoFormatado = h.tempoOperacao ? this.app.formatarTempoAmigavel(h.tempoOperacao) : '-';
            
            return [
                dataStr,
                acao,
                h.operador || '-',
                h.turno || '-',
                tempoFormatado,
                h.observacao || '-'
            ];
        });
        
        doc.autoTable({
            head: headers,
            body: data,
            startY: 25,
            theme: 'grid',
            headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            }
        });
    }

    adicionarPendenciasEquipamento(doc, equipamento) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('PENDÊNCIAS DO EQUIPAMENTO', 20, 20);
        
        const pendencias = equipamento.pendencias || [];
        
        if (pendencias.length === 0) {
            doc.setFontSize(11);
            doc.text('Nenhuma pendência registrada.', 20, 30);
            return;
        }
        
        const headers = [['ID', 'Título', 'Prioridade', 'Status', 'Responsável', 'Data']];
        
        const data = pendencias.sort((a, b) => new Date(b.data) - new Date(a.data)).map(p => {
            const prioridadeNome = window.APP_CONFIG?.prioridades[p.prioridade]?.nome || p.prioridade;
            const statusNome = window.APP_CONFIG?.statusPendencia[p.status]?.nome || p.status;
            
            return [
                p.id,
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
            startY: 25,
            theme: 'grid',
            headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 60 }
            }
        });
    }

    adicionarEstatisticasPendencias(doc, pendencias) {
        const total = pendencias.length;
        const criticas = pendencias.filter(p => p.prioridade === 'critica').length;
        const altas = pendencias.filter(p => p.prioridade === 'alta').length;
        const medias = pendencias.filter(p => p.prioridade === 'media').length;
        const baixas = pendencias.filter(p => p.prioridade === 'baixa').length;
        
        const abertas = pendencias.filter(p => p.status === 'aberta').length;
        const andamento = pendencias.filter(p => p.status === 'em-andamento').length;
        
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('ESTATÍSTICAS DE PENDÊNCIAS', 20, 70);
        
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
        
        let y = 80;
        stats.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(value, 70, y);
            y += 8;
        });
    }

    adicionarTabelaPendencias(doc, pendencias) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('LISTA DE PENDÊNCIAS ATIVAS', 20, 20);
        
        const headers = [['ID', 'Equipamento', 'Título', 'Prioridade', 'Status', 'Responsável', 'Data']];
        
        const data = pendencias.map(p => {
            const prioridadeNome = window.APP_CONFIG?.prioridades[p.prioridade]?.nome || p.prioridade;
            const statusNome = window.APP_CONFIG?.statusPendencia[p.status]?.nome || p.status;
            
            return [
                p.id,
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
            startY: 25,
            theme: 'grid',
            headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 40 },
                2: { cellWidth: 60 }
            }
        });
    }

    adicionarGraficoPendencias(doc, equipamentos) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('PENDÊNCIAS POR PRIORIDADE', 20, 20);
        
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
        
        // Criar uma representação visual simples
        const cores = {
            critica: [192, 57, 43],
            alta: [231, 76, 60],
            media: [243, 156, 18],
            baixa: [46, 204, 113]
        };
        
        const labels = ['Crítica', 'Alta', 'Média', 'Baixa'];
        const valores = [contadores.critica, contadores.alta, contadores.media, contadores.baixa];
        const total = valores.reduce((a, b) => a + b, 0);
        
        let y = 30;
        let x = 30;
        const barWidth = 40;
        const maxBarHeight = 80;
        const maxValor = Math.max(...valores, 1);
        
        // Desenhar barras
        labels.forEach((label, i) => {
            const altura = (valores[i] / maxValor) * maxBarHeight;
            
            // Barra
            doc.setFillColor(cores[label.toLowerCase()][0], cores[label.toLowerCase()][1], cores[label.toLowerCase()][2]);
            doc.rect(x + (i * 50), y + (maxBarHeight - altura), barWidth, altura, 'F');
            
            // Valor
            doc.setFontSize(10);
            doc.setTextColor(44, 62, 80);
            doc.text(valores[i].toString(), x + (i * 50) + 15, y + maxBarHeight - altura - 3);
            
            // Label
            doc.setFontSize(9);
            doc.text(label, x + (i * 50) + 10, y + maxBarHeight + 10);
            
            // Percentual
            const percentual = total > 0 ? ((valores[i] / total) * 100).toFixed(1) : '0';
            doc.text(`${percentual}%`, x + (i * 50) + 12, y + maxBarHeight + 20);
        });
        
        doc.setY(y + maxBarHeight + 40);
    }

    adicionarEstatisticasOperacao(doc, equipamentos) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('ESTATÍSTICAS DE OPERAÇÃO', 20, doc.previousAutoTable?.finalY + 20 || 150);
        
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
        
        let y = (doc.previousAutoTable?.finalY + 30) || 160;
        
        stats.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(value, 80, y);
            y += 8;
        });
    }

    adicionarResumoPendencias(doc, equipamentos) {
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text('RESUMO DE PENDÊNCIAS POR EQUIPAMENTO', 20, 20);
        
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
            doc.text('Nenhuma pendência ativa no momento.', 20, 30);
            return;
        }
        
        const headers = [['Equipamento', 'Total Pendências', 'Críticas']];
        
        doc.autoTable({
            head: headers,
            body: dados,
            startY: 25,
            theme: 'grid',
            headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 4
            }
        });
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
