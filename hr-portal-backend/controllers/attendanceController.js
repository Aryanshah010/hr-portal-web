import * as attendanceService from "../services/attendanceService.js";
import AppError from "../utils/appError.js";

export const submitAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.submit({
      userId: req.user.id,
      payload: req.body,
      req,
    });
    res.status(201).json({ status: "success", data: { record } });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({
        status: "success",
        data: await attendanceService.listMine({
          userId: req.user.id,
          query: req.validated.query,
        }),
      });
  } catch (error) {
    next(error);
  }
};

export const getApprovalQueue = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({
        status: "success",
        data: await attendanceService.listForApproval({
          query: req.validated.query,
        }),
      });
  } catch (error) {
    next(error);
  }
};

export const decideAttendance = async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      throw new AppError("Invalid attendance request ID.", 400);
    const record = await attendanceService.decide({
      id: req.params.id,
      decision: req.body.decision,
      comment: req.body.comment,
      approverId: req.user.id,
      req,
    });
    res.status(200).json({ status: "success", data: { record } });
  } catch (error) {
    next(error);
  }
};
