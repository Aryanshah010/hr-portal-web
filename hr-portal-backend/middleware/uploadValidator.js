import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new multer.MulterError(
        "LIMIT_UNSUPPORTED_FILE_TYPE",
        "Invalid document structure. Only JPEG, PNG, or PDF formats are permitted.",
      ),
      false,
    );
  }
};

export const uploadEngine = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

export const parseSecureUpload = (fieldName) => {
  const singleUpload = uploadEngine.single(fieldName);

  return (req, res, next) => {
    singleUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: "FileUpload Security Exception",
          message:
            err.message ||
            "File processing failed security verification criteria.",
        });
      }
      next();
    });
  };
};
