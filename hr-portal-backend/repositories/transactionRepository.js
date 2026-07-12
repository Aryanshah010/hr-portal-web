import Transaction from "../models/Transaction.js";
export const create = (data) => Transaction.create(data);
export const setStripeIntent = (id, stripePaymentIntentId) =>
  Transaction.findByIdAndUpdate(
    id,
    { $set: { stripePaymentIntentId } },
    { new: true },
  );
export const findByStripeIntent = (stripePaymentIntentId) =>
  Transaction.findOne({ stripePaymentIntentId }).select(
    "+stripePaymentIntentId",
  );
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
