// Expo's default config handles the monorepo (workspace packages resolve via
// symlinks). The analysis engine page ships as a bundled asset, so `html`
// is added to the asset extensions.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...config.resolver.assetExts, "html"];
config.watchFolders = [path.resolve(__dirname, "../..")];
module.exports = config;
