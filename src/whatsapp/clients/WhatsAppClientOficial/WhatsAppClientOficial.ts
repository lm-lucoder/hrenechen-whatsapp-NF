import dotenv, { config } from "dotenv";
import { IMessageClient, ISendMessageConfigs, ISendMessageProps } from '../../interfaces/message-client';
import express, { Application } from 'express';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { IMessageData } from "../../interfaces/message-data";
import { PersonNumber, PossibleClients } from "../../types/types";
import AppError from "../../errors/AppError";
dotenv.config();

export default class WhatsAppClientOficial implements IMessageClient {
  private eventCallbacks: { [event: string]: Function[] } = {};

  constructor() { }

  async start(): Promise<void> {
    const server: Application = express();
    /* const httpsOptions = {
      key: fs.readFileSync(path.join(process.cwd(), 'ssl', 'server.key')),
      cert: fs.readFileSync(path.join(process.cwd(), 'ssl', 'server.cert'))
    }; */

    server.use(express.json());

    server.post('/webhook', (req, res) => {
      const body = req.body;

      if (body.object === 'whatsapp_business_account') {
        body.entry.forEach(entry => {
          entry.changes.forEach(change => {
            const field = change.field;

            // Verifica se o evento está relacionado a mensagens
            if (field === 'messages') {
              if (change.value.messages) {
                const messageData: IMessageData = this._treatData(change.value);
                if (messageData) {
                  this._triggerEvent('message', messageData);
                }
              }
            }
            // Tratando confirmação de entrega
            else if (field === 'statuses') {
              const statusData = change.value;
              this._triggerEvent('status', statusData);
            }
            // Outros tipos de eventos que podem ser relevantes
            else if (field === 'account_update') {
              const accountData = change.value;
              this._triggerEvent('account_update', accountData);
            }
            // Outros eventos ou tratamento padrão para campos desconhecidos
            else {
              console.log('Evento desconhecido ou não tratado:', field);
            }
          });
        });
        res.status(200).send('EVENT_RECEIVED');
      } else {
        res.sendStatus(404);  // Caso não seja do tipo whatsapp_business_account
      }
    });


    server.get("/webhook", (req, res) => {
      const challenge = req.query["hub.challenge"];
      const mode = req.query["hub.mode"];
      const verify_token = req.query["hub.verify_token"];

      if (mode == "subscribe" && verify_token == process.env.WPPOFICIAL_VERIFICATION_TOKEN) {
        return res.status(200).send(challenge)
      }
      res.status(400).send()
    })
    //https.createServer(httpsOptions, server).listen(process.env.WPPOFICIAL_MESSAGE_WEBHOOK_PORT, () => {
    server.listen(process.env.WPPOFICIAL_MESSAGE_WEBHOOK_PORT, () => {
      console.log(`Webhook WhatsApp Oficial escutando na porta HTTPS ${process.env.WPPOFICIAL_MESSAGE_WEBHOOK_PORT}`);
      this._triggerEvent('ready');
    });
  }

  async sendMessage(props: ISendMessageProps): Promise<any> {
    const { personNumber: number, message, configs } = props;

    console.log(`Enviando para: ${number}, mensagem: ${message}`)
    if (configs?.type == 'buttons') {
      return await this._fetchSendButtonsMessage(number.toString(), message, configs)
    }
    if (configs?.type == 'list') {
      return await this._fetchSendListsMessage(number.toString(), message, configs)
    }
    await this._fetchSendMessage(number.toString(), message, configs);
  }

  on(event: string, callback: Function): void {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }

  getClientType(): PossibleClients {
    return "oficial"
  }

