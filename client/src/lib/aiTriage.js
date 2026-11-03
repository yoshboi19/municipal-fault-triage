import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const MOCK_MODE = false; 

export async function analyzeFaultReport(userText, retries = 3) {
  if (MOCK_MODE) {
    const text = userText.toLowerCase();
    let category = "General Issue";
    let severity = "Medium";
    
    if (text.includes("pothole") || text.includes("road") || text.includes("sinkhole")) { category = "Pothole"; severity = "High"; }
    else if (text.includes("pipe") || text.includes("water") || text.includes("leak")) { category = "Burst Pipe"; severity = "Critical"; }
    else if (text.includes("light") || text.includes("traffic")) { category = "Traffic Light"; severity = "High"; }
    else if (text.includes("cable") || text.includes("power") || text.includes("electricity")) { category = "Power Outage"; severity = "Critical"; }
    else if (text.includes("tree")) { category = "Fallen Tree"; severity = "Medium"; }
    else if (text.includes("trash") || text.includes("refuse") || text.includes("bin")) { category = "Uncollected Trash"; severity = "Low"; }

    console.log("[TRACE] 2.5 MOCK MODE ACTIVE: Categorized as " + category);
    return {
      faultCategory: category,
      severityLevel: severity,
      aiSummary: "Simulated triage for: " + userText,
      botReply: `We've successfully logged your report regarding the ${category.toLowerCase()} for testing.`
    };
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.8-flash', 
    generationConfig: { responseMimeType: "application/json" }
  });
  
  const prompt = `
    Analyze this municipal fault report: "${userText}"
    
    Respond strictly with a JSON object using these exact keys:
    - "faultCategory": A specific 1-to-3 word category.
    - "severityLevel": The priority level (Low, Medium, High, Critical).
    - "aiSummary": A short technical summary for the dispatch team.
    - "botReply": A friendly reply.
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      const isOverloaded = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('quota');
      
      if (isOverloaded && i < retries - 1) {
        console.warn(`Google API busy. Retrying in 2 seconds... (Attempt ${i + 1} of ${retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      console.error("AI Triage Error:", error);
      return {
        faultCategory: "AI Processing Failed",
        severityLevel: "Medium",
        aiSummary: "AI categorization failed due to server load or quota limits. Manual review required: " + userText,
        botReply: "Thank you! We've successfully logged the issue for our maintenance teams. (Note: Automated triage is currently delayed)."
      };
    }
  }
}
