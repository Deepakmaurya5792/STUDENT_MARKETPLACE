import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (fileBuffer, mimetype = "image/jpeg") => {
  return new Promise((resolve) => {
    // If Cloudinary keys are missing, return data URI fallback immediately
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      const base64Data = fileBuffer.toString("base64");
      return resolve({
        url: `data:${mimetype};base64,${base64Data}`,
        publicId: `local-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "student-marketplace",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.warn("Cloudinary upload failed, falling back to data URI:", error.message || error);
          const base64Data = fileBuffer.toString("base64");
          return resolve({
            url: `data:${mimetype};base64,${base64Data}`,
            publicId: `fallback-${Date.now()}`,
          });
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default uploadToCloudinary;
