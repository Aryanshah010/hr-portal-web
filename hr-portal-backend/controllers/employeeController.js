import * as employee from "../services/employeeService.js";
import * as auth from "../services/authService.js";
export const myProfile = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: { profile: await employee.myProfile(req.user.id) },
    });
  } catch (e) {
    next(e);
  }
};
export const updateMyProfile = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: {
        profile: await employee.updateMyProfile({
          userId: req.user.id,
          input: req.body,
          req,
        }),
      },
    });
  } catch (e) {
    next(e);
  }
};
export const deactivateMe = async (req, res, next) => {
  try {
    await employee.deactivateSelf({ userId: req.user.id, req });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
export const list = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: await employee.listEmployees(req.validated.query),
    });
  } catch (e) {
    next(e);
  }
};
export const pending = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: await employee.pendingEmployees(req.validated.query),
    });
  } catch (e) {
    next(e);
  }
};
export const approve = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: {
        user: await auth.approveEmployee({
          userId: req.params.id,
          hrId: req.user.id,
          req,
        }),
      },
    });
  } catch (e) {
    next(e);
  }
};
export const salary = async (req, res, next) => {
  try {
    await employee.updateSalary({
      employeeId: req.params.id,
      baseSalary: req.body.baseSalary,
      hrId: req.user.id,
      req,
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
export const changeRole = async (req, res, next) => {
  try {
    await employee.changeRole({
      targetUserId: req.params.id,
      role: req.body.role,
      hrId: req.user.id,
      req,
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
export const listHr = async (_req, res, next) => {
  try {
    res.json({ status: "success", data: { records: await employee.listHr() } });
  } catch (e) {
    next(e);
  }
};
