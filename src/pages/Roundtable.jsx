import { useEffect, useState } from 'react';
import API from '../services/api';

export default function Roundtables() {
  const [roundtables, setRoundtables] = useState([]);

  useEffect(() => {
    fetchRoundtables();
  }, []);

  const fetchRoundtables = async () => {
    try {
      const res = await API.get('/roundtables');

      setRoundtables(res.data.roundtables);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-[#5C3317] mb-6">
        Roundtables
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roundtables.map((table) => (
          <div
            key={table._id}
            className="border-2 border-[#5C3317] rounded-2xl p-5 shadow-md"
          >
            <h2 className="text-2xl font-bold text-[#5C3317]">
              {table.name}
            </h2>

            <p className="mt-4">
              <strong>Facilitator:</strong>{' '}
              {table.facilitator}
            </p>

            <p className="mt-2">
              <strong>Slogan:</strong> {table.slogan}
            </p>

            <p className="mt-2">
              <strong>Year:</strong> {table.year}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
