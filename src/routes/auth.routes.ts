import express from "express";
import {
  registerUser,
  loginUser,
  updateProfileController, getProfileController
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/authMiddleware";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.patch("/me/profile",authMiddleware ,updateProfileController);
router.get("/me",authMiddleware,  getProfileController);  
export default router;
