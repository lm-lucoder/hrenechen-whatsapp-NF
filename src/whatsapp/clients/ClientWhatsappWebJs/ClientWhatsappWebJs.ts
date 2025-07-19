import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { IMessageClient, ISendMessageConfigs } from '../../interfaces/message-client';
import { IMessageData } from '../../interfaces/message-data';
import { PersonNumber, PossibleClients } from '../../types/types';
import AppError from '../../errors/AppError';

export default class ClientWhatsappWebJs implements IMessageClient {
  private client: Client;
  private eventCallbacks: { [event: string]: Function[] } = {};

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: { headless: false }
    });
    this._setupEvents();
  }

  async start(): Promise<void> {
    this.client.initialize();
  }

  on(event: string, callback: Function): void {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }

  getClientType(): PossibleClients {
    return 'whatsappjs';
  }

  private _setupEvents() {
    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
      console.log('Escaneie o QRCode acima para autenticar no WhatsApp Web.');
    });
    this.client.on('ready', () => {
      this._triggerEvent('ready');
    });
    this.client.on('message', async (msg) => {
      const messageData: IMessageData = {
        body: msg.body,
        personNumber: msg.from,
        personName: '' // WhatsApp Web JS does not provide sender name by default
      };
      this._triggerEvent('message', messageData);
    });
    this.client.on('auth_failure', (msg) => {
      this._triggerEvent('auth_failure', msg);
    });
    this.client.on('disconnected', (reason) => {
      this._triggerEvent('disconnected', reason);
    });
  }

  private _triggerEvent(event: string, data?: any): void {
    const callbacks = this.eventCallbacks[event];
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  async sendMessage(number: string | number, message: string, configs?: ISendMessageConfigs, otherProps?: any): Promise<any> {
    const chatId = this._formatNumber(number);
    if (configs?.type === 'buttons') {
      return this._sendButtonsMessage(chatId, message, configs);
    }
    if (configs?.type === 'list') {
      return this._sendListMessage(chatId, message, configs);
    }
    return this.client.sendMessage(chatId, message);
  }

  private _formatNumber(number: string | number): string {
    // WhatsApp Web JS expects numbers in the format: 5511999999999@c.us
    let num = typeof number === 'string' ? number : number.toString();
    if (!num.endsWith('@c.us')) {
      num += '@c.us';
    }
    return num;
  }

  private async _sendButtonsMessage(chatId: string, message: string, configs: ISendMessageConfigs) {
    // WhatsApp Web JS does not support native buttons, so we simulate with text
    let msg = message + '\n';
    configs.options.forEach((option, i) => {
      msg += `(${i + 1}) ${option.name}\n`;
    });
    return this.client.sendMessage(chatId, msg);
  }

  private async _sendListMessage(chatId: string, message: string, configs: ISendMessageConfigs) {
    // WhatsApp Web JS does not support native lists, so we simulate with text
    let msg = message + '\n';
    if (configs.options) {
      configs.options.forEach((option, i) => {
        msg += `(${i + 1}) ${option.name}`;
        if (option.description) msg += ` - ${option.description}`;
        msg += '\n';
      });
    }
    if (configs.listOptions) {
      configs.listOptions.forEach((section, si) => {
        msg += `\n${section.sectionName}:\n`;
        section.rows.forEach((option, i) => {
          msg += `  (${i + 1}) ${option.name}`;
          if (option.description) msg += ` - ${option.description}`;
          msg += '\n';
        });
      });
    }
    return this.client.sendMessage(chatId, msg);
  }
}
