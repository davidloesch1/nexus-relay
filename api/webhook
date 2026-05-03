export default async function handler(req, res) {
  if (req.method === 'POST') {
    const data = req.body;
    
    // This logs the error so we can see it in Vercel
    console.log("--- NEXUS PAIN DETECTED ---");
    console.log("Error Message:", data.title);
    console.log("Full Context:", data.text);

    return res.status(200).json({ status: 'received' });
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
