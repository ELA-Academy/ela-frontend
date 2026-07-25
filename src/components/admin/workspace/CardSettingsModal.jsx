import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button, Spinner, Nav, Table, Badge } from 'react-bootstrap';
import { Settings, Database, Filter, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateOverviewCard, getCardAggregate, getCardData } from '../../../services/overviewService';
import api from '../../../utils/api';
import '../../../styles/CardSettingsModal.css';

const CardSettingsModal = ({ show, onHide, card, spaceId, childLists, onSave, initialTab = 'settings' }) => {
  const [localCard, setLocalCard] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [availableFields, setAvailableFields] = useState([]);
  const [aggregateValue, setAggregateValue] = useState(null);
  const [taskData, setTaskData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fetchingFields, setFetchingFields] = useState(false);

  useEffect(() => {
    if (show && card) {
      setLocalCard({ ...card });
      setActiveTab(initialTab);
      loadCardPreview(card);
      if (initialTab === 'data') {
        loadCardData(card);
      }
      if (card.data_source_board_id) {
        fetchAvailableFields(card.data_source_board_id);
      }
    }
  }, [show, card, initialTab]);

  useEffect(() => {
    if (show && localCard) {
      loadCardPreview(localCard);
    }
  }, [localCard?.data_source_board_id, localCard?.measure_field_id, localCard?.calculation, localCard?.filters]);

  const fetchAvailableFields = async (boardId) => {
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
      // Assuming getCardAggregate can take currentCard state to preview unsaved changes, 
      // or we just fetch the saved one. The prompt says 'live preview', so maybe it needs the config.
      // But typically API expects the card ID. 
      // We will just fetch using the card ID for now.
      const res = await getCardAggregate(spaceId, currentCard.id, currentCard);
      setAggregateValue(res.value || 0);
    } catch (error) {
      console.error('Preview error', error);
      setAggregateValue('Error');
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
      const updated = await updateOverviewCard(spaceId, localCard.id, localCard);
      toast.success('Card settings saved');
      if (onSave) onSave(updated);
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
    setLocalCard({ ...localCard, data_source_board_id: boardId, measure_field_id: '' });
    if (boardId) {
      fetchAvailableFields(boardId);
    } else {
      setAvailableFields([]);
    }
  };

  const handleFilterChange = (filterName) => {
    setLocalCard((prev) => {
      const filters = prev.filters || {};
      return {
        ...prev,
        filters: {
          ...filters,
          [filterName]: !filters[filterName]
        }
      };
    });
  };

  if (!localCard) return null;

  return (
    <Modal show={show} onHide={onHide} dialogClassName="card-settings-modal" centered backdrop="static">
      <div className="card-settings-container">
        {/* Left Panel: Preview */}
        <div className="preview-panel">
          <div className="preview-header">
            <span className="preview-title">Preview</span>
          </div>
          <div className="preview-card">
            <h3 className="card-name-preview">{localCard.name || 'Untitled Card'}</h3>
            <div className="card-value-preview">
              {loadingPreview ? <Spinner animation="border" variant="primary" /> : aggregateValue}
              {localCard.units !== 'None' && <span className="card-units">{localCard.units}</span>}
            </div>
            <div className="card-calculation-preview">
              {localCard.calculation}
            </div>
          </div>
        </div>

        {/* Right Panel: Content */}
        <div className="content-panel">
          <div className="content-header">
            <Nav variant="underline" activeKey={activeTab} onSelect={handleTabSelect} className="modal-tabs">
              <Nav.Item>
                <Nav.Link eventKey="settings">
                  <Settings size={18} className="me-2" />
                  Settings
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="data">
                  <Database size={18} className="me-2" />
                  Data
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <button className="close-btn" onClick={onHide}><X size={24} /></button>
          </div>

          <div className="content-body">
            {activeTab === 'settings' && (
              <div className="settings-tab">
                <Form.Group className="mb-4">
                  <Form.Control
                    type="text"
                    name="overview_card_title_input"
                    autoComplete="off"
                    className="card-name-input"
                    value={localCard.name}
                    onChange={(e) => setLocalCard({ ...localCard, name: e.target.value })}
                    placeholder="Card Name"
                  />
                </Form.Group>

                <div className="settings-grid">
                  <Form.Group className="mb-3">
                    <Form.Label className="settings-label">Data Source</Form.Label>
                    <Form.Select value={localCard.data_source_board_id || ''} onChange={handleSourceChange}>
                      <option value="">Select a list</option>
                      {childLists && childLists.map((list) => (
                        <option key={list.id} value={list.id}>{list.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="settings-label">Measure</Form.Label>
                    <Form.Select
                      value={localCard.measure_field_id || ''}
                      onChange={(e) => setLocalCard({ ...localCard, measure_field_id: e.target.value })}
                      disabled={fetchingFields || !localCard.data_source_board_id}
                    >
                      <option value="">Select field</option>
                      {availableFields.map((field) => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="settings-label">Calculation</Form.Label>
                    <Form.Select
                      value={localCard.calculation || ''}
                      onChange={(e) => setLocalCard({ ...localCard, calculation: e.target.value })}
                    >
                      <option value="Sum">Sum</option>
                      <option value="Count">Count</option>
                      <option value="Average">Average</option>
                      <option value="Min">Min</option>
                      <option value="Max">Max</option>
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
                </div>

                <div className="filters-section mt-4">
                  <h6 className="settings-label mb-3">
                    <Filter size={16} className="me-2" />
                    Filters
                  </h6>
                  <Form.Check
                    type="checkbox"
                    label="Show closed"
                    checked={localCard.filters?.showClosed || false}
                    onChange={() => handleFilterChange('showClosed')}
                    className="mb-2 custom-checkbox"
                  />
                  <Form.Check
                    type="checkbox"
                    label="Show archived"
                    checked={localCard.filters?.showArchived || false}
                    onChange={() => handleFilterChange('showArchived')}
                    className="custom-checkbox"
                  />
                </div>

                <div className="settings-footer">
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
                    <span className="total-value">{aggregateValue} {localCard.units !== 'None' ? localCard.units : ''}</span>
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
