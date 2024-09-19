import axios from 'axios';
import { appendFile } from 'fs';
import XLSX from 'xlsx';

// Função para ler a planilha e retornar os dados
async function readExcel(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Garante que há uma aba na planilha
        const sheet = workbook.Sheets[sheetName];

        // Converte a planilha para JSON
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '' }); // Usa 'defval' para evitar undefined

        if (data.length === 0) {
            throw new Error("Nenhum dado encontrado na planilha");
        }

        return data;
    } catch (error) {
        console.error("Erro ao ler a planilha:", error.message);
        throw error;
    }
}

// Endpoints e dados de configuração da API
const endPoint = '';
const apiKey = '123';
const queueId = 14;
const pipelineId = 1;
const endpointedit = '';

// Caminho da planilha
const filePath = '';

// Lê os dados da planilha
const excelData = await readExcel(filePath);

// Armazena as entradas já usadas
const usedEntries = new Set();

// Dados para a primeira requisição
const data = {
    queueId: queueId,
    apiKey: apiKey,
    pipelineId: pipelineId
};

// Solicita dados da primeira API
const retorno = await axios.post(endPoint, data, {
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
});

// Dados retornados pela API
const dataID = retorno.data;

for (let i = 0; i < dataID.length; i++) {
    const apiName = dataID[i].title; // Verifique se 'title' é o nome correto do campo na API

    // Itera sobre os dados da planilha
    for (const excelRow of excelData) {
        const uniqueEntry = `${excelRow.tittle}-${excelRow.Valor}`; // Verifique os nomes das colunas na planilha

        // Verifica se o nome da API corresponde ao nome da planilha e se já foi usado
        if (apiName === excelRow.tittle && !usedEntries.has(uniqueEntry)) {
            usedEntries.add(uniqueEntry); // Marca essa combinação como usada

            // Dados para a segunda API
            const updateData = {
                queueId: queueId,
                apiKey: apiKey,
                id: dataID[i].id, // Corrigido para acessar o 'id' correto
                value: excelRow.Valor // Verifique se 'Valor' é o nome correto da coluna na planilha
            };

            // Faz a segunda requisição
            await axios.post(endpointedit, updateData, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });

            const logMessage = `Enviado para a segunda API: ${excelRow.tittle} com valor ${excelRow.Valor}\n`;
            console.log(logMessage);

            // Salva o log no arquivo
            appendFile('log.txt', logMessage, (err) => {
                if (err) throw err;
                console.log('Log gravado no arquivo.');
            });

            break; // Sai do loop da planilha e vai para o próximo item da API
        }
    }
}
