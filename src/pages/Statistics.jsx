import { useState, useEffect, useMemo } from 'react';
import API from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Statistics() {
  const [students, setStudents] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get('/students');
      setStudents(res.data.students);
    } catch (error) {
      console.log(error);
    }
  };

  const getStatusDisplay = (s) => {
    if (s.graduated) return 'Graduated';
    if (s.examDone) return 'Exam Done, Not Graduated';
    if (s.finishedProgram) return 'Finished Program, No Exam';
    return 'Currently In Program';
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchCategory = categoryFilter === 'All' || s.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || getStatusDisplay(s) === statusFilter;
      return matchCategory && matchStatus;
    });
  }, [students, categoryFilter, statusFilter]);

  // Aggregate by Year
  const yearCounts = useMemo(() => {
    const counts = { 'Year 1': 0, 'Year 2': 0, 'Year 3': 0 };
    filteredStudents.forEach(s => {
      if (counts[s.year] !== undefined) counts[s.year]++;
    });
    return counts;
  }, [filteredStudents]);

  // Export Filtered Students to PDF
  const exportFilteredStudents = () => {
    if (filteredStudents.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Filtered Report: ${categoryFilter} / ${statusFilter}`, 14, 15);
    
    const headers = [["Full Name", "Year", "Category", "Status", "Roundtable"]];
    const data = filteredStudents.map(s => [
      s.fullName,
      s.year,
      s.category,
      getStatusDisplay(s),
      s.roundtable ? s.roundtable.name : 'Unassigned'
    ]);
    
    doc.autoTable({
      startY: 20,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 69, 19] }
    });
    
    const filename = `statistics_report_${categoryFilter}_${statusFilter}.pdf`.replace(/\s+/g, '_');
    doc.save(filename);
  };

  return (
    <div className="p-8 w-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-chocolate-dark to-chocolate inline-block drop-shadow-sm">
            Advanced Reporting
          </h1>
          <p className="text-chocolate font-medium mt-2">Filter students to see detailed numbers by Year and view exactly who they are.</p>
        </div>
        <button 
          onClick={exportFilteredStudents} 
          className="btn-primary bg-chocolate-dark hover:bg-chocolate font-bold shadow-lg shadow-chocolate/30 whitespace-nowrap"
          disabled={filteredStudents.length === 0}
        >
          Export Report to PDF
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel p-6 mb-8 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-chocolate-dark font-bold mb-2 text-sm uppercase tracking-wide">Filter by Category</label>
          <select
            className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chocolate font-semibold text-chocolate-dark shadow-inner transition-all"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="ICHOOSE">ICHOOSE</option>
            <option value="ILEAD">ILEAD</option>
            <option value="IDO">IDO</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-chocolate-dark font-bold mb-2 text-sm uppercase tracking-wide">Filter by Status</label>
          <select
            className="w-full bg-white/60 border border-chocolate/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chocolate font-semibold text-chocolate-dark shadow-inner transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Currently In Program">Currently In Program</option>
            <option value="Finished Program, No Exam">Finished Program, No Exam</option>
            <option value="Exam Done, Not Graduated">Exam Done, Not Graduated</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Aggregate Counts by Year */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {['Year 1', 'Year 2', 'Year 3'].map((year) => (
          <div key={year} className="glass-panel p-6 flex flex-col items-center justify-center border-b-4 border-chocolate text-center">
            <h2 className="text-chocolate-dark text-lg font-bold uppercase tracking-widest">{year}</h2>
            <div className="text-5xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-br from-chocolate-dark to-chocolate drop-shadow-sm">
              {yearCounts[year]}
            </div>
            <p className="text-chocolate font-semibold text-sm mt-1">Matching Students</p>
          </div>
        ))}
      </div>

      {/* List of Filtered Students */}
      <div>
        <h2 className="text-2xl font-bold text-chocolate-dark mb-4 border-b border-chocolate/20 pb-2 flex justify-between items-center">
          <span>Student Roster</span>
          <span className="text-lg bg-chocolate text-white px-3 py-1 rounded-lg">Total: {filteredStudents.length}</span>
        </h2>

        {filteredStudents.length === 0 ? (
          <div className="glass-panel p-12 text-center text-chocolate-dark font-medium text-lg">
            No students match these filters.
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-chocolate-dark text-white uppercase text-xs tracking-wider">
                    <th className="p-4 font-bold">Full Name</th>
                    <th className="p-4 font-bold">Year</th>
                    <th className="p-4 font-bold">Category</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Roundtable</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredStudents.map((s, index) => (
                    <tr
                      key={s._id}
                      className={`border-b border-chocolate/10 hover:bg-chocolate-light/20 transition-colors ${index % 2 === 0 ? 'bg-white/40' : 'bg-transparent'}`}
                    >
                      <td className="p-4 font-bold text-chocolate-dark">{s.fullName}</td>
                      <td className="p-4 font-semibold text-chocolate">{s.year}</td>
                      <td className="p-4 font-semibold text-chocolate">{s.category}</td>
                      <td className="p-4 font-semibold text-chocolate">{getStatusDisplay(s)}</td>
                      <td className="p-4 font-semibold text-chocolate italic">
                        {s.roundtable ? s.roundtable.name : 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
