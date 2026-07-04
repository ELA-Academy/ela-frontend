import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/admin/PageHeader";
import TaskList from "../../components/admin/TaskList";
import EditTaskModal from "../../components/admin/EditTaskModal";
import { 
  getMyTasks, 
  getPersonalBoard, 
  createPersonalList, 
  createPersonalTask, 
  updatePersonalList, 
  deletePersonalList, 
  updatePersonalTask, 
  deletePersonalTask 
} from "../../services/taskService";
import { Spinner, Alert, Tabs, Tab, Button, Form, Badge, Dropdown, Modal } from "react-bootstrap";
import { Plus, Trash2, Edit3, Calendar, CheckSquare, Square, ChevronDown, ChevronRight, List, Lock, MoreHorizontal } from "lucide-react";
import { toast } from "react-toastify";

const AllTasksPage = () => {
  const [activeTab, setActiveTab] = useState("assigned");
  
  // Assigned Tasks States
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [assignedError, setAssignedError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  // Personal Tasks States
  const [personalBoard, setPersonalBoard] = useState(null);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [personalError, setPersonalError] = useState("");
  const [collapsedLists, setCollapsedLists] = useState({});
  
  // List Creation/Editing Modal
  const [showListModal, setShowListModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [listNameInput, setListNameInput] = useState("");
  const [listColorInput, setListColorInput] = useState("#673de6");

  // Inline Quick Task Titles
  const [quickTaskTitles, setQuickTaskTitles] = useState({});

  // -------------------------------------------------------------
  // Assigned Tasks Loading
  // -------------------------------------------------------------
  const fetchAssignedTasks = useCallback(async () => {
    try {
      setAssignedLoading(true);
      const data = await getMyTasks();
      // Filter out tasks of type 'personal' since those will be managed in the Personal Lists tab
      setAssignedTasks(data.filter(t => t.task_type !== "personal"));
    } catch (err) {
      setAssignedError("Failed to fetch assigned tasks.");
    } finally {
      setAssignedLoading(false);
    }
  }, []);

  // -------------------------------------------------------------
  // Personal Board Loading
  // -------------------------------------------------------------
  const fetchPersonalBoard = useCallback(async () => {
    try {
      setPersonalLoading(true);
      const data = await getPersonalBoard();
      setPersonalBoard(data);
    } catch (err) {
      setPersonalError("Failed to load personal lists.");
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedTasks();
    fetchPersonalBoard();
  }, [fetchAssignedTasks, fetchPersonalBoard]);

  // -------------------------------------------------------------
  // Edit Assigned Task Modal handlers
  // -------------------------------------------------------------
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setCurrentTask(null);
    setShowEditModal(false);
  };

  const handleTaskUpdated = () => {
    fetchAssignedTasks();
  };

  // -------------------------------------------------------------
  // Personal List Handlers
  // -------------------------------------------------------------
  const handleOpenCreateList = () => {
    setEditingList(null);
    setListNameInput("");
    setListColorInput("#673de6");
    setShowListModal(true);
  };

  const handleOpenEditList = (list) => {
    setEditingList(list);
    setListNameInput(list.name);
    setListColorInput(list.color || "#673de6");
    setShowListModal(true);
  };

  const handleSaveList = async (e) => {
    e.preventDefault();
    if (!listNameInput.trim()) return;

    try {
      if (editingList) {
        await updatePersonalList(editingList.id, {
          name: listNameInput.trim(),
          color: listColorInput
        });
        toast.success("List updated successfully");
      } else {
        await createPersonalList({
          name: listNameInput.trim(),
          color: listColorInput
        });
        toast.success("List created successfully");
      }
      setShowListModal(false);
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to save list.");
    }
  };

  const handleDeleteListClick = async (listId) => {
    if (!window.confirm("Are you sure you want to delete this list and all tasks inside?")) return;
    try {
      await deletePersonalList(listId);
      toast.success("List deleted");
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to delete list.");
    }
  };

  const toggleListCollapse = (listId) => {
    setCollapsedLists(prev => ({
      ...prev,
      [listId]: !prev[listId]
    }));
  };

  // -------------------------------------------------------------
  // Personal Task Handlers
  // -------------------------------------------------------------
  const handleAddQuickTask = async (listId) => {
    const title = quickTaskTitles[listId];
    if (!title || !title.trim()) return;

    try {
      await createPersonalTask({
        list_id: listId,
        title: title.trim(),
        status: "Not Started",
        priority: "Normal"
      });
      setQuickTaskTitles(prev => ({ ...prev, [listId]: "" }));
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to add task.");
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === "Done" ? "Not Started" : "Done";
    try {
      await updatePersonalTask(task.id, { status: nextStatus });
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleUpdateTaskPriority = async (task, priority) => {
    try {
      await updatePersonalTask(task.id, { priority });
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to update priority.");
    }
  };

  const handleUpdateTaskDueDate = async (task, dateVal) => {
    try {
      await updatePersonalTask(task.id, { due_date: dateVal || null });
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to update due date.");
    }
  };

  const handleDeletePersonalTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deletePersonalTask(taskId);
      toast.success("Task deleted");
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

  return (
    <>
      <style>
        {`
          .my-tasks-tabs .nav-link {
            border: none;
            color: #64748b;
            font-weight: 600;
            padding: 10px 20px;
            font-size: 14px;
            transition: all 0.2s;
            position: relative;
          }
          .my-tasks-tabs .nav-link.active {
            color: #673de6;
            background: transparent;
          }
          .my-tasks-tabs .nav-link.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 20px;
            right: 20px;
            height: 3px;
            background: #673de6;
            border-radius: 3px;
          }
          .personal-list-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 20px;
            overflow: hidden;
          }
          .personal-list-header {
            padding: 14px 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .personal-task-row {
            padding: 10px 20px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: background 0.15s;
          }
          .personal-task-row:hover {
            background: #f8fafc;
          }
          .personal-task-row.is-done .task-title {
            text-decoration: line-through;
            color: #94a3b8;
          }
          .task-checkbox {
            cursor: pointer;
            color: #64748b;
            transition: color 0.15s;
          }
          .task-checkbox:hover {
            color: #673de6;
          }
          .priority-dropdown button {
            border: none;
            background: transparent;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
            font-size: 11px;
          }
          .priority-dropdown button:hover {
            background: rgba(0,0,0,0.05);
          }
          .quick-add-task-row {
            padding: 10px 20px;
            background: #fff;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .color-dot-select {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid transparent;
            transition: transform 0.1s;
          }
          .color-dot-select.selected {
            border-color: #000;
            transform: scale(1.15);
          }
        `}
      </style>

      <PageHeader title="My Tasks" />

      <div className="px-4">
        <Tabs
          id="my-tasks-tabs"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="my-tasks-tabs mb-4 border-bottom"
        >
          <Tab eventKey="assigned" title="Assigned to Me">
            {assignedLoading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : assignedError ? (
              <Alert variant="danger">{assignedError}</Alert>
            ) : (
              <TaskList
                tasks={assignedTasks}
                title="All Assigned Tasks"
                onEditTask={handleEditTask}
                onTaskUpdated={handleTaskUpdated}
              />
            )}
          </Tab>

          <Tab eventKey="personal" title="Personal Tasks & Lists">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-2">
                <Lock size={16} className="text-slate-400" />
                <span className="text-slate-500" style={{ fontSize: '13px' }}>Private to you</span>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleOpenCreateList}
                style={{ background: "#673de6", borderColor: "#673de6" }}
              >
                <Plus size={16} className="me-1" /> New List
              </Button>
            </div>

            {personalLoading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : personalError ? (
              <Alert variant="danger">{personalError}</Alert>
            ) : !personalBoard || !personalBoard.groups || personalBoard.groups.length === 0 ? (
              <div className="text-center py-5 border rounded-3 bg-white">
                <List size={40} className="text-slate-300 mb-3" />
                <h5>No Personal Lists yet</h5>
                <p className="text-slate-500 mb-4">Create your first private list to organize your personal todos.</p>
                <Button 
                  variant="primary" 
                  onClick={handleOpenCreateList}
                  style={{ background: "#673de6", borderColor: "#673de6" }}
                >
                  Create List
                </Button>
              </div>
            ) : (
              personalBoard.groups.map(list => {
                const isCollapsed = !!collapsedLists[list.id];
                return (
                  <div key={list.id} className="personal-list-card">
                    <div className="personal-list-header">
                      <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => toggleListCollapse(list.id)}>
                        <span className="text-slate-400">
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                        </span>
                        <span 
                          className="rounded-circle" 
                          style={{ width: "10px", height: "10px", backgroundColor: list.color || "#673de6", display: "inline-block" }}
                        />
                        <h6 className="mb-0 fw-bold text-slate-800">{list.name}</h6>
                        <Badge bg="light" text="dark" className="ms-2 border" style={{ fontSize: "11px" }}>
                          {list.tasks?.length || 0}
                        </Badge>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <Dropdown align="end">
                          <Dropdown.Toggle as="button" className="border-0 bg-transparent p-1 text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow border">
                            <Dropdown.Item onClick={() => handleOpenEditList(list)}>
                              <Edit3 size={14} className="me-2" /> Rename List
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => handleDeleteListClick(list.id)} className="text-danger">
                              <Trash2 size={14} className="me-2" /> Delete List
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="personal-list-content">
                        {(!list.tasks || list.tasks.length === 0) ? (
                          <div className="text-center py-4 text-slate-400" style={{ fontSize: "13px" }}>
                            No tasks in this list. Add one below.
                          </div>
                        ) : (
                          list.tasks.map(task => {
                            const isDone = task.status === "Done";
                            const pColor = 
                              task.priority === "Urgent" ? "#ef4444" : 
                              task.priority === "High" ? "#f57c00" : 
                              task.priority === "Low" ? "#94a3b8" : "#3b82f6";
                            
                            return (
                              <div key={task.id} className={`personal-task-row ${isDone ? "is-done" : ""}`}>
                                <div className="task-checkbox" onClick={() => handleToggleTaskStatus(task)}>
                                  {isDone ? (
                                    <CheckSquare size={18} className="text-success" />
                                  ) : (
                                    <Square size={18} />
                                  )}
                                </div>
                                
                                <div className="flex-grow-1 task-title text-slate-800 fw-medium" style={{ fontSize: "13.5px" }}>
                                  {task.title}
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                  {/* Priority Dropdown */}
                                  <Dropdown className="priority-dropdown">
                                    <Dropdown.Toggle as="button" style={{ color: pColor }}>
                                      {task.priority || "Normal"}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="shadow border" style={{ fontSize: "12px" }}>
                                      <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "Urgent")} className="text-danger">Urgent</Dropdown.Item>
                                      <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "High")} style={{ color: "#f57c00" }}>High</Dropdown.Item>
                                      <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "Normal")} className="text-primary">Normal</Dropdown.Item>
                                      <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "Low")} className="text-muted">Low</Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>

                                  {/* Due Date picker */}
                                  <div className="d-flex align-items-center text-slate-400 gap-1" style={{ fontSize: "12px", position: "relative" }}>
                                    <Calendar size={13} />
                                    <input 
                                      type="date" 
                                      value={task.due_date ? task.due_date.substring(0, 10) : ""}
                                      onChange={(e) => handleUpdateTaskDueDate(task, e.target.value)}
                                      className="border-0 p-0 text-slate-600 bg-transparent cursor-pointer"
                                      style={{ outline: "none", fontSize: "12px", width: "105px" }}
                                    />
                                  </div>

                                  {/* Delete Task */}
                                  <button 
                                    className="border-0 bg-transparent text-slate-400 hover:text-danger p-1"
                                    onClick={() => handleDeletePersonalTask(task.id)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Quick Add Task Row */}
                        <div className="quick-add-task-row border-top">
                          <Plus size={16} className="text-slate-400" />
                          <Form.Control
                            type="text"
                            placeholder="Add task..."
                            value={quickTaskTitles[list.id] || ""}
                            onChange={(e) => setQuickTaskTitles(prev => ({ ...prev, [list.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddQuickTask(list.id);
                              }
                            }}
                            className="border-0 p-0 shadow-none bg-transparent"
                            style={{ fontSize: "13px" }}
                          />
                          {quickTaskTitles[list.id]?.trim() && (
                            <Button 
                              size="sm" 
                              variant="link" 
                              onClick={() => handleAddQuickTask(list.id)}
                              style={{ color: "#673de6", fontWeight: "600", textDecoration: "none", fontSize: "12px" }}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Tab>
        </Tabs>
      </div>

      {/* Edit Assigned Task Modal */}
      {currentTask && (
        <EditTaskModal
          show={showEditModal}
          handleClose={handleCloseModal}
          task={currentTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Create/Edit List Modal */}
      <Modal show={showListModal} onHide={() => setShowListModal(false)} centered>
        <Form onSubmit={handleSaveList}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "16px", fontWeight: "700" }}>
              {editingList ? "Rename List" : "Create Personal List"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "13px", fontWeight: "600" }}>List Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Weekly Goals, Urgent Todos"
                value={listNameInput}
                onChange={(e) => setListNameInput(e.target.value)}
                required
                style={{ fontSize: "13.5px" }}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: "13px", fontWeight: "600" }}>Theme Color</Form.Label>
              <div className="d-flex gap-2 mt-1">
                {["#673de6", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map(c => (
                  <span
                    key={c}
                    className={`color-dot-select ${listColorInput === c ? "selected" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setListColorInput(c)}
                  />
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowListModal(false)} style={{ fontSize: "13px" }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              style={{ background: "#673de6", borderColor: "#673de6", fontSize: "13px" }}
            >
              {editingList ? "Save Changes" : "Create List"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default AllTasksPage;
