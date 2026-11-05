
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getSingleListing,
  updateListing,
  removeListingImage,
} from "../services/listingService";

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

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingImage, setRemovingImage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================
  // FETCH EXISTING LISTING
  // ============================================

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);

        const response = await getSingleListing(id);
        const listing = response.data;

        setFormData({
          title: listing.title || "",
          description: listing.description || "",
          category: listing.category || "",
          condition: listing.condition || "good",
          listingType: listing.listingType || "sale",
          price: listing.price ?? "",
          rentPeriod: listing.rentPeriod || "monthly",
          exchangeFor: listing.exchangeFor || "",
        });

        setExistingImages(listing.images || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load listing"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // ============================================
  // HANDLE INPUT CHANGES
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================
  // HANDLE NEW IMAGES
  // ============================================

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setError("");
    setSuccess("");

    if (existingImages.length + newImages.length + selectedFiles.length > 5) {
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

    setNewImages((prev) => [...prev, ...selectedFiles]);

    e.target.value = "";
  };

  // ============================================
  // REMOVE NEW IMAGE
  // ============================================

  const removeNewImage = (indexToRemove) => {
    setNewImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // ============================================
  // REMOVE EXISTING IMAGE
  // ============================================

  const handleRemoveExistingImage = async (image) => {
    if (!image.publicId) {
      setError("Image public ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this image?"
    );

    if (!confirmed) return;

    try {
      setRemovingImage(image.publicId);
      setError("");
      setSuccess("");

      await removeListingImage(id, image.publicId);

      setExistingImages((prev) =>
        prev.filter((item) => item.publicId !== image.publicId)
      );

      setSuccess("Image removed successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to remove image"
      );
    } finally {
      setRemovingImage("");
    }
  };

  // ============================================
  // UPDATE LISTING
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (existingImages.length + newImages.length > 5) {
      setError("Maximum 5 images are allowed.");
      return;
    }

    const formDataToSend = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    newImages.forEach((image) => {
      formDataToSend.append("images", image);
    });

    try {
      setSaving(true);

      await updateListing(id, formDataToSend);

      setSuccess("Listing updated successfully!");

      setTimeout(() => {
        navigate("/my-listings");
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update listing"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading listing...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>

        <button
          onClick={() => navigate("/my-listings")}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white"
        >
          Back to My Listings
        </button>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">

        <h1 className="mb-6 text-2xl font-bold">
          Edit Listing
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

          {/* TITLE */}

          <input
            type="text"
            name="title"
            placeholder="Listing Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3"
          />

          {/* DESCRIPTION */}

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="w-full rounded-lg border p-3"
          />

          {/* CATEGORY */}

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3"
          />

          {/* CONDITION */}

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

          {/* LISTING TYPE */}

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

          {/* PRICE */}

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

          {/* RENT PERIOD */}

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

          {/* EXCHANGE */}

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

          {/* EXISTING IMAGES */}

          <div>
            <label className="mb-2 block font-medium">
              Existing Images
            </label>

            {existingImages.length === 0 ? (
              <p className="text-sm text-gray-500">
                No existing images.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {existingImages.map((image) => (
                  <div
                    key={image.publicId}
                    className="relative"
                  >
                    <img
                      src={image.url}
                      alt="Listing"
                      className="h-32 w-full rounded-lg object-cover"
                    />

                    <button
                      type="button"
                      disabled={removingImage === image.publicId}
                      onClick={() =>
                        handleRemoveExistingImage(image)
                      }
                      className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                    >
                      {removingImage === image.publicId
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADD NEW IMAGES */}

          <div>
            <label className="mb-2 block font-medium">
              Add New Images
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="w-full rounded-lg border p-3"
            />

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {newImages.map((image, index) => (
                <div
                  key={`${image.name}-${index}`}
                  className="relative"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New preview ${index + 1}`}
                    className="h-32 w-full rounded-lg object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {existingImages.length + newImages.length}/5 images
            </p>
          </div>

          {/* ACTION BUTTONS */}

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() => navigate("/my-listings")}
              disabled={saving}
              className="w-1/2 rounded-lg border p-3 font-semibold hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || removingImage !== ""}
              className="w-1/2 rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Listing"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default EditListing;
