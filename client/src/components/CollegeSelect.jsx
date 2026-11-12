
import { useEffect, useState } from "react";
import { getColleges } from "../services/collegeService.js";

function CollegeSelect({ value, onChange }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const data = await getColleges();
        setColleges(data);
      } catch (err) {
        setError("Failed to load colleges. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  if (loading) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
        Loading colleges...
      </div>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
      >
        {error}
      </p>
    );
  }

  return (
    <select
      id="college"
      name="collegeId"
      value={value}
      onChange={onChange}
      required
      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    >
      <option value="">Choose a college</option>

      {colleges.map((college) => (
        <option key={college._id} value={college._id}>
          {college.name}
        </option>
      ))}
    </select>
  );
}

export default CollegeSelect;
