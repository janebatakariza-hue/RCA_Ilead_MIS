import { useEffect, useState, useMemo } from "react";
import API from "../services/api";
import StatsCard from "../components/StatsCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchStudents();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/students/stats");
      setStats(res.data.stats);
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

  const areaData = useMemo(() => {
    const data = [
      { name: "Year 1", ICHOOSE: 0, ILEAD: 0, IDO: 0 },
      { name: "Year 2", ICHOOSE: 0, ILEAD: 0, IDO: 0 },
      { name: "Year 3", ICHOOSE: 0, ILEAD: 0, IDO: 0 },
    ];
    students.forEach((s) => {
      const row = data.find((d) => d.name === s.year);
      if (row && s.category) {
        row[s.category] = (row[s.category] || 0) + 1;
      }
    });
    return data;
  }, [students]);

  const radarData = useMemo(() => {
    const counts = {
      "In Program": 0,
      "Finished, No Exam": 0,
      "Exam Done": 0,
      Graduated: 0,
    };
    students.forEach((s) => {
      if (s.graduated) counts["Graduated"]++;
      else if (s.examDone) counts["Exam Done"]++;
      else if (s.finishedProgram) counts["Finished, No Exam"]++;
      else counts["In Program"]++;
    });

    return Object.keys(counts).map((key) => ({
      subject: key,
      count: counts[key],
    }));
  }, [students]);

  return (
    <div className="p-8 w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-[#1A1A1A]">Overview</h1>
        <p className="text-[#777777] font-medium mt-2">
          Track the performance and status of students across the program.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="lg:col-span-2">
          <StatsCard title="Total Students" value={stats.totalStudents || 0} />
        </div>
        <StatsCard title="ICHOOSE" value={stats.ichoose || 0} />
        <StatsCard title="ILEAD" value={stats.ilead || 0} />
        <StatsCard title="IDO" value={stats.ido || 0} />
        <StatsCard title="Graduated (Exam Done)" value={stats.graduated || 0} />
        <StatsCard
          title="Exam Done, Not Graduated"
          value={stats.didExamNotGraduated || 0}
        />
        <StatsCard
          title="Finished Program, No Exam"
          value={stats.finishedNotExam || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">
            Student Distribution by Year
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={areaData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIchoose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIlead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#555555" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#555555" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIdo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#999999" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#999999" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e0e0e0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#8B4513"
                  tick={{ fill: "#8B4513", fontWeight: 600 }}
                />
                <YAxis
                  stroke="#8B4513"
                  tick={{ fill: "#8B4513", fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="ICHOOSE"
                  stroke="#8B4513"
                  fillOpacity={1}
                  fill="url(#colorIchoose)"
                />
                <Area
                  type="monotone"
                  dataKey="ILEAD"
                  stroke="#D2691E"
                  fillOpacity={1}
                  fill="url(#colorIlead)"
                />
                <Area
                  type="monotone"
                  dataKey="IDO"
                  stroke="#F4A460"
                  fillOpacity={1}
                  fill="url(#colorIdo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">
            Program Status Analysis
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#8B4513", fontWeight: "bold", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, "dataMax + 2"]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Students"
                  dataKey="count"
                  stroke="#8B4513"
                  fill="#8B4513"
                  fillOpacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#8B4513", fontWeight: "bold" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
