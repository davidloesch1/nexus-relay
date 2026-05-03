export default async function handler(req, res) {
  console.log("--- DEBUG START ---");

  // 1. Check if the API key even exists
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing from Vercel settings!");
    return res.status(500).json({ error: "API Key missing." });
  }

  const payload = req.body;
  const errorMessage = payload.text || "Test Connection";
  
  try {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Explain this error: ${errorMessage}` }] }]
      })
    });

    const aiData = await response.json();

    // 2. Log exactly what Google said
    console.log("Google API Status:", response.status);
    
    if (!response.ok) {
      console.error("Google API Error Details:", JSON.stringify(aiData));
      return res.status(500).json({ error: "Google rejected the request", details: aiData });
    }

    const aiAnalysis = aiData.candidates[0].content.parts[0].text;
    console.log("SUCCESSFUL ANALYSIS:", aiAnalysis);

    return res.status(200).json({ status: "success", analysis: aiAnalysis });

  } catch (err) {
    console.error("CRITICAL SCRIPT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
