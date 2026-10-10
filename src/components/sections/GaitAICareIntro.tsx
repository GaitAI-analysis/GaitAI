import {
  ArrowUpRight,
  BedDouble,
  Clock,
  FileText,
  HeartPulse,
  Lock,
  Pill,
  Syringe,
  Users,
} from "lucide-react";

/**
 * GaitAI Care — the personal health-record app, introduced on the MobilityCare
 * page right after the Time Machine: that section argues a repeated record is
 * worth more than a snapshot, and GaitAI Care is where people keep theirs.
 *
 * Copy rules: the app is in early access, so nothing here promises open,
 * unrestricted sign-up, a compliance badge or a diagnosis. Every claim below is
 * implemented in the app (care.gaitai.in): encrypted originals, email-verified
 * accounts, text read on GaitAI's own servers (no outside AI), export and
 * deletion. The record list on the right is illustrative, not a patient.
 * Until CARE_IS_LIVE is true there is no link to the app, only "Launching soon".
 */

const CARE_URL = "https://care.gaitai.in";

/**
 * Flip to true only after care.gaitai.in is deployed, verified and the owner has
 * approved the release. While false the section renders no link to the app at all:
 * the site must never send visitors to a service that is not running.
 */
const CARE_IS_LIVE = false;

const features = [
  {
    icon: FileText,
    title: "Medical reports",
    body: "Upload PDFs and photos. Text is read on GaitAI's own servers and becomes history only after you check it against the original.",
  },
  {
    icon: Pill,
    title: "Medicines & supplements",
    body: "Courses as written, what was actually taken, and reminders you confirm yourself.",
  },
  {
    icon: BedDouble,
    title: "Hospital stays & vaccinations",
    body: "Admissions, discharge summaries, vaccination cards and next doses, on one timeline.",
  },
  {
    icon: Users,
    title: "Family profiles",
    body: "Yourself, your children, your parents: separate profiles, with read-only access you can grant and revoke.",
  },
];

const privacy = [
  "Encrypted originals",
  "Email-verified accounts",
  "No outside AI",
  "Export or delete any time",
];

const illustrative = [
  { icon: FileText, kind: "Lab report", title: "Complete blood count", meta: "Reviewed · 3 values on the trend" },
  { icon: Pill, kind: "Medicine course", title: "Antibiotic, 5 days", meta: "Prescribed · 5 of 5 doses recorded" },
  { icon: BedDouble, kind: "Hospital stay", title: "Admission and discharge", meta: "Discharge summary attached" },
  { icon: Syringe, kind: "Vaccination", title: "Booster dose", meta: "Given · next dose reminder set" },
];

export function GaitAICareIntro() {
  return (
    <section
      id="gaitai-care"
      className="section site-anchor-offset relative overflow-hidden bg-obsidian-300/40"
      aria-labelledby="gaitai-care-title"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-[12%] top-1/2 h-[520px] w-[820px] -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(213,160,33,0.16), transparent 70%)",
          }}
        />
      </div>

      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden />
              GaitAI Care · Early access
            </div>

            <h2
              id="gaitai-care-title"
              className="mt-5 font-display text-display-lg text-balance text-soft-white"
            >
              Your health records. Your history.{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Your insights.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-gray">
              GaitAI Care is a digital health record management platform
              designed to help individuals, parents, and families securely
              organize their medical history, track treatments, manage
              medications, and understand medical reports with AI-assisted
              insights.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-300/8 text-amber-300">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="font-display text-[15px] font-semibold text-soft-white">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-soft-mute">
                    {body}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {CARE_IS_LIVE ? (
                <>
                  <a
                    href={CARE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    /* GaitAI Care brand: navy on paper, gold at night; never the site's electric-blue primary. */
                    className="inline-flex items-center gap-2 rounded-full bg-[#0b1739] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#16264f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 dark:bg-[#c9a44c] dark:text-[#0b1739] dark:hover:bg-[#d8b765]"
                  >
                    Open GaitAI Care
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                  <a
                    href={`${CARE_URL}/privacy.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Privacy notice
                  </a>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/[0.08] px-5 py-2.5 text-sm font-semibold text-amber-300">
                  <Clock className="h-4 w-4" aria-hidden />
                  Launching soon
                </span>
              )}
            </div>

            <p className="mt-4 max-w-xl text-[11.5px] leading-relaxed text-soft-mute">
              GaitAI Care organises records. It is not a medical device and
              does not diagnose, prescribe or recommend treatment; your
              clinicians make medical decisions.
            </p>
          </div>

          {/* Illustrative record: shows the shape of the app, not a person. */}
          <div className="relative">
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                    Health timeline
                  </div>
                  <div className="mt-1 font-display text-lg text-soft-white">
                    One profile, every record
                  </div>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-soft-mute">
                  Illustrative
                </span>
              </div>

              <ol className="mt-5 space-y-2.5">
                {illustrative.map(({ icon: Icon, kind, title, meta }) => (
                  <li
                    key={kind}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                        {kind}
                      </div>
                      <div className="truncate text-[14px] font-medium text-soft-white">
                        {title}
                      </div>
                      <div className="text-[12px] text-soft-mute">{meta}</div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-4">
                {privacy.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/[0.06] px-2.5 py-1 text-[11px] font-medium text-amber-200"
                  >
                    <Lock className="h-3 w-3" aria-hidden />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
