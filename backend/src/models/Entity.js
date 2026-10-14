import mongoose from "mongoose";

const entitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["person", "project", "technology", "organization", "skill", "concept", "other"],
      default: "other",
    },
    sourceMemory: { type: mongoose.Schema.Types.ObjectId, ref: "Memory" },
  },
  { timestamps: true }
);

// Prevent duplicate entities per user (case-insensitive match handled in service layer)
entitySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.model("Entity", entitySchema);