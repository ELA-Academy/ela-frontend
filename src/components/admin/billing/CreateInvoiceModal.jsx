import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  Spinner,
  Card,
  Table
} from "react-bootstrap";
import { PlusCircleFill, Trash, ArrowLeft } from "react-bootstrap-icons";
import { v4 as uuidv4 } from "uuid";
import {
  createInvoice,
  getPresetItems,
} from "../../../services/billingService";
import { getSubsidies } from "../../../services/subsidyService";
import { showSuccess, showError } from "../../../utils/notificationService";
import ProcareDatePicker from "./ProcareDatePicker";

const CreateInvoiceModal = ({
  show,
  handleClose,
  studentId,
  studentName,
  onInvoiceCreated,
}) => {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([
    { id: uuidv4(), type: "New Item", description: "", amount: "" },
  ]);
  const [dueDate, setDueDate] = useState(null);
  const [serviceStartDate, setServiceStartDate] = useState(null);
  const [serviceEndDate, setServiceEndDate] = useState(null);
  const [internalNote, setInternalNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data for dropdowns
  const [presetItems, setPresetItems] = useState([]);
  const [subsidies, setSubsidies] = useState([]);

  useEffect(() => {
    if (show) {
      setStep(1);
      setDueDate(null);
      setServiceStartDate(null);
      setServiceEndDate(null);
      setInternalNote("");
      setItems([{ id: uuidv4(), type: "New Item", description: "", amount: "" }]);
      
      const fetchData = async () => {
        try {
          setLoading(true);
          const [presetsData, subsidiesData] = await Promise.all([
            getPresetItems(),
            getSubsidies(),
          ]);
          setPresetItems(presetsData);
          setSubsidies(subsidiesData);
        } catch (err) {
          showError("Failed to load invoice options.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [show]);

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

  const formatDateString = (dateObj) => {
    if (!dateObj) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSaveInvoice = async (status) => {
    if (!dueDate) {
      showError("Please specify a due date.");
      return;
    }
    
    // Check validation of items
    const invalidItem = items.find(item => !item.description || !item.amount);
    if (invalidItem) {
      showError("Please fill out all invoice item details and amounts.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        due_date: formatDateString(dueDate),
        status,
        internal_note: internalNote,
        service_start_date: formatDateString(serviceStartDate),
        service_end_date: formatDateString(serviceEndDate),
        items: items.map((item) => ({
          description:
            item.type === "Subsidy"
              ? `Subsidy: ${item.description}`
              : item.description,
          amount: parseFloat(item.amount) || 0,
          subsidy_id: item.subsidy_id || null,
        })),
      };
      await createInvoice(studentId, payload);
      showSuccess(`Invoice saved as ${status} successfully!`);
      onInvoiceCreated();
      handleClose();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to save invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  const formattedDueDate = dueDate
    ? dueDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const initialLetter = studentName?.charAt(0) || "S";

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="modern-modal">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "16px" }}>
          {step === 2 && (
            <Button
              type="button"
              variant="link"
              onClick={() => setStep(1)}
              className="p-0 me-2 text-dark border-0"
              style={{ verticalAlign: "middle" }}
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          Create Invoice <span style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: "400" }}>STEP {step} / 2</span>
        </Modal.Title>
      </Modal.Header>
      
      {loading ? (
        <Modal.Body className="text-center p-5">
          <Spinner />
        </Modal.Body>
      ) : (
        <>
          {step === 1 ? (
            /* ================= STEP 1 ================= */
            <Modal.Body style={{ fontFamily: "Prompt" }} className="pt-2">
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
                <Col md={5}>
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
                <Col md={7}>
                  <Form.Label className="text-uppercase fw-bold text-slate-500" style={{ fontSize: "10px", display: "block" }}>
                    DATE OF SERVICE (OPTIONAL)
                  </Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <ProcareDatePicker
                      selected={serviceStartDate}
                      onChange={(date) => setServiceStartDate(date)}
                    />
                    <span className="text-muted" style={{ fontSize: "12px" }}>to</span>
                    <ProcareDatePicker
                      selected={serviceEndDate}
                      onChange={(date) => setServiceEndDate(date)}
                    />
                  </div>
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
                          type="button"
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
                  <div>
                    <Button
                      type="button"
                      variant="link"
                      onClick={addItem}
                      className="text-decoration-none p-0 fw-bold d-flex align-items-center gap-1"
                      style={{ color: "#00b8d4", fontSize: "11px", border: "none" }}
                    >
                      <PlusCircleFill size={14} /> ADD INVOICE ITEM
                    </Button>
                    <div className="text-muted mt-1" style={{ fontSize: "9px" }}>
                      Preset Charges, Discounts & Subsidy
                    </div>
                  </div>
                  
                  <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>
                    Total:{" "}
                    {totalAmount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </div>
                </div>
              </Card>

              {/* Internal Notes Section (Yellow Box) */}
              <div
                className="p-3 rounded mb-2"
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fef3c7",
                }}
              >
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Add optional internal note"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                    padding: 0,
                    fontSize: "12px",
                  }}
                />
              </div>
            </Modal.Body>
          ) : (
            /* ================= STEP 2 ================= */
            <Modal.Body style={{ fontFamily: "Prompt" }}>
              <Row>
                {/* Left Side: Invoice Sheet Preview */}
                <Col md={7}>
                  <div className="fw-bold text-slate-500 mb-2" style={{ fontSize: "10px", textTransform: "uppercase" }}>
                    Invoice Preview
                  </div>
                  
                  <div className="border rounded p-3 bg-white shadow-sm" style={{ position: "relative" }}>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-2">
                        {/* Blue Emblem */}
                        <div
                          className="d-flex align-items-center justify-content-center text-white"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "6px",
                            backgroundColor: "#0ea5e9",
                            fontSize: "18px",
                            fontWeight: "bold",
                          }}
                        >
                          E
                        </div>
                        <div>
                          <h6 className="m-0 fw-bold text-slate-800" style={{ fontSize: "11px" }}>
                            Exceptional Learning and Arts Academy
                          </h6>
                          <span className="text-muted" style={{ fontSize: "9px" }}>
                            P.O. Box 29515, Jacksonville, FL, 32256
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <hr className="my-2" style={{ borderColor: "#e2e8f0" }} />

                    <div className="mb-3" style={{ fontSize: "11px" }}>
                      <span className="text-slate-400 fw-bold">DUE DATE:</span>{" "}
                      <span className="text-slate-800 fw-bold">{formattedDueDate}</span>
                    </div>

                    {/* Table of items */}
                    <Table responsive className="mb-2" style={{ fontSize: "10px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc" }}>
                          <th className="py-1 border-bottom text-slate-500 text-uppercase">Description</th>
                          <th className="py-1 border-bottom text-slate-500 text-uppercase text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 text-slate-700">
                              {item.type === "Subsidy" ? `Subsidy: ${item.description}` : item.description}
                            </td>
                            <td className="py-2 text-slate-700 text-end">
                              {parseFloat(item.amount || 0).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: "#f1f5f9" }}>
                          <td className="py-2 fw-bold text-slate-800">Total Amount</td>
                          <td className="py-2 text-end fw-bold text-slate-800">
                            {totalAmount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </Col>

                {/* Right Side: Recipient Selection */}
                <Col md={5}>
                  <div className="fw-bold text-slate-500 mb-2" style={{ fontSize: "10px", textTransform: "uppercase" }}>
                    1 Students Selected
                  </div>

                  <Card className="border rounded p-3 bg-white shadow-sm">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="d-flex align-items-center justify-content-center fw-bold text-white"
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
                        <div>
                          <h6 className="m-0 fw-bold text-slate-800" style={{ fontSize: "12px" }}>
                            {studentName}
                          </h6>
                          <span className="text-muted" style={{ fontSize: "10px" }}>
                            Student Account
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="text-danger p-0 border-0"
                        onClick={handleClose}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Modal.Body>
          )}

          <Modal.Footer className="border-top-0 pt-0">
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!dueDate) {
                      showError("Please specify a due date.");
                      return;
                    }
                    const invalidItem = items.find(item => !item.description || !item.amount);
                    if (invalidItem) {
                      showError("Please fill out all invoice item details and amounts.");
                      return;
                    }
                    setStep(2);
                  }}
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
                  CONTINUE
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline-secondary"
                  disabled={isSaving}
                  onClick={() => handleSaveInvoice("Draft")}
                  style={{ fontSize: "12px", padding: "8px 16px", borderRadius: "50px" }}
                >
                  SAVE
                </Button>
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveInvoice("Sent")}
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
                  {isSaving ? "Saving..." : "SAVE AND SEND"}
                </Button>
              </>
            )}
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
};

export default CreateInvoiceModal;
