import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";
import College from "./models/College.js";
import LostFound from "./models/LostFound.js";
import Listing from "./models/Listing.js";

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding Lost & Found + Freecycle...");

    const user = await User.findOne();
    if (!user) {
      console.log("No user found in database. Please register a user first.");
      process.exit(0);
    }

    const college = user.college || (await College.findOne())?._id;

    // Check if items already exist
    const count = await LostFound.countDocuments();
    if (count === 0) {
      await LostFound.create([
        {
          type: "lost",
          title: "boAt Airdopes 141 Charging Case (Matte Black)",
          category: "electronics",
          location: "Central Library, 2nd Floor reading area",
          description: "Lost my black charging case around 3 PM yesterday. It has a small Pikachu sticker on the back. Only the case was lost.",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: "open",
          contactInfo: "Please contact me or hand it over at the Library reception.",
          user: user._id,
          college: college,
        },
        {
          type: "found",
          title: "Blue Parker Vector Fountain Pen & Notebook",
          category: "books-notes",
          location: "Nescafe Canteen table near audi",
          description: "Found a blue notebook along with an engraved Parker pen left on the round table after lunch.",
          date: new Date(),
          status: "open",
          securityQuestion: "What name or initials are handwritten on the first page of the notebook?",
          contactInfo: "Room 108, Hostel 2 or message me here.",
          user: user._id,
          college: college,
        },
      ]);
      console.log("Seeded 2 sample Lost & Found items!");
    } else {
      console.log(`Lost & Found already has ${count} items.`);
    }

    // Check Freecycle listing
    const freeCount = await Listing.countDocuments({ listingType: "free" });
    if (freeCount === 0) {
      await Listing.create({
        title: "Engineering Graphics Drafter & Mini-Scale Set (Free for 1st Year)",
        description: "Cleared 1st year EG practicals! In good working condition. Giving it away to any junior who needs it for the upcoming semester.",
        category: "other",
        condition: "good",
        listingType: "free",
        price: 0,
        seller: user._id,
        college: college,
        status: "active",
      });
      console.log("Seeded 1 sample Freecycle item!");
    } else {
      console.log(`Freecycle already has ${freeCount} items.`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error.message);
    process.exit(1);
  }
};

seedData();
