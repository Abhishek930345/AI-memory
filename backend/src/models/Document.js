import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx", "txt"], required: true },
    filePath: { type: String, required: true },
    status: {
      type: String,
      enum: ["uploaded", "processing", "chunked", "failed"],
      default: "uploaded",
    },
    chunkCount: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);