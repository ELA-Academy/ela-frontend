import React, { useMemo, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import Select from "react-select";
import { toast } from "react-toastify";

const DEFAULT_FORM = {
  name: "",
  description: "",
  is_private: false,
  access_members: [],
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
  const [formState, setFormState] = useState(initialValues);

  React.useEffect(() => {
    if (show) {
      setFormState(initialValues);
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
              <div className="zbot-space-avatar-preview">
                {spaceInitial}
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
