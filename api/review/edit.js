import crypto from "crypto";
import { connectDB } from "../../lib/db.js";
import Review from "../../lib/review.model.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const {
      review_id,
      security_key,
      message,
      user
    } = req.body || {};

    if (!review_id || !security_key) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    await connectDB();

    // Hash provided key
    const security_hash = crypto
      .createHash("sha256")
      .update(security_key)
      .digest("hex");

    // Find review
    const review = await Review.findOne({
      _id: review_id,
      security_hash
    });

    if (!review) {
      return res.status(401).json({ error: "INVALID_SECURITY_KEY" });
    }

    // Update allowed fields only
    if (message) review.message = message;

    if (user?.display_name) review.user.display_name = user.display_name;
    if (user?.platform) review.user.platform = user.platform;
    if (user?.platform_username)
      review.user.platform_username = user.platform_username;

    await review.save();

    return res.json({
      success: true,
      updated_review_id: review._id
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
