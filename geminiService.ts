import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client
// Note: In a real production app, API key handling would be more secure.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface ParsedInventoryAction {
  intent: 'DISPENSE' | 'RESTOCK';
  items: {
    name: string;
    quantity: number;
    unit?: string;
    category?: string;
    expiryDate?: string;
    batchNumber?: string;
  }[];
  summary: string;
}

export const parseInventoryCommand = async (command: string): Promise<ParsedInventoryAction | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    return null;
  }

  try {
    const model = "gemini-2.5-flash";
    
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze this medical inventory command (which may be in Dutch or English): "${command}". 
      Determine if the user wants to ADD (Restock/Aanvullen) or REMOVE (Dispense/Uitgeven) items.
      Extract item details including name, quantity, unit, and if available, expiry date (YYYY-MM-DD format) and batch number.
      Infer the category if possible strictly from this list: Urgentietrousse, Injectiemateriaal, Diagnostica, Wondzorgmateriaal, Kantoorbenodigdheden.
      Provide the summary in Dutch.
      Today's date is ${new Date().toISOString().split('T')[0]}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              enum: ["DISPENSE", "RESTOCK"],
              description: "Whether items are being removed (dispensed/used) or added (restocked/bought)."
            },
            summary: {
              type: Type.STRING,
              description: "A short, natural language summary of what was understood, in Dutch."
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING, nullable: true },
                  category: { type: Type.STRING, nullable: true },
                  expiryDate: { type: Type.STRING, nullable: true },
                  batchNumber: { type: Type.STRING, nullable: true }
                },
                required: ["name", "quantity"]
              }
            }
          },
          required: ["intent", "items", "summary"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ParsedInventoryAction;
    }
    return null;
  } catch (error) {
    console.error("Error parsing command with Gemini:", error);
    return null;
  }
};