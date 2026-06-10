import React from "react";
import { Form, InputGroup } from "react-bootstrap";

const FormBuilderStep2 = ({ formState, setFormState }) => {
  const handleFeeToggle = (e) => {
    const collectFee = e.target.value === "yes";
    setFormState({
      ...formState,
      collect_fee: collectFee,
      // Reset fee amount if fees are turned off
      fee_amount: collectFee ? formState.fee_amount : 0,
    });
  };

  const handleFeeAmountChange = (e) => {
    // Allow empty string for clearing input, otherwise parse as float
    const amount = e.target.value === "" ? "" : parseFloat(e.target.value);
    setFormState({
      ...formState,
      fee_amount: amount,
    });
  };

  return (
    <div className="form-builder-container">
      <h4 className="step-subtitle">Step 2: Payment Method</h4>
      <div className="p-4 border rounded">
        <Form.Group>
          <Form.Label as="legend" className="fw-bold">
            Do you want to collect registration fees?
          </Form.Label>
          <Form.Check
            type="radio"
            id="collect-fees-yes"
            name="collectFees"
            value="yes"
            label="Yes, require a payment to submit this form."
            checked={formState.collect_fee === true}
            onChange={handleFeeToggle}
          />
          <Form.Check
            type="radio"
            id="collect-fees-no"
            name="collectFees"
            value="no"
            label="No, this form does not require a payment."
            checked={formState.collect_fee === false}
            onChange={handleFeeToggle}
          />
        </Form.Group>

        {formState.collect_fee && (
          <Form.Group className="mt-4" style={{ maxWidth: "300px" }}>
            <Form.Label className="fw-bold">
              Student Registration Fee
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={formState.fee_amount || ""}
                onChange={handleFeeAmountChange}
                placeholder="0.00"
              />
            </InputGroup>
          </Form.Group>
        )}
      </div>
    </div>
  );
};

export default FormBuilderStep2;
