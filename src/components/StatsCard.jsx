export default function StatsCard({ title, value }) {
  return (
    <div className="glass-panel p-6 flex flex-col justify-center items-start">
      <h2 className="text-white text-lg font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <p className="text-4xl font-black mt-2 text-white ">{value}</p>
    </div>
  );
}
