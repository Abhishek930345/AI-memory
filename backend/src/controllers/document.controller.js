import path from "path";
import fs from "fs";
import Document from "../models/Document.js";
import Chunk from "../models/Chunk.js";
import Project from "../models/Project.js";
import { extractText } from "../services/extraction.service.js";
import { chunkText } from "../services/chunking.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const typeFromExt = (filename) => {
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  return ext === "txt" ? "txt" : ext; // pdf, docx, txt
};

// @route POST /api/documents/upload
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const { projectId } = req.body;

  // Verify project belongs to this user
  const project = projectId
    ? await Project.findOne({ _id: projectId, owner: req.user._id })
    : await Project.findOne({ owner: req.user._id, isDefault: true });

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const fileType = typeFromExt(req.file.originalname);

  const document = await Document.create({
    user: req.user._id,
    project: project._id,
    originalName: req.file.originalname,
    fileType,
    filePath: req.file.path,
    status: "processing",
  });

  try {
    const rawText = await extractText(req.file.path, fileType);
    const textChunks = chunkText(rawText);

    // Generate embeddings for every chunk before saving — this is what powers semantic search later
    const embeddings = await generateEmbeddings(textChunks);

    const chunkDocs = await Chunk.insertMany(
      textChunks.map((text, index) => ({
        user: req.user._id,
        project: project._id,
        document: document._id,
        text,
        chunkIndex: index,
        embedding: embeddings[index],
      }))
    );

    document.status = "chunked";
    document.chunkCount = chunkDocs.length;
    await document.save();

    res.status(201).json({
      success: true,
      data: {
        document,
        chunkCount: chunkDocs.length,
      },
    });
  } catch (error) {
    document.status = "failed";
    document.errorMessage = error.message;
    await document.save();
    throw error;
  }
});

// @route GET /api/documents
export const listDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
});

// @route GET /api/documents/:id/chunks
export const getDocumentChunks = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, user: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  const chunks = await Chunk.find({ document: document._id }).sort({ chunkIndex: 1 });
  res.json({ success: true, data: chunks });
});

// @route DELETE /api/documents/:id
export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, user: req.user._id });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  // Delete all chunks belonging to this document first
  await Chunk.deleteMany({ document: document._id });

  // Delete the uploaded file from disk
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  await document.deleteOne();

  res.json({ success: true, message: "Document deleted" });
});