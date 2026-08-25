/**
 * Storage Scope Engine
 * Provides dynamic, strictly isolated namespace keys for Guest vs Authenticated User sessions.
 *
 * Namespace convention:
 * - Guest: `eng_v2_guest_<baseKey>`
 * - User:  `eng_v2_u_<userId>_<baseKey>`
 */

let activeUserId = null;
const scopeChangeListeners = new Set();

/**
 * Set the current active user ID for storage scoping.
 * @param {string|null} userId - The stable MongoDB user ID from JWT auth session, or null for guest.
 */
export const setStorageScope = (userId) => {
  const cleanId = userId && typeof userId === 'string' && userId.trim() ? userId.trim() : null;
  if (activeUserId !== cleanId) {
    activeUserId = cleanId;
    // Notify registered listeners of scope change
    scopeChangeListeners.forEach(listener => {
      try {
        listener(activeUserId);
      } catch (err) {
        console.error('Error in storage scope listener:', err);
      }
    });
  }
};

/**
 * Get current active user ID (or null for guest).
 */
export const getCurrentUserId = () => activeUserId;

/**
 * Get current storage scope identifier ('guest' or userId).
 */
export const getCurrentScope = () => activeUserId || 'guest';

/**
 * Check if the active scope belongs to an authenticated user.
 */
export const isUserScope = () => activeUserId !== null;

/**
 * Generates a scoped localStorage key.
 *
 * @param {string} baseKey - The logical base key (e.g. 'saved_vocab', 'user_stats')
 * @param {string|null} [explicitUserId] - Optional override userId. Defaults to activeUserId if undefined.
 * @returns {string} The fully qualified, scoped localStorage key.
 */
export const getScopedKey = (baseKey, explicitUserId = undefined) => {
  const targetId = explicitUserId !== undefined ? explicitUserId : activeUserId;
  const cleanId = targetId && typeof targetId === 'string' && targetId.trim()
    ? targetId.trim()
    : null;

  if (cleanId && cleanId !== 'guest') {
    return `eng_v2_u_${cleanId}_${baseKey}`;
  }
  return `eng_v2_guest_${baseKey}`;
};

/**
 * Subscribe to storage scope changes (e.g. on login / logout / switch user).
 * @param {Function} callback - Function receiving (newUserId | null)
 * @returns {Function} Unsubscribe function
 */
export const onStorageScopeChange = (callback) => {
  if (typeof callback === 'function') {
    scopeChangeListeners.add(callback);
    return () => scopeChangeListeners.delete(callback);
  }
  return () => {};
};

/**
 * Clear all scope change listeners (useful in unit tests)
 */
export const clearStorageScopeListeners = () => {
  scopeChangeListeners.clear();
};

export default {
  setStorageScope,
  getCurrentUserId,
  getCurrentScope,
  isUserScope,
  getScopedKey,
  onStorageScopeChange,
  clearStorageScopeListeners
};
