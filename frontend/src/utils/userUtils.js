/**
 * Utility functions for user formatting, display names, and avatars
 */

/**
 * Extracts 1-2 uppercase initials from a full name, email, or username.
 * e.g.:
 *  "Bishal Kumar Singh" -> "BS"
 *  "Alex Morgan"        -> "AM"
 *  "Bishal"             -> "BI"
 *  "user@example.com"   -> "US"
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const cleaned = name.trim().replace(/[@._-]+/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Safely extracts user's display full name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'User';
  if (typeof user === 'string') return user;
  return (
    user.fullName ||
    user.profile?.fullName ||
    user.name ||
    user.email?.split('@')[0] ||
    'User'
  );
};

/**
 * Generates an SVG/UI-Avatar URL from user's full name
 */
export const getFallbackAvatarUrl = (name) => {
  const displayName = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=4f46e5&color=fff&bold=true&size=128`;
};
