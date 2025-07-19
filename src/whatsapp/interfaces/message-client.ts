import { PossibleClients } from "../types/types";

export interface IMessageClient {
  start(): Promise<void>;
  sendMessage(number: string | number, message: string, configs?: ISendMessageConfigs, otherProps?: any): Promise<any>;
  on(event: string, callback: Function): any;
  getClientType(): PossibleClients;
}

export interface ISendMessageConfigs {
  options?: ISendMessageOption[],
  listOptions?: ISendMessageListOption[]
  header?: string,
  footer?: string,
  listButtonName?: string,
  type?: 'buttons' | 'list' | 'media'
}

export interface ISendMessageOption {
  name: string,
  description?: string
}

export interface ISendMessageListOption {
  sectionName: string,
  rows: ISendMessageOption[]
}