import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },

    text: { type: String, required: true },
    chunkIndex: { type: Number, required: true }, // order within the document

    // Phase 3: embedding will be populated here
    embedding: { type: [Number], default: undefined, select: false },
  },
  { timestamps: true }
);

chunkSchema.index({ document: 1, chunkIndex: 1 });

export default mongoose.model("Chunk", chunkSchema);