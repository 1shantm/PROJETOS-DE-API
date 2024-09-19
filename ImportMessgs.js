/*
Esse codigo é responsavel por puxar informações de atendimentos de uma api, fazer um filtro por etiquetas de marketing, com base nas informações filtradas, ele vai buscar mensagens de atendimento
de uma segunda api com base nos parametros de perguntasEOpcoes e, para puxar respostas do cliente e coloca-las em uma planilha do excel.
*/

import axios from 'axios';
import XLSX from 'xlsx';


const endpoint = 'Endpoint de detalhes que vai retornar informações da etiqueta';
const apiKey = '123';
const queueId = "ID";
const chatIdFinal = "ID usado para finalizar o for";
const endpointMess = 'Endpoint de mensagens';
const markerArray = "Array de etiquetas"; // Array de markerId válidos

// Armazenando as perguntas e opções fornecidas
const perguntasEOpcoes = {
    "Está pronta?": { 1: "Sim", 2: "Mais tarde" },
    "Você é terapeuta ocupacional formada?": { 1: "Sim", 2: "Não" },
    "Já é aluno da IS Descomplicada?": { 1: "Sim", 2: "Ainda não" },
    "Já fez outros cursos de IS?": { 1: "Sim", 2: "Ainda não fiz" },
    "Você pretende fazer a certificação internacional em IS?": {
        1: "Já concluí",
        2: "Estou fazendo",
        3: "Na lista de espera",
        4: "Não pretendo fazer"
    },
    "Quanto tempo trabalha com Integração Sensorial?": {
        1: "Estou começando agora",
        2: "De 2 a 5 anos",
        3: "De 5 a 10 anos",
        4: "Mais de 10 anos"
    },
    "Podemos começar?": {
        1: "Sim",
        2: "Quero desistir do meu bônus gratuito e sair do processo seletivo"
    },
    "O que me diz?": {
        1: "Sim, quero transformar minha carreira de TO",
        2: "Não, vou sair do processo seletivo e perder meu brinde"
    }
};

const perguntas = Object.keys(perguntasEOpcoes);

// Função para encontrar a pergunta correspondente
function encontrarPergunta(message) {
    for (const pergunta of perguntas) {
        if (message.includes(pergunta)) {
            return pergunta;
        }
    }
    return null;
}

// Função para extrair a resposta correspondente
function obterResposta(opcoes, resposta) {
    const respostaNum = parseInt(resposta, 10);
    return opcoes[respostaNum] || resposta; // Retorna o texto correspondente ou a própria resposta
}

// Função para processar o clientId
function processarClientId(clientId) {
    return clientId.split('@')[0];
}

(async () => {
    const dataParaPlanilha = [];

    for (let i = 95; i < chatIdFinal; i++) { // 'i' é o chatId atual
        const data = {
            queueId: queueId,
            apiKey: apiKey,
            chatId: i // Usar 'i' como chatId
        };
        try {
            const dataReturn = await axios.post(endpoint, data, {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Processando chatId ${i} com markerId ${dataReturn.data.markerId}`);

            // Verificar se o markerId está no array de markerArray
            if (markerArray.includes(dataReturn.data.markerId)) {
                const dataMess = {
                    queueId: queueId,
                    apiKey: apiKey,
                    chatId: dataReturn.data.chatId
                };
                try {
                    const dataMessrespo = await axios.post(endpointMess, dataMess, {
                        headers: {
                            'accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log(`Mensagens recebidas para chatId ${i}:`, dataMessrespo.data.messages);

                    const messages = dataMessrespo.data.messages;

                    // Preparar o objeto de dados para a planilha
                    let linha = {
                        clientName: dataReturn.data.clientName,
                        clientNumber: dataReturn.data.clientNumber,
                        chatId: dataReturn.data.chatId,
                        clientId: processarClientId(dataReturn.data.clientId)
                    };

                    // Encontrar as mensagens de resposta e suas perguntas anteriores
                    for (let j = 0; j < messages.length; j++) {
                        const message = messages[j];
                        if (message.direction === 1) { // Mensagem de resposta
                            const previaMess = messages.slice(0, j).reverse().find(m => m.direction === 2);

                            if (previaMess) {
                                const pergunta = encontrarPergunta(previaMess.message);

                                if (pergunta) {
                                    const opcoes = perguntasEOpcoes[pergunta];
                                    const resposta = message.message.trim();

                                    console.log(`Pergunta anterior: "${pergunta}"`);
                                    console.log(`Resposta recebida: "${resposta}"`);

                                    if (opcoes) {
                                        const respostaTexto = obterResposta(opcoes, resposta);
                                        linha[pergunta] = respostaTexto;
                                    } else {
                                        linha[pergunta] = resposta;
                                    }
                                } else {
                                    console.log(`Nenhuma pergunta correspondente encontrada.`);
                                }
                            } else {
                                console.log(`Nenhuma pergunta anterior encontrada.`);
                            }
                        }
                    }

                    // Adicionar a linha à lista de dados
                    dataParaPlanilha.push(linha);

                } catch (error) {
                    console.error(`Erro ao processar mensagens para chatId ${i}:`, error.response ? error.response.data : error.message);
                }
            } else {
                console.log(`Marker ID ${dataReturn.data.markerId} não encontrado no array para chatId ${i}.`);
            }

        } catch (error) {
            console.error(`Erro ao processar chatId ${i}:`, error.response ? error.response.data : error.message);
        }
    }

    // Criar a planilha
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataParaPlanilha, { header: perguntas.concat(['clientName', 'clientNumber', 'chatId', 'clientId']) });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas');
    XLSX.writeFile(workbook, 'respostas.xlsx');
})();
