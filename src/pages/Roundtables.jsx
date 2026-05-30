import { useState, useEffect, useMemo } from "react";
import { Eye, Edit, Trash2, Send, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Roundtables() {
  const [roundtables, setRoundtables] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [inviteFilter, setInviteFilter] = useState("All");
  const [yearTab, setYearTab] = useState("All");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedRoundtable, setSelectedRoundtable] = useState(null);

  const [form, setForm] = useState({
    name: "",
    slogan: "",
    facilitator: "",
    facilitatorEmail: "",
    year: "Year 1",
  });

  useEffect(() => {
    fetchRoundtables();
    fetchStudents();
  }, []);

  const fetchRoundtables = async () => {
    try {
      const res = await API.get("/roundtables");
      setRoundtables(res.data.roundtables);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students");
      setStudents(res.data.students);
    } catch (error) {
      console.log(error);
    }
  };

  const openBulkModal = () => {
    const pending = roundtables
      .filter((rt) => !rt.invitationSent)
      .map((rt) => ({
        id: rt._id,
        name: rt.name,
        year: rt.year || "Year 1",
        email: rt.facilitatorEmail || "",
      }));
    setBulkData(pending);
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async () => {
    const toSend = bulkData.filter((d) => d.email && d.email.trim() !== "");
    if (toSend.length === 0) {
      toast.error("Please enter at least one email address.");
      return;
    }

    const loadingToast = toast.loading("Sending invitations...");
    try {
      const res = await API.post("/roundtables/bulk-invite", {
        invitations: toSend,
      });
      toast.success(res.data.message, { id: loadingToast });
      setIsBulkModalOpen(false);
      fetchRoundtables();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send bulk invitations.",
        { id: loadingToast },
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/roundtables/${editingId}`, form);
      } else {
        const createRes = await API.post("/roundtables", form);
        if (createRes.data.facilitatorPassword) {
          Swal.fire({
            title: "Success!",
            html: `
              <p>Facilitator Account Created.</p>
              <p><strong>Email:</strong> ${form.facilitatorEmail}</p>
              <p><strong>Auto-generated Password:</strong> ${createRes.data.facilitatorPassword}</p>
              <p class="text-sm text-gray-500 mt-2">(This serves as the simulated email notification)</p>
            `,
            icon: "success",
            confirmButtonColor: "#8b4513",
          });
        } else {
          toast.success("Roundtable created successfully!");
        }
      }
      if (editingId) {
        toast.success("Roundtable updated successfully!");
      }
      setIsFormModalOpen(false);
      setEditingId(null);
      setForm({
        name: "",
        slogan: "",
        facilitator: "",
        facilitatorEmail: "",
        year: "Year 1",
      });
      fetchRoundtables();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
      console.log(error);
    }
  };

  const handleEdit = (rt) => {
    setForm({
      name: rt.name,
      slogan: rt.slogan,
      facilitator: rt.facilitator,
      facilitatorEmail: rt.facilitatorEmail || "",
      year: rt.year || "Year 1",
    });
    setEditingId(rt._id);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this! This deletes the roundtable.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#8b4513",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/roundtables/${id}`);
        toast.success("Roundtable deleted successfully.");
        fetchRoundtables();
      } catch (error) {
        toast.error("Failed to delete roundtable.");
        console.log(error);
      }
    }
  };

  const handleSendInvitation = async (rt) => {
    let emailToUse = rt.facilitatorEmail;

    if (!emailToUse) {
      const { value: enteredEmail } = await Swal.fire({
        title: "Enter Facilitator Email",
        text: "This roundtable does not have an email assigned. Enter one now:",
        input: "email",
        inputPlaceholder: "facilitator@example.com",
        showCancelButton: true,
        confirmButtonColor: "#8b4513",
      });

      if (!enteredEmail) return;
      emailToUse = enteredEmail;
    }

    try {
      await API.post(`/roundtables/${rt._id}/send-invitation`, {
        email: emailToUse,
      });
      toast.success("Invitation sent successfully!");
      fetchRoundtables();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send invitation. Please try again.",
      );
    }
  };

  const openDetails = (rt) => {
    setSelectedRoundtable(rt);
    setIsDetailsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({ name: "", slogan: "", facilitator: "", facilitatorEmail: "" });
    setIsFormModalOpen(true);
  };

  const filteredRoundtables = useMemo(() => {
    return roundtables.filter((rt) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (rt.name && rt.name.toLowerCase().includes(q)) ||
        (rt.facilitator && rt.facilitator.toLowerCase().includes(q));

      let matchesFilter = true;
      if (inviteFilter === "Invited") matchesFilter = rt.invitationSent;
      if (inviteFilter === "Not Invited") matchesFilter = !rt.invitationSent;

      const matchesYear =
        yearTab === "All" ||
        rt.year === yearTab ||
        (!rt.year && yearTab === "Year 1");

      return matchesSearch && matchesFilter && matchesYear;
    });
  }, [roundtables, search, inviteFilter, yearTab]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get students for selected roundtable
  const rtStudents = useMemo(() => {
    if (!selectedRoundtable) return [];
    return students.filter(
      (s) =>
        s.roundtable?._id === selectedRoundtable._id ||
        s.roundtable === selectedRoundtable._id,
    );
  }, [students, selectedRoundtable]);

  const exportAllRoundtables = () => {
    const doc = new jsPDF();
    doc.text(`Roundtables Report - ${yearTab}`, 14, 15);
    const headers = [
      ["Roundtable Name", "Slogan", "Facilitator", "Created At"],
    ];
    const data = filteredRoundtables.map((rt) => [
      rt.name,
      rt.slogan || "-",
      rt.facilitator || "-",
      formatDate(rt.createdAt),
    ]);

    doc.autoTable({
      startY: 20,
      head: headers,
      body: data,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [139, 69, 19] },
    });

    doc.save(`roundtables_${yearTab.replace(/\s+/g, "_")}.pdf`);
  };

  const exportFacilitators = () => {
    const doc = new jsPDF();
    doc.text(`Facilitators Report - ${yearTab}`, 14, 15);
    const headers = [["#", "Facilitator Name", "Email", "Roundtable", "Year"]];
    const data = filteredRoundtables
      .filter((rt) => rt.facilitator)
      .map((rt, idx) => [
        idx + 1,
        rt.facilitator,
        rt.facilitatorEmail || "-",
        rt.name,
        rt.year || "Year 1",
      ]);

    autoTable(doc, {
      startY: 20,
      head: headers,
      body: data,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [139, 69, 19] },
    });

    doc.save(`facilitators_${yearTab.replace(/\s+/g, "_")}.pdf`);
  };

  const exportAllMembers = () => {
    const doc = new jsPDF();
    doc.text(`All Members Report - ${yearTab}`, 14, 15);
    const headers = [
      ["#", "Student Name", "Category", "Roundtable", "Facilitator", "Year"],
    ];

    const filteredRtsIds = filteredRoundtables.map((rt) => rt._id);
    const filteredStudents = students.filter(
      (s) =>
        s.roundtable &&
        filteredRtsIds.includes(s.roundtable._id || s.roundtable),
    );

    const data = filteredStudents.map((s, idx) => {
      const rt = roundtables.find(
        (r) => r._id === (s.roundtable._id || s.roundtable),
      );
      return [
        idx + 1,
        s.fullName,
        s.category,
        rt ? rt.name : "-",
        rt ? rt.facilitator : "-",
        s.year,
      ];
    });

    autoTable(doc, {
      startY: 20,
      head: headers,
      body: data,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 69, 19] },
    });

    doc.save(`all_members_${yearTab.replace(/\s+/g, "_")}.pdf`);
  };

  const exportRoster = () => {
    if (!selectedRoundtable) return;
    const doc = new jsPDF();
    doc.text(`Roster: ${selectedRoundtable.name}`, 14, 15);
    const headers = [["Student Name", "Year", "Category"]];
    const data = rtStudents.map((s) => [s.fullName, s.year, s.category]);

    autoTable(doc, {
      startY: 20,
      head: headers,
      body: data,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [139, 69, 19] },
    });

    doc.save(`${selectedRoundtable.name.replace(/\s+/g, "_")}_roster.pdf`);
  };

  return (
    <div className="p-8 w-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-black to-black inline-block drop-shadow-sm">
            Roundtables
          </h1>
          <p className="text-black font-medium mt-2">
            Manage roundtables and assign facilitators.
          </p>
        </div>
        <div className="flex gap-4 flex-wrap justify-end">
          <button
            onClick={openBulkModal}
            className="btn-primary bg-chocolate-light text-chocolate-dark hover:bg-chocolate-light/80 font-bold shadow-lg shadow-chocolate/30 whitespace-nowrap"
          >
            Bulk Invite
          </button>
          <div className="flex gap-2">
            <button
              onClick={exportAllRoundtables}
              className="btn-primary bg-chocolate-dark hover:bg-chocolate font-bold shadow-lg shadow-chocolate/30 whitespace-nowrap"
            >
              Export Roundtables
            </button>
            <button
              onClick={exportFacilitators}
              className="btn-primary bg-chocolate-dark hover:bg-chocolate font-bold shadow-lg shadow-chocolate/30 whitespace-nowrap"
            >
              Export Facilitators
            </button>
            <button
              onClick={exportAllMembers}
              className="btn-primary bg-chocolate-dark hover:bg-chocolate font-bold shadow-lg shadow-chocolate/30 whitespace-nowrap"
            >
              Export All Members
            </button>
          </div>
          <button
            onClick={openNewModal}
            className="btn-primary whitespace-nowrap shadow-lg shadow-chocolate/30"
          >
            Create Roundtable
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-black/5 p-1 rounded-xl overflow-x-auto">
        {["All", "Year 1", "Year 2", "Year 3"].map((year) => (
          <button
            key={year}
            onClick={() => setYearTab(year)}
            className={`flex-1 min-w-[100px] py-3 rounded-lg font-bold transition-all ${yearTab === year ? "bg-white text-chocolate-dark shadow-md scale-[1.02]" : "text-chocolate/70 hover:text-chocolate hover:bg-white/50"}`}
          >
            {year === "All" ? "All Years" : year}
          </button>
        ))}
      </div>

      <div className="glass-panel p-6 mb-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-chocolate-dark font-bold mb-2 text-sm uppercase tracking-wide">
            Search Filters
          </label>
          <input
            type="text"
            placeholder="Search by name or facilitator..."
            className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/30 font-semibold text-chocolate-dark shadow-inner transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-1/3">
          <label className="block text-chocolate-dark font-bold mb-2 text-sm uppercase tracking-wide">
            Invitation Status
          </label>
          <select
            className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/30 font-semibold text-chocolate-dark shadow-inner transition-all"
            value={inviteFilter}
            onChange={(e) => setInviteFilter(e.target.value)}
          >
            <option>All</option>
            <option>Invited</option>
            <option>Not Invited</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-chocolate-dark text-white uppercase text-xs tracking-wider">
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Year</th>
                <th className="p-4 font-bold">Slogan</th>
                <th className="p-4 font-bold">Facilitator</th>
                <th className="p-4 font-bold">Created At</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredRoundtables.map((rt, index) => (
                <tr
                  key={rt._id}
                  className={`border-b border-chocolate/10 hover:bg-chocolate-light/20 transition-colors ${index % 2 === 0 ? "bg-white/40" : "bg-transparent"}`}
                >
                  <td className="p-4 font-bold text-chocolate-dark">
                    {rt.name}
                  </td>
                  <td className="p-4 font-semibold text-chocolate">
                    {rt.year || "Year 1"}
                  </td>
                  <td className="p-4 font-medium text-chocolate italic">
                    "{rt.slogan}"
                  </td>
                  <td className="p-4 font-semibold text-chocolate-dark">
                    {rt.facilitator}
                  </td>
                  <td className="p-4 font-semibold text-chocolate">
                    {formatDate(rt.createdAt)}
                  </td>
                  <td className="p-4 text-center space-x-3 whitespace-nowrap">
                    {!rt.invitationSent && (
                      <button
                        onClick={() => handleSendInvitation(rt)}
                        title="Send Invitation Email"
                        className="text-chocolate hover:text-chocolate-dark transition-colors bg-white p-1.5 rounded shadow-sm hover:shadow"
                      >
                        <Send size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => openDetails(rt)}
                      title="View Details"
                      className="text-chocolate hover:text-chocolate-dark transition-colors bg-white p-1.5 rounded shadow-sm hover:shadow"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(rt)}
                      title="Edit"
                      className="text-gray-500 hover:text-gray-800 transition-colors bg-white p-1.5 rounded shadow-sm hover:shadow"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(rt._id)}
                      title="Delete"
                      className="text-red-500 hover:text-red-700 transition-colors bg-white p-1.5 rounded shadow-sm hover:shadow"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRoundtables.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-12 text-center text-chocolate-dark font-medium text-lg"
                  >
                    No roundtables found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 max-w-md w-full bg-white relative">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-4 right-4 text-chocolate font-bold hover:text-chocolate-dark text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-chocolate-dark mb-6">
              {editingId ? "Edit Roundtable" : "Create Roundtable"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                  Roundtable Name
                </label>
                <input
                  required
                  className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                  Year
                </label>
                <select
                  className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  <option>Year 1</option>
                  <option>Year 2</option>
                  <option>Year 3</option>
                </select>
              </div>
              <div>
                <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                  Slogan
                </label>
                <input
                  className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                  value={form.slogan}
                  onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                  Facilitator Name
                </label>
                <input
                  className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                  value={form.facilitator}
                  onChange={(e) =>
                    setForm({ ...form, facilitator: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                  Facilitator Email
                </label>
                <input
                  type="email"
                  className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                  value={form.facilitatorEmail}
                  onChange={(e) =>
                    setForm({ ...form, facilitatorEmail: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 mt-6">
                {editingId ? "Save Changes" : "Create Roundtable"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRoundtable && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-panel p-8 max-w-4xl w-full bg-white relative my-8">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 text-chocolate font-bold hover:text-chocolate-dark text-xl cursor-pointer"
            >
              ✕
            </button>
            <div className="sticky top-0 bg-white z-10 py-3 mb-3 border-b border-black/10">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex items-center gap-2 text-chocolate-dark hover:text-black font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft size={18} /> Go Back
              </button>
            </div>

            <div className="sticky top-0 bg-white z-10 py-3 mb-4 border-b border-black/10">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex items-center gap-2 text-chocolate-dark hover:text-black font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft size={18} /> Go Back
              </button>
            </div>
            <div className="mb-6 border-b border-chocolate/20 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-chocolate-dark">
                    {selectedRoundtable.name}
                  </h2>
                  <p className="text-chocolate font-medium italic mt-1 text-lg">
                    "{selectedRoundtable.slogan}"
                  </p>
                </div>
                <button
                  onClick={exportRoster}
                  className="bg-chocolate-dark hover:bg-chocolate text-white text-sm font-bold px-4 py-2 rounded-lg shadow transition-colors"
                >
                  Export Roster (PDF)
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-6">
                <div>
                  <span className="block text-xs uppercase tracking-widest font-bold text-chocolate-dark/60">
                    Facilitator
                  </span>
                  <span className="font-semibold text-chocolate-dark text-lg">
                    {selectedRoundtable.facilitator || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest font-bold text-chocolate-dark/60">
                    Created
                  </span>
                  <span className="font-semibold text-chocolate-dark text-lg">
                    {formatDate(selectedRoundtable.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest font-bold text-chocolate-dark/60">
                    Total Members
                  </span>
                  <span className="font-semibold text-chocolate-dark text-lg">
                    {rtStudents.length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-chocolate-dark mb-4">
                Roundtable Members by Year
              </h3>
              {rtStudents.length === 0 ? (
                <div className="bg-chocolate-light/20 p-6 rounded-xl text-center text-chocolate-dark font-medium">
                  No students assigned to this roundtable yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {["Year 1", "Year 2", "Year 3"].map((year) => {
                    const studentsInYear = rtStudents.filter(
                      (s) => s.year === year,
                    );
                    if (studentsInYear.length === 0) return null;
                    return (
                      <div key={year}>
                        <h4 className="text-sm font-black text-chocolate-dark uppercase tracking-widest border-b border-chocolate/20 pb-1 mb-3">
                          {year}{" "}
                          <span className="text-chocolate">
                            ({studentsInYear.length})
                          </span>
                        </h4>
                        <div className="space-y-2">
                          {studentsInYear.map((s) => (
                            <div
                              key={s._id}
                              className="flex justify-between items-center bg-chocolate-light/10 p-3 rounded-lg border border-chocolate/10"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-chocolate-dark">
                                  {s.fullName}
                                </span>
                                <span className="text-xs text-chocolate font-medium">
                                  {s.email || "No email provided"}
                                </span>
                              </div>
                              <span className="text-xs font-semibold bg-chocolate text-white px-2 py-1 rounded shadow-sm">
                                {s.category}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-panel p-8 max-w-4xl w-full bg-white relative mt-20 mb-8">
            <button
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute top-4 right-4 text-chocolate font-bold hover:text-chocolate-dark text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-chocolate-dark mb-2">
              Bulk Send Invitations
            </h2>
            <p className="text-chocolate font-medium mb-6">
              Enter email addresses for the unassigned roundtables below. The
              system will auto-generate passwords and send invites.
            </p>

            {bulkData.length === 0 ? (
              <div className="bg-chocolate-light/20 p-6 rounded-xl text-center text-chocolate-dark font-medium">
                All roundtables have already been sent invitations!
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {bulkData.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 bg-chocolate-light/10 p-4 rounded-lg border border-chocolate/20"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-chocolate-dark">
                        {d.name}
                      </div>
                      <div className="text-xs text-chocolate font-bold tracking-wider uppercase">
                        {d.year}
                      </div>
                    </div>
                    <div className="flex-[2]">
                      <input
                        type="email"
                        placeholder="facilitator@example.com"
                        className="w-full bg-white border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                        value={d.email}
                        onChange={(e) => {
                          const newData = [...bulkData];
                          newData[i].email = e.target.value;
                          setBulkData(newData);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bulkData.length > 0 && (
              <button
                onClick={handleBulkSubmit}
                className="btn-primary w-full py-3 mt-6"
              >
                Send All Invitations
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
