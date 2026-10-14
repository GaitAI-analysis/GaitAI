import { DEMO_EMAIL } from "./contact";

/**
 * THE TWO ANDROID APPS — MobilityCare and SecureVision — as the website
 * presents them.
 * =============================================================================
 * Every fact here was read off the build artefacts and the app source, not
 * written for the page:
 *
 *   package, version, build     `aapt2 dump badging` on the 0.1.1 (build 2)
 *                               APKs; `expo.android.versionCode` in app.json
 *   Android requirement         `minSdkVersion 24` / `targetSdkVersion 36`
 *   what each analysis does     docs/mobile-product-capability-matrix.md and
 *                               mobile/README.md on feature/native-apps-v2
 *   the screens                 captured from the apps running on the Android
 *                               emulator (API 36), light and dark, with the
 *                               engine READY; the results shown are the app's
 *                               own history from earlier test clips
 *
 * RELEASE STATUS, STATED PLAINLY. Version 0.2.0 (build 3) is the public,
 * subscription-gated build: free to download from the GitHub release linked
 * here, signed with the GaitAI release key, distributed outside Google Play.
 * A GaitAI account is required, every analysis asks the billing Worker for a
 * grant, and nothing functional runs without an active subscription. Plans,
 * prices and payment are inside the app only (data/subscriptions.ts) — this
 * file carries no price. `release.publicApk`, `bytes` and `sha256` are the
 * published file's, verified by downloading it back (2026-10-14).
 *
 * WORDING GUARDRAILS, from the apps' own store-listing drafts: movement
 * insight, gait metric, step-time balance, count, occupancy, estimate. Never:
 * diagnose, clinically validated, identify, recognise, face, biometric,
 * surveillance of individuals.
 */

export type ProductAppId = "mobilitycare" | "securevision";

export interface AppScreen {
  /** File stem under public/images/apps/<app>/ — `<id>-<theme>-<width>.webp`. */
  readonly id: string;
  /** Short step name in the walkthrough list. */
  readonly title: string;
  /** What the visitor is looking at, in one or two sentences. */
  readonly caption: string;
  /** Alt text: what the screenshot shows, for a reader who cannot see it. */
  readonly alt: string;
}

export interface AppAnalysis {
  readonly name: string;
  readonly input: string;
  /** What the subscription includes for this analysis. There is no free tier: every analysis needs an active subscription. */
  readonly included: string;
}

export interface ProductApp {
  readonly id: ProductAppId;
  readonly name: string;
  /** The product page this app belongs to. */
  readonly productHref: string;
  /** Anchor of the showcase on that page. */
  readonly anchor: string;
  readonly package: string;
  readonly version: string;
  readonly build: number;
  readonly android: string;
  readonly eyebrow: string;
  readonly headline: readonly [string, string];
  readonly lead: string;
  readonly tabs: readonly string[];
  readonly analyses: readonly AppAnalysis[];
  readonly comingSoon: readonly string[];
  readonly privacy: readonly string[];
  readonly honesty: string;
  readonly screens: readonly AppScreen[];
  /** Optional web demonstration on this site — a demonstration, never "the app". */
  readonly webDemo?: { readonly label: string; readonly href: string; readonly note: string };
  /** The Android download page. */
  readonly downloadHref: string;
  readonly release: {
    readonly status: string;
    readonly detail: string;
    /** Set only after a verified, approved public release exists. */
    readonly publicApk: string | null;
    /** The release build's version and build number (expo.version / android.versionCode). */
    readonly version: string;
    readonly build: number;
    /** Exact size and SHA-256 of the published file; null until it is published. */
    readonly bytes: number | null;
    readonly sha256: string | null;
  };
}

/** Screenshot geometry: every capture is a 1080×2400 phone screen. */
export const APP_SCREEN_WIDTH = 1080;
export const APP_SCREEN_HEIGHT = 2400;
export const APP_SCREEN_WIDTHS = [540, 810] as const;

