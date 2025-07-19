class WhatsAppUtils {
    static defineMsgData(msg){
        const data = {
            personName : msg["_data"].notifyName,
            deviceType : msg.deviceType,
            body : msg.body
        }
        if (msg.from.split("@")[0].includes("-")) {
            data.personNumber = msg.from.split("@")[0].split("-")[0]
        } else {
            data.personNumber = msg.from.split("@")[0]
        }
        return data
    }

    static getPersonNumber(msg){
        let personNumber
        if (msg.from.split("@")[0].includes("-")) {
            personNumber = msg.from.split("@")[0].split("-")[0]
        } else {
            personNumber = msg.from.split("@")[0]
        }
        return personNumber
    }

    static formatMessage({dataSet, labels}){
        return dataSet.map(data => {
            return data.map((d, i) => {
                return `${labels[i]}: ${d}`
            }).join('\n')
        }).join('\n -- \n')
    }
}

export default WhatsAppUtils