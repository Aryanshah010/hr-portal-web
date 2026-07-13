export const roundNpr = (value) => Math.round(value);

export const calculateSalary = ({ baseSalary, taxRate, deductionRate }) => {
  if (!Number.isFinite(baseSalary) || baseSalary < 0)
    throw new Error("Base salary must be a non-negative number.");
  if (
    ![taxRate, deductionRate].every(
      (rate) => Number.isFinite(rate) && rate >= 0 && rate <= 1,
    )
  ) {
    throw new Error("Payroll rates must be between 0 and 1.");
  }
  const grossNPR = roundNpr(baseSalary);
  const taxNPR = roundNpr(grossNPR * taxRate);
  const deductionsNPR = roundNpr(grossNPR * deductionRate);
  return {
    grossNPR,
    taxNPR,
    deductionsNPR,
    netNPR: grossNPR - taxNPR - deductionsNPR,
  };
};

export const buildPayslipPayload = ({ period, employee, breakdown }) => ({
  period,
  employeeId: employee._id.toString(),
  employeeName: employee.name,
  generatedAt: new Date().toISOString(),
  currency: "NPR",
  ...breakdown,
});
