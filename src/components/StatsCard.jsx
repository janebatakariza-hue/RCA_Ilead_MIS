export default function StatsCard({ title, value }) {
  return (
    <div className="glass-panel p-6 flex flex-col justify-center items-start">
      <h2 className="text-[#777777] text-sm font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <p className="text-4xl font-black mt-2 text-[#1A1A1A]">{value}</p>
    </div>
  );
}
