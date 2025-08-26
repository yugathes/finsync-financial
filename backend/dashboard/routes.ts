import { Router } from "express";
import { getDashboardSummary } from "./controller";

const router = Router();

// GET /api/dashboard/:userId/:month?
router.get("/:userId/:month?", getDashboardSummary);

export default router;
