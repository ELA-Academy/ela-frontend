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
  ArrowLeft,
  StarFill,
  ShieldShaded,
} from "react-bootstrap-icons";
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
import { format, addMonths, startOfMonth, endOfMonth, setDate } from "date-fns";

const formatCurrency = (amount) =>
  (amount != null ? amount : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const CreatePlanWizard = ({ show, handleClose, onPlanCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false); // <-- THIS IS THE FIX (initialized to false)
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

  // Wizard state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [planData, setPlanData] = useState({
    templateId: "new",
    plan_name: "",
    cycle: "Monthly",
    start_date: new Date(),
    end_date: null,
    invoice_generation_day: 1,
    due_day: 1,
    billing_cycle_for: "Previous",
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
      end_date: null,
      invoice_generation_day: 1,
      due_day: 1,
      billing_cycle_for: "Previous",
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
      setLoading(true); // Now we set loading to true only when fetching starts
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
        if (field === "type")
          updatedItem = {
            ...updatedItem,
            description: "",
            value: "",
            unit: "$",
            percentValue: "",
            dollarValue: "",
          };
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
        if (item.type === "Discount") {
          finalAmount =
            item.unit === "%"
              ? -((finalAmount / 100) * subtotal)
              : -finalAmount;
        } else if (item.type === "Subsidy") {
          finalAmount = -finalAmount;
        } else if (item.type === "Preset Item") {
          const preset = presetItems.find(
            (p) => p.description === item.description
          );
          finalAmount = preset ? preset.amount : 0;
        }
        return { ...item, amount: finalAmount };
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
          style={{ minHeight: "400px" }}
        >
          <Spinner />
        </div>
      );
    switch (step) {
      case 1:
        return (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5">
            <h4 className="mb-4">Which Plan do you want to create?</h4>
            <Button
              variant="outline-primary"
              size="lg"
              className="w-75 mb-3 p-3"
              onClick={() => setStep(2)}
            >
              <div className="fw-bold">TUITION PLAN</div>
              <small>(plan with fixed rates)</small>
            </Button>
            <div className="text-muted my-2">OR</div>
            <Button
              variant="outline-secondary"
              size="lg"
              className="w-75 p-3"
              disabled
            >
              <div className="fw-bold">ATTENDANCE PLAN</div>
              <small>(dynamic rates based on sign in/out)</small>
            </Button>
          </div>
        );
      case 2:
        return (
          <div>
            <h4 className="mb-3">Select Students</h4>
            <Form.Control
              type="text"
              placeholder="Search..."
              className="mb-3"
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
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
              />
              <small className="text-muted">
                {selectedStudentIds.length} STUDENTS SELECTED
              </small>
            </div>
            <ListGroup style={{ maxHeight: "400px", overflowY: "auto" }}>
              {filteredStudents.map((s) => (
                <ListGroup.Item
                  key={s.id}
                  className="d-flex align-items-center"
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
                      backgroundColor: "#6c757d",
                      color: "white",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                    className="me-3"
                  >
                    {getInitials(`${s.first_name} ${s.last_name}`)}
                  </div>
                  <label
                    htmlFor={`student-${s.id}`}
                    className="w-100"
                    style={{ cursor: "pointer" }}
                  >
                    {s.first_name} {s.last_name}
                  </label>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        );
      case 3:
        return (
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Create New or Pick Template</Form.Label>
                <Form.Select
                  value={planData.templateId}
                  onChange={handleTemplateChange}
                >
                  <option value="new">+ New plan</option>
                  {planTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Plan Name</Form.Label>
                <Form.Control
                  type="text"
                  value={planData.plan_name}
                  onChange={(e) =>
                    setPlanData({ ...planData, plan_name: e.target.value })
                  }
                  required
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <Form.Label>Plan Cycle</Form.Label>
                <Form.Select
                  value={planData.cycle}
                  onChange={(e) =>
                    setPlanData({ ...planData, cycle: e.target.value })
                  }
                >
                  <option>Monthly</option>
                </Form.Select>
              </Col>
              <Col>
                <Form.Label>Plan Start</Form.Label>
                <DatePicker
                  selected={planData.start_date}
                  onChange={(date) =>
                    setPlanData({ ...planData, start_date: date })
                  }
                  className="form-control"
                />
              </Col>
              <Col>
                <Form.Label>Plan End (Optional)</Form.Label>
                <DatePicker
                  selected={planData.end_date}
                  onChange={(date) =>
                    setPlanData({ ...planData, end_date: date })
                  }
                  className="form-control"
                  isClearable
                  placeholderText="Select month"
                />
              </Col>
            </Row>
            <Row className="mb-3 align-items-end gx-2">
              <Col xs="auto" className="pe-0" style={{ paddingTop: "32px" }}>
                Generate invoice on
              </Col>
              <Col>
                <Form.Select
                  value={planData.invoice_generation_day}
                  onChange={(e) =>
                    setPlanData({
                      ...planData,
                      invoice_generation_day: parseInt(e.target.value),
                    })
                  }
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {formatDay(d)} day
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto" className="pe-0">
                , due on
              </Col>
              <Col>
                <Form.Select
                  value={planData.due_day}
                  onChange={(e) =>
                    setPlanData({
                      ...planData,
                      due_day: parseInt(e.target.value),
                    })
                  }
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {formatDay(d)} day
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto" className="pe-0">
                for
              </Col>
              <Col>
                <Form.Select
                  value={planData.billing_cycle_for}
                  onChange={(e) =>
                    setPlanData({
                      ...planData,
                      billing_cycle_for: e.target.value,
                    })
                  }
                >
                  <option value="Previous">Previous</option>
                  <option value="Current">Current</option>
                </Form.Select>
              </Col>
              <Col xs="auto" className="ps-0">
                billing cycle.
              </Col>
            </Row>
            <Alert variant="success">
              Your first invoice will be generated on{" "}
              <strong>{firstInvoiceInfo.genDate}</strong> due on{" "}
              <strong>{firstInvoiceInfo.dueDate}</strong> for the period of{" "}
              <strong>{firstInvoiceInfo.periodStart}</strong> to{" "}
              <strong>{firstInvoiceInfo.periodEnd}</strong>.
            </Alert>

            <h5 className="mt-4">Invoice Details</h5>
            <Row className="gx-2 text-muted small mb-1">
              <Col md={2}>Type</Col>
              <Col>Item Description</Col>
              <Col md={3}>Amount</Col>
              <Col md={1} className="text-end">
                Total
              </Col>
              <Col xs="auto"></Col>
            </Row>
            {processedItems.map((item) => (
              <Row key={item.id} className="mb-2 align-items-center gx-2">
                <Col md={2}>
                  <Form.Select
                    value={item.type}
                    onChange={(e) =>
                      handleItemChange(item.id, "type", e.target.value)
                    }
                  >
                    <option>Preset Item</option>
                    <option>Discount</option>
                    <option>Subsidy</option>
                    <option>New Item</option>
                  </Form.Select>
                </Col>
                {item.type === "Discount" ? (
                  <Col md={7} className="d-flex align-items-center">
                    <InputGroup>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={item.percentValue}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "percentValue",
                            e.target.value
                          )
                        }
                      />
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                    <span className="mx-2">Or</span>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={item.dollarValue}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "dollarValue",
                            e.target.value
                          )
                        }
                      />
                    </InputGroup>
                    <Form.Select
                      className="ms-2"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(item.id, "description", e.target.value)
                      }
                    >
                      <option value="">Financial Aid</option>
                      {discounts.map((d) => (
                        <option key={d.id} value={d.description}>
                          {d.description}
                        </option>
                      ))}
                      <option
                        value="manage"
                        style={{ fontStyle: "italic", color: "blue" }}
                      >
                        + Manage Discounts
                      </option>
                    </Form.Select>
                  </Col>
                ) : (
                  <>
                    <Col>
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
                        >
                          <option value="">Add Invoice Description</option>
                          {presetItems.map((p) => (
                            <option key={p.id} value={p.description}>
                              {p.description}
                            </option>
                          ))}
                          <option
                            value="manage"
                            style={{ fontStyle: "italic", color: "blue" }}
                          >
                            + Manage Presets
                          </option>
                        </Form.Select>
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
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Item description"
                        />
                      )}
                    </Col>
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text>$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={item.value}
                          onChange={(e) =>
                            handleItemChange(item.id, "value", e.target.value)
                          }
                          disabled={item.type === "Preset Item"}
                        />
                      </InputGroup>
                    </Col>
                  </>
                )}
                <Col md={1} className="text-end fw-bold">
                  {formatCurrency(item.amount)}
                </Col>
                <Col xs="auto">
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash />
                  </Button>
                </Col>
              </Row>
            ))}
            <Button variant="link" onClick={addItem} className="p-0">
              ADD INVOICE ITEM
            </Button>
            <div className="text-end fs-4 mt-3 border-top pt-3">
              <strong>Total: {formatCurrency(totalAmount)}</strong>
            </div>
          </Form>
        );
      case 4:
        const selectedStudents = students.filter((s) =>
          selectedStudentIds.includes(s.id)
        );
        const firstStudent = selectedStudents[0] || {};
        return (
          <div>
            <Row>
              <Col md={7}>
                <h5 className="mb-3">Invoice Preview</h5>
                <div className="invoice-preview-card">
                  <div className="invoice-preview-header">
                    <div className="invoice-preview-logo">
                      <ShieldShaded size={30} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">
                        Exceptional Learning and Arts Academy
                      </h6>
                      <p className="text-muted small mb-0">
                        P.O. Box 29515, Jacksonville, FL, 32256
                      </p>
                    </div>
                  </div>
                  <div className="invoice-preview-billed-to">
                    Billed For{" "}
                    <Image
                      src="/images/placeholder-avatar.png"
                      roundedCircle
                      width={24}
                      height={24}
                      className="mx-1"
                    />
                    <strong>
                      {firstStudent.first_name} {firstStudent.last_name}
                    </strong>
                  </div>
                  <div className="invoice-preview-details">
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
                    className="invoice-preview-items"
                  >
                    <thead>
                      <tr>
                        <th>DESCRIPTION</th>
                        <th className="text-end">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td className="text-end">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td>Total Amount</td>
                        <td className="text-end">
                          {formatCurrency(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Col>
              <Col md={5}>
                <h6 className="mb-3">
                  {selectedStudentIds.length} STUDENT(S) SELECTED
                </h6>
                <ListGroup className="selected-students-list">
                  {selectedStudents.map((s) => (
                    <ListGroup.Item key={s.id}>
                      <Image
                        src="/images/placeholder-avatar.png"
                        roundedCircle
                        width={32}
                        height={32}
                      />
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">
                          {s.first_name} {s.last_name}
                        </div>
                        <small className="text-muted">{s.grade_level}</small>
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
                        <Trash />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
            </Row>
            <Form.Check
              type="checkbox"
              label="Send invoice to parent automatically on each billing cycle"
              checked={sendInvoiceAutomatically}
              onChange={(e) => setSendInvoiceAutomatically(e.target.checked)}
              className="mt-4"
            />
            <style>{`
                .invoice-preview-card { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; background-color: #fff; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
                .invoice-preview-header { display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem; margin-bottom: 1rem; }
                .invoice-preview-logo { flex-shrink: 0; width: 50px; height: 50px; border-radius: 0.5rem; background-color: #eef2ff; display: flex; align-items: center; justify-content: center; color: #4f46e5; }
                .invoice-preview-billed-to { margin-bottom: 1rem; display: flex; align-items: center; font-size: 0.9rem; }
                .invoice-preview-details { background-color: #f8f9fc; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem; font-size: 0.8rem; color: #6b7280; border: 1px solid #e5e7eb; }
                .invoice-preview-items { margin: 0 -1.5rem; width: calc(100% + 3rem); }
                .invoice-preview-items th { text-align: left; color: #6b7280; font-weight: 600; padding: 0 1.5rem 0.5rem; border-bottom: 1px solid #e5e7eb; font-size: 0.75rem; text-transform: uppercase; }
                .invoice-preview-items td { padding: 0.75rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
                .invoice-preview-items tbody tr:last-child td { border-bottom: none; }
                .invoice-preview-items .total-row td { font-weight: 700; font-size: 1.1rem; padding-top: 1rem; border-top: 2px solid #333; }
                .selected-students-list .list-group-item { display: flex; align-items: center; }
              `}</style>
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
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {step > 1 && (
              <Button
                variant="link"
                className="p-0 me-2"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={24} />
              </Button>
            )}
            Submit Plan - Step {step}/4
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: "500px", backgroundColor: "#f8f9fc" }}>
          {renderStepContent()}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between align-items-center">
          <div>
            {step === 3 && (
              <Button
                variant="outline-secondary"
                onClick={handleSaveTemplate}
                disabled={isSaving}
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
            {step < 4 && (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 2 && selectedStudentIds.length === 0) ||
                  (step === 3 && !planData.plan_name)
                }
              >
                Continue
              </Button>
            )}
            {step === 4 && (
              <Button
                onClick={handleCreatePlan}
                disabled={isSaving || selectedStudentIds.length === 0}
                style={{
                  backgroundColor: "#0d6efd",
                  borderColor: "#0d6efd",
                  borderRadius: "8px",
                  padding: "0.6rem 1.5rem",
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
