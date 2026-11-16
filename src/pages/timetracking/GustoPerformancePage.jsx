import React, { useState, useEffect } from "react";
import { Target, Star, CheckCircle2 } from "lucide-react";
import { Modal, Button, Form } from "react-bootstrap";
import { getMyPerformance, submitMyReview } from "../../services/payrollService";
import "../../styles/GustoTheme.css";

const GustoPerformancePage = () => {
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState(null);
  const [responses, setResponses] = useState({});
  const [rating, setRating] = useState(5);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadPerf = async () => {
    setLoading(true);
    try {
      const res = await getMyPerformance();
      setGoals(res.goals || []);
      setReviews(res.reviews || []);
    } catch (err) {
      console.error("Failed to load performance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerf();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeReview) return;
    try {
      await submitMyReview(activeReview.id, { responses, rating });
      setActiveReview(null);
      showToast("Self-appraisal submitted.");
      loadPerf();
    } catch (err) {
      showToast("Failed to submit appraisal.");
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "4rem" }}>
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#1e3a8a",
            color: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            zIndex: 9999,
            fontSize: "0.875rem",
            fontWeight: 600
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>
        Performance
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Track goals set by your supervisor and complete self-appraisals.
      </p>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading performance...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "1rem" }}>
              <Target className="w-5 h-5 text-teal-700" /> My Goals ({goals.length})
            </h2>
            {goals.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No goals assigned by your supervisor yet.</p>
            ) : (
              goals.map((g) => (
                <div key={g.id} style={{ padding: "0.85rem", border: "1px solid #f3f4f6", borderRadius: "8px", marginBottom: "0.75rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{g.title}</div>
                  {g.due_date && <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Due: {g.due_date}</div>}
                  {g.description && <div style={{ fontSize: "0.84rem", color: "#374151", marginTop: "0.3rem" }}>{g.description}</div>}
                </div>
              ))
            )}
          </div>

          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "1rem" }}>
              <Star className="w-5 h-5 text-amber-500" /> Appraisals ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No appraisals assigned yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} style={{ padding: "0.85rem", border: "1px solid #f3f4f6", borderRadius: "8px", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{r.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{r.period} • {r.status}</div>
                  </div>
                  {r.status !== "Completed" && (
                    <Button
                      size="sm"
                      style={{ backgroundColor: "#0f766e", border: "none" }}
                      onClick={() => {
                        setActiveReview(r);
                        setResponses(r.responses || {});
                        setRating(r.rating || 5);
                      }}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Modal show={!!activeReview} onHide={() => setActiveReview(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>{activeReview?.title}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitReview}>
          <Modal.Body>
            {(activeReview?.questions || []).map((q, idx) => (
              <Form.Group key={idx} className="mb-3">
                <Form.Label className="small fw-semibold">{q}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  required
                  value={responses[idx] || ""}
                  onChange={(e) => setResponses({ ...responses, [idx]: e.target.value })}
                />
              </Form.Group>
            ))}
            <Form.Group>
              <Form.Label className="small fw-semibold">Self Rating (1–5)</Form.Label>
              <Form.Select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                <option value={5}>5 — Exceeds Expectations</option>
                <option value={4}>4 — Strong Performance</option>
                <option value={3}>3 — Meets Expectations</option>
                <option value={2}>2 — Needs Improvement</option>
                <option value={1}>1 — Unsatisfactory</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setActiveReview(null)}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: "#0f766e", border: "none" }}>Submit Appraisal</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default GustoPerformancePage;