  private async _triggerEvent(event: string, data?: any): Promise<void> {
    const callbacks = this.eventCallbacks[event];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private async _fetchSendMessage(personNumber: PersonNumber, message: string, configs?: ISendMessageConfigs) {
    let sendingMessage = ""
    if (configs?.header) {
      sendingMessage += `*${configs.header}*\n`
    }
    sendingMessage += message
    if (configs?.footer) {
      sendingMessage += `\n_${configs.footer}_`
    }
    try {
      const response = await fetch(`https://graph.facebook.com/${process.env.WPPOFICIAL_VERSION}/${process.env.WPPOFICIAL_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.WPPOFICIAL_TOKEN}`
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: personNumber,
          type: "text",
          text: {
            preview_url: false,
            body: sendingMessage
          }
        })
      })
      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem para o numero: ${personNumber}. conteudo: ${message}`)
      }

      const data = await response.json();
    } catch (error) {
      console.error(error)
    }
  }
  private async _fetchSendButtonsMessage(personNumber: PersonNumber, message: string, configs: ISendMessageConfigs) {
    try {
      const buttons = configs.options.map((option, i) => {
        return {
          "type": "reply",
          "reply": {
            "id": i,
            "title": this._limitString(option.name, 20)
          }
        }
      })
      if (!buttons) throw new AppError("Tentativa de enviar mensagem de botões sem opções definidas")
      const response = await fetch(`https://graph.facebook.com/${process.env.WPPOFICIAL_VERSION}/${process.env.WPPOFICIAL_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.WPPOFICIAL_TOKEN}`
        },
        body: JSON.stringify({
          "messaging_product": "whatsapp",
          "recipient_type": "individual",
          "to": personNumber,
          "type": "interactive",
          "interactive": {
            "type": "button",
            "header": {
              "type": "text",
              "text": configs?.header || ""
            },
            "body": {
              "text": message
            },
            "footer": {
              "text": configs?.footer || "Escolha uma das opções abaixo"
            },
            "action": {
              "buttons": buttons
            }
          }
        })
      })
      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem para o numero: ${personNumber}. conteudo: ${message}`)
      }

      const data = await response.json();
      console.log(data)

    } catch (error) {
      console.error(error)
    }
  }
  private async _fetchSendListsMessage(personNumber: PersonNumber, message: string, configs: ISendMessageConfigs) {
    try {
      let sections: any;
      if (configs.options) {
        const rows = configs.options.map((option, i) => {
          const row: { id: string, title: string, description?: string } = {
            "id": `<LIST_SECTION_${i + 1}_ROW_${i + 1}_ID>`,
            "title": this._limitString(option.name, 24)
          }
          if (option.description) {
            row.description = this._limitString(option.description, 72)
          }
          return row
        })
        sections = [
          { title: "Escolha uma das opções", rows }
        ]
      }
      if (configs.listOptions) {
        sections = configs.listOptions.map(section => {
          return {
            title: section.sectionName,
            rows: section.rows.map((option, i) => {
              const row: { id: string, title: string, description?: string } = {
                "id": `<LIST_SECTION_${i + 1}_ROW_${i + 1}_ID>`,
                "title": this._limitString(option.name, 24),
              }
              if (option.description) {
                row.description = this._limitString(option.description, 72)
              }
              return row
            })
          }
        })
      }
      if (!sections) throw new AppError("Tentativa de enviar mensagem de lista sem opções definidas")
      const response = await fetch(`https://graph.facebook.com/${process.env.WPPOFICIAL_VERSION}/${process.env.WPPOFICIAL_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.WPPOFICIAL_TOKEN}`
        },
        body: JSON.stringify({
          "messaging_product": "whatsapp",
          "recipient_type": "individual",
          "to": personNumber,
          "type": "interactive",
          "interactive": {
            "type": "list",
            "header": {
              "type": "text",
              "text": configs?.header || ""
            },
            "body": {
              "text": message
            },
            "footer": {
              "text": configs?.footer || ""
            },
            "action": {
              "button": configs?.listButtonName || "Abrir opções",
              "sections": sections
            }
          }
        })
      })
      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem para o numero: ${personNumber}. conteudo: ${message}`)
      }

      const data = await response.json();
      console.log(data)

    } catch (error) {
      console.error(error)
    }
  }
  private _treatData(body): IMessageData | undefined {
    try {
      if (body.messages) {
        const messageData: IMessageData = {
          body: "",
          personNumber: body.messages[0].from,
          personName: body.contacts[0]?.profile?.name || ""
        };
        if (!body.messages[0].text) {
          if (!body.messages[0]?.interactive) return
          if (body.messages[0].interactive.type == 'list_reply') {
            messageData.body = body.messages[0].interactive.list_reply.title
          }
          if (body.messages[0].interactive.type == 'button_reply') {
            messageData.body = body.messages[0].interactive.button_reply.title
          }
        } else {
          messageData.body = body.messages[0].text.body
        }
        return messageData
      }
    } catch (error) {
      console.error("Erro ao tratar dados: ", error)
      try {
        const messageData: IMessageData = {
          body: "Algo deu errado",
          personNumber: body?.messages[0]?.from || ""
        }
        return messageData
      } catch (error) {
        console.error("Erro ao retornar mensagem de erro", error)
      }
      return
    }
  }
  private _limitString(string: string, maxLength: number): string {
    // Limita para até maxLength caracteres, útil para import os limites que a Api da Meta define para seus elementos
    return string.length > maxLength ? string.slice(0, (maxLength - 3)) + '...' : string
  }
}
