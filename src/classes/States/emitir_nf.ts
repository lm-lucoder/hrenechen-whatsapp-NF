import State from "../State";
import FluxManager from "../../whatsapp/fluxManager";
import IState, { IHandleMessageProps, IRenderProps } from "../../whatsapp/interfaces/state";
import OpenRouterClient from "../AIClients/OpenRouterClient";
import fs from 'fs/promises';
import path from 'path';
import { validateCpfCnpj } from "../../utils/validateCpfCnpj";
import cleanNumbersString from "../../utils/cleanNumbersString";


class EmitirNFState extends State implements IState {

  constructor(fluxManager: FluxManager) {
    super(fluxManager)
  }

  public async render({ personNumber, message }: IRenderProps): Promise<void> {
    this.handleMessage({ message, personNumber });
  }

  public async handleMessage({ message, personNumber, systemVars }: IHandleMessageProps) {
    const openRouterClient = OpenRouterClient.getInstance();
    if (systemVars) {
      if (systemVars.intencao !== "emitir_nota_fiscal") {
        return this.fluxManager.setPersonState(personNumber, "welcome").render({ personNumber, message });
      }
      if (systemVars.parametros?.nome_do_cliente || systemVars.parametros?.email_do_cliente) {
        // ... Aqui você pode adicionar a lógica para emitir a nota fiscal com os dados fornecidos
      }
    }
    try {
      const { intencao, parametros, proxima_mensagem } = await this._getIntentAndParams(personNumber, message);
      if (
        intencao === "emitir_nota_fiscal" &&
        parametros?.cpf_ou_cnpj &&
        parametros?.valor_da_nf &&
        parametros?.numero_endereco &&
        parametros?.cep
      ) {
        const nfeId = await this._emitirNotaFiscal(parametros, personNumber);
        await this._aguardarEmissaoNota(nfeId, personNumber);
      } else {
        await this.fluxManager.sendMessage({
          personNumber,
          message: proxima_mensagem,
        });
      }
    } catch (error) {
      console.error("Erro ao processar a mensagem da IA:", error);
      //await this.fluxManager.client.sendMessage({ personNumber, message: "Algo deu errado, a IA não conseguiu processar sua solicitação." });
    }
  }

  private async _getIntentAndParams(personNumber: string, message: string): Promise<any> {
    const openRouterClient = OpenRouterClient.getInstance();
    const rawPrompt = await openRouterClient.getPrompt('emitir_nota_fiscal.txt');
    const prompt = rawPrompt
      .replace("{{CHAT_MESSAGES}}", JSON.stringify(this.fluxManager.getChatMessages(personNumber, 10).filter(msg => msg.from === "user")));
    const openRouterResult = await openRouterClient.sendMessage({ messages: [{ role: 'user', content: prompt }] });
    const treatedOpenRouterMessage = openRouterResult
      .replace("```json", "")
      .replace("```", "")
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    return JSON.parse(treatedOpenRouterMessage);
  }

