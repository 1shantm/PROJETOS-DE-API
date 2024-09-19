import XLSX from 'xlsx';
import axios from 'axios';

// Dados para editar
const endPoint = 'https://simsenhoritaotica.atenderbem.com/int/createOpportunity';
const apiKey = 'Ss010416@';
const queueId = 10;

// Corrigindo o caminho do arquivo
const filePath = "C:\\Users\\Usuario\\Desktop\\Nova pasta (9)\\Modelo de CRM - Copia (2).xlsx";
const dataPlan = XLSX.readFile(filePath);

// Acessando corretamente o nome da primeira planilha
const sheetName = dataPlan.SheetNames[0];
const dataSheet = dataPlan.Sheets[sheetName];

// Convertendo a planilha para JSON
const data = XLSX.utils.sheet_to_json(dataSheet);

/*itens essenciais

            queueId,
            apiKey,
            fkPipeline: dataItem.fkPipeline || 0,
            fkStage: dataItem.fkStage || 0,
            responsableid: dataItem.responsableid || 0,
            title: dataItem.title || "string",
            clientid: dataItem.clientid || "string",
            mainphone: String(dataItem.mainphone || ""),

*/

// Função para enviar dados para a API
const sendDataToAPI = async (dataItem) => {
    try {
        const payload = {
            queueId,
            apiKey,
            fkPipeline: dataItem.fkPipeline || 0,
            fkStage: dataItem.fkStage || 0,
            responsableid: dataItem.responsableid || 0,
            title: dataItem.title || "string",
            clientid: dataItem.clientid || "string",
            mainphone: String(dataItem.mainphone || ""),
            origin: dataItem.origin || 0
        };

        console.log('Enviando dados', payload);
        const response = await axios.post(endPoint, payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('Dados enviados com sucesso', response.data);

    } catch (error) {
        handleAPIError(error, dataItem);
    }
};

// Função para lidar com os erros da API
const handleAPIError = (error, dataItem) => {
    if (error.response) {
        console.error('Erro na resposta da API:', error.response.data);
        console.error('Status da resposta:', error.response.status);
        console.error('Headers da resposta:', error.response.headers);
    } else if (error.request) {
        console.error('Nenhuma resposta recebida:', error.request);
    } else {
        console.error('Erro ao configurar a solicitação:', error.message);
    }
    console.error('Dados enviados:', dataItem);
};

// Enviando um objeto por vez
const sendAllData = async () => {
    for (const item of data) {
        try {
            await sendDataToAPI(item); // Envia um item por vez e aguarda a conclusão
        } catch (err) {
            console.error('Erro ao enviar os dados:', err);
        }
    }
};

sendAllData(); // Inicia o envio dos dados
