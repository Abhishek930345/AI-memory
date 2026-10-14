import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getGraph, getEntityNeighborhood } from "../controllers/graph.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getGraph);
router.get("/entity/:id", getEntityNeighborhood);

export default router;