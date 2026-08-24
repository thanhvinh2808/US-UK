import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';

dotenv.config();

/**
 * Validates whether a given string is a valid bcrypt hash
 */
export const isBcryptHash = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
};

/**
 * Migration Function: Upgrades Legacy Users to Security Schema V2
 */
export async function migrateLegacyUsers() {
  console.log('🔄 Starting Phase 2 User & Session Data Migration...');

  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    // 1. Ensure UserSession TTL & unique indexes exist
    console.log('Ensuring indexes for User and UserSession models...');
    await User.createIndexes();
    await UserSession.createIndexes();

    // 2. Scan and migrate User documents
    const users = await User.find({}).select('+passwordHash');
    console.log(`Found ${users.length} user records to evaluate.`);

    let migratedCount = 0;
    let flaggedResetCount = 0;

    for (const user of users) {
      let modified = false;

      // Check role
      if (!user.role || !['user', 'admin'].includes(user.role)) {
        user.role = 'user';
        modified = true;
      }

      // Check passwordHash integrity
      // CRITICAL RULE: NEVER bcrypt hash 'demo_password_hash'! Flag for reset instead.
      if (!user.passwordHash || user.passwordHash === 'demo_password_hash' || !isBcryptHash(user.passwordHash)) {
        if (!user.mustResetPassword) {
          user.mustResetPassword = true;
          modified = true;
          flaggedResetCount++;
        }
      }

      // Ensure failed login fields
      if (user.failedLoginAttempts === undefined) {
        user.failedLoginAttempts = 0;
        modified = true;
      }

      if (user.lockUntil === undefined) {
        user.lockUntil = null;
        modified = true;
      }

      if (modified) {
        await user.save();
        migratedCount++;
      }
    }

    console.log(`✅ Migration complete: ${migratedCount} users updated (${flaggedResetCount} flagged for password reset).`);
    console.log('0 records deleted. All existing data intact.');
    return { migratedCount, flaggedResetCount };
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  }
}

// Only execute when invoked directly from command line (prevent execution on import)
if (process.argv[1] && process.argv[1].endsWith('migrateUsers.js')) {
  migrateLegacyUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrateLegacyUsers;
