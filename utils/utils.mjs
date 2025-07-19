import puppeteer from 'puppeteer';
import fs from 'fs';
import  WhatsAppUtils  from './WhatsAppUtils.mjs';


function contemApenasNumeros(str) {
    return /^\d+$/.test(str);
}

async function getGraph64(html) {
  // Inicializa o Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Define o conteúdo HTML da página
  await page.setContent(html);
  await esperar(3000)
  //await page.waitForTimeout(2000)

  const canvasElement = await page.$('#myChart');

  let screenshotBase64 = null;

  if (canvasElement) {
    // Use a função page.screenshot para tirar o screenshot do elemento canvas
    const screenshotBuffer = await canvasElement.screenshot({ encoding: 'base64' });
    screenshotBase64 = screenshotBuffer;
    //console.log('Screenshot do elemento canvas capturada em base64:', screenshotBase64);
  } else {
    console.error(`Elemento "${canvasSelector}" não encontrado.`);
  }

  // Fecha o navegador
  await browser.close();

  // Retorna o base64 do screenshot
  return screenshotBase64;
}

function imageToBase64(imagePath) {
  // Lê o arquivo de imagem de forma síncrona
const imageData = fs.readFileSync(imagePath);
  
// Converte os dados da imagem em uma string base64
const base64Image = Buffer.from(imageData).toString("base64");
  
return base64Image;
}

async function savePDF(msg){
  const media = await msg.downloadMedia(); 
  const fileName = `${msg._data.filename.replace(".pdf","")}-${Date.now()}.pdf`; 
  const filePath = `temp/pdf/${fileName}`;
  try {
    fs.writeFileSync(filePath, media.data);
    return filePath
  } catch (error) {
    throw(error)
  }
}

async function saveAudio(msg){
  const personNumber = WhatsAppUtils.getPersonNumber(msg)
  const media = await msg.downloadMedia(); 
  const fileName = `${personNumber}-${Date.now()}.ogg`; 
  const filePath = `temp/audio/${fileName}`;
  try {
    fs.writeFileSync(filePath, media.data);
    return filePath
  } catch (error) {
    throw(error)
  }
}

function esperar(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export {
  contemApenasNumeros,
  getGraph64,
  imageToBase64,
  savePDF,
  saveAudio,
  esperar
};
