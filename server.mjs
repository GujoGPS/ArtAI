// server.mjs
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:5173' // Adjust if your Vite port is different
}));
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is not defined.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey); 
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', 
});

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required in the request body.' });
    }

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{text: prompt}] }],
        generationConfig,
        safetySettings,
    });
    
    if (result.response) {
      const text = result.response.text();
      res.json({ text });
    } else {
      console.warn('Gemini API response did not contain valid text data:', result);
      res.status(500).json({ error: 'The AI did not return a valid response. Check server logs.' });
    }

  } catch (error) {
    console.error('Detailed error communicating with Gemini API:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to communicate with the AI.';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`ArtAI backend server running at http://localhost:${port}`);
  if (apiKey && !apiKey.startsWith('AIza')) { 
    console.warn("WARNING: The GEMINI_API_KEY does not seem to be in the correct format. Please check your .env file.");
  }
});
