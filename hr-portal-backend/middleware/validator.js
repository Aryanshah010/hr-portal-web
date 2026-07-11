import { z } from "zod";

const rejectObjectValue = (val) => typeof val === "string";
const rejectOperatorString = (val) => !/^\s*\$/.test(val);
const rejectJsonString = (val) => !/^\s*[\[{]/.test(val);

const safeString = (minLen = 1, maxLen = 255) =>
  z
    .string({
      invalid_type_error:
        "Value must be a plain string, not an object or array. Injection attempt detected.",
    })
    .trim()
    .min(minLen, `Minimum length is ${minLen} characters.`)
    .max(maxLen, `Maximum length is ${maxLen} characters.`)
    .refine(rejectObjectValue, {
      message: "Object-type values are not permitted in this field.",
    })
    .refine(rejectOperatorString, {
      message:
        "Value contains a forbidden operator prefix ($). Injection attempt blocked.",
    })
    .refine(rejectJsonString, {
      message:
        "Value begins with JSON structural characters. Possible re-parse injection attempt blocked.",
    });

const safeEmail = z
  .string({ invalid_type_error: "Email must be a plain string." })
  .trim()
  .toLowerCase()
  .max(254, "Email address must not exceed 254 characters.")
  .email("Email address format is invalid.")
  .refine(rejectOperatorString, {
    message: "Email contains a forbidden operator prefix.",
  })
  .refine(rejectJsonString, {
    message: "Email contains forbidden JSON structural characters.",
  });

const passwordComplexity = z
  .string({ invalid_type_error: "Password must be a plain string." })
  .min(12, "Password must be at least 12 characters long.")
  .max(128, "Password must not exceed 128 characters.")
  .refine((v) => /[A-Z]/.test(v), {
    message: "Password must contain at least one uppercase letter.",
  })
  .refine((v) => /[a-z]/.test(v), {
    message: "Password must contain at least one lowercase letter.",
  })
  .refine((v) => /[0-9]/.test(v), {
    message: "Password must contain at least one numeric digit.",
  })
  .refine((v) => /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/`~]/.test(v), {
    message: "Password must contain at least one special character.",
  })
  .refine(rejectOperatorString, {
    message: "Password contains a forbidden operator prefix.",
  });

export const schemas = {
  login: z.object({
    email: safeEmail,
    password: z
      .string({
        invalid_type_error:
          "Password must be a plain string, not an object. Injection attempt detected.",
      })
      .min(1, "Password is required."),
  }),

  register: z.object({
    email: safeEmail,
    password: passwordComplexity,
    name: safeString(2, 100),
    role: z.enum(["Employee", "Manager", "Admin"]).default("Employee"),
  }),

  createEmployee: z.object({
    name: safeString(2, 100),
    email: safeEmail,
    nationalId: z
      .string({ invalid_type_error: "National ID must be a plain string." })
      .regex(
        /^[A-Za-z0-9-]{4,20}$/,
        "National ID must be 4–20 characters containing only letters, digits, and hyphens.",
      )
      .refine(rejectOperatorString, {
        message: "National ID contains a forbidden operator prefix.",
      }),
    baseSalary: z
      .number({
        invalid_type_error:
          "Base salary must be a number. Object-type values are not permitted.",
        required_error: "Base salary is required.",
      })
      .positive("Base salary must be a positive number.")
      .min(
        17300,
        "Base salary must meet the Nepal statutory minimum of NPR 17,300.",
      ),
    role: z.enum(["Employee", "Manager", "Admin"]).default("Employee"),
    department: safeString(1, 100).optional().nullable(),
    employmentType: z
      .enum(["Regular", "WorkBased", "TimeBound", "Casual", "PartTime"])
      .default("Regular"),
  }),

  updateEmployee: z
    .object({
      name: safeString(2, 100).optional(),
      department: safeString(1, 100).optional().nullable(),
      role: z.enum(["Employee", "Manager", "Admin"]).optional(),
      employmentType: z
        .enum(["Regular", "WorkBased", "TimeBound", "Casual", "PartTime"])
        .optional(),
      isActive: z.boolean().optional(),
    })
    .strict(),

  updateSalary: z.object({
    baseSalary: z
      .number({
        invalid_type_error:
          "Base salary must be a number. Object-type values are not permitted.",
        required_error: "Base salary is required.",
      })
      .positive("Base salary must be a positive number.")
      .min(
        17300,
        "Base salary must meet the Nepal statutory minimum of NPR 17,300.",
      )
      .max(
        10000000,
        "Base salary value is unrealistically high. Possible data entry error.",
      ),
  }),

  fetchAvatarUrl: z.object({
    url: z
      .string({ invalid_type_error: "URL must be a plain string." })
      .trim()
      .min(10, "URL is too short to be valid.")
      .max(500, "URL must not exceed 500 characters.")
      .url("URL format is invalid.")
      .refine(
        (v) => /^https?:\/\//i.test(v),
        "Only http and https URL schemes are permitted. Other schemes (file://, gopher://, etc.) are blocked.",
      )
      .refine(rejectOperatorString, {
        message: "URL contains a forbidden operator prefix.",
      }),
  }),

  verifyTotp: z.object({
    token: z
      .string({ invalid_type_error: "TOTP token must be a plain string." })
      .trim()
      .regex(/^\d{6}$/, "TOTP token must be exactly 6 numeric digits."),
  }),

  changePassword: z
    .object({
      currentPassword: z
        .string({
          invalid_type_error: "Current password must be a plain string.",
        })
        .min(1, "Current password is required."),
      newPassword: passwordComplexity,
      confirmPassword: z.string().min(1, "Password confirmation is required."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New password and confirmation do not match.",
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from the current password.",
      path: ["newPassword"],
    }),

  disburseSalary: z.object({
    employeeId: z
      .string({ invalid_type_error: "Employee ID must be a plain string." })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Employee ID format."),
    baseSalary: z
      .number({
        invalid_type_error: "Base salary must be a number.",
        required_error: "Base salary is required.",
      })
      .positive("Base salary must be a positive number.")
      .min(
        17300,
        "Base salary must meet the Nepal statutory minimum of NPR 17,300.",
      ),
    idempotencyKey: z
      .string({ invalid_type_error: "Idempotency key must be a plain string." })
      .uuid("Idempotency key must be a valid UUID v4.")
      .optional(),
  }),

  submitAttendance: z
    .object({
      recordType: z.enum(["ATTENDANCE", "LEAVE"]),
      attendanceDate: z
        .string({
          invalid_type_error: "Attendance date must be an ISO date string.",
        })
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          "Attendance date must use YYYY-MM-DD format.",
        ),
      checkInAt: z.string().datetime({ offset: true }).optional(),
      checkOutAt: z.string().datetime({ offset: true }).optional(),
      leaveType: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"]).optional(),
      reason: safeString(2, 1000).optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.recordType === "ATTENDANCE" && !data.checkInAt) {
        ctx.addIssue({
          code: "custom",
          path: ["checkInAt"],
          message: "Check-in time is required for attendance.",
        });
      }
      if (data.recordType === "LEAVE" && !data.leaveType) {
        ctx.addIssue({
          code: "custom",
          path: ["leaveType"],
          message: "Leave type is required for leave requests.",
        });
      }
      if (
        data.checkInAt &&
        data.checkOutAt &&
        new Date(data.checkOutAt) <= new Date(data.checkInAt)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["checkOutAt"],
          message: "Check-out time must be after check-in time.",
        });
      }
    }),

  decideAttendance: z
    .object({
      decision: z.enum(["APPROVED", "REJECTED"]),
      comment: safeString(1, 1000).optional(),
    })
    .strict(),

  attendanceListQuery: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      recordType: z.enum(["ATTENDANCE", "LEAVE"]).optional(),
    })
    .strict(),

  payrollRunCreate: z
    .object({
      period: z
        .string({ invalid_type_error: "Period must be a string." })
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must use YYYY-MM format."),
      dryRun: z.boolean().default(false),
    })
    .strict(),

  payrollListQuery: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z
        .enum([
          "DRAFT",
          "PENDING_APPROVAL",
          "APPROVED",
          "PROCESSING",
          "COMPLETED",
          "FAILED",
        ])
        .optional(),
    })
    .strict(),

  emptyBody: z.object({}).strict(),
};

export const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

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

    if (source === "body") {
      req.body = result.data;
    } else {
      req.validated = { ...(req.validated || {}), [source]: result.data };
    }

    next();
  };
};
