import Employee from "../models/Employee.js";

export const create = (data) => Employee.create(data);

export const findByUserId = (userId, select = "") =>
  Employee.findOne({ userId }).select(select);

export const findById = (id, select = "") =>
  Employee.findById(id).select(select);

export const updateByUserId = (userId, update) =>
  Employee.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, runValidators: true },
  );

export const updateById = (id, update) =>
  Employee.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  );

export const deactivateByUserId = (userId) =>
  updateByUserId(userId, { isActive: false });

export const activateByUserId = (userId) =>
  updateByUserId(userId, { isActive: true });

export const list = async ({ page, limit, department, active = true }) => {
  const filter = {
    ...(department && { department }),
    ...(active !== undefined && { isActive: active }),
  };
  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .select(
        "name email department jobTitle employmentType joinedAt isActive userId",
      )
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);
  return { employees, total };
};

export const activeForPayroll = () =>
  Employee.find({ isActive: true, baseSalaryEncrypted: { $ne: null } }).select(
    "+baseSalaryEncrypted name email",
  );
