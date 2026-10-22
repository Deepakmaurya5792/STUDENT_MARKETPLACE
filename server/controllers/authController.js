
import bcrypt from "bcrypt";
import User from "../models/User.js";
import College from "../models/College.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, collegeId } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !collegeId) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and college are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const college = await College.findOne({
      _id: collegeId,
      isActive: true,
    });

    if (!college) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive college",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      college: college._id,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};
