
import { useState } from "react";
import CollegeSelect from "./components/CollegeSelect.jsx";

function App() {
  const [collegeId, setCollegeId] = useState("");

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-bold">
        Student Marketplace
      </h1>

      <CollegeSelect
        value={collegeId}
        onChange={(event) => setCollegeId(event.target.value)}
      />

      {collegeId && (
        <p className="mt-4">
          Selected college ID: {collegeId}
        </p>
      )}
    </main>
  );
}

export default App;
