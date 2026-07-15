import * as audit from "../repositories/auditRepository.js";

export const list = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: await audit.list(req.validated.query),
    });
  } catch (e) {
    next(e);
  }
};
