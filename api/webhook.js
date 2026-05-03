// Using module.exports for better compatibility with Vercel's default settings
module.exports = async (req, res) => {
  console.log("--- NEXUS SURGERY INITIATED ---");

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'Waiting for a signal...' });
  }

  const payload = req.body;
  const errorMessage = payload.text || "Unknown error";
  
  try {
    // 1. Ask Gemini for the fix AND the filename
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
    
    // Safety check: ensure we got a valid response
    if (!aiData.candidates || !aiData.candidates[0]) {
      throw new Error("AI Brain failed to provide a candidate.");
    }

    const aiText = aiData.candidates[0].content.parts[0].text;
    
    // Clean up the AI text (sometimes it adds markdown code blocks)
    const jsonString = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonString);
    
    console.log("AI PROPOSAL:", result.fix);
    console.log("TARGET FILE:", result.filename);

    // 2. Respond to FullStory
    return res.status(200).json({ 
      status: "Proposing fix", 
      file: result.filename,
      fix: result.fix 
    });

  } catch (err) {
    console.error("SURGERY FAILED:", err.message);
    // If it fails, we still send a 200 to keep FullStory happy
    return res.status(200).json({ error: "Surgery failed", details: err.message });
  }
};
