import mongoose from "mongoose";

const memoryConflictSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    existingMemory: { type: mongoose.Schema.Types.ObjectId, ref: "Memory", required: true },
    newFactText: { type: String, required: true },
    newFactCategory: { type: String, default: "raw" },
    newFactConfidence: { type: Number, default: 1 },
    sourceDocument: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    reasoning: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    resolution: {
      type: String,
      enum: ["kept_old", "kept_new", "kept_both", null],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MemoryConflict", memoryConflictSchema);