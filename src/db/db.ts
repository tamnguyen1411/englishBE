import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("MongoDB connected susccessfully");
  } catch (err) {
    console.error("MongoDB error:", err);
    process.exit(1);
  }
};

export default connectDB;
