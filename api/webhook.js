export default async function handler(req, res) {
  console.log("--- NEXUS SURGERY INITIATED ---");

  const payload = req.body;
  const errorMessage = payload.text || "Unknown error";
  
  // 1. Ask Gemini for the fix AND the filename it thinks is responsible
  try {
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `A website reported this error: "${errorMessage}". 
            Based on common web structures, which file (e.g., index.html, script.js) is likely broken? 
            Provide your answer in this exact JSON format: {"filename": "name", "fix": "1-sentence fix"}`
          }]
        }]
      })
    });

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.candidates[0].content.parts[0].text);
    
    console.log("AI PROPOSAL:", result.fix);
    console.log("TARGET FILE:", result.filename);

    // 2. Respond to FullStory immediately so it doesn't time out
    res.status(200).json({ status: "Proposing fix for " + result.filename });

    // 3. (Optional Next Step) We will add the GitHub "Push" logic here in the next turn
    // For now, let's just make sure Gemini can identify the right file!

  } catch (err) {
    console.error("SURGERY FAILED:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
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
