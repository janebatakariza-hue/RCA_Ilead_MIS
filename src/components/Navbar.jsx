import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
    window.location.reload();
  };

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/students", label: "Students" },
  ];

  if (role === "coordinator") {
    navLinks.push({ path: "/roundtables", label: "Roundtables" });
    navLinks.push({ path: "/statistics", label: "Statistics" });
    navLinks.push({ path: "/logs", label: "Logs" });
  }

  return (
    <div className="bg-white/10 backdrop-blur-md bg-chocolate sticky top-0 z-50 text-white p-4 shadow-lg border-b border-chocolate/30">
      <div className="w-full px-8 flex justify-between items-center">
        <div className="flex gap-8 items-center" gap-2>
          <img
            src="/logo.png"
            alt="iLEAD Logo"
            className="w-10 h-10 object-contain"
          />
          <div className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-black to-black/80">
            iLEAD
          </div>
          <div className="flex gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                  isActive(link.path)
                    ? "bg-[#1A1A1A] text-white shadow-md"
                    : "text-[#555555] hover:bg-[#F2F2F2] hover:text-[#1A1A1A]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold uppercase tracking-wider text-white bg-white/20 px-3 py-1 rounded-lg">
            {role}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-bold text-white bg-black hover:text-chocolate-light hover:bg-black/10 px-4 py-2 rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
