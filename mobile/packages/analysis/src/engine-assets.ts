/**
 * The engine's bundled files, as Metro asset modules. build-engine.mjs
 * produces all four into ../engine (gitignored); the apps' metro.config.js
 * lists html, wasm, task and tflite as asset extensions so they ship as
 * Android raw resources and expo-asset can extract them to the cache.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const ENGINE_ASSETS = {
  page: require("../engine/engine.html") as number,
  wasm: require("../engine/vision_wasm_internal.wasm") as number,
  pose: require("../engine/pose_landmarker_lite.task") as number,
  detector: require("../engine/efficientdet_lite0_int8.tflite") as number,
} as const;
export type EngineAssetKey = keyof typeof ENGINE_ASSETS;
