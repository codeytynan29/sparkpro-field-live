import json, sys, base64, urllib.request, concurrent.futures as cf, os
F = {
 4: "a microscopic ball of cells (blastocyst, about 0.2 mm) just implanting into the soft pink uterine lining; no visible embryo features",
 5: "a tiny early embryo (about 2 mm), a flat oval disc beside a small round yolk sac inside a fluid-filled gestational sac; no limbs, no face",
 6: "a C-shaped embryo (about 4 mm) with a small tail, a bulge where the heart is, tiny limb buds, and folds at the neck; no face yet, attached to a yolk sac",
 7: "a curved embryo (about 1 cm) with a large head, dark eye spots, paddle-shaped arm buds, smaller leg buds and a short tail; attached by a short umbilical cord near a yolk sac",
 8: "an embryo (about 1.6 cm) with an oversized head, pigmented eyes on the sides of the face, webbed hand plates with faint finger ridges, bent elbows, a shrinking tail, and an umbilical cord",
 9: "an embryo (about 2.3 cm) with a big rounded head, fingers starting to separate, toe ridges, the tail gone, early ears and a forming nose and mouth",
 10: "a tiny fetus (about 3 cm) that now looks human: head about half its length, separate fingers and toes, closed fused eyelids, translucent skin",
 11: "a fetus (about 4 cm) with a large head, a defined profile with nose and chin, hands raised near the face, thin translucent skin",
 12: "a fetus (about 5.5 cm) with more human proportions, a clear profile, tiny fingers, thin translucent pink skin showing faint blood vessels",
 13: "a fetus (about 7 cm) with longer limbs, a clear profile, thumb near its mouth, thin translucent pink skin",
 14: "a fetus (about 8.5 cm), slender, with longer arms and legs, ears moving into place, translucent pink skin",
 15: "a slender fetus (about 10 cm) moving its arms and legs, translucent skin with faint vessels, ears and eyes in nearly final position",
 16: "a slender fetus (about 11.5 cm) with legs now longer than arms, fine facial features, eyes closed, thin skin",
 17: "a lean fetus (about 13 cm) with very little body fat, thin reddish translucent skin, eyes closed",
 18: "a lean fetus (about 14 cm) with fine soft hair (lanugo) beginning, thin reddish skin, eyes closed, curled loosely",
 19: "a lean fetus (about 15 cm) with fine lanugo hair and a light waxy coating starting, eyebrows forming, eyes closed",
 20: "a fetus at the halfway point (about 25 cm head to toe), lean, reddish skin, eyebrows, eyes closed, moving freely in fluid",
 21: "a lean fetus (about 27 cm) with wrinkled reddish skin, eyebrows and eyelids, more coordinated movements",
 22: "a lean fetus (about 28 cm) with wrinkled skin, clear eyebrows and lips, tiny fingernails starting",
 23: "a lean fetus (about 29 cm) with wrinkled reddish skin and the first wisps of head hair",
 24: "a slender fetus (about 30 cm) with wrinkled translucent skin, face nearly as a newborn's but thinner",
 25: "a fetus (about 34 cm) starting to fill out slightly, skin less translucent, some head hair",
 26: "a fetus (about 36 cm) with eyes just beginning to open, still lean, reddish skin",
 27: "a fetus (about 37 cm) with eyes open, sleeping and waking, filling out a little",
 28: "a fetus (about 38 cm) with eyes open, eyelashes, a little more fat under the skin, smoother skin",
 29: "a fetus (about 39 cm) with smoother skin and a rounder face, eyes open, head hair",
 30: "a fetus (about 40 cm) gaining fat, rounder cheeks, head hair, eyes open",
 31: "a fetus (about 41 cm), plumper, pinkish skin, eyes open, curled with knees up",
 32: "a fetus (about 42 cm), plump with soft pink skin, toenails and fingernails, curled, mostly head-down",
 33: "a fetus (about 44 cm), chubby, pink skin, head-down, curled and snug, little room left",
 34: "a fetus (about 45 cm), chubby with smooth pink skin and a waxy coating, head-down, curled",
 35: "a fetus (about 46 cm), plump, head-down and tightly curled, legs tucked",
 36: "a nearly full-term fetus (about 47 cm), round cheeks, chubby limbs, head-down, very snug",
 37: "a full-term fetus (about 48 cm), plump, head-down and engaged low, curled tightly",
 38: "a full-term baby (about 49 cm) curled head-down, chubby with patches of waxy coating, full head of hair",
 39: "a full-term baby (about 50 cm) curled head-down, plump, ready to be born",
 40: "a full-term baby (about 51 cm) curled head-down in a snug womb, plump cheeks, ready for birth",
}
def prompt(w):
    return (f"Medically accurate, lifelike educational illustration of a human pregnancy at {w} weeks of gestation ({max(0,w-2)} weeks after conception): {F[w]}. "
            "Shown gently inside the amniotic sac with soft warm translucent light, like a high-end science museum model or textbook plate. "
            "Calm, tender, not graphic, no blood, no mother's body shown, no text, no labels, no watermark. Centered subject, plain soft dark background, square composition.")
def gen(w):
    out = f"{w}.png"
    if os.path.exists(out): return w, 'cached'
    body = json.dumps({"model": "gpt-image-2", "prompt": prompt(w), "size": "1024x1024", "quality": "medium", "n": 1}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=body, headers={"Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=300) as r: d = json.load(r)
            open(out, 'wb').write(base64.b64decode(d['data'][0]['b64_json'])); return w, 'ok'
        except Exception as e:
            err = e.read().decode()[:300] if hasattr(e, 'read') else str(e)
    return w, 'fail ' + err
weeks = [int(x) for x in sys.argv[1:]]
with cf.ThreadPoolExecutor(6) as ex:
    for w, st in ex.map(gen, weeks): print(w, st, flush=True)
