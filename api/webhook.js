const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // Format: username/repo

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send("Waiting...");

  const errorMessage = req.body.text || "Diagnostic test";
  console.log("--- SURGERY INITIATED: " + errorMessage + " ---");

  try {
    // 1. Ask Gemini for the fix and the file
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Error: "${errorMessage}". Which file in a web project is likely broken? Return ONLY JSON: {"filename": "index.html", "fix": "add a null check"}` }] }]
      })
    });
    const aiData = await aiResponse.json();
    const { filename, fix } = JSON.parse(aiData.candidates[0].content.parts[0].text.replace(/```json|```/g, ""));

    // 2. The GitHub Dance: Create a Branch
    const branchName = `nexus-fix-${Date.now()}`;
    const mainRef = await (await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/main`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    })).json();

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs`, {
      method: 'POST',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainRef.object.sha })
    });

    console.log(`Branch created: ${branchName}`);

    // 3. Open a Pull Request (The "Proposal")
    const prResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls`, {
      method: 'POST',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[Nexus Auto-Fix] Potential fix for: ${errorMessage}`,
        head: branchName,
        base: 'main',
        body: `### Nexus Behavioral AI Analysis\n**Diagnosis:** ${fix}\n**Target File:** ${filename}\n\n*This PR was generated automatically by the Nexus Self-Healing system.*`
      })
    });

    const prData = await prResponse.json();
    console.log("SURGERY SUCCESSFUL: PR #" + prData.number);

    return res.status(200).json({ status: "PR Created", url: prData.html_url });

  } catch (err) {
    console.error("SURGERY ABORTED:", err.message);
    return res.status(200).json({ error: err.message });
  }
};
