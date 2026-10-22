import mongoose from "mongoose";
import dns from "node:dns";

// Resolve SRV DNS issues common on Windows/local networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connected`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
