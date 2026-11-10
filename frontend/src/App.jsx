import { useCallback, useEffect, useMemo, useState } from "react";
import {
    LayoutDashboard,
    Ticket,
    Plus,
    Search,
    Users,
    UserPlus,
    Power,
    Mail,
    Settings,
    Bell,
    RefreshCw,
    Clock,
    AlertCircle,
    CheckCircle2,
    CircleDot,
    MessageSquare,
    ArrowUpRight,
    X,
    Save,
    LogOut
} from "lucide-react";

import {
    getDashboard,
    getTickets,
    updateProfile,
    getAgents,
    createAgent,
    updateAgentStatus
} from "./services/api";

import CreateTicket from "./pages/CreateTicket";
import TicketDetails from "./pages/TicketDetails";
import NotificationCenter from "./components/NotificationCenter";
import "./App.css";

const EMPTY_STATS = {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    waitingOnCustomerTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
    overdueTickets: 0,
    totalAgents: 0,
    totalCustomers: 0
};

const isTicketOverdue = (ticket) => {
    if (!ticket || ticket.status === "Resolved" || !ticket.createdAt) {
        return false;
    }

    const createdTime = new Date(ticket.createdAt).getTime();

    if (!Number.isFinite(createdTime)) {
        return false;
    }

    return Date.now() - createdTime > 24 * 60 * 60 * 1000;
};

