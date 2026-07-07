import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/cryptoUtil.js";

const noOperatorChars = (value) => {
  if (typeof value !== "string") return false;
  return !/[.$]/.test(value);
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const NATIONAL_ID_REGEX = /^[A-Za-z0-9-]{4,20}$/;
const AVATAR_URL_REGEX = /^https?:\/\/[^\s<>"{}|\\^`\[\]]{1,490}$/;
const NEPAL_MINIMUM_WAGE_NPR = 17300;

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Employee name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."],
      maxlength: [100, "Name must not exceed 100 characters."],
      validate: [
        {
          validator: noOperatorChars,
          message:
            "Name contains forbidden operator characters. Injection attempt detected.",
        },
        {
          validator: (v) => !/\{|\}|\[|\]/.test(v),
          message: "Name contains forbidden structural characters.",
        },
      ],
    },

    email: {
      type: String,
      required: [true, "Employee email address is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email address must not exceed 254 characters."],
      validate: [
        {
          validator: (v) => EMAIL_REGEX.test(v),
          message: "Email address format is invalid.",
        },
        {
          validator: noOperatorChars,
          message:
            "Email contains forbidden operator characters. Injection attempt detected.",
        },
      ],
    },

    nationalId: {
      type: String,
      required: [true, "National ID is required."],
      validate: {
        validator: (v) => typeof v === "string" && v.includes(":"),
        message:
          "National ID must be stored in encrypted format. " +
          "Plaintext PII must not reach the schema layer directly.",
      },
      select: false,
    },

    baseSalary: {
      type: String,
      required: [true, "Base salary is required."],
      validate: {
        validator: (v) => typeof v === "string" && v.includes(":"),
        message: "Base salary must be stored in encrypted format.",
      },
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ["Employee", "Manager", "Admin"],
        message:
          "Role '{VALUE}' is not a valid system role. " +
          "This may indicate a privilege escalation attempt.",
      },
      default: "Employee",
    },

    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department name must not exceed 100 characters."],
      default: null,
      validate: {
        validator: (v) => v === null || noOperatorChars(v),
        message: "Department name contains forbidden operator characters.",
      },
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee must be linked to a User account."],
      unique: true,
    },

    avatarUrl: {
      type: String,
      default: null,
      maxlength: [500, "Avatar URL must not exceed 500 characters."],
      validate: {
        validator: (v) => v === null || AVATAR_URL_REGEX.test(v),
        message:
          "Avatar URL must use http or https protocol and contain no " +
          "forbidden characters. Other protocol schemes are not permitted.",
      },
    },

    employmentType: {
      type: String,
      enum: {
        values: ["Regular", "WorkBased", "TimeBound", "Casual", "PartTime"],
        message:
          "Employment type '{VALUE}' is not a recognized classification.",
      },
      default: "Regular",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
    versionKey: false,
  },
);

employeeSchema.index({ email: 1 });
employeeSchema.index({ userId: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ isActive: 1 });

employeeSchema.virtual("nationalIdPlain").get(function () {
  if (!this.nationalId) return null;
  try {
    return decrypt(this.nationalId);
  } catch {
    return null;
  }
});

employeeSchema.virtual("nationalIdPlain").set(function (plainValue) {
  if (!plainValue) return;
  if (!NATIONAL_ID_REGEX.test(plainValue)) {
    throw new Error(
      `[Employee Schema] Invalid national ID format: "${plainValue}". ` +
        "Only alphanumeric characters and hyphens (4–20 chars) are permitted.",
    );
  }

  this.nationalId = encrypt(plainValue);
});

employeeSchema.virtual("baseSalaryPlain").get(function () {
  if (!this.baseSalary) return null;
  try {
    const decrypted = decrypt(this.baseSalary);
    return parseFloat(decrypted);
  } catch {
    return null;
  }
});

employeeSchema.virtual("baseSalaryPlain").set(function (salaryValue) {
  const salary = Number(salaryValue);

  if (isNaN(salary)) {
    throw new Error(
      `[Employee Schema] Base salary must be a numeric value. ` +
        `Received: "${salaryValue}". Possible type injection attempt.`,
    );
  }

  if (salary < NEPAL_MINIMUM_WAGE_NPR) {
    throw new Error(
      `[Employee Schema] Base salary NPR ${salary} is below the statutory ` +
        `minimum of NPR ${NEPAL_MINIMUM_WAGE_NPR} (Nepal Labor Act 2074).`,
    );
  }

  this.baseSalary = encrypt(String(salary));
});

employeeSchema.pre("save", function (next) {
  const OPERATOR_PATTERN = /^\s*\$/;

  const stringFields = ["name", "email", "department", "avatarUrl"];

  for (const field of stringFields) {
    const value = this[field];
    if (typeof value === "string" && OPERATOR_PATTERN.test(value)) {
      return next(
        new Error(
          `[Employee Schema Guard] Operator pattern detected in field "${field}". ` +
            "This document will not be persisted. Possible injection bypass attempt.",
        ),
      );
    }
  }

  next();
});

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
