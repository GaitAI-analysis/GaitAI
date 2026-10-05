# GaitAI MobilityCare — App Review notes (draft)

## What the reviewer needs
No account or sign-in exists. Everything works without network access except the subscription
sheet, which uses StoreKit.

## How to exercise the app
1. Open the app → onboarding → Home → **Start WalkScan**.
2. Wait for "Movement engine ready" (a few seconds on first launch while the engine extracts).
3. Either record a 10–20 s walking video (whole body in frame, side view works best) or
   **Upload a walking video** and pick any clip of a person walking.
4. The analysis runs on the device (about a second per sampled frame on recent iPhones) and
   opens the result: cadence and step-time balance are free; further metrics are listed as
   locked Pro insights.
5. Tapping a locked metric or **Unlock full analysis** opens the paywall with the App Store
   prices for the monthly and yearly subscriptions. Restore purchases and Manage subscription
   are on the same screen.

## Subscriptions
Auto-renewing: `mobilitycare_pro_monthly`, `mobilitycare_pro_yearly` in one group ("GaitAI Pro").
Content unlocked: the Pro metrics, trends, comparison and report features listed on the paywall.
Terms and privacy links are on the paywall and in Profile → About.

## Health claims
The app shows movement indicators and states on every result that they are not a diagnosis.
It does not reference diseases or make medical claims.

## Demo video for reviewers
If a sample walking clip helps, link the stock clip used in internal QA (Mixkit "man walking",
clip 4855, Mixkit licence) as a downloadable URL in the notes; do not embed personal footage.

## Known limitations to state honestly
- First analysis after install takes longer while the engine files are prepared.
- Analysis speed depends on the device; a 20 s clip is sampled at 10 frames per second.
