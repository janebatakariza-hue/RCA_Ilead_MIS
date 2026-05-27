import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Login() {
  const [activeTab, setActiveTab] = useState("coordinator"); // 'coordinator' | 'facilitator'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roundtableName, setRoundtableName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      email,
      password,
      loginType: activeTab,
    };

    try {
      const res = await API.post("/auth/login", payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      // Redirect to dashboard
      navigate("/");
      window.location.reload(); // Refresh to apply auth state in Navbar
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };
  const images = ["/bg.jpg", "/bg2.jpg", "/bg3.jpg","/bg4.jpg","/bg5.jpg","/bg6.jpg"];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-top bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `url('${images[currentImage]}')`,
        transition: "background-image 1s ease-in-out",
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20 z-0" />
      <div className="glass-panel max-w-md w-full p-8 relative z-10">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="iLEAD Logo"
            className="w-20 h-20 mx-auto mb-3 object-contain"
          />
          <h1 className="text-4xl font-black text-white mb-2">iLEAD Login</h1>
          <p className="text-white font-medium">
            Access your management portal
          </p>
        </div>

        <div className="flex gap-2 mb-8 bg-white/10 p-1 rounded-xl">
          <button
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === "coordinator" ? "bg-white text-black shadow" : "text-white/70 hover:text-white"}`}
            onClick={() => setActiveTab("coordinator")}
          >
            Coordinator
          </button>
          <button
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === "facilitator" ? "bg-white text-black shadow" : "text-white/70 hover:text-white"}`}
            onClick={() => setActiveTab("facilitator")}
          >
            Facilitator
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {activeTab === "coordinator" ? (
            <>
              <div>
                <label className="block text-white font-semibold mb-2">
                  Coordinator Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-white/50 transition-all shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cordinator@gmail.com"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-white/60 border border-white/30 placeholder-text-gray-500 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-white/50 transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-white font-semibold mb-2">
                  Facilitator Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-white/50 transition-all shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="facilitator@example.com"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-white/50 transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3 text-lg mt-4"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
