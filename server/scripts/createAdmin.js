import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

/**
 * Admin Bootstrap CLI Script
 * Usage:
 *   ADMIN_BOOTSTRAP_EMAIL=admin@example.com ADMIN_BOOTSTRAP_PASSWORD=AdminPass123 node scripts/createAdmin.js
 * Or pass as CLI args:
 *   node scripts/createAdmin.js admin@example.com AdminPass123 [username]
 */
async function bootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || process.argv[2];
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.argv[3];
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME || process.argv[4] || 'admin';

  if (!email || !password) {
    console.error('❌ Error: Admin email and password are required.');
    console.error('Usage: ADMIN_BOOTSTRAP_EMAIL=... ADMIN_BOOTSTRAP_PASSWORD=... npm run create-admin');
    console.error('Or: node scripts/createAdmin.js <email> <password> [username]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existingUser) {
      console.log(`Found existing user with email/username: ${existingUser.email}. Upgrading to role: 'admin'...`);
      existingUser.role = 'admin';
      existingUser.passwordHash = passwordHash;
      existingUser.mustResetPassword = false;
      existingUser.failedLoginAttempts = 0;
      existingUser.lockUntil = null;
      await existingUser.save();
      console.log(`✅ Admin account updated successfully: ${existingUser.email} (role: admin)`);
    } else {
      console.log(`Creating new admin account: ${cleanEmail}...`);
      const newAdmin = new User({
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: 'admin',
        mustResetPassword: false,
        failedLoginAttempts: 0,
        lockUntil: null,
        preferredAccent: 'US',
        targetBand: 9.0
      });
      await newAdmin.save();
      console.log(`✅ New Admin account created successfully: ${cleanEmail} (role: admin)`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Admin bootstrap failed:', err.message);
    process.exit(1);
  }
}

// Only execute when invoked directly from command line (prevent execution on import)
if (process.argv[1] && process.argv[1].endsWith('createAdmin.js')) {
  bootstrapAdmin();
}

export default bootstrapAdmin;
