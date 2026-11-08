
import { useEffect, useState } from "react";
import App from "./App";
import Login from "./pages/Login";
import { getMe } from "./services/api";

function AuthGate() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let active = true;

        const verifySession = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                if (active) setChecking(false);
                return;
            }

            try {
                const response = await getMe();

                if (active) {
                    const currentUser = response.data.data;
                    setUser(currentUser);
                    localStorage.setItem("user", JSON.stringify(currentUser));
                }
            } catch (error) {
                console.error("Session verification failed:", error);

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                if (active) setUser(null);
            } finally {
                if (active) setChecking(false);
            }
        };

        verifySession();

        return () => {
            active = false;
        };
    }, []);

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
    };

    // Called after a successful profile update
    const handleProfileUpdated = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-[#07111f] flex items-center justify-center text-cyan-300">
                Checking your session...
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <App
            user={user}
            onLogout={handleLogout}
            onProfileUpdated={handleProfileUpdated}
        />
    );
}

export default AuthGate;
