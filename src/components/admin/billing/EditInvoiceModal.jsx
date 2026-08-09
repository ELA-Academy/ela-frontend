import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  Spinner,
  Card
} from "react-bootstrap";
import { PlusCircleFill, Trash } from "react-bootstrap-icons";
import { v4 as uuidv4 } from "uuid";
import {
  editInvoice,
  getPresetItems,
} from "../../../services/billingService";
import { getSubsidies } from "../../../services/subsidyService";
import { showSuccess, showError } from "../../../utils/notificationService";
import ProcareDatePicker from "./ProcareDatePicker";

const EditInvoiceModal = ({
  show,
  handleClose,
  studentId,
  studentName,
  invoice,
  onInvoiceEdited,
}) => {
  const [items, setItems] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data for dropdowns
  const [presetItems, setPresetItems] = useState([]);
  const [subsidies, setSubsidies] = useState([]);

  useEffect(() => {
    if (show && invoice) {
      // Parse due date
      if (invoice.due_date) {
        setDueDate(new Date(invoice.due_date));
      } else {
        setDueDate(null);
      }

      const fetchData = async () => {
        try {
          setLoading(true);
          const [presetsData, subsidiesData] = await Promise.all([
            getPresetItems(),
            getSubsidies(),
          ]);
          setPresetItems(presetsData);
          setSubsidies(subsidiesData);

          // Map items from invoice details
          if (invoice.items) {
            const mappedItems = invoice.items.map((item) => {
              let type = "New Item";
              let desc = item.description;

              if (desc.startsWith("Subsidy: ")) {
                type = "Subsidy";
                desc = desc.substring(9); // Strip prefix
              } else if (presetsData.some((p) => p.description === desc)) {
                type = "Preset Item";
              } else if (item.amount < 0) {
                type = "Discount";
              }

              // Try to resolve subsidy_id if Subsidy type
              let subsidy_id = null;
              if (type === "Subsidy") {
                const subObj = subsidiesData.find((s) => s.name === desc);
                if (subObj) subsidy_id = subObj.id;
              }

              return {
                id: item.id || uuidv4(),
                type,
                description: desc,
                amount: Math.abs(item.amount),
                subsidy_id
              };
            });
            setItems(mappedItems);
          } else {
            setItems([{ id: uuidv4(), type: "New Item", description: "", amount: "" }]);
          }
        } catch (err) {
          showError("Failed to load invoice items.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [show, invoice]);

  const handleItemChange = (id, field, value) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        if (field === "description" && item.type === "Preset Item") {
          const preset = presetItems.find((p) => p.description === value);
          if (preset) updatedItem.amount = preset.amount;
        }

        if (field === "description" && item.type === "Subsidy") {
          const subsidy = subsidies.find((s) => s.name === value);
          if (subsidy) updatedItem.subsidy_id = subsidy.id;
        }

        if (
          field === "amount" &&
          (item.type === "Discount" || item.type === "Subsidy")
        ) {
          updatedItem.amount = -Math.abs(parseFloat(value) || 0);
        } else if (field === "amount") {
          updatedItem.amount = Math.abs(parseFloat(value) || 0);
        }

        if (field === "type") {
          updatedItem.description = "";
          updatedItem.amount = "";
          delete updatedItem.subsidy_id;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: uuidv4(), type: "New Item", description: "", amount: "" },
    ]);
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dueDate) {
      showError("Please specify a due date.");
      return;
    }

    const invalidItem = items.find((item) => !item.description || !item.amount);
    if (invalidItem) {
      showError("Please fill out all invoice item details and amounts.");
      return;
    }

    setIsSaving(true);
    try {
      // Format date to YYYY-MM-DD
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, "0");
      const day = String(dueDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const payload = {
        due_date: formattedDate,
        items: items.map((item) => ({
          description:
            item.type === "Subsidy"
              ? `Subsidy: ${item.description}`
              : item.description,
          amount: parseFloat(item.amount) || 0,
          subsidy_id: item.subsidy_id || null,
        })),
      };

      await editInvoice(invoice.id, payload);
      showSuccess("Invoice modified successfully!");
      onInvoiceEdited();
      handleClose();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to update invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  const initialLetter = studentName?.charAt(0) || "S";

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="modern-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "16px" }}>
          Edit Invoice Details
        </Modal.Title>
      </Modal.Header>
      
      {loading ? (
        <Modal.Body className="text-center p-5">
          <Spinner />
        </Modal.Body>
      ) : (
        <Form onSubmit={handleSubmit} style={{ fontFamily: "Prompt" }}>
          <Modal.Body>
            {/* Student Header */}
            <div className="d-flex align-items-center gap-2 mb-4">
              <div
                className="d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                {initialLetter}
              </div>
              <div className="fw-bold text-uppercase" style={{ fontSize: "13px", color: "#0ea5e9" }}>
                {studentName}
              </div>
            </div>

            {/* Date Filters Row */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-uppercase fw-bold text-slate-500" style={{ fontSize: "10px", display: "block" }}>
                    INVOICE DUE DATE
                  </Form.Label>
                  <ProcareDatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Invoice Details Card */}
            <Card className="border p-3 mb-4 rounded shadow-sm">
              <div className="fw-bold mb-3 text-slate-800" style={{ fontSize: "12px" }}>
                Invoice Details
              </div>
              
              {/* Table Header labels */}
              <Row className="mb-2 text-uppercase text-slate-400 fw-bold" style={{ fontSize: "9px" }}>
                <Col md={3}>Type</Col>
                <Col md={6}>Item Description</Col>
                <Col md={2}>Amount</Col>
                <Col md={1}></Col>
              </Row>

              {items.map((item) => (
                <Row key={item.id} className="mb-2 align-items-center">
                  <Col md={3}>
                    <Form.Select
                      value={item.type}
                      onChange={(e) =>
                        handleItemChange(item.id, "type", e.target.value)
                      }
                      style={{ fontSize: "12px", padding: "6px" }}
                    >
                      <option>New Item</option>
                      <option>Preset Item</option>
                      <option>Discount</option>
                      <option>Subsidy</option>
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    {item.type === "New Item" && (
                      <Form.Control
                        type="text"
                        placeholder="Add Invoice Description"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        required
                        style={{ fontSize: "12px", padding: "6px" }}
                      />
                    )}
                    {item.type === "Preset Item" && (
                      <Form.Select
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        required
                        style={{ fontSize: "12px", padding: "6px" }}
                      >
                        <option value="">Select preset...</option>
                        {presetItems.map((p) => (
                          <option key={p.id} value={p.description}>
                            {p.description}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    {item.type === "Discount" && (
                      <Form.Control
                        type="text"
                        placeholder="Add Discount Reason"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        required
                        style={{ fontSize: "12px", padding: "6px" }}
                      />
                    )}
                    {item.type === "Subsidy" && (
                      <Form.Select
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        required
                        style={{ fontSize: "12px", padding: "6px" }}
                      >
                        <option value="">Select subsidy...</option>
                        {subsidies.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </Col>
                  <Col md={2}>
                    <InputGroup size="sm">
                      <InputGroup.Text style={{ fontSize: "11px" }}>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.amount}
                        onChange={(e) =>
                          handleItemChange(item.id, "amount", e.target.value)
                        }
                        required
                        disabled={item.type === "Preset Item"}
                        style={{ fontSize: "11px" }}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={1} className="text-center">
                    {items.length > 1 && (
                      <Button
                        variant="link"
                        className="text-danger p-0 border-0"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}

              <div className="mt-3 d-flex justify-content-between align-items-center">
                <Button
                  variant="link"
                  onClick={addItem}
                  className="text-decoration-none p-0 fw-bold d-flex align-items-center gap-1"
                  style={{ color: "#00b8d4", fontSize: "11px", border: "none" }}
                >
                  <PlusCircleFill size={14} /> ADD INVOICE ITEM
                </Button>
                
                <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>
                  Total:{" "}
                  {totalAmount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </div>
              </div>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} style={{ fontSize: "12px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              style={{
                backgroundColor: "#00b8d4",
                borderColor: "#00b8d4",
                borderRadius: "50px",
                fontSize: "12px",
                padding: "8px 24px",
                fontWeight: "600",
                color: "#ffffff"
              }}
            >
              {isSaving ? "Saving..." : "SAVE CHANGES"}
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
};

export default EditInvoiceModal;
