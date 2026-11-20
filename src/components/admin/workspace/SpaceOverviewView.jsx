import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Spinner, Modal } from "react-bootstrap";
import {
  Plus,
  Settings,
  Filter,
  Maximize2,
  Trash2,
  Bookmark,
  FolderOpen,
  FileText,
  Clock,
  ExternalLink,
  Download,
  ChevronRight,
  List,
  Lock,
  RotateCw,
  Calculator,
  BarChart3,
  Flag,
  Users,
  StickyNote,
  ListChecks
} from "lucide-react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

import {
  getOverviewCards,
  createOverviewCard,
  deleteOverviewCard,
  getCardAggregate,
  getSpaceChildren,
  getSpaceRecent,
  getSpaceDocs,
  getBookmarks,
  createBookmark,
  deleteBookmark,
  generateReport
} from "../../../services/overviewService";
import CardSettingsModal from "./CardSettingsModal";
import "../../../styles/SpaceOverviewView.css";

const SpaceOverviewView = ({ board, boards = [], assignees = [] }) => {
  const navigate = useNavigate();
  const spaceId = board?.id;

  // Overview data states
  const [cards, setCards] = useState([]);
  const [cardValues, setCardValues] = useState({});
  const [recentItems, setRecentItems] = useState({ items: [], tasks: [], docs: [] });
  const [spaceDocs, setSpaceDocs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [spaceChildren, setSpaceChildren] = useState({ folders: [], lists: [] });

  // Modal / Interaction states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [modalTab, setModalTab] = useState("settings");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCardGallery, setShowCardGallery] = useState(false);

  const CARD_TEMPLATES = [
    {
      type: "calculation",
      title: "Calculation / Running Total",
      desc: "Track running totals, sums, averages, min/max, or counts from any list column (e.g., Event Expenses) with an optional budget target.",
      icon: Calculator,
      color: "#2563eb",
      bg: "#eff6ff",
      defaultName: "Running Total"
    },
    {
      type: "task_list",
      title: "Task List",
      desc: "Embed a live filtered list of tasks from any list in this space, including custom field values and one-click task navigation.",
      icon: ListChecks,
      color: "#059669",
      bg: "#ecfdf5",
      defaultName: "Embedded Task List"
    },
    {
      type: "status_breakdown",
      title: "Tasks by Status",
      desc: "Visualize task progress across To Do, In Progress, and Completed with percentage breakdown bars.",
      icon: BarChart3,
      color: "#7c3aed",
      bg: "#f5f3ff",
      defaultName: "Tasks by Status"
    },
    {
      type: "priority_breakdown",
      title: "Tasks by Priority",
      desc: "Monitor Urgent, High, Normal, and Low priority workload across a list or the entire space.",
      icon: Flag,
      color: "#d97706",
      bg: "#fffbeb",
      defaultName: "Tasks by Priority"
    },
    {
      type: "assignee_workload",
      title: "Tasks by Assignee",
      desc: "See how tasks are distributed across team members to spot bottlenecks quickly.",
      icon: Users,
      color: "#0284c7",
      bg: "#f0f9ff",
      defaultName: "Workload by Assignee"
    },
    {
      type: "notes",
      title: "Text / Notes Card",
      desc: "Pin event budget summaries, guidelines, or key notes directly onto your Space Overview.",
      icon: StickyNote,
      color: "#475569",
      bg: "#f8fafc",
      defaultName: "Space Notes"
    }
  ];

  // Inline title editing
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardTitle, setEditingCardTitle] = useState("");

  const handleStartTitleEdit = (card, e) => {
    e.stopPropagation();
    setEditingCardId(card.id);
    setEditingCardTitle(card.name);
  };

  const handleSaveInlineTitle = async (cardId) => {
    if (!editingCardTitle.trim()) {
      setEditingCardId(null);
      return;
    }
    const newTitle = editingCardTitle.trim();
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, name: newTitle } : c)));
    setEditingCardId(null);

    try {
      const { updateOverviewCard } = await import("../../../services/overviewService");
      await updateOverviewCard(spaceId, cardId, { name: newTitle });
    } catch (err) {
      console.error("Failed to rename card:", err);
    }
  };

  // Bookmark inline add state
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [bookmarkUrl, setBookmarkUrl] = useState("");
  const [addingBookmark, setAddingBookmark] = useState(false);

  // Extract all child lists under this space for data source options
  const childLists = useMemo(() => {
    if (!spaceChildren) return [];
    const directLists = spaceChildren.lists || [];
    const folderLists = (spaceChildren.folders || []).flatMap((f) => f.children || []);
    return [...directLists, ...folderLists];
  }, [spaceChildren]);

  // Load all overview data
  const loadOverviewData = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const [cardsRes, recentRes, docsRes, bookmarksRes, childrenRes] = await Promise.all([
        getOverviewCards(spaceId).catch(() => ({ data: [] })),
        getSpaceRecent(spaceId).catch(() => ({ data: { items: [], tasks: [], docs: [] } })),
        getSpaceDocs(spaceId).catch(() => ({ data: [] })),
        getBookmarks(spaceId).catch(() => ({ data: [] })),
        getSpaceChildren(spaceId).catch(() => ({ data: { folders: [], lists: [] } })),
      ]);

      const fetchedCards = cardsRes.data || [];
      setCards(fetchedCards);
      setRecentItems(recentRes.data || { items: [], tasks: [], docs: [] });
      setSpaceDocs(docsRes.data || []);
      setBookmarks(bookmarksRes.data || []);
      setSpaceChildren(childrenRes.data || { folders: [], lists: [] });

      // Fetch aggregates for calculation cards
      fetchCardAggregates(fetchedCards);
    } catch (err) {
      console.error("Error loading space overview:", err);
      toast.error("Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  const fetchCardAggregates = async (cardsList) => {
    const values = {};
    await Promise.all(
      cardsList.map(async (card) => {
        try {
          const res = await getCardAggregate(spaceId, card.id);
          values[card.id] = res.data;
        } catch (e) {
          values[card.id] = { value: 0, count: 0, breakdown: [], tasks: [] };
        }
      })
    );
    setCardValues(values);
  };

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Manual refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  // Add a new overview card of any ClickUp-style type
  const handleAddCard = async (type = "calculation", defaultName = "New Card") => {
    try {
      setShowCardGallery(false);
      const defaultList = childLists[0];
      const newCardData = {
        name: defaultName,
        card_type: type,
        data_source_board_id: type === "calculation" && defaultList ? (defaultList.internal_id || defaultList.id) : null,
        calculation: "sum",
        units: type === "calculation" ? "$" : "None",
        filters: type === "calculation" ? { show_closed: true } : {}
      };

      const res = await createOverviewCard(spaceId, newCardData);
      const newCard = res.data;
      setCards((prev) => [...prev, newCard]);

      try {
        const aggRes = await getCardAggregate(spaceId, newCard.id);
        setCardValues((prev) => ({ ...prev, [newCard.id]: aggRes.data }));
      } catch (e) {}

      setSelectedCardForModal(newCard);
      setModalTab("settings");
      setShowSettingsModal(true);
      toast.success("Card added to overview");
    } catch (err) {
      console.error("Failed to create card:", err);
      toast.error("Failed to add card.");
    }
  };

  // Delete card
  const handleDeleteCard = async (cardId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    try {
      await deleteOverviewCard(spaceId, cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      toast.info("Card deleted");
    } catch (err) {
      toast.error("Failed to delete card");
    }
  };

  // Open settings modal for a card
  const handleOpenCardModal = (card, tab = "settings", e) => {
    if (e) e.stopPropagation();
    setSelectedCardForModal(card);
    setModalTab(tab);
    setShowSettingsModal(true);
  };

  // Callback when settings modal saves
  const handleCardSettingsSaved = async (updatedCard) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    try {
      const res = await getCardAggregate(spaceId, updatedCard.id);
      setCardValues((prev) => ({ ...prev, [updatedCard.id]: res.data }));
    } catch (e) {
      /* ignore */
    }
  };

  // Add bookmark
  const handleAddBookmarkSubmit = async (e) => {
    e.preventDefault();
    if (!bookmarkTitle.trim()) return;

    setAddingBookmark(true);
    try {
      const res = await createBookmark(spaceId, {
        title: bookmarkTitle.trim(),
        url: bookmarkUrl.trim() || "#",
        bookmark_type: "url"
      });
      setBookmarks((prev) => [...prev, res.data]);
      setBookmarkTitle("");
      setBookmarkUrl("");
      setShowAddBookmark(false);
      toast.success("Bookmark added");
    } catch (err) {
      toast.error("Failed to add bookmark");
    } finally {
      setAddingBookmark(false);
    }
  };

  // Delete bookmark
  const handleDeleteBookmark = async (bookmarkId, e) => {
    e.stopPropagation();
    try {
      await deleteBookmark(spaceId, bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      toast.info("Bookmark removed");
    } catch (err) {
      toast.error("Failed to remove bookmark");
    }
  };

  // Generate Report
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await generateReport(spaceId);
      toast.success("Overview Report generated into Space Docs!");
      const docsRes = await getSpaceDocs(spaceId);
      setSpaceDocs(docsRes.data || []);
      if (res.data?.doc_id) {
        navigate(`/admin/boards/${spaceId}?tab=docs&docId=${res.data.doc_id}`);
      }
    } catch (err) {
      console.error("Generate report failed:", err);
      toast.error("Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatCardValue = (val, units) => {
    if (val === undefined || val === null) return "0";
    let formattedVal = typeof val === "number" ? val.toLocaleString("en-US", { maximumFractionDigits: 2 }) : val;
    if (units === "$") return `$ ${formattedVal}`;
    if (units === "€") return `€ ${formattedVal}`;
    if (units === "%") return `${formattedVal}%`;
    return formattedVal;
  };

  // Combined recent items to show in Recent Card
  const displayRecentItems = useMemo(() => {
    if (recentItems?.items && recentItems.items.length > 0) {
      return recentItems.items;
    }
    // Fallback: construct from spaceChildren if recentItems.items was empty
    const items = [];
    (spaceChildren?.folders || []).forEach((f) => {
      items.push({
        id: f.id,
        name: f.name,
        type: "folder",
        is_folder: true,
        parent_name: board?.name || "Space",
        is_private: f.is_private
      });
      (f.children || []).forEach((sl) => {
        items.push({
          id: sl.id,
          name: sl.name,
          type: "list",
          is_folder: false,
          parent_name: f.name,
          is_private: sl.is_private
        });
      });
    });
    (spaceChildren?.lists || []).forEach((l) => {
      items.push({
        id: l.id,
        name: l.name,
        type: "list",
        is_folder: false,
        parent_name: board?.name || "Space",
        is_private: l.is_private
      });
    });
    return items;
  }, [recentItems, spaceChildren, board]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2 text-muted">Loading Space Overview...</span>
      </div>
    );
  }

  return (
    <div className="space-overview-container">
      {/* Top Header Controls Bar - ClickUp Style */}
      <div className="overview-header-toolbar d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="overview-title fw-bold text-slate-800 m-0">Overview</h2>
          <span className="text-muted small">Aggregated metrics, recent items, and location assets for this space</span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-1.5 text-muted p-0 border-0"
            style={{ fontSize: "12px" }}
            onClick={handleManualRefresh}
            title="Refresh overview data"
          >
            <RotateCw size={13} className={`text-slate-400 ${refreshing ? "spin-animation" : ""}`} />
            <span>Refreshed: just now</span>
          </button>

          <div
            className="badge bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-pill fw-medium"
            style={{ fontSize: "11px" }}
          >
            Auto refresh: On
          </div>

          {/* Generate Report Button */}
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-flex align-items-center gap-1.5 rounded-3 border-slate-300 shadow-sm"
            onClick={handleGenerateReport}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Download size={14} className="text-indigo-600" />
            )}
            <span>Generate Report</span>
          </Button>

          {/* + Card Button */}
          <Button
            variant="dark"
            size="sm"
            className="d-flex align-items-center gap-1 bg-slate-900 border-0 rounded-3 px-3 py-1.5 fw-medium shadow-sm"
            onClick={() => setShowCardGallery(true)}
          >
            <Plus size={16} />
            <span>Add Card</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Overview Cards Grid (Calculation, Task List, Status/Priority/Assignee Breakdowns, Notes) */}
      {cards.length > 0 && (
        <div className="overview-cards-grid mb-4">
          {cards.map((card) => {
            const valObj = cardValues[card.id] || {};
            const displayVal = formatCardValue(valObj.value, card.units);
            const refreshedAgo = valObj.refreshed_at
              ? formatDistanceToNow(new Date(valObj.refreshed_at), { addSuffix: true })
              : "recently";
            const isBreakdown = ["status_breakdown", "priority_breakdown", "assignee_workload"].includes(card.card_type);
            const targetBudget = valObj.target_budget;
            const budgetPct = targetBudget && targetBudget > 0 ? Math.min(100, Math.round((Number(valObj.value || 0) / targetBudget) * 100)) : null;

            return (
              <div key={card.id} className="overview-stat-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm position-relative d-flex flex-column">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div className="card-title-text fw-bold text-slate-700 uppercase tracking-wide flex-grow-1 me-2" style={{ fontSize: "13px" }}>
                    {editingCardId === card.id ? (
                      <input
                        type="text"
                        autoFocus
                        className="form-control form-control-sm py-0 px-1 font-bold text-slate-800"
                        style={{ fontSize: "13px", height: "24px" }}
                        value={editingCardTitle}
                        onChange={(e) => setEditingCardTitle(e.target.value)}
                        onBlur={() => handleSaveInlineTitle(card.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveInlineTitle(card.id);
                        }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-indigo-600 transition-colors d-inline-block"
                        title="Click to rename card"
                        onClick={(e) => handleStartTitleEdit(card, e)}
                      >
                        {card.name}
                      </span>
                    )}
                  </div>
                  <span className="text-muted text-nowrap" style={{ fontSize: "11px" }}>
                    Refreshed {refreshedAgo}
                  </span>
                </div>

                {/* Card Body by Type */}
                {card.card_type === "notes" ? (
                  <div className="text-slate-700 small flex-grow-1" style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, minHeight: "90px" }}>
                    {valObj.note_content || card.filters?.note_content || "Click Settings to add notes or budget instructions."}
                  </div>
                ) : isBreakdown ? (
                  <div className="d-flex flex-column gap-2.5 flex-grow-1 py-1">
                    {(valObj.breakdown || []).length === 0 ? (
                      <div className="text-muted small py-3 text-center">No tasks match the current filter.</div>
                    ) : (
                      (valObj.breakdown || []).map((item) => (
                        <div key={item.label} style={{ fontSize: "12.5px" }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-semibold text-slate-700">{item.label}</span>
                            <span className="text-muted fw-medium">{item.count} ({item.pct}%)</span>
                          </div>
                          <div style={{ height: "7px", backgroundColor: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ width: `${item.pct}%`, height: "100%", backgroundColor: item.color || "#2563eb", transition: "width 0.3s ease" }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : card.card_type === "task_list" ? (
                  <div className="d-flex flex-column flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: "11.5px", color: "#64748b" }}>
                      <span>{valObj.total || 0} task(s)</span>
                      {valObj.measure_field_name && (
                        <span className="fw-bold text-primary">
                          Total {valObj.measure_field_name}: {formatCardValue(valObj.sum_value, "$")}
                        </span>
                      )}
                    </div>
                    <div className="overflow-auto" style={{ maxHeight: "190px" }}>
                      {(valObj.tasks || []).length === 0 ? (
                        <div className="text-muted small py-3 text-center">No matching tasks found.</div>
                      ) : (
                        (valObj.tasks || []).slice(0, 8).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => navigate(`/admin/boards/${t.board_id || spaceId}?taskId=${t.id}`)}
                            className="d-flex justify-content-between align-items-center py-1.5 px-2 rounded-2 border-bottom cursor-pointer hover:bg-slate-50"
                            style={{ fontSize: "12.5px" }}
                          >
                            <span className="fw-medium text-slate-800 text-truncate me-2">{t.title}</span>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                              {t.measure_value != null && t.measure_value !== "" && (
                                <span className="fw-bold text-primary">{t.measure_value}</span>
                              )}
                              <span className="badge bg-light text-slate-600 border" style={{ fontSize: "10px" }}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="metric-display-container py-2 flex-grow-1 d-flex flex-column justify-content-center">
                    <div className="metric-big-number fw-bold text-slate-900" style={{ fontSize: "2.85rem", lineHeight: "1.05" }}>
                      {displayVal}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: "12px" }}>
                      {(card.calculation || "sum").toUpperCase()} across {valObj.count ?? 0} task(s)
                    </div>
                    {budgetPct !== null && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between small mb-1" style={{ fontSize: "11.5px" }}>
                          <span className="text-slate-600 fw-medium">Budget progress</span>
                          <span className={`fw-bold ${budgetPct >= 100 ? "text-danger" : "text-primary"}`}>
                            {budgetPct}% of {formatCardValue(targetBudget, card.units)}
                          </span>
                        </div>
                        <div style={{ height: "7px", backgroundColor: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${budgetPct}%`,
                              height: "100%",
                              backgroundColor: budgetPct >= 100 ? "#ef4444" : "#2563eb",
                              transition: "width 0.3s ease"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="card-hover-actions position-absolute d-flex align-items-center gap-1.5 bg-white border border-slate-200 shadow-sm rounded-3 p-1">
                  {card.card_type === "calculation" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-light p-1.5 rounded-2 border-0 text-slate-600 hover:text-indigo-600"
                      title="Expand Data View"
                      onClick={(e) => handleOpenCardModal(card, "data", e)}
                    >
                      <Maximize2 size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-light p-1.5 rounded-2 border-0 text-slate-600 hover:text-indigo-600"
                    title="Card Settings"
                    onClick={(e) => handleOpenCardModal(card, "settings", e)}
                  >
                    <Settings size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light p-1.5 rounded-2 border-0 text-danger hover:bg-red-50"
                    title="Delete Card"
                    onClick={(e) => handleDeleteCard(card.id, e)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main 3-Column Section matching Image 1: Recent | Docs | Bookmarks */}
      <div className="row g-4 mb-4">
        {/* Card 1: Recent (Lists, Folders, and Recent Activity) */}
        <div className="col-lg-4">
          <div className="overview-builtin-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm h-100 d-flex flex-column" style={{ minHeight: "320px" }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>
                Recent
              </div>
            </div>

            <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: "280px" }}>
              {displayRecentItems.length > 0 ? (
                <div className="d-flex flex-column gap-1.5">
                  {displayRecentItems.map((item, idx) => (
                    <div
                      key={`recent-item-${item.id || idx}`}
                      className="recent-item-row p-2 rounded-3 border border-slate-100 cursor-pointer hover:bg-slate-50 d-flex align-items-center gap-2 transition-colors"
                      onClick={() => navigate(`/admin/boards/${item.id}`)}
                      title={`Open ${item.name}`}
                    >
                      {item.is_folder ? (
                        <FolderOpen size={16} className="text-slate-600 flex-shrink-0" />
                      ) : (
                        <List size={16} className="text-slate-500 flex-shrink-0" />
                      )}
                      <div className="truncate flex-grow-1 text-slate-800" style={{ fontSize: "13px" }}>
                        <span className="fw-medium">{item.name}</span>
                        {item.parent_name && (
                          <span className="text-muted ms-1.5" style={{ fontSize: "12px" }}>
                            · in {item.parent_name}
                          </span>
                        )}
                      </div>
                      {item.is_private && <Lock size={12} className="text-slate-400 flex-shrink-0" />}
                    </div>
                  ))}

                  {/* Also show recent tasks if any */}
                  {(recentItems?.tasks || []).map((t) => (
                    <div
                      key={`recent-task-${t.id}`}
                      className="recent-item-row p-2 rounded-3 border border-slate-100 cursor-pointer hover:bg-slate-50 d-flex align-items-center gap-2 transition-colors"
                      onClick={() => navigate(`/admin/boards/${t.board_id || spaceId}?taskId=${t.id}`)}
                      title={`Open task: ${t.title}`}
                    >
                      <Clock size={14} className="text-amber-500 flex-shrink-0" />
                      <div className="truncate flex-grow-1" style={{ fontSize: "13px" }}>
                        <span className="fw-medium text-slate-800">{t.title}</span>
                        <span className="text-muted ms-1.5" style={{ fontSize: "12px" }}>• in {t.board_name || "Space"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted small">
                  No items or recent activity in this space yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Docs (matching Image 1) */}
        <div className="col-lg-4">
          <div className="overview-builtin-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm h-100 d-flex flex-column" style={{ minHeight: "320px" }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>
                Docs
              </div>
              {spaceDocs.length > 0 && (
                <span className="badge bg-slate-100 text-slate-600 rounded-pill">{spaceDocs.length}</span>
              )}
            </div>

            <div className="flex-grow-1 d-flex flex-column justify-content-center">
              {spaceDocs.length > 0 ? (
                <div className="d-flex flex-column gap-2 overflow-auto pe-1" style={{ maxHeight: "260px" }}>
                  {spaceDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="doc-item-row p-2.5 rounded-3 border border-slate-100 bg-slate-50/70 cursor-pointer hover:bg-slate-100 d-flex align-items-center justify-content-between"
                      onClick={() => navigate(`/admin/boards/${spaceId}?tab=docs&docId=${doc.id}`)}
                    >
                      <div className="truncate me-2">
                        <div className="fw-medium text-slate-800" style={{ fontSize: "13px" }}>{doc.title}</div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>in {doc.board_name || board.name}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state matching Image 1 */
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-4 my-auto">
                  <div className="rounded-circle p-3 bg-slate-100 text-slate-400 mb-3 d-inline-flex">
                    <FileText size={32} />
                  </div>
                  <p className="text-muted mb-3" style={{ fontSize: "13px" }}>
                    There are no Docs in this location yet.
                  </p>
                  <Button
                    variant="dark"
                    size="sm"
                    className="rounded-pill px-3 py-1.5 fw-medium bg-slate-900 border-0 shadow-sm"
                    style={{ fontSize: "12px" }}
                    onClick={() => navigate(`/admin/boards/${spaceId}?tab=docs&new=1`)}
                  >
                    Add a Doc
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Bookmarks (matching Image 1) */}
        <div className="col-lg-4">
          <div className="overview-builtin-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm h-100 d-flex flex-column" style={{ minHeight: "320px" }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>
                Bookmarks
              </div>
              {bookmarks.length > 0 && (
                <span className="badge bg-slate-100 text-slate-600 rounded-pill">{bookmarks.length}</span>
              )}
            </div>

            <div className="flex-grow-1 d-flex flex-column justify-content-center">
              {bookmarks.length > 0 ? (
                <div className="d-flex flex-column gap-2 overflow-auto pe-1" style={{ maxHeight: "220px" }}>
                  {bookmarks.map((bm) => (
                    <div key={bm.id} className="bookmark-item-row p-2.5 rounded-3 border border-slate-100 bg-slate-50/70 d-flex align-items-center justify-content-between">
                      <a href={bm.url || "#"} target="_blank" rel="noreferrer" className="text-decoration-none text-slate-700 fw-medium truncate flex-grow-1 me-2" style={{ fontSize: "13px" }}>
                        {bm.title}
                        {bm.url && <ExternalLink size={12} className="ms-1 text-slate-400 d-inline" />}
                      </a>
                      <button type="button" className="btn btn-sm text-slate-400 hover:text-danger p-0 border-0" onClick={(e) => handleDeleteBookmark(bm.id, e)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state matching Image 1 */
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-4 my-auto">
                  <div className="rounded-circle p-3 bg-slate-100 text-slate-400 mb-3 d-inline-flex">
                    <Bookmark size={32} />
                  </div>
                  <p className="text-muted mb-3 px-3" style={{ fontSize: "12px", lineHeight: "1.5" }}>
                    Bookmarks make it easy to save ClickUp items or any URL from around the web.
                  </p>
                  <Button
                    variant="dark"
                    size="sm"
                    className="rounded-pill px-3 py-1.5 fw-medium bg-slate-900 border-0 shadow-sm"
                    style={{ fontSize: "12px" }}
                    onClick={() => setShowAddBookmark(true)}
                  >
                    Add Bookmark
                  </Button>
                </div>
              )}
            </div>

            {/* Inline add bookmark form if toggled */}
            {showAddBookmark && (
              <div className="mt-3 pt-2 border-top border-slate-100">
                <Form onSubmit={handleAddBookmarkSubmit} className="p-2 border rounded-3 bg-slate-50">
                  <Form.Control
                    type="text"
                    placeholder="Bookmark title..."
                    size="sm"
                    className="mb-2"
                    value={bookmarkTitle}
                    onChange={(e) => setBookmarkTitle(e.target.value)}
                    required
                  />
                  <Form.Control
                    type="url"
                    placeholder="URL (http://...)"
                    size="sm"
                    className="mb-2"
                    value={bookmarkUrl}
                    onChange={(e) => setBookmarkUrl(e.target.value)}
                  />
                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="light" size="sm" onClick={() => setShowAddBookmark(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={addingBookmark}>
                      {addingBookmark ? <Spinner animation="border" size="sm" /> : "Save"}
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Folders Section - Underneath the 3 Cards (matching Image 1) */}
      <div className="overview-folders-section mb-4">
        <div className="fw-bold text-slate-800 mb-3" style={{ fontSize: "15px" }}>
          Folders
        </div>

        <div className="d-flex flex-wrap gap-3">
          {(spaceChildren.folders || []).length > 0 ? (
            spaceChildren.folders.map((folder) => (
              <div
                key={folder.id}
                className="folder-card-pill bg-white px-3.5 py-2.5 rounded-3 border border-slate-200 shadow-sm d-flex align-items-center gap-2 cursor-pointer hover:border-slate-400 hover:shadow transition-all"
                onClick={() => navigate(`/admin/boards/${folder.id}`)}
                title={`Open folder: ${folder.name}`}
              >
                <FolderOpen size={16} className="text-slate-600" />
                <span className="fw-medium text-slate-800" style={{ fontSize: "13.5px" }}>
                  {folder.name}
                </span>
                {folder.is_private && <Lock size={12} className="text-slate-400" />}
              </div>
            ))
          ) : (
            <div className="text-muted small py-2">
              No folders created in this space yet.
            </div>
          )}
        </div>
      </div>

      {/* ClickUp-Style Add Card Gallery Modal */}
      <Modal show={showCardGallery} onHide={() => setShowCardGallery(false)} centered size="lg">
        <Modal.Header closeButton className="border-bottom px-4 py-3">
          <Modal.Title className="fs-6 fw-bold text-slate-800">
            Add Card to Space Overview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="row g-3">
            {CARD_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <div key={tpl.type} className="col-md-6">
                  <div
                    onClick={() => handleAddCard(tpl.type, tpl.defaultName)}
                    className="p-3.5 rounded-3 border bg-white h-100 cursor-pointer transition-all"
                    style={{ borderColor: "#e2e8f0" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = tpl.color;
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 23, 42, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "40px", height: "40px", backgroundColor: tpl.bg, color: tpl.color }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="fw-bold text-slate-800" style={{ fontSize: "0.92rem" }}>
                          {tpl.title}
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                          {tpl.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
      </Modal>

      {/* Card Settings & Data Modal */}
      {selectedCardForModal && (
        <CardSettingsModal
          show={showSettingsModal}
          onHide={() => setShowSettingsModal(false)}
          card={selectedCardForModal}
          spaceId={spaceId}
          childLists={childLists}
          assignees={assignees}
          initialTab={modalTab}
          onSaved={handleCardSettingsSaved}
        />
      )}
    </div>
  );
};

export default SpaceOverviewView;
