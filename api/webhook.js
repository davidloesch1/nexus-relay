export default async function handler(req, res) {
  console.log("--- NEXUS BRAIN CONSULT (v2.5) ---");

  // Safety check for API Key
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing from Vercel settings!");
    return res.status(500).json({ error: "API Key missing." });
  }

  const payload = req.body;
  const errorMessage = payload.text || "Direct diagnostic test.";
  
  try {
    // UPDATED FOR 2026: Using the stable Gemini 2.5 Flash model
    const modelId = 'gemini-2.5-flash';
    const apiURL = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are the Nexus Self-Healing AI. A website reported this error: "${errorMessage}".
            1. Briefly explain the technical cause.
            2. Provide a 1-sentence code fix.
            3. Rate the severity from 1-10.`
          }]
        }]
      })
    });

    const aiData = await response.json();

    if (!response.ok) {
      console.error("Google API Error:", JSON.stringify(aiData));
      return res.status(response.status).json({ error: "AI Brain rejected request", details: aiData });
    }

    // Extraction logic remains the same for the current API
    const aiAnalysis = aiData.candidates[0].content.parts[0].text;
    console.log("BRAIN ANALYSIS:", aiAnalysis);

    return res.status(200).json({ status: "success", analysis: aiAnalysis });

  } catch (err) {
    console.error("RELAY CRITICAL FAILURE:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
