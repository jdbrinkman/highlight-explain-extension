// api/explain.js
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const { text, language } = req.body;

  const prompt = `Please explain the following text at a 9th-grade level in ${language === "es" ? "Spanish" : "English"}:\n\n${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300
    });

    res.status(200).json({ summary: response.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate explanation." });
  }
}
