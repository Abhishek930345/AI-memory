import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { semanticSearch } from "../controllers/search.controller.js";

const router = express.Router();

router.use(protect);
router.post("/", semanticSearch);

export default router;