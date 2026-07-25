import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Form, Button, Spinner, Dropdown } from "react-bootstrap";
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
  PlusCircle,
  Download,
  Layers,
  ChevronRight,
  Sparkles,
  BarChart3,
  List
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
  const [recentItems, setRecentItems] = useState({ tasks: [], docs: [] });
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
        getSpaceRecent(spaceId).catch(() => ({ data: { tasks: [], docs: [] } })),
        getSpaceDocs(spaceId).catch(() => ({ data: [] })),
        getBookmarks(spaceId).catch(() => ({ data: [] })),
        getSpaceChildren(spaceId).catch(() => ({ data: { folders: [], lists: [] } })),
      ]);

      const fetchedCards = cardsRes.data || [];
      setCards(fetchedCards);
      setRecentItems(recentRes.data || { tasks: [], docs: [] });
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
        if (card.card_type === "calculation") {
          try {
            const res = await getCardAggregate(spaceId, card.id);
            values[card.id] = res.data;
          } catch (e) {
            values[card.id] = { value: 0, count: 0 };
          }
        }
      })
    );
    setCardValues(values);
  };

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Add a new calculation card
  const handleAddCard = async (type = "calculation") => {
    try {
      const defaultList = childLists[0];
      const newCardData = {
        name: type === "calculation" ? "New Calculation Card" : "Card",
        card_type: type,
        data_source_board_id: defaultList ? defaultList.id : null,
        calculation: "sum",
        units: "None"
      };

      const res = await createOverviewCard(spaceId, newCardData);
      const newCard = res.data;
      setCards((prev) => [...prev, newCard]);

      if (type === "calculation") {
        // Automatically open settings modal for the newly created card
        setSelectedCardForModal(newCard);
        setModalTab("settings");
        setShowSettingsModal(true);
      }
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
    // Refresh aggregate for this card
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
      // Refresh docs
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

  // Helper to format unit value
  const formatCardValue = (val, units) => {
    if (val === undefined || val === null) return "0";
    let formattedVal = typeof val === "number" ? val.toLocaleString("en-US", { maximumFractionDigits: 2 }) : val;
    if (units === "$") return `$ ${formattedVal}`;
    if (units === "€") return `€ ${formattedVal}`;
    if (units === "%") return `${formattedVal}%`;
    return formattedVal;
  };

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
      {/* Top Header Controls Bar */}
      <div className="overview-header-toolbar d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="overview-title fw-bold text-slate-800 m-0">Overview</h2>
          <span className="text-muted small">Aggregated metrics, key cards, and location assets for this space</span>
        </div>

        <div className="d-flex align-items-center gap-2">
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
            onClick={() => handleAddCard("calculation")}
          >
            <Plus size={16} />
            <span>Card</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Calculation Cards Grid */}
      {cards.filter((c) => c.card_type === "calculation").length > 0 && (
        <div className="overview-cards-grid mb-4">
          {cards.filter((c) => c.card_type === "calculation").map((card) => {
            const valObj = cardValues[card.id] || {};
            const displayVal = formatCardValue(valObj.value, card.units);
            const refreshedAgo = valObj.refreshed_at
              ? formatDistanceToNow(new Date(valObj.refreshed_at), { addSuffix: true })
              : "recently";

            return (
              <div key={card.id} className="overview-stat-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm position-relative">
                {/* Top Row: Title + Timestamp */}
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

                {/* Center Row: Big Metric Value */}
                <div className="metric-display-container py-3">
                  <div className="metric-big-number fw-bold text-slate-900" style={{ fontSize: "3.25rem", lineHeight: "1" }}>
                    {displayVal}
                  </div>
                </div>

                {/* Hover Action Overlay Icons */}
                <div className="card-hover-actions position-absolute d-flex align-items-center gap-1.5 bg-white border border-slate-200 shadow-sm rounded-3 p-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-light p-1.5 rounded-2 border-0 text-slate-600 hover:text-indigo-600"
                    title="Expand Data View"
                    onClick={(e) => handleOpenCardModal(card, "data", e)}
                  >
                    <Maximize2 size={13} />
                  </button>
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
                    className="btn btn-sm btn-light p-1.5 rounded-2 border-0 text-slate-600 hover:text-indigo-600"
                    title="Filters"
                    onClick={(e) => handleOpenCardModal(card, "settings", e)}
                  >
                    <Filter size={13} />
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

      {/* Built-in Bottom Section (Bookmarks, Docs, Recents, Folders) */}
      <div className="row g-4 mb-4">
        {/* Bookmarks Card */}
        <div className="col-lg-4">
          <div className="overview-builtin-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold text-slate-800 d-flex align-items-center gap-2">
                <Bookmark size={16} className="text-indigo-600" /> Bookmarks
              </div>
              <span className="badge bg-slate-100 text-slate-600 rounded-pill">{bookmarks.length}</span>
            </div>

            <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: "240px" }}>
              {bookmarks.length > 0 ? (
                <div className="d-flex flex-column gap-2">
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
                <div className="text-center py-4 text-muted small">
                  <p className="m-0 mb-1">Bookmarks make it easy to save items or any URL.</p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-top border-slate-100">
              {showAddBookmark ? (
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
              ) : (
                <Button variant="light" size="sm" className="w-100 text-slate-700 fw-medium rounded-3 border" onClick={() => setShowAddBookmark(true)}>
                  <Plus size={14} className="me-1" /> Add Bookmark
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Docs Card */}
        <div className="col-lg-4">
          <div className="overview-builtin-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold text-slate-800 d-flex align-items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Docs
              </div>
              <span className="badge bg-slate-100 text-slate-600 rounded-pill">{spaceDocs.length}</span>
            </div>

            <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: "280px" }}>
              {spaceDocs.length > 0 ? (
                <div className="d-flex flex-column gap-2">
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
                <div className="text-center py-4 text-muted small">No documents in this space yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Items Card */}
        <div className="col-lg-4">
          <div className="overview-builtin-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold text-slate-800 d-flex align-items-center gap-2">
                <Clock size={16} className="text-amber-600" /> Recent Activity
              </div>
            </div>

            <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: "280px" }}>
              {(recentItems.tasks || []).length > 0 || (recentItems.docs || []).length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {(recentItems.tasks || []).map((t) => (
                    <div
                      key={`task-${t.id}`}
                      className="recent-item-row p-2 rounded-3 border border-slate-100 cursor-pointer hover:bg-slate-50 d-flex align-items-center justify-content-between"
                      onClick={() => navigate(`/admin/boards/${t.board_id || spaceId}?taskId=${t.id}`)}
                    >
                      <div className="truncate">
                        <span className="fw-medium text-slate-800 me-1" style={{ fontSize: "12px" }}>{t.title}</span>
                        <span className="text-muted" style={{ fontSize: "11px" }}>• in {t.board_name || "Space"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted small">No recent activity recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Folders & Lists Structure Card */}
      <div className="overview-builtin-card bg-white p-4 rounded-4 border border-slate-200 shadow-sm mb-4">
        <div className="fw-bold text-slate-800 mb-3 d-flex align-items-center gap-2">
          <FolderOpen size={16} className="text-indigo-600" /> Space Structure (Folders & Lists)
        </div>

        <div className="row g-3">
          {(spaceChildren.folders || []).map((folder) => (
            <div key={folder.id} className="col-md-4">
              <div className="folder-box p-3 border rounded-3 bg-slate-50/80">
                <div className="fw-bold text-slate-800 d-flex align-items-center gap-2 mb-2">
                  <FolderOpen size={16} className="text-amber-500" /> {folder.name}
                </div>
                <div className="ms-3 d-flex flex-column gap-1">
                  {(folder.children || []).map((subList) => (
                    <div
                      key={subList.id}
                      className="sublist-item cursor-pointer text-indigo-600 hover:underline d-flex align-items-center justify-content-between small"
                      onClick={() => navigate(`/admin/boards/${subList.id}`)}
                    >
                      <span><List size={12} className="me-1" />{subList.name}</span>
                      <span className="text-muted" style={{ fontSize: "10px" }}>{subList.tasks_count || 0} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {(spaceChildren.lists || []).map((list) => (
            <div key={list.id} className="col-md-3">
              <div
                className="list-box p-3 border rounded-3 bg-white hover:border-indigo-300 cursor-pointer transition-all"
                onClick={() => navigate(`/admin/boards/${list.id}`)}
              >
                <div className="fw-semibold text-slate-800 d-flex align-items-center justify-content-between mb-1" style={{ fontSize: "13px" }}>
                  <span><List size={14} className="me-1 text-slate-500" />{list.name}</span>
                  <ChevronRight size={12} className="text-slate-400" />
                </div>
                <div className="text-muted small" style={{ fontSize: "11px" }}>{list.tasks_count || 0} tasks</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Settings & Data Modal */}
      {selectedCardForModal && (
        <CardSettingsModal
          show={showSettingsModal}
          onHide={() => setShowSettingsModal(false)}
          card={selectedCardForModal}
          spaceId={spaceId}
          childLists={childLists}
          initialTab={modalTab}
          onSave={handleCardSettingsSaved}
        />
      )}
    </div>
  );
};

export default SpaceOverviewView;
