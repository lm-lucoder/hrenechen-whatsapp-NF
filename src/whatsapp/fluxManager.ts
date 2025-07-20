import { IMessageClient, ISendMessageProps } from "./interfaces/message-client";
import { IMessageData } from "./interfaces/message-data";
import IState from "./interfaces/state";
import fs from 'fs';
import path from 'path';
import { PersonNumber } from "./types/types";
import WelcomeState from "../classes/States/welcome";
import EmitirNFState from "../classes/States/emitir_nf";

const allowedNumbers = [
    '5524981017270',
    '5512982825404',
    '556696336593'
];

interface StateMap {
    [key: string]: IState
}

interface IPeopleContext {
    [key: PersonNumber]: IPersonContext
}

interface IPersonContext {
    lastMessageDate: number,
    stateName: string,
    messages?: IMessage[],
    vars?: any
}

interface IMessage {
    message: string,
    date: number,
    from: "user" | "system"
}

class FluxManager {
    private peopleContext: IPeopleContext;
    stateMap: StateMap;
    client: IMessageClient;

    constructor(client: IMessageClient) {
        this.peopleContext = {};
        this.client = client;
        this.stateMap = {
            "welcome": new WelcomeState(this),
            "emitir_nf": new EmitirNFState(this)
        };
    }

    checkPermission({ personNumber, personName }: { personNumber: PersonNumber, personName: string | null | undefined }): boolean {
        const allowed = allowedNumbers.includes(personNumber.toString());
        if (!allowed) {
            console.log(`Acesso não autorizado: ${personNumber} ${personName ? ("(" + personName + ")") : ""}`);
        }
        return allowed;
    }

    async handle({ personName, deviceType, body, personNumber, msg }: IMessageData) {
        // Remove sufixo @c.us, se existir, e mantém apenas os números
        let cleanPersonNumber = personNumber.toString().replace(/[^0-9]/g, "");
        if (!this.checkPermission({ personNumber: cleanPersonNumber, personName })) return;
        const { firstAccess } = this.configUserState(cleanPersonNumber);
        /* if (firstAccess) {
            return this.getPersonState(cleanPersonNumber)
        } */

        const personContext = this.getPersonContext(cleanPersonNumber);
        this.storePersonMessage(cleanPersonNumber, body)
        const currentState: IState = this.stateMap[personContext.stateName];

        console.log(`Acesso: ${cleanPersonNumber} (${personName}) Estado: ${JSON.stringify(personContext)}`)
        try {
            if (currentState) {
                return currentState.handleMessage({ message: body, personNumber: cleanPersonNumber });
            } else {
                return this.client.sendMessage({ personNumber: cleanPersonNumber, message: "Não entendi, por favor, escolha uma das opções disponíveis." });
            }
        } catch (error) {
            this.client.sendMessage({ personNumber: cleanPersonNumber, message: "ERRO: Algo deu errado, por favor avise o time de suporte!" });
        }
    }

    configUserState(personNumber: PersonNumber) {
        if (!this.peopleContext[personNumber]) {
            this.peopleContext[personNumber] = {
                lastMessageDate: Date.now(),
                stateName: 'welcome'
            };
            return { firstAccess: true }
        }
        return { firstAccess: false }
    }


    getPersonContext(personNumber: PersonNumber) {
        return this.peopleContext[personNumber];
    }

    getPersonState(personNumber: PersonNumber): IState {
        return this.stateMap[this.getPersonContext(personNumber).stateName];
    }

    setPersonState(personNumber: PersonNumber, stateName: string): IState {
        this.peopleContext[personNumber].stateName = stateName;
        this.getPersonContext(personNumber).lastMessageDate = Date.now();
        return this.stateMap[stateName]
    }

    resetPersonState(personNumber: PersonNumber) {
        delete this.peopleContext[personNumber]
        this.configUserState(personNumber)
    }

    async sendMessage(props: ISendMessageProps): Promise<any> {
        this.storePersonMessage(props.personNumber, props.message);
        return this.client.sendMessage(props);
    }

    getChatMessages(personNumber: PersonNumber, top?: number) {
        if (!this.peopleContext[personNumber]) return [];
        if (!Array.isArray(this.peopleContext[personNumber].messages)) {
            this.peopleContext[personNumber].messages = [];
        }
        const messages = this.peopleContext[personNumber].messages;
        return typeof top === "number" ? messages.slice(-top) : messages;
    }

    private storePersonMessage(personNumber: PersonNumber, message: string) {
        if (!this.peopleContext[personNumber]) return;
        if (!this.peopleContext[personNumber].vars) {
            this.peopleContext[personNumber].vars = {};
        }
        if (!Array.isArray(this.peopleContext[personNumber].messages)) {
            this.peopleContext[personNumber].messages = [];
        }
        this.peopleContext[personNumber].messages.push({
            message,
            date: Date.now(),
            from: "user"
        });
    }

    private loadStates(): StateMap {
        const statesDir = path.resolve(__dirname, '../states');
        const stateMap: StateMap = {};

        const readStatesRecursively = (dir: string) => {
            fs.readdirSync(dir).forEach((file) => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    readStatesRecursively(fullPath);
                } else if (file.endsWith('.ts')) {
                    const stateName = path.basename(file, path.extname(file));
                    try {
                        const StateClass = require(fullPath).default;
                        if (StateClass && typeof StateClass === 'function') {
                            stateMap[stateName] = new StateClass(this);
                        }
                    } catch (error) {
                        console.error(`Erro ao importar o estado ${stateName}:`, error);
                    }
                }
            });
        };

        readStatesRecursively(statesDir);
        return stateMap;
    }
}

export default FluxManager;
