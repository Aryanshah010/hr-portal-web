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

export const suspend = (id) =>
  updateById(id, {
    accountStatus: ACCOUNT_STATUS.SUSPENDED,
    securityVersion: 1,
  });

export const changeRole = (id, role) =>
  updateById(id, { role, securityVersion: 1 });

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
