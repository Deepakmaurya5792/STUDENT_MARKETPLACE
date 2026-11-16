import 'dotenv/config';
import connectDB from './config/db.js';


const test = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    process.exit(0);
  } catch (e) {
    console.error('❌ Connection failed', e);
    process.exit(1);
  }
};

test();
