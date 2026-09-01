import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ai = new GoogleGenAI();
  const models = await ai.models.list();
  const modelNames = [];
  for await (const m of models) {
    if (m.name.includes("gemini")) {
      modelNames.push(m.name);
    }
  }
  console.log("Models:", modelNames);
}
run();
