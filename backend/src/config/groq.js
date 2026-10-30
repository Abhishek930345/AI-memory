import Groq from "groq-sdk";

let groqInstance = null;
let lastApiKey = null;

export const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    const error = new Error("GROQ_API_KEY is missing in backend/.env. Please set a valid Groq API key.");
    error.status = 401;
    throw error;
  }

  if (!groqInstance || lastApiKey !== apiKey) {
    groqInstance = new Groq({ apiKey });
    lastApiKey = apiKey;
  }

  return groqInstance;
};

export const getGroqModel = () => {
  return process.env.GROQ_MODEL || "openai/gpt-oss-120b";
};
