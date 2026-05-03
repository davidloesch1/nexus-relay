export default async function handler(req, res) {
  console.log("--- NEXUS BRAIN CONSULT ---");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing!");
    return res.status(500).json({ error: "API Key missing." });
  }

  const payload = req.body;
  const errorMessage = payload.text || "Diagnostic test signal.";
  
  try {
    // We switched to the production v1 endpoint and added -latest
    const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are the Nexus Self-Healing AI. A website reported this error: "${errorMessage}". Briefly explain why this happened and provide a 1-sentence fix.` }] }]
      })
    });

    const aiData = await response.json();

    if (!response.ok) {
      console.error("Google Rejected Request:", JSON.stringify(aiData));
      return res.status(500).json({ error: "AI Brain rejected request", details: aiData });
    }

    // Success! Extract the text
    const aiAnalysis = aiData.candidates[0].content.parts[0].text;
    console.log("BRAIN ANALYSIS:", aiAnalysis);

    return res.status(200).json({ status: "success", analysis: aiAnalysis });

  } catch (err) {
    console.error("RELAY CRITICAL ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
