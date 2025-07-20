import { PossibleClients } from "../types/types";

export interface IMessageClient {
  start(): Promise<void>;
  sendMessage(props: ISendMessageProps): Promise<any>;
  sendMediaMessage(props: ISendMediaMessageProps): Promise<any>;
  sendDocumentMessage(props: ISendDocumentMessageProps): Promise<any>;
  on(event: string, callback: Function): any;
  getClientType(): PossibleClients;
}
export interface ISendMediaMessageProps {
  personNumber: string;
  mediaType: 'image' | 'audio';
  mediaUrl?: string;
  mediaBuffer?: Buffer;
  caption?: string;
  mimeType?: string;
  otherProps?: any;
}

export interface ISendDocumentMessageProps {
  personNumber: string;
  documentUrl?: string;
  documentBuffer?: Buffer;
  fileName?: string;
  mimeType?: string; // ex: 'application/pdf'
  caption?: string;
  otherProps?: any;
}

export interface ISendMessageProps {
  personNumber: string,
  message: string,
  configs?: ISendMessageConfigs,
  otherProps?: any
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