function App({ user, onLogout, onProfileUpdated }) {

    const role = user?.role || "Customer";

    // =====================================
    // STATES
    // =====================================

    const [stats, setStats] = useState(EMPTY_STATS);
    const [tickets, setTickets] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [assigneeFilter, setAssigneeFilter] = useState("");
    const [sort, setSort] = useState("");

    const [activePage, setActivePage] = useState("dashboard");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Settings
    const [profileName, setProfileName] = useState(user?.name || "");
    const [profileEmail, setProfileEmail] = useState(user?.email || "");

    const [notificationsEnabled, setNotificationsEnabled] = useState(
        () => localStorage.getItem("supportNotifications") !== "false"
    );

    const [settingsMessage, setSettingsMessage] = useState("");
    const [settingsMessageType, setSettingsMessageType] = useState("success");
    const [savingSettings, setSavingSettings] = useState(false);

    // =====================================
    // AGENT MANAGEMENT STATES
    // =====================================

    const [agents, setAgents] = useState([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [agentsError, setAgentsError] = useState("");
    const [agentMessage, setAgentMessage] = useState("");

    const [agentForm, setAgentForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [agentSaving, setAgentSaving] = useState(false);
    const [updatingAgentId, setUpdatingAgentId] = useState(null);

    // Synchronize form with authenticated user
    useEffect(() => {
        setProfileName(user?.name || "");
        setProfileEmail(user?.email || "");
    }, [user?.name, user?.email]);

    // =====================================
    // SAVE PROFILE SETTINGS
    // =====================================

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSettingsMessage("");

        const name = profileName.trim();
        const email = profileEmail.trim().toLowerCase();

        if (!name || !email) {
            setSettingsMessageType("error");
            setSettingsMessage("Name and email are required.");
            return;
        }

        try {
            setSavingSettings(true);

            const response = await updateProfile({
                name,
                email
            });

            const updatedUser = response.data?.data;

            if (!updatedUser) {
                throw new Error(
                    "The server did not return the updated user profile."
                );
            }

            if (typeof onProfileUpdated === "function") {
                onProfileUpdated(updatedUser);
            }

            setProfileName(updatedUser.name || name);
            setProfileEmail(updatedUser.email || email);

            localStorage.setItem(
                "supportNotifications",
                String(notificationsEnabled)
            );

            setSettingsMessageType("success");
            setSettingsMessage(
                "Profile and settings updated successfully!"
            );

        } catch (error) {
            console.error("Profile update error:", error);

            setSettingsMessageType("error");
            setSettingsMessage(
                error.response?.data?.message ||
                error.message ||
                "Unable to update profile. Please try again."
            );

        } finally {
            setSavingSettings(false);
        }
    };

    // =====================================
    // FETCH AGENTS
    // =====================================

    const fetchAgents = useCallback(async () => {
        if (role !== "Admin") return;

        try {
            setAgentsLoading(true);
            setAgentsError("");

            const response = await getAgents();

            setAgents(response.data?.data || []);

        } catch (error) {
            console.error("Fetch agents error:", error);

            setAgentsError(
                error.response?.data?.message ||
                "Unable to load Agents."
            );

        } finally {
            setAgentsLoading(false);
        }
    }, [role]);

    // =====================================
    // CREATE AGENT
    // =====================================

    const handleCreateAgent = async (e) => {
        e.preventDefault();

        setAgentMessage("");
        setAgentsError("");

        const name = agentForm.name.trim();
        const email = agentForm.email.trim().toLowerCase();
        const password = agentForm.password;

        if (!name || !email || !password) {
            setAgentsError("Please complete all Agent details.");
            return;
        }

        try {
            setAgentSaving(true);

            const response = await createAgent({
                name,
                email,
                password
            });

            setAgentMessage(
                response.data?.message || "Agent created successfully."
            );

            setAgentForm({
                name: "",
                email: "",
                password: ""
            });

            await fetchAgents();
            await fetchDashboard();

        } catch (error) {
            console.error("Create agent error:", error);

            setAgentsError(
                error.response?.data?.message ||
                "Unable to create Agent."
            );

        } finally {
            setAgentSaving(false);
        }
    };

    // =====================================
    // ACTIVATE / DEACTIVATE AGENT
    // =====================================

    const handleAgentStatusChange = async (agent) => {
        try {
            setUpdatingAgentId(agent._id);
            setAgentsError("");
            setAgentMessage("");

            const newStatus = !agent.isActive;

            const response = await updateAgentStatus(
                agent._id,
                newStatus
            );

            setAgentMessage(
                response.data?.message || "Agent status updated."
            );

            await fetchAgents();
            await fetchDashboard();

        } catch (error) {
            console.error("Agent status update error:", error);

            setAgentsError(
                error.response?.data?.message ||
                "Unable to update Agent status."
            );

        } finally {
            setUpdatingAgentId(null);
        }
    };

    // =====================================
    // LOAD AGENTS WHEN PAGE OPENS
    // =====================================

    useEffect(() => {
        if (role === "Admin") {
            fetchAgents();
        }
    }, [role, fetchAgents]);

    // =====================================
    // FETCH DASHBOARD
    // =====================================

    const fetchDashboard = useCallback(async () => {
        try {
            const response = await getDashboard();

            setStats({
                ...EMPTY_STATS,
                ...(response.data?.data || {})
            });

        } catch (err) {
            console.error("Dashboard error:", err);
            setError("Unable to load dashboard statistics.");
        }
    }, []);

    // =====================================
    // FETCH TICKETS
    // =====================================

    const fetchTickets = useCallback(async () => {
        setLoading(true);

        try {
            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            if (statusFilter && statusFilter !== "Overdue") {
                params.status = statusFilter;
            }

            if (priorityFilter) {
                params.priority = priorityFilter;
            }

            if (assigneeFilter) {
                params.assignee = assigneeFilter;
            }

            if (sort) {
                params.sort = sort;
            }

            const response = await getTickets(params);

            let fetchedTickets = response.data?.data || [];

            if (statusFilter === "Overdue") {
                fetchedTickets = fetchedTickets.filter(isTicketOverdue);
            }

            setTickets(fetchedTickets);
            setError("");

        } catch (err) {
            console.error("Ticket fetching error:", err);
            setError("Unable to load tickets. Check your backend server.");
            setTickets([]);

        } finally {
            setLoading(false);
        }

    }, [search, statusFilter, priorityFilter, assigneeFilter, sort]);

    // =====================================
    // INITIAL LOAD
    // =====================================

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTickets();
        }, 300);

        return () => clearTimeout(timer);

    }, [fetchTickets]);

    // =====================================
    // REFRESH DATA
    // =====================================

    const refreshDashboard = async () => {
        await Promise.all([
            fetchDashboard(),
            fetchTickets()
        ]);
    };
        // =====================================
    // NAVIGATION
    // =====================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setPriorityFilter("");
        setAssigneeFilter("");
        setSort("");
    };

    const navigateTo = (page) => {
        setActivePage(page);
        setSelectedTicketId(null);
        setShowCreateForm(false);
        setError("");

        if (
            page === "customers" ||
            page === "conversations" ||
            page === "dashboard"
        ) {
            clearFilters();
        }
    };

    // =====================================
    // AFTER TICKET CREATION
    // =====================================

    const handleTicketCreated = async () => {
        setShowCreateForm(false);

        await Promise.all([
            fetchDashboard(),
            fetchTickets()
        ]);
    };

    // =====================================
    // AFTER TICKET UPDATE
    // =====================================

    const handleTicketUpdated = async () => {
        await Promise.all([
            fetchDashboard(),
            fetchTickets()
        ]);
    };

    // =====================================
    // CUSTOMER DATA
    // =====================================

    const customers = useMemo(() => {
        const grouped = new Map();

        tickets.forEach((ticket) => {
            const email = (ticket.customerEmail || "").trim();
            const name = (ticket.customerName || "").trim();

            const key = (email || name || "unknown").toLowerCase();

            if (!grouped.has(key)) {
                grouped.set(key, {
                    key,
                    name: name || "Unknown Customer",
                    email: email || "No email provided",
                    ticketCount: 0
                });
            }

            grouped.get(key).ticketCount += 1;
        });

        return Array.from(grouped.values());

    }, [tickets]);

    // =====================================
    // STATUS BADGE STYLES
    // =====================================

    const getStatusStyle = (status) => {
        const styles = {
            "Open": "bg-blue-100 text-blue-700",
            "In Progress": "bg-purple-100 text-purple-700",
            "Waiting on Customer": "bg-amber-100 text-amber-700",
            "Resolved": "bg-green-100 text-green-700",
            "Overdue": "bg-red-100 text-red-700"
        };

        return styles[status] || "bg-gray-100 text-gray-700";
    };

    // =====================================
    // PRIORITY BADGE STYLES
    // =====================================

    const getPriorityStyle = (priority) => {
        const styles = {
            "Low": "bg-gray-100 text-gray-700",
            "Medium": "bg-blue-100 text-blue-700",
            "High": "bg-orange-100 text-orange-700",
            "Urgent": "bg-red-100 text-red-700"
        };

        return styles[priority] || "bg-gray-100 text-gray-700";
    };

    // =====================================
    // ROLE-SPECIFIC DASHBOARD STATISTICS
    // =====================================

    const adminStatCards = [
        {
            title: "Total Tickets",
            value: stats.totalTickets,
            icon: Ticket
        },
        {
            title: "Open Tickets",
            value: stats.openTickets,
            icon: CircleDot
        },
        {
            title: "In Progress",
            value: stats.inProgressTickets,
            icon: Clock
        },
        {
            title: "Waiting on Customer",
            value: stats.waitingOnCustomerTickets,
            icon: MessageSquare
        },
        {
            title: "Resolved",
            value: stats.resolvedTickets,
            icon: CheckCircle2
        },
        {
            title: "Urgent Tickets",
            value: stats.urgentTickets,
            icon: AlertCircle
        },
        {
            title: "Overdue Tickets",
            value: stats.overdueTickets,
            icon: Clock
        },
        {
            title: "Active Agents",
            value: stats.totalAgents,
            icon: Users
        },
        {
            title: "Active Customers",
            value: stats.totalCustomers,
            icon: Users
        }
    ];

    const agentStatCards = [
        {
            title: "Assigned Tickets",
            value: stats.totalTickets,
            icon: Ticket
        },
        {
            title: "Open Tickets",
            value: stats.openTickets,
            icon: CircleDot
        },
        {
            title: "In Progress",
            value: stats.inProgressTickets,
            icon: Clock
        },
        {
            title: "Waiting on Customer",
            value: stats.waitingOnCustomerTickets,
            icon: MessageSquare
        },
        {
            title: "Resolved",
            value: stats.resolvedTickets,
            icon: CheckCircle2
        },
        {
            title: "Urgent Tickets",
            value: stats.urgentTickets,
            icon: AlertCircle
        },
        {
            title: "Overdue Tickets",
            value: stats.overdueTickets,
            icon: Clock
        }
    ];

    const customerStatCards = [
        {
            title: "My Tickets",
            value: stats.totalTickets,
            icon: Ticket
        },
        {
            title: "Open Requests",
            value: stats.openTickets,
            icon: CircleDot
        },
        {
            title: "In Progress",
            value: stats.inProgressTickets,
            icon: Clock
        },
        {
            title: "Waiting for Me",
            value: stats.waitingOnCustomerTickets,
            icon: MessageSquare
        },
        {
            title: "Resolved",
            value: stats.resolvedTickets,
            icon: CheckCircle2
        }
    ];

    const statCards =
        role === "Admin"
            ? adminStatCards
            : role === "Agent"
                ? agentStatCards
                : customerStatCards;

    // =====================================
    // PAGE INFORMATION
    // =====================================

    const pageTitles = {
        dashboard: "Nexora Workspace",
        tickets: role === "Customer" ? "My Tickets" : "All Tickets",
        customers: "Customers",
        agents: "Agent Management",
        conversations: "Conversations",
        notifications: "Notifications",
        settings: "Settings"
    };

    const pageDescriptions = {
        dashboard:
            role === "Admin"
                ? "Every Query. One Intelligent Solution.."
                : role === "Agent"
                    ? "Monitor your assigned tickets and workload."
                    : "Track your support requests and their progress.",

        tickets:
            role === "Customer"
                ? "View and track your submitted support requests."
                : "Search, filter and manage support tickets.",

        customers: "View customers who submitted support requests.",
        agents: "Create, manage and monitor your support team.",
        conversations: "View customer replies and ticket conversations.",
        notifications: "Stay updated on ticket activity and important changes.",
        settings: "Manage your account preferences."
    };

    const allNavItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            roles: ["Admin", "Agent", "Customer"]
        },
        {
            id: "tickets",
            label: role === "Customer" ? "My Tickets" : "All Tickets",
            icon: Ticket,
            roles: ["Admin", "Agent", "Customer"]
        },
        {
            id: "customers",
            label: "Customers",
            icon: Users,
            roles: ["Admin"]
        },
        {
            id: "agents",
            label: "Agent Management",
            icon: UserPlus,
            roles: ["Admin"]
        },
        {
            id: "conversations",
            label: "Conversations",
            icon: MessageSquare,
            roles: ["Admin", "Agent", "Customer"]
        },
        {
            id: "notifications",
            label: "Notifications",
            icon: Bell,
            roles: ["Admin", "Agent", "Customer"]
        }
    ];

    const navItems = allNavItems.filter(item =>
        item.roles.includes(role)
    );

    // =====================================
    // MAIN UI
    // =====================================

    return (
        <div className={`app-shell app-role-${String(role).toLowerCase()} min-h-screen flex`}>

            {/* SIDEBAR */}

            <aside className="app-sidebar w-64 bg-slate-950 text-white hidden md:flex flex-col shrink-0">

                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">

                        <div className="app-brand-icon p-2 rounded-xl">
                            <Ticket size={23} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold">
                                Nexora
                            </h1>

                            <p className="text-xs text-slate-400">
                                Customer Support
                            </p>
                        </div>

                    </div>
                </div>

                <nav className="p-4 space-y-2 flex-1">

                    <p className="sidebar-label text-xs text-slate-400 uppercase font-semibold px-3 mb-3">
                        Workspace
                    </p>

                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activePage === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => navigateTo(item.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                                    active
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800"
                                }`}
                            >
                                <Icon size={19} />
                                {item.label}
                            </button>
                        );
                    })}

                    <p className="text-xs text-slate-400 uppercase font-semibold px-3 pt-6 mb-3">
                        Preferences
                    </p>

                    <button
                        type="button"
                        onClick={() => navigateTo("settings")}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                            activePage === "settings"
                                ? "bg-indigo-600 text-white"
                                : "text-slate-300 hover:bg-slate-800"
                        }`}
                    >
                        <Settings size={19} />
                        Settings
                    </button>

                </nav>

                {/* USER PROFILE AND LOGOUT */}

                <div className="p-4 border-t border-slate-800">

                    <div className="flex items-center gap-3 mb-4">

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-bold text-slate-950">
                            {(user?.name || "U").charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                                {user?.name || "User"}
                            </p>

                            <p className="text-xs text-slate-400 truncate">
                                {user?.role || "User"}
                            </p>

                            <p className="text-xs text-slate-500 truncate">
                                {user?.email || ""}
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-semibold">
                            Logout
                        </span>
                    </button>

                </div>

            </aside>

            {/* MAIN CONTENT */}

            <main className="app-main flex-1 min-w-0">

                {/* TOP HEADER */}

                <header className="app-header px-5 md:px-8 py-5 flex justify-between items-center gap-4">

                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {pageTitles[activePage]}
                        </h2>

                        <p className="text-sm text-slate-400 mt-1">
                            {pageDescriptions[activePage]}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={refreshDashboard}
                            disabled={loading}
                            className="glass-input p-3 rounded-xl"
                            title="Refresh"
                        >
                            <RefreshCw
                                size={19}
                                className={loading ? "refresh-spin" : ""}
                            />
                        </button>

                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="btn-primary flex items-center gap-2 px-4 py-3 rounded-xl font-semibold"
                        >
                            <Plus size={19} />
                            <span className="hidden sm:inline">
                                Create Ticket
                            </span>
                        </button>

                    </div>

                </header>

                <div className="app-content p-5 md:p-8">

                    {/* ERROR MESSAGE */}

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-400/20 text-red-300 p-4 rounded-xl flex items-center gap-2">
                            <AlertCircle size={19} />
                            {error}

                            <button
                                onClick={() => setError("")}
                                className="ml-auto"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* DASHBOARD PAGE */}

                    {activePage === "dashboard" && (

                        <div className="space-y-8">

                            {/* HERO SECTION */}

                            <section className="dashboard-hero role-hero relative overflow-hidden rounded-3xl p-7 md:p-9">
                                <div className="hero-orb hero-orb-one" />
                                <div className="hero-orb hero-orb-two" />

                                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                                    <div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-200">
                                            <span className="glow-dot" />
                                            SUPPORT OPERATIONS LIVE
                                        </div>

                                        <h2 className="mt-5 text-3xl md:text-4xl font-bold tracking-tight text-white">
                                            {role === "Admin" ? (
                                                <>
                                                    Manage your{" "}
                                                    <span className="hero-gradient-text">
                                                        support operations.
                                                    </span>
                                                </>
                                            ) : role === "Agent" ? (
                                                <>
                                                    Your workload,{" "}
                                                    <span className="hero-gradient-text">
                                                        under control.
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    Your support requests,{" "}
                                                    <span className="hero-gradient-text">
                                                        in one place.
                                                    </span>
                                                </>
                                            )}
                                        </h2>

                                        <p className="mt-3 max-w-xl text-sm md:text-base leading-7 text-slate-300">
                                            {role === "Admin"
                                                ? "Monitor your entire support team, manage tickets and track customer support performance."
                                                : role === "Agent"
                                                    ? "Manage your assigned tickets, respond to customers and keep requests moving."
                                                    : "Track your support requests, follow conversations and stay updated on ticket progress."}
                                        </p>
                                    </div>

                                    <div className="hero-side-note">
                                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                            Workspace status
                                        </span>

                                        <strong className="mt-2 block text-xl text-white">
                                            All systems ready
                                        </strong>

                                        <span className="mt-2 inline-flex items-center gap-2 text-sm text-emerald-300">
                                            <span className="glow-dot" />
                                            Connected to live database
                                        </span>
                                    </div>

                                </div>
                            </section>

                            {/* STATISTICS */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

                                {statCards.map((card) => {
                                    const Icon = card.icon;

                                    return (
                                        <div
                                            key={card.title}
                                            className="glass-card stat-card p-6"
                                        >
                                            <div className="flex justify-between items-center">

                                                <div>
                                                    <p className="text-sm text-slate-400">
                                                        {card.title}
                                                    </p>

                                                    <h3 className="stat-number text-3xl font-bold text-white mt-2">
                                                        {loading ? "—" : card.value}
                                                    </h3>
                                                </div>

                                                <div className="stat-icon p-4 rounded-xl bg-cyan-400/10 text-cyan-300">
                                                    <Icon size={25} />
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}

                            </div>

                            {/* RECENT TICKETS */}

                            <div className="flex justify-between items-center gap-4">

                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {role === "Customer"
                                            ? "My Recent Requests"
                                            : role === "Agent"
                                                ? "My Assigned Tickets"
                                                : "Recent Tickets"}
                                    </h3>

                                    <p className="text-sm text-slate-400">
                                        {role === "Customer"
                                            ? "Track the latest updates on your support requests."
                                            : role === "Agent"
                                                ? "Your latest assigned customer support tickets."
                                                : "Latest customer support requests across the system."}
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigateTo("tickets")}
                                    className="text-cyan-300 font-semibold text-sm hover:text-cyan-200 transition"
                                >
                                    View All Tickets
                                </button>

                            </div>

                            <TicketList
                                role={role}
                                agents={agents}
                                tickets={tickets}
                                loading={loading}
                                onSelect={setSelectedTicketId}
                                getStatusStyle={getStatusStyle}
                                getPriorityStyle={getPriorityStyle}
                                compact
                            />

                        </div>
                    )}
                            {/* ALL TICKETS PAGE */}

                    {activePage === "tickets" && (

                        <TicketList
                            role={role}
                            agents={agents}
                            tickets={tickets}
                            loading={loading}
                            onSelect={setSelectedTicketId}
                            getStatusStyle={getStatusStyle}
                            getPriorityStyle={getPriorityStyle}
                            search={search}
                            setSearch={setSearch}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            priorityFilter={priorityFilter}
                            setPriorityFilter={setPriorityFilter}
                            assigneeFilter={assigneeFilter}
                            setAssigneeFilter={setAssigneeFilter}
                            sort={sort}
                            setSort={setSort}
                        />

                    )}

                    {/* CUSTOMERS PAGE */}

                    {activePage === "customers" && role === "Admin" && (

                        <div className="glass-card overflow-hidden">

                            <div className="p-6 border-b border-slate-700/60">

                                <h3 className="text-lg font-bold text-white">
                                    Customer Directory
                                </h3>

                                <p className="text-sm text-slate-400 mt-1">
                                    Customers who have submitted support tickets.
                                </p>

                            </div>

                            {loading ? (
                                <div className="p-10 text-center text-slate-400">
                                    Loading customers...
                                </div>
                            ) : customers.length === 0 ? (
                                <div className="p-10 text-center text-slate-400">
                                    No customers found.
                                </div>
                            ) : (

                                <div className="divide-y divide-slate-700/50">

                                    {customers.map((customer) => (

                                        <div
                                            key={customer.key}
                                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >

                                            <div className="flex items-center gap-4">

                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-500/30 border border-cyan-300/20 text-cyan-200 flex items-center justify-center font-bold text-lg">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold text-white">
                                                        {customer.name}
                                                    </h4>

                                                    <p className="text-sm text-slate-400">
                                                        {customer.email}
                                                    </p>
                                                </div>

                                            </div>

                                            <div className="flex items-center gap-4">

                                                <span className="text-sm text-slate-300">
                                                    {customer.ticketCount} ticket(s)
                                                </span>

                                                <button
                                                    onClick={() => {
                                                        setSearch(
                                                            customer.email === "No email provided"
                                                                ? customer.name
                                                                : customer.email
                                                        );

                                                        setActivePage("tickets");
                                                    }}
                                                    className="text-cyan-300 text-sm font-semibold hover:text-cyan-200 transition"
                                                >
                                                    View Tickets
                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                    )}

                    {/* =====================================
                        AGENT MANAGEMENT PAGE
                    ===================================== */}

                    {activePage === "agents" && role === "Admin" && (

                        <div className="space-y-8">

                            {/* PAGE HEADER */}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        Manage Support Agents
                                    </h3>

                                    <p className="text-sm text-slate-400 mt-1">
                                        Create accounts and manage your support team.
                                    </p>
                                </div>

                                <div className="glass-card px-5 py-3">
                                    <p className="text-xs text-slate-400">
                                        Total Agents
                                    </p>

                                    <p className="text-2xl font-bold text-white">
                                        {agents.length}
                                    </p>
                                </div>

                            </div>

                            {/* SUCCESS MESSAGE */}

                            {agentMessage && (
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-sm">
                                    {agentMessage}
                                </div>
                            )}

                            {/* ERROR MESSAGE */}

                            {agentsError && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm">
                                    {agentsError}
                                </div>
                            )}

                            {/* CREATE AGENT FORM */}

                            <div className="glass-card p-6 md:p-7">

                                <div className="flex items-center gap-3 mb-6">

                                    <div className="p-3 rounded-xl bg-cyan-400/10 text-cyan-300">
                                        <UserPlus size={22} />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            Create New Agent
                                        </h3>

                                        <p className="text-sm text-slate-400">
                                            Add a new member to your support team.
                                        </p>
                                    </div>

                                </div>

                                <form
                                    onSubmit={handleCreateAgent}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                                >

                                    {/* AGENT NAME */}

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                                            Agent Name
                                        </label>

                                        <input
                                            type="text"
                                            value={agentForm.name}
                                            onChange={(e) =>
                                                setAgentForm({
                                                    ...agentForm,
                                                    name: e.target.value
                                                })
                                            }
                                            placeholder="Enter agent name"
                                            maxLength={100}
                                            required
                                            className="glass-input w-full px-4 py-3"
                                        />
                                    </div>

                                    {/* AGENT EMAIL */}

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                                            Email Address
                                        </label>

                                        <div className="relative">
                                            <Mail
                                                size={17}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                type="email"
                                                value={agentForm.email}
                                                onChange={(e) =>
                                                    setAgentForm({
                                                        ...agentForm,
                                                        email: e.target.value
                                                    })
                                                }
                                                placeholder="agent@example.com"
                                                required
                                                className="glass-input w-full pl-10 pr-4 py-3"
                                            />
                                        </div>
                                    </div>

                                    {/* PASSWORD */}

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                                            Temporary Password
                                        </label>

                                        <input
                                            type="password"
                                            value={agentForm.password}
                                            onChange={(e) =>
                                                setAgentForm({
                                                    ...agentForm,
                                                    password: e.target.value
                                                })
                                            }
                                            placeholder="Minimum 8 characters"
                                            minLength={8}
                                            required
                                            className="glass-input w-full px-4 py-3"
                                        />
                                    </div>

                                    {/* CREATE BUTTON */}

                                    <div className="flex items-end">

                                        <button
                                            type="submit"
                                            disabled={agentSaving}
                                            className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                                        >
                                            <UserPlus size={18} />

                                            {agentSaving
                                                ? "Creating Agent..."
                                                : "Create Agent"}
                                        </button>

                                    </div>

                                </form>

                            </div>

                            {/* AGENT DIRECTORY */}

                            <div className="glass-card overflow-hidden">

                                <div className="p-6 border-b border-slate-700/60">

                                    <h3 className="text-lg font-bold text-white">
                                        Agent Directory
                                    </h3>

                                    <p className="text-sm text-slate-400 mt-1">
                                        View agent accounts, workload and account status.
                                    </p>

                                </div>

                                {agentsLoading ? (

                                    <div className="p-10 text-center text-slate-400">
                                        Loading agents...
                                    </div>

                                ) : agents.length === 0 ? (

                                    <div className="p-10 text-center">

                                        <Users
                                            size={35}
                                            className="mx-auto text-slate-500 mb-3"
                                        />

                                        <p className="text-slate-300 font-semibold">
                                            No agents found.
                                        </p>

                                        <p className="text-sm text-slate-500 mt-1">
                                            Create your first agent using the form above.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="divide-y divide-slate-700/50">

                                        {agents.map((agent) => (

                                            <div
                                                key={agent._id}
                                                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                                            >

                                                {/* AGENT DETAILS */}

                                                <div className="flex items-center gap-4 min-w-0">

                                                    <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-500/30 border border-cyan-300/20 text-cyan-200 flex items-center justify-center font-bold text-lg">
                                                        {(agent.name || "A")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">

                                                        <h4 className="font-semibold text-white truncate">
                                                            {agent.name}
                                                        </h4>

                                                        <p className="text-sm text-slate-400 truncate">
                                                            {agent.email}
                                                        </p>

                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Support Agent
                                                        </p>

                                                    </div>

                                                </div>

                                                {/* AGENT STATISTICS AND STATUS */}

                                                <div className="flex flex-wrap items-center gap-4">

                                                    <div className="text-sm">
                                                        <p className="text-slate-400">
                                                            Assigned Tickets
                                                        </p>

                                                        <p className="text-lg font-bold text-white">
                                                            {agent.assignedTickets ?? 0}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                                            agent.isActive
                                                                ? "bg-emerald-500/10 text-emerald-300"
                                                                : "bg-red-500/10 text-red-300"
                                                        }`}
                                                    >
                                                        {agent.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>

                                                    {/* ACTIVATE / DEACTIVATE */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleAgentStatusChange(agent)
                                                        }
                                                        disabled={
                                                            updatingAgentId === agent._id
                                                        }
                                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                                                            agent.isActive
                                                                ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                                                : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                                        }`}
                                                    >
                                                        <Power size={16} />

                                                        {updatingAgentId === agent._id
                                                            ? "Updating..."
                                                            : agent.isActive
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                    </button>

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        </div>

                    )}

                    {/* CONVERSATIONS PAGE */}

                    {activePage === "conversations" && (

                        <div className="glass-card overflow-hidden">

                            <div className="p-6 border-b border-slate-700/60">

                                <h3 className="text-lg font-bold text-white">
                                    Customer Conversations
                                </h3>

                                <p className="text-sm text-slate-400 mt-1">
                                    Open a ticket to view replies and internal notes.
                                </p>

                            </div>

                            {loading ? (
                                <div className="p-10 text-center text-slate-400">
                                    Loading conversations...
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="p-10 text-center text-slate-400">
                                    No conversations available.
                                </div>
                            ) : (

                                <div className="divide-y divide-slate-700/50">

                                    {tickets.map((ticket) => (

                                        <button
                                            key={ticket._id}
                                            onClick={() => setSelectedTicketId(ticket._id)}
                                            className="conversation-row w-full p-5 text-left transition"
                                        >

                                            <div className="flex justify-between items-center gap-4">

                                                <div className="min-w-0">

                                                    <h4 className="font-semibold text-white truncate">
                                                        {ticket.subject}
                                                    </h4>

                                                    <p className="text-sm text-slate-400 mt-1">
                                                        {ticket.customerName || ticket.customerEmail || "Unknown Customer"}
                                                    </p>

                                                </div>

                                                <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold shrink-0">
                                                    Open
                                                    <ArrowUpRight size={16} />
                                                </div>

                                            </div>

                                        </button>

                                    ))}

                                </div>

                            )}

                        </div>

                    )}
                                        {/* NOTIFICATIONS PAGE */}

                    {activePage === "notifications" && (
                        <NotificationCenter />
                    )}

                    {/* SETTINGS PAGE */}

                    {activePage === "settings" && (

                        <div className="glass-card max-w-2xl p-7">

                            <h3 className="text-lg font-bold text-white">
                                Account Settings
                            </h3>

                            <p className="text-sm text-slate-400 mt-1 mb-7">
                                Manage your account details and preferences.
                            </p>

                            {settingsMessage && (
                                <div className={`mb-5 p-3 rounded-lg text-sm ${
                                    settingsMessageType === "success"
                                        ? "bg-emerald-500/10 border border-emerald-400/20 text-emerald-300"
                                        : "bg-red-500/10 border border-red-400/20 text-red-300"
                                }`}>
                                    {settingsMessage}
                                </div>
                            )}

                            <form
                                onSubmit={handleSaveSettings}
                                className="space-y-5"
                            >

                                {/* DISPLAY NAME */}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                                        Display Name
                                    </label>

                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        placeholder="Enter your name"
                                        maxLength={100}
                                        required
                                        className="glass-input w-full px-4 py-3"
                                    />
                                </div>

                                {/* EMAIL */}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                                        Display Email
                                    </label>

                                    <input
                                        type="email"
                                        value={profileEmail}
                                        onChange={(e) => setProfileEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className="glass-input w-full px-4 py-3"
                                    />
                                </div>

                                {/* NOTIFICATIONS */}

                                <div className="flex items-center justify-between border border-slate-700/60 rounded-lg p-4">

                                    <div>
                                        <p className="font-semibold text-white">
                                            Notifications
                                        </p>

                                        <p className="text-sm text-slate-400">
                                            Enable local notification preference.
                                        </p>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={notificationsEnabled}
                                        onChange={(e) =>
                                            setNotificationsEnabled(e.target.checked)
                                        }
                                        className="w-5 h-5 accent-cyan-400"
                                    />

                                </div>

                                {/* SAVE */}

                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl font-semibold disabled:opacity-50"
                                >
                                    <Save size={18} />

                                    {savingSettings
                                        ? "Saving..."
                                        : "Save Settings"}
                                </button>

                            </form>

                        </div>

                    )}

                </div>

            </main>

            {/* CREATE TICKET MODAL */}

            {showCreateForm && (
                <CreateTicket
                    onClose={() => setShowCreateForm(false)}
                    onCreated={handleTicketCreated}
                />
            )}

            {/* TICKET DETAILS MODAL */}

            {selectedTicketId && (
                <TicketDetails
                    ticketId={selectedTicketId}
                    onClose={() => setSelectedTicketId(null)}
                    onUpdated={handleTicketUpdated}
                    agents={agents}
                />
            )}

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal && (
                <div
                    className="logout-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="logout-modal-title"
                >
                    <div className="logout-modal">
                        <div className="logout-modal-icon">
                            <LogOut size={25} />
                        </div>

                        <h2 id="logout-modal-title">Confirm Logout</h2>

                        <p>
                            Are you sure you want to log out of your Nexora account?
                        </p>

                        <div className="logout-modal-actions">
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(false)}
                                className="logout-cancel-btn"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={onLogout}
                                className="logout-confirm-btn"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
// =====================================
// TICKET LIST COMPONENT
// =====================================

function TicketList({
    role,
    agents = [],
    tickets,
    loading,
    onSelect,
    getStatusStyle,
    getPriorityStyle,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    sort,
    setSort,
    compact = false
}) {

    return (
        <div className="glass-card overflow-hidden">

            {/* TABLE HEADER */}

            {!compact && (
                <div className="p-6 border-b border-slate-700/60">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        <div>
                            <h3 className="text-lg font-bold text-white">
                                Ticket Management
                            </h3>

                            <p className="text-sm text-slate-400 mt-1">
                                Manage your customer support tickets.
                            </p>
                        </div>

                    </div>

                </div>
            )}

            {/* SEARCH AND FILTERS */}

            {!compact && (
                <div className="p-5 border-b border-slate-700/60 space-y-4">

                    <div className="relative">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by subject, customer name or email..."
                            className="glass-input w-full pl-10 pr-4 py-3"
                        />

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                        {/* STATUS FILTER */}

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="glass-input w-full px-3 py-3 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting on Customer">
                                Waiting on Customer
                            </option>
                            <option value="Resolved">Resolved</option>
                            <option value="Overdue">Overdue</option>
                        </select>

                        {/* PRIORITY FILTER */}

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="glass-input w-full px-3 py-3 text-sm"
                        >
                            <option value="">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>

                        {/* AGENT FILTER */}

                        {role === "Admin" && (
                            <select
                                value={assigneeFilter}
                                onChange={(e) => setAssigneeFilter(e.target.value)}
                                className="glass-input w-full px-3 py-3 text-sm"
                            >
                                <option value="">All Agents</option>
                                <option value="Unassigned">Unassigned</option>

                                {agents
                                    .filter((agent) => agent.isActive)
                                    .map((agent) => (
                                        <option key={agent._id} value={agent.name}>
                                            {agent.name}
                                        </option>
                                    ))}
                            </select>
                        )}

                        {/* SORT FILTER */}

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="glass-input w-full px-3 py-3 text-sm"
                        >
                            <option value="">Recently Updated</option>
                            <option value="priority">Priority</option>
                        </select>

                    </div>

                </div>
            )}

            {/* TICKET TABLE */}

            <div className="overflow-x-auto">

                <table className="glass-table w-full text-left">

                    <thead className="text-slate-400 text-xs uppercase">

                        <tr>
                            <th className="px-5 py-4">Ticket</th>
                            <th className="px-5 py-4">Customer</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4">Priority</th>
                            <th className="px-5 py-4">Assignee</th>
                            <th className="px-5 py-4">Last Updated</th>
                        </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-700/50">

                        {tickets.map((ticket) => (

                            <tr
                                key={ticket._id}
                                onClick={() => onSelect(ticket._id)}
                                className="hover:bg-cyan-400/5 cursor-pointer transition"
                            >

                                {/* TICKET */}

                                <td className="px-5 py-4">

                                    <p className="font-semibold text-white max-w-xs truncate">
                                        {ticket.subject}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        #{ticket._id?.slice(-6)}
                                    </p>

                                </td>

                                {/* CUSTOMER */}

                                <td className="px-5 py-4">

                                    <p className="text-sm font-medium text-slate-200">
                                        {ticket.customerName || "Unknown"}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                        {ticket.customerEmail || "No email"}
                                    </p>

                                </td>

                                {/* STATUS */}

                                <td className="px-5 py-4">

                                    <span
                                        className={`status-glow text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusStyle(
                                            isTicketOverdue(ticket)
                                                ? "Overdue"
                                                : ticket.status
                                        )}`}
                                    >
                                        {isTicketOverdue(ticket)
                                            ? "Overdue"
                                            : ticket.status}
                                    </span>

                                </td>

                                {/* PRIORITY */}

                                <td className="px-5 py-4">

                                    <span
                                        className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getPriorityStyle(ticket.priority)}`}
                                    >
                                        {ticket.priority}
                                    </span>

                                </td>

                                {/* ASSIGNEE */}

                                <td className="px-5 py-4 text-sm text-slate-300">
                                    {ticket.assignee || "Unassigned"}
                                </td>

                                {/* UPDATED DATE */}

                                <td className="px-5 py-4 text-sm text-slate-400 whitespace-nowrap">
                                    {ticket.updatedAt
                                        ? new Date(ticket.updatedAt).toLocaleDateString()
                                        : "—"}
                                </td>

                            </tr>

                        ))}

                        {/* EMPTY STATE */}

                        {!loading && tickets.length === 0 && (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center py-12 text-slate-400"
                                >
                                    No tickets found.
                                </td>
                            </tr>
                        )}

                        {/* LOADING STATE */}

                        {loading && tickets.length === 0 && (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center py-12 text-slate-400"
                                >
                                    Loading tickets...
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

            {/* TABLE FOOTER */}

            <div className="p-4 border-t border-slate-700/60 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-slate-400">

                <span>
                    Showing {tickets.length} tickets
                </span>

                <span className="flex items-center gap-2">
                    <span className="glow-dot" />
                    Live database data
                    <ArrowUpRight size={15} />
                </span>

            </div>

        </div>
    );
}

export default App;