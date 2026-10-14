import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { chatWithMemory } from "../controllers/chat.controller.js";

const router = express.Router();

router.use(protect);
router.post("/", chatWithMemory);

export default router;