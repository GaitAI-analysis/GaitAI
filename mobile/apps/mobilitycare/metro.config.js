// Expo's default config handles the monorepo (workspace packages resolve via
// symlinks). The analysis engine page ships as bundled assets, so `html`
// and its WebAssembly runtime and model files are added to the asset extensions.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...config.resolver.assetExts, "html", "wasm", "task", "tflite"];
config.watchFolders = [path.resolve(__dirname, "../..")];
module.exports = config;
