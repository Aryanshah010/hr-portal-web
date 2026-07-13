import * as reviews from "../services/reviewService.js";
export const save = async (req, res, next) => {
  try {
    res.status(201).json({
      status: "success",
      data: {
        review: await reviews.save({
          input: req.body,
          hrId: req.user.id,
          req,
        }),
      },
    });
  } catch (e) {
    next(e);
  }
};
export const mine = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: { records: await reviews.mine(req.user.id) },
    });
  } catch (e) {
    next(e);
  }
};
