import mongoose from "mongoose";
import "dotenv/config";
import College from "./models/College.js";

const colleges = [
  {
    name: "Delhi Technological University (DTU)",
    slug: "dtu",
    emailDomains: ["dtu.ac.in"],
    isActive: true,
  },
  {
    name: "Indian Institute of Technology Delhi (IIT Delhi)",
    slug: "iit-delhi",
    emailDomains: ["iitd.ac.in"],
    isActive: true,
  },
  {
    name: "Indian Institute of Technology Bombay (IIT Bombay)",
    slug: "iit-bombay",
    emailDomains: ["iitb.ac.in"],
    isActive: true,
  },
  {
    name: "Birla Institute of Technology and Science, Pilani (BITS Pilani)",
    slug: "bits-pilani",
    emailDomains: ["pilani.bits-pilani.ac.in"],
    isActive: true,
  },
  {
    name: "Vellore Institute of Technology (VIT)",
    slug: "vit",
    emailDomains: ["vit.ac.in"],
    isActive: true,
  },
  {
    name: "National Institute of Technology Trichy (NIT Trichy)",
    slug: "nit-trichy",
    emailDomains: ["nitt.edu"],
    isActive: true,
  },
  {
    name: "Netaji Subhas University of Technology (NSUT)",
    slug: "nsut",
    emailDomains: ["nsut.ac.in"],
    isActive: true,
  },
  {
    name: "Indraprastha Institute of Information Technology Delhi (IIITD)",
    slug: "iiit-delhi",
    emailDomains: ["iiitd.ac.in"],
    isActive: true,
  },
  {
    name: "University of Delhi (DU)",
    slug: "du",
    emailDomains: ["du.ac.in"],
    isActive: true,
  },
  {
    name: "Other / General College",
    slug: "general-college",
    emailDomains: [],
    isActive: true,
  },
];

const seedColleges = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding colleges...");

    for (const collegeData of colleges) {
      await College.findOneAndUpdate(
        { slug: collegeData.slug },
        collegeData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Seeded: ${collegeData.name}`);
    }

    console.log("Colleges seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding colleges:", error.message);
    process.exit(1);
  }
};

seedColleges();

