import { initiateSalaryDisbursement } from "../services/transactionService.js";
import { env } from "../config/environment.js";
import AppError from "../utils/appError.js";
import * as transactions from "../repositories/transactionRepository.js";

export const list = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: await transactions.list(req.validated.query),
    });
  } catch (e) {
    next(e);
  }
};

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { employeeId, baseSalary, idempotencyKey } = req.body;
    const hrId = req.user.id;

    const result = await initiateSalaryDisbursement({
      employeeId,
      amount: baseSalary,
      hrId,
      idempotencyKey,
    });

    res.status(200).json({
      status: "success",
      message: "Secure payment intent successfully registered in ledger.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
