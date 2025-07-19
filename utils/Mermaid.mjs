import puppeteer from "puppeteer";
import { esperar } from "./utils.mjs";

class Mermaid {
    static async getImage(data){
        const template = MermaidTemplates.commomTemplate(data)
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.setContent(template);
        await esperar(3000)

        const canvasElement = await page.$('svg');

        let screenshotBase64 = null;

        if (canvasElement) {
            // Use a função page.screenshot para tirar o screenshot do elemento canvas
            const screenshotBuffer = await canvasElement.screenshot({ encoding: 'base64', type: "jpeg" });
            screenshotBase64 = screenshotBuffer;
            
            //console.log('Screenshot do elemento canvas capturada em base64:', screenshotBase64);
        } else {
            console.error(`Elemento "${canvasSelector}" não encontrado.`);
        }
        await browser.close();
        if(screenshotBase64){
            return screenshotBase64
        }
    }
}

class MermaidTemplates {
    static commomTemplate(data){
        return `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Document</title>
                </head>
                <body id="body">
                <script type="module">
                    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
                    mermaid.initialize({ startOnLoad: true });
                </script>
                Here is a mermaid diagram:
                <pre class="mermaid">
                        ${data}
                </pre>
                </body>
            </html>`
    } 
}

export default Mermaid