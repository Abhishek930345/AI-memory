import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  extractFromDocument,
  listMemories,
  listConflicts,
  resolveConflict,
} from "../controllers/memory.controller.js";

const router = express.Router();

router.use(protect);

router.post("/extract/:documentId", extractFromDocument);
router.get("/", listMemories);
router.get("/conflicts", listConflicts);
router.post("/conflicts/:id/resolve", resolveConflict);

export default router;