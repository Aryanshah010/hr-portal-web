import multer from "multer";

const storage = multer.memoryStorage();

export const signatures = [
  { mime: "application/pdf", bytes: Buffer.from("%PDF-") },
  { mime: "image/jpeg", bytes: Buffer.from([0xff, 0xd8, 0xff]) },
  {
    mime: "image/png",
    bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
];

export const detectMimeType = (buffer, allowed = null) => {
  const match = signatures.find(({ bytes }) =>
    buffer.subarray(0, bytes.length).equals(bytes),
  );
  if (!match) return null;
  if (allowed && !allowed.includes(match.mime)) return null;
  return match.mime;
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype),
    ),
});

export const parseSecureUpload = (fieldName) => (req, res, next) =>
  upload.single(fieldName)(req, res, (error) => {
    if (error || !req.file)
      return res.status(400).json({
        status: "fail",
        message: "A PDF, JPEG, or PNG document up to 2 MB is required.",
      });
    const detected = signatures.find(({ bytes }) =>
      req.file.buffer.subarray(0, bytes.length).equals(bytes),
    );
    if (!detected || detected.mime !== req.file.mimetype)
      return res.status(400).json({
        status: "fail",
        message: "Document content does not match its declared type.",
      });
    req.file.detectedMimeType = detected.mime;
    next();
  });
