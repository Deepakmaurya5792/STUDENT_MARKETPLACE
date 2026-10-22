import College from "../models/College.js";

export const getColleges = async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true })
      .select("name slug")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: colleges.length,
      data: colleges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch colleges",
    });
  }
};



export const createCollege = async (req, res) => {
  try {
    const { name, slug, emailDomains = [] } = req.body;

    if (!name?.trim() || !slug?.trim()) {
      return res.status(400).json({
        success: false,
        message: "College name and slug are required",
      });
    }

    const normalizedSlug = slug.trim().toLowerCase();

    const college = await College.create({
      name: name.trim(),
      slug: normalizedSlug,
      emailDomains: emailDomains.map((domain) =>
        domain.trim().toLowerCase()
      ),
    });

    return res.status(201).json({
      success: true,
      data: college,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A college with this slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create college",
    });
  }
};
