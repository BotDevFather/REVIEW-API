import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  user: {
    display_name: { type: String, required: true },
    platform: String,
    platform_username: String
  },

  message: {
    type: String,
    required: true
  },

  images: {
    pfp: { type: String, required: true },
    main: { type: String, required: true }
  },

  security_hash: {
    type: String,
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Review ||
  mongoose.model("Review", ReviewSchema);
