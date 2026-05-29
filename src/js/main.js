function atualizarStatusEntrada() {
    const val = document.getElementById('entradaSentenca').value.trim();
    const div = document.getElementById('statusEntrada');
    div.style.display = val.length > 0 ? 'flex' : 'none';
}

const gramatica = {
    naoTerminais: ['S', 'A', 'B', 'C'],
    terminais: ['a', 'b', 'c', 'd', '$'],
    simboloInicial: 'S',
    producoes: {
        'S': [['b', 'B', 'b'], ['a', 'A', 'c'], ['d', 'C', 'c']],
        'A': [['d', 'b', 'B'], ['a', 'A'], ['ε']],
        'B': [['a', 'B'], ['d', 'C', 'b'], ['ε']],
        'C': [['a', 'B', 'b'], ['d', 'a', 'A']]
    }
};

const conjuntoFirst = {
    'S': ['a', 'b', 'd'],
    'A': ['a', 'd', 'ε'],
    'B': ['a', 'd', 'ε'],
    'C': ['a', 'd']
};

const conjuntoFollow = {
    'S': ['$'],
    'A': ['b', 'c'],
    'B': ['b', 'c'],
    'C': ['b', 'c']
};

const tabelaParsing = {
    'S': {
        'a': ['a', 'A', 'c'],
        'b': ['b', 'B', 'b'],
        'd': ['d', 'C', 'c']
    },
    'A': {
        'a': ['a', 'A'],
        'b': ['ε'],
        'c': ['ε'],
        'd': ['d', 'b', 'B']
    },
    'B': {
        'a': ['a', 'B'],
        'b': ['ε'],
        'c': ['ε'],
        'd': ['d', 'C', 'b']
    },
    'C': {
        'a': ['a', 'B', 'b'],
        'd': ['d', 'a', 'A']
    }
};

const sentencasValidas = [
    'bbc',
    'bab',
    'babc',
    'aac',
    'aaac',
    'adbc',
    'adbbc',
    'adbabc',
    'dc',
    'dabb',
    'dabc',
    'dabbc',
    'bdcbb',
    'bdcbc',
    'adabbc'
];

let pilha = [];
let entrada = [];
let posicaoEntrada = 0;
let passos = [];
let indicePasso = 0;
let analiseConcluida = false;

function ehNaoTerminal(simbolo) {
    return gramatica.naoTerminais.includes(simbolo);
}

function tokenizarEntrada(sentenca) {
    return sentenca.replace(/\s/g, '').split('').concat(['$']);
}

function iniciarAutomato() {
    const texto = document.getElementById('entradaSentenca').value.trim();
    if (!texto) return;
    document.getElementById('statusEntrada').style.display = 'none';

    pilha = ['$', gramatica.simboloInicial];
    entrada = tokenizarEntrada(texto);
    posicaoEntrada = 0;
    passos = [];
    indicePasso = 0;
    analiseConcluida = false;

    document.getElementById('tabelaResolucao').innerHTML = '';
    document.getElementById('resultadoFinal').className = 'resultado-final';
    document.getElementById('resultadoFinal').textContent = '';

    const btnProximo = document.getElementById('btnProximo');
    const btnResolver = document.getElementById('btnResolver');
    btnProximo.disabled = false;
    btnProximo.className = 'btn-primario btn-proximo';
    btnResolver.disabled = false;

    gerarPassos();
}

