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
 * RELEASE STATUS, STATED PLAINLY. The only builds that exist are a
 * debug-signed development APK and an upload-key-signed App Bundle meant for
 * Google Play internal testing. Neither is a public release: nothing is on
 * Google Play, there is no signed release APK, and in-app subscriptions are
 * not configured. So the website offers a walkthrough and a request for
 * access — never a download — until `release.publicApk` is set after a
 * verified, approved release. The page fails closed.
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
  readonly free: string;
  readonly pro: string;
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
  readonly release: {
    readonly status: string;
    readonly detail: string;
    /** Set only after a verified, approved public release exists. */
    readonly publicApk: string | null;
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
  "No account is needed. Anonymous usage events are off by default.",
] as const;

export const productApps: Record<ProductAppId, ProductApp> = {
  mobilitycare: {
    id: "mobilitycare",
    name: "GaitAI MobilityCare",
    productHref: "/mobilitycare/",
    anchor: "app",
    package: "in.gaitai.mobilitycare",
    version: "0.1.1",
    build: 2,
    android: "Android 7.0 or later",
    eyebrow: "Explore the MobilityCare app",
    headline: ["A walk, read on", "the phone that filmed it."],
    lead:
      "GaitAI MobilityCare is a native Android app. Record or upload a 10–20 second walking video and it returns cadence and step-time balance in minutes, with every frame analysed on the device. These are the app's real screens, running on Android.",
    tabs: ["Home", "Analyze", "Progress", "Reports", "Profile"],
    analyses: [
      {
        name: "WalkScan",
        input: "10–20 s walking video, recorded or uploaded, side view preferred",
        free: "Cadence (steps per minute) and step-time balance",
        pro: "Step-time variability, stride regularity, trunk sway, left and right step time, the contact timeline, a quality report and the trend against previous scans",
      },
      {
        name: "RehabTrack",
        input: "Two or more of your own WalkScan sessions",
        free: "Cadence change and balance change between a baseline and a new scan",
        pro: "Metric-by-metric comparison, trend graph and report",
      },
      {
        name: "Progress and reports",
        input: "Every scan kept on the phone",
        free: "History, 7–90 day trends once two scans exist, and reports shared as text",
        pro: "Full metrics and charts in every report",
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
        alt: "MobilityCare Analyze tab listing WalkScan and RehabTrack as available, each with free and Pro metric tags, and Balance and SportsMotion under Coming soon.",
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
        title: "Pro insights",
        caption: "Six more measurements were computed from the same clip and are stored; their values unlock with Pro. Nothing is blurred — locked values are simply not shown.",
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
        caption: "Analysed videos are deleted after analysis unless you keep them. Anonymous usage events are off. Nothing requires an account.",
        alt: "Profile tab with a name field stored on the phone, a Free subscription card, and privacy toggles for Keep analysed videos and Share anonymous usage events, both off.",
      },
    ],
    webDemo: {
      label: "Try the Movement Lab on the web",
      href: "/movement-lab/",
      note: "A browser demonstration of pose tracking on this site — not the app.",
    },
    release: {
      status: "Internal development build",
      detail:
        "Version 0.1.1 (build 2) exists as a debug-signed development APK and an upload-signed App Bundle for Google Play internal testing. It is not on Google Play, there is no public download, and in-app subscriptions are not yet configured.",
      publicApk: null,
    },
  },
  securevision: {
    id: "securevision",
    name: "GaitAI SecureVision",
    productHref: "/securevision/",
    anchor: "app",
    package: "in.gaitai.securevision",
    version: "0.1.1",
    build: 2,
    android: "Android 7.0 or later",
    eyebrow: "Explore the SecureVision app",
    headline: ["Count a space.", "Keep its people anonymous."],
    lead:
      "GaitAI SecureVision is a native Android app for spaces you are authorised to analyse. Upload a short video and an on-device person detector counts who it can see, frame by frame, or draw a zone and track entries, occupancy and dwell. It detects people as boxes and identifies no one. These are the app's real screens.",
    tabs: ["Home", "Analyze", "Activity", "Reports", "Profile"],
    analyses: [
      {
        name: "CrowdSense",
        input: "Uploaded video of a space you are authorised to analyse",
        free: "Current, average and peak people visible to the detector",
        pro: "Density timeline, per-frame counts, detection review and export",
      },
      {
        name: "Zone & occupancy",
        input: "The same video plus a zone you draw on its first frame",
        free: "Total entries and current occupancy of the zone",
        pro: "Event list with timestamps, occupancy timeline, mean dwell, total exits and export",
      },
      {
        name: "Activity and reports",
        input: "Every analysis kept on the phone",
        free: "History over 7–90 days and reports shared as text",
        pro: "Full metrics and charts in every report",
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
        caption: "CrowdSense and Zone & occupancy are available with their free and Pro outputs listed. Motion analysis is marked Soon.",
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
        title: "Pro insights",
        caption: "The event list, occupancy timeline, mean dwell and total exits were computed from the same clip and unlock with Pro.",
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
        caption: "Analysed videos are deleted after analysis unless you keep them. Anonymous usage events are off. Nothing requires an account.",
        alt: "Profile tab with a name field stored on the phone, a Free subscription card, and privacy toggles for Keep analysed videos and Share anonymous usage events, both off.",
      },
    ],
    release: {
      status: "Internal development build",
      detail:
        "Version 0.1.1 (build 2) exists as a debug-signed development APK and an upload-signed App Bundle for Google Play internal testing. It is not on Google Play, there is no public download, and in-app subscriptions are not yet configured.",
      publicApk: null,
    },
  },
};

export const productAppList = Object.values(productApps);
