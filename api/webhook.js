const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send("Waiting...");
  const errorMessage = req.body.text || "Diagnostic test";
  console.log("--- FULL SURGERY START: " + errorMessage + " ---");

  try {
    // 1. Ask Gemini for the Fix and the Filename
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Error: "${errorMessage}". In a web project, which file is broken? Return ONLY JSON: {"filename": "index.html", "fix": "the full corrected code for that file"}` }] }]
      })
    });
    const aiData = await aiResponse.json();
    const { filename, fix } = JSON.parse(aiData.candidates[0].content.parts[0].text.replace(/```json|```/g, ""));

    // 2. Setup: Create a new branch
    const branchName = `nexus-fix-${Date.now()}`;
    const mainRef = await (await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/main`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    })).json();

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs`, {
      method: 'POST',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainRef.object.sha })
    });

    // 3. THE MISSING PIECE: Update the file in the new branch
    // First, we need the "SHA" (fingerprint) of the existing file to change it
    const fileData = await (await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    })).json();

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Nexus Fix: ${errorMessage}`,
        content: Buffer.from(fix).toString('base64'), // GitHub requires code to be "Base64" encoded
        sha: fileData.sha,
        branch: branchName
      })
    });

    // 4. Open the Pull Request
    const prResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls`, {
      method: 'POST',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[Nexus] Self-Healing Fix for: ${errorMessage}`,
        head: branchName,
        base: 'main',
        body: `### AI-Driven Resolution\n**File Modified:** ${filename}\n\n*The AI has rewritten this file to handle the reported error. Please review and merge.*`
      })
    });

    const prResult = await prResponse.json();
    console.log("PR OPENED: #" + prResult.number);

    return res.status(200).json({ status: "Success", pr: prResult.html_url });

  } catch (err) {
    console.error("SURGERY FAILED:", err.message);
    return res.status(200).json({ error: err.message });
  }
};
