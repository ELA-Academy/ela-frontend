import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Nav, Table, Badge } from 'react-bootstrap';
import { Settings, Database, Filter, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateOverviewCard, getCardAggregate, getCardData } from '../../../services/overviewService';
import api from '../../../utils/api';
import '../../../styles/CardSettingsModal.css';

const CardSettingsModal = ({ show, onHide, card, spaceId, childLists, onSave, onSaved, initialTab = 'settings' }) => {
  const [localCard, setLocalCard] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [availableFields, setAvailableFields] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [taskData, setTaskData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fetchingFields, setFetchingFields] = useState(false);

  const notifySaved = onSaved || onSave;

  useEffect(() => {
    if (show && card) {
      const normalizedFilters = {
        show_closed: Boolean(card.filters?.show_closed ?? card.filters?.showClosed ?? false),
        status_filter: card.filters?.status_filter || 'all',
        priority_filter: card.filters?.priority_filter || 'all',
        target_budget: card.filters?.target_budget ?? '',
        note_content: card.filters?.note_content ?? ''
      };
      const initialized = {
        ...card,
        calculation: (card.calculation || 'sum').toLowerCase(),
        filters: normalizedFilters
      };
      setLocalCard(initialized);
      setActiveTab(initialTab);
      if (initialTab === 'data') {
        loadCardData(initialized);
      }
      if (card.data_source_board_id) {
        fetchAvailableFields(card.data_source_board_id);
      } else {
        setAvailableFields([]);
      }
    }
  }, [show, card, initialTab]);

  useEffect(() => {
    if (show && localCard && localCard.id) {
      loadCardPreview(localCard);
    }
  }, [
    show,
    localCard?.data_source_board_id,
    localCard?.measure_field_id,
    localCard?.calculation,
    localCard?.filters?.show_closed,
    localCard?.filters?.status_filter,
    localCard?.filters?.priority_filter
  ]);

  const fetchAvailableFields = async (boardId) => {
    if (!boardId) {
      setAvailableFields([]);
      return;
    }
    setFetchingFields(true);
    try {
      let fields = [];
      const response = await api.get(`/boards/${boardId}`);
      if (response.data && Array.isArray(response.data.custom_fields) && response.data.custom_fields.length > 0) {
        fields = response.data.custom_fields;
      } else {
        const extRes = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
        fields = extRes.data || [];
      }
      setAvailableFields(fields);
    } catch (error) {
      console.error('Error fetching custom fields', error);
      setAvailableFields([]);
    } finally {
      setFetchingFields(false);
    }
  };

  const loadCardPreview = async (currentCard) => {
    if (!currentCard || !currentCard.id) return;
    setLoadingPreview(true);
    try {
      const params = {
        data_source_board_id: currentCard.data_source_board_id || 'all',
        measure_field_id: currentCard.measure_field_id || '',
        calculation: (currentCard.calculation || 'sum').toLowerCase(),
        show_closed: String(Boolean(currentCard.filters?.show_closed)),
        status_filter: currentCard.filters?.status_filter || 'all',
        priority_filter: currentCard.filters?.priority_filter || 'all'
      };
      const res = await getCardAggregate(spaceId, currentCard.id, params);
      setPreviewData(res.data || {});
    } catch (error) {
      console.error('Preview error', error);
      setPreviewData({ value: 0 });
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadCardData = async (currentCard) => {
    if (!currentCard || !currentCard.id) return;
    setLoadingData(true);
    try {
      const res = await getCardData(spaceId, currentCard.id);
      setTaskData(Array.isArray(res.data?.tasks) ? res.data.tasks : []);
    } catch (error) {
      console.error('Data error', error);
      toast.error('Failed to load card data.');
      setTaskData([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    if (tab === 'data' && localCard) {
      loadCardData(localCard);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: localCard.name,
        data_source_board_id: localCard.data_source_board_id || null,
        measure_field_id: localCard.measure_field_id || null,
        calculation: (localCard.calculation || 'sum').toLowerCase(),
        units: localCard.units || 'None',
        filters: localCard.filters || {}
      };
      const res = await updateOverviewCard(spaceId, localCard.id, payload);
      const updated = res.data || { ...localCard, ...payload };
      toast.success('Card settings saved');
      if (notifySaved) notifySaved(updated);
      onHide();
    } catch (error) {
      console.error('Save error', error);
      toast.error('Failed to save card settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSourceChange = (e) => {
    const boardId = e.target.value;
    setLocalCard({ ...localCard, data_source_board_id: boardId || null, measure_field_id: '' });
    if (boardId) {
      fetchAvailableFields(boardId);
    } else {
      setAvailableFields([]);
    }
  };

  const updateFilter = (key, value) => {
    setLocalCard((prev) => ({
      ...prev,
      filters: { ...(prev.filters || {}), [key]: value }
    }));
  };

  if (!localCard) return null;

  const isCalc = localCard.card_type === 'calculation';
  const isTaskList = localCard.card_type === 'task_list';
  const isNotes = localCard.card_type === 'notes';
  const isBreakdown = ['status_breakdown', 'priority_breakdown', 'assignee_workload'].includes(localCard.card_type);

  const formattedPreviewVal = (() => {
    const val = previewData?.value ?? 0;
    const numStr = typeof val === 'number' ? val.toLocaleString('en-US', { maximumFractionDigits: 2 }) : val;
    if (localCard.units === '$') return `$${numStr}`;
    if (localCard.units === '€') return `€${numStr}`;
    if (localCard.units === '%') return `${numStr}%`;
    return numStr;
  })();

  return (
    <Modal show={show} onHide={onHide} dialogClassName="card-settings-modal" centered backdrop="static">
      <div className="card-settings-container">
        {/* Left Panel: Live Preview */}
        <div className="preview-panel">
          <div className="preview-header">
            <span className="preview-title">Live Preview</span>
          </div>
          <div className="preview-card">
            <h3 className="card-name-preview">{localCard.name || 'Untitled Card'}</h3>
            {loadingPreview ? (
              <div className="py-3"><Spinner animation="border" size="sm" variant="primary" /></div>
            ) : isNotes ? (
              <div className="text-start small text-slate-600 mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                {localCard.filters?.note_content || 'Add notes on the right...'}
              </div>
            ) : isBreakdown ? (
              <div className="w-100 mt-2 d-flex flex-column gap-2 text-start">
                {(previewData?.breakdown || []).slice(0, 5).map((b) => (
                  <div key={b.label} style={{ fontSize: '12px' }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-semibold text-slate-700">{b.label}</span>
                      <span className="text-muted">{b.count} ({b.pct}%)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${b.pct}%`, height: '100%', backgroundColor: b.color || '#2563eb' }} />
                    </div>
                  </div>
                ))}
                {(!previewData?.breakdown || previewData.breakdown.length === 0) && (
                  <div className="text-muted small">No matching tasks yet</div>
                )}
              </div>
            ) : isTaskList ? (
              <div className="w-100 mt-2 text-start">
                <div className="small text-muted mb-1">{previewData?.total || 0} matching task(s)</div>
                {(previewData?.tasks || []).slice(0, 4).map((t) => (
                  <div key={t.id} className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '12px' }}>
                    <span className="text-truncate me-2 fw-medium">{t.title}</span>
                    {t.measure_value != null && <span className="fw-bold text-primary">{t.measure_value}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="card-value-preview">{formattedPreviewVal}</div>
                <div className="card-calculation-preview">
                  {localCard.calculation} • {previewData?.count ?? 0} task(s)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Settings & Data */}
        <div className="content-panel">
          <div className="content-header">
            <Nav variant="underline" activeKey={activeTab} onSelect={handleTabSelect} className="modal-tabs">
              <Nav.Item>
                <Nav.Link eventKey="settings">
                  <Settings size={18} className="me-2" />
                  Settings
                </Nav.Link>
              </Nav.Item>
              {isCalc && (
                <Nav.Item>
                  <Nav.Link eventKey="data">
                    <Database size={18} className="me-2" />
                    Data
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>
            <button className="close-btn" onClick={onHide}><X size={24} /></button>
          </div>

          <div className="content-body">
            {activeTab === 'settings' && (
              <div className="settings-tab">
                <Form.Group className="mb-3">
                  <Form.Label className="settings-label">Card Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="overview_card_title_input"
                    autoComplete="off"
                    className="card-name-input"
                    value={localCard.name}
                    onChange={(e) => setLocalCard({ ...localCard, name: e.target.value })}
                    placeholder="e.g. Spring Gala Expenses Total"
                  />
                </Form.Group>

                {isNotes ? (
                  <Form.Group className="mb-3">
                    <Form.Label className="settings-label">Notes / Summary Content</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={7}
                      value={localCard.filters?.note_content || ''}
                      onChange={(e) => updateFilter('note_content', e.target.value)}
                      placeholder="Write event goals, budget notes, or key reminders for this space..."
                    />
                  </Form.Group>
                ) : (
                  <>
                    <div className="settings-grid">
                      <Form.Group className="mb-3">
                        <Form.Label className="settings-label">Data Source</Form.Label>
                        <Form.Select value={localCard.data_source_board_id || ''} onChange={handleSourceChange}>
                          <option value="">All lists in this space</option>
                          {childLists && childLists.map((list) => (
                            <option key={list.id} value={list.internal_id || list.id}>{list.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      {(isCalc || isTaskList) && (
                        <Form.Group className="mb-3">
                          <Form.Label className="settings-label">Measure Column (Custom Field)</Form.Label>
                          <Form.Select
                            value={localCard.measure_field_id || ''}
                            onChange={(e) => setLocalCard({ ...localCard, measure_field_id: e.target.value })}
                            disabled={fetchingFields || !localCard.data_source_board_id}
                          >
                            <option value="">Task Count (No field)</option>
                            {availableFields.map((field) => (
                              <option key={field.id} value={field.id}>{field.name}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      )}

                      {isCalc && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label className="settings-label">Calculation</Form.Label>
                            <Form.Select
                              value={localCard.calculation || 'sum'}
                              onChange={(e) => setLocalCard({ ...localCard, calculation: e.target.value })}
                            >
                              <option value="sum">Sum (Running Total)</option>
                              <option value="count">Count</option>
                              <option value="average">Average</option>
                              <option value="min">Min</option>
                              <option value="max">Max</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label className="settings-label">Units</Form.Label>
                            <Form.Select
                              value={localCard.units || 'None'}
                              onChange={(e) => setLocalCard({ ...localCard, units: e.target.value })}
                            >
                              <option value="None">None</option>
                              <option value="$">$ (Dollar)</option>
                              <option value="€">€ (Euro)</option>
                              <option value="#"># (Number)</option>
                              <option value="%">% (Percent)</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label className="settings-label">Budget / Target Goal</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              placeholder="e.g. 5000 (shows progress bar)"
                              value={localCard.filters?.target_budget ?? ''}
                              onChange={(e) => updateFilter('target_budget', e.target.value)}
                            />
                          </Form.Group>
                        </>
                      )}
                    </div>

                    <div className="filters-section mt-3">
                      <h6 className="settings-label mb-3">
                        <Filter size={16} className="me-2" />
                        Filters
                      </h6>
                      <div className="row g-2 mb-3">
                        <div className="col-sm-6">
                          <Form.Label className="small text-muted mb-1">Status Filter</Form.Label>
                          <Form.Select
                            size="sm"
                            value={localCard.filters?.status_filter || 'all'}
                            onChange={(e) => updateFilter('status_filter', e.target.value)}
                          >
                            <option value="all">All statuses</option>
                            <option value="open">Open tasks only</option>
                            <option value="completed">Completed only</option>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                          </Form.Select>
                        </div>
                        <div className="col-sm-6">
                          <Form.Label className="small text-muted mb-1">Priority Filter</Form.Label>
                          <Form.Select
                            size="sm"
                            value={localCard.filters?.priority_filter || 'all'}
                            onChange={(e) => updateFilter('priority_filter', e.target.value)}
                          >
                            <option value="all">All priorities</option>
                            <option value="Urgent">Urgent</option>
                            <option value="High">High</option>
                            <option value="Normal">Normal</option>
                            <option value="Low">Low</option>
                          </Form.Select>
                        </div>
                      </div>
                      <Form.Check
                        type="checkbox"
                        label="Include completed (Done) tasks in calculation"
                        checked={Boolean(localCard.filters?.show_closed)}
                        onChange={(e) => updateFilter('show_closed', e.target.checked)}
                        className="mb-2 custom-checkbox"
                      />
                    </div>
                  </>
                )}

                <div className="settings-footer mt-4">
                  <Button variant="light" onClick={onHide} className="me-2 px-4 rounded-pill">Cancel</Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving} className="px-4 rounded-pill">
                    {saving ? <Spinner size="sm" /> : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="data-tab">
                <div className="data-header mb-4">
                  <h4 className="data-title">{localCard.name}</h4>
                  <div className="data-total">
                    <span className="text-muted me-2">Total:</span>
                    <span className="total-value">{formattedPreviewVal}</span>
                  </div>
                </div>

                {loadingData ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="data-table">
                      <thead>
                        <tr>
                          <th>Task Name</th>
                          <th>Measure Value</th>
                          <th>Assignee</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!Array.isArray(taskData) || taskData.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">No data found</td>
                          </tr>
                        ) : (
                          taskData.map((task) => (
                            <tr key={task.id}>
                              <td className="fw-semibold text-slate-800">{task.title || task.name}</td>
                              <td>{task.measure_value !== null && task.measure_value !== undefined ? task.measure_value : '-'}</td>
                              <td>{task.assignee_name || task.assignee || 'Unassigned'}</td>
                              <td>{task.due_date || '-'}</td>
                              <td>
                                <Badge bg={task.status === 'Done' ? 'success' : task.status === 'In Progress' ? 'primary' : 'secondary'} pill>
                                  {task.status || 'Not Started'}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CardSettingsModal;
