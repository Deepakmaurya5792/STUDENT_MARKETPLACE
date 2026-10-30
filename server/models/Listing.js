
import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    condition: {
      type: String,
      enum: ["new", "like-new", "good", "fair"],
      required: true,
    },

    listingType: {
      type: String,
      enum: ["sale", "rent", "exchange", "free"],
      required: true,
    },

    price: {
      type: Number,
      min: 0,
      required: function () {
        return ["sale", "rent"].includes(this.listingType);
      },
    },

    rentPeriod: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: function () {
        return this.listingType === "rent";
      },
    },

    exchangeFor: {
      type: String,
      trim: true,
      maxlength: 300,
      required: function () {
        return this.listingType === "exchange";
      },
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

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "reserved", "completed", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for marketplace filtering and sorting
listingSchema.index({
  college: 1,
  status: 1,
  createdAt: -1,
});

listingSchema.index({
  listingType: 1,
  status: 1,
});

listingSchema.index({
  category: 1,
  status: 1,
});

listingSchema.index({
  title: "text",
  description: "text",
});

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;
