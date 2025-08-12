import User from "../models/User";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken";

export const register = async (
  name: string,
  email: string,
  password: string
) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already exists");

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashed });
  await newUser.save();
  return newUser;
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }
  const token = generateToken(user._id.toString());
  return { user, token };
};

type UpdateProfileInput = {
  name?: string;
  bio?: string;
};

export const updateProfile = async (
  userId: string,
  payload: UpdateProfileInput
) => {
  const updates: Record<string, any> = {};

  if (typeof payload.name === "string") {
    const name = payload.name.trim();
    if (!name) throw new Error("Tên không được để trống.");
    if (name.length > 100) throw new Error("Tên tối đa 100 ký tự.");
    updates.name = name;
  }

  if (typeof payload.bio === "string") {
    const bio = payload.bio.trim();
    if (bio.length > 500) throw new Error("Bio tối đa 500 ký tự.");
    updates.bio = bio;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("Không có dữ liệu để cập nhật.");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password");

  return user;
};

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("Không tìm thấy người dùng.");
  }
  return user;
};