import * as dashboard from "../services/dashboardService.js";
export const stats = async (_req, res, next) => {
  try {
    res.json({ status: "success", data: await dashboard.getStats() });
  } catch (e) {
    next(e);
  }
};
