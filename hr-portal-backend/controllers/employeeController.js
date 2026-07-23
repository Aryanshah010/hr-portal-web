import * as employee from "../services/employeeService.js";
import * as auth from "../services/authService.js";
import * as attendanceRepo from "../repositories/attendanceRepository.js";
import * as reviewRepo from "../repositories/reviewRepository.js";
import * as userRepo from "../repositories/userRepository.js";
import * as audit from "../repositories/auditRepository.js";
import * as documents from "../services/documentService.js";

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

export const setMyAvatar = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: await documents.setAvatarFromUrl({
        userId: req.user.id,
        url: req.body.url,
        req,
      }),
    });
  } catch (e) {
    next(e);
  }
};

export const getMyAvatar = async (req, res, next) => {
  try {
    const avatar = await documents.readAvatar(req.user.id);
    res.type(avatar.mimeType).send(avatar.buffer);
  } catch (e) {
    next(e);
  }
};

export const changeMyPassword = async (req, res, next) => {
  try {
    await auth.changeOwnPassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      req,
    });
    res.status(200).json({
      status: "success",
      message: "Password changed. Please sign in again.",
    });
  } catch (e) {
    next(e);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await auth.resetPasswordForUser({
      targetUserId: req.params.id,
      hrId: req.user.id,
      req,
    });
    res.status(202).json({
      status: "success",
      message: "A temporary password was sent to the employee by SMS.",
    });
  } catch (e) {
    next(e);
  }
};

export const reactivate = async (req, res, next) => {
  try {
    await employee.reactivateEmployee({
      targetUserId: req.params.id,
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

export const exportMyData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [profile, user] = await Promise.all([
      employee.myProfile(userId),
      userRepo.findById(userId),
    ]);
    const [attendance, reviews] = await Promise.all([
      attendanceRepo.findForEmployee(profile._id || profile.id, {
        limit: 1000,
        page: 1,
      }),
      reviewRepo.listForEmployee(profile._id || profile.id),
    ]);
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      },
      profile,
      attendance: attendance?.items || [],
      reviews: reviews || [],
    };
    await audit.record({
      eventType: "DATA_EXPORT_REQUESTED",
      severity: "HIGH",
      req,
      actorId: userId,
      actorRole: req.user.role,
      metadata: {
        attendanceRecords: exportData.attendance.length,
        reviewRecords: exportData.reviews.length,
      },
    });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="my-data-export-${Date.now()}.json"`,
    );
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (e) {
    next(e);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    await employee.deleteEmployee({
      targetUserId: req.params.id,
      hrId: req.user.id,
      req,
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
