
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createListing } from "../services/listingService";

const initialFormData = {
  title: "",
  description: "",
  category: "",
  condition: "good",
  listingType: "sale",
  price: "",
  rentPeriod: "monthly",
  exchangeFor: "",
};

const inputStyle =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const labelStyle = "mb-2 block text-sm font-semibold text-slate-700";

const CreateListing = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Generate and clean up image preview URLs
  useEffect(() => {
    const urls = images.map((image) => URL.createObjectURL(image));

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

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

      setFormData({ ...initialFormData });
      setImages([]);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create listing. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            SELL ON CAMPUS
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Create a Listing
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Share something with your campus community.
            Add the details below to publish your listing.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <span className="font-bold">✓</span>
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Basic Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tell buyers what you're listing.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Listing Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Engineering Mathematics Book"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe your item, its features and any important details..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={`${inputStyle} resize-y`}
                />
                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {formData.description.length} characters
                </p>
              </div>

              <div>
                <label className={labelStyle}>Category</label>
                <input
                  type="text"
                  name="category"
                  placeholder="e.g. Books, Electronics, Furniture"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />
              </div>
            </div>
          </section>

          {/* Listing Type and Condition */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Listing Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose how you want to offer your item.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelStyle}>Listing Type</label>
                <select
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                  <option value="exchange">Exchange</option>
                  <option value="free">Free</option>
                </select>
              </div>

              <div>
                <label className={labelStyle}>Item Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              {(formData.listingType === "sale" ||
                formData.listingType === "rent") && (
                <div>
                  <label className={labelStyle}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Enter amount"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    required
                    className={inputStyle}
                  />
                </div>
              )}

              {formData.listingType === "rent" && (
                <div>
                  <label className={labelStyle}>Rent Period</label>
                  <select
                    name="rentPeriod"
                    value={formData.rentPeriod}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="daily">Per Day</option>
                    <option value="weekly">Per Week</option>
                    <option value="monthly">Per Month</option>
                  </select>
                </div>
              )}

              {formData.listingType === "exchange" && (
                <div className="sm:col-span-2">
                  <label className={labelStyle}>
                    What do you want in exchange?
                  </label>
                  <input
                    type="text"
                    name="exchangeFor"
                    placeholder="e.g. A programming book or headphones"
                    value={formData.exchangeFor}
                    onChange={handleChange}
                    required
                    className={inputStyle}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Product Images */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Product Images
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload clear photos so other students can see your item.
              </p>
            </div>

            <label
              htmlFor="listing-images"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16V4m0 0L7 9m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"
                  />
                </svg>
              </div>

              <span className="text-sm font-semibold text-slate-800">
                Click to upload images
              </span>
              <span className="mt-1 text-xs text-slate-500">
                JPEG, PNG or WebP · Maximum 5 images · 5 MB each
              </span>

              <input
                id="listing-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {images.map((image, index) => (
                  <div
                    key={`${image.name}-${index}`}
                    className="group relative overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img
                      src={previewUrls[index]}
                      alt={`Preview ${index + 1}`}
                      className="h-28 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                      className="absolute right-2 top-2 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow transition hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Upload up to 5 product photos</span>
              <span className="font-semibold text-slate-700">
                {images.length}/5 selected
              </span>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Listing..." : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
