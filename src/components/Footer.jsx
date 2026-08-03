import React from "react";

export default function Footer() {
  return (
    <footer className="footer py-4 border-top" style={{ backgroundColor: "#ffffff" }}>
      <div className="container text-center">
        <p className="mb-0 text-muted" style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "0.03em" }}>
          &copy; {new Date().getFullYear()} ELA Academy. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
