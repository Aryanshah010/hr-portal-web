import mongoose from "mongoose";

const noOperatorChars = (value) => {
  if (typeof value !== "string") return false;
  return !/[.$]/.test(value);
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email address is required."],
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
            "Email address contains forbidden operator characters. Potential injection attempt.",
        },
      ],
    },

    password: {
      type: String,
      required: [
        function () {
          return this.oauthProvider === "local";
        },
        "Password hash is required for local authentication.",
      ],
      minlength: [60, "Password hash is malformed — expected bcrypt output."],
      select: false,
    },

    oauthProvider: {
      type: String,
      enum: {
        values: ["local", "google"],
        message: "OAuth provider '{VALUE}' is not supported.",
      },
      default: "local",
      required: true,
    },

    oauthId: {
      type: String,
      default: null,
      select: false,
    },

    passwordHistory: {
      type: [String],
      default: [],
      select: false,
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Password history must not exceed 5 entries.",
      },
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      enum: {
        values: ["Employee", "Manager", "Admin"],
        message:
          "Role '{VALUE}' is not a recognized system role. Authorization bypass attempt detected.",
      },
      default: "Employee",
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: [0, "Failed login count cannot be negative."],
      max: [10, "Maximum failed attempt threshold exceeded."],
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    mfaSecret: {
      type: String,
      default: null,
      select: false,
    },

    mfaEnabled: {
      type: Boolean,
      default: false,
    },

    totpVerified: {
      type: Boolean,
      default: false,
    },

    tokenInvalidatedAt: {
      type: Date,
      default: null,
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

userSchema.index({ email: 1 });
userSchema.index({ lockedUntil: 1 }, { sparse: true });
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.oauthProvider !== "local") return next();
  if (this.password.length < 60) {
    return next(
      new Error(
        "[Schema Guard] Raw plaintext password detected at ORM layer. " +
          "Password must be hashed by the service layer before schema write.",
      ),
    );
  }

  next();
});

userSchema.pre("save", function (next) {
  if (this.isModified("password") && !this.isNew) {
    this.tokenInvalidatedAt = new Date();
  }
  next();
});

userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

userSchema.methods.isPasswordExpired = function () {
  if (!this.passwordChangedAt) return false;
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  return Date.now() - this.passwordChangedAt.getTime() > ninetyDays;
};

const User = mongoose.model("User", userSchema);
export default User;
