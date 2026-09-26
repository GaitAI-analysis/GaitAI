"""Gait events and phases from the rendered cycle's own kinematics.

Input: the per-frame `K` rows run-render.mjs stores in meta.json (floor-relative heel
and toe-tip heights in cm, clinical hip / knee / ankle angles, shank angle, ankle
forward position, pelvis height and obliquity). Nothing here is invented: every
boundary is an event measured on the body.

Per side (Perry's eight phases, each bounded by a measured event):
  0 initial contact    the heel reaches the floor
  1 loading response   ... until the OTHER foot's toe-off
  2 mid stance         ... until this heel rises
  3 terminal stance    ... until the OTHER foot's initial contact
  4 pre-swing          ... until this toe-off
  5 initial swing      ... until this ankle passes the other (feet adjacent)
  6 mid swing          ... until this tibia is vertical
  7 terminal swing     ... until this heel strikes again
"""
import json, sys

PHASES = ["Initial contact", "Loading response", "Mid stance", "Terminal stance",
          "Pre-swing", "Initial swing", "Mid swing", "Terminal swing"]
CONTACT = 2.0   # cm above the sole's rest height: on the floor (the toe break lifts the tip ~1.3 cm)
RISE = 2.0      # cm: the heel has left the floor


def analyse(frames, heel_rest=2.06, toe_rest=1.46):
    K = [f["K"] for f in frames]
    n = len(K)
    hh = {s: [k[s]["heelY"] - heel_rest for k in K] for s in "lr"}
    th = {s: [k[s]["toeY"] - toe_rest for k in K] for s in "lr"}
    nxt = lambda i: (i + 1) % n
    prv = lambda i: (i - 1) % n
    # On the floor = low AND travelling back with the ground (the body walks in place);
    # a swinging foot skims low too, but moves forward.
    vz = {s: [K[nxt(i)][s]["ankZ"] - K[prv(i)][s]["ankZ"] for i in range(n)] for s in "lr"}
    down = {s: [min(hh[s][i], th[s][i]) < CONTACT and vz[s][i] < 1.0 for i in range(n)] for s in "lr"}

    def first(cond, start):
        for j in range(n):
            i = (start + j) % n
            if cond(i):
                return i
        return None

    ev = {}
    for s in "lr":
        o = "r" if s == "l" else "l"
        ic = first(lambda i: down[s][i] and not down[s][prv(i)], 0)
        to = first(lambda i: down[s][i] and not down[s][nxt(i)], ic)
        to = nxt(to)  # first airborne frame
        rise = first(lambda i: hh[s][i] > RISE and th[s][i] < CONTACT, nxt(ic))
        adj = first(lambda i: K[i][s]["ankZ"] > K[i][o]["ankZ"], to)
        tib = first(lambda i: K[i][s]["shank"] >= 0, adj)
        ev[s] = dict(ic=ic, to=to, rise=rise, adj=adj, tib=tib)
    for s in "lr":
        o = "r" if s == "l" else "l"
        e = ev[s]
        e["oto"], e["oic"] = ev[o]["to"], ev[o]["ic"]
        off = lambda x: (x - e["ic"]) % n
        # Keep the stance events in order: a heel that stays down until the other
        # heel strikes simply has no terminal stance.
        if off(e["rise"]) > off(e["oic"]) or off(e["rise"]) < off(e["oto"]):
            e["rise"] = e["oic"]
        # Swing in thirds (the usual clinical split): initial, mid, terminal.
        sw = (e["ic"] - e["to"]) % n
        e["adj"] = (e["to"] + round(sw / 3)) % n
        e["tib"] = (e["to"] + round(2 * sw / 3)) % n

    def between(i, a, b):
        return (i - a) % n < (b - a) % n

    phase = {}
    for s in "lr":
        e = ev[s]
        seq = [e["ic"], nxt(e["ic"]), e["oto"], e["rise"], e["oic"], e["to"], e["adj"], e["tib"], e["ic"]]
        ph = []
        for i in range(n):
            p = 7
            for k in range(8):
                if between(i, seq[k], seq[k + 1]):
                    p = k
                    break
            ph.append(p)
        phase[s] = ph

    # Centre of pressure along the sole, 0 = heel, 1 = toe tip, during stance.
    cop = {}
    for s in "lr":
        e = ev[s]
        st = (e["to"] - e["ic"]) % n
        c = []
        for i in range(n):
            if not between(i, e["ic"], e["to"]):
                c.append(None); continue
            if th[s][i] > CONTACT:          # heel only: the heel
                c.append(0.0)
            elif hh[s][i] > CONTACT:         # heel up: rolling onto the forefoot
                u = (i - e["rise"]) % n / max(1, (e["to"] - e["rise"]) % n)
                c.append(round(0.62 + 0.38 * u, 3))
            else:                            # foot flat: heel to midfoot
                u = (i - e["ic"]) % n / max(1, (e["rise"] - e["ic"]) % n)
                c.append(round(min(0.62, 0.62 * u), 3))
        cop[s] = c

    events = []
    for s in "lr":
        e = ev[s]
        events += [[e["ic"], s, "Heel strike"], [e["oto"], s, "Mid stance"], [e["rise"], s, "Heel rise"], [e["to"], s, "Toe off"]]
    events.sort()
    out = {
        "phases": PHASES,
        "phase": [[phase["l"][i], phase["r"][i]] for i in range(n)],
        "stance": [[int(between(i, ev[s]["ic"], ev[s]["to"])) for s in "lr"] for i in range(n)],
        "cop": [[cop["l"][i], cop["r"][i]] for i in range(n)],
        "angles": [[round(K[i][s][a]) for s in "lr" for a in ("hip", "knee", "ankle")] for i in range(n)],
        "pelvisY": [round(k["pelvisY"], 2) for k in K],
        "obliq": [round(k["obliq"], 1) for k in K],
        "events": events,
        "ic": {"l": ev["l"]["ic"], "r": ev["r"]["ic"]},
        "to": {"l": ev["l"]["to"], "r": ev["r"]["to"]},
    }
    return out, ev


if __name__ == "__main__":
    meta = json.load(open(sys.argv[1]))
    g, ev = analyse(meta["frames"])
    n = len(g["phase"])
    print("events", json.dumps(ev))
    for s, k in (("L", 0), ("R", 1)):
        counts = [0] * 8
        for p in g["phase"]:
            counts[p[k]] += 1
        print(s, "phase % ", [round(100 * c / n) for c in counts], "stance %", round(100 * sum(x[k] for x in g["stance"]) / n))
    for i in range(0, n, 3):
        print(i, g["phase"][i], g["stance"][i], g["cop"][i], g["angles"][i])
