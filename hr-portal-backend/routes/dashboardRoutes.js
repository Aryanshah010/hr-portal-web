import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { stats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", protect, restrictTo("HR"), stats);

export default router;
