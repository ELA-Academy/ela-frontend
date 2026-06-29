import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Spinner, Badge, Card, ProgressBar } from "react-bootstrap";
import { Plus, Trash2, Calendar, Target, CheckCircle2, Circle } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const MilestonesView = ({ boardId }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/boards/${boardId}/milestones`);
      setMilestones(res.data);
    } catch (err) {
      showError("Failed to fetch milestones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardId) {
      fetchMilestones();
    }
  }, [boardId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.due_date) return;

    setSubmitting(true);
    try {
      await api.post(`/boards/${boardId}/milestones`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        due_date: formData.due_date,
        status: "Uncompleted"
      });
      showSuccess("Milestone created successfully!");
      setShowAddModal(false);
      setFormData({ title: "", description: "", due_date: "" });
      fetchMilestones();
    } catch (err) {
      showError("Failed to create milestone.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (milestone) => {
    const nextStatus = milestone.status === "Completed" ? "Uncompleted" : "Completed";
    try {
      await api.put(`/boards/milestones/${milestone.id}`, {
        status: nextStatus
      });
      showSuccess(`Milestone marked as ${nextStatus.toLowerCase()}!`);
      fetchMilestones();
    } catch (err) {
      showError("Failed to update milestone.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    try {
      await api.delete(`/boards/milestones/${id}`);
      showSuccess("Milestone deleted.");
      fetchMilestones();
    } catch (err) {
      showError("Failed to delete milestone.");
    }
  };

  // Calculations
  const completedCount = milestones.filter(m => m.status === "Completed").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="p-3 bg-white rounded shadow-sm border mt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-slate-800 mb-1">Project Milestones</h4>
          <p className="text-muted small mb-0">Track key checkpoints, deliverables, and deadline targets for this project.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} className="d-flex align-items-center gap-1">
          <Plus size={16} /> Add Milestone
        </Button>
      </div>

      {milestones.length > 0 && (
        <Card className="mb-4 bg-light border-0">
          <Card.Body className="p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-semibold text-slate-700">Project Progress by Milestones</span>
              <span className="small fw-bold text-slate-800">{completedCount} of {milestones.length} completed ({progressPercent}%)</span>
            </div>
            <ProgressBar now={progressPercent} variant="success" style={{ height: "8px", borderRadius: "4px" }} />
          </Card.Body>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-5 text-muted bg-light rounded-3">
          <Target size={48} className="text-slate-300 mb-3" />
          <h5>No milestones set yet</h5>
          <p className="small mb-0">Set important milestone dates to keep your project on schedule.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>Status</th>
                <th>Milestone Details</th>
                <th>Due Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} className={m.status === "Completed" ? "table-light opacity-75" : ""}>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(m)}
                      className="border-0 bg-transparent p-0 text-slate-500 hover-purple"
                      style={{ cursor: "pointer" }}
                    >
                      {m.status === "Completed" ? (
                        <CheckCircle2 size={20} className="text-success" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>
                  </td>
                  <td>
                    <div>
                      <span className={`fw-bold d-block ${m.status === "Completed" ? "text-decoration-line-through text-muted" : "text-slate-800"}`}>
                        {m.title}
                      </span>
                      {m.description && (
                        <span className="text-muted small d-block" style={{ fontSize: "11px" }}>
                          {m.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1.5 text-muted small">
                      <Calendar size={13} />
                      <span>{new Date(m.due_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="text-end">
                    <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(m.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Create Milestone</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Milestone Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Design Signoff, Phase 1 Release"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="What does this milestone achieve?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Target Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : "Add Milestone"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default MilestonesView;
