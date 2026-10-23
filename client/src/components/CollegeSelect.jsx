
import { useEffect, useState } from "react";
import { getColleges } from "../services/collegeServices.js";

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
    return <p>Loading colleges...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div>
      <label htmlFor="college">Select your college</label>

      <select
        id="college"
        name="collegeId"
        value={value}
        onChange={onChange}
        required
      >
        <option value="">Choose a college</option>

        {colleges.map((college) => (
          <option key={college._id} value={college._id}>
            {college.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CollegeSelect;
