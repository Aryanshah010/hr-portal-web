import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import PayrollRun from "../models/PayrollRun.js";
import User, { ROLES, ACCOUNT_STATUS } from "../models/User.js";
import { averageRating } from "./reviewRepository.js";
export const getStats = async () => {
  const [activeEmployees, pendingAttendance, latestPayroll, hrCount, ratings] =
    await Promise.all([
      Employee.countDocuments({ isActive: true }),
      Attendance.countDocuments({ status: "PENDING" }),
      PayrollRun.findOne()
        .select("period status totals createdAt")
        .sort({ period: -1 })
        .lean(),
      User.countDocuments({
        role: ROLES.HR,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      }),
      averageRating(),
    ]);
  return {
    activeEmployees,
    pendingAttendance,
    latestPayroll,
    hrCount,
    performance: {
      averageRating: ratings[0]?.average || 0,
      reviewCount: ratings[0]?.count || 0,
    },
  };
};