function gerarPassos() {
    let pilhaLocal = ['$', gramatica.simboloInicial];
    let pos = 0;
    let iteracao = 1;

    while (true) {
        const topo = pilhaLocal[pilhaLocal.length - 1];
        const tokenAtual = entrada[pos];
        const pilhaStr = [...pilhaLocal].join('');
        const entradaStr = entrada.slice(pos).join('');

        if (topo === '$' && tokenAtual === '$') {
            passos.push({
                numero: iteracao,
                pilha: pilhaStr,
                entrada: entradaStr,
                acao: 'Aceito em ' + iteracao + ' iterações',
                tipo: 'aceito'
            });
            break;
        }

        if (topo === '$' && tokenAtual !== '$') {
            passos.push({
                numero: iteracao,
                pilha: pilhaStr,
                entrada: entradaStr,
                acao: 'Erro: pilha vazia mas entrada não consumida',
                tipo: 'erro'
            });
            break;
        }

        if (!ehNaoTerminal(topo)) {
            if (topo === tokenAtual) {
                passos.push({
                    numero: iteracao,
                    pilha: pilhaStr,
                    entrada: entradaStr,
                    acao: "Lê '" + topo + "'"
                });
                pilhaLocal.pop();
                pos++;
            } else {
                passos.push({
                    numero: iteracao,
                    pilha: pilhaStr,
                    entrada: entradaStr,
                    acao: "Erro: esperado '" + topo + "' mas encontrou '" + tokenAtual + "'",
                    tipo: 'erro'
                });
                break;
            }
        } else {
            const regra = tabelaParsing[topo] ? tabelaParsing[topo][tokenAtual] : undefined;
            if (!regra) {
                passos.push({
                    numero: iteracao,
                    pilha: pilhaStr,
                    entrada: entradaStr,
                    acao: "Erro: sem regra para " + topo + " com '" + tokenAtual + "'",
                    tipo: 'erro'
                });
                break;
            }
            const producaoStr = regra[0] === 'ε'
                ? topo + ' -> ε'
                : topo + ' -> ' + regra.join('');
            passos.push({
                numero: iteracao,
                pilha: pilhaStr,
                entrada: entradaStr,
                acao: producaoStr
            });
            pilhaLocal.pop();
            if (!(regra.length === 1 && regra[0] === 'ε')) {
                for (let i = regra.length - 1; i >= 0; i--) {
                    pilhaLocal.push(regra[i]);
                }
            }
        }

        iteracao++;
        if (iteracao > 500) {
            passos.push({
                numero: iteracao,
                pilha: [...pilhaLocal].join(''),
                entrada: entrada.slice(pos).join(''),
                acao: 'Erro: limite de iterações atingido',
                tipo: 'erro'
            });
            break;
        }
    }
}

function proximoPasso() {
    if (indicePasso >= passos.length) return;
    adicionarLinhaNaTabela(passos[indicePasso]);
    indicePasso++;
    if (indicePasso >= passos.length) encerrarAnalise();
}

function resolverTudo() {
    while (indicePasso < passos.length) {
        adicionarLinhaNaTabela(passos[indicePasso]);
        indicePasso++;
    }
    encerrarAnalise();
}

function adicionarLinhaNaTabela(passo) {
    const tabela = document.getElementById('tabelaResolucao');
    const tr = document.createElement('tr');
    if (passo.tipo === 'aceito') tr.className = 'linha-aceito';
    if (passo.tipo === 'erro') tr.className = 'linha-erro';

    [passo.numero, passo.pilha, passo.entrada, passo.acao].forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
    });

    tabela.appendChild(tr);
    document.getElementById('ancoraFim').scrollIntoView({ behavior: 'smooth' });
}

function encerrarAnalise() {
    analiseConcluida = true;
    document.getElementById('btnProximo').disabled = true;
    document.getElementById('btnResolver').disabled = true;
    document.getElementById('btnProximo').className = 'btn-primario';

    const ultimo = passos[passos.length - 1];
    const div = document.getElementById('resultadoFinal');
    if (ultimo.tipo === 'aceito') {
        div.textContent = '✔ Sentença ACEITA pela gramática!';
        div.className = 'resultado-final resultado-aceito';
    } else {
        div.textContent = '✘ Sentença REJEITADA pela gramática.';
        div.className = 'resultado-final resultado-rejeitado';
    }
}

function gerarSentencaAleatoria() {
    const sentenca = sentencasValidas[Math.floor(Math.random() * sentencasValidas.length)];
    document.getElementById('entradaSentenca').value = sentenca;
    iniciarAutomato();
}

function alternarAccordion() {
    const corpo = document.getElementById('corpoAccordion');
    const seta = document.getElementById('setaAccordion');
    corpo.classList.toggle('visivel');
    seta.classList.toggle('aberto');
}

