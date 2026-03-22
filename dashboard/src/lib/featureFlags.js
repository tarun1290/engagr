/**
 * Feature Flag Utility
 *
 * Single source of truth for checking if a feature is enabled for a user.
 * Used by all conditional renders in the user dashboard.
 *
 * @param {Object} stats - The stats object from getDashboardStats (contains aiFeatureEnabled, smartFeaturesEnabled)
 * @param {string} featureName - Feature identifier
 * @returns {boolean}
 */
export function isFeatureEnabled(stats, featureName) {
  if (!stats) return false;

  const flagMap = {
    "ai-detection": stats.aiFeatureEnabled,
    "smart-links": stats.aiFeatureEnabled,
    "links": stats.aiFeatureEnabled,
    "shopify": stats.smartFeaturesEnabled?.shopify,
    "knowledge-base": stats.smartFeaturesEnabled?.knowledgeBase,
    "smart-replies": stats.smartFeaturesEnabled?.smartReplies,
    "conversations": stats.smartFeaturesEnabled?.smartReplies,
  };

  return flagMap[featureName] === true;
}
