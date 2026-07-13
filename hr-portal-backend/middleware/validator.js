import { z } from "zod";
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier.");
const safe = (min, max) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (v) => !/[\u0000$]/.test(v) && !/^\s*[\[{]/.test(v),
      "Invalid characters.",
    );
const page = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const schemas = {
  otp: z
    .object({
      code: z.string().regex(/^\d{6}$/, "Code must contain six digits."),
    })
    .strict(),
  phone: z
    .object({
      phone: z
        .string()
        .regex(/^\+[1-9]\d{7,14}$/, "Use an E.164 phone number."),
    })
    .strict(),
  login: z
    .object({
      phone: z
        .string()
        .regex(/^\+[1-9]\d{7,14}$/, "Use an E.164 phone number."),
      password: z.string().min(1).max(256),
    })
    .strict(),
  registration: z
    .object({
      name: safe(2, 100),
      jobTitle: safe(2, 100),
      department: safe(2, 100),
      password: z
        .string()
        .min(12, "Password must contain at least 12 characters.")
        .max(128)
        .regex(/[a-z]/, "Password must contain a lowercase letter.")
        .regex(/[A-Z]/, "Password must contain an uppercase letter.")
        .regex(/\d/, "Password must contain a number.")
        .regex(/[^A-Za-z0-9\s]/, "Password must contain a symbol.")
        .refine((value) => !/\s/.test(value), "Password cannot contain spaces."),
    })
    .strict(),
  profile: z
    .object({
      name: safe(2, 100),
      jobTitle: safe(2, 100),
      department: safe(2, 100),
      nationalId: safe(4, 40).optional(),
      bankAccount: safe(4, 80).optional(),
    })
    .strict(),
  employeeList: page
    .extend({
      department: safe(1, 100).optional(),
      active: z.coerce.boolean().optional(),
    })
    .strict(),
  id: z.object({ id: objectId }).strict(),
  salary: z
    .object({ baseSalary: z.number().positive().max(10000000) })
    .strict(),
  disburseSalary: z
    .object({
      employeeId: objectId,
      baseSalary: z.number().positive().max(10000000),
      idempotencyKey: z.string().uuid().optional(),
    })
    .strict(),
  role: z.object({ role: z.enum(["Employee", "HR"]) }).strict(),
  review: z
    .object({
      employeeId: objectId,
      period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      rating: z.number().int().min(1).max(5),
      comment: safe(1, 2000),
    })
    .strict(),
  reviewPeriod: page
    .extend({
      period: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
        .optional(),
    })
    .strict(),
  document: z.object({ type: z.enum(["BANK_PROOF", "NATIONAL_ID"]) }).strict(),
  documentDecision: z
    .object({ status: z.enum(["APPROVED", "REJECTED"]) })
    .strict(),
  submitAttendance: z
    .object({
      recordType: z.enum(["ATTENDANCE", "LEAVE"]),
      attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkInAt: z.string().datetime({ offset: true }).optional(),
      checkOutAt: z.string().datetime({ offset: true }).optional(),
      leaveType: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"]).optional(),
      reason: safe(2, 1000).optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.recordType === "ATTENDANCE" && !data.checkInAt)
        ctx.addIssue({
          code: "custom",
          path: ["checkInAt"],
          message: "Check-in is required.",
        });
      if (data.recordType === "LEAVE" && !data.leaveType)
        ctx.addIssue({
          code: "custom",
          path: ["leaveType"],
          message: "Leave type is required.",
        });
      if (
        data.checkInAt &&
        data.checkOutAt &&
        new Date(data.checkOutAt) <= new Date(data.checkInAt)
      )
        ctx.addIssue({
          code: "custom",
          path: ["checkOutAt"],
          message: "Check-out must be after check-in.",
        });
    }),
  decideAttendance: z
    .object({
      decision: z.enum(["APPROVED", "REJECTED"]),
      comment: safe(1, 1000).optional(),
    })
    .strict(),
  attendanceListQuery: page
    .extend({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      recordType: z.enum(["ATTENDANCE", "LEAVE"]).optional(),
    })
    .strict(),
  payrollRunCreate: z
    .object({
      period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      dryRun: z.boolean().default(false),
    })
    .strict(),
  payrollListQuery: page
    .extend({
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
export const validateRequest =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success)
      return res
        .status(400)
        .json({
          status: "fail",
          message: "Validation failed.",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
    if (source === "body") req.body = result.data;
    else req.validated = { ...(req.validated || {}), [source]: result.data };
    next();
  };
