import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  },
  { timestamps: true }
);

export default model('Wishlist', wishlistSchema);
