// ─────────────────────────────────────────────────────────────────────────────
// pages/employee/Reviews.tsx
// Employee's own performance reviews — read-only view.
// Calls GET /api/reviews/mine — returns { data: { reviews: PerformanceReview[] } }
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getMyReviews } from "@/services/reviewService.js";
import type { PerformanceReview } from "@/types/index.js";
import type { ApiError } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { Star, TrendingUp, Loader2 } from "lucide-react";

// ─── Star Rating Display ──────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "0.2rem", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={18}
          fill={i <= rating ? "var(--color-warning, #f59e0b)" : "transparent"}
          stroke={
            i <= rating
              ? "var(--color-warning, #f59e0b)"
              : "rgba(255,255,255,0.2)"
          }
        />
      ))}
      <span
        style={{
          marginLeft: "0.5rem",
          fontSize: "0.875rem",
          color: "var(--color-text-muted, #94a3b8)",
        }}
      >
        {rating}/5
      </span>
    </div>
  );
}

const ratingLabel = (r: number) =>
  [
    "",
    "Needs Improvement",
    "Below Average",
    "Meets Expectations",
    "Exceeds Expectations",
    "Outstanding",
  ][r] ?? "";

export function Reviews() {
  const { error } = useToast();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyReviews()
      .then((res) => {
        const sorted = [...res.data.reviews].sort((a, b) =>
          b.period.localeCompare(a.period),
        );
        setReviews(sorted);
      })
      .catch((err: ApiError) => error(err.message || "Failed to load reviews."))
      .finally(() => setLoading(false));
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f8fafc)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              background: "rgba(245,158,11,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-warning, #f59e0b)",
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
              Performance Reviews
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              Your historical performance evaluations
            </p>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "4rem",
              color: "var(--color-text-muted, #94a3b8)",
            }}
          >
            <Loader2
              size={28}
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : reviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem",
            }}
          >
            <Star
              size={48}
              style={{ color: "rgba(255,255,255,0.2)", marginBottom: "1rem" }}
            />
            <h2
              style={{
                margin: "0 0 0.5rem",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              No performance reviews yet
            </h2>
            <p
              style={{
                margin: 0,
                color: "var(--color-text-muted, #94a3b8)",
                fontSize: "0.9rem",
              }}
            >
              Your manager will submit reviews here periodically.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(22rem, 1fr))",
              gap: "1.25rem",
            }}
          >
            {reviews.map((review) => (
              <div
                key={review._id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "1rem",
                  backdropFilter: "blur(12px)",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 0.25rem",
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted, #94a3b8)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Period
                    </p>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}>
                      {review.period}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      background:
                        review.rating >= 4
                          ? "rgba(16,185,129,0.15)"
                          : review.rating === 3
                            ? "rgba(245,158,11,0.15)"
                            : "rgba(239,68,68,0.15)",
                      color:
                        review.rating >= 4
                          ? "var(--color-success, #10b981)"
                          : review.rating === 3
                            ? "var(--color-warning, #f59e0b)"
                            : "var(--color-danger, #ef4444)",
                    }}
                  >
                    {ratingLabel(review.rating)}
                  </span>
                </div>
                <StarRating rating={review.rating} />
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted, #94a3b8)",
                  }}
                >
                  Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
export default Reviews;
