import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    text: { type: String, required: true },
    category: {
      type: String,
      enum: ["identity", "preference", "project", "relationship", "skill", "event", "goal", "raw"],
      default: "raw",
    },
    confidence: { type: Number, min: 0, max: 1, default: 1 },
    sourceSpan: { type: String, default: "" },
    embedding: { type: [Number], default: undefined, select: false }, // Phase 3 mein use hoga
    status: {
      type: String,
      enum: ["active", "superseded", "conflicted"],
      default: "active",
    },
    supersededBy: { type: mongoose.Schema.Types.ObjectId, ref: "Memory", default: null },
  },
  { timestamps: true }
);

memorySchema.index({ user: 1, project: 1, status: 1 });

export default mongoose.model("Memory", memorySchema);