// Expo's default Metro config already understands yarn workspaces (watching
// the monorepo root and resolving hoisted packages), so nothing custom is needed.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
