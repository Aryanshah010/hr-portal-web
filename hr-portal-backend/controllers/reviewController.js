import * as reviews from "../services/reviewService.js";
import * as reviewRepo from "../repositories/reviewRepository.js";

export const list = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: await reviewRepo.listAll(req.validated.query),
    });
  } catch (e) {
    next(e);
  }
};

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
      data: { reviews: await reviews.mine(req.user.id) },
    });
  } catch (e) {
    next(e);
  }
};
