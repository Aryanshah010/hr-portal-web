import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { listReviews, createReview } from "@/services/reviewService.js";
import { listEmployees } from "@/services/employeeService.js";
import type { PerformanceReview, Employee } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { Modal } from "@/components/ui/Modal.js";
import { FormInput } from "@/components/ui/FormInput.js";
import { Star, Plus } from "lucide-react";

const reviewSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(2000),
});

export function ReviewManagement() {
  const { error, success } = useToast();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      employeeId: "",
      period: new Date().toISOString().slice(0, 7),
      rating: 3,
      comment: "",
    },
  });

  const fetchData = async (p = 1) => {
    try {
      const res = await listReviews({ page: p, limit: 15 });
      setReviews(res.data.items);
      setTotalPages(res.data.pages);
      setPage(res.data.page);
    } catch (err: any) {
      error(err.message || "Failed to load reviews");
    }
  };

  useEffect(() => {
    fetchData(1);
    listEmployees({ limit: 100 })
      .then((res) => setEmployees(res.data.items))
      .catch(() => {});
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await createReview(data);
      success("Review submitted successfully");
      setIsModalOpen(false);
      reset();
      fetchData(page);
    } catch (err: any) {
      error(err.message || "Failed to submit review");
    }
  };

  const columns = [
    {
      header: "Employee",
      cell: (r: any) => r.employeeId?.name || r.employeeId,
    },
    { header: "Period", accessorKey: "period" as keyof PerformanceReview },
    {
      header: "Rating",
      cell: (r: PerformanceReview) => (
        <span
          style={{
            display: "flex",
            gap: "0.1rem",
            color: "var(--color-warning, #f59e0b)",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < r.rating ? "currentColor" : "transparent"}
            />
          ))}
        </span>
      ),
    },
    { header: "Created By", cell: (r: any) => r.createdBy?.name || "Unknown" },
    {
      header: "Date",
      cell: (r: PerformanceReview) =>
        new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "90rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
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
            <Star size={28} color="var(--color-primary, #6366f1)" /> Performance
            Reviews
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted, #94a3b8)",
              fontSize: "0.95rem",
            }}
          >
            Manage and submit encrypted performance reviews.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "0.75rem 1.25rem",
            background: "var(--color-primary, #6366f1)",
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={18} /> New Review
        </button>
      </div>

      <DataTable
        data={reviews}
        columns={columns}
        keyExtractor={(r) => r._id}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Submit Performance Review"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              Employee
            </label>
            <select
              {...register("employeeId")}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                borderRadius: "0.75rem",
              }}
            >
              <option value="">Select an employee...</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.email})
                </option>
              ))}
            </select>
            {errors.employeeId && (
              <span
                style={{
                  color: "var(--color-danger, #ef4444)",
                  fontSize: "0.8rem",
                }}
              >
                {errors.employeeId.message as string}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <FormInput
                label="Period (YYYY-MM)"
                {...register("period")}
                error={errors.period?.message as string}
              />
            </div>
            <div style={{ flex: 1 }}>
              <FormInput
                label="Rating (1-5)"
                type="number"
                {...register("rating")}
                error={errors.rating?.message as string}
              />
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              Review Comment (Encrypted securely)
            </label>
            <textarea
              {...register("comment")}
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "rgba(0,0,0,0.2)",
                border: `1px solid ${errors.comment ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
                color: "white",
                borderRadius: "0.75rem",
                resize: "vertical",
              }}
            />
            {errors.comment && (
              <span
                style={{
                  color: "var(--color-danger, #ef4444)",
                  fontSize: "0.8rem",
                }}
              >
                {errors.comment.message as string}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "0.75rem",
              background: "var(--color-primary, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Encrypting & Submitting..." : "Submit Review"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default ReviewManagement;
