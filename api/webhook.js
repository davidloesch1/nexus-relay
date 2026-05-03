const { BigQuery } = require('@google-cloud/bigquery');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

// --- CONFIGURATION SYNCED WITH SCREENSHOTS ---
const TABLE_NAME = 'nexus_dna_discovery'; 
const BQ_LOCATION = 'US'; // Matches Screenshot 11.13.17 AM

const bq = new BigQuery({
  projectId: process.env.BQ_PROJECT_ID,
  credentials: {
    client_email: process.env.BQ_CLIENT_EMAIL,
    private_key: process.env.BQ_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send("Nexus is Online.");
  const errorMessage = req.body.text || "Diagnostic test";
  
  console.log("--- NEXUS ADAPTIVE SURGERY START ---");

  try {
    // 1. CONSULT MEMORY (BIGQUERY)
    const query = `
      SELECT AVG(dna_v1) as avg_friction 
      FROM \`${process.env.BQ_PROJECT_ID}.behavioral_data.${TABLE_NAME}\`
      WHERE event_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
    `;
    
    console.log(`Querying ${TABLE_NAME} in location ${BQ_LOCATION}...`);
    const [rows] = await bq.query({ query, location: BQ_LOCATION });
    
    // Safety check for data
    const frictionScore = (rows && rows[0] && rows[0].avg_friction) 
      ? rows[0].avg_friction.toFixed(4) 
      : "0.0000";
    
    console.log("SUCCESS! CURRENT SITE FRICTION:", frictionScore);

    // 2. CONSULT BRAIN (GEMINI)
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `The site friction score is ${frictionScore}. Error: "${errorMessage}". Which file is broken? Return ONLY JSON: {"filename": "index.html", "fix": "the full corrected code"}` }] }]
      })
    });
    
    const aiData = await aiResponse.json();
    const aiText = aiData.candidates[0].content.parts[0].text.replace(/```json|```/g, "");
    const { filename, fix } = JSON.parse(aiText);

    // 3. EXECUTE SURGERY (GITHUB)
    const branchName = `nexus-adaptive-fix-${Date.now()}`;
    const mainRef = await (await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/main`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    })).json();

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs`, {
      method: 'POST',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainRef.object.sha })
    });

    const fileData = await (await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    })).json();

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Nexus Adaptive Fix (Friction: ${frictionScore})`,
        content: Buffer.from(fix).toString('base64'),
        sha: fileData.sha,
        branch: branchName
      })
    });

    const pr = await (await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls`, {
      method: 'POST',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[Nexus Adaptive] Fix for ${errorMessage} (Friction: ${frictionScore})`,
        head: branchName,
        base: 'main',
        body: `### Adaptive Healing\n**Friction Score at time of error:** ${frictionScore}\n**Target File:** ${filename}`
      })
    })).json();

    console.log("ADAPTIVE PR OPENED: #" + pr.number);
    return res.status(200).json({ status: "Success", friction: frictionScore, pr: pr.html_url });

  } catch (err) {
    console.error("ADAPTIVE SURGERY FAILED:", err.message);
    return res.status(200).json({ error: err.message });
  }
};
