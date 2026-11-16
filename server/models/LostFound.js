import mongoose from "mongoose";

const lostFoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    category: {
      type: String,
      enum: [
        "electronics",
        "cards-ids",
        "keys",
        "clothing",
        "books-notes",
        "accessories",
        "other",
      ],
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      index: true,
    },
    securityQuestion: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    contactInfo: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

lostFoundSchema.index({ college: 1, type: 1, status: 1, createdAt: -1 });
lostFoundSchema.index({ title: "text", description: "text", location: "text" });

const LostFound = mongoose.model("LostFound", lostFoundSchema);

export default LostFound;
