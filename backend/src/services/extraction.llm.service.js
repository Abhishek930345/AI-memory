import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_SYSTEM_PROMPT = `You are a memory extraction engine. Given a piece of text, extract atomic facts worth remembering long-term about the person it describes.

Rules:
- Each fact must be self-contained (understandable without the original text)
- Only extract facts that are stable/useful beyond this single document (identity, skills, projects, preferences, relationships, goals) — NOT filler, headers, or formatting artifacts
- Assign a category: identity | preference | project | relationship | skill | event | goal
- Assign a confidence score 0.0-1.0 based on how explicitly/directly it was stated
- If no memory-worthy facts exist, return an empty array
- Output STRICT JSON only. No markdown, no code fences, no preamble, no explanation.

Output format:
{"facts": [{"text": "string", "category": "identity|preference|project|relationship|skill|event|goal", "confidence": 0.0-1.0}]}`;

export const extractFacts = async (text) => {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0.2,
    max_tokens: 1000,
  });

  const raw = completion.choices[0].message.content.trim();

  try {
    // Strip markdown fences if the model added them despite instructions
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed.facts) ? parsed.facts : [];
  } catch (err) {
    console.error("Failed to parse extraction JSON:", raw);
    return [];
  }
};