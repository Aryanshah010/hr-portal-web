import { z } from "zod";

export const schemas = {
  login: z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8),
  }),

  createEmployee: z.object({
    name: z.string().trim().min(2).max(50),
    email: z.email().trim().toLowerCase(),
    nationalId: z
      .string()
      .regex(
        /^[A-Za-z0-9-]+$/,
        "National ID must contain only letters, numbers, and hyphens",
      ),
    baseSalary: z.number().positive(),
    role: z.enum(["Employee", "Manager", "Admin"]).default("Employee"),
  }),
};

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        status: "fail",
        message:
          "Validation failed: The parameters provided violate strict formatting layout requirements.",
        errors,
      });
    }

    req.body = result.data;

    next();
  };
};
