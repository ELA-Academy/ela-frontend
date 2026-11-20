import React, { useState, useEffect } from "react";
import { Target, Star, Plus, CheckCircle2 } from "lucide-react";
import { Modal, Button, Form } from "react-bootstrap";
import {
  getAdminPerformance,
  createPerformanceGoal,
  createPerformanceReview
} from "../../../services/payrollService";
import { getAllStaff } from "../../../services/staffService";
import "../../../styles/GustoTheme.css";

const PayrollPerformancePage = () => {
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const [goalModal, setGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ staff_id: "", title: "", description: "", due_date: "" });

  const [reviewModal, setReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    staff_id: "",
    review_type: "self",
    title: "Q4 2026 Performance Appraisal",
    period: "Q4 2026"
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [perfRes, staffRes] = await Promise.all([getAdminPerformance(), getAllStaff()]);
      setGoals(perfRes.goals || []);
      setReviews(perfRes.reviews || []);
      const list = Array.isArray(staffRes) ? staffRes : staffRes.staff || [];
      setStaffList(list);
      if (list.length > 0 && !newGoal.staff_id) {
        setNewGoal((p) => ({ ...p, staff_id: list[0].id }));
        setNewReview((p) => ({ ...p, staff_id: list[0].id }));
      }
    } catch (err) {
      console.error("Failed to load performance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await createPerformanceGoal(newGoal);
      setGoalModal(false);
      setNewGoal({ staff_id: staffList[0]?.id || "", title: "", description: "", due_date: "" });
      showToast("Goal assigned to staff member.");
      loadData();
    } catch (err) {
      showToast("Failed to create goal.");
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      await createPerformanceReview(newReview);
      setReviewModal(false);
      showToast("Performance appraisal sent.");
      loadData();
    } catch (err) {
      showToast("Failed to send appraisal.");
    }
  };

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>Performance</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
            Set supervisor goals and send self-appraisal or supervisor performance reviews.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="outline-primary" onClick={() => setGoalModal(true)}>
            <Plus className="w-4 h-4 me-1 inline" /> Assign Goal
          </Button>
          <Button style={{ backgroundColor: "#2563eb", border: "none" }} onClick={() => setReviewModal(true)}>
            <Plus className="w-4 h-4 me-1 inline" /> Send Appraisal
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Goals */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Target className="w-5 h-5 text-teal-700" /> Supervisor Goals ({goals.length})
          </h2>
          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading...</p>
          ) : goals.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>No goals assigned yet.</p>
          ) : (
            goals.map((g) => (
              <div key={g.id} style={{ padding: "0.85rem", border: "1px solid #f3f4f6", borderRadius: "8px", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.92rem" }}>
                  <span>{g.title}</span>
                  <span style={{ color: "#2563eb", fontSize: "0.8rem" }}>{g.status}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.2rem" }}>
                  Assigned to <strong>{g.staff_name}</strong> {g.due_date ? `• Due ${g.due_date}` : ""}
                </div>
                {g.description && <div style={{ fontSize: "0.85rem", color: "#374151", marginTop: "0.35rem" }}>{g.description}</div>}
              </div>
            ))
          )}
        </div>

        {/* Appraisals */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Star className="w-5 h-5 text-amber-500" /> Performance Appraisals ({reviews.length})
          </h2>
          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading...</p>
          ) : reviews.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>No appraisals sent yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} style={{ padding: "0.85rem", border: "1px solid #f3f4f6", borderRadius: "8px", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.92rem" }}>
                  <span>{r.title}</span>
                  <span
                    style={{
                      backgroundColor: r.status === "Completed" ? "#dcfce7" : "#fef3c7",
                      color: r.status === "Completed" ? "#166534" : "#92400e",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem"
                    }}
                  >
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.2rem" }}>
                  {r.staff_name} • {r.review_type === "self" ? "Self-Appraisal" : "Supervisor Appraisal"} • {r.period}
                </div>
                {r.rating && <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2563eb", marginTop: "0.3rem" }}>Rating: {r.rating}/5</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign Goal Modal */}
      <Modal show={goalModal} onHide={() => setGoalModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Assign Performance Goal</Modal.Title></Modal.Header>
        <Form onSubmit={handleCreateGoal}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Team member</Form.Label>
              <Form.Select value={newGoal.staff_id} onChange={(e) => setNewGoal({ ...newGoal, staff_id: e.target.value })}>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Goal title</Form.Label>
              <Form.Control required value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Complete 7th Grade Math Curriculum" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due date</Form.Label>
              <Form.Control type="date" value={newGoal.due_date} onChange={(e) => setNewGoal({ ...newGoal, due_date: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setGoalModal(false)}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: "#2563eb", border: "none" }}>Assign Goal</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Send Appraisal Modal */}
      <Modal show={reviewModal} onHide={() => setReviewModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Send Performance Appraisal</Modal.Title></Modal.Header>
        <Form onSubmit={handleCreateReview}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Team member</Form.Label>
              <Form.Select value={newReview.staff_id} onChange={(e) => setNewReview({ ...newReview, staff_id: e.target.value })}>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Appraisal type</Form.Label>
              <Form.Select value={newReview.review_type} onChange={(e) => setNewReview({ ...newReview, review_type: e.target.value })}>
                <option value="self">Self-Appraisal (Staff rates &amp; reflects)</option>
                <option value="supervisor">Supervisor Appraisal</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control required value={newReview.title} onChange={(e) => setNewReview({ ...newReview, title: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Review period</Form.Label>
              <Form.Control value={newReview.period} onChange={(e) => setNewReview({ ...newReview, period: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setReviewModal(false)}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: "#2563eb", border: "none" }}>Send Appraisal</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollPerformancePage;
