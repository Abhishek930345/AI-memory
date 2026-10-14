// Splits text into overlapping chunks by character count.
// chunkSize/overlap tuned for typical embedding models (~500-1000 tokens per chunk is safe).
export const chunkText = (text, chunkSize = 1500, overlap = 200) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
  
    if (!cleaned) return [];
  
    // Entire text fits in one chunk — no need to split at all
    if (cleaned.length <= chunkSize) {
      return [cleaned];
    }
  
    const chunks = [];
    let start = 0;
  
    while (start < cleaned.length) {
      const end = Math.min(start + chunkSize, cleaned.length);
      let chunk = cleaned.slice(start, end);
  
      // If this isn't the final chunk, try to break at the last sentence boundary
      if (end < cleaned.length) {
        const lastPeriod = chunk.lastIndexOf(". ");
        if (lastPeriod > chunkSize * 0.5) {
          chunk = chunk.slice(0, lastPeriod + 1);
        }
      }
  
      chunks.push(chunk.trim());
  
      const nextStart = start + chunk.length - overlap;
      // Stop if we've reached the end, or if we're not making forward progress
      if (end >= cleaned.length || nextStart <= start) break;
      start = nextStart;
    }
  
    return chunks.filter((c) => c.length > 0);
  };