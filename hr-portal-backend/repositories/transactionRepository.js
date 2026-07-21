import Transaction from "../models/Transaction.js";

export const create = (data) => Transaction.create(data);
export const findById = (id) => Transaction.findById(id).lean();

export const complete = (id) =>
  Transaction.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    {
      $set: {
        status: "COMPLETED",
        completedAt: new Date(),
        errorDetails: null,
      },
    },
    { new: true },
  );

export const fail = (id, errorDetails) =>
  Transaction.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    {
      $set: {
        status: "FAILED",
        errorDetails: String(errorDetails).slice(0, 500),
      },
    },
    { new: true },
  );
  
export const forPayrollRun = (payrollRunId) =>
  Transaction.find({ payrollRunId }).select("status").lean();

export const list = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Transaction.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employeeId", "name email")
      .lean(),
    Transaction.countDocuments(),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
};
