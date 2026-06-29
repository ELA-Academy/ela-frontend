import React, { useMemo, useState } from "react";
import { Button, Form, Modal, Spinner, Row, Col } from "react-bootstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import { getBoardTemplates } from "../../../services/boardService";

const DEFAULT_FORM = {
  name: "",
  description: "",
  is_private: false,
  access_members: [],
  color: "#673de6",
  icon: "📋",
  status: "Not Started",
  priority: "Normal",
  category: "",
  budget_amount: "",
};

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (name) => {
  const colors = [
    "#7c3aed", // violet
    "#2563eb", // blue
    "#db2777", // pink
    "#ea580c", // orange
    "#059669", // emerald
    "#0891b2", // cyan
    "#d97706", // amber
    "#b45309", // brown
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const SpaceSettingsModal = ({
  show,
  onHide,
  onSubmit,
  title,
  submitLabel,
  submitting = false,
  initialValues = DEFAULT_FORM,
  members = [],
}) => {
  const [formState, setFormState] = useState({
    ...DEFAULT_FORM,
    ...initialValues
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  React.useEffect(() => {
    if (show) {
      setFormState({
        ...DEFAULT_FORM,
        ...initialValues
      });
      getBoardTemplates()
        .then(setTemplates)
        .catch(console.error);
    } else {
      setSelectedTemplateId("");
    }
  }, [initialValues, show]);

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        value: `${member.role}_${member.id}`,
        label: `${member.name}${member.email ? ` (${member.email})` : ""}`,
        member,
      })),
    [members]
  );

  const selectedMembers = useMemo(
    () =>
      memberOptions.filter((option) =>
        formState.access_members.some(
          (member) => `${member.role}_${member.id}` === option.value
        )
      ),
    [formState.access_members, memberOptions]
  );

  const spaceInitial = useMemo(() => {
    const trimmed = formState.name.trim();
    return trimmed ? trimmed[0].toUpperCase() : "S";
  }, [formState.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      ...formState,
      access_members: formState.is_private ? formState.access_members : [],
    });
  };

  // Custom component options for React-Select to render avatars
  const customComponents = {
    Option: (props) => {
      const { data, innerRef, innerProps } = props;
      const initials = getInitials(data.member.name);
      const bg = getAvatarBg(data.member.name);
      return (
        <div
          ref={innerRef}
          {...innerProps}
          className="d-flex align-items-center gap-2 px-3 py-2 cursor-pointer"
          style={{
            fontSize: "12px",
            backgroundColor: props.isFocused ? "#f1f5f9" : props.isSelected ? "#e2e8f0" : "transparent",
            color: "#1e293b"
          }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: bg,
              color: "#fff",
              fontSize: "9px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {initials}
          </div>
          <span className="font-semibold">{data.label}</span>
        </div>
      );
    },
    MultiValueLabel: (props) => {
      const { data } = props;
      const initials = getInitials(data.member.name);
      const bg = getAvatarBg(data.member.name);
      return (
        <div className="d-flex align-items-center gap-1 px-1 py-0.5">
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: bg,
              color: "#fff",
              fontSize: "7px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: "11px", color: "#1e293b", fontWeight: "600" }}>{data.member.name}</span>
        </div>
      );
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="zbot-space-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="font-extrabold text-slate-900" style={{ fontSize: "18px" }}>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-2">
          <p className="text-slate-400 mb-4" style={{ fontSize: "11px", lineHeight: "1.4" }}>
            A Space represents teams, departments, or groups, each with its own Lists, workflows, and settings.
          </p>

          <Form.Group className="mb-4">
            <Form.Label className="font-bold text-slate-700" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Icon & name
            </Form.Label>
            <div className="d-flex align-items-center gap-3">
              <div 
                className="zbot-space-avatar-preview d-flex align-items-center justify-content-center fw-bold text-white rounded-3 shadow-sm"
                style={{ 
                  backgroundColor: formState.color || "#673de6", 
                  width: "42px", 
                  height: "42px", 
                  fontSize: "18px",
                  flexShrink: 0
                }}
              >
                {formState.icon || spaceInitial}
              </div>
              <Form.Control
                type="text"
                placeholder="e.g. Marketing, Engineering, HR"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
                style={{
                  fontSize: "13px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  borderColor: "#cbd5e1"
                }}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="font-bold text-slate-700" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Space Theme Color & Icon
            </Form.Label>
            <div className="d-flex flex-column gap-3 border rounded-3 p-3 bg-light/30">
              <div>
                <div className="text-slate-400 small mb-2" style={{ fontSize: "10.5px" }}>SELECT THEME COLOR:</div>
                <div className="d-flex flex-wrap gap-2">
                  {["#7c3aed", "#2563eb", "#db2777", "#ea580c", "#059669", "#0891b2", "#d97706", "#b45309", "#673de6", "#ff3860"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, color: c }))}
                      className="rounded-circle border-0 d-flex align-items-center justify-content-center p-0"
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: c,
                        border: formState.color === c ? "2px solid #0f172a" : "none",
                        boxShadow: formState.color === c ? "0 0 0 2px #fff" : "none",
                        cursor: "pointer"
                      }}
                    >
                      {formState.color === c && <span className="text-white" style={{ fontSize: "10px" }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 small mb-2" style={{ fontSize: "10.5px" }}>SELECT ICON:</div>
                <div className="d-flex flex-wrap gap-2">
                  {["📋", "💼", "🚀", "🎯", "🎓", "🛠️", "📣", "💻", "🎨", "🔬"].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, icon }))}
                      className="btn btn-sm border d-flex align-items-center justify-content-center p-0 bg-white"
                      style={{
                        width: "32px",
                        height: "32px",
                        fontSize: "16px",
                        borderColor: formState.icon === icon ? "#0f172a" : "#e2e8f0",
                        borderWidth: formState.icon === icon ? "2px" : "1px",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Form.Group>

          {templates.length > 0 && !initialValues.id && (
            <Form.Group className="mb-4">
              <Form.Label className="font-bold text-slate-700" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Use a Template (optional)
              </Form.Label>
              <Form.Select
                value={selectedTemplateId}
                onChange={(e) => {
                  const tId = e.target.value;
                  setSelectedTemplateId(tId);
                  if (tId) {
                    const selectedT = templates.find(t => String(t.id) === String(tId));
                    if (selectedT) {
                      setFormState(prev => ({
                        ...prev,
                        name: selectedT.name,
                        description: selectedT.description || "",
                        color: selectedT.color || prev.color,
                        icon: selectedT.icon || prev.icon,
                        status: selectedT.status || prev.status,
                        priority: selectedT.priority || prev.priority,
                        category: selectedT.category || prev.category,
                        budget_amount: selectedT.budget_amount || prev.budget_amount,
                        from_template_id: selectedT.id
                      }));
                    }
                  } else {
                    setFormState(prev => {
                      const copy = { ...prev };
                      delete copy.from_template_id;
                      return copy;
                    });
                  }
                }}
                style={{ fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
              >
                <option value="">-- Do not use a template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted small" style={{ fontSize: "10px" }}>
                Selecting a template will copy its lists, statuses, and custom fields to your new Space.
              </Form.Text>
            </Form.Group>
          )}

          <Form.Group className="mb-4">
            <Form.Label className="font-bold text-slate-700" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Description (optional)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formState.description}
              placeholder="What is this Space for?"
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              style={{
                fontSize: "13px",
                borderRadius: "8px",
                borderColor: "#cbd5e1"
              }}
            />
          </Form.Group>

          <div 
            className="d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border"
            style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
          >
            <div>
              <h5 className="mb-0.5 font-bold text-slate-800" style={{ fontSize: "13px" }}>Make Private</h5>
              <p className="text-slate-500 mb-0" style={{ fontSize: "10.5px" }}>Only you and invited members have access</p>
            </div>
            <Form.Check
              type="switch"
              id="space-private-switch"
              checked={formState.is_private}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, is_private: event.target.checked }))
              }
              style={{ fontSize: "16px", cursor: "pointer" }}
            />
          </div>

          {formState.is_private && (
            <Form.Group className="mb-4">
              <Form.Label className="font-bold text-slate-700" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Share only with:
              </Form.Label>
              <Select
                isMulti
                options={memberOptions}
                value={selectedMembers}
                components={customComponents}
                onChange={(selectedOptions) =>
                  setFormState((prev) => ({
                    ...prev,
                    access_members: (selectedOptions || []).map((option) => ({
                      id: option.member.id,
                      role: option.member.role,
                      name: option.member.name,
                      email: option.member.email || "",
                    })),
                  }))
                }
                placeholder="Search or enter email..."
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    borderColor: "#cbd5e1",
                    fontSize: "13px",
                    padding: "2px"
                  })
                }}
              />
              <small className="text-slate-400 d-block mt-2" style={{ fontSize: "10px", lineHeight: "1.4" }}>
                Superadmins still keep full access. The creator is always kept in the private space.
              </small>
            </Form.Group>
          )}
          {/* Project Metadata Section */}
          <div className="border rounded-3 p-3 mt-4 mb-2 bg-light/30">
            <h6 className="font-bold text-slate-800 mb-3" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Project Settings (Optional)
            </h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "11px" }}>Project Status</Form.Label>
                  <Form.Select
                    value={formState.status || "Not Started"}
                    onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value }))}
                    style={{ fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "11px" }}>Project Priority</Form.Label>
                  <Form.Select
                    value={formState.priority || "Normal"}
                    onChange={(e) => setFormState(prev => ({ ...prev, priority: e.target.value }))}
                    style={{ fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "11px" }}>Project Category</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Development, Operations"
                    value={formState.category || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value }))}
                    style={{ fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "11px" }}>Project Budget ($)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={formState.budget_amount || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, budget_amount: e.target.value }))}
                    style={{ fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between align-items-center border-0 pt-0">
          <Button 
            variant="light" 
            className="zbot-templates-btn" 
            style={{ fontSize: "12px", fontWeight: "700", borderRadius: "8px", color: "#475569", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
            onClick={() => toast.info("Template workflows are automatically integrated on creation.")}
          >
            Use Templates
          </Button>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={onHide} 
              disabled={submitting}
              style={{ fontSize: "12.5px", fontWeight: "700", borderRadius: "8px", padding: "8px 16px" }}
            >
              Cancel
            </Button>
            <Button 
              variant="dark" 
              type="submit" 
              disabled={submitting}
              style={{ fontSize: "12.5px", fontWeight: "700", borderRadius: "8px", padding: "8px 16px", backgroundColor: "#0f172a" }}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SpaceSettingsModal;
