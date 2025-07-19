import FluxManager from "../fluxManager";
import { PersonNumber } from "../types/types";


interface IState {
  fluxManager: FluxManager;
  handleOption(option: string | number, personNumber: PersonNumber): void;
  render?(personNumber: PersonNumber): Promise<void>;
  sendMessage?(number: string | number, message: string, otherProps?: any): Promise<any>;
  cancel(personNumber: PersonNumber): void;
}

export default IState;
