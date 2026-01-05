import { connectDB } from "../../lib/db.js";
import Review from "../../lib/review.model.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    await connectDB();

    // -----------------------------
    // QUERY PARAMS
    // -----------------------------
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(parseInt(req.query.limit || "12"), 50);
    const skip = (page - 1) * limit;

    // -----------------------------
    // FETCH ONLY APPROVED REVIEWS
    // -----------------------------
    const [reviews, total] = await Promise.all([
      Review.find({ status: "approved" })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          user: 1,
          message: 1,
          images: 1,
          created_at: 1
        })
        .lean(),

      Review.countDocuments({ status: "approved" })
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      has_more: skip + reviews.length < total,
      reviews
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message
    });
  }
}
