import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import { Plus, Trash2, FileText, CheckCircle, Save, Edit3, ArrowLeft } from "lucide-react";
import { getWorkspaceDocs, createWorkspaceDoc, updateWorkspaceDoc, deleteWorkspaceDoc } from "../../../services/boardService";
import DOMPurify from "dompurify";
import "../../../styles/Boards.css";

const DocsView = ({ boardId }) => {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Doc editing temporary states
  const [editTitle, setEditTitle] = useState("");
  const [editHtml, setEditHtml] = useState("");
  
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceDocs(boardId);
      setDocs(data);
      if (data.length > 0) {
        // Keep selected if exists, otherwise first
        const currentSelected = selectedDoc 
          ? data.find(d => d.id === selectedDoc.id) || data[0]
          : data[0];
        handleSelectDoc(currentSelected);
      } else {
        setSelectedDoc(null);
      }
    } catch (err) {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [boardId, selectedDoc]);

  useEffect(() => {
    fetchDocs();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [boardId]);

  const handleSelectDoc = (doc) => {
    if (saveTimeoutRef.current) {
      // Force save outstanding changes
      clearTimeout(saveTimeoutRef.current);
      saveChangesImmediately();
    }
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditHtml(doc.content_html || "");
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content_html || "";
    }
  };

  const handleCreateDoc = async () => {
    try {
      setSaving(true);
      const newDoc = await createWorkspaceDoc(boardId, {
        title: "Untitled Document",
        content_html: "<p>Start writing your document notes here...</p>"
      });
      setDocs(prev => [...prev, newDoc]);
      handleSelectDoc(newDoc);
    } catch (err) {
      setError("Failed to create document.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (docId, event) => {
    if (event) event.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this document?")) return;
    
    try {
      setSaving(true);
      await deleteWorkspaceDoc(docId);
      const nextDocs = docs.filter(d => d.id !== docId);
      setDocs(nextDocs);
      if (selectedDoc && selectedDoc.id === docId) {
        if (nextDocs.length > 0) {
          handleSelectDoc(nextDocs[0]);
        } else {
          setSelectedDoc(null);
        }
      }
    } catch (err) {
      setError("Failed to delete document.");
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save function
  const triggerAutoSave = (updatedTitle, updatedHtml) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaving(true);
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!selectedDoc) return;
      try {
        const response = await updateWorkspaceDoc(selectedDoc.id, {
          title: updatedTitle,
          content_html: updatedHtml
        });
        
        // Update local docs list
        setDocs(prev => prev.map(d => d.id === selectedDoc.id ? response : d));
        setSelectedDoc(response);
      } catch (err) {
        console.error("Failed to auto-save document", err);
      } finally {
        setSaving(false);
      }
    }, 1500);
  };

  const saveChangesImmediately = async () => {
    if (!selectedDoc) return;
    try {
      const response = await updateWorkspaceDoc(selectedDoc.id, {
        title: editTitle,
        content_html: editHtml
      });
      setDocs(prev => prev.map(d => d.id === selectedDoc.id ? response : d));
      setSelectedDoc(response);
    } catch (err) {
      console.error("Failed to save doc immediately", err);
    }
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setEditTitle(val);
    triggerAutoSave(val, editHtml);
  };

  const handleEditorInput = (e) => {
    const val = e.target.innerHTML;
    setEditHtml(val);
    triggerAutoSave(editTitle, val);
  };

  // Format execution handler for rich text toolbar
  const executeFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const val = editorRef.current.innerHTML;
      setEditHtml(val);
      triggerAutoSave(editTitle, val);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="workspace-docs-layout">
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      
      {/* Sidebar List of Documents */}
      <div className="docs-list-sidebar bg-white border-end">
        <div className="docs-sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom">
          <span className="fw-bold text-slate-800">Space Wiki / Docs</span>
          <Button variant="primary" size="sm" onClick={handleCreateDoc} className="p-1 px-2 d-flex align-items-center gap-1">
            <Plus size={14} /> New
          </Button>
        </div>

        <div className="docs-list-scroll">
          {docs.length === 0 ? (
            <div className="text-center py-4 px-2 text-muted small">
              <FileText size={28} className="text-slate-300 mb-2" />
              <div>No docs created yet. Create one to write space resources.</div>
            </div>
          ) : (
            docs.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => handleSelectDoc(doc)}
                className={`doc-sidebar-item d-flex align-items-center justify-content-between p-3 cursor-pointer ${selectedDoc?.id === doc.id ? "active" : ""}`}
              >
                <div className="d-flex align-items-center gap-2 text-truncate flex-grow-1">
                  <FileText size={16} className={selectedDoc?.id === doc.id ? "text-primary" : "text-slate-400"} />
                  <span className="doc-sidebar-title text-truncate">{doc.title}</span>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="delete-doc-btn p-0 text-danger"
                  onClick={(e) => handleDeleteDoc(doc.id, e)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="docs-content-editor flex-grow-1 bg-light p-4 d-flex flex-col">
        {selectedDoc ? (
          <div className="doc-editor-surface bg-white shadow-sm border rounded-4 d-flex flex-column h-100 p-4">
            
            {/* Header controls: Save status and delete button */}
            <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Created by: {selectedDoc.created_by_name}</span>
                {saving ? (
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-flex align-items-center gap-1 small py-1">
                    <Spinner size="sm" animation="border" style={{ width: 10, height: 10 }} /> Saving...
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 small py-1">
                    <CheckCircle size={10} /> Saved
                  </span>
                )}
              </div>
              <Button variant="outline-danger" size="sm" onClick={(e) => handleDeleteDoc(selectedDoc.id, e)} className="d-flex align-items-center gap-1">
                <Trash2 size={14} /> Delete
              </Button>
            </div>

            {/* Document Title input */}
            <input
              type="text"
              className="doc-title-input font-bold text-slate-800 border-0 mb-3 w-100"
              style={{ fontSize: "24px", outline: "none" }}
              value={editTitle}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
            />

            {/* Formatting Toolbar */}
            <div className="doc-formatting-toolbar btn-group mb-3 p-1 bg-light border rounded-3 align-items-center flex-wrap" role="group">
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("bold")} title="Bold">
                <strong>B</strong>
              </Button>
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("italic")} title="Italic">
                <em>I</em>
              </Button>
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("underline")} title="Underline">
                <u>U</u>
              </Button>
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("strikeThrough")} title="Strike">
                <s>S</s>
              </Button>
              <span className="toolbar-divider mx-1 bg-slate-300" style={{ width: 1, height: 16 }} />
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("insertUnorderedList")} title="Bullet List">
                • List
              </Button>
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("insertOrderedList")} title="Numbered List">
                1. List
              </Button>
              <span className="toolbar-divider mx-1 bg-slate-300" style={{ width: 1, height: 16 }} />
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2 font-bold" onClick={() => executeFormat("formatBlock", "H3")} title="Heading">
                H3
              </Button>
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("formatBlock", "P")} title="Normal Text">
                Paragraph
              </Button>
              <span className="toolbar-divider mx-1 bg-slate-300" style={{ width: 1, height: 16 }} />
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("foreColor", "#673de6")} title="ELA Purple Text">
                🎨 Purple
              </Button>
              <Button variant="link" size="sm" className="text-slate-600 hover-text-primary px-2" onClick={() => executeFormat("removeFormat")} title="Clear styles">
                Clear Styles
              </Button>
            </div>

            {/* ContentEditable Paper-like typing area */}
            <div 
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              className="doc-editable-content-area flex-grow-1 p-3 border rounded-3 w-100"
              style={{ minHeight: "300px", outline: "none", overflowY: "auto" }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedDoc.content_html || "") }}
            />
          </div>
        ) : (
          <div className="doc-empty-state-surface bg-white shadow-sm border rounded-4 d-flex flex-column justify-content-center align-items-center p-5 text-center h-100">
            <FileText size={64} className="text-slate-300 mb-3" />
            <h3 className="fw-bold text-slate-800 mb-2">Workspace Wiki & Docs</h3>
            <p className="text-muted max-w-sm mb-4">
              Write standard operating procedures, documentation, class resources, or meeting notes for your workspace here.
            </p>
            <Button variant="primary" onClick={handleCreateDoc}>
              Create Document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsView;
