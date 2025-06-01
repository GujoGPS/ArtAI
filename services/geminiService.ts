
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null; // Singleton chat instance

function getAiInstance(): GoogleGenAI {
  if (!ai) {
    if (!API_KEY) {
      console.error("Gemini API key (process.env.API_KEY) is not configured.");
      // This error should ideally be caught and displayed to the user in the UI.
      // For now, it will break the AI functionality.
      throw new Error("Gemini API key is not configured. Please set process.env.API_KEY.");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
}

async function getChatInstance(): Promise<Chat> {
  if (!chat) {
    const currentAi = getAiInstance();
    // Initialize the chat model.
    // System instructions can be added here if a persistent persona is desired.
    // For now, context is primarily driven by the augmented prompt.
    chat = currentAi.chats.create({
      model: 'gemini-2.5-flash-preview-04-17',
      // Example:
      // config: {
      //   systemInstruction: "You are a helpful assistant analyzing PDF documents.",
      // }
    });
  }
  return chat;
}

export async function sendMessageToGemini(prompt: string): Promise<string> {
  try {
    const chatInstance = await getChatInstance();
    // Stream can be used here for progressive responses: chatInstance.sendMessageStream({ message: prompt });
    // For simplicity, using non-streaming sendMessage.
    const result: GenerateContentResponse = await chatInstance.sendMessage({ message: prompt });
    return result.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    // It's good practice to check the error type and provide more specific messages.
    // For example, handle API key errors, quota issues, etc. differently.
    if (error instanceof Error) {
        // For certain errors, we might want to reset the chat instance
        // e.g., if the session becomes invalid. Not implemented here for brevity.
        // Also, we return the error message for display in the chat.
        throw new Error(error.message); 
    }
    throw new Error("An unknown error occurred while communicating with AI.");
  }
}
