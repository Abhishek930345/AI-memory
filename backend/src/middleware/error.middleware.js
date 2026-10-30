export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.status ||
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  let message = err.message || "Internal Server Error";

  try {
    const jsonMatch = message?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    }
  } catch (_) {
    // ignore parse error, use original message
  }

  if (statusCode === 401 && /invalid.*api.*key/i.test(message)) {
    message = "Invalid or expired GROQ_API_KEY. Please update GROQ_API_KEY in backend/.env with a valid API key from https://console.groq.com/keys.";
  }

  res.status(statusCode >= 100 && statusCode < 600 ? statusCode : 500).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
