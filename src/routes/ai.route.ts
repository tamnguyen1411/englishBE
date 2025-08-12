import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { grammarFix } from "../controllers/ai.controller";
import { vocabAssist } from "../controllers/ai.vocab.controller";
import { generateExercises } from "../controllers/ai.exercise.controller";
import { smartTranslate } from "../controllers/ai.translate.controller";
const router = express.Router();

router.post("/grammar", authMiddleware, grammarFix);
router.post("/vocab", authMiddleware, vocabAssist);
router.post("/exercise", authMiddleware, generateExercises);
router.post("/translate", authMiddleware, smartTranslate);
export default router;
