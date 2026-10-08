import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Spinner } from "react-bootstrap";
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
  RotateCw
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

  // Manual refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

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
            onClick={() => handleAddCard("calculation")}
          >
            <Plus size={16} />
            <span>Card</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Calculation Cards Grid (if user added any) */}
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

                <div className="metric-display-container py-3">
                  <div className="metric-big-number fw-bold text-slate-900" style={{ fontSize: "3.25rem", lineHeight: "1" }}>
                    {displayVal}
                  </div>
                </div>

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
