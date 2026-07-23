import User, { ACCOUNT_STATUS, ROLES } from "../models/User.js";

export const findByEmail = (email, select = "") =>
  User.findOne({ email }).select(select);

export const findByPhoneLookupHash = (phoneLookupHash, select = "") =>
  User.findOne({ phoneLookupHash }).select(select);

export const findById = (id, select = "") => User.findById(id).select(select);

export const createGoogleUser = (data) => User.create(data);

export const updateById = (id, update, options = {}) =>
  User.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true, ...options },
  );

export const completeRegistration = (id, data) =>
  updateById(id, { ...data, accountStatus: ACCOUNT_STATUS.PENDING });

export const activate = (id) =>
  updateById(id, { accountStatus: ACCOUNT_STATUS.ACTIVE });

const revokeIssuedTokens = (id, update) =>
  User.findByIdAndUpdate(
    id,
    { $set: update, $inc: { securityVersion: 1 } },
    { new: true, runValidators: true },
  );

export const suspend = (id) =>
  revokeIssuedTokens(id, { accountStatus: ACCOUNT_STATUS.SUSPENDED });

export const changeRole = (id, role) => revokeIssuedTokens(id, { role });

export const replacePassword = (
  id,
  { passwordHash, passwordChangedAt, passwordHistory },
) =>
  revokeIssuedTokens(id, {
    passwordHash,
    passwordChangedAt,
    passwordHistory,
    failedLoginAttempts: 0,
    lockoutUntil: null,
  });

export const countActiveHr = () =>
  User.countDocuments({ role: ROLES.HR, accountStatus: ACCOUNT_STATUS.ACTIVE });

export const listPending = ({ page, limit }) =>
  User.find({ accountStatus: ACCOUNT_STATUS.PENDING, role: ROLES.EMPLOYEE })
    .select("email name jobTitle department phoneVerified createdAt")
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

export const countPending = () =>
  User.countDocuments({
    accountStatus: ACCOUNT_STATUS.PENDING,
    role: ROLES.EMPLOYEE,
  });

export const listHr = () =>
  User.find({ role: ROLES.HR, accountStatus: ACCOUNT_STATUS.ACTIVE })
    .select("email name jobTitle department createdAt")
    .sort({ name: 1 })
    .lean();

export const findFirstHr = () =>
  User.findOne({ role: ROLES.HR, accountStatus: ACCOUNT_STATUS.ACTIVE })
    .select("email name")
    .sort({ createdAt: 1 })
    .lean();
