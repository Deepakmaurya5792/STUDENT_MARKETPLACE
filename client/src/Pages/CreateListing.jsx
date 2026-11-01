
import { useState, useEffect } from "react";
import { createListing } from "../services/listingService";

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

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Clean up preview URLs when images change or component unmounts
  useEffect(() => {
    const previewUrls = images.map((image) =>
      URL.createObjectURL(image)
    );

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    setError("");
    setSuccess("");

    if (images.length + selectedFiles.length > 5) {
      setError("Maximum 5 images are allowed.");
      e.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPEG, PNG and WebP images are allowed.");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be smaller than 5 MB.");
        e.target.value = "";
        return;
      }
    }

    setImages((prev) => [...prev, ...selectedFiles]);
    e.target.value = "";
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const formDataToSend = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "") {
        formDataToSend.append(key, value);
      }
    });

    images.forEach((image) => {
      formDataToSend.append("images", image);
    });

    try {
      setLoading(true);

      const response = await createListing(formDataToSend);

      setSuccess(response.message || "Listing created successfully!");

      setFormData({
        title: "",
        description: "",
        category: "",
        condition: "good",
        listingType: "sale",
        price: "",
        rentPeriod: "monthly",
        exchangeFor: "",
      });

      setImages([]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to create listing. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const previewUrls = images.map((image) =>
    URL.createObjectURL(image)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">
          Create New Listing
        </h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Listing Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="w-full rounded-lg border p-3"
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
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

          {(formData.listingType === "sale" ||
            formData.listingType === "rent") && (
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              required
              className="w-full rounded-lg border p-3"
            />
          )}

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
              required
              className="w-full rounded-lg border p-3"
            />
          )}

          <div>
            <label className="mb-2 block font-medium">
              Product Images (Maximum 5)
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="w-full rounded-lg border p-3"
            />

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((image, index) => (
                <div key={`${image.name}-${index}`} className="relative">
                  <img
                    src={previewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    className="h-32 w-full rounded-lg object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-sm text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {images.length}/5 images selected
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Listing..." : "Create Listing"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
