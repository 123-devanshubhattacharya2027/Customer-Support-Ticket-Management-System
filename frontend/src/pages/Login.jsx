import { useState } from "react";

import {
    loginUser,
    registerUser
} from "../services/api";

import {
    Ticket,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    User,
    UserPlus,
    LogIn
} from "lucide-react";

function Login({ onLogin }) {

    // =====================================
    // STATES
    // =====================================

    const [mode, setMode] = useState("login");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================
    // SWITCH LOGIN / REGISTER
    // =====================================

    const switchMode = (newMode) => {
        setMode(newMode);

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setError("");
        setSuccess("");
    };

    // =====================================
    // HANDLE FORM SUBMISSION
    // =====================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // Registration validation
        if (mode === "register") {

            if (!name.trim()) {
                setError("Please enter your full name.");
                return;
            }

            if (password.length < 8) {
                setError("Password must contain at least 8 characters.");
                return;
            }

            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
        }

        try {

            setLoading(true);

            let response;

            // =====================================
            // CUSTOMER REGISTRATION
            // =====================================

            if (mode === "register") {

                response = await registerUser({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password
                });

            }

            // =====================================
            // USER LOGIN
            // =====================================

            else {

                response = await loginUser({
                    email: email.trim().toLowerCase(),
                    password
                });

            }

            const { token, data: user } = response.data;

            if (!token || !user) {
                throw new Error(
                    "Invalid authentication response from server."
                );
            }

            // Public registration must only create Customers.
            if (
                mode === "register" &&
                user.role !== "Customer"
            ) {
                throw new Error(
                    "Public registration is only available for customers."
                );
            }

            // =====================================
            // SAVE AUTHENTICATION
            // =====================================

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            setSuccess(
                mode === "register"
                    ? "Account created successfully!"
                    : "Login successful!"
            );

            onLogin(user);

        } catch (err) {

            console.error("Authentication error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Authentication failed. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================
    // UI
    // =====================================

    return (

        <div className="min-h-screen flex items-center justify-center p-5 bg-[#07111f] relative overflow-hidden">

            {/* BACKGROUND EFFECTS */}

            <div className="absolute w-80 h-80 bg-cyan-400/10 rounded-full blur-[100px] -top-20 -left-20" />

            <div className="absolute w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] -bottom-20 -right-20" />

            {/* AUTHENTICATION CARD */}

            <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-700 rounded-3xl p-8 shadow-2xl">

                {/* HEADER */}

                <div className="text-center mb-7">

                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">

                        <Ticket
                            size={30}
                            className="text-slate-950"
                        />

                    </div>

                    <h1 className="text-3xl font-bold text-white mt-5">
                        SupportDesk
                    </h1>

                    <p className="text-slate-400 mt-2">

                        {mode === "login"
                            ? "Sign in to manage your support workspace."
                            : "Create your customer support account."}

                    </p>

                </div>

                {/* LOGIN / REGISTER TABS */}

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-6">

                    <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                            mode === "login"
                                ? "bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >

                        <LogIn size={17} />

                        Sign In

                    </button>

                    <button
                        type="button"
                        onClick={() => switchMode("register")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                            mode === "register"
                                ? "bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >

                        <UserPlus size={17} />

                        Sign Up

                    </button>

                </div>

                {/* ERROR MESSAGE */}

                {error && (

                    <div className="flex gap-2 items-center bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm mb-5">

                        <AlertCircle size={18} />

                        {error}

                    </div>

                )}

                {/* SUCCESS MESSAGE */}

                {success && (

                    <div className="bg-green-500/10 border border-green-500/20 text-green-300 p-3 rounded-xl text-sm mb-5">

                        {success}

                    </div>

                )}

                {/* AUTHENTICATION FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    {/* FULL NAME - REGISTER ONLY */}

                    {mode === "register" && (

                        <div>

                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Full Name
                            </label>

                            <div className="relative">

                                <User
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                    size={19}
                                />

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    autoComplete="name"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                                />

                            </div>

                        </div>

                    )}

                    {/* EMAIL */}

                    <div>

                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email Address
                        </label>

                        <div className="relative">

                            <Mail
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                size={19}
                            />

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                autoComplete="username"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                            />

                        </div>

                    </div>

                    {/* PASSWORD */}

                    <div>

                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>

                        <div className="relative">

                            <Lock
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                size={19}
                            />

                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete={
                                    mode === "login"
                                        ? "current-password"
                                        : "new-password"
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >

                                {showPassword
                                    ? <EyeOff size={19} />
                                    : <Eye size={19} />
                                }

                            </button>

                        </div>

                    </div>

                    {/* CONFIRM PASSWORD - REGISTER ONLY */}

                    {mode === "register" && (

                        <div>

                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm Password
                            </label>

                            <div className="relative">

                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                    size={19}
                                />

                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="Confirm your password"
                                    required
                                    autoComplete="new-password"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >

                                    {showConfirmPassword
                                        ? <EyeOff size={19} />
                                        : <Eye size={19} />
                                    }

                                </button>

                            </div>

                        </div>

                    )}

                    {/* SUBMIT BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-violet-400 hover:brightness-110 transition disabled:opacity-50"
                    >

                        {loading
                            ? mode === "login"
                                ? "Signing in..."
                                : "Creating account..."
                            : mode === "login"
                                ? "Sign In"
                                : "Create Customer Account"
                        }

                    </button>

                </form>

                {/* FOOTER */}

                <p className="text-center text-xs text-slate-500 mt-7">

                    {mode === "login"
                        ? "Secure customer support management"
                        : "Public registration is available for customers only."}

                </p>

            </div>

        </div>

    );
}

export default Login;