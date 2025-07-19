import ClientWhatsappWebJs from "./whatsapp/clients/ClientWhatsappWebJs/ClientWhatsappWebJs";
import WhatsAppClientOficial from "./whatsapp/clients/WhatsAppClientOficial/WhatsAppClientOficial";
import FluxManager from "./whatsapp/fluxManager";
import { IMessageData } from "./whatsapp/interfaces/message-data";


const app = new ClientWhatsappWebJs();
const fluxManager = new FluxManager(app)


app.start().catch((error) => {
  console.error("Error initializing WhatsApp Client:", error);
});

// Example of how to use the on method to handle events
app.on('message', (msg: IMessageData) => {
  fluxManager.handle(msg)
});

app.on('ready', () => {
  console.log('WhatsApp Client is ready!');
});
