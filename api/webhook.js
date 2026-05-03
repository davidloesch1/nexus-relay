export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'Listening for pain...' });
  }

  const payload = req.body;
  const errorMessage = payload.text || "Unknown Error";
  const apiKey = process.env.GEMINI_API_KEY;

  console.log("--- SENSING PAIN, CONSULTING BRAIN ---");

  try {
    // Calling the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are the Nexus Self-Healing AI. A website just reported this error: "${errorMessage}". Briefly explain what caused this and provide a 1-sentence fix.` }]
        }]
      })
    });

    const aiData = await response.json();
    const aiAnalysis = aiData.candidates[0].content.parts[0].text;

    // Logging the "Aha!" moment
    console.log("GEMINI ANALYSIS:", aiAnalysis);

    return res.status(200).json({ status: 'AI Consulted', analysis: aiAnalysis });

  } catch (error) {
    console.error("Brain connection failed:", error);
    return res.status(500).json({ error: 'The brain is offline.' });
  }
}
