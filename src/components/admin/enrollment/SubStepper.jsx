import React from "react";

const SubStepper = ({ sections, activeIndex }) => {
  return (
    <div className="sub-stepper">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={`sub-step ${activeIndex === index ? "active" : ""}`}
        >
          <div className="sub-step-number">{index + 1}</div>
          <div className="sub-step-label">{section.title}</div>
        </div>
      ))}
    </div>
  );
};

export default SubStepper;
