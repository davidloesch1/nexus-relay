export default async function handler(req, res) {
  // 1. Log the method so we can troubleshoot
  console.log("--- NEXUS SIGNAL RECEIVED ---");
  console.log("Method used:", req.method);

  if (req.method === 'POST') {
    const data = req.body;
    
    // 2. Log the error details
    console.log("Signal Title:", data.title || "No Title Provided");
    console.log("Signal Text:", data.text || "No Context Provided");

    // 3. Always send a 200 OK back to FullStory
    return res.status(200).json({ status: 'received' });
  } else {
    // If it's not a POST, log a warning
    console.warn("Received a non-POST request. Check webhook settings.");
    return res.status(200).json({ message: 'We prefer POST, but we heard you!' });
  }
}
