import { useState } from "react";

const CreateListing = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    condition: "good",
    listingType: "sale",
    price: "",
    rentPeriod: "monthly",
    exchangeFor: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">
          Create New Listing
        </h1>

        <form className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Listing Title"
            value={formData.title}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
            rows="4"
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />

          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          >
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>

          <select
            name="listingType"
            value={formData.listingType}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          >
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
            <option value="exchange">Exchange</option>
            <option value="free">Free</option>
          </select>

          {formData.listingType === "sale" ||
          formData.listingType === "rent" ? (
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          ) : null}

          {formData.listingType === "rent" && (
            <select
              name="rentPeriod"
              value={formData.rentPeriod}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}

          {formData.listingType === "exchange" && (
            <input
              type="text"
              name="exchangeFor"
              placeholder="What do you want in exchange?"
              value={formData.exchangeFor}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateListing;