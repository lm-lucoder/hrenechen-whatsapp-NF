import { IMessageClient } from "./interfaces/message-client";
import { IMessageData } from "./interfaces/message-data";
import IState from "./interfaces/state";
import fs from 'fs';
import path from 'path';
import { PersonNumber } from "./types/types";
import WelcomeState from "../classes/States/welcome";

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
    vars?: any
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
        if (firstAccess) {
            return this.getPersonState(cleanPersonNumber).render(cleanPersonNumber)
        } //Checa se é o primeiro acesso do usuário. Se sim, o welcomeState é chamado e a função é interrompida

        const personContext = this.getPersonContext(cleanPersonNumber);
        const currentState: IState = this.stateMap[personContext.stateName];

        console.log(`Acesso: ${cleanPersonNumber} (${personName}) Estado: ${JSON.stringify(personContext)}`)
        try {
            if (currentState) {
                return currentState.handleOption(body, cleanPersonNumber);
            } else {
                return this.client.sendMessage(cleanPersonNumber, "Não entendi, por favor, escolha uma das opções disponíveis.");
            }
        } catch (error) {
            this.client.sendMessage(cleanPersonNumber, "ERRO: Algo deu errado, por favor avise o time de suporte!");
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
