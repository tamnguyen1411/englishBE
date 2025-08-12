import { Request, Response } from "express";
import { register, login, updateProfile, getProfile } from "../services/auth.service";
import { AuthRequest } from "../middleware/authMiddleware"; // ✅ Import AuthRequest
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const user = await register(name, email, password);
    res.status(201).json({ msg: "User registered", user });
  } catch (err: any) {
    res.status(400).json({ msg: err.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await login(email, password);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    res.status(400).json({ msg: err.message });
  }
};


export const updateProfileController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // ✅ Kiểm tra req.user tồn tại
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const userId = req.user; 
    const { name, bio } = req.body;

    const user = await updateProfile(userId, { name, bio });
    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};



// ✅ Lấy thông tin hồ sơ (profile) của user hiện tại
export const getProfileController = async (req: AuthRequest, res: Response) => {
  try {
    // console.log("getProfileController called");
    // if (!req.user) {
    //   return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    // }
    console.log("Fetching profile for user:", req.user);
    const user = await getProfile(req.user!);
    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};