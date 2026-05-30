import { useState, useEffect } from "react";
import API from "../services/api";
import { Clock, ShieldCheck, User } from "lucide-react";
import toast from "react-hot-toast";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get("/logs");
      setLogs(res.data.logs);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load logs");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-8 w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-chocolate-dark to-chocolate-dark inline-block drop-shadow-sm">
          System Activity Logs
        </h1>
        <p className="text-black font-medium mt-2">
          Monitor login history and system activities.
        </p>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-chocolate font-bold">
            Loading logs...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/80 text-white uppercase text-xs tracking-wider">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Action</th>
                  <th className="p-4 font-bold">User</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Details</th>
                  <th className="p-4 font-bold text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map((log, index) => (
                  <tr
                    key={log._id}
                    className={`border-b border-chocolate/10 hover:bg-chocolate-light/20 transition-colors ${index % 2 === 0 ? "bg-white/40" : "bg-transparent"}`}
                  >
                    <td className="p-4 whitespace-nowrap text-chocolate font-semibold flex items-center gap-2">
                      <Clock size={14} />
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="p-4 font-bold text-chocolate-dark">
                      <span className="bg-chocolate-light/40 text-chocolate-dark px-2 py-1 rounded shadow-sm text-xs uppercase tracking-widest">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-chocolate-dark flex items-center gap-1">
                        <User size={14} className="text-chocolate" />
                        {log.name || "Unknown"}
                      </div>
                      <div className="text-xs text-chocolate font-medium">
                        {log.email}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-chocolate">
                      <div className="flex items-center gap-1">
                        {log.userRole === "coordinator" && (
                          <ShieldCheck size={14} className="text-green-600" />
                        )}
                        <span
                          className={`uppercase text-xs tracking-widest ${log.userRole === "coordinator" ? "text-green-700" : "text-chocolate-dark"}`}
                        >
                          {log.userRole}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-chocolate italic font-medium">
                      {log.details}
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-500 text-right">
                      {log.ipAddress || "Unknown"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-12 text-center text-chocolate-dark font-medium text-lg"
                    >
                      No logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
