import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  UserPlus,
  Pencil,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  Activity,
  Table2,
} from "lucide-react";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [roundtables, setRoundtables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // Create a helper to get default form
  const getDefaultForm = () => ({
    fullName: "",
    email: "",
    phone: "",
    gender: "Male",
    year: "Year 1",
    category: "ICHOOSE",
    roundtable: "",
    status: "Currently In Program",
  });

  const [form, setForm] = useState(getDefaultForm());

  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchStudents();
    if (role === "coordinator") fetchRoundtables();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students");
      setStudents(res.data.students);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRoundtables = async () => {
    try {
      const res = await API.get("/roundtables");
      setRoundtables(res.data.roundtables);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map status string to booleans
      const payload = { ...form };
      if (form.status === "Currently In Program") {
        payload.finishedProgram = false;
        payload.examDone = false;
        payload.graduated = false;
      } else if (form.status === "Finished Program, No Exam") {
        payload.finishedProgram = true;
        payload.examDone = false;
        payload.graduated = false;
      } else if (form.status === "Exam Done, Not Graduated") {
        payload.finishedProgram = true;
        payload.examDone = true;
        payload.graduated = false;
      } else if (form.status === "Graduated") {
        payload.finishedProgram = true;
        payload.examDone = true;
        payload.graduated = true;
      }

      if (editingId) {
        await API.put(`/students/${editingId}`, payload);
      } else {
        await API.post("/students", payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm(getDefaultForm());
      fetchStudents();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = (student) => {
    // Determine status from booleans
    let currentStatus = "Currently In Program";
    if (student.graduated) currentStatus = "Graduated";
    else if (student.examDone) currentStatus = "Exam Done, Not Graduated";
    else if (student.finishedProgram)
      currentStatus = "Finished Program, No Exam";

    setForm({
      fullName: student.fullName || "",
      email: student.email || "",
      phone: student.phone || "",
      gender: student.gender || "Male",
      year: student.year || "Year 1",
      category: student.category || "ICHOOSE",
      roundtable: student.roundtable?._id || student.roundtable || "",
      status: currentStatus,
    });
    setEditingId(student._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await API.delete(`/students/${id}`);
        fetchStudents();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm(getDefaultForm());
    setIsModalOpen(true);
  };

  // Helper to display status string on the card
  const getStatusDisplay = (s) => {
    if (s.graduated) return "Graduated";
    if (s.examDone) return "Exam Done, Not Graduated";
    if (s.finishedProgram) return "Finished Program, No Exam";
    return "Currently In Program";
  };

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.roundtable &&
          s.roundtable.name &&
          s.roundtable.name.toLowerCase().includes(q)) ||
        (s.roundtable &&
          s.roundtable.facilitator &&
          s.roundtable.facilitator.toLowerCase().includes(q)),
    );
  }, [students, search]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Students Directory Report", 14, 15);
    const headers = [
      [
        "#",
        "Full Name",
        "Email",
        "Phone",
        "Gender",
        "Year",
        "Category",
        "Status",
        "Roundtable",
        "Facilitator",
      ],
    ];
    const data = filteredStudents.map((s, idx) => [
      idx + 1,
      s.fullName,
      s.email || "-",
      s.phone || "-",
      s.gender,
      s.year,
      s.category,
      getStatusDisplay(s),
      s.roundtable ? s.roundtable.name : "Unassigned",
      s.roundtable ? s.roundtable.facilitator || "Unassigned" : "-",
    ]);

    autoTable(doc, {
      startY: 20,
      head: headers,
      body: data,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 69, 19] }, // Chocolate color
    });

    doc.save("students_export.pdf");
  };

  return (
    <div className="p-8 w-full">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-chocolate-dark to-chocolate inline-block drop-shadow-sm">
            Students Directory
          </h1>
          <p className="text-chocolate font-medium mt-2">
            View and manage student categories and status.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={exportPDF}
            className="btn-primary bg-chocolate-dark hover:bg-chocolate font-bold shadow-lg shadow-chocolate/30"
          >
            <Download size={16} className="inline mr-2" />
            Export PDF
          </button>
          <button
            onClick={openNewModal}
            className="btn-primary shadow-lg shadow-chocolate/30"
          >
            <UserPlus size={16} className="inline mr-2" />
            Add Student
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 mb-8">
        <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
          <Search size={14} /> Search Students
        </label>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            className="pl-10"
            type="text"
            placeholder="Search by name, email, phone, roundtable, or facilitator..."
            className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chocolate font-semibold text-chocolate-dark shadow-inner transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-chocolate-dark text-white uppercase text-xs tracking-wider">
                <th className="p-4 font-bold w-12">#</th>
                <th className="p-4 font-bold">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    Full Name
                  </span>
                </th>
                <th className="p-4 font-bold">
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    Contact
                  </span>
                </th>
                <th className="p-4 font-bold">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Year
                  </span>
                </th>
                <th className="p-4 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Category
                  </span>
                </th>
                <th className="p-4 font-bold">
                  <span className="flex items-center gap-1">
                    <Activity size={12} />
                    Status
                  </span>
                </th>
                <th className="p-4 font-bold">
                  <span className="flex items-center gap-1">
                    <Table2 size={12} />
                    Roundtable
                  </span>
                </th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredStudents.map((s, index) => (
                <tr
                  key={s._id}
                  className={`border-b border-chocolate/10 hover:bg-chocolate-light/20 transition-colors ${index % 2 === 0 ? "bg-white/40" : "bg-transparent"}`}
                >
                  <td className="p-4 font-bold text-chocolate">{index + 1}</td>
                  <td className="p-4 font-bold text-chocolate-dark">
                    {s.fullName}
                  </td>
                  <td className="p-4 text-chocolate text-xs">
                    <div>{s.email || "-"}</div>
                    <div className="font-semibold">{s.phone || "-"}</div>
                  </td>
                  <td className="p-4 font-semibold text-chocolate">{s.year}</td>
                  <td className="p-4 font-semibold text-chocolate">
                    {s.category}
                  </td>
                  <td className="p-4 font-semibold text-chocolate">
                    {getStatusDisplay(s)}
                  </td>
                  <td className="p-4 text-chocolate">
                    <div className="font-bold italic">
                      {s.roundtable ? s.roundtable.name : "Unassigned"}
                    </div>
                    {s.roundtable && s.roundtable.facilitator && (
                      <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mt-1">
                        {s.roundtable.facilitator}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-xs bg-white text-chocolate-dark px-3 py-1 rounded shadow hover:bg-gray-100 font-bold transition-all"
                    >
                      <Pencil size={12} className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 font-bold transition-all"
                    >
                      <Trash2 size={12} className="inline mr-1" />
                      Delete{" "}
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="p-12 text-center text-chocolate-dark font-medium text-lg"
                  >
                    <X size={18} /> No students recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-panel p-8 max-w-lg w-full bg-white relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-chocolate font-bold hover:text-chocolate-dark"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-chocolate-dark mb-6">
              {editingId ? "Edit Student" : "Add New Student"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                  Full Name
                </label>
                <input
                  required
                  className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                    Phone
                  </label>
                  <input
                    className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                    Gender
                  </label>
                  <select
                    className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                    Category
                  </label>
                  <select
                    className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option>ICHOOSE</option>
                    <option>ILEAD</option>
                    <option>IDO</option>
                  </select>
                </div>
                {role === "coordinator" && (
                  <div>
                    <label className="block text-chocolate-dark font-semibold mb-1 text-sm">
                      Roundtable
                    </label>
                    <select
                      className="w-full bg-chocolate-light/30 border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate"
                      value={form.roundtable}
                      onChange={(e) =>
                        setForm({ ...form, roundtable: e.target.value })
                      }
                    >
                      <option value="">Select Roundtable</option>
                      {roundtables
                        .filter((rt) => !rt.year || rt.year === form.year)
                        .map((rt) => (
                          <option key={rt._id} value={rt._id}>
                            {rt.name} {rt.year ? `(${rt.year})` : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-chocolate-light/30 p-3 rounded-lg border border-chocolate/20 mt-4">
                <label className="block text-chocolate-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Program Status
                </label>
                <select
                  className="w-full bg-white border border-chocolate/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-chocolate font-semibold text-chocolate-dark"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Currently In Program</option>
                  <option>Finished Program, No Exam</option>
                  <option>Exam Done, Not Graduated</option>
                  <option>Graduated</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full py-3 mt-6">
                {editingId ? "Update Student" : "Register Student"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
