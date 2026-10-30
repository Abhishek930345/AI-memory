import { getGroqClient, getGroqModel } from "../config/groq.js";

const CONTRADICTION_SYSTEM_PROMPT = `You compare a NEW fact against an EXISTING memory about the same user. Classify their relationship.

Possible relationships:
- "duplicate" — new fact says the same thing as existing (maybe reworded)
- "update" — new fact is a more recent/specific version of the same thing
- "extension" — new fact adds detail without contradicting
- "contradiction" — new and old genuinely conflict, unclear which is true
- "unrelated" — not actually about the same thing

Output STRICT JSON only. No markdown, no preamble.
Format: {"relationship": "duplicate|update|extension|contradiction|unrelated", "reasoning": "one sentence", "merged_fact": "string or null"}`;

export const classifyRelationship = async (existingFact, newFact) => {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: getGroqModel(),
    messages: [
      { role: "system", content: CONTRADICTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `EXISTING: "${existingFact}"\n\nNEW: "${newFact}"`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1500,
  });

  const raw = completion.choices[0].message.content.trim();

  try {
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse contradiction JSON:", raw);
    return { relationship: "unrelated", reasoning: "parse error", merged_fact: null };
  }
};