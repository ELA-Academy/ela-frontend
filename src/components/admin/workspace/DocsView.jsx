import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button, Form, Spinner, Alert, Modal, Dropdown } from "react-bootstrap";
import { 
  Plus, Trash2, FileText, CheckCircle, Save, Edit3, ArrowLeft, 
  Share2, MessageSquare, Download, Send, Star, X, Unlock, Lock, 
  Link2, Undo2, Redo2, CheckSquare, Globe, Users, Folder, Sparkles,
  Calendar as CalendarIcon, Clock, Mail, Bell, BellOff, Paperclip,
  Menu, Search, Printer, Paintbrush, Image
} from "lucide-react";
import api from "../../../utils/api";
import { getWorkspaceDocs, createWorkspaceDoc, updateWorkspaceDoc, deleteWorkspaceDoc } from "../../../services/boardService";
import DOMPurify from "dompurify";
import "../../../styles/Boards.css";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

const DocsView = ({ boardId, assignees = [], departments = [] }) => {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Doc editing temporary states
  const [editTitle, setEditTitle] = useState("");
  const [editHtml, setEditHtml] = useState("");
  
  // Right Sidebar toggles & tabs
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState("comments"); // 'comments' | 'export'
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  
  // Comments Tab states
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [assignCommentTo, setAssignCommentTo] = useState(""); // user id
  const [commentsFilter, setCommentsFilter] = useState("open"); // 'open' | 'assigned' | 'resolved'
  
  // Share Modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  
  // Font styling options
  const [currentFont, setCurrentFont] = useState("Outfit");
  const [currentFontSize, setCurrentFontSize] = useState("14px");

  // Selection range and Google Docs states
  const savedRangeRef = useRef(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [zoomScale, setZoomScale] = useState(100);
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  };
  
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const loadedDocIdRef = useRef(null);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceDocs(boardId);
      setDocs(data);
      if (data.length > 0) {
        const searchParams = new URLSearchParams(window.location.search);
        const urlDocId = searchParams.get("docId");
        
        let currentSelected = data[0];
        if (urlDocId) {
          const matched = data.find(d => d.id === Number(urlDocId));
          if (matched) {
            currentSelected = matched;
          } else if (selectedDoc) {
            currentSelected = data.find(d => d.id === selectedDoc.id) || data[0];
          }
        } else if (selectedDoc) {
          currentSelected = data.find(d => d.id === selectedDoc.id) || data[0];
        }
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

  // Load comments when selected doc changes
  useEffect(() => {
    if (selectedDoc) {
      fetchComments(selectedDoc.id);
    }
  }, [selectedDoc?.id]);

  const fetchComments = async (docId) => {
    try {
      setLoadingComments(true);
      const res = await api.get(`/boards/docs/${docId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Sync editor HTML only when a new document is selected to preserve caret position
  useEffect(() => {
    if (selectedDoc && editorRef.current) {
      if (loadedDocIdRef.current !== selectedDoc.id) {
        editorRef.current.innerHTML = selectedDoc.content_html || "";
        loadedDocIdRef.current = selectedDoc.id;
      }
    } else if (!selectedDoc && editorRef.current) {
      editorRef.current.innerHTML = "";
      loadedDocIdRef.current = null;
    }
  }, [selectedDoc]);

  const handleSelectDoc = (doc) => {
    if (saveTimeoutRef.current) {
      // Force save outstanding changes
      clearTimeout(saveTimeoutRef.current);
      saveChangesImmediately();
    }
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditHtml(doc.content_html || "");
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

  const handleEditorInput = () => {
    if (editorRef.current) {
      const val = editorRef.current.innerHTML;
      setEditHtml(val);
      triggerAutoSave(editTitle, val);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const plainText = e.clipboardData.getData("text/plain");

    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const cleanNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.cloneNode(true);
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return null;
        }

        const tagName = node.tagName.toLowerCase();
        const allowedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "table", "tbody", "thead", "tr", "td", "th", "div", "blockquote", "pre", "a"];
        if (!allowedTags.includes(tagName)) {
          const fragment = document.createDocumentFragment();
          node.childNodes.forEach(child => {
            const cleanedChild = cleanNode(child);
            if (cleanedChild) fragment.appendChild(cleanedChild);
          });
          return fragment;
        }

        const newEl = document.createElement(tagName);

        if (tagName === "a") {
          newEl.setAttribute("href", node.getAttribute("href") || "#");
          newEl.setAttribute("target", "_blank");
        }

        const style = node.getAttribute("style");
        if (style) {
          const stylesToKeep = [];
          const styleParts = style.split(";");
          styleParts.forEach(part => {
            const [prop, val] = part.split(":").map(s => s?.trim().toLowerCase());
            if (prop && val) {
              if (prop === "font-weight" && (val === "bold" || val === "700" || val === "800")) {
                stylesToKeep.push("font-weight: bold");
              } else if (prop === "font-style" && val === "italic") {
                stylesToKeep.push("font-style: italic");
              } else if (prop === "text-decoration" && val.includes("underline")) {
                stylesToKeep.push("text-decoration: underline");
              } else if (prop === "text-align" && ["left", "center", "right", "justify"].includes(val)) {
                stylesToKeep.push(`text-align: ${val}`);
              } else if (prop === "color") {
                stylesToKeep.push(`color: ${val}`);
              } else if (prop === "background-color") {
                stylesToKeep.push(`background-color: ${val}`);
              }
            }
          });
          if (stylesToKeep.length > 0) {
            newEl.setAttribute("style", stylesToKeep.join("; "));
          }
        }

        node.childNodes.forEach(child => {
          const cleanedChild = cleanNode(child);
          if (cleanedChild) newEl.appendChild(cleanedChild);
        });

        return newEl;
      };

      const body = doc.body;
      const fragment = document.createDocumentFragment();
      body.childNodes.forEach(child => {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) fragment.appendChild(cleanedChild);
      });

      const tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment);

      document.execCommand("insertHTML", false, tempDiv.innerHTML);
    } else if (plainText) {
      document.execCommand("insertText", false, plainText);
    }

    setTimeout(handleEditorInput, 50);
  };

  // Executing rich-text command
  const executeFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  // Font family handler
  const handleFontFamily = (font) => {
    setCurrentFont(font);
    executeFormat("fontName", font);
  };

  // Custom Font Size handler using range wrapping
  const handleFontSize = (size) => {
    setCurrentFontSize(size);
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = size;
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
      handleEditorInput();
    } catch (e) {
      executeFormat("fontSize", "4"); // Fallback
    }
  };

  const handleFontSizeChange = (newSize) => {
    let parsedSize = parseInt(newSize, 10);
    if (isNaN(parsedSize)) return;
    if (parsedSize < 8) parsedSize = 8;
    if (parsedSize > 72) parsedSize = 72;
    const finalSize = parsedSize + "px";
    handleFontSize(finalSize);
  };

  const incrementFontSize = () => {
    const parsed = parseInt(currentFontSize, 10) || 14;
    handleFontSizeChange(parsed + 1);
  };

  const decrementFontSize = () => {
    const parsed = parseInt(currentFontSize, 10) || 14;
    handleFontSizeChange(parsed - 1);
  };

  // Insert checklist checkbox
  const handleInsertChecklist = () => {
    const checklistHtml = `
      <div class="editor-checklist-item" style="display: flex; align-items: center; gap: 8px; margin: 6px 0;">
        <input type="checkbox" style="width: 14px; height: 14px; cursor: pointer; border-radius: 4px;" onclick="this.setAttribute('checked', this.checked ? 'true' : '')" />
        <span style="outline: none;">Checklist item</span>
      </div>
      <p><br></p>
    `;
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const div = document.createElement("div");
    div.innerHTML = checklistHtml;
    range.insertNode(div.firstChild);
    handleEditorInput();
  };

  // Table Grid Picker handler
  const handleTableGridSelect = (rows, cols) => {
    restoreSelection();
    let tableMarkup = '<table class="zbot-editor-table" style="width:100%; border-collapse:collapse; margin: 16px 0; border: 1px solid #cbd5e1;"><tbody>';
    for (let r = 0; r < rows; r++) {
      tableMarkup += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableMarkup += '<td style="border: 1px solid #cbd5e1; padding: 8px;">Cell</td>';
      }
      tableMarkup += '</tr>';
    }
    tableMarkup += '</tbody></table><p><br></p>';

    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const div = document.createElement("div");
    div.innerHTML = tableMarkup;
    range.insertNode(div.firstChild);
    setHoveredRow(0);
    setHoveredCol(0);
    handleEditorInput();
  };

  // Inline Link Apply
  const handleLinkApply = (e) => {
    if (e) e.preventDefault();
    if (!linkUrl) return;
    restoreSelection();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        const linkNode = document.createElement("a");
        linkNode.href = linkUrl;
        linkNode.target = "_blank";
        linkNode.innerText = linkUrl;
        range.insertNode(linkNode);
        range.setStartAfter(linkNode);
        range.setEndAfter(linkNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        executeFormat("createLink", linkUrl);
      }
    }
    setLinkUrl("");
    handleEditorInput();
  };

  // Inline Image Apply
  const handleImageApply = (e) => {
    if (e) e.preventDefault();
    if (!imageUrl) return;
    restoreSelection();
    executeFormat("insertImage", imageUrl);
    setImageUrl("");
    handleEditorInput();
  };

  // Comments Operations
  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;
    const assignedId = assignCommentTo 
      ? Number(assignCommentTo.includes("_") ? assignCommentTo.split("_")[1] : assignCommentTo) 
      : null;
    try {
      const res = await api.post(`/boards/docs/${selectedDoc.id}/comments`, {
        content: newCommentText,
        assigned_to_user_id: assignedId
      });
      setComments(prev => [...prev, res.data]);
      setNewCommentText("");
      setAssignCommentTo("");
      toast.success("Comment added!");
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleResolveComment = async (commentId, currentlyResolved) => {
    try {
      const res = await api.put(`/boards/docs/comments/${commentId}/resolve`, {
        resolved: !currentlyResolved
      });
      setComments(prev => prev.map(c => c.id === commentId ? res.data : c));
      toast.success(currentlyResolved ? "Re-opened comment" : "Resolved comment!");
    } catch (err) {
      console.error("Failed to resolve comment", err);
    }
  };

  // Exporters
  const handleExportPDF = () => {
    if (!selectedDoc) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedDoc.title}</title>
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #334155; line-height: 1.6; }
            h1 { font-size: 28px; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${selectedDoc.title}</h1>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 24px;">Created by ${selectedDoc.created_by_name}</div>
          <div>${selectedDoc.content_html}</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportHTML = () => {
    if (!selectedDoc) return;
    const blob = new Blob([selectedDoc.content_html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedDoc.title.toLowerCase().replace(/\s+/g, "_")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertHtmlToMarkdown = (html) => {
    let md = html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '_$1_')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      .replace(/&nbsp;/g, ' ');
    md = md.replace(/<[^>]*>/g, '');
    return md;
  };

  const handleExportMarkdown = () => {
    if (!selectedDoc) return;
    const markdown = convertHtmlToMarkdown(selectedDoc.content_html);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedDoc.title.toLowerCase().replace(/\s+/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share Operations
  const handleTogglePublicShare = async (e) => {
    const isPublic = e.target.checked;
    try {
      const updated = {
        ...selectedDoc,
        is_public: isPublic,
        shared_user_ids: selectedDoc.shared_user_ids || [],
        shared_dept_ids: selectedDoc.shared_dept_ids || []
      };
      const res = await api.put(`/boards/docs/${selectedDoc.id}/share`, updated);
      setSelectedDoc(res.data);
      setDocs(prev => prev.map(d => d.id === selectedDoc.id ? res.data : d));
      toast.success(isPublic ? "Link sharing enabled" : "Document made private");
    } catch (err) {
      console.error("Failed to update public share", err);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUserId) return;
    const [type, idStr] = inviteUserId.split("_");
    const targetId = Number(idStr);

    if (type === "user") {
      try {
        const currentUsers = selectedDoc.shared_user_ids || [];
        if (currentUsers.includes(targetId)) {
          setInviteStatus("Already shared with this user");
          return;
        }
        const updatedUsers = [...currentUsers, targetId];
        const updated = {
          ...selectedDoc,
          shared_user_ids: updatedUsers,
          shared_dept_ids: selectedDoc.shared_dept_ids || []
        };
        const res = await api.put(`/boards/docs/${selectedDoc.id}/share`, updated);
        setSelectedDoc(res.data);
        setDocs(prev => prev.map(d => d.id === selectedDoc.id ? res.data : d));
        setInviteUserId("");
        setInviteStatus("Shared successfully!");
        setTimeout(() => setInviteStatus(""), 3000);
      } catch (err) {
        console.error("Failed to share with user", err);
      }
    } else if (type === "dept") {
      try {
        const currentDepts = selectedDoc.shared_dept_ids || [];
        if (currentDepts.includes(targetId)) {
          setInviteStatus("Already shared with this department");
          return;
        }
        const updatedDepts = [...currentDepts, targetId];
        const updated = {
          ...selectedDoc,
          shared_user_ids: selectedDoc.shared_user_ids || [],
          shared_dept_ids: updatedDepts
        };
        const res = await api.put(`/boards/docs/${selectedDoc.id}/share`, updated);
        setSelectedDoc(res.data);
        setDocs(prev => prev.map(d => d.id === selectedDoc.id ? res.data : d));
        setInviteUserId("");
        setInviteStatus("Shared successfully!");
        setTimeout(() => setInviteStatus(""), 3000);
      } catch (err) {
        console.error("Failed to share with department", err);
      }
    }
  };

  const handleToggleDeptShare = async (deptId, e) => {
    const active = e.target.checked;
    try {
      const currentDepts = selectedDoc.shared_dept_ids || [];
      let updatedDepts;
      if (active) {
        updatedDepts = [...currentDepts, Number(deptId)];
      } else {
        updatedDepts = currentDepts.filter(id => id !== Number(deptId));
      }
      const updated = {
        ...selectedDoc,
        shared_user_ids: selectedDoc.shared_user_ids || [],
        shared_dept_ids: updatedDepts
      };
      const res = await api.put(`/boards/docs/${selectedDoc.id}/share`, updated);
      setSelectedDoc(res.data);
      setDocs(prev => prev.map(d => d.id === selectedDoc.id ? res.data : d));
    } catch (err) {
      console.error("Failed to toggle department share", err);
    }
  };

  const handleToggleUserShare = async (userId, active) => {
    try {
      const currentUsers = selectedDoc.shared_user_ids || [];
      let updatedUsers;
      if (active) {
        updatedUsers = [...currentUsers, Number(userId)];
      } else {
        updatedUsers = currentUsers.filter(id => id !== Number(userId));
      }
      const updated = {
        ...selectedDoc,
        shared_user_ids: updatedUsers,
        shared_dept_ids: selectedDoc.shared_dept_ids || []
      };
      const res = await api.put(`/boards/docs/${selectedDoc.id}/share`, updated);
      setSelectedDoc(res.data);
      setDocs(prev => prev.map(d => d.id === selectedDoc.id ? res.data : d));
    } catch (err) {
      console.error("Failed to toggle user share", err);
    }
  };

  // Filter comments
  const filteredComments = comments.filter(c => {
    if (commentsFilter === "open") return !c.resolved;
    if (commentsFilter === "resolved") return c.resolved;
    if (commentsFilter === "assigned") return !c.resolved && c.assigned_to_user_id === assignees.find(a => a.name === selectedDoc.created_by_name)?.id;
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="workspace-docs-layout" style={{ display: "flex", height: "calc(100vh - 160px)", overflow: "hidden" }}>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")} style={{ position: "fixed", top: 20, right: 20, zIndex: 1100 }}>{error}</Alert>}
      
      {/* Sidebar List of Documents */}
      {showLeftSidebar && (
        <div className="docs-list-sidebar bg-white border-end" style={{ width: "240px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div className="docs-sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom">
          <span className="fw-bold text-slate-800" style={{ fontSize: "12px" }}>Space Wiki & Docs</span>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleCreateDoc} 
            className="p-1 px-2 d-flex align-items-center gap-1 font-bold" 
            style={{ fontSize: "11px" }}
            disabled={saving}
          >
            {saving ? <Spinner size="sm" animation="border" /> : <><Plus size={14} /> New</>}
          </Button>
        </div>

        <div className="docs-list-scroll flex-grow-1" style={{ overflowY: "auto", padding: "8px" }}>
          {docs.length === 0 ? (
            <div className="text-center py-4 px-2 text-muted small">
              <FileText size={24} className="text-slate-300 mb-2" />
              <div style={{ fontSize: "10.5px" }}>No documents created yet.</div>
            </div>
          ) : (
            docs.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => handleSelectDoc(doc)}
                className={`doc-sidebar-item d-flex align-items-center justify-content-between p-2 rounded-2 mb-1 cursor-pointer ${selectedDoc?.id === doc.id ? "active" : ""}`}
                style={{
                  backgroundColor: selectedDoc?.id === doc.id ? "rgba(103, 61, 230, 0.08)" : "transparent",
                  color: selectedDoc?.id === doc.id ? "#673de6" : "#4b5563",
                  transition: "background 0.1s"
                }}
              >
                <div className="d-flex align-items-center gap-2 text-truncate flex-grow-1">
                  <FileText size={14} className={selectedDoc?.id === doc.id ? "text-primary" : "text-slate-400"} />
                  <span className="doc-sidebar-title text-truncate font-medium" style={{ fontSize: "11.5px" }}>{doc.title}</span>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="delete-doc-btn p-0 text-danger opacity-0"
                  onClick={(e) => handleDeleteDoc(doc.id, e)}
                  style={{ transition: "opacity 0.1s" }}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {/* Editor Surface */}
      <div className="docs-content-editor flex-grow-1 bg-white d-flex" style={{ overflow: "hidden" }}>
        {selectedDoc ? (
          <div className="d-flex flex-grow-1" style={{ overflow: "hidden" }}>
            
            {/* Editor page content */}
            <div className="editor-workspace flex-grow-1 p-3 d-flex flex-column" style={{ overflow: "hidden" }}>
              <div className="doc-editor-surface bg-white d-flex flex-column p-4 mx-auto h-100" style={{ maxWidth: "820px", width: "100%", height: "100%", overflow: "hidden" }}>
                
                {/* Header controls */}
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={() => setShowLeftSidebar(prev => !prev)}
                      className="d-flex align-items-center justify-content-center p-1.5 border-slate-200 text-slate-500 hover:text-slate-700 rounded-3 me-1"
                      style={{ width: "28px", height: "28px" }}
                      title="Toggle Docs List"
                    >
                      <Menu size={14} />
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => setShowShareModal(true)}
                      className="d-flex align-items-center gap-1 font-bold py-1 px-2.5"
                      style={{ fontSize: "11px", borderRadius: "6px" }}
                    >
                      <Share2 size={12} /> Share
                    </Button>
                    {saving ? (
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-flex align-items-center gap-1 py-1" style={{ fontSize: "10px" }}>
                        <Spinner size="sm" animation="border" style={{ width: 8, height: 8 }} /> Saving...
                      </span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 py-1" style={{ fontSize: "10px" }}>
                        <CheckCircle size={8} /> Saved
                      </span>
                    )}
                  </div>
                  
                  <div className="d-flex align-items-center gap-1">
                    <button 
                      type="button" 
                      onClick={() => { 
                        if (showRightSidebar && rightSidebarTab === "comments") {
                          setShowRightSidebar(false);
                        } else {
                          setShowRightSidebar(true);
                          setRightSidebarTab("comments");
                        }
                      }}
                      className={`btn btn-link text-slate-500 p-1.5 hover:bg-slate-50 rounded-2 position-relative ${showRightSidebar && rightSidebarTab === "comments" ? "text-primary bg-slate-50" : ""}`}
                      title="Comments"
                    >
                      <MessageSquare size={15} />
                      {comments.filter(c => !c.resolved).length > 0 && (
                        <span className="position-absolute top-0 end-0 bg-primary text-white rounded-circle font-bold d-flex align-items-center justify-content-center" style={{ width: 12, height: 12, fontSize: "7px" }}>
                          {comments.filter(c => !c.resolved).length}
                        </span>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { 
                        if (showRightSidebar && rightSidebarTab === "export") {
                          setShowRightSidebar(false);
                        } else {
                          setShowRightSidebar(true);
                          setRightSidebarTab("export");
                        }
                      }}
                      className={`btn btn-link text-slate-500 p-1.5 hover:bg-slate-50 rounded-2 ${showRightSidebar && rightSidebarTab === "export" ? "text-primary bg-slate-50" : ""}`}
                      title="Export Options"
                    >
                      <Download size={15} />
                    </button>
                    {showRightSidebar && (
                      <button 
                        type="button" 
                        onClick={() => setShowRightSidebar(false)}
                        className="btn btn-link text-slate-400 p-1.5 hover:bg-slate-50 rounded-2"
                        title="Close Sidebar"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Doc Link Badge & Title */}
                <div className="mb-2">
                  <button 
                    type="button" 
                    className="btn btn-link text-slate-400 p-0 text-decoration-none text-xs font-bold d-inline-flex align-items-center gap-1"
                    onClick={() => toast.info("Link Task or Doc is only active when referencing boards")}
                  >
                    <Link2 size={12} /> Link Task or Doc
                  </button>
                </div>
                
                <input
                  type="text"
                  className="doc-title-input font-bold text-slate-800 border-0 mb-2 w-100"
                  style={{ fontSize: "26px", outline: "none", letterSpacing: "-0.02em" }}
                  value={editTitle}
                  onChange={handleTitleChange}
                  placeholder="New Document"
                />

                <div className="d-flex align-items-center gap-2 text-slate-400 text-xs mb-3">
                  <span className="d-inline-flex align-items-center justify-content-center bg-purple-500 text-white rounded-circle font-bold" style={{ width: 16, height: 16, fontSize: "8px" }}>
                    {selectedDoc.created_by_name?.charAt(0).toUpperCase()}
                  </span>
                  <span>{selectedDoc.created_by_name}</span>
                  <span>•</span>
                </div>
                {/* Google Docs Styling WYSIWYG Toolbar */}
                <div className="doc-formatting-toolbar d-flex align-items-center gap-1 bg-transparent border-0 px-0 pb-2 mb-3 flex-wrap align-middle" style={{ zIndex: 10, borderBottom: "1px solid #eceff1" }}>
                  
                  {/* Search */}
                  <button type="button" className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Search" onClick={() => toast.info("Search within Doc is active")}>
                    <Search size={13} />
                  </button>

                  {/* Undo / Redo */}
                  <button type="button" onClick={() => executeFormat("undo")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Undo" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Undo2 size={12} />
                  </button>
                  <button type="button" onClick={() => executeFormat("redo")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Redo" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Redo2 size={12} />
                  </button>

                  {/* Print / Format Painter */}
                  <button type="button" onClick={() => window.print()} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Print" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Printer size={12} />
                  </button>
                  <button type="button" className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Paint Format" style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => toast.info("Format Paint copied!")}>
                    <Paintbrush size={12} />
                  </button>

                  <span className="toolbar-divider" />

                  {/* Zoom scale dropdown */}
                  <Dropdown>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-white border border-slate-300 text-xs py-1 px-2 d-flex align-items-center gap-1" style={{ height: "26px", fontSize: "11px" }}>
                      <span>{zoomScale}%</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-slate-100" style={{ fontSize: "11px", minWidth: "80px" }}>
                      {[50, 75, 90, 100, 125, 150].map(scale => (
                        <Dropdown.Item key={scale} onClick={() => setZoomScale(scale)}>
                          {scale}%
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <span className="toolbar-divider" />

                  {/* Paragraph styles dropdown */}
                  <Dropdown>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-white border border-slate-300 p-1 text-xs d-flex align-items-center justify-content-center" style={{ height: "26px", fontSize: "11px" }}>
                      <span>Normal text</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-slate-100" style={{ fontSize: "11px" }}>
                      <Dropdown.Item onClick={() => executeFormat("formatBlock", "P")}>Normal text</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("formatBlock", "H1")} style={{ fontSize: "18px", fontWeight: "bold" }}>Heading 1</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("formatBlock", "H2")} style={{ fontSize: "16px", fontWeight: "bold" }}>Heading 2</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("formatBlock", "H3")} style={{ fontSize: "14px", fontWeight: "bold" }}>Heading 3</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("formatBlock", "BLOCKQUOTE")} style={{ fontStyle: "italic", borderLeft: "3px solid #ddd", paddingLeft: "8px" }}>Subtitle</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("formatBlock", "PRE")} style={{ fontFamily: "monospace", backgroundColor: "#f8fafc" }}>Code Block</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  <span className="toolbar-divider" />

                  {/* Font Select */}
                  <Dropdown>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-white border border-slate-300 text-xs py-1 px-2 d-flex align-items-center gap-1" style={{ height: "26px", fontSize: "11px" }}>
                      <span>{currentFont}</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-slate-100" style={{ fontSize: "11px" }}>
                      {["Outfit", "Arial", "Georgia", "Courier New", "Times New Roman"].map(font => (
                        <Dropdown.Item key={font} onClick={() => handleFontFamily(font)} style={{ fontFamily: font }}>
                          {font}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <span className="toolbar-divider" />

                  {/* Font Size controls */}
                  <div className="d-flex align-items-center">
                    <button type="button" className="doc-fontsize-btn" onClick={decrementFontSize}>-</button>
                    <input 
                      type="text" 
                      className="doc-fontsize-input" 
                      value={parseInt(currentFontSize, 10) || 14} 
                      onChange={(e) => handleFontSizeChange(e.target.value)}
                    />
                    <button type="button" className="doc-fontsize-btn" onClick={incrementFontSize}>+</button>
                  </div>

                  <span className="toolbar-divider" />

                  {/* Basic Formatting */}
                  <button type="button" onClick={() => executeFormat("bold")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded font-bold" title="Bold" style={{ width: "24px", height: "24px" }}>B</button>
                  <button type="button" onClick={() => executeFormat("italic")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Italic" style={{ width: "24px", height: "24px", fontStyle: "italic" }}>I</button>
                  <button type="button" onClick={() => executeFormat("underline")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Underline" style={{ width: "24px", height: "24px", textDecoration: "underline" }}>U</button>
                  <button type="button" onClick={() => executeFormat("strikeThrough")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Strikethrough" style={{ width: "24px", height: "24px", textDecoration: "line-through" }}>S</button>

                  {/* Colors Dropdown */}
                  <Dropdown>
                    <Dropdown.Toggle size="sm" variant="light" className="btn-light bg-transparent text-slate-700 border-0 p-1 rounded d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }} title="Text Color">
                      <span className="font-bold text-xs" style={{ color: "#673de6", textDecoration: "underline" }}>A</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-0 p-2" style={{ width: "160px" }}>
                      <span className="text-slate-400 font-bold d-block mb-1 text-[9px] uppercase">Text Color</span>
                      <div className="d-flex flex-wrap gap-1">
                        {["#334155", "#673de6", "#e11d48", "#16a34a", "#ea580c", "#ca8a04", "#2563eb", "#db2777"].map(color => (
                          <div 
                            key={color} 
                            onClick={() => executeFormat("foreColor", color)}
                            style={{ width: "18px", height: "18px", borderRadius: "3px", backgroundColor: color, cursor: "pointer", border: "1px solid #cbd5e1" }}
                          />
                        ))}
                      </div>
                      <Dropdown.Divider />
                      <span className="text-slate-400 font-bold d-block mb-1 text-[9px] uppercase">Highlight Color</span>
                      <div className="d-flex flex-wrap gap-1">
                        {["#ffffff", "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#ddd6fe", "#cbd5e1"].map(color => (
                          <div 
                            key={color} 
                            onClick={() => executeFormat("backColor", color)}
                            style={{ width: "18px", height: "18px", borderRadius: "3px", backgroundColor: color, cursor: "pointer", border: "1px solid #cbd5e1" }}
                          />
                        ))}
                      </div>
                    </Dropdown.Menu>
                  </Dropdown>

                  <span className="toolbar-divider" />

                  {/* Inline Link dropdown */}
                  <Dropdown onToggle={(isOpen) => { if (isOpen) { saveSelection(); setLinkUrl(""); } }}>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-transparent border-0 p-1 rounded d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }} title="Insert Link">
                      <Link2 size={13} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="p-3 shadow-lg border-0" style={{ width: "260px", zIndex: 1010 }}>
                      <Form onSubmit={handleLinkApply}>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-xs text-slate-500 font-bold">Link URL</Form.Label>
                          <Form.Control 
                            size="sm" 
                            type="text" 
                            placeholder="https://example.com" 
                            value={linkUrl} 
                            onChange={(e) => setLinkUrl(e.target.value)} 
                            autoFocus
                          />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-1.5">
                          <Button size="sm" variant="primary" type="submit" className="text-xs px-3">Apply</Button>
                        </div>
                      </Form>
                    </Dropdown.Menu>
                  </Dropdown>

                  {/* Inline Comment Toggle */}
                  <button type="button" onClick={() => {
                    const selection = window.getSelection();
                    if (selection.toString().trim()) {
                      setShowRightSidebar(true);
                      setRightSidebarTab("comments");
                    } else {
                      toast.info("Select text to comment on first!");
                    }
                  }} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded d-flex align-items-center justify-content-center" title="Add Comment" style={{ width: "24px", height: "24px" }}>
                    <MessageSquare size={13} />
                  </button>

                  {/* Inline Image dropdown */}
                  <Dropdown onToggle={(isOpen) => { if (isOpen) { saveSelection(); setImageUrl(""); } }}>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-transparent border-0 p-1 rounded d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }} title="Insert Image">
                      <Image size={13} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="p-3 shadow-lg border-0" style={{ width: "260px", zIndex: 1010 }}>
                      <Form onSubmit={handleImageApply}>
                        <Form.Group className="mb-2">
                          <Form.Label className="text-xs text-slate-500 font-bold">Image URL</Form.Label>
                          <Form.Control 
                            size="sm" 
                            type="text" 
                            placeholder="https://example.com/image.png" 
                            value={imageUrl} 
                            onChange={(e) => setImageUrl(e.target.value)} 
                            autoFocus
                          />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-1.5">
                          <Button size="sm" variant="primary" type="submit" className="text-xs px-3">Insert</Button>
                        </div>
                      </Form>
                    </Dropdown.Menu>
                  </Dropdown>

                  <span className="toolbar-divider" />

                  {/* Alignment Dropdown */}
                  <Dropdown>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-white border border-slate-300 text-xs py-1 px-2 d-flex align-items-center gap-1" style={{ height: "26px", fontSize: "11px" }} title="Alignment">
                      <span className="font-bold">Align</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-slate-100" style={{ fontSize: "11px", minWidth: "90px" }}>
                      <Dropdown.Item onClick={() => executeFormat("justifyLeft")}>Left</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("justifyCenter")}>Center</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("justifyRight")}>Right</Dropdown.Item>
                      <Dropdown.Item onClick={() => executeFormat("justifyFull")}>Justify</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  {/* Spacing Dropdown */}
                  <Dropdown>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-white border border-slate-300 text-xs py-1 px-2 d-flex align-items-center gap-1" style={{ height: "26px", fontSize: "11px" }} title="Line Spacing">
                      <span className="font-bold">Spacing</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-slate-100" style={{ fontSize: "11px", minWidth: "80px" }}>
                      {["1.0", "1.15", "1.5", "2.0"].map(spacing => (
                        <Dropdown.Item key={spacing} onClick={() => {
                          const selection = window.getSelection();
                          if (!selection.rangeCount) return;
                          const range = selection.getRangeAt(0);
                          const span = document.createElement("span");
                          span.style.lineHeight = spacing;
                          span.style.display = "inline-block";
                          try {
                            span.appendChild(range.extractContents());
                            range.insertNode(span);
                          } catch(e) {
                            document.execCommand("insertHTML", false, `<span style="line-height:${spacing}; display:inline-block;">${selection.toString()}</span>`);
                          }
                          handleEditorInput();
                        }}>
                          {spacing}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <span className="toolbar-divider" />

                  {/* Checklist, Bullet List, Numbered List */}
                  <button type="button" onClick={handleInsertChecklist} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded" title="Checklist" style={{ width: "24px", height: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckSquare size={13} />
                  </button>
                  <button type="button" onClick={() => executeFormat("insertUnorderedList")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded font-bold" title="Bullet List" style={{ fontSize: "11px" }}>• List</button>
                  <button type="button" onClick={() => executeFormat("insertOrderedList")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded font-bold" title="Numbered List" style={{ fontSize: "11px" }}>1. List</button>

                  <span className="toolbar-divider" />

                  {/* Indents */}
                  <button type="button" onClick={() => executeFormat("outdent")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded text-xs" title="Decrease Indent" style={{ fontWeight: "bold" }}>&lt; Indent</button>
                  <button type="button" onClick={() => executeFormat("indent")} className="btn btn-light border-0 bg-transparent p-1 text-slate-700 hover:bg-slate-100 rounded text-xs" title="Increase Indent" style={{ fontWeight: "bold" }}>Indent &gt;</button>

                  <span className="toolbar-divider" />

                  {/* Table (Grid table picker dropdown) */}
                  <Dropdown onToggle={(isOpen) => { if (isOpen) { saveSelection(); setHoveredRow(0); setHoveredCol(0); } }}>
                    <Dropdown.Toggle size="sm" variant="light" className="text-slate-700 bg-white border border-slate-300 text-xs py-1 px-2 d-flex align-items-center gap-1" style={{ height: "26px", fontSize: "11px" }}>
                      <span>Table</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="p-0 shadow-lg border-0" style={{ zIndex: 1010 }}>
                      <div className="table-grid-picker p-2 bg-white" style={{ display: "inline-block" }}>
                        <div className="grid-container" style={{ display: "flex", flexDirection: "column", gap: "2px" }} onMouseLeave={() => { setHoveredRow(0); setHoveredCol(0); }}>
                          {Array.from({ length: 8 }).map((_, r) => (
                            <div key={r} style={{ display: "flex", gap: "2px" }}>
                              {Array.from({ length: 8 }).map((_, c) => {
                                const rowIndex = r + 1;
                                const colIndex = c + 1;
                                const isHighlighted = rowIndex <= hoveredRow && colIndex <= hoveredCol;
                                return (
                                  <div
                                    key={c}
                                    onMouseEnter={() => { setHoveredRow(rowIndex); setHoveredCol(colIndex); }}
                                    onClick={() => handleTableGridSelect(rowIndex, colIndex)}
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      border: isHighlighted ? "1px solid #1a73e8" : "1px solid #cbd5e1",
                                      backgroundColor: isHighlighted ? "#e8f0fe" : "transparent",
                                      cursor: "pointer",
                                      borderRadius: "2px",
                                      transition: "background-color 0.1s, border-color 0.1s"
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="text-center text-xs text-slate-500 font-bold mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                          {hoveredCol > 0 && hoveredRow > 0 ? `${hoveredCol} x ${hoveredRow}` : "Select size"}
                        </div>
                      </div>
                    </Dropdown.Menu>
                  </Dropdown>

                  <button type="button" onClick={() => executeFormat("removeFormat")} className="btn btn-light border-0 bg-transparent p-1 text-danger hover:bg-red-50 rounded ms-auto text-xs font-semibold" title="Clear Styles" style={{ padding: "3px 6px" }}>Clear</button>
                </div>

                {/* ContentEditable Paper-like typing area */}
                <div 
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onPaste={handlePaste}
                  className="doc-editable-content-area flex-grow-1 py-2 w-100 zbot-google-doc-editor"
                  style={{ flex: 1, outline: "none", overflowY: "auto", fontSize: "15px", fontFamily: currentFont, color: "#334155", paddingBottom: "80px", zoom: `${zoomScale}%` }}
                  suppressContentEditableWarning={true}
                />

                {/* Floating AI sparkles button */}
                <div className="d-flex justify-content-end mt-3">
                  <Button 
                    variant="primary" 
                    className="zbot-ai-magic-btn shadow-lg d-flex align-items-center gap-1.5 font-bold"
                    style={{
                      borderRadius: "999px",
                      padding: "8px 16px",
                      fontSize: "11.5px",
                      background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                      border: "none"
                    }}
                    onClick={() => toast.info("Workspace AI is processing document summary...")}
                  >
                    <Sparkles size={13} /> Write with AI
                  </Button>
                </div>
              </div>
            </div>

            {/* Collapsible Right Sidebar */}
            {showRightSidebar && (
              <div className="doc-right-sidebar bg-white border-start" style={{ width: "280px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                {/* Tabs Selector header */}
                <div className="d-flex border-bottom text-xs font-bold text-slate-500 bg-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setRightSidebarTab("comments")}
                    className={`flex-grow-1 py-3 text-center border-0 bg-transparent ${rightSidebarTab === "comments" ? "text-primary border-bottom border-primary font-extrabold" : ""}`}
                    style={{ fontSize: "11.5px", borderBottomWidth: "2px" }}
                  >
                    Comments
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRightSidebarTab("export")}
                    className={`flex-grow-1 py-3 text-center border-0 bg-transparent ${rightSidebarTab === "export" ? "text-primary border-bottom border-primary font-extrabold" : ""}`}
                    style={{ fontSize: "11.5px", borderBottomWidth: "2px" }}
                  >
                    Export
                  </button>
                </div>

                {/* Sidebar Body */}
                <div className="sidebar-tab-content flex-grow-1 p-3 d-flex flex-column" style={{ overflowY: "auto" }}>
                  {rightSidebarTab === "comments" && (
                    <div className="d-flex flex-column h-100">
                      {/* Comments Inner Sub-tabs */}
                      <div className="d-flex gap-1 mb-3 bg-slate-100 p-0.5 rounded-2" style={{ fontSize: "10.5px" }}>
                        {["open", "assigned", "resolved"].map(filterKey => (
                          <button 
                            key={filterKey}
                            type="button"
                            onClick={() => setCommentsFilter(filterKey)}
                            className={`btn btn-sm flex-grow-1 p-1 rounded font-bold border-0 text-[10px] uppercase ${commentsFilter === filterKey ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 bg-transparent"}`}
                          >
                            {filterKey === "open" ? "Open" : filterKey === "assigned" ? "Assigned" : "Resolved"}
                          </button>
                        ))}
                      </div>

                      {/* Comments Feed list */}
                      <div className="comments-list flex-grow-1 mb-3 d-flex flex-column gap-2" style={{ minHeight: "150px" }}>
                        {loadingComments ? (
                          <div className="text-center py-4"><Spinner size="sm" animation="border" /></div>
                        ) : filteredComments.length === 0 ? (
                          <div className="text-center py-5 text-muted small">
                            <MessageSquare size={24} className="text-slate-200 mb-2" />
                            <div>No comments in this section.</div>
                          </div>
                        ) : (
                          filteredComments.map(c => {
                            const assignee = assignees.find(a => a.id === c.assigned_to_user_id);
                            return (
                              <div key={c.id} className="comment-card bg-slate-50 border rounded-3 p-2.5">
                                <div className="d-flex justify-content-between align-items-start mb-1.5">
                                  <div className="d-flex align-items-center gap-1.5">
                                    <span className="avatar-initials bg-slate-400 text-white rounded-circle font-bold d-flex align-items-center justify-content-center" style={{ width: "16px", height: "16px", fontSize: "8px" }}>
                                      {c.created_by_name?.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="fw-bold text-slate-700 text-[11px]">{c.created_by_name}</span>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => handleResolveComment(c.id, c.resolved)}
                                    className="btn btn-link text-slate-400 hover:text-primary p-0 text-[10px] text-decoration-none font-bold"
                                  >
                                    {c.resolved ? "Reopen" : "Resolve"}
                                  </button>
                                </div>
                                <p className="m-0 text-slate-600 mb-1" style={{ fontSize: "11px", whiteSpace: "pre-wrap" }}>
                                  {c.content}
                                </p>
                                {assignee && (
                                  <div className="d-flex align-items-center gap-1 mt-1 border-top pt-1 border-slate-200">
                                    <span className="badge bg-warning-subtle text-warning font-bold p-1 text-[8.5px]">Assigned: {assignee.name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add comment Form */}
                      <Form onSubmit={handleAddComment} className="border-top pt-3 mt-auto">
                        <Form.Control 
                          as="textarea"
                          rows={2}
                          placeholder="Comment or type '/' for commands..."
                          className="text-xs mb-2 rounded-3 border-slate-200"
                          style={{ fontSize: "11.5px" }}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                        />
                        
                        <div className="d-flex align-items-center justify-content-between">
                          <select 
                            className="form-select form-select-sm text-[10px] w-auto border-slate-200 py-1"
                            style={{ fontSize: "10px", width: "120px" }}
                            value={assignCommentTo}
                            onChange={(e) => setAssignCommentTo(e.target.value)}
                          >
                            <option value="">Assign To...</option>
                            {assignees.map(a => (
                              <option key={`${a.role}_${a.id}`} value={`${a.role}_${a.id}`}>{a.name}</option>
                            ))}
                          </select>
                          <Button variant="primary" type="submit" size="sm" className="px-3 font-bold" style={{ fontSize: "10.5px" }}>
                            <Send size={11} className="me-1" /> Post
                          </Button>
                        </div>
                      </Form>
                    </div>
                  )}

                  {rightSidebarTab === "export" && (
                    <div className="d-flex flex-column gap-4">
                      {/* Export options */}
                      <div>
                        <span className="text-slate-400 font-bold d-block mb-2 text-[9px] uppercase tracking-wider">Export Range</span>
                        <div className="d-flex gap-3 mb-3" style={{ fontSize: "11.5px" }}>
                          <Form.Check 
                            type="radio"
                            id="export-this-page"
                            label="This page"
                            name="exportRange"
                            defaultChecked
                            className="text-slate-600 m-0"
                            style={{ fontSize: "11px" }}
                          />
                          <Form.Check 
                            type="radio"
                            id="export-entire-doc"
                            label="Entire Doc"
                            name="exportRange"
                            className="text-slate-600 m-0"
                            style={{ fontSize: "11px" }}
                          />
                        </div>

                        <span className="text-slate-400 font-bold d-block mb-2 text-[9px] uppercase tracking-wider">Export As</span>
                        <div className="d-flex flex-column gap-2">
                          <button onClick={handleExportPDF} type="button" className="btn btn-light bg-white border border-slate-200 text-slate-700 text-start py-2 px-3 hover:bg-slate-50 d-flex align-items-center justify-content-between" style={{ fontSize: "11.5px", borderRadius: "8px" }}>
                            <span>PDF</span>
                            <span className="text-[10px] text-slate-400">Print version</span>
                          </button>
                          <button onClick={handleExportHTML} type="button" className="btn btn-light bg-white border border-slate-200 text-slate-700 text-start py-2 px-3 hover:bg-slate-50 d-flex align-items-center justify-content-between" style={{ fontSize: "11.5px", borderRadius: "8px" }}>
                            <span>HTML</span>
                            <span className="text-[10px] text-slate-400">Web format</span>
                          </button>
                          <button onClick={handleExportMarkdown} type="button" className="btn btn-light bg-white border border-slate-200 text-slate-700 text-start py-2 px-3 hover:bg-slate-50 d-flex align-items-center justify-content-between" style={{ fontSize: "11.5px", borderRadius: "8px" }}>
                            <span>Markdown</span>
                            <span className="text-[10px] text-slate-400">Markdown page</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div className="doc-empty-state-surface bg-white shadow-sm border rounded-4 d-flex flex-column justify-content-center align-items-center p-5 text-center h-100 w-100 m-4">
            <FileText size={64} className="text-slate-200 mb-3" />
            <h3 className="fw-bold text-slate-800 mb-2">Workspace Wiki & Docs</h3>
            <p className="text-muted max-w-sm mb-4" style={{ fontSize: "12px" }}>
              Write standard operating procedures, documentation, class resources, or meeting notes for your workspace here.
            </p>
            <Button 
              variant="primary" 
              onClick={handleCreateDoc} 
              className="px-4 font-bold d-flex align-items-center gap-1.5" 
              style={{ borderRadius: "8px" }}
              disabled={saving}
            >
              {saving ? <Spinner size="sm" animation="border" /> : "Create Document"}
            </Button>
          </div>
        )}
      </div>

      {/* Share settings Modal */}
      {selectedDoc && (
        <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered className="zbot-share-modal" dialogClassName="zbot-share-modal-dialog">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "16px" }}>Share this Doc</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            <div className="mb-4">
              <span className="text-slate-500 font-bold d-block text-[11px] mb-2 uppercase">Share this Doc</span>
              <span className="text-[10px] text-slate-400 d-block mb-3">Sharing as a single view: <span className="fw-bold text-slate-700">{selectedDoc.title}</span></span>
              
              <div className="d-flex gap-2 mb-2">
                <select 
                  className="form-select form-select-sm text-xs border-slate-200"
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  style={{ fontSize: "11.5px" }}
                >
                  <option value="">Invite member or department...</option>
                  <optgroup label="Members">
                    {assignees.map(a => (
                      <option key={`user_${a.id}`} value={`user_${a.id}`}>{a.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Departments">
                    {departments.map(d => (
                      <option key={`dept_${d.id}`} value={`dept_${d.id}`}>{d.name}</option>
                    ))}
                  </optgroup>
                </select>
                <Button variant="primary" size="sm" onClick={handleInviteUser} className="font-bold px-3" style={{ fontSize: "11px" }}>
                  Invite
                </Button>
              </div>
              {inviteStatus && <span className="text-xs text-primary font-semibold">{inviteStatus}</span>}
            </div>

            {/* Share properties toggles */}
            <div className="d-flex flex-column gap-3 mb-4 border-top border-bottom py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className="fw-bold text-slate-800" style={{ fontSize: "12px" }}>
                    <Globe size={13} className="text-slate-400 me-2 mt-[-2px]" /> Share link with anyone
                  </span>
                </div>
                <Form.Check 
                  type="switch"
                  id="toggle-public-share"
                  checked={selectedDoc.is_public || false}
                  onChange={handleTogglePublicShare}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className="fw-bold text-slate-800" style={{ fontSize: "12px" }}>
                    <Link2 size={13} className="text-slate-400 me-2 mt-[-2px]" /> Private link
                  </span>
                </div>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/admin/messaging?conversation=${selectedDoc.id}`);
                    toast.success("Private link copied!");
                  }}
                  className="text-slate-700 bg-white border border-slate-200 font-bold px-2 py-1"
                  style={{ fontSize: "10px", borderRadius: "5px" }}
                >
                  Copy link
                </Button>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className="fw-bold text-slate-800" style={{ fontSize: "12px" }}>
                    <Download size={13} className="text-slate-400 me-2 mt-[-2px]" /> Export Doc
                  </span>
                </div>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleExportHTML} 
                  className="text-slate-700 bg-white border border-slate-200 font-bold px-2 py-1"
                  style={{ fontSize: "10px", borderRadius: "5px" }}
                >
                  Export
                </Button>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className="fw-bold text-slate-800" style={{ fontSize: "12px" }}>
                    <Lock size={13} className="text-slate-400 me-2 mt-[-2px]" /> Protect Doc
                  </span>
                </div>
                <Form.Check 
                  type="switch"
                  id="toggle-protect-doc"
                  defaultChecked
                />
              </div>
            </div>

            {/* Share list */}
            <div>
              <span className="text-slate-500 font-bold d-block text-[11px] mb-2 uppercase">Share with</span>
              
              {/* Department shares */}
              {departments.filter(d => (selectedDoc.shared_dept_ids || []).includes(d.id)).length > 0 && (
                <div className="mb-3">
                  <span className="text-slate-400 font-bold d-block text-[9px] mb-1.5 uppercase">Departments</span>
                  <div className="d-flex flex-column gap-2">
                    {departments.filter(d => (selectedDoc.shared_dept_ids || []).includes(d.id)).map(dept => (
                      <div key={dept.id} className="d-flex justify-content-between align-items-center p-1.5 px-2 bg-slate-50/50 border rounded-2">
                        <span className="text-slate-700 fw-medium" style={{ fontSize: "11px" }}>{dept.name}</span>
                        <button 
                          type="button" 
                          className="btn btn-link text-danger p-0 m-0 border-0 d-flex align-items-center"
                          onClick={() => handleToggleDeptShare(dept.id, { target: { checked: false } })}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual user shares */}
              {assignees.filter(member => (selectedDoc.shared_user_ids || []).includes(member.id)).length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold d-block text-[9px] mb-1.5 uppercase">Workspace Members</span>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
                    {assignees.filter(member => (selectedDoc.shared_user_ids || []).includes(member.id)).map(member => (
                      <div key={`${member.role}_${member.id}`} className="d-flex justify-content-between align-items-center p-1.5 px-2 border rounded-2">
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="avatar-sm bg-purple-100 text-purple-700 rounded-circle font-bold d-flex align-items-center justify-content-center" style={{ width: 20, height: 20, fontSize: "9px" }}>
                            {member.name?.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-slate-700 font-medium" style={{ fontSize: "11px" }}>{member.name}</span>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-link text-danger p-0 m-0 border-0 d-flex align-items-center"
                          onClick={() => handleToggleUserShare(member.id, false)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when no one has been added */}
              {departments.filter(d => (selectedDoc.shared_dept_ids || []).includes(d.id)).length === 0 &&
               assignees.filter(member => (selectedDoc.shared_user_ids || []).includes(member.id)).length === 0 && (
                <span className="text-xs text-slate-400 italic">No workspace members or departments have been invited yet.</span>
              )}
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default DocsView;
