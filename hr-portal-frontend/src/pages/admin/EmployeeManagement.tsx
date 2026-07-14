// ─────────────────────────────────────────────────────────────────────────────
// pages/admin/EmployeeManagement.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  listEmployees,
  updateEmployeeSalary,
  changeEmployeeRole,
  approveEmployee,
  listPendingEmployees,
} from "@/services/employeeService.js";
import type { Employee, User } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { Modal } from "@/components/ui/Modal.js";
import { FormInput } from "@/components/ui/FormInput.js";
import { Users, Shield, DollarSign, CheckCircle, User2 } from "lucide-react";

const salarySchema = z.object({
  baseSalary: z.coerce
    .number()
    .positive()
    .max(10000000, "Maximum limit reached"),
});

export function EmployeeManagement() {
  const { error, success } = useToast();

  // Lists
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pending, setPending] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [salaryModal, setSalaryModal] = useState<{
    isOpen: boolean;
    employeeId: string | null;
    name: string;
  }>({ isOpen: false, employeeId: null, name: "" });
  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    employeeId: string | null;
    name: string;
    currentRole: string;
  }>({ isOpen: false, employeeId: null, name: "", currentRole: "Employee" });

  // Salary Form
  const {
    register: regSalary,
    handleSubmit: handleSalary,
    reset: resetSalary,
    formState: { errors: errSalary, isSubmitting: isSubmittingSalary },
  } = useForm({
    resolver: zodResolver(salarySchema),
  });

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const [empRes, pendRes] = await Promise.all([
        listEmployees({ page: p, limit: 15 }),
        listPendingEmployees(),
      ]);
      setEmployees(empRes.data.items);
      setTotalPages(empRes.data.pages);
      setPage(empRes.data.page);
      setPending(pendRes.data.items);
    } catch (err: any) {
      error(err.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onApprove = async (id: string) => {
    try {
      await approveEmployee(id);
      success("Employee approved successfully");
      fetchData(page);
    } catch (err: any) {
      error(err.message || "Failed to approve");
    }
  };

  const onUpdateSalary = async (data: any) => {
    if (!salaryModal.employeeId) return;
    try {
      // The API validator strictly allows { baseSalary: number }
      // This is mass-assignment safe because we only send this whitelisted field.
      await updateEmployeeSalary(salaryModal.employeeId, {
        baseSalary: data.baseSalary,
      } as any);
      success("Salary updated successfully");
      setSalaryModal({ isOpen: false, employeeId: null, name: "" });
      resetSalary();
      fetchData(page);
    } catch (err: any) {
      error(err.message || "Failed to update salary");
    }
  };

  const onUpdateRole = async (newRole: "Employee" | "HR") => {
    if (!roleModal.employeeId) return;
    try {
      // The API validator strictly allows { role: "Employee" | "HR" }
      await changeEmployeeRole(roleModal.employeeId, { role: newRole });
      success(`Role updated to ${newRole}`);
      setRoleModal({
        isOpen: false,
        employeeId: null,
        name: "",
        currentRole: "Employee",
      });
      fetchData(page);
    } catch (err: any) {
      error(err.message || "Failed to update role");
    }
  };

  const activeColumns = [
    {
      header: "Name",
      cell: (e: Employee) => (
        <strong style={{ color: "white" }}>{e.name}</strong>
      ),
    },
    { header: "Email", accessorKey: "email" as keyof Employee },
    { header: "Department", accessorKey: "department" as keyof Employee },
    { header: "Job Title", accessorKey: "jobTitle" as keyof Employee },
    { header: "Type", accessorKey: "employmentType" as keyof Employee },
    {
      header: "Actions",
      cell: (e: Employee) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() =>
              setSalaryModal({ isOpen: true, employeeId: e._id, name: e.name })
            }
            style={{
              padding: "0.4rem 0.75rem",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#10b981",
              borderRadius: "0.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.8rem",
            }}
          >
            <DollarSign size={14} /> Salary
          </button>
          {/* Note: In a real system, the user's role is on the User model, not Employee model, so HR must search or we show a generic update role button */}
          <button
            onClick={() =>
              setRoleModal({
                isOpen: true,
                employeeId: e.userId,
                name: e.name,
                currentRole: "Employee",
              })
            }
            style={{
              padding: "0.4rem 0.75rem",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#6366f1",
              borderRadius: "0.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.8rem",
            }}
          >
            <Shield size={14} /> Role
          </button>
        </div>
      ),
    },
  ];

  const pendingColumns = [
    { header: "Email", accessorKey: "email" as keyof User },
    {
      header: "Registered",
      cell: (u: User) => new Date(u.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      cell: (u: User) => (
        <button
          onClick={() => onApprove(u._id)}
          style={{
            padding: "0.4rem 0.75rem",
            background: "var(--color-primary, #6366f1)",
            border: "none",
            color: "white",
            borderRadius: "0.5rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.8rem",
          }}
        >
          <CheckCircle size={14} /> Approve
        </button>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "72rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <div>
        <h1
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1.75rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Users size={28} color="var(--color-primary, #6366f1)" /> Employee
          Management
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--color-text-muted, #94a3b8)",
            fontSize: "0.95rem",
          }}
        >
          Manage employee records, salaries, and access roles.
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-warning, #f59e0b)",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Pending Approvals ({pending.length})
          </h2>
          <DataTable
            data={pending}
            columns={pendingColumns}
            keyExtractor={(u) => u._id}
          />
        </div>
      )}

      <div>
        <h2
          style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          Active Employees
        </h2>
        <DataTable
          data={employees}
          columns={activeColumns}
          keyExtractor={(e) => e._id}
          page={page}
          totalPages={totalPages}
          onPageChange={fetchData}
        />
      </div>

      {/* Salary Modal */}
      <Modal
        isOpen={salaryModal.isOpen}
        onClose={() => {
          setSalaryModal({ ...salaryModal, isOpen: false });
          resetSalary();
        }}
        title={`Update Salary: ${salaryModal.name}`}
      >
        <form
          onSubmit={handleSalary(onUpdateSalary)}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <FormInput
            label="New Base Salary (NPR)"
            type="number"
            {...regSalary("baseSalary")}
            error={errSalary.baseSalary?.message as string}
            icon={<DollarSign size={16} />}
          />
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: "var(--color-text-muted, #94a3b8)",
            }}
          >
            Note: This immediately applies to the next payroll run. Ensure HR
            policies are followed.
          </p>
          <button
            type="submit"
            disabled={isSubmittingSalary}
            style={{
              padding: "0.75rem",
              background: "var(--color-primary, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              fontWeight: 600,
              cursor: isSubmittingSalary ? "not-allowed" : "pointer",
            }}
          >
            {isSubmittingSalary ? "Saving..." : "Update Salary"}
          </button>
        </form>
      </Modal>

      {/* Role Modal */}
      <Modal
        isOpen={roleModal.isOpen}
        onClose={() => setRoleModal({ ...roleModal, isOpen: false })}
        title={`Change Role: ${roleModal.name}`}
      >
        <p
          style={{
            margin: "0 0 1.5rem",
            color: "var(--color-text-muted, #94a3b8)",
            fontSize: "0.9rem",
          }}
        >
          Assigning HR privileges grants broad access to salary, audit, and
          employee data.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <button
            onClick={() => onUpdateRole("Employee")}
            style={{
              padding: "1rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              color: "white",
              cursor: "pointer",
            }}
          >
            <User2
              size={24}
              style={{ marginBottom: "0.5rem", color: "#a78bfa" }}
            />
            <div style={{ fontWeight: 600 }}>Standard Employee</div>
          </button>
          <button
            onClick={() => onUpdateRole("HR")}
            style={{
              padding: "1rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Shield
              size={24}
              style={{
                marginBottom: "0.5rem",
                color: "var(--color-primary, #6366f1)",
              }}
            />
            <div style={{ fontWeight: 600 }}>HR Admin</div>
          </button>
        </div>
      </Modal>
    </div>
  );
}
export default EmployeeManagement;
