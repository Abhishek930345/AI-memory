import mongoose from "mongoose";

const relationshipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    source: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", required: true },
    label: { type: String, required: true, trim: true }, // e.g. "uses", "built", "works_at"
    sourceMemory: { type: mongoose.Schema.Types.ObjectId, ref: "Memory" },
  },
  { timestamps: true }
);

relationshipSchema.index({ user: 1, source: 1, target: 1, label: 1 }, { unique: true });

export default mongoose.model("Relationship", relationshipSchema);