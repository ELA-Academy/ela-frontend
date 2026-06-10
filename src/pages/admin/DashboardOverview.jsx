import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FolderKanban,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { getBoards } from "../../services/boardService";
import { getMyTasks } from "../../services/taskService";
import { CardSkeleton, ListSkeleton } from "../../components/Skeleton";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const DashboardOverview = () => {
  const { user, unreadTasks, unreadMessages, unreadCount } = useAuth();
  const [overview, setOverview] = useState(null);
  const [boards, setBoards] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [boardsError, setBoardsError] = useState("");
  const [tasksError, setTasksError] = useState("");

  const isSuperAdmin = user?.role === "superadmin";
  const dashboardRoutes = user?.dashboardRoutes || [];
  const departmentNames = user?.departmentNames || [];

  const canAccessRoute = (route) => isSuperAdmin || dashboardRoutes.includes(route);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoadingOverview(true);
        setOverviewError("");
        const response = await api.get("/dashboard/overview");
        setOverview(response.data);
      } catch (err) {
        setOverviewError("Overview metrics could not be loaded.");
        console.error("Dashboard overview fetch error:", err);
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoadingBoards(true);
        setBoardsError("");
        const boardsData = await getBoards();
        setBoards(Array.isArray(boardsData) ? boardsData : []);
      } catch (err) {
        setBoardsError("Workspace data could not be loaded.");
        console.error("Dashboard boards fetch error:", err);
      } finally {
        setLoadingBoards(false);
      }
    };

    fetchBoards();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        setTasksError("");
        const tasksData = await getMyTasks();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (err) {
        setTasksError("Assigned work could not be loaded.");
        console.error("Dashboard tasks fetch error:", err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, []);

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "Completed" && task.status !== "Done"),
    [tasks]
  );

  const personalTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      if (task.task_type === "board") return true;
      return task.assigned_staff_names?.includes(user?.name);
    });
  }, [activeTasks, user?.name]);

  const departmentTasks = useMemo(() => {
    if (!departmentNames.length) return [];
    return activeTasks.filter((task) => {
      const assignedDepartments = task.assigned_department_names || [];
      return assignedDepartments.some((deptName) => departmentNames.includes(deptName));
    });
  }, [activeTasks, departmentNames]);

  const completionRate = useMemo(() => {
    if (!tasks.length) return 0;
    const complete = tasks.filter((task) => task.status === "Completed" || task.status === "Done").length;
    return Math.round((complete / tasks.length) * 100);
  }, [tasks]);

  const totalStaff = overview?.total_staff || 0;
  const totalDepts = overview?.total_departments || 0;
  const totalLeads = overview?.total_leads || 0;
  const totalStudents = overview?.total_students || 0;

  const moduleCards = [
    {
      title: "Workspaces",
      description: "Projects, boards, status groups, task ownership, comments, and timeline views.",
      icon: FolderKanban,
      to: "/admin/boards",
      badge: boards.length,
      badgeLabel: "boards",
      metric: `${completionRate}% completion`,
      accent: "bg-sky-50 text-sky-700 border-sky-100",
      visible: true,
      loading: loadingBoards,
      error: boardsError
    },
    {
      title: "My Tasks",
      description: "Assigned work across department tasks and workspace project tasks.",
      icon: ClipboardCheck,
      to: "/admin/tasks",
      badge: unreadTasks || personalTasks.length,
      badgeLabel: "active",
      metric: `${personalTasks.length} personal tasks`,
      accent: "bg-amber-50 text-amber-700 border-amber-100",
      visible: true,
      loading: loadingTasks,
      error: tasksError
    },
    {
      title: "Admissions",
      description: "Lead pipeline, follow-ups, enrollment workflow, and department handoff tasks.",
      icon: UserPlus,
      to: "/admin/admissions",
      badge: totalLeads,
      badgeLabel: "leads",
      metric: "Admissions dashboard",
      accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
      visible: canAccessRoute("/admin/admissions"),
      loading: loadingOverview,
      error: overviewError
    },
    {
      title: "Accounting",
      description: "Payments, invoices, ledgers, subsidies, revenue, and finance work queues.",
      icon: DollarSign,
      to: "/admin/accounting",
      badge: departmentTasks.length,
      badgeLabel: "tasks",
      metric: "Accounting dashboard",
      accent: "bg-cyan-50 text-cyan-700 border-cyan-100",
      visible: canAccessRoute("/admin/accounting"),
      loading: loadingTasks,
      error: tasksError
    },
    {
      title: "Administration",
      description: "Operational messages, logs, internal controls, and administration workflows.",
      icon: BriefcaseBusiness,
      to: "/admin/administration",
      badge: unreadMessages,
      badgeLabel: "alerts",
      metric: "Administration dashboard",
      accent: "bg-violet-50 text-violet-700 border-violet-100",
      visible: canAccessRoute("/admin/administration"),
      loading: loadingTasks,
      error: tasksError
    },
    {
      title: "Messaging",
      description: "Team conversations, private messages, assignment notifications, and mentions.",
      icon: MessageSquare,
      to: "/admin/messaging",
      badge: unreadMessages,
      badgeLabel: "unread",
      metric: `${unreadCount} notifications`,
      accent: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
      visible: true,
      loading: false,
      error: ""
    },
    {
      title: "Departments",
      description: "Department ownership, routing, team allocation, and operational grouping.",
      icon: Building2,
      to: "/admin/departments",
      badge: totalDepts,
      badgeLabel: "teams",
      metric: "Organization structure",
      accent: "bg-slate-50 text-slate-700 border-slate-100",
      visible: isSuperAdmin,
      loading: loadingOverview,
      error: overviewError
    },
    {
      title: "Activity Feed",
      description: "Audit trail for lead updates, task changes, staff actions, and workflow history.",
      icon: Activity,
      to: "/admin/activity-feed",
      badge: overview?.recent_activities?.length || 0,
      badgeLabel: "recent",
      metric: "Live activity",
      accent: "bg-rose-50 text-rose-700 border-rose-100",
      visible: isSuperAdmin,
      loading: loadingOverview,
      error: overviewError
    }
  ].filter((card) => card.visible);

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen space-y-6">
      <div className="dashboard-hero-panel">
        <div>
          <div className="dashboard-hero-breadcrumb">Team Space / Overview /</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 m-0">
            Welcome back, {user?.name || "Team Member"}
          </h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-3xl">
            One place to enter the workspaces, departments, messages, reports, and actions
            assigned to your role.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <Link to="/admin/boards" className="dashboard-top-action">
            <FolderKanban className="w-4 h-4" />
            Open Workspaces
          </Link>
          <Link to="/admin/tasks" className="dashboard-top-action dashboard-top-action-dark">
            <ClipboardCheck className="w-4 h-4" />
            View My Tasks
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loadingBoards ? (
          <CardSkeleton count={1} />
        ) : (
          <SummaryCard icon={FolderKanban} label="Workspaces" value={boards.length} detail={boardsError || "Active project boards"} />
        )}
        {loadingTasks ? (
          <CardSkeleton count={1} />
        ) : (
          <SummaryCard icon={ClipboardCheck} label="Personal Tasks" value={personalTasks.length} detail={tasksError || "Assigned directly to you"} />
        )}
        {loadingTasks ? (
          <CardSkeleton count={1} />
        ) : (
          <SummaryCard icon={Users} label="Department Work" value={departmentTasks.length} detail={tasksError || "Assigned to your department"} />
        )}
        <SummaryCard icon={Bell} label="Needs Attention" value={unreadCount + unreadMessages + unreadTasks} detail="Notifications, messages, tasks" />
      </div>

      <div className={`grid grid-cols-1 ${isSuperAdmin ? "xl:grid-cols-3" : ""} gap-6`}>
        <div className={isSuperAdmin ? "xl:col-span-2 bg-white rounded-2xl border border-neutral-100 shadow-sm p-5" : "bg-white rounded-2xl border border-neutral-100 shadow-sm p-5"}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-950 m-0">Operational Modules</h2>
              <p className="text-xs text-neutral-400 m-0 mt-1">Open the dashboards available to your role.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleCards.map((card) => (
              <ModuleCard key={card.title} card={card} />
            ))}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-950 m-0">Executive Snapshot</h2>
              </div>
              <BarChart3 className="w-5 h-5 text-neutral-400" />
            </div>

            {loadingOverview ? (
              <ListSkeleton count={4} />
            ) : (
              <>
                <div className="space-y-3">
                  <KpiRow icon={Users} label="Staff" value={totalStaff} />
                  <KpiRow icon={Building2} label="Departments" value={totalDepts} />
                  <KpiRow icon={UserCheck} label="Leads" value={totalLeads} />
                  <KpiRow icon={GraduationCap} label="Students" value={totalStudents} />
                </div>

                <div className="mt-5 pt-5 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-500">Project Health</span>
                    <span className="text-xs font-bold text-emerald-600">On track</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-950 rounded-full" style={{ width: `${Math.max(completionRate, 12)}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardPanel title="Personal Assigned Work" subtitle="Tasks assigned directly to you">
          {loadingTasks ? (
            <ListSkeleton count={4} />
          ) : (
            <>
              {personalTasks.slice(0, 5).map((task) => (
                <TaskRow key={`personal-${task.task_type}-${task.id}`} task={task} />
              ))}
              {!personalTasks.length && <EmptyPanelText>No personal tasks assigned.</EmptyPanelText>}
            </>
          )}
        </DashboardPanel>

        <DashboardPanel title="Department Assigned Work" subtitle={departmentNames.length ? departmentNames.join(" | ") : "No department assigned"}>
          {loadingTasks ? (
            <ListSkeleton count={4} />
          ) : (
            <>
              {departmentTasks.slice(0, 5).map((task) => (
                <TaskRow key={`department-${task.task_type}-${task.id}`} task={task} />
              ))}
              {!departmentTasks.length && <EmptyPanelText>No department tasks assigned.</EmptyPanelText>}
            </>
          )}
        </DashboardPanel>

        {isSuperAdmin && (
          <DashboardPanel title="Recent Activity" subtitle="Audit trail and operational movement">
            {loadingOverview ? (
              <ListSkeleton count={4} />
            ) : (
              <>
                {overview?.recent_activities?.slice(0, 5).map((act) => (
                  <Link key={act.id} to="/admin/activity-feed" className="dashboard-list-row">
                    <div className="dashboard-list-icon">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="dashboard-list-title">
                        {act.actor_name} {act.action}
                      </div>
                      <div className="dashboard-list-meta">{timeAgo(act.created_at)}</div>
                    </div>
                  </Link>
                ))}
                {!overview?.recent_activities?.length && <EmptyPanelText>No recent activity yet.</EmptyPanelText>}
              </>
            )}
          </DashboardPanel>
        )}
      </div>
    </div>
  );
};

