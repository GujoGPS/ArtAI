// Frontend service to interact with our local backend proxy for Gemini API calls.
// This keeps the actual API key secure on the server.

const PROXY_SERVER_URL = 'http://localhost:3001/api/generate';

/**
 * Sends a prompt to our backend, which then calls the Gemini API.
 * @param prompt - The complete prompt string.
 * @returns Promise resolving to the AI's text response.
 */
export async function sendMessageToGemini(prompt: string): Promise<string> {
  try {
    const response = await fetch(PROXY_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    // Handle non-2xx responses from our backend.
    if (!response.ok) {
      let errorData = { error: `HTTP error: ${response.status}` }; // Default error
      try {
        errorData = await response.json(); // Try to get a more specific error from backend.
      } catch (e) {
        // Backend didn't send JSON, or other parsing error.
        console.warn("Could not parse error response from backend:", e);
      }
      console.error('Error from backend:', errorData);
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Ensure the backend sent back the expected 'text' field.
    if (typeof data.text !== 'string') {
        console.error('Unexpected response structure from backend:', data);
        throw new Error('Backend response did not include a text field.');
    }
    return data.text;

  } catch (error) {
    console.error("sendMessageToGemini failed:", error);
    // Re-throw for the UI to handle.
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while sending message.");
  }
}
