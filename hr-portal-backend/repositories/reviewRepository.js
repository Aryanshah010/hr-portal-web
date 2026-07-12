import PerformanceReview from "../models/PerformanceReview.js";
export const upsert = ({ employeeId, period, ...data }) => PerformanceReview.findOneAndUpdate({ employeeId, period }, { $set: data, $setOnInsert: { employeeId, period } }, { upsert: true, new: true, runValidators: true });
export const listForEmployee = (employeeId) => PerformanceReview.find({ employeeId }).select("period rating createdBy createdAt updatedAt +encryptedComment").sort({ period: -1 });
export const averageRating = () => PerformanceReview.aggregate([{ $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }]);
