import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { text, language } = req.body;

  const prompt = `Please explain the following text at a 9th-grade reading level in ${language === "es" ? "Spanish" : "English"}:\n\n${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    res.status(200).json({
      summary: response.choices[0].message.content.trim(),
    });
  } catch (err) {
    console.error("OpenAI API error:", err);
    res.status(500).json({ error: "Failed to generate explanation." });
  }
}
