import State from "../State";
import FluxManager from "../../whatsapp/fluxManager";
import IState, { IHandleMessageProps, IRenderProps } from "../../whatsapp/interfaces/state";
import OpenRouterClient from "../AIClients/OpenRouterClient";
import fs from 'fs/promises';
import path from 'path';
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
    const rawPrompt = await openRouterClient.getPrompt('emitir_nota_fiscal.txt');
    const prompt = rawPrompt
      .replace("{{CHAT_MESSAGES}}", JSON.stringify(this.fluxManager.getChatMessages(personNumber, 10).filter(msg => msg.from === "user")));
    const openRouterResult = await openRouterClient.sendMessage({ messages: [{ role: 'user', content: prompt }] });
    const treatedOpenRouterMessage = openRouterResult
      .replace("```json", "")
      .replace("```", "")
      .replace(/\\n/g, "\n")
      .replace(/\\\"/g, "\"")
      .replace(/\\'/g, "'");
    try {
      const data = JSON.parse(treatedOpenRouterMessage);
      const { intencao, parametros } = data;
      const { cpf_ou_cnpj, valor_da_nf, numero_endereco, info_adicional, cep } = parametros || {};
      if (
        intencao === "emitir_nota_fiscal" &&
        cpf_ou_cnpj &&
        valor_da_nf &&
        numero_endereco &&
        cep
      ) {
        try {
          const cepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          if (!cepResponse.ok) {
            throw new Error("Erro ao consultar o CEP");
          }
          const {
            uf: state,
            localidade: city,
            logradouro: street,
            ibge
          } = await cepResponse.json();
          const nfeData = this._getNFData({ ...parametros, state, city, street, ibge });
          const response = await fetch(`https://api.nfse.io/v1/companies/${process.env.COMPANY_ID}/serviceinvoices`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${process.env.NFE_IO_API_KEY}`
            },
            body: JSON.stringify(nfeData)
          });
          if (!response.ok) {
            throw new Error("Erro ao emitir a nota fiscal");
          }
          this.fluxManager.sendMessage({ personNumber, message: "Sua nota foi aceita. Aguarde alguns segundos até a emissão." });

          this.fluxManager.setPersonState(personNumber, "welcome")
          //const message = `Nota fiscal emitida. JSONZinho: ${JSON.stringify(nfData)}.`;

          const nfData = await response.json();

          let invoiceId = nfData.id;
          let flowStatus = nfData.flowStatus;
          let attempts = 0;
          let invoiceJson: any = null;

          while (attempts < 100) {
            // Consulta o status da nota fiscal
            const statusResponse = await fetch(`https://api.nfse.io/v1/companies/${process.env.COMPANY_ID}/serviceinvoices/${invoiceId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `${process.env.NFE_IO_API_KEY}`
              }
            });

            if (!statusResponse.ok) {
              console.error("Erro ao consultar o status da nota fiscal");
              break;
            }

            invoiceJson = await statusResponse.json();
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
                break;
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

            // Espera 5 segundos antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
          }

          if (attempts === 100 && flowStatus !== "Issued") {
            await this.fluxManager.sendMessage({
              personNumber,
              message: "Não foi possível emitir a nota fiscal após múltiplas tentativas. Tente novamente mais tarde."
            });
          }
        } catch (error) {
          console.error("Erro ao emitir a nota fiscal:", error);
          this.fluxManager.setPersonState(personNumber, "welcome");
          //await this.fluxManager.client.sendMessage({ personNumber, message: "Algo deu errado ao emitir a nota fiscal. Por favor, tente novamente mais tarde." });
        }
      } else {
        this.fluxManager.sendMessage({
          personNumber,
          message: data.proxima_mensagem,
        })
        //return this.fluxManager.setPersonState(personNumber, "welcome").render({ personNumber, message });
      }

    } catch (error) {
      console.error("Erro ao processar a mensagem da IA:", error);
      //await this.fluxManager.client.sendMessage({ personNumber, message: "Algo deu errado, a IA não conseguiu processar sua solicitação." });
    }
  }

  private _getNFData({ nome_do_cliente, email_do_cliente, info_adicional_nf, info_adicional_endereco, cpf_ou_cnpj, valor_da_nf, numero_endereco, cep, state, city, street, ibge }: any) {
    const data: any = {
      "Borrower": {
        "FederalTaxNumber": cpf_ou_cnpj,
        "Address": {
          "country": "BRA",
          "postalCode": cep,
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
      "ServicesAmount": valor_da_nf.replace(",", "."),
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

export default EmitirNFState;
