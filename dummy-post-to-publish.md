# Dummy post — copy each field into the Content Studio editor

Everything below maps to a field in `/admin-controlpanel` → **Content Studio** → **New post**.
The body deliberately uses every markdown feature the site renders, so publishing this
also verifies the article layout end to end.

---

## Title

```
What your first ten steps reveal
```

## Summary

```
Long before a limp is visible, walking rhythm starts to drift. A short look at why the first ten steps of a walk carry more signal than the hundred that follow.
```

## Category

```
blog
```

## Author

```
GaitAI Research
```

## Tags

```
gait analysis
movement intelligence
early detection
research notes
```

*(Type each one and press Enter.)*

## Publish date

Today's date — the editor defaults to it.

## Featured

Leave **on** for this test, so you can confirm featured styling works.

## External URL / Subscriber-only

Leave both empty.

---

## Body

Copy everything between the lines below into the **Body** field.

---

Most people assume a walking problem announces itself. A limp, a stumble, a cane. In practice, the body compensates long before it complains — and those compensations are measurable.

## The first ten steps

Walking is not uniform. The opening steps of any walk are where the body negotiates balance, and they carry disproportionate signal:

- **Step length asymmetry** — the gap between left and right stride, often the earliest deviation
- **Cadence variability** — how much the rhythm wobbles between steps
- **Double-support time** — how long both feet stay grounded, which quietly increases when confidence drops
- **Trunk sway** — lateral movement the walker rarely notices

By step twenty, the body has settled into a compensated pattern that masks much of this. The opening is where the honest data lives.

### Why compensation hides the signal

Compensation is the body doing its job. A weakened hip recruits the opposite side; a stiff ankle borrows range from the knee. The result *looks* like normal walking, which is exactly the problem — the surface presentation is stable while the underlying mechanics drift.

> The clinically useful question isn't "does this person walk badly?" It's "does this person walk differently than they did six weeks ago?"

That reframing matters. Absolute thresholds produce false alarms across populations. Change over time, measured against a person's own baseline, is far harder to argue with.

## What we measure

A typical observation window produces a small set of derived signals:

```python
from gaitai import GaitStream

stream = GaitStream.from_camera(0)
for window in stream.windows(seconds=10):
    print(window.symmetry, window.cadence_var, window.double_support)
```

Each is cheap to compute and stable under ordinary lighting. The interesting work isn't extracting them — it's deciding when a change is meaningful rather than noise.

### The ordering that works

1. Establish a personal baseline over several sessions
2. Track deviation from that baseline, not from a population average
3. Escalate only on sustained drift, never on a single reading
4. Put a human in the loop before any conclusion is drawn

Step four is not a formality. Movement data is suggestive, not diagnostic.

## What this is not

GaitAI does **not** diagnose. It surfaces changes worth a second look by someone qualified to interpret them. The distinction is the whole ethical footing of the product: a system that flags *"this is worth checking"* is useful, while one that declares *"this person has X"* is both wrong and harmful.

---

If you work in rehabilitation, elderly care, or movement research and want to compare notes, [get in touch](/#contact) — we're actively forming research collaborations.

---

## After you publish

1. The post should appear on **/insights** immediately.
2. Click the card — it opens via the live Firestore lookup.
3. Scroll to the discussion and post a test comment; it should appear instantly.
4. Go back to **Control Panel → Comments** and try **Hide**, then **Show again**, then **Delete**.

That exercises the whole stack: post CRUD, live reads, instant comments, and moderation.