export function appScreenSrc(app: ProductAppId, screen: string, theme: "light" | "dark", width: number) {
  return `/images/apps/${app}/${screen}-${theme}-${width}.webp`;
}

/** Pre-filled access request — the mailbox is the public demo address. */
export function androidAccessMailto(app: ProductApp) {
  const subject = encodeURIComponent(`${app.name} Android app — access request`);
  const body = encodeURIComponent(
    `Hello GaitAI,\n\nI would like early access to the ${app.name} Android app.\n\nOrganisation:\nRole:\nAndroid device and version:\nWhat I would like to analyse:\n`,
  );
  return `mailto:${DEMO_EMAIL}?subject=${subject}&body=${body}`;
}

const SHARED_PRIVACY = [
  "Every analysis runs on the phone. No video is uploaded for processing.",
  "The analysed video is deleted after analysis unless you switch on “Keep analysed videos”.",
  "A GaitAI account is required. Your email, subscription status and payment records are held by GaitAI and its payment provider to run the subscription; videos and measurements stay on the phone.",
  "Anonymous usage events are off by default.",
] as const;

export const productApps: Record<ProductAppId, ProductApp> = {
  mobilitycare: {
    id: "mobilitycare",
    name: "GaitAI MobilityCare",
    productHref: "/mobilitycare/",
    anchor: "app",
    package: "in.gaitai.mobilitycare",
    version: "0.2.0",
    build: 3,
    android: "Android 7.0 or later",
    eyebrow: "Explore the MobilityCare app",
    headline: ["A walk, read on", "the phone that filmed it."],
    lead:
      "GaitAI MobilityCare is a native Android app. Record or upload a 10–20 second walking video and it returns cadence and step-time balance in minutes, with every frame analysed on the device. These are the app's real screens, running on Android.",
    downloadHref: "/mobilitycare/download/",
    tabs: ["Home", "Analyze", "Progress", "Reports", "Profile"],
    analyses: [
      {
        name: "WalkScan",
        input: "10–20 s walking video, recorded or uploaded, side view preferred",
        included: "Cadence, step-time balance, step-time variability, stride regularity, trunk sway, left and right step time, the contact timeline, a quality report and the trend against previous scans",
      },
      {
        name: "RehabTrack",
        input: "Two or more of your own WalkScan sessions",
        included: "Metric-by-metric comparison between a baseline and a new scan, trend graph and report",
      },
      {
        name: "Progress and reports",
        input: "Every scan kept on the phone",
        included: "History, 7–90 day trends once two scans exist, full metrics and charts in every report, shared as text today",
      },
    ],
    comingSoon: ["Balance (still-standing sway)", "SportsMotion"],
    privacy: SHARED_PRIVACY,
    honesty:
      "All values are two-dimensional estimates from a single camera. They are movement indicators, not a diagnosis; the app computes nothing that needs distance, such as stride length or walking speed.",
    screens: [
      {
        id: "home",
        title: "Home",
        caption: "WalkScan is recommended first. Your most recent scan and the cadence trend across your last scans sit underneath.",
        alt: "MobilityCare home screen: a recommended WalkScan card with a Start WalkScan button, a recent scan reading 115 steps per minute with 95% step-time balance, and a cadence trend line.",
      },
      {
        id: "analyze",
        title: "Analyze",
        caption: "Only analyses that genuinely run are startable. WalkScan and RehabTrack are available; Balance and SportsMotion are marked Soon.",
        alt: "MobilityCare Analyze tab listing WalkScan and RehabTrack as available, each with metric tags, and Balance and SportsMotion under Coming soon.",
      },
      {
        id: "walkscan",
        title: "WalkScan guide",
        caption: "“Movement engine ready. Analysis runs on this phone.” Four capture tips, then record or upload a walking video.",
        alt: "WalkScan guide screen: Read your walk from a short video, a green Movement engine ready indicator, four numbered tips, and buttons to record or upload a walking video.",
      },
      {
        id: "result",
        title: "Result",
        caption: "Cadence and step-time balance, each with a plain explanation of what was measured and how.",
        alt: "WalkScan result: Your WalkScan result is ready, 115 steps per minute with 95% step-time balance over 11.7 seconds, with cadence and step-time balance cards.",
      },
      {
        id: "insights",
        title: "Advanced insights",
        caption: "Six more measurements computed from the same clip — step-time variability, stride regularity, trunk sway and the step times — all included with the subscription.",
        alt: "WalkScan advanced insights: step-time variability, stride regularity, trunk sway and left step time, each marked Pro with a lock and a one-line description.",
      },
      {
        id: "rehabtrack",
        title: "RehabTrack",
        caption: "Pick a baseline and a new assessment from your own scans. Changes are differences in the units they were measured in.",
        alt: "RehabTrack screen: Compare a new scan with your baseline, with baseline and new assessment lists of dated WalkScan sessions and a Compare button.",
      },
      {
        id: "progress",
        title: "Progress",
        caption: "7, 30 and 90 day windows over your history. Trends for the Pro measurements appear once two scans in range hold them.",
        alt: "Progress tab with 7, 30 and 90 day filters, trend cards for step-time variability and trunk sway marked Trend included with Pro, and a history of dated WalkScans.",
      },
      {
        id: "reports",
        title: "Reports",
        caption: "Each analysis becomes a report you can read, share and compare with your own history.",
        alt: "Reports tab listing two WalkScan reports with dates, summaries, a Free report tag and Share links.",
      },
      {
        id: "privacy",
        title: "Privacy controls",
        caption: "Analysed videos are deleted after analysis unless you keep them. Anonymous usage events are off. Your account and subscription are managed from this tab.",
        alt: "Profile tab with a name field stored on the phone, a Free subscription card, and privacy toggles for Keep analysed videos and Share anonymous usage events, both off.",
      },
    ],
    webDemo: {
      label: "Try the Movement Lab on the web",
      href: "/movement-lab/",
      note: "A browser demonstration of pose tracking on this site — not the app.",
    },
    release: {
      status: "Public release · subscription required",
      detail:
        "Version 0.2.0 (build 3) is a public release, free to download and signed with the GaitAI release key. Sign in with a GaitAI account inside the app; analysis, history and reports unlock with an active subscription, chosen and paid for in the app.",
      publicApk: "https://github.com/GaitAI-analysis/GaitAI/releases/download/android-v0.2.0/GaitAI-MobilityCare-0.2.0-build3.apk",
      version: "0.2.0",
      build: 3,
      bytes: 96573864,
      sha256: "5b6ceb799390e5b112b920b139788d451dee9bb661979e60721875dcf7fbbb1e",
    },
  },
  securevision: {
    id: "securevision",
    name: "GaitAI SecureVision",
    productHref: "/securevision/",
    anchor: "app",
    package: "in.gaitai.securevision",
    version: "0.2.0",
    build: 3,
    android: "Android 7.0 or later",
    eyebrow: "Explore the SecureVision app",
    headline: ["Count a space.", "Keep its people anonymous."],
    lead:
      "GaitAI SecureVision is a native Android app for spaces you are authorised to analyse. Upload a short video and an on-device person detector counts who it can see, frame by frame, or draw a zone and track entries, occupancy and dwell. It detects people as boxes and identifies no one. These are the app's real screens.",
    downloadHref: "/securevision/download/",
    tabs: ["Home", "Analyze", "Activity", "Reports", "Profile"],
    analyses: [
      {
        name: "CrowdSense",
        input: "Uploaded video of a space you are authorised to analyse",
        included: "Current, average and peak people visible to the detector, the density timeline, per-frame counts, detection review and export",
      },
      {
        name: "Zone & occupancy",
        input: "The same video plus a zone you draw on its first frame",
        included: "Total entries and current occupancy of the zone, the event list with timestamps, occupancy timeline, mean dwell, total exits and export",
      },
      {
        name: "Activity and reports",
        input: "Every analysis kept on the phone",
        included: "History over 7–90 days, full metrics and charts in every report, shared as text today",
      },
    ],
    comingSoon: ["Motion analysis (where and when movement happens)"],
    privacy: [
      "People are detected as boxes. The app holds no faces, identities or identity features.",
      ...SHARED_PRIVACY,
    ],
    honesty:
      "Counts are people visible to the detector in each sampled frame, not a crowd-density estimate; entries, exits and dwell are tracker estimates and are labelled so. Only analyse footage you own or are permitted to analyse.",
    screens: [
      {
        id: "home",
        title: "Home",
        caption: "CrowdSense is recommended first. Your most recent zone analysis and the rest of the catalogue sit underneath.",
        alt: "SecureVision home screen: a recommended CrowdSense card with a Start CrowdSense button, a recent Zone and occupancy result, and Explore cards for Zone and occupancy and Motion analysis.",
      },
      {
        id: "analyze",
        title: "Analyze",
        caption: "CrowdSense and Zone & occupancy are available with their outputs listed. Motion analysis is marked Soon.",
        alt: "SecureVision Analyze tab listing CrowdSense and Zone and occupancy as available with metric tags, and Motion analysis under Coming soon.",
      },
      {
        id: "crowdsense",
        title: "CrowdSense guide",
        caption: "“Movement engine ready. Analysis runs on this phone.” A reminder to analyse only footage you are authorised to analyse, then upload a video.",
        alt: "CrowdSense guide: How many people, and when, a green Movement engine ready indicator, a Before you start note about authorised footage and boxes, and an Upload a video button.",
      },
      {
        id: "zone",
        title: "Zone & occupancy guide",
        caption: "Draw a zone on the first frame and see entries, occupancy and dwell for that area.",
        alt: "Zone and occupancy guide: Draw a zone. Count what crosses it, with the engine ready indicator, the Before you start note and an Upload a video button.",
      },
      {
        id: "result",
        title: "Result",
        caption: "Total entries and current occupancy for the zone you drew, each explained in one line.",
        alt: "Zone and occupancy result: 1 entry into Restricted area, 1 inside at the end, peak 1, with total entries and current occupancy cards.",
      },
      {
        id: "insights",
        title: "Advanced insights",
        caption: "The event list, occupancy timeline, mean dwell and total exits, computed from the same clip and included with the subscription.",
        alt: "Zone and occupancy advanced insights: event list, occupancy timeline, mean dwell and total exits, each marked Pro with a lock and a description.",
      },
      {
        id: "activity",
        title: "Activity",
        caption: "Your analyses over 7, 30 and 90 days, each with its headline count.",
        alt: "Activity tab with day-range filters and a history of a Zone and occupancy analysis and a CrowdSense analysis with their counts.",
      },
      {
        id: "reports",
        title: "Reports",
        caption: "Each analysis becomes a report you can read, share and compare with your own history.",
        alt: "Reports tab listing a Zone and occupancy report and a CrowdSense report with dates, summaries and Share links.",
      },
      {
        id: "privacy",
        title: "Privacy controls",
        caption: "Analysed videos are deleted after analysis unless you keep them. Anonymous usage events are off. Your account and subscription are managed from this tab.",
        alt: "Profile tab with a name field stored on the phone, a Free subscription card, and privacy toggles for Keep analysed videos and Share anonymous usage events, both off.",
      },
    ],
    release: {
      status: "Public release · subscription required",
      detail:
        "Version 0.2.0 (build 3) is a public release, free to download and signed with the GaitAI release key. Sign in with a GaitAI account inside the app; analysis, history and reports unlock with an active subscription, chosen and paid for in the app.",
      publicApk: "https://github.com/GaitAI-analysis/GaitAI/releases/download/android-v0.2.0/GaitAI-SecureVision-0.2.0-build3.apk",
      version: "0.2.0",
      build: 3,
      bytes: 96610520,
      sha256: "9f1a47c2da3aa591ab3ffbb6f257db1416c03b4c4f08486b8ad63c1f9540b0ac",
    },
  },
};

export const productAppList = Object.values(productApps);
