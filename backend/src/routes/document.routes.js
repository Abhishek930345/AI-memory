import express from "express";
import { upload } from "../config/multer.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  uploadDocument,
  listDocuments,
  getDocumentChunks,
  deleteDocument,
} from "../controllers/document.controller.js";

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", listDocuments);
router.get("/:id/chunks", getDocumentChunks);
router.delete("/:id", deleteDocument);

export default router;