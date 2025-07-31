import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";

const DATE_OPTIONS = {
  day: subDays(new Date(), 1).getTime(),
  week: subWeeks(new Date(), 1).getTime(),
  month: subMonths(new Date(), 1).getTime(),
  year: subYears(new Date(), 1).getTime(),
};

export default function App() {
  const [tag, setTag] = useState("#2PRU9Q8RQ");
  const [range, setRange] = useState("week");
  const [data, setData] = useState([]);
  const [lineColor, setLineColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!tag) return;
    setLoading(true);

    const start = DATE_OPTIONS[range];
    const end = new Date().getTime();

    try {

      const response = await axios.get("http://localhost:5000/player-data", {
        params: {
          tag,
          startUnix:start,
          endUnix:end
        }
      });

      const raw = response.data.data;
      const transformed = raw.map(d => ({
        ...d,
        time: new Date(d.createdAt).toLocaleString(),
      }));
      setData(transformed);

      if (transformed.length >= 2) {
        const startTrophy = transformed[0].builderBaseTrophies;
        const endTrophy = transformed[transformed.length - 1].builderBaseTrophies;
        setLineColor(endTrophy >= startTrophy ? "#00ff00" : "#ff4d4d"); // green or red
      } else {
        setLineColor("#cccccc");
      }

    } catch (err) {
      console.error("Failed to fetch data", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tag, range]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Builder Base Trophy Tracker</h1>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <input
            className="bg-gray-800 text-white border border-gray-700 px-3 py-2 rounded w-full sm:w-64"
            value={tag}
            onChange={e => setTag(e.target.value)}
            placeholder="Enter Player Tag (e.g. #XXXXXX)"
          />

          <div className="flex gap-2">
            {Object.keys(DATE_OPTIONS).map(key => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-2 rounded ${
                  range === key ? "bg-green-500 text-white" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-400">No data found for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" tick={{ fill: '#ccc' }} minTickGap={20} />
              <YAxis tick={{ fill: '#ccc' }} />
              <Tooltip contentStyle={{ backgroundColor: "#222", border: "1px solid #555" }} />
              <Line
                type="monotone"
                dataKey="builderBaseTrophies"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
