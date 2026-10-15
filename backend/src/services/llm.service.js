// import Groq from "groq-sdk";

// let groq;

// const getGroqClient = () => {
//   if (!groq) {
//     if (!process.env.GROQ_API_KEY) {
//       throw new Error("GROQ_API_KEY environment variable is missing or empty.");
//     }
//     groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
//   }
//   return groq;
// };

// export const generateAnswer = async (query, contextChunks) => {
//   const context = contextChunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");

//   const systemPrompt = `You are a helpful memory assistant. Answer the user's question using ONLY the context provided below. If the context doesn't contain enough information to answer, say so clearly instead of guessing.

// Context:
// ${context}`;

//   const completion = await getGroqClient().chat.completions.create({
//     model: 'openai/gpt-oss-120b',
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: query },
//     ],
//     temperature: 0.3,
//     max_tokens: 500,
//   });

//   return completion.choices[0].message.content;
// };
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateAnswer = async (query, contextChunks, graphFacts = []) => {
  const context = contextChunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");

  const graphSection =
    graphFacts.length > 0
      ? `\n\nKnowledge graph facts (relationships between entities, use these for questions about how things connect):\n${graphFacts
          .map((f) => `- ${f}`)
          .join("\n")}`
      : "";

  const systemPrompt = `You are a helpful memory assistant. Answer the user's question using ONLY the context provided below. If the context doesn't contain enough information to answer, say so clearly instead of guessing.

Context:
${context || "(no document excerpts matched)"}${graphSection}`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
};
