import FluxManager from "../fluxManager";
import { PersonNumber } from "../types/types";


interface IState {
  fluxManager: FluxManager;
  handleMessage({ message, personNumber }: IHandleMessageProps): void;
  render?({ message, personNumber }: IRenderProps): Promise<void>;
  cancel(personNumber: PersonNumber): void;
}

export interface IHandleMessageProps {
  message: string;
  personNumber: PersonNumber;
}
export interface IRenderProps {
  message: string;
  personNumber: PersonNumber;
}

export default IState;
