import React from "react";
import { Button } from "react-bootstrap";
import { PlusCircle } from "react-bootstrap-icons";

const PageHeader = ({ title, buttonText, onButtonClick }) => {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {buttonText && onButtonClick && (
        <Button onClick={onButtonClick}>
          <PlusCircle className="me-2" /> {buttonText}
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
