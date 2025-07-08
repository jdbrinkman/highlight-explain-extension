import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Directly use the text from the request body as the prompt.
  // This 'text' contains the detailed instructions from background.js.
  const { text, language } = req.body;

  // Validate that text was provided
  if (!text) {
    return res.status(400).json({ error: "No text provided for processing." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // The 'text' variable now holds the full prompt from your background script.
      messages: [{ role: "user", content: text }],
      max_tokens: 300, // You can adjust this as needed
    });

    res.status(200).json({
      summary: response.choices[0].message.content.trim(),
    });
  } catch (err) {
    console.error("OpenAI API error:", err);
    res.status(500).json({ error: "Failed to generate explanation." });
  }
}