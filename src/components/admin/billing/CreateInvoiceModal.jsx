import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { PlusCircleFill, Trash } from "react-bootstrap-icons";
import { v4 as uuidv4 } from "uuid";
import {
  createInvoice,
  getPresetItems,
} from "../../../services/billingService";
import { getSubsidies } from "../../../services/subsidyService";
import { showSuccess, showError } from "../../../utils/notificationService";

const CreateInvoiceModal = ({
  show,
  handleClose,
  studentId,
  onInvoiceCreated,
}) => {
  const [items, setItems] = useState([
    { id: uuidv4(), type: "New Item", description: "", amount: "" },
  ]);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Draft");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data for dropdowns
  const [presetItems, setPresetItems] = useState([]);
  const [subsidies, setSubsidies] = useState([]);

  useEffect(() => {
    if (show) {
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
          showError("Failed to load invoice data.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        due_date: dueDate,
        status,
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
      showSuccess("Invoice created successfully!");
      onInvoiceCreated();
      handleClose();
      setItems([{ id: uuidv4(), description: "", amount: "" }]);
      setDueDate("");
      setStatus("Draft");
    } catch (err) {
      showError(err.response?.data?.error || "Failed to create invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Invoice</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {loading ? (
            <div className="text-center">
              <Spinner />
            </div>
          ) : (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                  </Form.Select>
                </Col>
              </Row>
              <hr />
              <h5>Invoice Items</h5>
              {items.map((item) => (
                <Row key={item.id} className="mb-2 align-items-center">
                  <Col md={3}>
                    <Form.Select
                      value={item.type}
                      onChange={(e) =>
                        handleItemChange(item.id, "type", e.target.value)
                      }
                    >
                      <option>New Item</option>
                      <option>Preset Item</option>
                      <option>Discount</option>
                      <option>Subsidy</option>
                    </Form.Select>
                  </Col>
                  <Col>
                    {item.type === "New Item" && (
                      <Form.Control
                        type="text"
                        placeholder="Item Description"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        required
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
                      >
                        <option value="">Select preset...</option>
                        {presetItems.map((p) => (
                          <option key={p.id}>{p.description}</option>
                        ))}
                      </Form.Select>
                    )}
                    {item.type === "Discount" && (
                      <Form.Control
                        type="text"
                        placeholder="Discount Reason"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        required
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
                  <Col xs={4} md={3}>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
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
                      />
                    </InputGroup>
                  </Col>
                  <Col xs="auto">
                    {items.length > 1 && (
                      <Button
                        variant="link"
                        className="text-danger"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash />
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
              <Button variant="link" onClick={addItem}>
                <PlusCircleFill className="me-2" />
                Add Item
              </Button>
              <hr />
              <div className="text-end">
                <h4>
                  Total:{" "}
                  {totalAmount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </h4>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Create Invoice"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateInvoiceModal;
