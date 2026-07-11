import * as payrollService from "../services/payrollService.js";
import * as salaryService from "../services/salaryService.js";
import AppError from "../utils/appError.js";

const validId = (value) => /^[0-9a-fA-F]{24}$/.test(value);
const ensureId = (value, label) => {
  if (!validId(value)) throw new AppError(`Invalid ${label} ID.`, 400);
};

export const createRun = async (req, res, next) => {
  try {
    res
      .status(req.body.dryRun ? 200 : 201)
      .json({
        status: "success",
        data: await payrollService.createRun({
          ...req.body,
          createdBy: req.user.id,
          req,
        }),
      });
  } catch (error) {
    next(error);
  }
};
export const listRuns = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({
        status: "success",
        data: await payrollService.listRuns(req.validated.query),
      });
  } catch (error) {
    next(error);
  }
};
export const getRun = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({
        status: "success",
        data: { run: await payrollService.getRun(req.params.id) },
      });
  } catch (error) {
    next(error);
  }
};
export const submitRun = async (req, res, next) => {
  try {
    ensureId(req.params.id, "payroll run");
    res
      .status(200)
      .json({
        status: "success",
        data: { run: await payrollService.submitRun(req.params.id) },
      });
  } catch (error) {
    next(error);
  }
};
export const approveRun = async (req, res, next) => {
  try {
    ensureId(req.params.id, "payroll run");
    res
      .status(200)
      .json({
        status: "success",
        data: {
          run: await payrollService.approveRun({
            id: req.params.id,
            approverId: req.user.id,
            req,
          }),
        },
      });
  } catch (error) {
    next(error);
  }
};
export const executeRun = async (req, res, next) => {
  try {
    ensureId(req.params.id, "payroll run");
    res
      .status(202)
      .json({
        status: "success",
        data: {
          run: await payrollService.executeRun({
            id: req.params.id,
            adminId: req.user.id,
            req,
          }),
        },
      });
  } catch (error) {
    next(error);
  }
};
export const getPayslip = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({
        status: "success",
        data: {
          payslip: await payrollService.readPayslip({
            runId: req.params.runId,
            employeeId: req.params.employeeId,
            userId: req.user.id,
            role: req.user.role,
            req,
          }),
        },
      });
  } catch (error) {
    next(error);
  }
};
export const updateSalary = async (req, res, next) => {
  try {
    ensureId(req.params.employeeId, "employee");
    res
      .status(200)
      .json({
        status: "success",
        data: await salaryService.updateSalary({
          employeeId: req.params.employeeId,
          baseSalary: req.body.baseSalary,
          changedBy: req.user.id,
          req,
        }),
      });
  } catch (error) {
    next(error);
  }
};
