import mongoose from "mongoose";
import Chunk from "../models/Chunk.js";
import { generateEmbedding } from "../services/embedding.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @route POST /api/search
export const semanticSearch = asyncHandler(async (req, res) => {
  const { query, limit = 5 } = req.body;

  if (!query) {
    res.status(400);
    throw new Error("Query text is required");
  }

  const queryEmbedding = await generateEmbedding(query);

  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: Number(limit),
        filter: {
          user: new mongoose.Types.ObjectId(req.user._id),
        },
      },
    },
    {
      $project: {
        text: 1,
        document: 1,
        chunkIndex: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  res.json({ success: true, data: results });
});