const ModuleCard = ({ card }) => (
  <Link to={card.to} className="module-card">
    <div className="flex items-start justify-between gap-4">
      <div className={`module-card-icon ${card.accent}`}>
        <card.icon className="w-5 h-5" />
      </div>
      <ArrowUpRight className="w-4 h-4 text-neutral-300" />
    </div>
    <div>
      <div className="flex items-center gap-2 mt-5">
        <h3 className="text-base font-bold text-neutral-950 m-0">{card.title}</h3>
        <span className="module-card-badge">
          {card.loading ? "..." : card.badge} {card.badgeLabel}
        </span>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed mt-2 mb-4">{card.description}</p>
      <div className="module-card-footer">
        <span>{card.error || card.metric}</span>
        <span>Open</span>
      </div>
    </div>
  </Link>
);

const SummaryCard = ({ icon: Icon, label, value, detail }) => (
  <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900">
        <Icon className="w-5 h-5" />
      </div>
      <ArrowUpRight className="w-4 h-4 text-neutral-300" />
    </div>
    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</div>
    <div className="text-3xl font-extrabold text-neutral-950 mt-1">{value}</div>
    <div className="text-xs text-neutral-400 mt-2">{detail}</div>
  </div>
);

const KpiRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-neutral-500" />
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
    </div>
    <span className="text-sm font-extrabold text-neutral-950">{value}</span>
  </div>
);

const DashboardPanel = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
    <div className="mb-4">
      <h2 className="text-base font-bold text-neutral-950 m-0">{title}</h2>
      <p className="text-xs text-neutral-400 m-0 mt-1">{subtitle}</p>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const TaskRow = ({ task }) => (
  <Link
    to={task.task_type === "board" && task.board_id ? `/admin/boards/${task.board_id}?task=${task.id}` : "/admin/tasks"}
    className="dashboard-list-row"
  >
    <div className="dashboard-list-icon">
      <CheckCircle2 className="w-4 h-4" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="dashboard-list-title">{task.title}</div>
      <div className="dashboard-list-meta">
        {task.board_name || task.lead_status || "Task"} · {task.status}
      </div>
    </div>
  </Link>
);

const EmptyPanelText = ({ children }) => (
  <div className="text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-xl px-4 py-6 text-center">
    {children}
  </div>
);

export default DashboardOverview;
