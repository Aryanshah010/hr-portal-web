import PerformanceReview from "../models/PerformanceReview.js";
export const upsert = ({ employeeId, period, ...data }) =>
  PerformanceReview.findOneAndUpdate(
    { employeeId, period },
    { $set: data, $setOnInsert: { employeeId, period } },
    { upsert: true, new: true, runValidators: true },
  );
export const listForEmployee = (employeeId) =>
  PerformanceReview.find({ employeeId })
    .select("period rating createdBy createdAt updatedAt +encryptedComment")
    .sort({ period: -1 });
export const averageRating = () =>
  PerformanceReview.aggregate([
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

export const listAll = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    PerformanceReview.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employeeId", "name email")
      .populate("createdBy", "name")
      .lean(),
    PerformanceReview.countDocuments(),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
};
