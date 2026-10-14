import { pipeline } from "@xenova/transformers";

// Model loads once and stays in memory — don't recreate this on every call
let embedderInstance = null;

const getEmbedder = async () => {
  if (!embedderInstance) {
    embedderInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderInstance;
};

// Returns a plain array of 384 numbers (this model's dimension)
export const generateEmbedding = async (text) => {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

export const generateEmbeddings = async (texts) => {
  const embedder = await getEmbedder();
  const results = [];
  for (const text of texts) {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data));
  }
  return results;
};