  private async _emitirNotaFiscal(parametros: any, personNumber: string): Promise<string> {
    let nfeRequestData: any = null;
    try {
      const cepResponse = await fetch(`https://viacep.com.br/ws/${cleanNumbersString(parametros.cep)}/json/`);
      if (!cepResponse.ok) {
        throw new CepError();
      }
      const {
        uf: state,
        localidade: city,
        logradouro: street,
        ibge
      } = await cepResponse.json();
      if (!validateCpfCnpj(parametros.cpf_ou_cnpj)) {
        throw new CpfCnpjError();
      }
      nfeRequestData = this._getNFData({ ...parametros, state, city, street, ibge, cpf_ou_cnpj: cleanNumbersString(parametros.cpf_ou_cnpj) });
      const response = await fetch(`https://api.nfse.io/v1/companies/${process.env.COMPANY_ID}/serviceinvoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${process.env.NFE_IO_API_KEY}`
        },
        body: JSON.stringify(nfeRequestData)
      });
      if (!response.ok) {
        throw new EmitirNotaFiscalError();
      }
      await this.fluxManager.sendMessage({ personNumber, message: "Sua nota foi aceita. Aguarde alguns segundos até a emissão." });
      this.fluxManager.setPersonState(personNumber, "welcome");
      const nfData = await response.json();
      return nfData.id;
    } catch (error: any) {
      let userMessage = "Tive um erro ao emitir a nota fiscal. Por favor, verifique se os dados estão corretos.";
      if (error instanceof CepError) {
        userMessage = "O CEP informado é inválido ou não foi encontrado. Por favor, revise o dado.";
      } else if (error instanceof CpfCnpjError) {
        userMessage = "O CPF ou CNPJ informado é inválido. Por favor, revise o dado.";
      } else if (error instanceof EmitirNotaFiscalError) {
        userMessage = "Não foi possível emitir a nota fiscal. Por favor, tente novamente mais tarde ou revise os dados.";
      }
      await this.fluxManager.sendMessage({ personNumber, message: userMessage });
      this.fluxManager.setPersonState(personNumber, "welcome");
      throw new Error(`Erro ao emitir a nota fiscal: ${error.message}`);
    }
  }

  private async _aguardarEmissaoNota(invoiceId: string, personNumber: string): Promise<void> {
    let attempts = 0;
    let flowStatus = '';
    try {
      while (attempts < 100) {
        const statusResponse = await fetch(`https://api.nfse.io/v1/companies/${process.env.COMPANY_ID}/serviceinvoices/${invoiceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.NFE_IO_API_KEY}`
          }
        });
        if (!statusResponse.ok) {
          console.error("Erro ao consultar o status da nota fiscal");
          throw new ConsultarStatusNFError();
        }
        const invoiceJson = await statusResponse.json();
        flowStatus = invoiceJson.flowStatus;
        if (flowStatus === "Issued") {
          // Download do PDF
          const pdfResponse = await fetch(`https://api.nfse.io/v1/companies/${process.env.COMPANY_ID}/serviceinvoices/${invoiceId}/pdf?force=true`, {
            method: 'GET',
            headers: {
              'Authorization': `${process.env.NFE_IO_API_KEY}`
            }
          });
          if (!pdfResponse.ok) {
            console.error("Erro ao baixar o PDF da nota fiscal");
            throw new BaixarPdfNFError();
          }
          const buffer = await pdfResponse.arrayBuffer();
          await this.fluxManager.client.sendDocumentMessage({
            personNumber,
            documentBuffer: Buffer.from(buffer),
            fileName: `${invoiceId}.pdf`,
            mimeType: 'application/pdf',
            caption: 'Nota fiscal emitida com sucesso!'
          });
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
      if (attempts === 100 && flowStatus !== "Issued") {
        await this.fluxManager.sendMessage({
          personNumber,
          message: "Não foi possível emitir a nota fiscal após múltiplas tentativas. Avise o time técnico. O ID da nota fiscal é: " + invoiceId
        });
      }
    } catch (error: any) {
      let userMessage = "Tive um erro ao emitir a nota fiscal. Por favor, verifique se os dados estão corretos.";
      if (error instanceof ConsultarStatusNFError) {
        userMessage = "Não foi possível consultar o status da nota fiscal. Avise o time técnico. O ID da nota fiscal é: " + invoiceId;
      } else if (error instanceof BaixarPdfNFError) {
        userMessage = "Não foi possível baixar o PDF da nota fiscal. Avise o time técnico. O ID da nota fiscal é: " + invoiceId;
      }
      await this.fluxManager.sendMessage({ personNumber, message: userMessage });
      this.fluxManager.setPersonState(personNumber, "welcome");
      throw new Error(`Erro ao emitir a nota fiscal: ${error.message}`);
    }
  }

  private _getNFData({ nome_do_cliente, email_do_cliente, info_adicional_nf, info_adicional_endereco, cpf_ou_cnpj, valor_da_nf, numero_endereco, cep, state, city, street, ibge }: any) {
    const data: any = {
      "Borrower": {
        "FederalTaxNumber": cleanNumbersString(cpf_ou_cnpj),
        "Address": {
          "country": "BRA",
          "postalCode": cleanNumbersString(cep),
          "street": street,
          "number": numero_endereco,
          "additionalInformation": info_adicional_endereco,
          "city": {
            "code": ibge,
            "name": city
          },
          "state": state
        }
      },
      "CityServiceCode": "8219999",
      "Description": "Preparação de documentos e serviços",
      "ServicesAmount": valor_da_nf.replaceAll(",", "."),
    }
    if (nome_do_cliente) {
      data.Borrower.Name = nome_do_cliente;
    }
    if (email_do_cliente) {
      data.Borrower.Email = email_do_cliente;
    }
    if (info_adicional_nf) {
      data.Description += ` - ${info_adicional_nf}`;
    }
    return data
  }
}


// Erros customizados
class CepError extends Error {
  constructor(message = "Erro ao consultar o CEP") {
    super(message);
    this.name = "CepError";
  }
}
class CpfCnpjError extends Error {
  constructor(message = "CPF ou CNPJ inválido") {
    super(message);
    this.name = "CpfCnpjError";
  }
}
class EmitirNotaFiscalError extends Error {
  constructor(message = "Erro ao emitir a nota fiscal") {
    super(message);
    this.name = "EmitirNotaFiscalError";
  }
}
// Erros customizados para emissão
class ConsultarStatusNFError extends Error {
  constructor(message = "Erro ao consultar o status da nota fiscal") {
    super(message);
    this.name = "ConsultarStatusNFError";
  }
}
class BaixarPdfNFError extends Error {
  constructor(message = "Erro ao baixar o PDF da nota fiscal") {
    super(message);
    this.name = "BaixarPdfNFError";
  }
}

export default EmitirNFState;
