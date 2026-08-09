import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Spinner,
  Form,
  Row,
  Col,
  ListGroup,
  InputGroup,
  Alert,
  Image,
  Table,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import { v4 as uuidv4 } from "uuid";
import {
  Trash,
} from "react-bootstrap-icons";
import { X } from "lucide-react";
import { showSuccess, showError } from "../../../utils/notificationService";
import { getAllStudents } from "../../../services/studentService";
import { getSubsidies } from "../../../services/subsidyService";
import {
  getBillingPlans,
  getPresetItems,
  getPresetDiscounts,
  saveBillingPlan,
  createSubscriptions,
} from "../../../services/billingService";
import ManagePresetsModal from "./ManagePresetsModal";
import ManageDiscountsModal from "./ManageDiscountsModal";
import { format, addMonths, startOfMonth, endOfMonth, setDate, addDays } from "date-fns";

const formatCurrency = (amount) => {
  const sign = amount < 0 ? "-" : "";
  const absVal = Math.abs(amount);
  return `${sign}$${absVal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CreatePlanWizard = ({ show, handleClose, onPlanCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data stores
  const [students, setStudents] = useState([]);
  const [planTemplates, setPlanTemplates] = useState([]);
  const [presetItems, setPresetItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [subsidies, setSubsidies] = useState([]);

  // Modal visibility
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showDiscountsModal, setShowDiscountsModal] = useState(false);

  const initialEndDate = () => {
    const today = new Date();
    return addMonths(today, 12); // Default to 12 months duration
  };

  // Wizard state (starts directly at student selection)
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [planData, setPlanData] = useState({
    templateId: "new",
    plan_name: "",
    cycle: "Monthly",
    start_date: new Date(),
    end_date: initialEndDate(),
    invoice_generation_day: 1,
    due_day: 15,
    billing_cycle_for: "Current",
    items_json: [
      {
        id: uuidv4(),
        type: "New Item",
        description: "",
        value: "",
        unit: "$",
        percentValue: "",
        dollarValue: "",
      },
    ],
  });
  const [sendInvoiceAutomatically, setSendInvoiceAutomatically] =
    useState(true);

  const resetWizard = () => {
    setStep(1);
    setSelectedStudentIds([]);
    setStudentSearchTerm("");
    setPlanData({
      templateId: "new",
      plan_name: "",
      cycle: "Monthly",
      start_date: new Date(),
      end_date: initialEndDate(),
      invoice_generation_day: 1,
      due_day: 15,
      billing_cycle_for: "Current",
      items_json: [
        {
          id: uuidv4(),
          type: "New Item",
          description: "",
          value: "",
          unit: "$",
          percentValue: "",
          dollarValue: "",
        },
      ],
    });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [s, pt, pi, d, sub] = await Promise.all([
        getAllStudents(),
        getBillingPlans(),
        getPresetItems(),
        getPresetDiscounts(),
        getSubsidies(),
      ]);
      setStudents(s);
      setPlanTemplates(pt);
      setPresetItems(pi);
      setDiscounts(d);
      setSubsidies(sub);
    } catch (err) {
      showError("Failed to load necessary data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchInitialData();
    } else {
      resetWizard();
    }
  }, [show]);

  const handleTemplateChange = (e) => {
    const selectedTemplateId = e.target.value;
    if (selectedTemplateId === "new") {
      setPlanData({
        ...planData,
        templateId: "new",
        plan_name: "",
        items_json: [
          {
            id: uuidv4(),
            type: "New Item",
            description: "",
            value: "",
            unit: "$",
            percentValue: "",
            dollarValue: "",
          },
        ],
      });
    } else {
      const template = planTemplates.find(
        (t) => t.id === parseInt(selectedTemplateId)
      );
      if (template) {
        setPlanData({
          ...planData,
          templateId: template.id,
          plan_name: template.name,
          items_json: template.items_json.map((item) => ({
            ...item,
            id: uuidv4(),
          })),
        });
      }
    }
  };

  const handleItemChange = (id, field, value) => {
    const itemType = planData.items_json.find((i) => i.id === id)?.type;
    if (field === "description" && value === "manage") {
      if (itemType === "Preset Item") setShowPresetsModal(true);
      if (itemType === "Discount") setShowDiscountsModal(true);
      return;
    }
    const newItems = planData.items_json.map((item) => {
      if (item.id === id) {
        let updatedItem = { ...item, [field]: value };
        if (field === "type") {
          updatedItem = {
            ...updatedItem,
            description: "",
            value: "",
            unit: "$",
            percentValue: "",
            dollarValue: "",
          };
        }
        if (field === "description" && updatedItem.type === "Preset Item") {
          const preset = presetItems.find((p) => p.description === value);
          if (preset) updatedItem.value = preset.amount;
        }
        if (field === "percentValue") {
          updatedItem.dollarValue = "";
          updatedItem.unit = "%";
          updatedItem.value = value;
        }
        if (field === "dollarValue") {
          updatedItem.percentValue = "";
          updatedItem.unit = "$";
          updatedItem.value = value;
        }
        return updatedItem;
      }
      return item;
    });
    setPlanData({ ...planData, items_json: newItems });
  };

  const addItem = () =>
    setPlanData({
      ...planData,
      items_json: [
        ...planData.items_json,
        {
          id: uuidv4(),
          type: "New Item",
          description: "",
          value: "",
          unit: "$",
          percentValue: "",
          dollarValue: "",
        },
      ],
    });
  const removeItem = (id) =>
    setPlanData({
      ...planData,
      items_json: planData.items_json.filter((i) => i.id !== id),
    });

  const handleSaveTemplate = async () => {
    if (!planData.plan_name)
      return showError("Please enter a plan name to save it as a template.");
    setIsSaving(true);
    try {
      const itemsToSave = processedItems.map(({ id, amount, ...rest }) => rest);
      const newTemplate = await saveBillingPlan({
        name: planData.plan_name,
        items_json: itemsToSave,
      });
      setPlanTemplates([...planTemplates, newTemplate]);
      setPlanData({ ...planData, templateId: newTemplate.id });
      showSuccess("Template saved successfully!");
    } catch (err) {
      showError(err.response?.data?.error || "Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePlan = async () => {
    setIsSaving(true);
    try {
      const finalItems = processedItems.map(
        ({ id, value, unit, percentValue, dollarValue, ...rest }) => rest
      );
      const payload = { ...planData, items_json: finalItems };
      await createSubscriptions({
        student_ids: selectedStudentIds,
        plan_data: payload,
      });
      showSuccess("Recurring plan created!");
      onPlanCreated();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to create plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const subtotal = useMemo(
    () =>
      planData.items_json.reduce((sum, item) => {
        const value = parseFloat(item.value) || 0;
        const isCharge = item.type !== "Discount" && item.type !== "Subsidy";
        if (item.type === "Preset Item") {
          const preset = presetItems.find(
            (p) => p.description === item.description
          );
          return sum + (preset ? preset.amount : 0);
        }
        return isCharge ? sum + value : sum;
      }, 0),
    [planData.items_json, presetItems]
  );

  const processedItems = useMemo(
    () =>
      planData.items_json.map((item) => {
        let finalAmount = parseFloat(item.value) || 0;
        let finalDesc = item.description;
        
        if (item.type === "Discount") {
          finalAmount =
            item.unit === "%"
              ? -((finalAmount / 100) * subtotal)
              : -finalAmount;
          if (!finalDesc) finalDesc = "One Flat Rate Discount";
        } else if (item.type === "Subsidy") {
          finalAmount = -finalAmount;
          if (!finalDesc) finalDesc = "Subsidy Credit";
        } else if (item.type === "Preset Item") {
          const preset = presetItems.find(
            (p) => p.description === item.description
          );
          finalAmount = preset ? preset.amount : 0;
        } else if (item.type === "New Item") {
          if (!finalDesc) finalDesc = "Tuition Fee";
        }
        return { ...item, description: finalDesc, amount: finalAmount };
      }),
    [planData.items_json, subtotal, presetItems]
  );

  const totalAmount = useMemo(
    () => processedItems.reduce((sum, item) => sum + item.amount, 0),
    [processedItems]
  );

  const firstInvoiceInfo = useMemo(() => {
    try {
      const { start_date, invoice_generation_day, due_day, billing_cycle_for } =
        planData;
      if (!start_date || !invoice_generation_day || !due_day)
        return {
          genDate: "N/A",
          dueDate: "N/A",
          periodStart: "N/A",
          periodEnd: "N/A",
        };

      let firstInvoiceDate = setDate(start_date, invoice_generation_day);
      if (start_date.getDate() > invoice_generation_day)
        firstInvoiceDate = addMonths(firstInvoiceDate, 1);
      const firstDueDate = setDate(firstInvoiceDate, due_day);
      const periodSourceDate =
        billing_cycle_for === "Previous"
          ? addMonths(firstInvoiceDate, -1)
          : firstInvoiceDate;
      const periodStart = startOfMonth(periodSourceDate);
      const periodEnd = endOfMonth(periodSourceDate);

      return {
        genDate: format(firstInvoiceDate, "MMM d, yyyy"),
        dueDate: format(firstDueDate, "MMM d, yyyy"),
        periodStart: format(periodStart, "MMM d, yyyy"),
        periodEnd: format(periodEnd, "MMM d, yyyy"),
      };
    } catch (error) {
      return {
        genDate: "Invalid",
        dueDate: "Invalid",
        periodStart: "Invalid",
        periodEnd: "Invalid",
      };
    }
  }, [
    planData.start_date,
    planData.invoice_generation_day,
    planData.due_day,
    planData.billing_cycle_for,
  ]);

  const filteredStudents = students.filter((s) =>
    `${s.first_name} ${s.last_name}`
      .toLowerCase()
      .includes(studentSearchTerm.toLowerCase())
  );
  
  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "";

  const formatDay = (d) => {
    if (!d) return "";
    if (d > 3 && d < 21) return `${d}th`;
    switch (d % 10) {
      case 1:
        return `${d}st`;
      case 2:
        return `${d}nd`;
      case 3:
        return `${d}rd`;
      default:
        return `${d}th`;
    }
  };
  const dayOptions = Array.from({ length: 28 }, (_, i) => i + 1);

  const renderStepContent = () => {
    if (loading)
      return (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ minHeight: "360px" }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      );
    switch (step) {
      case 1: // Select Students
        return (
          <div>
            <h4 className="mb-3 fs-6 fw-bold text-slate-800">Select Students</h4>
            <Form.Control
              type="text"
              placeholder="Search students..."
              className="mb-3"
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              style={{ fontSize: "0.85rem", padding: "8px 12px", borderRadius: "6px" }}
            />
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Check
                type="checkbox"
                label="SELECT ALL"
                checked={
                  selectedStudentIds.length === filteredStudents.length &&
                  filteredStudents.length > 0
                }
                onChange={(e) =>
                  setSelectedStudentIds(
                    e.target.checked ? filteredStudents.map((s) => s.id) : []
                  )
                }
                className="fw-bold small text-slate-700"
                style={{ fontSize: "0.78rem" }}
              />
              <small className="text-muted fw-bold" style={{ fontSize: "0.72rem" }}>
                {selectedStudentIds.length} STUDENTS SELECTED
              </small>
            </div>
            <ListGroup style={{ maxHeight: "300px", overflowY: "auto", borderRadius: "8px" }}>
              {filteredStudents.map((s) => (
                <ListGroup.Item
                  key={s.id}
                  className="d-flex align-items-center py-2"
                >
                  <Form.Check
                    type="checkbox"
                    id={`student-${s.id}`}
                    className="me-3"
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() =>
                      setSelectedStudentIds((ids) =>
                        ids.includes(s.id)
                          ? ids.filter((id) => id !== s.id)
                          : [...ids, s.id]
                      )
                    }
                  />
                  <div
                    style={{
                      backgroundColor: "#00ca72",
                      color: "white",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "11px",
                    }}
                    className="me-3"
                  >
                    {getInitials(`${s.first_name} ${s.last_name}`)}
                  </div>
                  <label
                    htmlFor={`student-${s.id}`}
                    className="w-100 m-0 fw-semibold text-slate-700"
                    style={{ cursor: "pointer", fontSize: "0.82rem" }}
                  >
                    {s.first_name} {s.last_name}
                  </label>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        );
      case 2: // Plan Details (Compact, matching image 2)
        return (
          <div className="tuition-plan-form-compact">
            <Row className="mb-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold text-slate-500 mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.03em" }}>CREATE NEW OR PICK TEMPLATE</Form.Label>
                  <Form.Select
                    value={planData.templateId}
                    onChange={handleTemplateChange}
                    style={{ fontSize: "0.8rem", padding: "6px 10px", borderRadius: "6px" }}
                  >
                    <option value="new">+ New plan</option>
                    {planTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold text-slate-500 mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.03em" }}>PLAN NAME</Form.Label>
                  <Form.Control
                    type="text"
                    value={planData.plan_name}
                    onChange={(e) =>
                      setPlanData({ ...planData, plan_name: e.target.value })
                    }
                    required
                    style={{ fontSize: "0.8rem", padding: "6px 10px", borderRadius: "6px" }}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold text-slate-500 mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.03em" }}>PLAN CYCLE</Form.Label>
                  <Form.Select
                    value={planData.cycle}
                    onChange={(e) => {
                      const cycle = e.target.value;
                      const start = new Date();
                      let end = new Date();
                      if (cycle === "Weekly") {
                        end = addDays(start, 7 * 52);
                      } else if (cycle === "Bi-Weekly") {
                        end = addDays(start, 14 * 26);
                      } else if (cycle === "Quarterly") {
                        end = addMonths(start, 12);
                      } else {
                        end = addMonths(start, 12);
                      }
                      setPlanData({
                        ...planData,
                        cycle,
                        start_date: start,
                        end_date: end
                      });
                    }}
                    style={{ fontSize: "0.8rem", padding: "6px 10px", borderRadius: "6px" }}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold text-slate-500 mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.03em" }}>PLAN START</Form.Label>
                  <div className="d-flex align-items-center border rounded bg-white px-2 py-1" style={{ height: "34px", borderColor: "#cbd5e1" }}>
                    <DatePicker
                      selected={planData.start_date}
                      onChange={(date) =>
                        setPlanData({ ...planData, start_date: date })
                      }
                      className="border-0 w-100 bg-transparent text-center"
                      style={{ fontSize: "0.8rem", outline: "none" }}
                    />
                  </div>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold text-slate-500 mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.03em" }}>PLAN END (OPTIONAL)</Form.Label>
                  <div className="d-flex align-items-center border rounded bg-white px-2 py-1" style={{ height: "34px", borderColor: "#cbd5e1" }}>
                    <DatePicker
                      selected={planData.end_date}
                      onChange={(date) =>
                        setPlanData({ ...planData, end_date: date })
                      }
                      className="border-0 w-100 bg-transparent text-center"
                      isClearable
                      placeholderText="Select end date"
                      style={{ fontSize: "0.8rem", outline: "none" }}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Inline generate options (Image 2 style) */}
            <div className="d-flex align-items-center flex-wrap gap-1 px-3 py-2 mb-3 bg-white border rounded text-slate-700" style={{ fontSize: "0.8rem", borderColor: "#cbd5e1" }}>
              <span>Generate invoice on</span>
              <Form.Select
                value={planData.invoice_generation_day}
                onChange={(e) =>
                  setPlanData({
                    ...planData,
                    invoice_generation_day: parseInt(e.target.value),
                  })
                }
                style={{ width: "95px", padding: "2px 6px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              >
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDay(d)} day
                  </option>
                ))}
              </Form.Select>
              <span>, due on</span>
              <Form.Select
                value={planData.due_day}
                onChange={(e) =>
                  setPlanData({
                    ...planData,
                    due_day: parseInt(e.target.value),
                  })
                }
                style={{ width: "95px", padding: "2px 6px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              >
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDay(d)} day
                  </option>
                ))}
              </Form.Select>
              <span>for</span>
              <Form.Select
                value={planData.billing_cycle_for}
                onChange={(e) =>
                  setPlanData({
                    ...planData,
                    billing_cycle_for: e.target.value,
                  })
                }
                style={{ width: "100px", padding: "2px 6px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              >
                <option value="Previous">Previous</option>
                <option value="Current">Current</option>
              </Form.Select>
              <span>billing cycle.</span>
            </div>

            {/* Date Alert Banner */}
            <div className="p-2 rounded mb-3 text-start fw-medium border-0" style={{ backgroundColor: "#f0fdf4", color: "#166534", fontSize: "0.78rem", border: "1px solid #dcfce7" }}>
              Your first invoice will be generated on <strong>{firstInvoiceInfo.genDate}</strong> due on <strong>{firstInvoiceInfo.dueDate}</strong> for the period of <strong>{firstInvoiceInfo.periodStart}</strong> to <strong>{firstInvoiceInfo.periodEnd}</strong>.
            </div>

            {/* Table Headings */}
            <h5 className="fs-7 fw-bold text-slate-800 mb-2 text-uppercase text-start" style={{ letterSpacing: "0.03em" }}>Invoice Details</h5>
            <div className="invoice-items-container" style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
              {processedItems.map((item) => (
                <Row key={item.id} className="mb-2 align-items-center gx-1 border rounded p-1 mx-0 bg-white" style={{ borderColor: "#cbd5e1" }}>
                  <Col md={2}>
                    <Form.Select
                      value={item.type}
                      onChange={(e) => handleItemChange(item.id, "type", e.target.value)}
                      style={{ fontSize: "0.78rem", padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                    >
                      <option>Preset Item</option>
                      <option>Discount</option>
                      <option>Subsidy</option>
                      <option>New Item</option>
                    </Form.Select>
                  </Col>
                  
                  <Col md={7} className="text-start">
                    {item.type === "Discount" ? (
                      <div className="d-flex align-items-center gap-1">
                        <Form.Control
                          type="number"
                          placeholder="0"
                          value={item.percentValue || item.dollarValue || item.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (item.unit === "%") {
                              handleItemChange(item.id, "percentValue", val);
                            } else {
                              handleItemChange(item.id, "dollarValue", val);
                            }
                          }}
                          style={{ width: "65px", fontSize: "0.78rem", padding: "4px 6px", border: "1px solid #cbd5e1" }}
                        />
                        <Form.Select
                          value={item.unit}
                          onChange={(e) => {
                            const unit = e.target.value;
                            // Reset values based on unit toggle
                            if (unit === "%") {
                              handleItemChange(item.id, "percentValue", item.value);
                            } else {
                              handleItemChange(item.id, "dollarValue", item.value);
                            }
                          }}
                          style={{ width: "50px", fontSize: "0.78rem", padding: "4px 6px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="%">%</option>
                          <option value="$">$</option>
                        </Form.Select>
                        <span className="small text-muted" style={{ fontSize: "0.7rem" }}>Or</span>
                        <Form.Select
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                          style={{ fontSize: "0.78rem", padding: "4px 6px", border: "1px solid #cbd5e1" }}
                          className="flex-grow-1"
                        >
                          <option value="">Financial Aid</option>
                          {discounts.map((d) => (
                            <option key={d.id} value={d.description}>
                              {d.description}
                            </option>
                          ))}
                          <option value="manage" style={{ fontStyle: "italic", color: "blue" }}>
                            + Manage Discounts
                          </option>
                        </Form.Select>
                      </div>
                    ) : (
                      <div className="w-100">
                        {item.type === "Preset Item" && (
                          <Form.Select
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                            style={{ fontSize: "0.78rem", padding: "4px 8px", border: "1px solid #cbd5e1" }}
                            className="w-100"
                          >
                            <option value="">Add Invoice Description</option>
                            {presetItems.map((p) => (
                              <option key={p.id} value={p.description}>
                                {p.description}
                              </option>
                            ))}
                            <option value="manage" style={{ fontStyle: "italic", color: "blue" }}>
                              + Manage Presets
                            </option>
                          </Form.Select>
                        )}
                        {item.type === "Subsidy" && (
                          <Form.Select
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                            style={{ fontSize: "0.78rem", padding: "4px 8px", border: "1px solid #cbd5e1" }}
                            className="w-100"
                          >
                            <option value="">Select subsidy...</option>
                            {subsidies.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </Form.Select>
                        )}
                        {item.type === "New Item" && (
                          <Form.Control
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                            placeholder="Item description"
                            style={{ fontSize: "0.78rem", padding: "4px 8px", border: "1px solid #cbd5e1" }}
                            className="w-100"
                          />
                        )}
                      </div>
                    )}
                  </Col>
                  
                  <Col md={2}>
                    <InputGroup size="sm">
                      {item.type !== "Discount" && item.type !== "Subsidy" && <InputGroup.Text style={{ padding: "4px 6px", fontSize: "0.75rem" }}>$</InputGroup.Text>}
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={item.value}
                        onChange={(e) => handleItemChange(item.id, "value", e.target.value)}
                        disabled={item.type === "Preset Item"}
                        style={{ fontSize: "0.78rem", padding: "4px 8px", border: "1px solid #cbd5e1" }}
                      />
                    </InputGroup>
                  </Col>
                  
                  <Col md={1} className="text-end fw-bold d-flex align-items-center justify-content-end gap-2">
                    <span style={{ fontSize: "0.82rem", color: item.amount < 0 ? "#ef4444" : "#1f2937" }}>
                      {formatCurrency(item.amount)}
                    </span>
                    <Button variant="link" className="text-danger p-0" onClick={() => removeItem(item.id)}>
                      <Trash size={13} />
                    </Button>
                  </Col>
                </Row>
              ))}
            </div>
            
            <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
              <Button variant="link" onClick={addItem} className="p-0 text-decoration-none small fw-bold" style={{ fontSize: "0.8rem", color: "#00b8d4" }}>
                + ADD INVOICE ITEM
              </Button>
              <div className="fs-5 fw-bold text-slate-800">
                Total: {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        );
      case 3: // Invoice Preview
        const selectedStudents = students.filter((s) =>
          selectedStudentIds.includes(s.id)
        );
        const firstStudent = selectedStudents[0] || {};
        return (
          <div>
            <Row>
              <Col md={7}>
                <h5 className="mb-3 fs-6 fw-bold text-slate-800 text-start">Invoice Preview</h5>
                <div className="invoice-preview-card" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div className="invoice-preview-header d-flex align-items-center gap-3 mb-3 border-bottom pb-3">
                    <div className="invoice-preview-logo border" style={{ flexShrink: 0, width: "60px", height: "60px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#fff" }}>
                      <Image src="/images/ela-app-logo.png" alt="School Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                    <div className="text-start">
                      <h6 className="fw-bold mb-0 text-slate-800" style={{ fontSize: "0.95rem" }}>
                        Exceptional Learning and Arts Academy
                      </h6>
                      <p className="text-muted small mb-0" style={{ fontSize: "0.75rem" }}>
                        P.O. Box 29515, Jacksonville, FL, 32256
                      </p>
                    </div>
                  </div>
                  <div className="invoice-preview-billed-to mb-3 text-slate-700 text-start" style={{ fontSize: "0.85rem" }}>
                    Billed For{" "}
                    <div
                      className="d-inline-flex align-items-center justify-content-center text-white fw-bold rounded-circle mx-1"
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: "#673de6",
                        fontSize: "9px"
                      }}
                    >
                      {getInitials(`${firstStudent.first_name || ""} ${firstStudent.last_name || ""}`)}
                    </div>
                    <strong>
                      {firstStudent.first_name} {firstStudent.last_name}
                    </strong>
                  </div>
                  <div className="invoice-preview-details d-flex justify-content-between p-2 mb-3 rounded-2" style={{ backgroundColor: "#f8fafc", fontSize: "0.78rem", border: "1px solid #e2e8f0", color: "#64748b" }}>
                    <div>
                      <strong>DUE DATE:</strong> {firstInvoiceInfo.dueDate}
                    </div>
                    <div>
                      <strong>INVOICE PERIOD:</strong>{" "}
                      {firstInvoiceInfo.periodStart.toUpperCase()} -{" "}
                      {firstInvoiceInfo.periodEnd.toUpperCase()}
                    </div>
                  </div>
                  <Table
                    responsive
                    borderless
                    className="invoice-preview-items m-0 text-start"
                    style={{ fontSize: "0.82rem" }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ color: "#64748b", fontWeight: "600", fontSize: "0.72rem", textTransform: "uppercase", paddingBottom: "8px" }}>DESCRIPTION</th>
                        <th className="text-end" style={{ color: "#64748b", fontWeight: "600", fontSize: "0.72rem", textTransform: "uppercase", paddingBottom: "8px" }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 0" }}>{item.description}</td>
                          <td className="text-end" style={{ padding: "8px 0" }}>
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td style={{ paddingTop: "12px", fontWeight: "700", fontSize: "0.95rem" }}>Total Amount</td>
                        <td className="text-end text-slate-900" style={{ paddingTop: "12px", fontWeight: "800", fontSize: "1.05rem" }}>
                          {formatCurrency(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Col>
              <Col md={5}>
                <h6 className="mb-3 fs-6 fw-bold text-slate-800 text-start">
                  {selectedStudentIds.length} STUDENT(S) SELECTED
                </h6>
                <ListGroup className="selected-students-list text-start" style={{ maxHeight: "300px", overflowY: "auto", borderRadius: "8px" }}>
                  {selectedStudents.map((s) => (
                    <ListGroup.Item key={s.id} className="d-flex align-items-center py-2">
                      <div
                        className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle"
                        style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "#00ca72",
                          fontSize: "11px"
                        }}
                      >
                        {getInitials(`${s.first_name} ${s.last_name}`)}
                      </div>
                      <div className="ms-2 me-auto">
                        <div className="fw-semibold text-slate-800" style={{ fontSize: "0.85rem" }}>
                          {s.first_name} {s.last_name}
                        </div>
                        <small className="text-muted" style={{ fontSize: "0.72rem" }}>Home Room {s.grade_level}</small>
                      </div>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() =>
                          setSelectedStudentIds((ids) =>
                            ids.filter((id) => id !== s.id)
                          )
                        }
                      >
                        <Trash size={14} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
            </Row>
            <Form.Check
              type="checkbox"
              label="Send Invoice to parent automatically on each billing cycle"
              checked={sendInvoiceAutomatically}
              onChange={(e) => setSendInvoiceAutomatically(e.target.checked)}
              className="mt-4 small fw-semibold text-slate-700 text-start"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        size="xl"
        centered
        backdrop="static"
        dialogClassName="font-prompt"
        style={{ fontFamily: '"Prompt", sans-serif' }}
      >
        <Modal.Header className="border-bottom py-3 position-relative d-block">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              {step > 1 && (
                <Button
                  variant="link"
                  className="p-0 me-2 text-slate-600 d-flex align-items-center text-decoration-none fw-bold"
                  onClick={() => setStep(step - 1)}
                  style={{ fontSize: "1.2rem" }}
                >
                  ←
                </Button>
              )}
              <h5 className="modal-title fw-bold text-slate-800 m-0" style={{ fontSize: "1.1rem" }}>
                Create Tuition Plan
              </h5>
              <span className="text-muted small ms-2 fw-semibold" style={{ fontSize: "0.8rem" }}>
                STEP {step} / 3
              </span>
            </div>
            
            {/* Custom guaranteed close X button at the top right */}
            <Button
              variant="link"
              className="text-slate-500 p-1"
              onClick={handleClose}
              style={{ position: "absolute", right: "20px", top: "16px" }}
            >
              <X size={20} />
            </Button>
          </div>
        </Modal.Header>
        <Modal.Body style={{ minHeight: "420px", backgroundColor: "#f8fafc" }}>
          {renderStepContent()}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between align-items-center border-top py-3">
          <div>
            {step === 2 && (
              <Button
                variant="outline-secondary"
                onClick={handleSaveTemplate}
                disabled={isSaving}
                size="sm"
                style={{ borderRadius: "8px", fontWeight: "600" }}
              >
                {isSaving ? (
                  <Spinner as="span" size="sm" />
                ) : (
                  "Save as Template"
                )}
              </Button>
            )}
          </div>
          <div>
            {step < 3 && (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && selectedStudentIds.length === 0) ||
                  (step === 2 && !planData.plan_name)
                }
                size="sm"
                style={{
                  backgroundColor: "#00b8d4",
                  borderColor: "#00b8d4",
                  borderRadius: "20px",
                  padding: "6px 24px",
                  fontWeight: "600"
                }}
              >
                Continue
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={handleCreatePlan}
                disabled={isSaving || selectedStudentIds.length === 0}
                size="sm"
                style={{
                  backgroundColor: "#00b8d4",
                  borderColor: "#00b8d4",
                  borderRadius: "20px",
                  padding: "6px 24px",
                  fontWeight: "600"
                }}
              >
                {isSaving ? <Spinner as="span" size="sm" /> : "Create Plan"}
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
      <ManagePresetsModal
        show={showPresetsModal}
        handleClose={() => setShowPresetsModal(false)}
        onUpdate={fetchInitialData}
      />
      <ManageDiscountsModal
        show={showDiscountsModal}
        handleClose={() => setShowDiscountsModal(false)}
        onUpdate={fetchInitialData}
      />
    </>
  );
};

export default CreatePlanWizard;
