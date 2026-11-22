import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, X, GripVertical } from "lucide-react";
import api from "../../../utils/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PdfPageRenderer = ({ pdfDoc, pageNum, scale, widthOverride, children, onDropField, onPageClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 680, height: 880 });

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetScale = widthOverride
          ? widthOverride / baseViewport.width
          : (740 / baseViewport.width) * scale;
        const viewport = page.getViewport({ scale: targetScale });
        if (cancelled) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        setDims({ width: viewport.width, height: viewport.height });
        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("PDF page render error:", err);
        }
      }
    };

    renderPage();
    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, pageNum, scale, widthOverride]);

  const handleDragOver = (e) => {
    if (!onDropField) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    if (!onDropField || !containerRef.current) return;
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(82, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));
      onDropField(payload, pageNum, xPct, yPct);
    } catch (err) {
      console.error("Field drop parse error:", err);
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onPageClick}
      style={{
        position: "relative",
        width: `${dims.width}px`,
        height: `${dims.height}px`,
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.12)",
        borderRadius: "4px",
        overflow: "hidden",
        margin: "0 auto 1.25rem auto",
        flexShrink: 0
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none"
        }}
      >
        {children}
      </div>
    </div>
  );
};

const PdfFieldCanvas = ({
  fileUrl,
  localFile,
  mode = "edit", // "edit" | "preview" | "sign"
  fields = [],
  onChangeFields,
  adminValues = {},
  onChangeAdminValues,
  filledData = {},
  onChangeFilledData,
  autoContext = {},
  locked = false
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [scale, setScale] = useState(1);
  const [fullSize, setFullSize] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const pageRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    const load = async () => {
      setLoadError("");
      setPdfDoc(null);
      setNumPages(0);
      try {
        if (localFile) {
          const buf = await localFile.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: buf });
        } else if (fileUrl) {
          // Fetch PDF with the user's JWT Authorization header so authenticated document routes never 401
          const response = await api.get(fileUrl, { responseType: "arraybuffer" });
          if (cancelled) return;
          loadingTask = pdfjsLib.getDocument({ data: response.data });
        } else {
          return;
        }
        const doc = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load PDF:", err);
          setLoadError("Unable to render PDF preview. Ensure the file is a valid PDF.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch (e) {}
      }
    };
  }, [fileUrl, localFile]);

  const handleDropField = useCallback(
    (payload, pageNum, xPct, yPct) => {
      if (mode !== "edit" || !onChangeFields) return;
      if (payload.existingId) {
        onChangeFields(
          fields.map((f) =>
            f.id === payload.existingId ? { ...f, page: pageNum, xPct, yPct } : f
          )
        );
      } else {
        const newField = {
          id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: payload.type,
          label: payload.label,
          category: payload.category, // 'recipient' | 'admin' | 'auto'
          required: Boolean(payload.required),
          page: pageNum,
          xPct,
          yPct,
          wPct: payload.type === "checkbox" ? 4.5 : payload.type === "initials" ? 11 : 22,
          hPct: payload.type === "checkbox" ? 3.5 : 4.2
        };
        onChangeFields([...fields, newField]);
      }
    },
    [mode, fields, onChangeFields]
  );

  const removeField = (id) => {
    if (!onChangeFields) return;
    onChangeFields(fields.filter((f) => f.id !== id));
  };

  const resolveAutoValue = (field) => {
    switch (field.type) {
      case "company_name":
        return autoContext.companyName || "Cooper Galvis Enterprises LLC";
      case "signing_date":
        return autoContext.signingDate || new Date().toLocaleDateString("en-US");
      case "dob":
        return autoContext.dob || "Date of birth";
      case "start_date":
        return autoContext.startDate || "Start date";
      case "recipient_full_name":
        return autoContext.fullName || "Recipient full name";
      default:
        return field.label;
    }
  };

  const renderOverlayField = (field) => {
    const isRecipient = field.category === "recipient";
    const isAdmin = field.category === "admin";
    const isAuto = field.category === "auto";

    const borderColor = isRecipient ? "#2563eb" : isAdmin ? "#2563eb" : "#7c3aed";
    const bgColor = isRecipient
      ? "rgba(239, 246, 255, 0.94)"
      : isAdmin
      ? "rgba(239, 246, 255, 0.94)"
      : "rgba(245, 243, 255, 0.94)";

    const baseStyle = {
      position: "absolute",
      left: `${field.xPct}%`,
      top: `${field.yPct}%`,
      minWidth: field.type === "checkbox" ? "26px" : "130px",
      width: field.type === "checkbox" ? "28px" : `${field.wPct || 22}%`,
      minHeight: "28px",
      pointerEvents: "auto",
      zIndex: 5
    };

    // EDIT MODE (Step 2 Customize)
    if (mode === "edit") {
      return (
        <div
          key={field.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/json", JSON.stringify({ existingId: field.id }));
          }}
          style={{
            ...baseStyle,
            border: `1.5px solid ${borderColor}`,
            backgroundColor: bgColor,
            borderRadius: "4px",
            padding: "2px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "4px",
            cursor: "grab",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, minWidth: 0 }}>
            <GripVertical size={12} color={borderColor} style={{ flexShrink: 0 }} />
            {isAdmin ? (
              <input
                type="text"
                value={adminValues[field.id] || ""}
                onChange={(e) =>
                  onChangeAdminValues &&
                  onChangeAdminValues({ ...adminValues, [field.id]: e.target.value })
                }
                placeholder={field.label}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#1e3a8a",
                  width: "100%",
                  outline: "none",
                  fontStyle: field.type === "admin_signature" ? "italic" : "normal",
                  fontFamily: field.type === "admin_signature" ? "Georgia, serif" : "inherit"
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#111827",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {field.label}
                {field.required ? " *" : ""}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeField(field.id);
            }}
            style={{
              background: "none",
              border: "none",
              padding: "1px",
              cursor: "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center"
            }}
            title="Remove field"
          >
            <X size={12} />
          </button>
        </div>
      );
    }

    // PREVIEW MODE (Step 3 Review)
    if (mode === "preview") {
      const display = isAdmin
        ? adminValues[field.id] || `[${field.label}]`
        : isAuto
        ? `${field.label}*`
        : `[${field.label}]`;
      return (
        <div
          key={field.id}
          style={{
            ...baseStyle,
            border: `1px dashed ${borderColor}`,
            backgroundColor: bgColor,
            borderRadius: "3px",
            padding: "2px 6px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#111827",
            display: "flex",
            alignItems: "center"
          }}
        >
          {display}
        </div>
      );
    }

    // SIGN / VIEW MODE (Staff filling or Locked read-only)
    const val = filledData[field.id];
    if (isAdmin) {
      return (
        <div
          key={field.id}
          style={{
            ...baseStyle,
            padding: "2px 6px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#1e3a8a",
            fontStyle: field.type === "admin_signature" ? "italic" : "normal",
            fontFamily: field.type === "admin_signature" ? "Georgia, serif" : "inherit",
            display: "flex",
            alignItems: "center"
          }}
        >
          {adminValues[field.id] || ""}
        </div>
      );
    }

    if (isAuto) {
      return (
        <div
          key={field.id}
          style={{
            ...baseStyle,
            padding: "2px 6px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#111827",
            backgroundColor: "rgba(245, 243, 255, 0.7)",
            borderRadius: "3px",
            display: "flex",
            alignItems: "center"
          }}
        >
          {resolveAutoValue(field)}
        </div>
      );
    }

    // Recipient field in Sign / View mode
    if (field.type === "checkbox") {
      return (
        <label
          key={field.id}
          style={{
            ...baseStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: locked ? "rgba(239, 246, 255, 0.7)" : "#ffffff",
            border: `1.5px solid ${locked ? "#94a3b8" : "#2563eb"}`,
            borderRadius: "4px",
            cursor: locked ? "default" : "pointer"
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(val)}
            disabled={locked}
            onChange={(e) =>
              onChangeFilledData && onChangeFilledData({ ...filledData, [field.id]: e.target.checked })
            }
            style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
          />
        </label>
      );
    }

    const isSig = field.type === "signature" || field.type === "initials";
    return (
      <div
        key={field.id}
        style={{
          ...baseStyle,
          border: `1.5px solid ${locked ? "#94a3b8" : "#2563eb"}`,
          backgroundColor: locked ? "rgba(248, 250, 252, 0.92)" : "rgba(239, 246, 255, 0.96)",
          borderRadius: "4px",
          padding: "2px 6px",
          display: "flex",
          alignItems: "center"
        }}
      >
        {locked ? (
          <span
            style={{
              fontSize: isSig ? "14px" : "12px",
              fontWeight: 600,
              color: "#0f172a",
              fontFamily: isSig ? "Georgia, 'Times New Roman', serif" : "inherit",
              fontStyle: isSig ? "italic" : "normal"
            }}
          >
            {val || ""}
          </span>
        ) : (
          <input
            type="text"
            value={val || ""}
            required={field.required}
            placeholder={field.label}
            onChange={(e) =>
              onChangeFilledData && onChangeFilledData({ ...filledData, [field.id]: e.target.value })
            }
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: isSig ? "14px" : "12px",
              fontWeight: 600,
              color: "#0f172a",
              fontFamily: isSig ? "Georgia, 'Times New Roman', serif" : "inherit",
              fontStyle: isSig ? "italic" : "normal"
            }}
          />
        )}
      </div>
    );
  };

  if (loadError) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
        {loadError}
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
        Loading PDF document...
      </div>
    );
  }

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Toolbar matching Gusto Image 4 & 5 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.85rem",
          backgroundColor: mode === "preview" ? "#1f2937" : "#f8fafc",
          color: mode === "preview" ? "#f9fafb" : "#374151",
          borderRadius: "8px",
          border: mode === "preview" ? "none" : "1px solid #e5e7eb"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(1.8, +(s + 0.15).toFixed(2)))}
            style={{
              border: "1px solid #cbd5e1",
              background: mode === "preview" ? "#374151" : "#ffffff",
              color: mode === "preview" ? "#ffffff" : "#374151",
              borderRadius: "5px",
              padding: "4px 6px",
              cursor: "pointer"
            }}
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.15).toFixed(2)))}
            style={{
              border: "1px solid #cbd5e1",
              background: mode === "preview" ? "#374151" : "#ffffff",
              color: mode === "preview" ? "#ffffff" : "#374151",
              borderRadius: "5px",
              padding: "4px 6px",
              cursor: "pointer"
            }}
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, minWidth: "48px" }}>
            {Math.round(scale * 100)}%
          </span>
          <span style={{ fontSize: "0.8rem", opacity: 0.75 }}>
            • {numPages} {numPages === 1 ? "page" : "pages"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setFullSize((v) => !v)}
          style={{
            border: "1px solid #cbd5e1",
            background: mode === "preview" ? "#374151" : "#ffffff",
            color: mode === "preview" ? "#ffffff" : "#374151",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem"
          }}
        >
          {fullSize ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {fullSize ? "Fit view" : "View full size"}
        </button>
      </div>

      {/* Main Body */}
      <div
        style={{
          display: "flex",
          backgroundColor: mode === "preview" ? "#2d3748" : "#f1f5f9",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          maxHeight: fullSize ? "none" : "72vh",
          overflow: "hidden"
        }}
      >
        {/* Page thumbnails strip in preview mode */}
        {mode === "preview" && numPages > 1 && (
          <div
            style={{
              width: "136px",
              backgroundColor: "#1f2937",
              padding: "0.75rem",
              overflowY: "auto",
              borderRight: "1px solid #374151",
              flexShrink: 0
            }}
          >
            {pageNumbers.map((p) => (
              <div
                key={`thumb-${p}`}
                onClick={() => {
                  setActivePage(p);
                  pageRefs.current[p]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                style={{
                  marginBottom: "0.75rem",
                  cursor: "pointer",
                  textAlign: "center",
                  padding: "4px",
                  borderRadius: "6px",
                  border: activePage === p ? "2px solid #38bdf8" : "2px solid transparent"
                }}
              >
                <PdfPageRenderer pdfDoc={pdfDoc} pageNum={p} scale={1} widthOverride={96} />
                <div style={{ fontSize: "0.72rem", color: "#e5e7eb", marginTop: "-0.75rem" }}>{p}</div>
              </div>
            ))}
          </div>
        )}

        {/* Scrollable PDF Pages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          {pageNumbers.map((pageNum) => {
            const pageFields = fields.filter((f) => Number(f.page || 1) === pageNum);
            return (
              <div key={`page-${pageNum}`} ref={(el) => (pageRefs.current[pageNum] = el)}>
                <PdfPageRenderer
                  pdfDoc={pdfDoc}
                  pageNum={pageNum}
                  scale={scale}
                  onDropField={mode === "edit" ? handleDropField : undefined}
                >
                  {pageFields.map((field) => renderOverlayField(field))}
                </PdfPageRenderer>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PdfFieldCanvas;
