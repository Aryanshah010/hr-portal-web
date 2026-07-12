import * as documents from "../services/documentService.js";
export const upload = async (req, res, next) => {
  try {
    const document = await documents.upload({
      userId: req.user.id,
      type: req.body.type,
      file: req.file,
      req,
    });
    res.status(201).json({ status: "success", data: { document } });
  } catch (e) {
    next(e);
  }
};
export const mine = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: { records: await documents.mine(req.user.id) },
    });
  } catch (e) {
    next(e);
  }
};
export const pending = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: { records: await documents.pending(req.validated.query) },
    });
  } catch (e) {
    next(e);
  }
};
export const decide = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: {
        document: await documents.decide({
          id: req.params.id,
          status: req.body.status,
          hrId: req.user.id,
          req,
        }),
      },
    });
  } catch (e) {
    next(e);
  }
};
export const download = async (req, res, next) => {
  try {
    const file = await documents.download({
      id: req.params.id,
      userId: req.user.id,
      isHr: req.user.role === "HR",
      req,
    });
    res
      .type(file.mimeType)
      .set("Content-Disposition", `attachment; filename=\"${file.name}\"`)
      .send(file.buffer);
  } catch (e) {
    next(e);
  }
};
