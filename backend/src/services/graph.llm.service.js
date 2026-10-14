import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GRAPH_EXTRACTION_PROMPT = `You extract entities and relationships from a fact about a person, to build a knowledge graph.

Rules:
- Entities are concrete nouns: people, projects, technologies, organizations, skills, concepts
- Relationships connect two entities with a short verb phrase label (e.g. "uses", "built", "works_at", "knows", "prefers")
- Always include the person the fact is about as an entity if relevant
- Use consistent, concise entity names (e.g. "MERN Stack" not "the MERN stack technology")
- If the fact has no clear entities/relationships, return empty arrays
- Output STRICT JSON only. No markdown, no preamble.

Output format:
{"entities": [{"name": "string", "type": "person|project|technology|organization|skill|concept|other"}], "relationships": [{"source": "entity name", "target": "entity name", "label": "string"}]}`;

export const extractGraph = async (factText) => {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: GRAPH_EXTRACTION_PROMPT },
      { role: "user", content: factText },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });

  const raw = completion.choices[0].message.content.trim();

  try {
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
    };
  } catch (err) {
    console.error("Failed to parse graph JSON:", raw);
    return { entities: [], relationships: [] };
  }
};