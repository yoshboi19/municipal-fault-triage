import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeFaultReport(userMessage) {
  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = You are a Municipal Fault Triage AI for the City of Johannesburg (Midrand).
Analyze this citizen fault report and return ONLY a raw JSON object (no markdown) with keys:
- "faultCategory": ["Pothole", "Water", "Electricity", "Traffic Signal", "Other"]
- "severityLevel": ["Low", "Medium", "High", "Critical"]
- "aiSummary": a concise 4-to-7 word technical summary
- "botReply": a polite 1-sentence confirmation.

Citizen Report: " + userMessage + ";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return JSON.parse(response.text.replace(/`json|`/g, '').trim());
    } catch (err) {
      console.warn('Gemini API fallback triggered:', err.message);
    }
  }

  const text = userMessage.toLowerCase();
  let faultCategory = 'Other';
  let severityLevel = 'Medium';

  if (text.includes('pothole') || text.includes('road')) {
    faultCategory = 'Pothole'; severityLevel = text.includes('huge') ? 'High' : 'Medium';
  } else if (text.includes('water') || text.includes('pipe') || text.includes('burst')) {
    faultCategory = 'Water'; severityLevel = 'Critical';
  }

  return {
    faultCategory, severityLevel,
    aiSummary: faultCategory + ' issue reported',
    botReply: 'Logged your report under ' + faultCategory + ' and running 50m spatial cluster check.'
  };
}