function reiniciar() {
    document.getElementById('entradaSentenca').value = '';
    document.getElementById('statusEntrada').style.display = 'none';
    pilha = []; entrada = []; posicaoEntrada = 0;
    passos = []; indicePasso = 0; analiseConcluida = false;
    document.getElementById('tabelaResolucao').innerHTML = '';
    document.getElementById('resultadoFinal').className = 'resultado-final';
    document.getElementById('resultadoFinal').textContent = '';
    document.getElementById('btnProximo').disabled = false;
    document.getElementById('btnResolver').disabled = false;
    document.getElementById('btnProximo').className = 'btn-primario btn-proximo';
}

const construtorEstado = {
    forma: [],
    historico: [],
    indiceAtivo: -1
};

function abrirConstrutor() {
    construtorEstado.forma = ['S'];
    construtorEstado.historico = [];
    construtorEstado.indiceAtivo = -1;
    document.getElementById('modalConstrutor').classList.add('aberto');
    atualizarConstrutor();
}

function fecharConstrutor() {
    document.getElementById('modalConstrutor').classList.remove('aberto');
}

function encontrarProximoNaoTerminal() {
    return construtorEstado.forma.findIndex(s => gramatica.naoTerminais.includes(s));
}

function atualizarConstrutor() {
    const idx = encontrarProximoNaoTerminal();
    construtorEstado.indiceAtivo = idx;

    const divForma = document.getElementById('construtorForma');
    divForma.innerHTML = construtorEstado.forma.map((s, i) => {
        if (i === idx) return `<span class="ativo">${s}</span>`;
        if (gramatica.naoTerminais.includes(s)) return `<span class="nao-terminal">${s}</span>`;
        return `<span class="terminal">${s}</span>`;
    }).join(' ');

    const divRegras = document.getElementById('construtorRegras');
    const divLabel = document.getElementById('construtorLabel');
    const divSucesso = document.getElementById('construtorSucesso');
    const btnUsar = document.getElementById('btnUsarSentenca');

    if (idx === -1) {
        const sentenca = construtorEstado.forma.join('');
        divLabel.textContent = 'Sentença gerada:';
        divRegras.innerHTML = '';
        divSucesso.style.display = 'block';
        divSucesso.textContent = '✔ Sentença pronta: ' + sentenca;
        btnUsar.style.display = 'inline-block';
    } else {
        const simboloAtual = construtorEstado.forma[idx];
        divLabel.textContent = 'Escolha uma regra para expandir ' + simboloAtual + ':';
        divSucesso.style.display = 'none';
        btnUsar.style.display = 'none';

        const producoes = gramatica.producoes[simboloAtual];
        divRegras.innerHTML = '';
        producoes.forEach((prod, i) => {
            const btn = document.createElement('button');
            btn.className = 'btn-regra';
            const prodStr = prod[0] === 'ε' ? 'ε' : prod.join(' ');
            btn.textContent = simboloAtual + ' → ' + prodStr;
            btn.onclick = () => aplicarRegra(i);
            divRegras.appendChild(btn);
        });
    }

    const divHistorico = document.getElementById('construtorHistorico');
    divHistorico.innerHTML = construtorEstado.historico.map(h =>
        `<div class="historico-item">${h}</div>`
    ).join('');
}

function aplicarRegra(indiceProducao) {
    const idx = construtorEstado.indiceAtivo;
    const simbolo = construtorEstado.forma[idx];
    const producao = gramatica.producoes[simbolo][indiceProducao];
    const prodStr = producao[0] === 'ε' ? 'ε' : producao.join('');

    construtorEstado.historico.push(simbolo + ' → ' + prodStr);

    const novaForma = [...construtorEstado.forma];
    if (producao[0] === 'ε') {
        novaForma.splice(idx, 1);
    } else {
        novaForma.splice(idx, 1, ...producao);
    }
    construtorEstado.forma = novaForma;
    atualizarConstrutor();
}

function desfazerPasso() {
    if (construtorEstado.historico.length === 0) return;
    construtorEstado.forma = ['S'];
    construtorEstado.historico = [];
    construtorEstado.indiceAtivo = -1;
    document.getElementById('construtorSucesso').style.display = 'none';
    document.getElementById('btnUsarSentenca').style.display = 'none';
    atualizarConstrutor();
}

function usarSentencaConstruida() {
    const sentenca = construtorEstado.forma.join('');
    document.getElementById('entradaSentenca').value = sentenca;
    fecharConstrutor();
    iniciarAutomato();
}