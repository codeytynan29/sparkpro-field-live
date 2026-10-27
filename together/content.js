// ── Together: the content library ────────────────────────────────────────────
// Everything the app *says* lives here, separate from how it says it, so the
// medical wording can be reviewed (and corrected) in one place.
//
// Sources the wording follows: ACOG (American College of Obstetricians and
// Gynecologists) patient FAQs, MotherToBaby (OTIS) fact sheets, FDA drug safety
// communications, CDC/FDA food-safety guidance for pregnancy. This is general
// education for healthy pregnancies — it is not a diagnosis, and every
// medication line ends at "confirm with your OB, midwife or pharmacist".

// Gestational age is counted from the first day of the last menstrual period
// (LMP), so "week 5" is roughly three weeks after conception. Due date is
// LMP + 280 days (Naegele's rule) — the same number an OB's wheel gives.

// Every food here has an emoji that actually shows that food. The two seeds
// have none, so they're small drawings instead.
const POPPY = '<svg viewBox="0 0 40 40" width="1em" height="1em" aria-hidden="true"><circle cx="20" cy="20" r="5" fill="#5a5370" stroke="#9a92ab" stroke-width="1"/><circle cx="18.5" cy="18.5" r="1.4" fill="#8a8398"/></svg>'
const SESAME = '<svg viewBox="0 0 40 40" width="1em" height="1em" aria-hidden="true"><path d="M20 7c7 6 8.5 18 0 26-8.5-8-7-20 0-26z" fill="#f3e3bf" stroke="#c9a565" stroke-width="1.6" transform="rotate(25 20 20)"/></svg>'
// Small drawings for same-size things that have no emoji
const svg = body => `<svg viewBox="0 0 40 40" width="1em" height="1em" aria-hidden="true">${body}</svg>`
const SALT = svg('<rect x="17" y="17" width="6" height="6" rx="1" fill="#f4f1ee" stroke="#aaa3ad" stroke-width="1" transform="rotate(12 20 20)"/>')
const SAND = svg('<circle cx="20" cy="20" r="4" fill="#d8b77a" stroke="#a8874c" stroke-width="1"/>')
const APPLE_SEED = svg('<path d="M20 9c6 5 7 15 0 22-7-7-6-17 0-22z" fill="#5b3420" stroke="#3a2012" stroke-width="1.2" transform="rotate(-20 20 20)"/><path d="M18 14c1 3 1 6 0 9" stroke="#8a5a3c" stroke-width="1.2" fill="none" transform="rotate(-20 20 20)"/>')
const PEPPERCORN = svg('<circle cx="20" cy="20" r="7" fill="#3b2f2c" stroke="#1f1816" stroke-width="1"/><path d="M15 18c3-2 6-2 9 0M15 22c3 2 6 2 9 0" stroke="#5d4c47" stroke-width="1.2" fill="none"/>')
const JELLY_BEAN = svg('<path d="M9 22c-2-8 6-14 13-11 4 2 5 4 9 3 4 0 4 7 0 10-6 5-20 6-22-2z" fill="#ee5a7a" stroke="#b83656" stroke-width="1.4"/><ellipse cx="17" cy="16" rx="4" ry="1.6" fill="#fff" opacity=".55" transform="rotate(-15 17 16)"/>')
const RICE = svg('<ellipse cx="20" cy="20" rx="10" ry="4" fill="#f7f3ea" stroke="#c9c0ad" stroke-width="1.2" transform="rotate(-25 20 20)"/>')
const COFFEE_BEAN = svg('<ellipse cx="20" cy="20" rx="10" ry="13" fill="#6b4226" stroke="#3e2414" stroke-width="1.2" transform="rotate(20 20 20)"/><path d="M17 9c5 6-1 16 5 23" stroke="#2c180c" stroke-width="1.8" fill="none" transform="rotate(20 20 20)"/>')
const GUMBALL = svg('<circle cx="20" cy="20" r="13" fill="#4aa3df" stroke="#2a78ad" stroke-width="1.2"/><circle cx="15" cy="15" r="4" fill="#fff" opacity=".6"/>')

export const BABY_SIZE = {
  4: ['poppy seed', POPPY, '~1 mm'], 5: ['sesame seed', SESAME, '~2 mm'], 6: ['sweet pea', '🫛', '~5 mm'],
  7: ['blueberry', '🫐', '~1 cm'], 8: ['kidney bean', '🫘', '~1.6 cm'], 9: ['cherry', '🍒', '~2.3 cm'],
  10: ['strawberry', '🍓', '~3 cm'], 11: ['kiwi', '🥝', '~4 cm'], 12: ['lime', '🍋‍🟩', '~5 cm'],
  13: ['lemon', '🍋', '~7 cm'], 14: ['peach', '🍑', '~8.5 cm'], 15: ['apple', '🍎', '~10 cm'],
  16: ['avocado', '🥑', '~11.5 cm'], 17: ['pear', '🍐', '~13 cm'], 18: ['bell pepper', '🫑', '~14 cm'],
  19: ['mango', '🥭', '~15 cm'], 20: ['banana', '🍌', '~16.5 cm (head to bottom)'], 21: ['carrot', '🥕', '~27 cm (head to toe)'],
  22: ['bunch of grapes', '🍇', '~28 cm'], 23: ['big sweet potato', '🍠', '~29 cm'], 24: ['ear of corn', '🌽', '~30 cm'],
  25: ['head of broccoli', '🥦', '~34 cm'], 26: ['long cucumber', '🥒', '~36 cm'], 27: ['eggplant', '🍆', '~37 cm'],
  28: ['large eggplant', '🍆', '~38 cm'], 29: ['small pumpkin', '🎃', '~39 cm'], 30: ['coconut', '🥥', '~40 cm'],
  31: ['large coconut', '🥥', '~41 cm'], 32: ['pineapple', '🍍', '~42 cm'], 33: ['large pineapple', '🍍', '~44 cm'],
  34: ['cantaloupe', '🍈', '~45 cm'], 35: ['honeydew melon', '🍈', '~46 cm'], 36: ['pumpkin', '🎃', '~47 cm'],
  37: ['small watermelon', '🍉', '~48 cm'], 38: ['small watermelon', '🍉', '~49 cm'], 39: ['watermelon', '🍉', '~50 cm'],
  40: ['watermelon', '🍉', '~51 cm'], 41: ['watermelon', '🍉', '~51 cm'], 42: ['watermelon', '🍉', '~51 cm'],
}

export const WEEK_NOTES = {
  3: 'Conception happens around now — the two-week "head start" in pregnancy dating is counted before it.',
  4: 'Implantation. hCG starts rising — this is when a home test can turn positive.',
  5: 'The neural tube (future brain and spine) is forming. Folic acid matters most right now.',
  6: 'A tiny heart is starting to beat — sometimes visible on a transvaginal ultrasound this week or next.',
  7: 'Arm and leg buds appear. Brain growth is rapid.',
  8: 'Fingers and toes begin forming. Many first prenatal visits / dating ultrasounds land around weeks 8–10.',
  9: 'All the essential organs have started. Nausea often peaks around now — it usually eases by 12–14.',
  10: 'Officially a "fetus" now. NIPT blood screening can be drawn from 10 weeks.',
  11: 'Bones are starting to harden. The NT (nuchal translucency) scan window opens.',
  12: 'Reflexes are developing. Miscarriage risk has dropped substantially by the end of the first trimester.',
  13: 'Last week of the first trimester. Energy often starts coming back soon.',
  14: 'Second trimester. Many people feel noticeably better this stretch.',
  15: 'Baby can sense light through the skin. Legs are getting longer than the arms.',
  16: 'Facial muscles are working. Some feel first flutters (more often in a second pregnancy).',
  17: 'Fat stores begin forming. {M:their} center of gravity is shifting.',
  18: 'Baby may hear sounds now — talking to the bump counts. Anatomy scan window opens (18–22).',
  19: 'Vernix (a protective coating) forms on the skin.',
  20: 'Halfway. The anatomy scan checks organs, growth and placenta position.',
  21: 'Movements become more coordinated — kicks you may feel from outside soon.',
  22: 'Eyebrows and eyelids are formed.',
  23: 'Hearing is sharper. Partners can often feel kicks by now.',
  24: 'Lungs are developing surfactant. Glucose screening window opens (24–28).',
  25: 'Baby responds to familiar voices.',
  26: 'Eyes begin to open.',
  27: 'Last week of the second trimester. Tdap vaccine window (27–36) begins.',
  28: 'Third trimester. Start paying attention to daily movement patterns.',
  29: 'Muscles and lungs keep maturing. Baby is gaining weight fast.',
  30: 'Brain is growing quickly. {M:they} may feel short of breath as the uterus rises.',
  31: 'All five senses are working.',
  32: 'Practicing breathing movements. Most babies are head-down by 32–36 weeks.',
  33: 'Bones are hardening, except the skull, which stays flexible for birth.',
  34: 'Central nervous system is maturing.',
  35: 'Kidneys fully developed. Pack the hospital bag if you haven\'t.',
  36: 'Group B strep swab usually happens 36–37 weeks.',
  37: '"Early term." Install the car seat and know the route to the hospital.',
  38: 'Baby is shedding the lanugo (fine hair).',
  39: '"Full term." Lots of waiting from here.',
  40: 'Due date week. Only about 1 in 20 babies arrive on the actual date.',
  41: '"Late term." Your provider will talk about monitoring and induction options.',
}

// ── Week by week: the body side (baby side is WEEK_NOTES) ───────────────────
// [what's common in the body this week, one thing for the partner this week]
// General patterns for a typical pregnancy; everyone's timing differs.
export const WEEKS = {
  4: ['A missed period, maybe light spotting from implantation, mild cramps and tiredness. Many feel nothing yet.', 'Start a shared note of questions for the first OB visit.'],
  5: ['Tiredness, sore or fuller breasts, needing to pee more, and mood swings. Nausea can start any day now.', 'Take over cooking smells and the trash, before nausea makes them unbearable.'],
  6: ['Nausea often starts around now (any time of day, not just mornings), along with bloating and exhaustion.', 'Keep plain crackers and water by the bed for the mornings.'],
  7: ['Nausea and food aversions can ramp up. Smells get stronger. Extra saliva is common too.', 'Ask what sounds OK to eat today, and go get it.'],
  8: ['Peak tiredness for many. The uterus is about the size of an orange; mild cramps and bloating are common.', 'Go to the first prenatal visit together if you can, and bring the question list.'],
  9: ['Nausea often peaks this week. Headaches, constipation and moodiness are common.', 'Handle dinner and dishes completely this week.'],
  10: ['Visible veins, round ligament twinges, and clothes getting snug around the waist.', 'Help {m:them} find comfortable, stretchy clothes. Small wins count.'],
  11: ['Nausea may start easing for some. Hair and nails can grow faster; heartburn may appear.', 'Plan a low-key evening: {m:their} pick of food and show.'],
  12: ['The uterus starts rising above the pelvic bone. Peeing often may ease a little.', 'Talk about when and how you want to share the news.'],
  13: ['End of the first trimester. Energy often begins to come back; nausea fades for many.', 'Celebrate making it through the first trimester together.'],
  14: ['More energy and appetite. A small bump may show. A stuffy nose and bleeding gums are common.', 'Use the extra energy: take a walk together a few times this week.'],
  15: ['Round ligament pain (sharp twinges low on the sides), nosebleeds, and a growing appetite.', 'Remind {m:them} to stand up and turn over slowly. Offer a hand.'],
  16: ['Some feel the first flutters (more often by 18–22 weeks in a first pregnancy). Skin may glow, or break out.', 'Ask about movement each evening; it will be your turn to feel kicks soon.'],
  17: ['The center of gravity shifts. Backaches, heartburn and vivid dreams are common.', 'Get a body pillow for better side sleeping.'],
  18: ['Flutters more likely now. Dizziness can happen when standing up fast. Feet may swell a little.', 'Talk or read to the bump: baby can start hearing sounds.'],
  19: ['Hip and lower back aches; skin changes like a dark line on the belly (linea nigra) are common.', 'Book the anatomy scan together if it isn\'t already on the calendar.'],
  20: ['Halfway. The top of the uterus is around the belly button. Movements are getting stronger.', 'Mark the halfway point with something small, like a photo or a letter to the baby.'],
  21: ['Stronger kicks, possible leg cramps, and Braxton Hicks (practice contractions) may begin.', 'Learn how to help with a leg cramp: flex the foot, toes toward the shin.'],
  22: ['Stretch marks may appear. Swollen feet late in the day and an "outie" belly button are common.', 'Feet up at night, and a foot rub if {m:they}{m:\'s|\'re} up for it.'],
  23: ['Kicks may now be felt from the outside. Backaches and heartburn continue.', 'Put your hand on the bump in the evenings, when babies are often active.'],
  24: ['Glucose screening window opens (24–28 weeks). Itchy stretching skin and dry eyes are common.', 'Learn the preterm labor signs together.'],
  25: ['More heartburn, hemorrhoids or constipation, and trouble getting comfortable at night.', 'Keep Tums and water on {m:their} nightstand.'],
  26: ['Sleep gets harder. Braxton Hicks may be more frequent; they should ease with rest and water.', 'Start a childbirth class or put one on the calendar.'],
  27: ['Last week of the second trimester. Leg cramps, backaches and shortness of breath may increase.', 'Get the Tdap shot too if you\'re not up to date (it protects the baby).'],
  28: ['Third trimester. Visits get more frequent. Pay attention to the baby\'s daily movement pattern.', 'Learn what "fewer movements" means and when to call labor & delivery.'],
  29: ['Heartburn, constipation and needing to pee more as the baby grows. Tiredness returns.', 'Take over anything involving bending, lifting or long standing.'],
  30: ['Shortness of breath as the uterus pushes up; trouble sleeping and mood swings are common.', 'Prop pillows behind {m:their} back at night and keep the room cool.'],
  31: ['Leaky breasts (colostrum) may start. Braxton Hicks get more noticeable.', 'Pre-register at the hospital this week.'],
  32: ['Most babies are settling head-down. Swelling, backaches and frequent peeing continue.', 'Pick a pediatrician together.'],
  33: ['Pelvic pressure, clumsiness from the shifting center of gravity, and broken sleep.', 'Start packing the hospital bag, including your own.'],
  34: ['Tired again, blurry vision can happen (mention it), and swelling in the feet and ankles.', 'Install the car seat and get it checked for free.'],
  35: ['More pressure low in the pelvis and needing to pee constantly. Visits are often weekly soon.', 'Stock the freezer with easy meals.'],
  36: ['Group B strep swab (36–37 weeks). Baby may "drop," making breathing easier but peeing harder.', 'Save the labor & delivery number in your phone and know the route.'],
  37: ['Early term. Nesting urges, more discharge, and possibly losing the mucus plug.', 'Keep your phone charged and on loud from now on.'],
  38: ['Pelvic pressure and practice contractions. Real labor contractions get longer, stronger and closer.', 'Learn to time contractions: start of one to the start of the next.'],
  39: ['Full term. Waiting, discomfort and impatience are all normal. Rest while you can.', 'Plan easy, comforting things to do together while you wait.'],
  40: ['Due date week. Only about 1 in 20 babies arrive on the date. Keep tracking movements.', 'Be patient and steady: no "any news?" check-ins from family on your watch.'],
  41: ['Late term. Your provider will talk about monitoring and induction options.', 'Help {m:them} rest and keep the plans flexible.'],
  42: ['Most providers recommend delivery by now if labor hasn\'t started.', 'Stay close and keep everything ready to go.'],
}

// ── Stages: what changes as the pregnancy goes on ───────────────────────────
// Today shows the current stage to both of you: what's common right now and
// how to handle it, what to watch for, and what's coming next. `common` lists
// symptom ids (these go first in the check-in). General guidance only.
export const STAGES = [
  { from: 0, to: 8, title: 'Early first trimester', emoji: '🌱',
    common: ['fatigue', 'breasts', 'nausea', 'peeing', 'moody', 'bloating', 'cramping', 'aversions', 'spotting'],
    now: [
      ['Exhaustion', 'Progesterone hits hard now. Sleep when you can; it usually lifts in the second trimester.'],
      ['Nausea starting', 'Often begins around week 6. Eat small snacks every 2–3 hours, keep crackers by the bed, and try ginger. Ask the OB about vitamin B6.'],
      ['Sore breasts & peeing a lot', 'Both normal and early. A soft wireless bra helps.'],
      ['Mild cramps or light spotting', 'Common early on. Heavy bleeding, or strong pain on one side, needs a call right away.'],
    ],
    todo: ['Take a prenatal vitamin with folic acid every day', 'Book the first OB or midwife visit (usually 8–10 weeks)', 'No alcohol, hot tubs or saunas; keep caffeine under 200 mg'],
    partner: ['Take dinner and smelly chores (trash, litter, fridge) off {m:their} plate.', 'Expect {m:them} to be wiped out by evening. Plan quiet nights.', 'Learn the "When to call" list now, so you know when to act.'],
    next: 'Weeks 9–13: nausea usually peaks around week 9, then starts easing by 12–14.' },
  { from: 9, to: 13, title: 'Peak of the first trimester', emoji: '🌿',
    common: ['nausea', 'vomiting', 'fatigue', 'aversions', 'bloating', 'headache', 'moody', 'dizzy', 'peeing'],
    now: [
      ['Nausea at its worst', 'This is usually the hardest stretch. Small, bland, frequent snacks; sip fluids between meals, not with them.'],
      ['Food aversions', 'Eat what you can keep down. A prenatal vitamin covers the gaps for now.'],
      ['Constipation & bloating', 'Water, fiber and a short walk help. Ask the OB before laxatives.'],
      ['Headaches & dizziness', 'Usually hydration or blood sugar. Stand up slowly and keep snacks with you.'],
    ],
    watch: 'Can\'t keep fluids down for a day, very little urine, or losing weight: call the OB (this can be hyperemesis, and it\'s treatable).',
    todo: ['Decide on genetic screening (NIPT from 10 weeks, NT scan at 11–13)', 'Think about when you want to share the news', 'Dental check-ups are safe and a good idea'],
    partner: ['Keep {m:their} water bottle full and snacks within reach, all day.', 'Ask what sounds OK to eat, then go get it. Don\'t take aversions personally.', 'Go to the screening appointments together if you can.'],
    next: 'Weeks 14–20: for most, energy comes back and nausea fades.' },
  { from: 14, to: 20, title: 'Second trimester begins', emoji: '🌸',
    common: ['backpain', 'heartburn', 'congestion', 'headache', 'cramping', 'dizzy', 'cravings', 'peeing'],
    now: [
      ['Energy coming back', 'Many feel best in this stretch. A good time for exercise, planning and a babymoon.'],
      ['Round ligament pain', 'Sharp twinges low on the sides when moving or standing fast. Move slowly; a warm (not hot) compress helps.'],
      ['Stuffy nose & nosebleeds', 'Extra blood flow. Saline spray and a humidifier help.'],
      ['First flutters', 'Usually felt between 16 and 22 weeks, often later in a first pregnancy.'],
    ],
    todo: ['Anatomy scan (18–22 weeks)', 'Start sleeping on your side and get a body pillow', 'Shop for maternity clothes and a supportive bra'],
    partner: ['Plan something fun together while {m:their} energy is up.', 'Feel for kicks with {m:them} once {m:they} {m:feels|feel} movement.', 'Start the registry and the nursery list together.'],
    next: 'Weeks 21–27: the bump grows fast; backaches, heartburn and leg cramps often show up.' },
  { from: 21, to: 27, title: 'Middle of the second trimester', emoji: '🌷',
    common: ['backpain', 'heartburn', 'cramps_leg', 'swelling', 'insomnia', 'peeing', 'breath', 'movement'],
    now: [
      ['Backaches', 'The growing bump shifts posture. Supportive shoes, a pillow between the knees, and gentle stretches.'],
      ['Heartburn', 'Smaller meals, and no lying down for 2–3 hours after eating. Tums are generally fine.'],
      ['Leg cramps at night', 'Flex the foot (toes toward the shin) and stretch the calf before bed.'],
      ['Practice contractions', 'Braxton Hicks: irregular tightening that eases with rest and water.'],
    ],
    watch: 'Before 37 weeks: regular contractions, rhythmic back pain, fluid leaking, or fewer baby movements: call labor & delivery.',
    todo: ['Glucose test (24–28 weeks)', 'Learn baby\'s movement pattern', 'Sign up for a childbirth class and tour the hospital'],
    partner: ['Offer a back rub tonight, and do the lifting from now on.', 'Learn the preterm labor signs with {m:them}.', 'Book the childbirth class and put it in both calendars.'],
    next: 'Week 28: the third trimester. Visits get more frequent and sleep gets harder.' },
  { from: 28, to: 32, title: 'Third trimester begins', emoji: '🌼',
    common: ['breath', 'heartburn', 'backpain', 'insomnia', 'swelling', 'peeing', 'cramps_leg', 'movement'],
    now: [
      ['Short of breath', 'Baby is crowding the lungs. Slow down, sit upright, and prop up with pillows at night.'],
      ['Harder to sleep', 'Side sleeping with a pillow between the knees and behind the back.'],
      ['Swelling', 'Feet up and stay hydrated. Sudden swelling of the face or hands is different: call.'],
      ['Baby\'s movements', 'Know the usual pattern. Fewer movements or a change: call labor & delivery right away, without waiting.'],
    ],
    watch: 'Severe headache, vision changes, sudden swelling or upper-right belly pain: call now (possible preeclampsia).',
    todo: ['Tdap vaccine (27–36 weeks)', 'Rh shot around 28 weeks if Rh-negative', 'Pre-register at the hospital and pick a pediatrician'],
    partner: ['Take over anything that involves bending, lifting or long standing.', 'Know the preeclampsia warning signs and the route to the hospital.', 'Start on the car seat and the hospital bag.'],
    next: 'Weeks 33–36: getting ready. The GBS swab, the car seat install, and a packed bag.' },
  { from: 33, to: 36, title: 'Getting ready', emoji: '🧳',
    common: ['breath', 'insomnia', 'swelling', 'backpain', 'peeing', 'heartburn', 'discharge', 'movement'],
    now: [
      ['Pelvic pressure & waddling', 'Normal as baby moves lower. A support belt can help.'],
      ['Tired again', 'Sleep is choppy now. Nap when you can.'],
      ['More discharge', 'Normal. A gush or steady trickle of watery fluid means call (waters breaking).'],
      ['Nesting', 'Wanting to get everything ready is common. Pace it.'],
    ],
    watch: 'Fewer movements, bleeding, fluid leaking, or regular contractions: call labor & delivery.',
    todo: ['GBS swab (36–37 weeks)', 'Install the car seat and get it checked', 'Pack the hospital bag and write a birth plan', 'RSV vaccine at 32–36 weeks if it\'s RSV season'],
    partner: ['Install the car seat now and get it checked for free.', 'Pack your own bag too: charger, snacks, clothes, pillow.', 'Fill the freezer with easy meals.'],
    next: 'Week 37: full term. Learn the signs of labor and when your provider wants you to come in.' },
  { from: 37, to: 45, title: 'Full term', emoji: '👶',
    common: ['backpain', 'insomnia', 'peeing', 'discharge', 'swelling', 'cramping', 'movement', 'breath'],
    now: [
      ['Baby dropping', 'Easier breathing, more peeing and more pelvic pressure.'],
      ['Early labor signs', 'Losing the mucus plug, back pain, and contractions that get longer, stronger and closer together.'],
      ['When to go in', 'Follow your provider\'s rule (often contractions 5 minutes apart for an hour), or right away if waters break.'],
    ],
    watch: 'Go in right away for: waters breaking, bleeding, fewer movements, severe headache or vision changes.',
    todo: ['Keep the bag and car seat in the car', 'Know your provider\'s "when to come in" rule', 'After 40 weeks, your provider will talk about monitoring and induction'],
    partner: ['Keep your phone charged and on loud.', 'Learn to time contractions: from the start of one to the start of the next.', 'Your job in labor: advocate, snacks, water, and calm.'],
    next: 'Any day now. Warning signs still count for up to a year after birth.' },
]

// key: week to start showing it. role: who it matters to (both if omitted).
export const MILESTONES = [
  { week: 4, title: 'Positive test', detail: 'Start a prenatal vitamin with at least 400 mcg folic acid (and 150 mcg iodine) if {m:they} {m:has|have}n\'t already. Call the OB/midwife to book the first visit. Skip hot tubs and saunas from now on.' },
  { week: 5, title: 'Early things to tell the OB', detail: 'A past ectopic pregnancy, tubal surgery, or an IUD in place when {m:they} got pregnant: these mean an early ultrasound to check where the pregnancy is. Also mention any bleeding if {m:they} {m:knows|know} {m:they} {m:is|are} Rh-negative ({m:they} may need an Rh shot), and every medicine or supplement {m:they} {m:takes|take}.' },
  { week: 8, title: 'Flu & COVID shots', detail: 'A flu shot is recommended in any trimester during flu season. ACOG also recommends the COVID vaccine in pregnancy; the CDC currently leaves it to {m:them} and {m:their} provider to decide. Ask at the first visit.' },
  { week: 6, title: 'Heartbeat may be visible', detail: 'On a transvaginal ultrasound, cardiac activity is often seen 6–7 weeks. Not seeing it this early is common — dating can be off by days.' },
  { week: 8, title: 'First prenatal visit (typically 8–10 wks)', detail: 'Dating ultrasound, bloodwork (blood type, Rh factor, immunity, anemia), urine test. Bring your questions — you can go too.' },
  { week: 10, title: 'NIPT blood screen (from 10 wks)', detail: 'Cell-free DNA screening for common chromosomal conditions. Can also report fetal sex. It\'s a screen, not a diagnosis.' },
  { week: 11, title: 'NT scan (11–13 wks)', detail: 'Nuchal translucency ultrasound, sometimes combined with blood work as first-trimester screening.' },
  { week: 14, title: 'Second trimester begins', detail: 'Nausea and fatigue often ease. A good time to plan a babymoon or tell more people, if you\'ve been waiting.' },
  { week: 15, title: 'Quad screen option (15–22 wks)', detail: 'Some providers offer an AFP / quad screen, including for neural tube defects.' },
  { week: 18, title: 'Anatomy scan (18–22 wks)', detail: 'The big detailed ultrasound — organs, spine, heart, growth, placenta. Sex is usually visible if you want to know.' },
  { week: 24, title: 'Glucose test (24–28 wks)', detail: 'Screens for gestational diabetes. {M:they} {m:drinks|drink} a sugary drink and {m:has|have} blood drawn about an hour later.' },
  { week: 27, title: 'Tdap vaccine (27–36 wks)', detail: 'Recommended each pregnancy to pass whooping-cough protection to baby. Partners and close family should be up to date too.' },
  { week: 28, title: 'Third trimester + Rh shot if needed', detail: 'If {m:they} {m:is|are} Rh-negative, Rh immune globulin is usually given around 28 wks. Start learning baby\'s movement pattern.' },
  { week: 32, title: 'RSV vaccine (32–36 wks, in RSV season)', detail: 'One dose (Abrysvo) protects baby from RSV for the first months. It\'s given during RSV season, roughly September to January. If {m:their} 32–36 weeks fall outside that, or {m:they} {m:skips|skip} it, baby can get an RSV antibody shot after birth instead. Ask the OB which applies.' },
  { week: 32, title: 'Visits get more frequent', detail: 'Typically every 2 weeks from ~28–36, then weekly. Pre-register at the hospital, take a birth class.' },
  { week: 36, title: 'GBS swab (36–37 wks)', detail: 'Group B strep check. Bag packed, car seat installed, route planned.' },
  { week: 39, title: 'Full term', detail: 'Anytime now. Know the call-in rules your provider gave you (e.g. contraction timing, water breaking).' },
  { week: 40, title: 'Due date', detail: 'Most babies come within two weeks either side of it.' },
]

// ── Symptoms ────────────────────────────────────────────────────────────────
// meaning: what's usually behind it. help: what HE can do about it today.
// flag: when it stops being "normal pregnancy" and becomes a call. flagAt is the
// intensity (1 mild, 2 moderate, 3 strong) at which the flag shows automatically.
export const SYMPTOMS = [
  { id: 'nausea', label: 'Nausea', emoji: '🤢',
    meaning: 'Rising hCG and estrogen. Usually starts around week 6, peaks around 9, and eases by 12–14 for most. An empty stomach makes it worse.',
    help: ['Put plain crackers and water on {m:their} nightstand so {m:they} can eat before sitting up.', 'Take over cooking — food smells are a trigger. Cold foods smell less than hot.', 'Bring small snacks every 2–3 hours instead of big meals.', 'Ginger chews or ginger ale, and sour/lemon things help some people.', 'Ask {m:their} OB about vitamin B6 (with or without doxylamine) — it\'s the ACOG first-line option.'],
    flag: 'Can\'t keep any fluids down for 24 hours, very little urine, dizziness when standing, or losing weight — call the OB (possible hyperemesis gravidarum / dehydration).', flagAt: 3 },
  { id: 'vomiting', label: 'Vomiting', emoji: '🤮',
    meaning: 'Same cause as nausea. Some vomiting is common in the first trimester.',
    help: ['Small sips — electrolyte drinks, ice chips, popsicles — every 15 minutes.', 'Hold {m:their} hair, then quietly deal with the cleanup. No commentary.', 'Keep a bag and mints in the car.'],
    flag: 'Vomiting several times a day, can\'t keep fluids down, dark urine, or blood in vomit — call the OB today.', flagAt: 3 },
  { id: 'fatigue', label: 'Exhausted', emoji: '😴',
    meaning: 'Progesterone is a sedative, and {m:their} body is building a placenta. First-trimester exhaustion is real and normal.',
    help: ['Take a chore off {m:their} list entirely — not "help with" it, own it.', 'Protect a nap or an early bedtime. Handle the evening.', 'Cancel or postpone plans for {m:them} if {m:they} {m:is|are} running on empty.'],
    flag: 'Extreme fatigue with shortness of breath, racing heart or pale skin can point to anemia — mention it at the next visit, sooner if severe.', flagAt: 0 },
  { id: 'breasts', label: 'Sore breasts', emoji: '🫶',
    meaning: 'Hormones growing milk ducts. Very common early sign; often eases in the second trimester.',
    help: ['Gentle hugs — from behind or side, not chest-on.', 'Offer to pick up a soft, supportive wireless bra in a bigger size.'],
    flag: '', flagAt: 0 },
  { id: 'cramping', label: 'Cramping', emoji: '🌀',
    meaning: 'Mild, period-like cramping is common early on as the uterus grows and stretches. Can also happen after sex or with gas/constipation.',
    help: ['Heating pad on low (not hot) or a warm (not hot) bath.', 'Get {m:them} horizontal with water and a show. Let {m:them} rest.', 'Acetaminophen is the usual pain reliever in pregnancy — not ibuprofen. Check with the OB.'],
    flag: 'Severe pain on one side, shoulder-tip pain, dizziness or fainting — go to the ER or call 911 (possible ectopic pregnancy). Strong cramping or cramping with bleeding — call the OB now.', flagAt: 3 },
  { id: 'spotting', label: 'Spotting', emoji: '🩸',
    meaning: 'Light spotting (pink/brown, a few drops) is fairly common in early pregnancy — implantation, after sex, or after a pelvic exam.',
    help: ['Stay calm out loud — your tone sets {m:theirs}. Light spotting alone is often nothing.', 'Help {m:them} note color, amount and timing so {m:they} can tell the OB clearly.', 'Call the OB line together; they field this question constantly.'],
    flag: 'Bleeding like a period or heavier, clots, or bleeding with cramps or pain — call the OB right away. Soaking a pad an hour, or dizziness — ER.', flagAt: 2 },
  { id: 'bloating', label: 'Bloated / constipated', emoji: '🎈',
    meaning: 'Progesterone slows digestion; prenatal vitamins with iron add to it.',
    help: ['Keep {m:their} water bottle full — literally refill it.', 'Go for an easy walk together after dinner.', 'Stock fiber: oatmeal, berries, pears, prunes.'],
    flag: '', flagAt: 0 },
  { id: 'headache', label: 'Headache', emoji: '🤕',
    meaning: 'Hormone shifts, dehydration, low blood sugar, caffeine cut-back and poor sleep are the usual causes early on.',
    help: ['Water and a snack first — it\'s often one of those.', 'Dark, quiet room and a cool cloth on {m:their} forehead/neck.', 'Acetaminophen is generally the go-to in pregnancy. Avoid ibuprofen/aspirin unless the OB says otherwise.'],
    flag: 'A severe or "worst ever" headache, or headache with vision changes (spots, blurring), sudden swelling of face/hands, or upper-right belly pain — call the OB now. After 20 weeks this can be preeclampsia.', flagAt: 3 },
  { id: 'peeing', label: 'Peeing a lot', emoji: '🚽',
    meaning: 'Normal — blood volume rises and the uterus presses on the bladder.',
    help: ['Aisle seat at the movies, plan bathroom stops on drives.', 'Don\'t let {m:them} cut water to pee less — dehydration makes everything worse.'],
    flag: '', flagAt: 0 },
  { id: 'burning', label: 'Burning when peeing', emoji: '🔥',
    meaning: 'Burning, urgency, cloudy or bloody urine can mean a urinary tract infection. UTIs are more common in pregnancy and should always be treated.',
    help: ['Help {m:them} call the OB today — they can test urine and prescribe a pregnancy-safe antibiotic.', 'Keep water coming.', 'Don\'t wait it out — untreated UTIs in pregnancy can reach the kidneys.'],
    flag: 'Any burning or pain when peeing → call the OB today. Fever, chills, back/side pain or vomiting with it → same-day care (possible kidney infection).', flagAt: 1 },
  { id: 'moody', label: 'Moody / weepy', emoji: '🌦️',
    meaning: 'Hormonal shifts plus fatigue plus a huge life change. Mood swings are expected.',
    help: ['Listen without fixing. "That sounds hard" beats a solution.', 'Don\'t take a sharp moment personally — and don\'t keep score.', 'Ask: "Do you want comfort, distraction, or space?"'],
    flag: 'Sadness or hopelessness most days for 2+ weeks, losing interest in everything, or any thoughts of self-harm — tell the OB. The National Maternal Mental Health Hotline is free, 24/7, call or text: 1-833-TLC-MAMA (1-833-852-6262). In a crisis, call or text 988.', flagAt: 0 },
  { id: 'anxious', label: 'Anxious', emoji: '😟',
    meaning: 'Very common, especially in the first trimester before scans and milestones offer reassurance.',
    help: ['Mark the next appointment on the shared calendar so {m:they} can see the next checkpoint.', 'Make "worry time" — 10 minutes to talk about it, then a planned distraction.', 'Do the breathing exercise together (in the You tab).'],
    flag: 'Panic attacks, constant worry that stops sleep or eating, or intrusive thoughts — perinatal anxiety is common and treatable. Tell the OB, or call/text 1-833-TLC-MAMA (free, 24/7). Crisis: 988.', flagAt: 0 },
  { id: 'aversions', label: 'Food aversions', emoji: '🙅',
    meaning: 'Smell and taste sensitivity spikes with hormones. Former favorites can become intolerable overnight.',
    help: ['Eat the trigger foods away from {m:them}, or not at all for now.', 'Take the trash out daily, clean the fridge.', 'Ask what sounds OK right now and just go get it.'],
    flag: '', flagAt: 0 },
  { id: 'cravings', label: 'Cravings', emoji: '🍦',
    meaning: 'Common and mostly harmless. Craving non-food items (ice, clay, starch) can signal iron deficiency.',
    help: ['Go get the thing. Within reason, this is a love language.', 'Keep a healthy version stocked alongside.'],
    flag: 'Cravings for non-food items (dirt, chalk, laundry starch) — mention it to the OB (pica / anemia check).', flagAt: 0 },
  { id: 'heartburn', label: 'Heartburn', emoji: '🔥',
    meaning: 'Progesterone relaxes the valve at the top of the stomach; later, the uterus pushes up.',
    help: ['Smaller meals, and no lying down for 2–3 hours after eating.', 'Prop up the head of the bed or add a wedge pillow.', 'Tums (calcium carbonate) are generally considered fine — keep some around.'],
    flag: '', flagAt: 0 },
  { id: 'dizzy', label: 'Dizzy', emoji: '💫',
    meaning: 'Blood vessels relax and blood pressure dips; low blood sugar adds to it.',
    help: ['Get {m:them} seated or lying on {m:their} left side.', 'Snack with protein + water.', 'Stand up slowly — remind {m:them}, gently.'],
    flag: 'Fainting, dizziness with bleeding or belly pain, or chest pain/shortness of breath — seek care now.', flagAt: 3 },
  { id: 'insomnia', label: 'Can\'t sleep', emoji: '🌙',
    meaning: 'Peeing at night, nausea, heartburn, anxiety and hormones all disrupt sleep.',
    help: ['Screens off, room cool and dark, a wind-down routine together.', 'Get a body pillow or extra pillows between knees.', 'Ask the OB before any sleep aid — some (like doxylamine) are commonly okayed.'],
    flag: '', flagAt: 0 },
  { id: 'congestion', label: 'Stuffy nose', emoji: '🤧',
    meaning: '"Pregnancy rhinitis" — extra blood flow swells nasal tissue. Common and harmless.',
    help: ['Saline spray and a humidifier in the bedroom.', 'Extra pillow to elevate {m:their} head.'],
    flag: '', flagAt: 0 },
  { id: 'backpain', label: 'Back / hip pain', emoji: '🦴',
    meaning: 'Relaxin loosens ligaments and posture shifts as the bump grows.',
    help: ['Lower back massage or a warm (not hot) compress.', 'Get {m:them} supportive shoes and do the lifting.'],
    flag: 'Rhythmic lower back pain that comes and goes, especially before 37 weeks — call (can be preterm labor).', flagAt: 3 },
  { id: 'swelling', label: 'Swelling', emoji: '🦶',
    meaning: 'Some ankle/foot swelling is normal, especially later and in heat.',
    help: ['Feet up, cool water soak, and get {m:them} off {m:their} feet.', 'Help {m:them} stay hydrated — it actually reduces swelling.'],
    flag: 'Sudden swelling of the face or hands, or swelling with headache/vision changes — call the OB now (preeclampsia). One leg swollen, red and painful — seek care (blood clot).', flagAt: 3 },
  { id: 'fever', label: 'Fever / chills', emoji: '🌡️',
    meaning: 'Fever in pregnancy should be treated and checked — it\'s not one to sit through.',
    help: ['Take {m:their} temperature and log it below.', 'Acetaminophen is generally the fever reducer used in pregnancy — check dose with the OB. Bringing a fever down matters: high fever early in pregnancy is linked to neural tube problems.', 'Call the OB line.'],
    flag: 'Temperature of 100.4°F (38°C) or higher — call the OB.', flagAt: 1 },
  { id: 'discharge', label: 'Discharge change', emoji: '💧',
    meaning: 'More thin, milky, mild-smelling discharge is normal in pregnancy.',
    help: ['Breathable cotton underwear, no douching or scented products.'],
    flag: 'Itching, burning, strong odor, green/gray color — call (infection). A gush or constant trickle of watery fluid — call now (possible water breaking).', flagAt: 2 },
  { id: 'cramps_leg', label: 'Leg cramps', emoji: '🦵',
    meaning: 'Common, especially at night in the second and third trimesters.',
    help: ['Flex {m:their} foot (toes toward shin) and massage the calf.', 'Stretches before bed, water during the day.'],
    flag: '', flagAt: 0 },
  { id: 'breath', label: 'Short of breath', emoji: '😮‍💨',
    meaning: 'Mild breathlessness is common as progesterone changes breathing and later as the uterus pushes up.',
    help: ['Slow down the pace on walks. Let {m:them} set it.', 'Sit upright, open a window.'],
    flag: 'Sudden or severe shortness of breath, chest pain, or coughing blood — call 911.', flagAt: 3 },
  { id: 'movement', label: 'Less baby movement', emoji: '👶',
    meaning: 'Once {m:they} {m:knows|know} baby\'s pattern (from about 24 weeks), fewer movements or a change in the pattern needs checking the same day. Don\'t wait until tomorrow, and don\'t wait to count kicks first.',
    help: ['Help {m:them} call labor & delivery right away. Checking takes a short visit, and they would much rather see {m:them}.', 'Skip the tricks people suggest to "wake the baby" (cold drinks, sugar, poking). They can delay getting checked.', 'Drive {m:them} in, or call 911 if {m:they} {m:has|have} no movement at all and can\'t get there quickly.'],
    flag: 'Fewer movements than normal or a change in the pattern (from 24 weeks) — call labor & delivery now. No movement at all — go in now.', flagAt: 1 },
]

export const RED_FLAGS = [
  ['Call 911 or go to the ER', [
    'Heavy bleeding (soaking a pad in an hour) or passing large clots',
    'Severe pain on one side of the belly, especially with shoulder-tip pain, dizziness or fainting (early pregnancy: possible ectopic pregnancy)',
    'Severe chest pain, trouble breathing, or coughing up blood',
    'Fainting or seizure',
    'Thoughts of harming {m:themselves} or the baby (or call/text 988, or the maternal mental health hotline 1-833-TLC-MAMA)',
  ]],
  ['Call the OB / labor & delivery now', [
    'Any vaginal bleeding beyond light spotting',
    'Belly pain or cramping that is strong, one-sided, or doesn\'t go away',
    'Fever of 100.4°F / 38°C or higher',
    'Severe headache, vision changes, or sudden swelling of face or hands',
    'Racing or pounding heartbeat',
    'Overwhelming tiredness that isn\'t normal for {m:them}',
    'Can\'t keep fluids down for 24 hours',
    'Burning or pain when peeing (possible UTI)',
    'Fluid leaking or gushing from the vagina',
    'Any fall, car accident or blow to the belly, even if {m:they} {m:feels|feel} fine',
    'From 24 weeks: baby moving less than usual, or a change in the pattern',
    'Third trimester: severe itching, especially palms and soles (a liver condition that needs checking)',
    'Before 37 weeks: regular contractions or rhythmic back pain',
    'One leg red, swollen and painful',
    'After birth, for up to a year: any of these warning signs still count. Blood pressure problems can start days or weeks after delivery.',
  ]],
  ['Mention at the next visit', [
    'Ongoing heartburn, constipation, or trouble sleeping',
    'Feeling low or anxious most days',
    'Cravings for non-food items like ice or chalk',
    'New medications or supplements you\'re thinking of taking',
  ]],
]

// ── Medications ─────────────────────────────────────────────────────────────
// tier: ok = generally considered OK in pregnancy at standard doses;
// ask = depends on dose / trimester / her history — ask first;
// avoid = generally avoided unless her OB specifically prescribes it.
export const MEDS = [
  { name: 'Acetaminophen', aka: 'Tylenol', use: 'Pain, fever, headache', tier: 'ok',
    note: 'The pain reliever and fever reducer ACOG recommends in pregnancy. Use the lowest dose that works for the shortest time. In 2025 the FDA started a label change about a possible link between long-term use and neurodevelopmental conditions. ACOG and other medical groups say the evidence doesn\'t show it causes harm, and that untreated fever and pain carry risks too. Talk with the OB about regular use. Watch for double-dosing: NyQuil, DayQuil, TheraFlu, Excedrin and many cold and flu products also contain acetaminophen, so don\'t take them with Tylenol, and stay under the daily maximum on the label (ask the OB for {m:their} limit).' },
  { name: 'Ibuprofen', aka: 'Advil, Motrin', use: 'Pain, inflammation', tier: 'avoid',
    note: 'An NSAID. Generally avoided in pregnancy unless the OB okays it. The FDA warns against NSAIDs from 20 weeks on (they can cause baby kidney problems and low amniotic fluid), and they\'re especially risky after 30 weeks. Use acetaminophen instead.' },
  { name: 'Naproxen', aka: 'Aleve', use: 'Pain, inflammation', tier: 'avoid',
    note: 'NSAID — same warnings as ibuprofen. Avoid unless prescribed.' },
  { name: 'Aspirin', aka: 'Bayer, Excedrin (aspirin + acetaminophen + about 65 mg caffeine a tablet)', use: 'Pain', tier: 'avoid',
    note: 'Don\'t use for pain. Low-dose (81 mg) aspirin is sometimes prescribed from ~12 weeks to lower preeclampsia risk, but only when {m:their} OB recommends it.' },
  { name: 'Doxylamine + vitamin B6', aka: 'Unisom SleepTabs + B6, Diclegis, Bonjesta', use: 'Morning sickness', tier: 'ok',
    note: 'ACOG\'s first-line treatment for pregnancy nausea. B6 alone is the usual first step. Causes drowsiness. Get the dose from the OB.' },
  { name: 'Vitamin B6', aka: 'Pyridoxine', use: 'Nausea', tier: 'ok',
    note: 'A common first step for nausea. Ask the OB for the dose (often 10–25 mg, 3–4 times a day).' },
  { name: 'Ginger', aka: 'Ginger chews, capsules, tea', use: 'Nausea', tier: 'ok',
    note: 'Ginger in food or tea is fine. Ask before taking capsules or high-dose supplements.' },
  { name: 'Diphenhydramine', aka: 'Benadryl, ZzzQuil, Unisom SleepGels', use: 'Allergies, occasional sleep', tier: 'ok',
    note: 'Widely used in pregnancy and generally considered OK for occasional use. Causes drowsiness. Ask the OB before using it regularly for sleep.' },
  { name: 'Doxylamine (for sleep)', aka: 'Unisom SleepTabs', use: 'Occasional sleep', tier: 'ok',
    note: 'Generally considered OK and commonly recommended. Ask the OB before using it night after night.' },
  { name: 'Melatonin', aka: '', use: 'Sleep', tier: 'ask',
    note: 'There\'s little research on melatonin in pregnancy, and supplement doses vary a lot. Ask first.' },
  { name: 'Loratadine', aka: 'Claritin', use: 'Allergies', tier: 'ok',
    note: 'Among the antihistamines studied most in pregnancy, and generally considered OK. Choose plain Claritin, not Claritin-D, which adds a decongestant.' },
  { name: 'Cetirizine', aka: 'Zyrtec', use: 'Allergies', tier: 'ok',
    note: 'Generally considered OK. Avoid the "-D" versions with decongestant.' },
  { name: 'Fexofenadine', aka: 'Allegra', use: 'Allergies', tier: 'ask',
    note: 'Less pregnancy data than loratadine or cetirizine. Ask first.' },
  { name: 'Pseudoephedrine', aka: 'Sudafed (behind the counter), any "-D" product', use: 'Congestion', tier: 'avoid',
    note: 'Usually avoided in the first trimester and with high blood pressure. Later in pregnancy, use only if the OB okays it. Try saline spray and a humidifier first.' },
  { name: 'Phenylephrine', aka: 'Sudafed PE, many multi-symptom cold meds', use: 'Congestion', tier: 'avoid',
    note: 'Not recommended in pregnancy, and an FDA advisory panel found it doesn\'t work when taken by mouth. Skip it.' },
  { name: 'Saline nasal spray / rinse', aka: 'Ocean, NeilMed', use: 'Congestion', tier: 'ok',
    note: 'Drug-free and safe. Use distilled or boiled water for rinses.' },
  { name: 'Oxymetazoline', aka: 'Afrin', use: 'Congestion', tier: 'ask',
    note: 'Sometimes okayed for 2–3 days at most. Ask first, and never use it longer (it causes rebound congestion).' },
  { name: 'Dextromethorphan', aka: 'Delsym (single-ingredient)', use: 'Cough', tier: 'ok',
    note: 'Generally considered OK on its own. Check the label: dextromethorphan should be the only active ingredient, alcohol-free. Robitussin DM and many other "DM" products also contain guaifenesin (see below), which is one to ask about first.' },
  { name: 'Guaifenesin', aka: 'Mucinex, Robitussin (plain)', use: 'Chest congestion', tier: 'ask',
    note: 'Often avoided in the first trimester. Ask first.' },
  { name: 'Multi-symptom cold/flu', aka: 'NyQuil, DayQuil, TheraFlu', use: 'Cold & flu', tier: 'ask',
    note: 'Often contain phenylephrine, alcohol, or several drugs at once, and most also contain acetaminophen (never take them with Tylenol). Treating one symptom at a time with single-ingredient products is safer. Ask first.' },
  { name: 'Calcium carbonate', aka: 'Tums, Rolaids', use: 'Heartburn', tier: 'ok',
    note: 'Generally considered OK. Don\'t go over the daily max on the label.' },
  { name: 'Famotidine', aka: 'Pepcid', use: 'Heartburn', tier: 'ok',
    note: 'Generally considered OK when antacids aren\'t enough. Let the OB know {m:they} {m:is|are} taking it.' },
  { name: 'Omeprazole', aka: 'Prilosec', use: 'Heartburn', tier: 'ask',
    note: 'Often used in pregnancy, but ask first.' },
  { name: 'Bismuth subsalicylate', aka: 'Pepto-Bismol, Kaopectate', use: 'Upset stomach, diarrhea', tier: 'avoid',
    note: 'Contains a salicylate (related to aspirin). Avoid in pregnancy.' },
  { name: 'Loperamide', aka: 'Imodium', use: 'Diarrhea', tier: 'ask',
    note: 'Ask first. Drink fluids, and call the OB if diarrhea is severe or lasts more than a day or two.' },
  { name: 'Polyethylene glycol', aka: 'MiraLAX', use: 'Constipation', tier: 'ok',
    note: 'Generally considered OK, and very little gets absorbed into the body. Try fiber and water first.' },
  { name: 'Docusate', aka: 'Colace', use: 'Constipation (stool softener)', tier: 'ok',
    note: 'Generally considered OK.' },
  { name: 'Psyllium / fiber', aka: 'Metamucil, Benefiber', use: 'Constipation', tier: 'ok',
    note: 'Fine to use. Take it with plenty of water.' },
  { name: 'Senna', aka: 'Senokot', use: 'Constipation', tier: 'ask',
    note: 'Occasional use is often okayed. Ask before using it regularly.' },
  { name: 'Hydrocortisone cream 1%', aka: 'Cortizone-10', use: 'Itchy skin, rashes', tier: 'ok',
    note: 'Short-term use on small areas is generally considered OK.' },
  { name: 'Miconazole / clotrimazole', aka: 'Monistat, Gyne-Lotrimin', use: 'Yeast infection', tier: 'ok',
    note: 'Vaginal antifungal creams are the preferred treatment in pregnancy. Call the OB first to confirm it\'s actually yeast.' },
  { name: 'Fluconazole (oral)', aka: 'Diflucan', use: 'Yeast infection', tier: 'avoid',
    note: 'Generally avoided in pregnancy, especially at higher or repeated doses. Use a vaginal cream instead.' },
  { name: 'Retinoids', aka: 'Retin-A, tretinoin, isotretinoin (Accutane), retinol', use: 'Acne, skin', tier: 'avoid',
    note: 'Isotretinoin causes birth defects and must not be used. Topical retinoids and retinol are also usually stopped during pregnancy.' },
  { name: 'Benzoyl peroxide / azelaic acid', aka: 'Acne washes', use: 'Acne', tier: 'ok',
    note: 'Topical use is generally considered OK.' },
  { name: 'Prenatal vitamin', aka: 'With folic acid', use: 'Every day', tier: 'ok',
    note: 'Recommended. At least 400 mcg of folic acid a day, ideally starting before conception, helps prevent neural tube defects. Some people need much more (up to 4 mg) on the OB\'s advice: a past pregnancy with a neural tube defect, certain seizure medicines, or diabetes. Check that it has 150 mcg of iodine; not all prenatals do.' },
  { name: 'Fish oil / DHA', aka: 'Omega-3', use: 'Supplement', tier: 'ok',
    note: 'Purified fish oil or DHA is generally considered OK, and many prenatals include it. Avoid cod liver oil, which has too much vitamin A.' },
  { name: 'Herbal supplements & teas', aka: 'Teas, tinctures, "natural" remedies', use: 'Various', tier: 'ask',
    note: 'Supplements aren\'t regulated like drugs, and some herbs aren\'t safe in pregnancy. Ask about each one.' },
  { name: 'Caffeine', aka: 'Coffee, energy drinks', use: '', tier: 'ask',
    note: 'ACOG says under 200 mg a day is fine, which is about one 12 oz home-brewed coffee. Coffee-shop coffee is often much stronger: one 16 oz cup can be over 300 mg. Skip energy drinks and caffeine pills.' },
  { name: 'Cannabis / CBD', aka: 'Marijuana, THC, CBD oil, edibles', use: '', tier: 'avoid',
    note: 'ACOG recommends avoiding it in pregnancy, including for nausea.' },
  { name: 'Alcohol', aka: 'Beer, wine, spirits', use: '', tier: 'avoid',
    note: 'There is no known safe amount in pregnancy.' },
  { name: 'Nicotine / vaping', aka: 'Cigarettes, vapes, nicotine gum/patch', use: '', tier: 'avoid',
    note: 'Quitting is one of the best things for the baby. Ask the OB about support to quit. Nicotine replacement is sometimes used under their guidance.' },
  { name: 'Prescription meds {m:they} already {m:takes|take}', aka: 'Antidepressants, thyroid, seizure, BP meds…', use: '', tier: 'ask',
    note: 'Don\'t stop a prescription suddenly. Many need to continue for {m:their} health and the baby\'s. Call the prescriber or OB soon to review them.' },
]

// ── Food safety ─────────────────────────────────────────────────────────────
export const FOODS = [
  { name: 'Deli meat / cold cuts', aka: 'lunch meat, sliced turkey, ham, roast beef slices, bologna, boars head', tier: 'ask', note: 'Listeria risk. OK if heated until steaming hot (165°F), like in a toasted sandwich.' },
  { name: 'Hot dogs', aka: 'franks, corn dog, ballpark', tier: 'ask', note: 'Heat until steaming all the way through. Never eat them cold from the package.' },
  { name: 'Sushi (raw fish)', tier: 'avoid', note: 'Skip raw fish for now. Cooked rolls (shrimp tempura, eel, California rolls with cooked crab) are fine.' },
  { name: 'Cooked salmon, shrimp, cod, tilapia', tier: 'ok', note: 'Low-mercury fish are recommended: 2–3 servings a week. Great source of omega-3s.' },
  { name: 'Canned light tuna', tier: 'ok', note: 'Low mercury. Counts toward the 2–3 servings a week.' },
  { name: 'Albacore (white) tuna, tuna steak', tier: 'ask', note: 'More mercury. Limit to 1 serving a week.' },
  { name: 'Shark, swordfish, king mackerel, marlin, orange roughy, bigeye tuna, Gulf tilefish', tier: 'avoid', note: 'Highest mercury. Avoid these.' },
  { name: 'Refrigerated smoked seafood (lox, nova)', tier: 'avoid', note: 'Listeria risk. OK if cooked into a hot dish, and canned or shelf-stable versions are fine.' },
  { name: 'Raw oysters, clams, mussels', tier: 'avoid', note: 'Only eat shellfish fully cooked.' },
  { name: 'Unpasteurized (raw) milk & cheese', tier: 'avoid', note: 'Listeria risk. Check the label for "pasteurized."' },
  { name: 'Queso fresco, queso blanco, panela', tier: 'ask', note: 'Has been linked to listeria outbreaks even when labeled pasteurized. Safest cooked until hot.' },
  { name: 'Hard cheese (cheddar, parmesan, swiss)', tier: 'ok', note: 'Fine.' },
  { name: 'Eggs — runny yolk, over-easy, poached', aka: 'soft boiled, sunny side up, eggs benedict, runny egg', tier: 'avoid', note: 'Salmonella risk. Cook until the yolk is firm, unless the eggs are labeled pasteurized.' },
  { name: 'Homemade Caesar, aioli, mayo, hollandaise', tier: 'avoid', note: 'Often made with raw egg. Store-bought mayo is pasteurized and fine.' },
  { name: 'Raw cookie dough / cake batter', tier: 'avoid', note: 'Raw egg and raw flour. Only eat it baked.' },
  { name: 'Rare or medium-rare meat', tier: 'avoid', note: 'Cook beef, pork, and lamb steaks to 145°F with a rest, ground meat to 160°F, and poultry to 165°F (toxoplasmosis, E. coli).' },
  { name: 'Pâté / meat spreads (refrigerated)', tier: 'avoid', note: 'Listeria risk. Canned or shelf-stable versions are OK.' },
  { name: 'Liver', tier: 'ask', note: 'Very high in vitamin A. Eat it rarely, if at all.' },
  { name: 'Raw sprouts (alfalfa, bean, clover)', tier: 'avoid', note: 'Bacteria hide in the seeds. OK when cooked thoroughly.' },
  { name: 'Unwashed fruits & veggies', tier: 'ask', note: 'Rinse all produce well under running water (toxoplasmosis, listeria).' },
  { name: 'Cut melon left out', tier: 'avoid', note: 'Listeria risk. Toss cut melon left out more than 4 hours. Refrigerated, it keeps up to a week.' },
  { name: 'Unpasteurized juice / cider', tier: 'avoid', note: 'Choose pasteurized versions.' },
  { name: 'Coffee / tea / soda', aka: 'espresso, latte, cappuccino, cold brew, iced coffee, starbucks, dunkin', tier: 'ok', note: 'Fine while total caffeine stays under 200 mg a day (about a 12 oz home-brewed coffee; a large coffee-shop cup can be over the limit on its own).' },
  { name: 'Energy drinks', aka: 'red bull, monster, celsius, bang, prime energy, 5 hour energy', tier: 'avoid', note: 'High caffeine plus other stimulants. Skip them.' },
  { name: 'Alcohol (incl. kombucha with alcohol)', tier: 'avoid', note: 'There is no known safe amount. Non-alcoholic versions are generally fine. Some N/A beers still contain up to 0.5% alcohol.' },
  { name: 'Herbal tea', tier: 'ask', note: 'Ginger and peppermint are commonly considered OK in normal amounts. Ask about others, and about large amounts.' },
  { name: 'Leftovers', tier: 'ok', note: 'Refrigerate within 2 hours, eat within 3–4 days, and reheat until steaming.' },
  { name: 'Peanuts & common allergens', tier: 'ok', note: 'No need to avoid them unless {m:they} {m:is|are} allergic. Avoiding them doesn\'t prevent allergies in the baby.' },
  { name: 'Hot tubs, saunas, very hot baths (not a food, but…)', tier: 'avoid', note: 'Getting very hot (a core temperature over about 101°F) early in pregnancy is linked to neural tube defects. Skip hot tubs and saunas. Warm baths and showers are fine.' },
  { name: 'Cat litter (not a food, but…)', tier: 'avoid', note: 'Toxoplasmosis risk. You take over the litter box now. If {m:they} must do it, gloves and handwashing.' },

  // ── Meat & poultry
  { name: 'Chicken & turkey (cooked through)', aka: 'grilled chicken, roast turkey, wings, nuggets, thanksgiving', tier: 'ok', note: 'Great protein. Cook to 165°F, with no pink and clear juices.' },
  { name: 'Burgers & ground beef', aka: 'hamburger, cheeseburger, meatloaf, taco meat, ground turkey', tier: 'ok', note: 'OK cooked to 160°F all the way through, with no pink in the middle. Order burgers well done.' },
  { name: 'Steak, pork chops, lamb (cooked)', aka: 'ribeye, sirloin, pork tenderloin, roast beef, brisket', tier: 'ok', note: 'Cook to 145°F and let it rest 3 minutes. Use a meat thermometer; skip rare and pink-in-the-middle.' },
  { name: 'Bacon', aka: 'turkey bacon', tier: 'ok', note: 'Fine cooked until crispy and hot.' },
  { name: 'Sausage', aka: 'bratwurst, breakfast sausage, italian sausage, kielbasa', tier: 'ok', note: 'Cook fresh sausage to 160°F (165°F for poultry sausage) until no pink remains.' },
  { name: 'Salami, pepperoni, prosciutto, chorizo (cured)', aka: 'charcuterie, soppressata, cured meat, coppa, pastrami', tier: 'ask', note: 'Cured meats aren\'t cooked, so they carry listeria and toxoplasmosis risk. Eat them heated until steaming, like pepperoni on a hot pizza.' },
  { name: 'Pepperoni or sausage pizza', aka: 'pizza', tier: 'ok', note: 'Fine hot out of the oven. Reheat leftovers until steaming.' },
  { name: 'Rotisserie chicken', aka: 'costco chicken', tier: 'ok', note: 'Fine hot. Refrigerate within 2 hours and reheat leftovers until steaming.' },
  { name: 'Deli salads (chicken, tuna, egg, ham salad)', aka: 'store made salad, deli counter, potato salad', tier: 'ask', note: 'Store-made deli salads have been linked to listeria. Homemade, eaten fresh and kept cold, is fine.' },
  { name: 'Beef jerky', aka: 'jerky, meat sticks', tier: 'ask', note: 'Sealed, shelf-stable packaged jerky is generally considered lower risk. Skip homemade or deli-counter jerky.' },
  { name: 'Meatballs', aka: 'meatball sub', tier: 'ok', note: 'Fine cooked through (160°F, or 165°F if made with poultry).' },
  { name: 'Duck', aka: 'peking duck', tier: 'ok', note: 'Cook to 165°F. Skip the pink, rare-sliced style.' },
  { name: 'Venison & wild game', aka: 'deer, elk, bison', tier: 'ask', note: 'Cook thoroughly (ground to 160°F). Wild game is more likely to carry toxoplasmosis, so never rare.' },
  { name: 'Steak tartare, carpaccio', aka: 'raw beef, kibbeh nayeh', tier: 'avoid', note: 'Raw meat. Skip until after the baby.' },
  { name: 'Gyro, shawarma, kebab', aka: 'doner, al pastor', tier: 'ok', note: 'Fine when sliced hot off the spit or grill.' },
  { name: 'Hot pot, pho, ramen with raw meat', aka: 'shabu shabu, rare beef pho, tai', tier: 'ask', note: 'Ask for the meat well done, or cook it fully in the boiling broth. The rare slices in pho often aren\'t cooked through.' },

  // ── Fish & seafood
  { name: 'Canned salmon & sardines', aka: 'anchovies, kippers, herring', tier: 'ok', note: 'Low mercury and full of omega-3s. Great choice.' },
  { name: 'Low-mercury fish (best choices)', aka: 'catfish, pollock, haddock, trout, flounder, sole, whitefish, perch, crawfish, crayfish', tier: 'ok', note: 'FDA "best choices": 2–3 servings a week, cooked to 145°F (flaky and opaque).' },
  { name: 'Mahi-mahi, halibut, snapper, grouper', aka: 'sea bass, chilean sea bass, striped bass, yellowfin tuna, ahi, rockfish, bluefish, monkfish', tier: 'ask', note: 'FDA "good choices": a bit more mercury. Limit to 1 serving a week, cooked through. Ahi or yellowfin must be cooked, not seared rare.' },
  { name: 'Shrimp, crab, lobster, scallops (cooked)', aka: 'prawns, crab legs, crab cakes, lobster roll, imitation crab, surimi', tier: 'ok', note: 'Low mercury. Fine cooked until firm and opaque (shrimp pink, scallops milky white).' },
  { name: 'Fish sticks & fried fish', aka: 'fish and chips, fish tacos, filet o fish', tier: 'ok', note: 'Usually low-mercury fish (cod, pollock). Fine cooked hot.' },
  { name: 'Ceviche', aka: 'aguachile, leche de tigre', tier: 'avoid', note: 'Lime juice doesn\'t kill bacteria or parasites the way heat does. Skip it.' },
  { name: 'Poke & sashimi', aka: 'poke bowl, raw tuna, raw salmon, crudo, tuna tartare', tier: 'avoid', note: 'Raw fish. Ask for a cooked protein in your bowl instead.' },
  { name: 'Cooked sushi rolls', aka: 'california roll, shrimp tempura roll, eel, unagi, cooked roll, vegetable roll, cucumber roll, avocado roll', tier: 'ok', note: 'Fine: imitation or cooked crab, tempura shrimp, eel and veggie rolls are all cooked. Make sure nothing raw is mixed in.' },
  { name: 'Fried oysters, clams, mussels', aka: 'steamed mussels, clam chowder, linguine with clams', tier: 'ok', note: 'Fine when fully cooked: shells open when steamed, and the meat is firm.' },
  { name: 'Fish you or friends caught', aka: 'lake fish, river fish, local fish', tier: 'ask', note: 'Check your state\'s fish advisory for that lake or river. If there isn\'t one, eat at most 1 serving a week and no other fish that week.' },

  // ── Dairy & eggs
  { name: 'Milk (pasteurized)', aka: 'whole milk, skim, 2%, lactose free milk, chocolate milk', tier: 'ok', note: 'Fine and a good source of calcium. Almost all store milk in the US is pasteurized.' },
  { name: 'Yogurt & Greek yogurt', aka: 'kefir, skyr, yoghurt, parfait', tier: 'ok', note: 'Fine when made from pasteurized milk (nearly all store brands).' },
  { name: 'Ice cream', aka: 'gelato, frozen yogurt, froyo, milkshake', tier: 'ok', note: 'Store-bought ice cream is fine. Soft-serve machines have occasionally been linked to listeria, so a well-run shop matters.' },
  { name: 'Mozzarella, burrata, ricotta, cream cheese, cottage cheese', aka: 'fresh mozzarella, string cheese, mascarpone, paneer', tier: 'ok', note: 'Fine when pasteurized, which nearly all US store brands are. Check the label at farmers markets.' },
  { name: 'Brie, camembert, feta, goat cheese, blue cheese', aka: 'gorgonzola, roquefort, chevre, stilton, soft cheese', tier: 'ask', note: 'OK if the label says pasteurized and it\'s been kept cold. Avoid unpasteurized or if you can\'t tell. Baked until bubbling hot is always fine.' },
  { name: 'Halloumi', aka: 'grilled cheese', tier: 'ok', note: 'Fine when pasteurized and cooked.' },
  { name: 'Butter, sour cream, whipped cream', aka: 'ghee, half and half, heavy cream, creamer', tier: 'ok', note: 'Fine from pasteurized milk.' },
  { name: 'Scrambled or hard-boiled eggs', aka: 'omelet, omelette, fried egg over hard, egg salad, frittata, quiche', tier: 'ok', note: 'Fine cooked until the whites and yolks are firm.' },
  { name: 'Eggnog', aka: 'egg nog', tier: 'ask', note: 'Store-bought pasteurized and alcohol-free is fine. Skip homemade (raw egg) and spiked versions.' },
  { name: 'Tiramisu, mousse, homemade meringue', aka: 'chocolate mousse, raw egg dessert, zabaglione', tier: 'avoid', note: 'Often made with raw eggs, and tiramisu usually has alcohol and coffee too. Fine if made with pasteurized eggs and no alcohol.' },

  // ── Fruits & veggies
  { name: 'Fresh fruit', aka: 'apples, bananas, oranges, berries, strawberries, blueberries, grapes, peaches, pears, mango, kiwi, cherries', tier: 'ok', note: 'Great for {m:them}. Rinse well under running water first, even if you\'re peeling it.' },
  { name: 'Pineapple', aka: 'pineapple juice', tier: 'ok', note: 'Fine in normal amounts. The myth that it causes miscarriage or labor isn\'t supported.' },
  { name: 'Papaya', aka: 'green papaya, papaya salad, som tam', tier: 'ask', note: 'Ripe papaya is fine. Unripe or green papaya (as in papaya salad) contains latex that may trigger contractions, so skip that one.' },
  { name: 'Melon', aka: 'watermelon, cantaloupe, honeydew', tier: 'ok', note: 'Scrub the rind before cutting, eat or refrigerate right away, and toss cut melon left out over 4 hours (listeria).' },
  { name: 'Salad & leafy greens', aka: 'lettuce, spinach, kale, bagged salad, arugula, romaine, spring mix', tier: 'ok', note: 'Great source of folate. Rinse well, keep cold, and use bagged greens before the date.' },
  { name: 'Vegetables (cooked or raw)', aka: 'broccoli, carrots, peppers, tomatoes, cucumber, corn, peas, green beans, zucchini, cauliflower, sweet potato, potatoes', tier: 'ok', note: 'Fine and encouraged. Wash raw veggies well.' },
  { name: 'Frozen vegetables', aka: 'frozen corn, frozen peas, frozen broccoli', tier: 'ask', note: 'Cook them as the package says. Frozen veggies have been linked to listeria when eaten uncooked, like thawed in a salad or smoothie.' },
  { name: 'Frozen fruit & smoothies', aka: 'smoothie, acai bowl, smoothie bowl', tier: 'ok', note: 'Fine. Use pasteurized juice, milk and yogurt in smoothies, and skip raw-milk or unpasteurized juice add-ins.' },
  { name: 'Avocado & guacamole', aka: 'avocado toast, guac', tier: 'ok', note: 'Fine and full of healthy fats. Homemade or fresh guacamole kept cold.' },
  { name: 'Mushrooms', aka: 'portobello, shiitake', tier: 'ok', note: 'Store-bought mushrooms are fine, ideally cooked. Never eat foraged wild mushrooms.' },
  { name: 'Garlic, onions, herbs & spices', aka: 'cinnamon, turmeric, basil, cilantro, parsley, oregano, spicy, hot sauce, chili, jalapeno, sriracha', tier: 'ok', note: 'Fine in food amounts. Spicy food is safe for the baby but may worsen heartburn. Large-dose herb supplements are a different story: ask first.' },
  { name: 'Dried fruit & dates', aka: 'raisins, prunes, figs, medjool dates', tier: 'ok', note: 'Fine, and prunes help with constipation.' },
  { name: 'Seaweed', aka: 'nori, seaweed snacks, kelp, hijiki', tier: 'ask', note: 'Nori and seaweed snacks are fine in moderation. Skip hijiki (high arsenic) and kelp supplements (too much iodine).' },
  { name: 'Black licorice', aka: 'licorice root, licorice candy', tier: 'ask', note: 'Real licorice (glycyrrhizin) in large amounts has been linked to preterm birth. A little red "licorice" candy is fine; skip lots of the real black kind.' },
  { name: 'Fresh juice from a juice bar or farmers market', aka: 'fresh squeezed juice, cold pressed juice, apple cider, orange juice', tier: 'ask', note: 'Often unpasteurized. Choose bottled juice labeled pasteurized, or juice made fresh at home from washed fruit.' },

  // ── Grains, snacks & sweets
  { name: 'Bread, pasta, rice, cereal', aka: 'oatmeal, bagel, toast, noodles, tortillas, quinoa, crackers', tier: 'ok', note: 'Fine. Fortified cereals add folic acid and iron.' },
  { name: 'Leftover rice', aka: 'fried rice, takeout rice', tier: 'ok', note: 'Refrigerate within an hour or two and reheat until steaming. Rice left out can grow bacteria that heat doesn\'t destroy.' },
  { name: 'Peanut butter & nuts', aka: 'almonds, cashews, walnuts, almond butter, trail mix, peanuts', tier: 'ok', note: 'Fine unless {m:they} {m:is|are} allergic. Good protein and healthy fats.' },
  { name: 'Chocolate', aka: 'dark chocolate, hot chocolate, candy, cocoa', tier: 'ok', note: 'Fine. It has a little caffeine (dark chocolate more), which counts toward 200 mg a day.' },
  { name: 'Chips, popcorn, pretzels', aka: 'crisps, fries, french fries', tier: 'ok', note: 'Fine as snacks. Salty snacks can make swelling worse later on.' },
  { name: 'Honey', aka: 'raw honey, manuka', tier: 'ok', note: 'Fine for {m:them}, even raw. Honey is only off-limits for babies under 1 year old.' },
  { name: 'Artificial sweeteners', aka: 'aspartame, sucralose, splenda, stevia, monk fruit, diet soda, equal', tier: 'ok', note: 'The FDA considers common sweeteners safe in moderation. Water is still the better default drink.' },
  { name: 'Baked goods & pastries', aka: 'cake, cookies, cupcakes, muffins, donuts, croissant, pie, cheesecake', tier: 'ok', note: 'Fine once baked. Cream-filled pastries should be kept refrigerated.' },
  { name: 'Hummus & dips', aka: 'tzatziki, salsa, queso dip, spinach dip', tier: 'ok', note: 'Store-bought, kept cold, is fine. Hot cheese dips should be steaming. Skip dips that sat out at a party for hours.' },
  { name: 'Fast food', aka: 'mcdonalds, chick fil a, burger king, taco bell, wendys, chipotle', tier: 'ok', note: 'Fine when served hot and freshly made. Ask for burgers well done.' },
  { name: 'Subway & deli sandwiches', aka: 'sub, hoagie, turkey sandwich, ham sandwich, italian sub, cold cuts sandwich', tier: 'ask', note: 'Ask for the meat toasted until steaming hot (listeria). Hot subs like meatball or chicken are fine.' },
  { name: 'Buffets & salad bars', aka: 'potluck, catering, party food', tier: 'ask', note: 'Food sitting out is the risk. Hot food should be steaming, cold food cold, and skip anything that\'s been out more than 2 hours.' },
  { name: 'MSG', aka: 'monosodium glutamate, chinese food', tier: 'ok', note: 'Considered safe in normal food amounts.' },

  // ── Drinks
  { name: 'Decaf coffee', aka: 'decaf', tier: 'ok', note: 'Fine. It still has a little caffeine (around 2–15 mg a cup).' },
  { name: 'Green tea & matcha', aka: 'black tea, iced tea, chai, matcha latte', tier: 'ok', note: 'Fine, but they count toward 200 mg of caffeine a day. Matcha can have as much as a coffee.' },
  { name: 'Soda', aka: 'coke, pepsi, mountain dew, dr pepper, sprite, ginger ale', tier: 'ok', note: 'Caffeinated sodas count toward the 200 mg limit (about 35–55 mg a can). Ginger ale can help nausea.' },
  { name: 'Sports & electrolyte drinks', aka: 'gatorade, liquid iv, pedialyte, powerade, coconut water', tier: 'ok', note: 'Fine, and useful when vomiting or dehydrated. Watch the sugar.' },
  { name: 'Sparkling water', aka: 'la croix, seltzer, club soda, bubly', tier: 'ok', note: 'Fine, and a good swap for soda.' },
  { name: 'Kombucha', aka: 'booch', tier: 'ask', note: 'Often unpasteurized, has some caffeine, and contains a little alcohol. Most providers suggest skipping it.' },
  { name: 'Non-alcoholic beer & wine', aka: 'na beer, mocktail, alcohol free beer, athletic brewing', tier: 'ask', note: 'Many "non-alcoholic" drinks still have up to 0.5% alcohol. Look for 0.0%, or stick to mocktails.' },
  { name: 'Wine, beer, liquor, cocktails', aka: 'alcohol, vodka, tequila, whiskey, rum, champagne, margarita, seltzer, white claw', tier: 'avoid', note: 'There\'s no known safe amount of alcohol in pregnancy, so skip it completely.' },
  { name: 'Tonic water', aka: 'quinine', tier: 'ask', note: 'Small amounts in a mocktail are generally fine. Avoid large amounts (quinine).' },
  { name: 'Raspberry leaf, chamomile & other herbal teas', aka: 'red raspberry leaf, chamomile tea, hibiscus, rooibos, dandelion, nettle', tier: 'ask', note: 'Some herbal teas are fine in normal amounts (peppermint, ginger, rooibos). Ask about raspberry leaf, hibiscus and large amounts of chamomile.' },
  { name: 'Peppermint & ginger tea', aka: 'mint tea', tier: 'ok', note: 'Commonly considered OK in normal amounts, and both can ease nausea.' },
]

// When a search finds nothing on the list, these rules still answer it.
// [regex on the normalized query, tier, what applies]
export const FOOD_RULES = [
  ['\\b(raw|rare|tartare|carpaccio|ceviche|crudo|sashimi|poke|undercooked|pink|medium rare|bloody)\\b', 'avoid', 'Raw or undercooked meat, fish, shellfish or eggs: skip them until after the baby. Cook meat to a safe temperature (poultry 165°F, ground 160°F, steaks 145°F) and fish until opaque.'],
  ['\\b(unpasteurized|raw milk|farm|farmers market|homemade cheese)\\b', 'avoid', 'Unpasteurized milk, cheese and juice can carry listeria. Look for "pasteurized" on the label.'],
  ['\\b(smoked|lox|nova|gravlax|kipper)\\b', 'ask', 'Refrigerated smoked fish carries listeria risk. It\'s fine cooked into a hot dish, and canned or shelf-stable versions are OK.'],
  ['\\b(deli|lunch meat|cold cut|salami|ham|turkey slice|bologna|mortadella|cured|charcuterie|hot dog|frank)\\b', 'ask', 'Deli and cured meats: eat them heated until steaming hot (listeria).'],
  ['\\b(cheese|queso)\\b', 'ask', 'Cheese: hard cheeses are fine. Soft cheeses are fine if pasteurized. Queso fresco-style fresh cheeses are safest cooked until hot.'],
  ['\\b(fish|tuna|bass|mackerel|swordfish|shark|marlin|tilefish|roughy|trout|salmon|cod|snapper|grouper|halibut|seafood|shellfish)\\b', 'ask', 'Fish: choose low-mercury fish (salmon, shrimp, cod, pollock, canned light tuna) 2–3 times a week. Avoid shark, swordfish, king mackerel, marlin, orange roughy, bigeye tuna and Gulf tilefish. Always cook it through.'],
  ['\\b(egg|eggs|mayo|aioli|hollandaise|meringue|custard|caesar)\\b', 'ask', 'Eggs: cook until yolks are firm. Homemade sauces and desserts may use raw egg; store-bought versions are pasteurized.'],
  ['\\b(sprout|sprouts|microgreen)\\b', 'avoid', 'Raw sprouts carry bacteria in the seed. Fine only when cooked thoroughly.'],
  ['\\b(wine|beer|vodka|rum|gin|tequila|whiskey|bourbon|liquor|liqueur|cocktail|sake|soju|cider|spiked|alcohol|margarita|mimosa)\\b', 'avoid', 'Alcohol: there\'s no known safe amount in pregnancy. Mocktails and 0.0% drinks are fine.'],
  ['\\b(coffee|espresso|latte|cappuccino|cold brew|energy|red bull|monster|celsius|caffeine|tea|matcha|yerba)\\b', 'ask', 'Caffeine: keep the total under 200 mg a day (about one 12 oz home-brewed coffee). Skip energy drinks.'],
  ['\\b(herb|herbal|supplement|tincture|essential oil|ashwagandha|cbd|kratom|detox|cleanse|tea)\\b', 'ask', 'Herbs and supplements aren\'t regulated like medicine, and some aren\'t safe in pregnancy. Ask the OB or pharmacist about each one.'],
  ['\\b(liver|pate|foie)\\b', 'ask', 'Liver and liver pâté are very high in vitamin A. Eat them rarely, if at all; refrigerated pâté also carries listeria.'],
  ['\\b(leftover|left out|sat out|room temperature|overnight)\\b', 'ask', 'Food left out more than 2 hours (1 hour if it\'s hot outside) should be thrown away. Reheat leftovers until steaming and eat within 3–4 days.'],
  ['\\b(foraged|wild mushroom|wild plant)', 'avoid', 'Never eat foraged wild mushrooms or plants. Store-bought is fine.'],
]
// The general rules, shown when nothing matched at all.
export const FOOD_BASICS = [
  'Raw or undercooked meat, fish, shellfish and eggs',
  'Unpasteurized milk, cheese and juice (check the label)',
  'Deli meat, hot dogs and refrigerated smoked fish, unless heated until steaming',
  'High-mercury fish: shark, swordfish, king mackerel, marlin, orange roughy, bigeye tuna, Gulf tilefish',
  'Alcohol (none), and caffeine over 200 mg a day',
  'Raw sprouts, and food left out more than 2 hours',
]

// ── Dad / partner space ─────────────────────────────────────────────────────
export const DAD_FEELINGS = [
  { id: 'anxious', label: 'Anxious', emoji: '😰', cope: ['Box breathing: in 4, hold 4, out 4, hold 4, for 2 minutes (tap "Breathe" below).', 'Write the worry down, then write the next concrete action. If there isn\'t one, it\'s not yours to carry tonight.', 'Name 3 things you can control today. Do one.'] },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊', cope: ['Shrink the horizon. What\'s the one thing for this week? Ignore the rest.', 'Make a shared to-do list so it isn\'t all living in your head.', 'Telling {m:them} "I\'m a little overwhelmed too" is OK. It brings you closer.'] },
  { id: 'money', label: 'Money stress', emoji: '💸', cope: ['Call your insurance and ask what prenatal care and delivery cost you out of pocket. Real numbers beat imagined ones.', 'Make a rough baby budget together. Lots of gear can be borrowed or bought used, except car seats.', 'Check your employer\'s parental leave and FMLA now, not in month 8.'] },
  { id: 'worried', label: 'Worried about {m:them} / baby', emoji: '🫣', cope: ['First-trimester worry is nearly universal. Risk drops a lot once a heartbeat is seen, and again after week 12.', 'Learn the red-flag list (Safe? tab → When to call). Knowing exactly when to act takes the edge off vague worry.', 'Go to the appointments. Hearing it from the provider beats Googling at 2am.'] },
  { id: 'leftout', label: 'Left out / disconnected', emoji: '🫥', cope: ['Read this week\'s baby update together tonight.', 'Ask {m:them} one curious question a day about how it feels. Not to fix anything, just to know.', 'Put the next appointment in your calendar and show up.'] },
  { id: 'irritable', label: 'Short-fused', emoji: '😤', cope: ['HALT check: are you Hungry, Angry, Lonely, or Tired? Fix the physical one first.', 'Take a 20-minute walk alone before a hard conversation. Say "I need a minute," not nothing.', 'Workout, gym, a run: burn it off somewhere that isn\'t at home.'] },
  { id: 'tired', label: 'Running on empty', emoji: '🪫', cope: ['You can\'t pour from an empty cup. Protect your 7 hours.', 'Say yes when people offer help, now and especially later.', 'Trade off. A night where you\'re both off duty, with takeout and no chores.'] },
  { id: 'scared', label: 'Scared to be a parent', emoji: '🫨', cope: ['Nobody knows how before they start. You learn it by doing, like every other skill you have.', 'Talk to a friend who became a parent a year or two before you. Ask what surprised them.', 'Write a letter to the baby. It turns fear into intention.'] },
  { id: 'excited', label: 'Excited', emoji: '🤩', cope: ['Channel it: start a journal, pick a project (crib, nursery shelves), plan the reveal.', 'Tell {m:them} you\'re excited, specifically. It means more than you think.'] },
  { id: 'good', label: 'Steady / good', emoji: '🙂', cope: ['Bank it. Do one thing today that makes tomorrow easier for both of you.'] },
]

export const DAD_TRUTHS = [
  'Ask "What would help most right now: X or Y?" Two options are easier for {m:them} than "What do you need?"',
  'Don\'t say "You look tired." Say "Go lie down, I\'ve got dinner."',
  'You\'re on trash, litter box, fridge cleanouts, and gas-station runs for the foreseeable future.',
  'Fixing isn\'t always the move. Sometimes the job is just to be in the room.',
  '{M:their} mood isn\'t a referendum on you. Don\'t keep score, don\'t take the bait.',
  'Go to the appointments, especially the first scan. You\'ll understand more and {m:they}\'ll feel less alone.',
  'Learn the red-flag list once, so you can be the calm one when something comes up.',
  'Don\'t compare {m:their} pregnancy to anyone else\'s, out loud or in your head.',
  'Your feelings matter too. Process the heavy stuff with a friend or counselor, not only with {m:them}.',
  'Small, consistent beats grand. A refilled water bottle every day beats one big gesture.',
  'Take a photo of {m:them} every month. {M:they} won\'t ask, but {m:they}\'ll be glad later.',
  'Expecting dads and partners get perinatal depression too, around 1 in 10. If you\'re low for weeks, say something.',
]

export const DAD_TRIMESTER = {
  1: ['Your main jobs: food on demand, chores off {m:their} plate, appointments in your calendar.', '{M:they} might not want to tell people yet. Follow {m:their} lead on who knows and when.', 'Read up on the first-trimester red flags once, then stop Googling.'],
  2: ['{M:they} may get an energy rebound. Plan a trip or day dates now.', 'Start the big projects: nursery, car seat research, leave planning.', 'Feel for kicks from about 20–24 weeks. Hand on the belly, be patient.'],
  3: ['Pack the hospital bag, install the car seat, practice the drive.', 'Learn labor basics so you can advocate: how to time contractions, when to go in.', 'Prep freezer meals and line up help for the first two weeks home.'],
}

// ── Good-morning tips (first open of the day) ───────────────────────────────
export const MORNING_MOM = [
  'Eat a few plain crackers before you even sit up. An empty stomach makes morning nausea worse.',
  'Prenatal vitamin with breakfast today. If it upsets your stomach, try it at night instead.',
  'Fill a big water bottle now and keep it with you. Dehydration makes nausea, headaches and dizziness worse.',
  'Stand up slowly this morning. Blood pressure dips are normal right now.',
  'Plan small snacks every 2–3 hours today rather than three big meals.',
  'Pick one thing to let go of today. Rest is part of the work.',
  'Get 10 minutes of daylight or a short walk. It helps energy and sleep tonight.',
  'Anything worrying you? Write it down for the next OB visit, or call the nurse line. That\'s what it\'s for.',
  'Keep caffeine under 200 mg today: about one 12 oz home-brewed coffee.',
  'Check in when you get a minute. It tells your partner exactly how to help today.',
]
export const MORNING_DAD = [
  'Ask {m:them} one question before you leave: "What would make today easier?" Then do it.',
  'Put water and a snack where {m:they}\'ll be today. Small and steady beats big gestures.',
  'Take one chore completely off {m:their} plate today. Own it, start to finish.',
  'Text {m:them} midday. "Thinking of you, need anything?" lands bigger than you\'d think.',
  'Plan tonight\'s dinner now so {m:they} {m:does|do}n\'t have to think about it (and no strong smells).',
  'Check in with yourself today too. Stress shows up as a short fuse later.',
  'Is the next appointment in your calendar? Put it there now.',
  'Trash, litter box, anything smelly: still your department.',
  'Notice one thing {m:they} {m:is|are} handling well and tell {m:them} tonight.',
  'Get your own sleep, food and a workout in. A steady you is the best support.',
]

export const ENCOURAGE_MOM = [
  'Growing a whole person is exhausting work, and you\'re doing it.',
  'Whatever you got done today is enough.',
  'Rest is part of the work.',
  'You don\'t have to love every minute to love this baby.',
  'Your body knows how to do this. You\'re allowed to just let it.',
  'It\'s okay to ask for help. Asking is a strength.',
  'One day at a time, sometimes one hour.',
  'Feeling unsure is normal. You\'re learning as you go, like everyone does.',
  'Your feelings, all of them, make sense.',
  'You\'re already taking care of your baby by taking care of you.',
  'Crackers for dinner still counts as feeding two.',
  'Today\'s check-in is a gift to both of you. Thank you for sharing it.',
]

export const ENCOURAGE_DAD = [
  'Showing up consistently matters more than knowing everything.',
  'Being steady is the biggest thing you can give {m:them} right now.',
  'You\'re allowed to feel scared and excited in the same breath.',
  'Every refilled water bottle counts. Seriously.',
  'Taking care of yourself is part of taking care of them.',
  'You don\'t have to have it all figured out. You have to keep showing up.',
  'The fact that you\'re reading this means you\'re already the kind of parent who tries.',
  'Ask, listen, act. That\'s the whole playbook today.',
  'Your worry is a sign of how much you care. Now point it at one useful thing.',
  'Breathe. You\'ve got more time to learn than it feels like.',
]

export const MOOD = [
  { v: 1, emoji: '😣', label: 'Rough' },
  { v: 2, emoji: '😕', label: 'Meh' },
  { v: 3, emoji: '😐', label: 'Okay' },
  { v: 4, emoji: '🙂', label: 'Good' },
  { v: 5, emoji: '😄', label: 'Great' },
]

export const ENERGY = [
  { v: 1, emoji: '🪫', label: 'Empty' },
  { v: 2, emoji: '🔋', label: 'Low' },
  { v: 3, emoji: '🔋', label: 'Some' },
  { v: 4, emoji: '⚡', label: 'Good' },
  { v: 5, emoji: '⚡', label: 'Full' },
]

// When she logs a mood or energy level, these are added to his game plan.
export const MOOD_PLAN = {
  1: ['{M:they} {m:is|are} having a rough day. Clear tonight\'s plans and make the evening low-key.', 'Ask: "Do you want to talk about it, or do you want distraction?"'],
  2: ['A meh day. A small surprise ({m:their} favorite snack, a note) goes a long way.'],
  3: [],
  4: ['{M:they} {m:is|are} feeling good. Ride the wave with a walk or a small outing together.'],
  5: ['Great day! Tell {m:them} what you love about how {m:they} {m:is|are} handling all this.'],
}
export const ENERGY_PLAN = {
  1: ['{M:their} battery is empty. Take dinner and the dishes off the table entirely.'],
  2: ['Low energy: handle one errand {m:they}\'d planned to do.'],
}

export const BREATH_STEPS = [['Breathe in', 4], ['Hold', 4], ['Breathe out', 4], ['Hold', 4]]

// ── Supporting him ──────────────────────────────────────────────────────────
// When he logs how he's doing (and doesn't keep it private), her "Him" view
// turns it into a few concrete ways to support him back.
export const SUPPORT_HIM = {
  anxious: ['Ask {p:them} what\'s on {p:their} mind. {P:they} may not bring it up on {p:their} own.', 'Share how you\'re actually doing. Hearing it from you calms {p:them} more than Google does.'],
  overwhelmed: ['Split the to-do list together so it isn\'t all living in {p:their} head.', 'Pick one thing for this week and let the rest wait.'],
  money: ['Sit down together for 20 minutes with real numbers: insurance, leave, a rough baby budget.', 'Remind {p:them} a lot of gear can be borrowed or bought used.'],
  worried: ['Tell {p:them} how you\'re feeling today, specifically. Uncertainty is what feeds {p:their} worry.', 'Bring {p:them} to the next appointment so {p:they} {p:hears|hear} it from the provider.'],
  leftout: ['Invite {p:them} to the next appointment, or tell {p:them} one thing you felt today.', 'Read this week\'s baby update together tonight.'],
  irritable: ['Give {p:them} 20 minutes to decompress before any big conversations.', 'Check whether {p:they} {p:has|have} eaten. Seriously.'],
  tired: ['Trade off a night: both off duty, takeout, no chores.', 'Let {p:them} sleep in once this week if you can.'],
  scared: ['Tell {p:them} one thing {p:they} {p:is|are} already doing well as a parent-to-be.', 'Remind {p:them} nobody knows how before they start. You\'re learning together.'],
  excited: ['Share it with {p:them}: a baby-names night, or plan how you\'ll tell people.', 'Tell {p:them} what you\'re looking forward to.'],
  good: ['Thank {p:them} for something specific {p:they} did this week.'],
}
export const SUPPORT_HIM_STRESS = {
  4: ['{P:they} {p:is|are} carrying a lot right now. A hug and "How are you, really?" go a long way.'],
  5: ['{P:they} {p:is|are} maxed out. Ask what one thing you could take off {p:their} plate, and keep tonight low-key.'],
}

// ── "She logged X today. Try Y, or maybe Z." ────────────────────────────────
// Two short, specific ideas per symptom for his alert. `call` is added when the
// symptom is at or past its flag level so the alert never buries a red flag.
export const NUDGE = {
  nausea: { try: ['putting crackers and water by the bed', 'taking over cooking tonight so {m:they} {m:avoids|avoid} the smells'] },
  vomiting: { try: ['bringing small sips of an electrolyte drink every 15 minutes', 'handling dinner and cleanup tonight'], call: 'If {m:they} can\'t keep fluids down for 24 hours, call the OB.' },
  fatigue: { try: ['taking dinner and dishes completely off {m:their} plate', 'handling the evening so {m:they} can go to bed early'] },
  breasts: { try: ['gentle hugs from the side or behind', 'picking up a soft wireless bra for {m:them}'] },
  cramping: { try: ['a heating pad on low and a show on the couch', 'bringing {m:them} water and letting {m:them} rest'], call: 'Strong or one-sided pain, or pain with bleeding: call the OB now.' },
  spotting: { try: ['staying calm and helping {m:them} note the color and amount', 'calling the OB line together'], call: 'More than light spotting: call the OB now.' },
  bloating: { try: ['an easy walk together after dinner', 'stocking up on fiber and keeping {m:their} water bottle full'] },
  headache: { try: ['bringing water and a snack first', 'a dark, quiet room and a cool cloth'], call: 'A severe headache or one with vision changes: call the OB now.' },
  peeing: { try: ['planning bathroom stops when you go out', 'keeping {m:their} water bottle full anyway'] },
  burning: { try: ['helping {m:them} call the OB today, since UTIs need treatment', 'keeping water coming'], call: 'Burning when peeing needs a call to the OB today.' },
  moody: { try: ['listening without trying to fix anything', 'asking {m:them}: comfort, distraction, or space?'] },
  anxious: { try: ['asking what\'s on {m:their} mind and just listening', 'doing the 2-minute breathing reset together'] },
  aversions: { try: ['asking what sounds OK and going to get it', 'taking out the trash and clearing smelly food'] },
  cravings: { try: ['going and getting the thing', 'stocking a healthier version too'] },
  heartburn: { try: ['a smaller dinner and no lying down right after', 'propping up {m:their} side of the bed'] },
  dizzy: { try: ['keeping a snack within reach', 'reminding {m:them} to stand up slowly'], call: 'Fainting, or dizziness with bleeding or pain: seek care now.' },
  insomnia: { try: ['a screens-off wind-down together tonight', 'an extra pillow between {m:their} knees'] },
  congestion: { try: ['running a humidifier in the bedroom tonight', 'grabbing some saline spray'] },
  backpain: { try: ['a lower-back rub tonight', 'doing all the lifting'] },
  swelling: { try: ['getting {m:their} feet up', 'keeping water coming'], call: 'Sudden swelling of the face or hands: call the OB now.' },
  fever: { try: ['bringing water and rechecking {m:their} temperature in an hour', 'helping {m:them} call the OB'], call: 'A fever of 100.4°F or higher needs a call to the OB.' },
  discharge: { try: ['picking up breathable cotton underwear', 'helping {m:them} call the OB if it itches or smells strong'], call: 'A gush or steady trickle of fluid: call the OB now.' },
  cramps_leg: { try: ['a calf massage before bed', 'gently flexing {m:their} foot toes-up when a cramp hits'] },
  breath: { try: ['slowing the pace on walks', 'opening a window and letting {m:them} sit upright'], call: 'Sudden or severe shortness of breath, or chest pain: call 911.' },
  movement: { try: ['calling labor & delivery together right now', 'driving {m:them} in to get checked'], call: 'Less movement than usual: call labor & delivery now, without waiting to count kicks.' },
}
export const MOOD_NUDGE = {
  1: { feel: 'having a rough day', try: ['clearing tonight\'s plans and keeping things low-key', 'asking {m:them}: comfort, distraction, or space?'] },
  2: { feel: 'feeling meh today', try: ['a small surprise, like {m:their} favorite snack', 'a note telling {m:them} {m:they} {m:is|are} doing great'] },
  3: { feel: 'feeling okay today', try: ['one thing off {m:their} list without being asked', 'a refill of {m:their} water bottle'] },
  4: { feel: 'feeling good today', try: ['a short walk together', 'telling {m:them} what you love about how {m:they} {m:is|are} handling this'] },
  5: { feel: 'feeling great today', try: ['riding the wave with a small outing together', 'telling {m:them} what you love about how {m:they} {m:is|are} handling this'] },
}
// How a symptom reads inside a sentence: "{M:they} logged nausea & exhaustion today"
export const SYMPTOM_NOUN = {
  nausea: 'nausea', vomiting: 'vomiting', fatigue: 'exhaustion', breasts: 'sore breasts', cramping: 'cramping',
  spotting: 'spotting', bloating: 'bloating', headache: 'a headache', peeing: 'frequent peeing',
  burning: 'burning when peeing', moody: 'mood swings', anxious: 'anxiety', aversions: 'food aversions',
  cravings: 'cravings', heartburn: 'heartburn', dizzy: 'dizziness', insomnia: 'trouble sleeping',
  congestion: 'a stuffy nose', backpain: 'back pain', swelling: 'swelling', fever: 'a fever',
  discharge: 'a discharge change', cramps_leg: 'leg cramps', breath: 'shortness of breath', movement: 'less baby movement',
}

// ── Registry ────────────────────────────────────────────────────────────────
export const REG_CATS = [
  ['gear', '🚗 Gear & travel'], ['nursery', '🛏️ Nursery & sleep'], ['feeding', '🍼 Feeding'],
  ['diapering', '🧷 Diapering'], ['clothing', '👕 Clothing'], ['bath', '🛁 Bath & health'],
  ['mom', '🤍 For {m:term}'], ['other', '📦 Other'],
]
// Suggestions: kinds of items, not specific products (the app can't read live
// store ratings, so it never names a "best" product). [id, cat, name, why,
// what to look for, words that mean it's already on the list, recall agency]
// recall: 'nhtsa' (car seats are recalled by NHTSA) | 'cpsc' (other baby gear) | ''
export const REG_GUIDE = [
  ['carseat', 'gear', 'Infant car seat', 'You can\'t leave the hospital without one.', 'Best bought new. A used seat is only OK if you know its whole history: never in a crash, not expired, all parts and the manual. Check the "do not use after" date on the label. Keep baby rear-facing as long as the seat allows, and no puffy coats under the straps. Mail in the registration card so you hear about recalls. Get the install checked free by a certified tech (search "car seat check" + your city).', 'car seat', 'nhtsa'],
  ['stroller', 'gear', 'Stroller', 'Daily walks get you both out of the house.', 'Make sure your car seat clicks into it (a "travel system" or an adapter). Try the fold one-handed in the store.', 'stroller', 'cpsc'],
  ['carrier', 'gear', 'Baby carrier', 'Hands free, and newborns settle against you.', 'Pick one labeled "hip-healthy" (legs in an M shape). Baby\'s face visible and kissable, never pressed into fabric.', 'carrier|wrap', 'cpsc'],
  ['diaperbag', 'gear', 'Diaper bag', 'Grab-and-go for every outing.', 'A backpack style works for either of you.', 'diaper bag', ''],
  ['bassinet', 'nursery', 'Bassinet', 'AAP advises baby sleep in your room for at least the first 6 months.', 'Flat, firm surface (no incline). Check the weight limit, and stop using it once baby can roll or push up.', 'bassinet', 'cpsc'],
  ['crib', 'nursery', 'Crib', 'Where baby sleeps once the bassinet is outgrown.', 'New cribs sold in the US meet the federal safety standard. If it\'s used: no drop-side, no missing hardware, and run a recall check.', 'crib(?! sheet| mattress)', 'cpsc'],
  ['mattress', 'nursery', 'Crib mattress', 'Comes separately from most cribs.', 'Firm and flat. It should fit so you can\'t fit more than two fingers between the mattress and the crib side.', 'mattress', 'cpsc'],
  ['sheets', 'nursery', 'Fitted sheets (3)', 'Blowouts happen at 3 a.m.', 'Fitted only, made for your mattress size. Nothing else goes in the crib.', 'sheet', ''],
  ['sacks', 'nursery', 'Swaddles & sleep sacks', 'Keep baby warm without loose blankets.', 'Stop swaddling at the first signs of rolling. Skip weighted sleep sacks (AAP advises against them).', 'swaddle|sleep sack', ''],
  ['monitor', 'nursery', 'Baby monitor', 'Peace of mind when baby naps in another room.', 'For Wi-Fi monitors, change the default password. "Smart sock" breathing monitors are not proven to prevent SIDS (AAP).', 'monitor', ''],
  ['noise', 'nursery', 'White noise machine', 'Helps many babies (and parents) sleep.', 'Keep it across the room, not in the crib, at a low volume.', 'white noise|sound machine', ''],
  ['bottles', 'feeding', 'Bottles (a few kinds)', 'Even if breastfeeding, for pumped milk and partner feeds.', 'Buy one small pack of 2 or 3 brands first. Babies have strong opinions about nipples.', 'bottle(?! brush)', ''],
  ['pump', 'feeding', 'Breast pump', 'For going back to work, or letting {p:name} do a night feed.', 'Health insurance usually covers one for free (an ACA rule). Call the plan before buying.', 'pump', ''],
  ['burp', 'feeding', 'Burp cloths', 'You\'ll use more than you think.', 'Cheap cloth diapers work great as burp cloths.', 'burp', ''],
  ['nursingpillow', 'feeding', 'Nursing pillow', 'Saves {m:their} back and arms during feeds.', 'For awake feeding only. Never let baby sleep on it.', 'nursing pillow|boppy', 'cpsc'],
  ['bottlebrush', 'feeding', 'Bottle brush & drying rack', 'Bottles need cleaning after every feed.', '', 'bottle brush|drying rack', ''],
  ['diapers', 'diapering', 'Diapers (mostly size 1)', 'Newborns go through 8 to 12 a day.', 'Don\'t overbuy newborn size. Many babies outgrow it in a few weeks. Size 1 lasts longer.', 'diaper(?! bag| cream| pail)', ''],
  ['wipes', 'diapering', 'Wipes', '', 'Fragrance-free for newborn skin.', 'wipes', ''],
  ['cream', 'diapering', 'Diaper cream', 'For rashes.', 'A zinc oxide cream is the usual first pick. Ask your pediatrician.', 'cream|ointment', ''],
  ['changepad', 'diapering', 'Changing pad', 'A safe spot for changes.', 'Keep one hand on baby. Babies roll sooner than you\'d expect.', 'changing pad', ''],
  ['onesies', 'clothing', 'Onesies (0–3 months)', 'Everyday clothes.', 'Get more 0–3 months than newborn size. Zippers beat snaps at 3 a.m.', 'onesie|bodysuit', ''],
  ['pjs', 'clothing', 'Zip-up sleepers', 'Easy night changes.', 'Snug-fitting or flame-resistant sleepwear is the safety rule for baby pajamas.', 'sleeper|pajama', ''],
  ['hats', 'clothing', 'Socks & hats', '', '', 'sock|hat', ''],
  ['tub', 'bath', 'Baby bathtub', 'Makes the slippery first baths easier.', 'A tub or bath seat is not a safety device. Never leave baby alone in water, even for a second.', 'tub', 'cpsc'],
  ['thermo', 'bath', 'Digital thermometer', 'A fever under 3 months means calling the doctor right away.', 'Digital, used rectally, is the most accurate for babies. Not the forehead or ear kind for newborns. Under 3 months, a rectal reading of 100.4°F (38°C) or higher means calling the doctor right away.', 'thermometer', ''],
  ['alarms', 'nursery', 'Smoke & carbon monoxide alarms', 'Cheap, and the most important safety gear in the house.', 'One on every floor and outside the bedrooms. Test them monthly and change batteries twice a year.', 'smoke|carbon monoxide|co alarm|detector', ''],
  ['aspirator', 'bath', 'Nasal aspirator', 'Babies can\'t blow their noses.', 'Pair it with saline drops.', 'aspirator|snot', ''],
  ['clippers', 'bath', 'Nail clippers or file', 'Newborn nails scratch faces.', 'A file is easier than clippers at first.', 'clipper|nail', ''],
  ['firstaid', 'bath', 'Baby first-aid kit', '', 'Check that any infant medicine is dosed by weight, and ask the pediatrician before giving any.', 'first aid|first-aid', ''],
  ['pads', 'mom', 'Postpartum pads & peri bottle', 'Recovery bleeding lasts weeks.', 'The hospital may send some home with you. Ask for extras.', 'pad|peri', ''],
  ['nursingbra', 'mom', 'Nursing bras', '', 'Wait until late pregnancy to buy. Sizes change.', 'nursing bra', ''],
  ['nipple', 'mom', 'Nipple cream', 'Early breastfeeding can be sore.', 'Lanolin or plant-based. Ask the lactation consultant at the hospital.', 'nipple', ''],
  ['meals', 'mom', 'Meal delivery or freezer meals', 'The gift new parents say they valued most.', 'A great one to put on the public list for family.', 'meal', ''],
]
// Popular items safety experts say to leave off the list.
export const REG_SKIP = [
  ['Crib bumpers', 'Banned for sale in the US since 2022. A suffocation risk.'],
  ['Inclined sleepers or rockers for sleep', 'Banned in 2022 after infant deaths. Babies sleep flat.'],
  ['Baby nests, loungers & sleep positioners', 'The FDA and CPSC warn against them for sleep.'],
  ['Weighted sleep sacks or swaddles', 'AAP advises against them.'],
  ['Baby walkers', 'AAP calls for a ban. They cause falls down stairs.'],
  ['Amber teething necklaces', 'FDA warns of choking and strangling.'],
  ['A used car seat you don\'t know the history of', 'It may have crash damage you can\'t see, or be expired.'],
]
// Shown next to the star rating box.
export const RATING_TIPS = [
  'Under about 50 reviews, the stars don\'t mean much yet.',
  'Amazon often pools reviews across sizes and colors, so check that the reviews are about this exact item.',
  'Fake 5-star reviews are common. The 1 to 3 star reviews tell you more: look for the same complaint repeated.',
  'High stars don\'t mean safe. Recalled products can still show 4.5 stars, so run the recall check too.',
]

// ── Him, looking after himself ──────────────────────────────────────────────
// Shown on his own phone (Us → his side), built from the stress level he
// logged. His logged feelings add their own coping steps (DAD_FEELINGS.cope).
export const SELF_CARE_STRESS = {
  5: ['Stop and do the 2-minute breathing reset now. It physically lowers your heart rate.', 'Tell one person today how much you\'re carrying: a friend, your brother, a counselor. Not just {m:them}.', 'Cut one non-essential thing from this week. Something has to give, and it shouldn\'t be your sleep.'],
  4: ['Get 20 minutes of movement today: a walk, the gym, a run. Burn the stress off outside the house.', 'Write down what\'s weighing on you, then one next step for each. Worry shrinks on paper.'],
  3: ['Protect your sleep tonight. 7 hours makes everything else easier.', 'Do one thing just for you today, even 15 minutes.'],
  2: ['You\'re in a good spot. Bank it: get one thing done today that makes tomorrow easier.'],
  1: ['Steady day. Notice what\'s working so you can lean on it when the harder weeks come.'],
}
export const SELF_CARE_BASICS = [
  'Eat real meals. Running on coffee makes the short fuse shorter.',
  'Keep one thing that\'s yours: the gym, a game night, a hobby. You\'ll be a better partner for it.',
  'Around 1 in 10 expecting dads and partners struggle with depression or anxiety. If you\'re low for 2+ weeks, talk to your doctor or Postpartum Support International (1-800-944-4773, dads and partners included). In a crisis, call or text 988.',
]

// ── Where the health information comes from ─────────────────────────────────
// Shown wherever the app gives health or safety guidance. Update REVIEWED once
// a clinician has actually reviewed the content.
export const SOURCES = 'ACOG (American College of Obstetricians and Gynecologists), the FDA, the CDC and MotherToBaby'
export const INFO_UPDATED = 'October 2026'
export const REVIEWED = false
export const DISCLAIMER_SHORT = 'Not medical advice. Compiled by an AI assistant from public guidance (ACOG, FDA, CDC, MotherToBaby) and not yet reviewed by a medical professional. Check with your OB, midwife or pharmacist.'

// ── Tools, after-birth mode and loss support (kick counter, contractions,
// names, lists, birth plan, health log, newborn, postpartum, loss) ─────────
// Reference content for Together: names, checklists, birth plan, guidance notes.

export const BABY_NAMES = [
  // Girls
  ['Olivia', 'g'], ['Emma', 'g'], ['Charlotte', 'g'], ['Amelia', 'g'], ['Sophia', 'g'], ['Mia', 'g'],
  ['Isabella', 'g'], ['Ava', 'g'], ['Evelyn', 'g'], ['Luna', 'g'], ['Harper', 'g'], ['Sofia', 'g'],
  ['Camila', 'g'], ['Eleanor', 'g'], ['Elizabeth', 'g'], ['Violet', 'g'], ['Scarlett', 'g'], ['Emily', 'g'],
  ['Hazel', 'g'], ['Lily', 'g'], ['Gianna', 'g'], ['Aurora', 'g'], ['Penelope', 'g'], ['Aria', 'g'],
  ['Nora', 'g'], ['Chloe', 'g'], ['Ellie', 'g'], ['Mila', 'g'], ['Layla', 'g'], ['Abigail', 'g'],
  ['Ella', 'g'], ['Isla', 'g'], ['Eliana', 'g'], ['Nova', 'g'], ['Madison', 'g'], ['Zoe', 'g'],
  ['Ivy', 'g'], ['Grace', 'g'], ['Lucy', 'g'], ['Willow', 'g'], ['Emilia', 'g'], ['Naomi', 'g'],
  ['Victoria', 'g'], ['Stella', 'g'], ['Elena', 'g'], ['Hannah', 'g'], ['Valentina', 'g'], ['Maya', 'g'],
  ['Delilah', 'g'], ['Leah', 'g'], ['Lillian', 'g'], ['Paisley', 'g'], ['Genesis', 'g'], ['Madelyn', 'g'],
  ['Sadie', 'g'], ['Sophie', 'g'], ['Leilani', 'g'], ['Addison', 'g'], ['Natalie', 'g'], ['Josephine', 'g'],
  ['Alice', 'g'], ['Ruby', 'g'], ['Claire', 'g'], ['Kinsley', 'g'], ['Everly', 'g'], ['Adeline', 'g'],
  ['Eloise', 'g'], ['Lydia', 'g'], ['Jade', 'g'], ['Iris', 'g'], ['Ximena', 'g'], ['Daisy', 'g'],
  ['Athena', 'g'], ['Freya', 'g'], ['Margaret', 'g'], ['Clara', 'g'], ['Vivian', 'g'], ['Juniper', 'g'],
  ['Maeve', 'g'], ['Rose', 'g'], ['Julia', 'g'], ['Sienna', 'g'], ['Esther', 'g'], ['Aaliyah', 'g'],
  ['Amara', 'g'], ['Priya', 'g'], ['Anaya', 'g'], ['Mei', 'g'], ['Yara', 'g'], ['Imani', 'g'],
  ['Zara', 'g'], ['Fatima', 'g'], ['Leila', 'g'], ['Ananya', 'g'], ['Aisha', 'g'], ['Esperanza', 'g'],
  ['Lucia', 'g'], ['Mariana', 'g'], ['Gabriela', 'g'], ['Isabel', 'g'], ['Catalina', 'g'], ['Beatrice', 'g'],
  ['Florence', 'g'], ['Matilda', 'g'], ['Evangeline', 'g'], ['Ophelia', 'g'], ['Poppy', 'g'], ['Magnolia', 'g'],
  ['Georgia', 'g'], ['Harriet', 'g'], ['Mabel', 'g'], ['Ada', 'g'], ['Thea', 'g'], ['Cora', 'g'],
  ['Lena', 'g'], ['Nadia', 'g'], ['Ingrid', 'g'], ['Saoirse', 'g'], ['Anna', 'g'], ['Sarah', 'g'],
  ['Rachel', 'g'], ['Rebecca', 'g'], ['Katherine', 'g'], ['Mary', 'g'], ['Jasmine', 'g'], ['Gemma', 'g'],
  ['Hallie', 'g'], ['Kaia', 'g'], ['Nyla', 'g'], ['Kiara', 'g'], ['Malia', 'g'], ['Talia', 'g'],
  ['Mira', 'g'], ['Sloane', 'g'], ['Lainey', 'g'], ['Kennedy', 'g'],
  // Boys
  ['Liam', 'b'], ['Noah', 'b'], ['Oliver', 'b'], ['James', 'b'], ['Elijah', 'b'], ['Mateo', 'b'],
  ['Theodore', 'b'], ['Henry', 'b'], ['Lucas', 'b'], ['William', 'b'], ['Benjamin', 'b'], ['Levi', 'b'],
  ['Sebastian', 'b'], ['Jack', 'b'], ['Ezra', 'b'], ['Michael', 'b'], ['Daniel', 'b'], ['Leo', 'b'],
  ['Owen', 'b'], ['Samuel', 'b'], ['Hudson', 'b'], ['Alexander', 'b'], ['Asher', 'b'], ['Luca', 'b'],
  ['Ethan', 'b'], ['John', 'b'], ['David', 'b'], ['Jackson', 'b'], ['Joseph', 'b'], ['Mason', 'b'],
  ['Luke', 'b'], ['Matthew', 'b'], ['Julian', 'b'], ['Dylan', 'b'], ['Elias', 'b'], ['Jacob', 'b'],
  ['Maverick', 'b'], ['Gabriel', 'b'], ['Logan', 'b'], ['Aiden', 'b'], ['Thomas', 'b'], ['Isaac', 'b'],
  ['Miles', 'b'], ['Grayson', 'b'], ['Santiago', 'b'], ['Anthony', 'b'], ['Wyatt', 'b'], ['Carter', 'b'],
  ['Jayden', 'b'], ['Ezekiel', 'b'], ['Caleb', 'b'], ['Cooper', 'b'], ['Josiah', 'b'], ['Charles', 'b'],
  ['Christopher', 'b'], ['Isaiah', 'b'], ['Nolan', 'b'], ['Nathan', 'b'], ['Joshua', 'b'], ['Waylon', 'b'],
  ['Angel', 'b'], ['Lincoln', 'b'], ['Andrew', 'b'], ['Roman', 'b'], ['Adrian', 'b'], ['Jaxon', 'b'],
  ['Jonathan', 'b'], ['Silas', 'b'], ['Atlas', 'b'], ['Arthur', 'b'], ['Jeremiah', 'b'], ['Beau', 'b'],
  ['Xavier', 'b'], ['Axel', 'b'], ['Everett', 'b'], ['Declan', 'b'], ['Felix', 'b'], ['Hugo', 'b'],
  ['Oscar', 'b'], ['Jasper', 'b'], ['Milo', 'b'], ['August', 'b'], ['Gideon', 'b'], ['Archer', 'b'],
  ['Bennett', 'b'], ['Brooks', 'b'], ['Calvin', 'b'], ['Emmett', 'b'], ['Finn', 'b'], ['Graham', 'b'],
  ['Harrison', 'b'], ['Jonah', 'b'], ['Malcolm', 'b'], ['Omar', 'b'], ['Rafael', 'b'], ['Ravi', 'b'],
  ['Arjun', 'b'], ['Kenji', 'b'], ['Hiroshi', 'b'], ['Muhammad', 'b'], ['Ali', 'b'], ['Yusuf', 'b'],
  ['Amir', 'b'], ['Malik', 'b'], ['Jamal', 'b'], ['Darius', 'b'], ['Andre', 'b'], ['Marcus', 'b'],
  ['Diego', 'b'], ['Javier', 'b'], ['Carlos', 'b'], ['Emiliano', 'b'], ['Alejandro', 'b'], ['Nico', 'b'],
  ['Desmond', 'b'], ['Otis', 'b'], ['Walter', 'b'], ['George', 'b'], ['Edward', 'b'], ['Louis', 'b'],
  ['Ronan', 'b'], ['Theo', 'b'], ['Dominic', 'b'], ['Vincent', 'b'], ['Patrick', 'b'], ['Peter', 'b'],
  ['Simon', 'b'], ['Tobias', 'b'], ['Abel', 'b'], ['Moses', 'b'], ['Enzo', 'b'], ['Arlo', 'b'],
  ['Hunter', 'b'], ['Micah', 'b'], ['Spencer', 'b'], ['Sawyer', 'b'],
  // Neutral
  ['Avery', 'n'], ['Riley', 'n'], ['Emery', 'n'], ['Rowan', 'n'], ['Wren', 'n'], ['Quinn', 'n'],
  ['Jordan', 'n'], ['Taylor', 'n'], ['Morgan', 'n'], ['Parker', 'n'], ['Reese', 'n'], ['Sage', 'n'],
  ['River', 'n'], ['Phoenix', 'n'], ['Skyler', 'n'], ['Hayden', 'n'], ['Dakota', 'n'], ['Charlie', 'n'],
  ['Finley', 'n'], ['Jamie', 'n'], ['Alex', 'n'], ['Rory', 'n'], ['Remi', 'n'], ['Ellis', 'n'],
  ['Blake', 'n'], ['Kendall', 'n'], ['Peyton', 'n'], ['Ari', 'n'], ['Arden', 'n'], ['Shiloh', 'n'],
  ['Harley', 'n'], ['Oakley', 'n'], ['Marlowe', 'n'], ['Briar', 'n'], ['Elliot', 'n'], ['Emerson', 'n'],
  ['Hollis', 'n'], ['Indigo', 'n'], ['Jules', 'n'], ['Kai', 'n'], ['Lennon', 'n'], ['Lennox', 'n'],
  ['Ocean', 'n'], ['Salem', 'n'], ['Shay', 'n'], ['Sutton', 'n'], ['Tatum', 'n'], ['Winter', 'n'],
  ['Zion', 'n'], ['Bellamy', 'n'], ['Blair', 'n'], ['Cameron', 'n'], ['Casey', 'n'], ['Drew', 'n'],
  ['Eden', 'n'], ['Frankie', 'n'], ['Gray', 'n'], ['Jessie', 'n'], ['Kit', 'n'], ['Lane', 'n'],
  ['Marley', 'n'], ['Noel', 'n'], ['Robin', 'n'], ['Sasha', 'n'], ['Haven', 'n'], ['Rio', 'n'],
  ['Sol', 'n'], ['Ashton', 'n'], ['Justice', 'n'], ['Teagan', 'n'],
];

export const BAG_LIST = [
  ['For labor', 'Birth plan copies (2–3) for the care team'],
  ['For labor', 'Comfy robe or your own gown'],
  ['For labor', 'Non-slip socks or slippers'],
  ['For labor', 'Lip balm (hospital air is dry)'],
  ['For labor', 'Hair ties, headband, or clips'],
  ['For labor', 'Glasses, plus contact case and solution'],
  ['For labor', 'Massage tool or tennis ball for back pressure'],
  ['For labor', 'Playlist and a small speaker or headphones'],
  ['For labor', 'Light snacks and drinks (check what\'s allowed)'],
  ['For labor', 'Your own pillow in a bright pillowcase'],
  ['For after birth', 'Nursing bras or soft bras (2–3)'],
  ['For after birth', 'Nursing pads'],
  ['For after birth', 'Nipple cream'],
  ['For after birth', 'High-waisted, roomy underwear (or disposable)'],
  ['For after birth', 'Extra-absorbent maxi pads'],
  ['For after birth', 'Toiletries: toothbrush, toothpaste, deodorant, shampoo'],
  ['For after birth', 'Face wipes and moisturizer'],
  ['For after birth', 'Loose, comfy going-home outfit (still maternity size)'],
  ['For after birth', 'Shower flip-flops'],
  ['For after birth', 'Water bottle with a straw'],
  ['For after birth', 'Any daily medications you take'],
  ['For the baby', 'Rear-facing infant car seat, installed and checked'],
  ['For the baby', 'Going-home outfit (newborn and 0–3 month sizes)'],
  ['For the baby', 'Hat and socks or footed sleeper'],
  ['For the baby', 'Swaddle or receiving blanket'],
  ['For the baby', 'Weather-appropriate car-seat cover or blanket (over the straps, not under)'],
  ['For the baby', 'A few newborn diapers and wipes (hospitals usually supply)'],
  ['For the baby', 'Burp cloths'],
  ['For the baby', 'Formula and bottles if you plan to formula-feed (ask what\'s provided)'],
  ['For the partner', 'Change of clothes and a warm layer'],
  ['For the partner', 'Toiletries and any medications'],
  ['For the partner', 'Pillow and a light blanket'],
  ['For the partner', 'Plenty of snacks and a refillable water bottle'],
  ['For the partner', 'Swimsuit if you may join a labor tub or shower'],
  ['For the partner', 'Cash or card for parking, vending machines, and cafeteria'],
  ['For the partner', 'List of people to update and how'],
  ['For the partner', 'Book, tablet, or something for downtime'],
  ['Documents & tech', 'Photo ID'],
  ['Documents & tech', 'Insurance card'],
  ['Documents & tech', 'Hospital pre-registration paperwork'],
  ['Documents & tech', 'Pediatrician\'s name and phone number'],
  ['Documents & tech', 'Phone chargers with an extra-long cable'],
  ['Documents & tech', 'Portable battery pack'],
  ['Documents & tech', 'Camera and memory card, if you use one'],
  ['Documents & tech', 'Cord blood banking kit, if you\'ve signed up'],
];

export const BIRTH_PLAN_INTRO = 'These are your preferences, not guarantees. Go over them with your provider before labor, and remember that plans can change for good reasons, and that\'s OK.';

export const BIRTH_PLAN = [
  {
    id: 'support',
    title: 'Who\'s with you',
    options: [
      ['partner', 'Partner'],
      ['doula', 'Doula'],
      ['family', 'A family member or friend'],
      ['students', 'OK to have students or trainees present'],
      ['no_students', 'Prefer no students or trainees'],
      ['limit_visitors', 'Limit visitors until we\'re ready'],
    ],
    note: 'Hospitals set limits on how many support people can be in the room, so check the policy ahead of time.',
  },
  {
    id: 'environment',
    title: 'Environment',
    options: [
      ['dim_lights', 'Dim lights'],
      ['music', 'Our own music'],
      ['quiet', 'Quiet room, minimal talking'],
      ['photos', 'Photos allowed'],
      ['video', 'Video allowed (where the hospital permits)'],
      ['own_clothes', 'Wear my own clothes'],
    ],
    note: 'Many hospitals limit photos or video during the birth itself, so ask what\'s allowed.',
  },
  {
    id: 'pain',
    title: 'Pain relief',
    options: [
      ['unmedicated', 'Hope to go unmedicated'],
      ['nonmed', 'Non-medical comfort first (breathing, massage, water, heat)'],
      ['nitrous', 'Nitrous oxide, if available'],
      ['iv_meds', 'IV pain medication'],
      ['epidural', 'Epidural when I ask for it'],
      ['decide', 'Decide in the moment'],
      ['dont_offer', 'Please don\'t offer; I\'ll ask'],
    ],
    note: 'Epidurals are safe and effective for most people, and it\'s fine to change your mind about pain relief at any point.',
  },
  {
    id: 'labor',
    title: 'Labor',
    options: [
      ['move', 'Freedom to walk and change positions'],
      ['eat_drink', 'Eat and drink lightly, per hospital policy'],
      ['intermittent', 'Intermittent fetal monitoring if low-risk'],
      ['wireless', 'Wireless monitoring if continuous is needed'],
      ['saline_lock', 'Saline lock instead of continuous IV, if possible'],
      ['ball', 'Birth ball or peanut ball'],
      ['tub', 'Shower or tub for comfort'],
      ['explain', 'Explain any interventions before they happen'],
    ],
    note: 'Intermittent monitoring is an option for many low-risk labors; continuous monitoring is recommended for some medical situations.',
  },
  {
    id: 'pushing',
    title: 'Pushing & delivery',
    options: [
      ['positions', 'Try different pushing positions'],
      ['own_pace', 'Push with my urges when possible'],
      ['coached', 'Coached pushing'],
      ['perineal', 'Warm compresses and perineal support'],
      ['mirror', 'A mirror to see the baby crown'],
      ['touch_head', 'Touch the baby\'s head as it crowns'],
      ['partner_announce', 'Partner announces the sex'],
      ['partner_cord', 'Partner cuts the cord'],
    ],
    note: 'Warm compresses and perineal massage during pushing can lower the chance of a severe tear.',
  },
  {
    id: 'after',
    title: 'Right after birth',
    options: [
      ['skin', 'Immediate skin-to-skin'],
      ['delayed_clamp', 'Delayed cord clamping'],
      ['cord_blood', 'Cord blood banking or donation'],
      ['partner_skin', 'Partner does skin-to-skin if I can\'t'],
      ['placenta', 'See or keep the placenta'],
      ['golden_hour', 'Uninterrupted first hour, with exams done on my chest'],
    ],
    note: 'Delayed cord clamping (at least 30–60 seconds) is recommended for most healthy babies.',
  },
  {
    id: 'baby_care',
    title: 'Baby care',
    options: [
      ['vitamin_k', 'Vitamin K shot'],
      ['eye', 'Eye ointment'],
      ['hep_b', 'Hepatitis B vaccine'],
      ['delay_bath', 'Delay the first bath at least 24 hours'],
      ['rooming_in', 'Rooming-in with baby'],
      ['nursery', 'Some nursery time so I can rest'],
      ['no_pacifier', 'No pacifier unless we OK it'],
      ['circumcision', 'Circumcision (if applicable)'],
    ],
    note: 'The AAP recommends vitamin K, eye ointment, and the hepatitis B vaccine for all newborns; ask your provider about any concerns.',
  },
  {
    id: 'feeding',
    title: 'Feeding',
    options: [
      ['breast', 'Breastfeed / chestfeed'],
      ['formula', 'Formula'],
      ['combo', 'Combination feeding'],
      ['lactation', 'See a lactation consultant'],
      ['no_formula', 'No formula without asking us first'],
      ['undecided', 'Still deciding'],
    ],
    note: 'Fed is best: any choice is valid, and lactation consultants can help whichever way you feed.',
  },
];

export const QUESTION_IDEAS = [
  [4, 'Which medications I already take are OK to keep?'],
  [4, 'Which prenatal vitamin do you recommend?'],
  [6, 'Who do we call after hours, and when should we?'],
  [6, 'Which foods and drinks should be avoided?'],
  [8, 'Is the exercise routine I do now still OK?'],
  [8, 'What can help with nausea, and when is it too much?'],
  [10, 'Which genetic screening tests do you offer, and what do they tell us?'],
  [12, 'Which vaccines are recommended during pregnancy?'],
  [12, 'Is my weight gain on track for my starting BMI?'],
  [16, 'Is it safe to travel, and until what week?'],
  [20, 'What do the anatomy scan results mean for us?'],
  [20, 'When should we start counting kicks?'],
  [22, 'Should we sign up for childbirth or breastfeeding classes?'],
  [24, 'When is the glucose test, and how do I prepare?'],
  [26, 'What are the signs of preterm labor?'],
  [28, 'Do I need the Rh immune globulin shot?'],
  [28, 'Should I be checking my blood pressure at home?'],
  [30, 'Can we go over our birth plan together?'],
  [30, 'Who will deliver the baby if you\'re not on call?'],
  [32, 'What\'s your rule for when to come in once labor starts?'],
  [32, 'How often do you perform C-sections or inductions, and why?'],
  [34, 'Which hospital entrance and floor do we go to?'],
  [36, 'When will you test for group B strep?'],
  [37, 'What happens if I go past my due date?'],
  [38, 'What should postpartum recovery look like, and when do we follow up?'],
];

export const WEIGHT_GAIN = [
  { id: 'under', label: 'Underweight', bmiMin: 0, bmiMax: 18.5, totalLb: [28, 40], weeklyLb2nd3rd: [1.0, 1.3] },
  { id: 'normal', label: 'Normal weight', bmiMin: 18.5, bmiMax: 25, totalLb: [25, 35], weeklyLb2nd3rd: [0.8, 1.0] },
  { id: 'over', label: 'Overweight', bmiMin: 25, bmiMax: 30, totalLb: [15, 25], weeklyLb2nd3rd: [0.5, 0.7] },
  { id: 'obese', label: 'Obese', bmiMin: 30, bmiMax: Infinity, totalLb: [11, 20], weeklyLb2nd3rd: [0.4, 0.6] },
];

export const FIRST_TRI_GAIN = [1.1, 4.4];

export const WEIGHT_NOTE = 'Weight is just one data point, and these ranges are guides for a single baby. Never diet during pregnancy without talking to your OB, and call right away for sudden rapid gain with swelling or a headache.';

export const BP_RULES = [
  { sys: 160, dia: 110, level: 'urgent', text: 'Severe-range blood pressure. Call labor & delivery now or go in right away.' },
  { sys: 140, dia: 90, level: 'call', text: 'High for pregnancy. Rest 15 minutes and recheck, and call your OB today; it can be a sign of preeclampsia or gestational hypertension.' },
  { sys: 0, dia: 0, level: 'ok', text: 'In the normal range. Keep logging as your provider recommends.' },
];

export const BP_NOTE = 'Sit with your back supported and feet flat, rest 5 minutes first, and keep your arm at heart level. Use a cuff that fits your upper arm, and avoid caffeine or exercise 30 minutes before.';

export const NEWBORN_TIPS = [
  'Feed on early cues like rooting, lip-smacking, and hands to mouth; crying is a late cue.',
  'Expect 8–12 feeds in 24 hours at first, including overnight.',
  'Wet diapers rise day by day, to at least 6 a day by day 5–6.',
  'Stools change from black, sticky meconium to yellow or green by about day 4–5.',
  'Always place baby on their back to sleep, alone, on a firm, flat surface with no blankets, pillows, or bumpers.',
  'Room-share without bed-sharing, ideally for at least the first 6 months.',
  'Skin-to-skin helps with warmth, bonding, and feeding, and both parents can do it.',
  'Keep the umbilical cord stump clean and dry; it usually falls off in 1–3 weeks.',
  'Most babies get a jaundice check before leaving the hospital and again at the first visit, around 3–5 days old.',
  'Burp baby partway through and after each feed.',
  'Crying often peaks around 6–8 weeks; if it\'s too much, put baby down safely and step away. Never shake a baby.',
  'Use a rear-facing car seat for every ride, with snug straps and no bulky coats.',
  'Sponge bathe until the cord falls off, and don\'t bathe every day.',
];

export const NEWBORN_CALL = [
  'Call 911 for trouble breathing, blue or gray lips or skin, or if baby is limp or won\'t wake.',
  'Call 911 for a seizure or any pause in breathing of 20 seconds or more.',
  'Rectal temperature of 100.4°F or higher under 3 months old: call the pediatrician right away.',
  'Temperature below 97.5°F that doesn\'t improve with warming.',
  'Fewer wet diapers than expected, or no wet diaper in 6–8 hours after the first few days.',
  'Not feeding well, refusing several feeds, or too sleepy to finish feeds.',
  'Very sleepy, floppy, or hard to wake.',
  'Yellow skin or eyes that spread to the belly or legs, or that appear in the first 24 hours.',
  'Forceful or green vomiting, or repeated vomiting.',
  'Redness, swelling, pus, or a bad smell around the cord stump.',
  'Inconsolable crying that\'s different from usual, or a weak, high-pitched cry.',
  'Blood in the stool, or no stool in the first 2 days.',
];

export const FEED_TYPES = [['breast_l', '🤱 Left'], ['breast_r', '🤱 Right'], ['bottle', '🍼 Bottle'], ['pump', '🥛 Pump']];

export const DIAPER_TYPES = [['wet', '💧 Wet'], ['dirty', '💩 Dirty'], ['both', '💧💩 Both']];

export const POSTPARTUM_911 = [
  'Chest pain or a racing heartbeat with trouble breathing',
  'Trouble breathing or shortness of breath',
  'A seizure',
  'Thoughts of harming yourself or the baby',
];

export const POSTPARTUM_CALL = [
  'Headache that won\'t go away or gets worse over time',
  'Dizziness or fainting',
  'Changes in vision, like blurriness, spots, or flashing lights',
  'Fever of 100.4°F or higher',
  'Extreme swelling of the hands or face',
  'Fast or pounding heartbeat',
  'Severe belly pain that doesn\'t go away',
  'Severe nausea and vomiting',
  'Bleeding that soaks a pad in an hour or less, or clots bigger than an egg',
  'Swelling, redness, or pain in one leg',
  'Overwhelming tiredness',
  'Foul-smelling discharge, or redness or oozing at an incision',
];

export const POSTPARTUM_TIPS = [
  'These warning signs matter for up to a year after birth, so say "I recently had a baby" when you call.',
  'Rest whenever you can, and say yes to help with meals, chores, and visitors.',
  'Use a peri bottle with warm water when you pee, and pat dry front to back.',
  'Bleeding (lochia) is normal for up to 6 weeks and should slowly get lighter.',
  'Wait for your provider\'s OK before sex, tampons, or hard exercise.',
  'Gentle pelvic floor exercises can help, and a pelvic floor physical therapist can help more.',
  'Check in with your provider within 3 weeks of birth, with a full postpartum visit by 12 weeks.',
  'Baby blues (weepy, moody) are common and fade by about 2 weeks; feelings that last longer or feel heavy may be postpartum depression, which is treatable.',
  'Partners can get postpartum depression too, so check in on each other.',
  'National Maternal Mental Health Hotline: call or text 1-833-TLC-MAMA (1-833-852-6262), free and 24/7.',
  'Postpartum Support International helpline: 1-800-944-4773 (call or text).',
];

export const MOOD_CHECK = [
  ['low_mood', 'In the past two weeks, have you often felt down, sad, or hopeless?'],
  ['interest', 'Have you lost interest or pleasure in things you usually enjoy?'],
  ['anxiety', 'Have you felt anxious, panicky, or unable to stop worrying, or had trouble sleeping even when the baby sleeps?'],
  ['self_harm', 'Have you had thoughts of harming yourself or the baby?'],
];

export const MOOD_CHECK_NOTE = 'This is a gentle check-in, not a diagnosis. If any answer is yes, talk to your provider; if you\'re thinking of harming yourself or the baby, call or text 988 now, or call 911.';

export const LOSS_SUPPORT = {
  intro: 'We\'re so sorry for your loss; whatever you\'re feeling right now is valid, and you can take this one moment at a time.',
  physical: [
    'Bleeding and cramping are common for days to a couple of weeks, depending on how far along the pregnancy was.',
    'Call right away for bleeding that soaks 2 pads an hour for 2 hours in a row, or for dizziness or fainting.',
    'Call for a fever of 100.4°F or higher, severe pain, or foul-smelling discharge.',
    'Breast milk may come in after a later loss; ask your provider how to ease the discomfort.',
    'Schedule a follow-up visit to check your recovery and ask any questions.',
    'If your blood type is Rh-negative, ask whether you need Rh immune globulin.',
  ],
  emotional: [
    'Grief after a pregnancy loss is real and normal, whenever the loss happened.',
    'Partners may grieve differently or on different timelines, and both ways are OK.',
    'There\'s no right timeline for feeling better, and anniversaries and due dates can be hard.',
    'Most losses happen for reasons no one could have prevented; it\'s not your fault.',
    'Let people know what you need, including if you\'d rather not talk.',
    'Talk to your provider about counseling or support groups, and reach out fast if you feel hopeless.',
  ],
  partner: [
    'Be present for {m:them}; you don\'t need the right words, just stay close.',
    'Say the baby\'s name if you chose one, and let {m:them} talk about the baby.',
    'Handle logistics like calls, appointments, and meals.',
    'Offer to tell family and friends, if {m:they} would like that.',
    'Take care of your own grief too; your loss matters as well.',
  ],
  resources: [
    ['Postpartum Support International', '1-800-944-4773', 'Helpline and support groups, including for pregnancy and infant loss.'],
    ['Share Pregnancy & Infant Loss Support', 'nationalshare.org', 'Support for families after pregnancy loss, stillbirth, or infant death.'],
    ['March of Dimes', 'marchofdimes.org', 'Bereavement resources and information after a loss.'],
    ['988 Suicide & Crisis Lifeline', 'Call or text 988', 'Free, confidential support 24/7 if you\'re in crisis.'],
    ['National Maternal Mental Health Hotline', '1-833-TLC-MAMA (1-833-852-6262)', 'Free, 24/7 call or text support before and after pregnancy, including after a loss.'],
  ],
};

export const CONTRACTION_NOTE = 'Time contractions from the start of one to the start of the next. Many providers use a "5-1-1" rule for first babies (5 minutes apart, 1 minute long, for 1 hour), but follow your own provider\'s instructions. Go in right away if your water breaks, you\'re bleeding, the baby is moving less, or you have severe, constant pain.';

export const KICK_NOTE = 'From about 28 weeks, pick a time the baby is usually active and count until you feel 10 movements. Most babies reach 10 well within 2 hours. If movements are fewer or feel different from usual, call labor & delivery right away; don\'t wait.';

export const BABY_MONTH_NOTE = 'Every baby grows on their own schedule. These are typical ranges, not tests, so talk to your pediatrician if baby loses skills they once had or misses several milestones.';

export const BABY_MONTHS = [
  {
    month: 0,
    title: 'The newborn weeks',
    can: [
      'Turns toward familiar voices, especially yours',
      'Sees faces best about 8 to 12 inches away',
      'Roots and sucks when the cheek is stroked',
      'Grips a finger placed in the palm',
      'Sleeps 14 to 17 hours a day in short stretches',
    ],
    next: 'Soon baby will start to hold your gaze longer and may flash a first real smile.',
    tip: 'Always place baby on their back to sleep, in a bare crib or bassinet with a firm, flat mattress.',
    partner: 'Take over a feed, diaper or burp session so {m:they} can get a solid block of sleep.',
    watch: 'Call right away for a rectal temperature of 100.4 F or higher, yellow skin that is spreading, or fewer wet diapers than expected.',
  },
  {
    month: 1,
    title: 'Settling in',
    can: [
      'Lifts the head briefly during tummy time',
      'Follows a face or toy with the eyes for a moment',
      'Startles at loud sounds',
      'Brings hands toward the mouth',
    ],
    next: 'Social smiles and soft cooing sounds usually show up in the coming weeks.',
    tip: 'Try a few short tummy time sessions each day while baby is awake and someone is watching.',
    partner: 'Skin-to-skin time is for you too, so hold baby on your bare chest and let {m:them} rest.',
    watch: 'Call if baby feeds poorly, is unusually sleepy and hard to wake, or has a fever of 100.4 F or higher.',
  },
  {
    month: 2,
    title: 'First smiles',
    can: [
      'Smiles when you talk or smile at them',
      'Makes cooing sounds other than crying',
      'Holds the head up during tummy time',
      'Calms when picked up or spoken to',
      'Watches you as you move',
    ],
    next: 'Baby will start reaching, giggling and holding the head steadier.',
    tip: 'Talk and sing to baby during everyday tasks. Your voice builds their language skills.',
    partner: 'Bath time or a nightly walk can become your special routine with baby.',
    watch: 'Call if baby does not react to loud sounds, does not watch moving things, or does not smile at people.',
  },
  {
    month: 3,
    title: 'Finding their hands',
    can: [
      'Opens and closes hands and studies them',
      'Pushes up on the forearms during tummy time',
      'Swipes at dangling toys',
      'Coos back and forth with you',
    ],
    next: 'Rolling and real belly laughs are often just around the corner.',
    tip: 'Never leave baby alone on a bed, couch or changing table, since rolling can start any day.',
    partner: 'Ask {m:them} what would help most this week, and then take that task off the list.',
    watch: 'Call if baby cannot hold the head up at all, does not follow objects, or seems stiff or very floppy.',
  },
  {
    month: 4,
    title: 'Laughs and reaches',
    can: [
      'Laughs or chuckles',
      'Holds the head steady without support',
      'Reaches for and holds a toy',
      'May roll from tummy to back',
      'Makes sounds back when you talk',
    ],
    next: 'Many babies start to sit with support and show interest in your food.',
    tip: 'Offer safe teething toys and keep small objects out of reach, since everything goes in the mouth now.',
    partner: 'Read a short board book to baby each day. It is never too early to start.',
    watch: 'Call if baby does not bring things to the mouth, does not push down with the legs when feet touch a surface, or stops babbling.',
  },
  {
    month: 5,
    title: 'Rolling around',
    can: [
      'Rolls in one or both directions',
      'Blows raspberries and squeals',
      'Passes a toy from one hand to the other',
      'Recognizes familiar people',
    ],
    next: 'Solid foods usually begin around 6 months, once baby shows signs of readiness.',
    tip: 'Lower the crib mattress before baby can pull up, and move the crib away from cords and blinds.',
    partner: 'Try a fun game of peekaboo. It teaches baby that you come back.',
    watch: 'Call if baby does not roll at all, cannot hold toys, or does not react to sounds around them.',
  },
  {
    month: 6,
    title: 'Ready for first foods',
    can: [
      'Sits with support or leans on the hands',
      'Takes turns making sounds with you',
      'Opens the mouth when hungry and food is offered',
      'Knows familiar faces from strangers',
      'Rolls from tummy to back',
    ],
    next: 'Sitting alone, babbling with consonants like ba and da, and maybe crawling are coming.',
    tip: 'Start solids with soft, iron-rich foods and offer common allergens like peanut and egg early, as your pediatrician advises.',
    partner: 'Take charge of a first-foods meal. The mess is part of the fun.',
    watch: 'Call if baby does not try to get things in reach, shows no affection, or does not laugh or squeal.',
  },
  {
    month: 7,
    title: 'Sitting tall',
    can: [
      'Sits without support for short periods',
      'Babbles strings like ba-ba-ba',
      'Rakes small objects toward them',
      'Responds to their own name',
    ],
    next: 'Crawling, scooting and pulling up may begin, so get ready to childproof.',
    tip: 'Install outlet covers, cabinet locks and stair gates before baby is on the move.',
    partner: 'Get down on the floor and play. Baby loves to watch what you do.',
    watch: 'Call if baby does not respond to their name or does not seem to recognize familiar people.',
  },
  {
    month: 8,
    title: 'On the move',
    can: [
      'May crawl, scoot or army crawl',
      'Gets into a sitting position alone',
      'Looks for a toy you hid under a blanket',
      'May feel shy or upset with strangers',
    ],
    next: 'Pulling to stand and cruising along furniture often come next.',
    tip: 'Keep a close eye in the bath and never leave baby alone in water, even for a second.',
    partner: 'Offer comfort when separation worries start. A calm goodbye helps baby learn you return.',
    watch: 'Call if baby cannot sit with help, does not babble, or does not use both hands.',
  },
  {
    month: 9,
    title: 'Curious explorer',
    can: [
      'Sits without support',
      'Picks up small food with thumb and finger',
      'Looks when you point at something',
      'Makes sounds like mamama and bababa',
      'Shows several facial expressions',
    ],
    next: 'First words, waving bye-bye and standing may come in the next few months.',
    tip: 'Offer soft finger foods cut into small pieces, and avoid whole grapes, nuts and other choking hazards.',
    partner: 'Name things you see on a walk together. Baby is soaking up words.',
    watch: 'Call if baby does not bear weight on the legs with support, does not look where you point, or loses skills.',
  },
  {
    month: 10,
    title: 'Pulling up',
    can: [
      'Pulls up to stand holding furniture',
      'Waves or claps',
      'Copies sounds and gestures',
      'Bangs two toys together',
    ],
    next: 'Cruising, first steps and first words are on the horizon.',
    tip: 'Anchor dressers and bookshelves to the wall so they cannot tip over.',
    partner: 'Start a simple bedtime routine you lead, like bath, book and song.',
    watch: 'Call if baby does not crawl or move around in any way, or shows no interest in back-and-forth play.',
  },
  {
    month: 11,
    title: 'Almost one',
    can: [
      'Cruises along furniture',
      'May stand alone for a moment',
      'Understands simple words like no',
      'Puts things into a container',
    ],
    next: 'Around the first birthday many babies say a word or two and some take first steps.',
    tip: 'Offer water in an open or straw cup with meals so baby can practice.',
    partner: 'Plan a small first birthday that is easy on everyone, including {m:them}.',
    watch: 'Call if baby does not use gestures like waving or pointing, or does not seem to understand any words.',
  },
  {
    month: 12,
    title: 'Happy first birthday',
    can: [
      'Waves bye-bye',
      'Calls a parent mama, dada or another special name',
      'Pulls to stand and walks holding furniture',
      'Drinks from a cup you hold',
      'Plays games like pat-a-cake',
    ],
    next: 'Walking on their own, more words and lots of big feelings come in the toddler year.',
    tip: 'Ask your pediatrician about switching to whole milk and how much to offer each day.',
    partner: 'Look back at how far the three of you have come, and say thank you to {m:them}.',
    watch: 'Call if baby cannot stand with support, does not say any words, or does not point to show you things.',
  },
];

export const WELL_VISITS = [
  ['At birth', 0, 'Hepatitis B vaccine, vitamin K, eye ointment, newborn screening and hearing test. RSV antibody if born in RSV season and mom did not get the RSV vaccine.'],
  ['3–5 days', 3, 'Weight check, jaundice and feeding check.'],
  ['1 month', 30, 'Growth and feeding check. Second hepatitis B dose may be given now or at 2 months.'],
  ['2 months', 60, 'DTaP, Hib, polio, pneumococcal, hepatitis B and rotavirus. RSV antibody if not given at birth and mom did not get the RSV vaccine.'],
  ['4 months', 120, 'Second doses of DTaP, Hib, polio, pneumococcal and rotavirus. Growth and development check.'],
  ['6 months', 180, 'DTaP, pneumococcal, and Hib and rotavirus depending on brand. Polio and hepatitis B between 6 and 18 months. First flu vaccine in season, with a second dose 4 weeks later.'],
  ['9 months', 270, 'Developmental screening and catch-up vaccines if needed. Talk about safety now that baby is mobile.'],
  ['12 months', 365, 'MMR, chickenpox and hepatitis A. Hib and pneumococcal boosters between 12 and 15 months. Lead and anemia screening.'],
];

export const VACCINE_NOTE = 'Vaccine schedules can vary by brand, by state and as national guidance changes. Follow your pediatrician\'s advice and ask them about any shot you have questions about.';

export const WEEK_TODOS = {
  4: ['Start a daily prenatal vitamin with 400 mcg of folic acid', 'Call your OB or midwife to book a first visit'],
  5: ['Stop alcohol, smoking and vaping, and ask for help if you need it', 'Check your medicines with a pharmacist or provider'],
  6: ['Keep crackers by the bed for morning nausea', 'Talk about when and who you want to tell'],
  7: ['Write down questions for the first prenatal visit', 'Check what your insurance covers for maternity care'],
  8: ['Gather family health history from both sides', 'Ask whether you will have a dating ultrasound'],
  9: ['Swap high-mercury fish for salmon, shrimp or cod', 'Keep caffeine under 200 mg a day'],
  10: ['Ask about genetic screening and testing options', 'Book a dental cleaning, it is safe during pregnancy'],
  11: ['Ask if the NIPT (cell-free DNA) blood test is right for you', 'Ask about the NT scan, usually done at 11 to 14 weeks'],
  12: ['Start a shared note of baby name ideas', 'Take a first bump photo for a monthly series'],
  13: ['Sketch a rough baby budget together', 'Plan how to share the news at work'],
  14: ['Get a flu shot if it is flu season', 'Try a prenatal yoga or swim class'],
  15: ['Ask about the AFP or quad screen if you want it', 'Start a short walk together most days'],
  16: ['Read your company parental leave policy', 'Check if your state offers paid family leave'],
  17: ['Buy comfortable bras and a few maternity basics', 'Get a body pillow and start sleeping on your side'],
  18: ['Book the anatomy scan for 18 to 22 weeks', 'Decide if you want to learn the sex at the scan'],
  19: ['Start a baby registry together'],
  20: ['Celebrate the halfway mark with a date night', 'Plan a babymoon if you want one, ideally before 28 weeks'],
  21: ['Research childcare options and join any waitlists'],
  22: ['Sign up for a childbirth education class', 'Ask about a breastfeeding or infant feeding class'],
  23: ['Talk about how you will split night feeds and chores'],
  24: ['Schedule the glucose screening for 24 to 28 weeks', 'Learn the signs of preterm labor'],
  25: ['Look into cord blood banking or donation', 'Start daily pelvic floor exercises (Kegels)'],
  26: ['Shortlist pediatricians and set up meet-and-greets'],
  27: ['Ask about the Tdap vaccine, given at 27 to 36 weeks', 'Ask if you need an Rh shot if your blood type is Rh negative'],
  28: ['Start daily kick counts if your provider suggests it', 'Note that visits move to every 2 weeks around now'],
  29: ['Tour the hospital or birth center'],
  30: ['Write a simple one-page birth preferences sheet', 'File FMLA and leave paperwork with HR'],
  31: ['Pre-register at the hospital or birth center'],
  32: ['Ask about the RSV vaccine (32 to 36 weeks, September to January)', 'Learn safe sleep basics: back, crib, nothing else'],
  33: ['Choose a pediatrician and share the name with the hospital', 'Learn the deadline to add baby to your health plan'],
  34: ['Make and freeze a few easy meals', 'Practice the drive to the hospital, day and night'],
  35: ['Install the car seat and have it checked', 'Pack the hospital bag for both of you'],
  36: ['Get the group B strep (GBS) swab at 36 to 37 weeks', 'Wash baby clothes, sheets and swaddles'],
  37: ['Set up a diaper and feeding station', 'Save the labor and delivery phone number in both phones'],
  38: ['Plan who will care for pets or older kids', 'Try the contraction timer in Plan, then Tools'],
  39: ['Set an out-of-office message and hand off work', 'Rest and do something fun together'],
  40: ['Ask what happens if you go past your due date', 'Line up help for the first two weeks at home'],
};

export const GUIDES = [
  {
    id: 'nutrition',
    emoji: '🥗',
    title: 'Eating well',
    intro: 'You do not need a perfect diet, just steady, balanced choices most days.',
    sections: [
      ['A balanced plate', 'Aim for half your plate as fruits and vegetables, plus whole grains, lean protein and dairy or calcium-rich foods. Small, frequent meals can help with nausea and heartburn. Drink plenty of water through the day.'],
      ['Key nutrients', 'Folic acid (at least 400 mcg a day) helps prevent neural tube defects. Iron (27 mg a day) supports your growing blood supply, and calcium (1,000 mg) and vitamin D build baby\'s bones. Choline, iodine and DHA support brain growth. A prenatal vitamin fills gaps but does not replace food.'],
      ['How much extra to eat', 'In the first trimester you usually do not need extra calories. In the second trimester most people need about 340 extra calories a day, and about 450 extra in the third. That is roughly an extra snack or two, like yogurt with fruit or a peanut butter sandwich.'],
      ['Fish and caffeine', 'Eat 8 to 12 ounces a week of low-mercury fish such as salmon, shrimp, cod or canned light tuna. Skip shark, swordfish, king mackerel, tilefish, bigeye tuna and marlin. Keep caffeine under 200 mg a day, about one 12-ounce cup of coffee.'],
      ['Foods to skip', 'Avoid unpasteurized milk and cheese, raw or undercooked meat, eggs and seafood, and deli meats or hot dogs unless heated until steaming. These can carry listeria and other germs. There is no known safe amount of alcohol in pregnancy.'],
      ['Weight gain', 'Healthy weight gain depends on your weight before pregnancy. Your provider will give you a target range and track it at visits. Focus on nourishing food rather than the number on the scale.'],
    ],
  },
  {
    id: 'exercise',
    emoji: '🏃',
    title: 'Staying active',
    intro: 'For most healthy pregnancies, regular movement is safe and helps you feel better.',
    sections: [
      ['How much', 'Aim for about 150 minutes of moderate activity a week, such as 30 minutes on five days. Moderate means you can talk but not sing. If you were not active before, start with 10 minutes and build up slowly.'],
      ['Good choices', 'Walking, swimming, stationary cycling, low-impact aerobics and prenatal yoga or Pilates are great options. Strength training with light to moderate weights is usually fine. If you already ran or lifted before pregnancy, you can often keep going with your provider\'s OK.'],
      ['What to avoid', 'Skip contact sports and activities with a high risk of falls, like skiing, horseback riding or gymnastics. Avoid scuba diving and hot yoga. After the first trimester, avoid lying flat on your back for long stretches.'],
      ['Warning signs to stop', 'Stop and call your provider if you have vaginal bleeding, fluid leaking, regular painful contractions, chest pain, dizziness or fainting, shortness of breath before starting, calf pain or swelling, or a severe headache.'],
      ['Check first', 'Some conditions, like placenta previa after 26 weeks, certain heart or lung problems, or signs of preterm labor, mean exercise should be limited. Always ask your provider what is right for you.'],
    ],
  },
  {
    id: 'sleep',
    emoji: '😴',
    title: 'Sleeping better',
    intro: 'Sleep can get harder as your body changes, but a few tweaks can help.',
    sections: [
      ['Best positions', 'Sleeping on your side, either side, is best as pregnancy goes on. After about 20 weeks, lying flat on your back can press on a large vein and reduce blood flow. If you wake up on your back, just roll over, there is no need to worry.'],
      ['Pillows help', 'A pillow between your knees and one under your belly can ease hip and back strain. A wedge or full body pillow helps many people stay on their side. Extra pillows under your head can ease heartburn.'],
      ['Common sleep stealers', 'Heartburn, leg cramps, needing to pee and a busy mind are all common. Eat dinner a few hours before bed, stretch your calves, and drink more fluids earlier in the day. Snoring that is new or loud is worth mentioning to your provider.'],
      ['Easing insomnia', 'Keep a steady bedtime, a cool dark room and a screen-free wind-down. If you cannot sleep after 20 minutes, get up and do something calm until you feel drowsy. Ask your provider before taking any sleep aid.'],
    ],
  },
  {
    id: 'intimacy',
    emoji: '💞',
    title: 'Sex and intimacy',
    intro: 'For most couples, sex is safe throughout a healthy pregnancy.',
    sections: [
      ['It is usually safe', 'Baby is protected by the amniotic fluid, the strong muscles of the uterus and a mucus plug in the cervix. Sex will not hurt baby in a healthy pregnancy. Orgasm can cause mild cramping, which usually passes quickly.'],
      ['When to avoid it', 'Hold off and check with your provider if you have vaginal bleeding, placenta previa, signs of preterm labor, or your water has broken. Also follow any advice from your provider to avoid sex for other reasons.'],
      ['Changing desire', 'Interest in sex can rise, fall or swing from week to week. Both partners may feel this. Talking openly, without pressure, keeps you close.'],
      ['Comfort tips', 'As your belly grows, side-lying or you-on-top positions are often more comfortable. Use a water-based lubricant if you need it. Use condoms with any new partner to prevent infections.'],
      ['Other ways to connect', 'Closeness is more than sex. Massages, cuddling, baths and simply talking all count. Make small moments for each other part of the week.'],
    ],
  },
  {
    id: 'travel',
    emoji: '✈️',
    title: 'Traveling safely',
    intro: 'Most trips are fine with a little planning, especially in the middle months.',
    sections: [
      ['Best time to go', 'The second trimester, about 14 to 27 weeks, is often the easiest time to travel. Nausea has usually eased and you are not yet very uncomfortable. Check with your provider before any big trip.'],
      ['Flying', 'For a healthy pregnancy, flying is usually OK until about 36 weeks for domestic trips. Many airlines set earlier limits for international flights, so check the rules and carry a note with your due date. Airport scanners are safe.'],
      ['Preventing clots', 'Pregnancy raises the risk of blood clots on long trips. Drink water, walk the aisle every hour or two, flex your ankles while seated and consider compression socks. Call for help if one calf becomes swollen, red or painful.'],
      ['Seatbelt placement', 'Always wear a seatbelt. Put the lap belt low across your hips, under your belly, and the shoulder belt between your breasts and to the side of your belly. Never place either strap across the top of the bump.'],
      ['Where to go', 'Avoid travel to areas with Zika outbreaks and check CDC travel advice for your destination. Some vaccines and malaria medicines are not advised in pregnancy. Know where the nearest hospital is and bring your prenatal records.'],
    ],
  },
  {
    id: 'work',
    emoji: '💼',
    title: 'Work and your rights',
    intro: 'Knowing your rights makes it easier to plan, ask for help and protect your job.',
    sections: [
      ['Telling your boss', 'There is no required time to share the news. Many people wait until after the first trimester or until they need changes at work. Come with a rough plan for your leave and coverage, and put key details in writing.'],
      ['Pregnant Workers Fairness Act', 'Under the PWFA, employers with 15 or more workers must give reasonable accommodations for pregnancy, childbirth and related conditions, unless it causes undue hardship. Examples include more breaks, a stool, water at your desk, time off for visits or lighter lifting. You cannot be forced to take leave if another accommodation would work.'],
      ['FMLA basics', 'The Family and Medical Leave Act gives up to 12 weeks of unpaid, job-protected leave in a year for the birth and care of a new baby. It covers employers with 50 or more workers within 75 miles, if you have worked there 12 months and 1,250 hours. Both parents may qualify.'],
      ['Paid leave and pumping', 'Some states and many employers offer paid family leave, so check your state and your handbook. After birth, the PUMP Act gives most workers break time and a private space, not a bathroom, to pump milk.'],
      ['If something goes wrong', 'Keep notes of conversations and requests. If you are treated unfairly, you can contact HR, your state labor office or the EEOC. Deadlines for filing a complaint can be short.'],
    ],
  },
  {
    id: 'labor-signs',
    emoji: '⏱️',
    title: 'Signs of labor',
    intro: 'Your body gives clues as labor gets close, and it helps to know which ones matter.',
    sections: [
      ['Practice contractions', 'Braxton Hicks contractions feel like tightening across the belly. They are irregular, do not get closer together and often fade when you rest, drink water or change position. They are normal and can start in the second trimester.'],
      ['Real labor', 'True contractions come at regular intervals, get stronger, longer and closer together, and do not stop with rest. Many people feel them start in the back and wrap to the front. A common rule for first babies is to call when they are about 5 minutes apart, last 1 minute, for 1 hour.'],
      ['Water breaking', 'Your water may break with a big gush or a slow trickle you cannot control. Note the time, the color and any smell, and call your provider. Call right away if the fluid is green, brown or bloody.'],
      ['Bloody show', 'As the cervix softens, you may lose the mucus plug or see pink or brown-tinged mucus. Labor may start in hours or days. Bright red bleeding like a period is not normal, so call right away.'],
      ['When to call now', 'Call or go in for heavy bleeding, constant severe belly pain, baby moving less than usual, fever, a bad headache or vision changes, or any labor signs before 37 weeks. Trust your gut. You are never bothering anyone by calling.'],
    ],
  },
  {
    id: 'labor-stages',
    emoji: '🌊',
    title: 'Stages of labor',
    intro: 'Labor unfolds in phases, and knowing them helps you both feel ready.',
    sections: [
      ['Early labor', 'The cervix opens to about 6 centimeters. Contractions are mild to moderate and can be far apart, and this phase can last many hours. Rest, eat lightly, take a shower and stay home until your provider says to come in. Partner: time contractions, keep the mood calm and offer snacks and water.'],
      ['Active labor', 'Contractions get stronger and closer, often 3 to 4 minutes apart, and the cervix opens from about 6 to 10 centimeters. This is usually when you go to the hospital. Partner: help with breathing, position changes, counterpressure on the lower back and speak up about pain relief wishes.'],
      ['Transition', 'This is the most intense and usually shortest part of active labor. Shaking, nausea and feeling like you cannot go on are common, and they mean you are close. Partner: stay close, keep words short and steady, and remind {m:them} it will not last much longer.'],
      ['Pushing', 'Once fully open, you work with contractions to push baby out. This can take minutes or a few hours. Partner: support a leg or shoulders if asked, offer sips of water and cheer each push.'],
      ['Delivering the placenta', 'After baby arrives, mild contractions push out the placenta, usually within 30 minutes. Your provider will check for tears and bleeding. Partner: soak in the moment, help with skin-to-skin and take a few photos if wanted.'],
    ],
  },
  {
    id: 'postpartum',
    emoji: '🌷',
    title: 'After the birth',
    intro: 'The first six weeks are a time to heal, rest and get to know your baby.',
    sections: [
      ['Healing your body', 'Expect bleeding called lochia that starts heavy and red and slowly lightens over 4 to 6 weeks. Soreness, cramping, night sweats and swollen breasts are common. Use ice packs, a peri bottle and pain relief your provider recommends. After a C-section, avoid lifting anything heavier than baby for a while.'],
      ['Rest and help', 'Sleep when you can, accept meals and let others handle chores. Eat well and keep drinking water, especially if breastfeeding. Visitors can wait until you feel ready.'],
      ['Follow-up care', 'Contact your provider within the first 3 weeks after birth, and have a full checkup by 12 weeks. This is a good time to talk about mood, birth control, feeding and any pain. You do not have to wait for the visit if something feels wrong.'],
      ['Warning signs', 'Call 911 or get care right away for chest pain, trouble breathing, seizures or thoughts of harming yourself or baby. Call your provider for soaking a pad in an hour, large clots, fever of 100.4 F or higher, a severe headache or vision changes, or one leg that is swollen and painful. These can happen up to a year after birth.'],
      ['Baby blues or more', 'Up to 80 percent of new parents have the baby blues: tears, mood swings and worry that fade within about 2 weeks. If sadness, anxiety or numbness lasts longer or makes it hard to function, it may be postpartum depression or anxiety, which is common and treatable. Call or text the National Maternal Mental Health Hotline at 1-833-852-6262 any time.'],
    ],
  },
  {
    id: 'partners',
    emoji: '🤝',
    title: 'For partners',
    intro: 'You are not a bystander. Your support makes a real difference at every stage.',
    sections: [
      ['During pregnancy', 'Come to prenatal visits when you can, especially the big scans. Take on more chores as {m:their} energy dips, and learn what is normal week to week. Ask how {m:they} {m:is|are} feeling, then really listen.'],
      ['Getting ready', 'Take the childbirth class together and learn the signs of labor. Handle practical jobs like installing the car seat, planning the route and packing your own bag. Learn {m:their} birth preferences so you can speak up for them.'],
      ['On the big day', 'Your job is comfort and calm. Offer water, a cool cloth, massage and steady words. Keep track of questions for the care team and protect {m:their} space from too many visitors or messages.'],
      ['The first weeks', 'Do diaper changes, burping, baths and skin-to-skin, and take a night shift if baby is bottle fed. Keep the house fed and running. Watch for signs of postpartum depression or anxiety in {m:them} and in yourself, since partners can have it too.'],
      ['Take care of you', 'Sleep, eat and get outside when you can. Talk to a friend or your provider if you feel overwhelmed. A rested partner is a better partner.'],
    ],
  },
];

export const JOURNAL_PROMPTS = [
  'How did you feel the moment you found out?',
  'What is one thing you want to remember about today?',
  'Write a short letter to your baby.',
  'What are you most excited about right now?',
  'What is one worry you can set down today?',
  'Describe how your body feels this week.',
  'What made you smile this week?',
  'What do you hope your baby gets from each of you?',
  'Write about a moment you felt close to your partner lately.',
  'What song would you like to play for your baby?',
  'What family tradition do you want to pass on?',
  'What kind of parent do you hope to be?',
  'What did you crave or avoid this week?',
  'Describe the first time you felt baby move.',
  'What are three things you are grateful for today?',
  'What do you want to say to yourself at the start of this pregnancy?',
  'How has your partner surprised you during this time?',
  'What is something you are learning about yourself?',
  'What does a perfect lazy Sunday with your baby look like?',
  'Which names are on your list, and why?',
  'What advice from someone else has stuck with you?',
  'What would you like to let go of before baby arrives?',
  'Describe your favorite place to rest right now.',
  'What do you imagine baby\'s first laugh will sound like?',
  'Write about the people who will love this baby.',
  'What helps you feel calm when things feel big?',
  'What is a small kindness someone showed you lately?',
  'What do you want your birth day to feel like?',
  'What is one thing you want to do together before baby comes?',
  'Write a thank you note to your body.',
  'What do you remember about your own childhood that you want to repeat?',
  'What do you want to do differently from how you were raised?',
  'How are you and your partner sharing the load right now?',
  'What has been harder than you expected?',
  'What has been easier than you expected?',
  'Describe the nursery or baby corner as you picture it.',
  'What do you want to tell your baby about how you met your partner?',
  'What does support look like for you this week?',
  'What are you looking forward to in the first month?',
  'Write a letter to your baby to read on their 18th birthday.',
];

export const WEEK_TODO_HELP = {
  4: [
    'Pick up the vitamins and set a daily reminder you both see, maybe taking yours at the same time.',
    'Offer to make the call or put the visit in both your calendars, and plan to go with {m:them}.',
  ],
  5: [
    'Go alcohol- and smoke-free with {m:them}, and help find support if {m:they} {m:wants|want} it.',
    'Gather {m:their} medicine list and offer to come along to ask the pharmacist together.',
  ],
  6: [
    'Stock the nightstand with crackers and water, and refill them before {m:they} {m:runs|run} out.',
    'Ask {m:them} who {m:they} {m:wants|want} to tell and when, and follow {m:their} lead on timing.',
  ],
  7: [
    'Start a shared list and add your own questions so you both feel ready for the visit.',
    'Call the insurer or dig into the plan details yourself, and share a short summary.',
  ],
  8: [
    'Reach out to your own relatives for your side of the health history and write it down.',
    'Add this to your shared question list and ask if you can be in the room for the scan.',
  ],
  9: [
    'Learn the safe fish list and cook a salmon, shrimp or cod dinner this week.',
    'Try cutting back with {m:them} and keep good decaf or herbal tea stocked at home.',
  ],
  10: [
    'Read up on the screening options with {m:them} and talk through what you both want to know.',
    'Offer to book the cleaning and handle the reminder so it does not slip.',
  ],
  11: [
    'Learn what NIPT checks for and help {m:them} decide, then go to the blood draw together.',
    'Ask when the NT scan is and clear your schedule so you can be there with {m:them}.',
  ],
  12: [
    'Create the shared note and add a few names of your own to get it going.',
    'Grab the camera, find good light and make the monthly photo your job.',
  ],
  13: [
    'Pull together your recent spending and set up a time to sketch the budget side by side.',
    'Ask how {m:they} {m:wants|want} to tell work and help {m:them} rehearse the conversation.',
  ],
  14: [
    'Check if it is flu season, book shots for you both and go together.',
    'Find a nearby class, sign {m:them} up if {m:they} {m:wants|want}, and handle the drive.',
  ],
  15: [
    'Read about the AFP or quad screen with {m:them} so you can decide together.',
    'Lace up and suggest a short walk after dinner, and keep the habit going most days.',
  ],
  16: [
    'Read your own company leave policy too, so you both know what time off you each have.',
    'Look up your state paid family leave rules and note what applies to each of you.',
  ],
  17: [
    'Offer to shop with {m:them} or order the basics {m:they} {m:picks|pick} so {m:they} {m:is|are} comfy.',
    'Order a body pillow and make room for it in bed without complaint.',
  ],
  18: [
    'Help pick a date that works for you both and block the time to be at the scan.',
    'Talk it through with {m:them}, share how you feel and agree on a plan together.',
  ],
  19: [
    'Set up the registry account and research a few big items so {m:they} {m:has|have} less to do.',
  ],
  20: [
    'Plan and book the date night yourself, from the reservation to the sitter if needed.',
    'Research easy, low-stress trip ideas and handle the bookings if {m:they} {m:wants|want} to go.',
  ],
  21: [
    'Take the lead on calling daycares or sitters and get both of you on the waitlists.',
  ],
  22: [
    'Find a class that fits both your schedules, sign up together and plan to attend every session.',
    'Ask to join the feeding class too so you can support {m:them} after the baby comes.',
  ],
  23: [
    'Come with a concrete offer of which nights and chores you will own, and ask what {m:they} {m:needs|need}.',
  ],
  24: [
    'Help book the glucose test and offer to drive and keep {m:them} company while {m:they} {m:waits|wait}.',
    'Learn the preterm labor signs yourself and save the provider number in your phone.',
  ],
  25: [
    'Research cord blood banking and donation costs, then share what you find with {m:them}.',
    'Ask how you can help {m:them} remember, like a shared daily reminder.',
  ],
  26: [
    'Do the pediatrician research, read reviews and set up the meet-and-greet calls.',
  ],
  27: [
    'Get your own Tdap shot too, since anyone close to the baby should be up to date.',
    'Add this question to the visit list and help {m:them} keep track of any follow-up shots.',
  ],
  28: [
    'Sit with {m:them} during kick counts, keep a log, and learn when to call the provider.',
    'Add the new visit schedule to your calendar and try to make as many as you can.',
  ],
  29: [
    'Book the tour, plan to go together and note parking and the entrance to use.',
  ],
  30: [
    'Ask {m:them} what matters most and offer to draft and print the sheet together.',
    'File your own leave paperwork too and check that both of you have HR confirmations.',
  ],
  31: [
    'Offer to fill out the pre-registration forms and keep the confirmation handy.',
  ],
  32: [
    'Ask the provider whether the RSV vaccine fits {m:their} timing and help book it.',
    'Learn safe sleep basics yourself and set up the crib with nothing else in it.',
  ],
  33: [
    'Call the chosen pediatrician to confirm and send the name to the hospital for {m:them}.',
    'Look up the enrollment deadline and set a reminder so the baby gets added on time.',
  ],
  34: [
    'Plan a cooking afternoon and do most of the chopping, cooking and labeling yourself.',
    'Do the practice drives yourself and note the fastest route and where to park.',
  ],
  35: [
    'Install the car seat yourself and book a check with a certified technician.',
    'Pack your own bag and help {m:them} finish {m:their} bag so both are ready by the door.',
  ],
  36: [
    'Put the GBS swab date in your calendar and ask {m:them} what it means for labor.',
    'Take over the laundry and fold and put away the baby clothes and swaddles.',
  ],
  37: [
    'Assemble the station yourself so diapers, wipes and feeding gear are within easy reach.',
    'Save the number in both phones right now and confirm {m:they} {m:has|have} it too.',
  ],
  38: [
    'Line up a sitter or a friend for pets and kids, and share a backup plan with {m:them}.',
    'Open the contraction timer with {m:them} and practice so you can run it during labor.',
  ],
  39: [
    'Set up your own out-of-office and handoff too so you can step away the moment labor starts.',
    'Plan a cozy, low-key day for the two of you and take care of the details.',
  ],
  40: [
    'Go to the visit with {m:them} and ask about the plan if the baby is late.',
    'Organize a schedule of family and friends for meals and help, and be the point person.',
  ],
};

// ── Expert review checklist (Settings → Expert review) ──
// Fill REVIEWS as sign-offs come in: { sectionId: { by: 'Name, credential', field: 'Specialty', date: 'Nov 2026', checkedBy: 'Name, credential' } }
export const REVIEWS = {}
export const REVIEW_SECTIONS = [
  { id: 'redflags', title: 'When to call / warning signs', what: 'Bleeding, pain, fever, reduced movement, preeclampsia signs', signoff: 'OB or labor & delivery nurse', size: '24 signs', time: '30 min', pri: 1 },
  { id: 'meds', title: 'Medicines', what: 'Pain relievers, cold and allergy meds, antibiotics, what to ask about', signoff: 'Pharmacist (or OB)', size: '42 items', time: '60 min', pri: 1 },
  { id: 'alerts', title: 'Kick, contraction & blood pressure alerts', what: '10 movements in 2 hours; 5-1-1; BP 140/90 and 160/110', signoff: 'Labor & delivery nurse or OB', size: '3 alerts', time: '20 min', pri: 1 },
  { id: 'postpartum', title: 'Postpartum & newborn warning signs', what: 'Call-911 and call-the-doctor lists, mood check, crisis lines', signoff: 'Postpartum or pediatric nurse', size: '28 signs', time: '30 min', pri: 1 },
  { id: 'foods', title: 'Food & drink safety', what: 'Listeria, mercury, caffeine, raw foods, herbal teas', signoff: 'Registered dietitian or OB nurse', size: '105 foods, 14 rules', time: '60 min', pri: 2 },
  { id: 'symptoms', title: 'Symptoms', what: 'What\'s normal, how the partner can help, when to call', signoff: 'OB or labor & delivery nurse', size: '25 symptoms', time: '45 min', pri: 2 },
  { id: 'weeks', title: 'Week by week & stages', what: 'Baby, body and partner notes for weeks 4 to 42, stages, milestones', signoff: 'OB nurse or midwife', size: '39 weeks', time: '60 min', pri: 2 },
  { id: 'labor', title: 'Labor guides & birth plan', what: 'Signs of labor, stages of labor, birth plan options', signoff: 'Labor & delivery nurse or midwife', size: '2 guides, 8 topics', time: '30 min', pri: 2 },
  { id: 'baby', title: 'Baby\'s first year', what: 'Month-by-month skills, checkups, vaccine schedule, newborn tips', signoff: 'Pediatrician or pediatric nurse', size: '13 months, 8 visits', time: '45 min', pri: 2 },
  { id: 'movement', title: 'Movement, sleep & recovery', what: 'Exercise, sleep positions, back pain, recovery after birth', signoff: 'Physical or occupational therapist (pelvic floor: a pelvic-floor specialist)', size: '3 guides', time: '30 min', pri: 3 },
  { id: 'guides', title: 'Other guides', what: 'Eating well, sex, travel, work rights, for partners', signoff: 'OB nurse or midwife', size: '5 guides', time: '40 min', pri: 3 },
  { id: 'todos', title: 'Weekly to-dos & checklists', what: 'To-dos for weeks 4 to 40, hospital bag, questions for the OB', signoff: 'OB nurse or midwife', size: '68 to-dos, 45 items', time: '30 min', pri: 3 },
  { id: 'babypics', title: 'Baby illustrations', what: 'What baby looks like each week, 4 to 40 (illustrations, not photos)', signoff: 'OB, sonographer or embryology instructor', size: '37 pictures', time: '20 min', pri: 2 },
  { id: 'loss', title: 'After a loss', what: 'Physical recovery, grief, partner support, resources', signoff: 'OB, midwife or bereavement nurse', size: '17 items', time: '15 min', pri: 3 },
]
export const REVIEW_STEPS = [
  ['Source check first', 'Anyone with clinical training compares each item to the official page it\'s based on (ACOG, CDC, AAP, FDA) and flags anything that doesn\'t match, is out of date, or reads unclearly.'],
  ['Then a specialist signs off', 'Someone who works in that field reads the checked section and gives the final OK. Their name, credential and the date go on the section.'],
  ['Fix, confirm, credit', 'Every requested change gets made, the reviewer confirms the final wording, and only then does their name appear here.'],
  ['Re-check yearly', 'Guidance changes, vaccines most often. Each section gets a quick re-check once a year.'],
]
export const REVIEW_WHERE = [
  ['Your own OB or midwife', 'Ask at a visit whether they\'d look over the warning signs and medicines lists. Many will.'],
  ['A pharmacist', 'Local independent pharmacists are often happy to look over a medicines list when the counter is quiet.'],
  ['Hospital nurses', 'Labor & delivery, postpartum and pediatric units. A short, polite email to the unit educator works better than a cold visit.'],
  ['Residency programs and nursing schools', 'OB-GYN and pediatric residents and nursing or midwifery students often need review or quality projects.'],
  ['Introductions', 'Ask anyone in health care: "Do you know someone in labor & delivery, a pharmacist or an OB who might give 30 minutes?"'],
  ['Paid review, if it goes public', 'Freelance clinicians run about $150 to $400 an hour; a full review is roughly 40 to 80 hours.'],
]
export const REVIEW_ASK = 'Hi! We built a pregnancy app for couples called Together, and before sharing it more widely we want the health information checked by people who work in the field.\n\nWould you be willing to review one section that matches your work? It takes about 30 to 60 minutes. You\'d mark each item as right, needs a change, or not sure, and your name only goes on it if you approve the final wording.\n\nThe sections that need someone most are the warning signs, medicines, labor alerts, and postpartum and newborn warning signs. Thank you!'

// Other things about the same size, to swipe through after the main one.
// Every picture shows exactly that thing.
export const SIZE_ALTS = {
  4: [['grain of salt', SALT], ['grain of sand', SAND]],
  5: [['apple seed', APPLE_SEED], ['peppercorn', PEPPERCORN]],
  6: [['jelly bean', JELLY_BEAN], ['grain of rice', RICE]],
  7: [['coffee bean', COFFEE_BEAN], ['jelly bean', JELLY_BEAN]],
  8: [['olive', '🫒'], ['gumball', GUMBALL]],
  9: [['olive', '🫒'], ['peanut in its shell', '🥜']],
  10: [['chestnut', '🌰'], ['peanut in its shell', '🥜']],
  11: [['garlic bulb', '🧄'], ['large strawberry', '🍓']],
  12: [['egg', '🥚'], ['garlic bulb', '🧄']],
  13: [['tomato', '🍅'], ['egg', '🥚']],
  14: [['orange', '🍊'], ['onion', '🧅']],
  15: [['orange', '🍊'], ['potato', '🥔']],
  16: [['softball', '🥎'], ['potato', '🥔']],
  17: [['sweet potato', '🍠'], ['big potato', '🥔']],
  18: [['sweet potato', '🍠'], ['mango', '🥭']],
  19: [['bell pepper', '🫑'], ['sweet potato', '🍠']],
  20: [['carrot', '🥕'], ['cucumber', '🥒']],
  21: [['banana', '🍌'], ['baguette', '🥖']],
  22: [['baguette', '🥖'], ['cucumber', '🥒']],
  23: [['baguette', '🥖'], ['mango', '🥭']],
  24: [['baguette', '🥖'], ['eggplant', '🍆']],
  25: [['eggplant', '🍆'], ['loaf of bread', '🍞']],
  26: [['loaf of bread', '🍞'], ['eggplant', '🍆']],
  27: [['loaf of bread', '🍞'], ['coconut', '🥥']],
  28: [['coconut', '🥥'], ['pineapple', '🍍']],
  29: [['coconut', '🥥'], ['pineapple', '🍍']],
  30: [['pineapple', '🍍'], ['football', '🏈']],
  31: [['pineapple', '🍍'], ['cantaloupe', '🍈']],
  32: [['cantaloupe', '🍈'], ['coconut', '🥥']],
  33: [['cantaloupe', '🍈'], ['pumpkin', '🎃']],
  34: [['pineapple', '🍍'], ['pumpkin', '🎃']],
  35: [['cantaloupe', '🍈'], ['pumpkin', '🎃']],
  36: [['honeydew melon', '🍈'], ['small watermelon', '🍉']],
  37: [['pumpkin', '🎃'], ['honeydew melon', '🍈']],
  38: [['pumpkin', '🎃'], ['honeydew melon', '🍈']],
  39: [['pumpkin', '🎃']], 40: [['pumpkin', '🎃']], 41: [['pumpkin', '🎃']], 42: [['pumpkin', '🎃']],
}
export const SIZE_NOTE = 'Sizes are approximate: measured crown to rump until about 20 weeks, then head to toe. Every baby grows at their own pace.'

// ── Original size-comparison art (drawn for Together) ──
const ART_1 = {
  'poppy seed': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32.5) rotate(-10) scale(6.2 5.8)"><path d="M-.95-.1C-.95-.55-.55-.7-.25-.55C-.05-.45.05-.45.25-.55C.55-.7.95-.55.95-.1C.95.4.5.62 0 .62C-.5.62-.95.4-.95-.1Z" fill="#555b75" stroke="#80869f" stroke-width="0.12"/><path d="M.95-.1C.95.4.5.62 0 .62C-.5.62-.85.42-.92.2C-.5.42.2.42.55.2C.8.05.9-.05.95-.1Z" fill="#3d4159"/><ellipse cx="-.45" cy="-.28" rx=".24" ry=".09" transform="rotate(-18 -.45 -.28)" fill="#959cb8"/></g></svg>',
  'grain of salt': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 25.2L38.6 28.4V35.6L32 38.8L25.4 35.6V28.4Z" fill="#bdb4a6" stroke="#bdb4a6" stroke-width="1.2" stroke-linejoin="round"/><path d="M32 25.6L38.2 28.6L32 31.6L25.8 28.6Z" fill="#f4efe6"/><path d="M25.8 28.6L32 31.6V38.4L25.8 35.4Z" fill="#e0d9cc"/><path d="M32 31.6L38.2 28.6V35.4L32 38.4Z" fill="#c9c0b2"/></svg>',
  'grain of sand': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M26.5 31L29 27L34.5 26.2L38.5 29.5L37.5 35L32 37.6L27.5 35.6Z" fill="#c99d5c" stroke="#c99d5c" stroke-width="1.6" stroke-linejoin="round"/><path d="M26.5 31L29 27L34.5 26.2L33 31.8Z" fill="#ebcf98"/><path d="M26.5 31L33 31.8L32 37.6L27.5 35.6Z" fill="#d9b373"/><path d="M34.5 26.2L38.5 29.5L37.5 35L32 37.6L33 31.8Z" fill="#b48748"/></svg>',
  'sesame seed': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32) rotate(28) scale(7.8)"><path d="M0-1C.45-.62.62-.05.6.35C.58.78.3 1 0 1C-.3 1-.58.78-.6.35C-.62-.05-.45-.62 0-1Z" fill="#ecd8a6" stroke="#c4a670" stroke-width="0.1"/><path d="M0-1C.45-.62.62-.05.6.35C.58.78.3 1 0 1C-.12 1-.2.95-.25.9C.1.85.32.6.32.25C.32-.2.2-.6 0-1Z" fill="#ccb07a"/><ellipse cx="-.2" cy="-.1" rx=".11" ry=".35" transform="rotate(12 -.2 -.1)" fill="#fbf1d8"/></g></svg>',
  'apple seed': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32) rotate(-28) scale(9.5)"><path d="M0-1C.45-.62.62-.05.6.35C.58.78.3 1 0 1C-.3 1-.58.78-.6.35C-.62-.05-.45-.62 0-1Z" fill="#7a4322" stroke="#9c6038" stroke-width="0.08"/><path d="M0-1C.45-.62.62-.05.6.35C.58.78.3 1 0 1C-.12 1-.2.95-.25.9C.1.85.32.6.32.25C.32-.2.2-.6 0-1Z" fill="#552c12"/><ellipse cx="-.2" cy="-.1" rx=".11" ry=".35" transform="rotate(12 -.2 -.1)" fill="#b2774c"/></g></svg>',
  'peppercorn': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><circle cx="32" cy="32" r="8.5" fill="#4f3d31" stroke="#76604e" stroke-width="0.8"/><path d="M38.22 26.2A8.5 8.5 0 0 1 26.2 38.22A11.05 11.05 0 0 0 38.22 26.2Z" fill="#35281f"/><ellipse cx="28.43" cy="28.43" rx="2.38" ry="1.48" transform="rotate(-45 28.43 28.43)" fill="#7f6956"/><path d="M27.2 31.5C28.6 30.2 30.2 30.8 31 29.2M33 35.6C34.6 35.3 35.4 33.8 37 34M31.5 26.4C32.6 27.6 34.4 27.2 35.2 28.6M28.4 35.8C29.6 34.8 30.8 36.4 32 35.4" stroke="#33261e" stroke-width=".8" fill="none" stroke-linecap="round"/><path d="M34 31.2C35 30.4 36.2 31 37.4 30.4" stroke="#8a7461" stroke-width=".7" fill="none" stroke-linecap="round"/></svg>',
  'sweet pea': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><circle cx="41" cy="37" r="13" fill="#6caf43"/><path d="M50.51 28.13A13 13 0 0 1 32.13 46.51A16.9 16.9 0 0 0 50.51 28.13Z" fill="#4e8b2e"/><ellipse cx="35.54" cy="31.54" rx="3.9" ry="2.42" transform="rotate(-45 35.54 31.54)" fill="#a3d47a"/><circle cx="26" cy="32" r="15.6" fill="#4e8b2e"/><circle cx="26" cy="32" r="15" fill="#7cc350"/><path d="M36.97 21.77A15 15 0 0 1 15.77 42.97A19.5 19.5 0 0 0 36.97 21.77Z" fill="#5a9c36"/><ellipse cx="19.7" cy="25.7" rx="4.8" ry="2.98" transform="rotate(-45 19.7 25.7)" fill="#b8e690"/><path d="M39 24.5C40 19 44 16 48 17.5C51 18.7 50.5 22.5 47.6 22.4C45.6 22.3 45.6 19.8 47.2 19.6" stroke="#5a9c36" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M35.5 25C36 20 33 16.5 28 16.5C29 20.5 31.5 24 35.5 25Z" fill="#6caf43"/><path d="M35.5 25C34 21.5 31.5 19 28 16.5C31 22 33 24 35.5 25Z" fill="#4e8b2e"/></svg>',
  'jelly bean': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32) rotate(-14) scale(23 21)"><path d="M-.95-.1C-.95-.55-.55-.7-.25-.55C-.05-.45.05-.45.25-.55C.55-.7.95-.55.95-.1C.95.4.5.62 0 .62C-.5.62-.95.4-.95-.1Z" fill="#e8485c"/><path d="M.95-.1C.95.4.5.62 0 .62C-.5.62-.85.42-.92.2C-.5.42.2.42.55.2C.8.05.9-.05.95-.1Z" fill="#c22f46"/><ellipse cx="-.45" cy="-.28" rx=".24" ry=".09" transform="rotate(-18 -.45 -.28)" fill="#ff9eaa"/></g><ellipse cx="22" cy="27" rx="2" ry="1.3" transform="rotate(-30 22 27)" fill="#fff0ec"/></svg>',
  'grain of rice': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32) rotate(-35)"><path d="M-24 0C-24-7-15-9.4 0-9.4C15-9.4 24-6 24 1C24 7 15 9.4 0 9.4C-15 9.4-24 7-24 0Z" fill="#cbbfa4"/><path d="M-23.2 0C-23.2-6.4-14.6-8.6 0-8.6C14.6-8.6 23.2-5.6 23.2 1C23.2 6.4 14.6 8.6 0 8.6C-14.6 8.6-23.2 6.4-23.2 0Z" fill="#f1ebdc"/><path d="M23.2 1C23.2 6.4 14.6 8.6 0 8.6C-14.6 8.6-23.2 6.4-23.2 0C-18 4.2-6 5 6 4.2C15 3.6 21 2.6 23.2 1Z" fill="#d9cfb8"/><ellipse cx="-8" cy="-4.6" rx="9" ry="1.8" fill="#fcf9f2"/><path d="M19.5-5.2C21.6-3.4 21.6-.8 20.4 1.2" stroke="#d2c6ac" stroke-width="1.2" fill="none" stroke-linecap="round"/></g></svg>',
  'blueberry': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><circle cx="32" cy="34" r="22" fill="#5165a8"/><path d="M48.09 19A22 22 0 0 1 17 50.09A29.7 29.7 0 0 0 48.09 19Z" fill="#3a4a85"/><ellipse cx="22.76" cy="24.76" rx="5.72" ry="3.55" transform="rotate(-45 22.76 24.76)" fill="#93a3d8"/><ellipse cx="22.5" cy="25" rx="7" ry="4" transform="rotate(-40 22.5 25)" fill="#6a7dbd" opacity=".9"/><ellipse cx="21" cy="23.5" rx="3" ry="1.8" transform="rotate(-40 21 23.5)" fill="#a9b7e6"/><circle cx="35" cy="19.5" r="5.4" fill="#3a4a85"/><path d="M35 15.4L36.2 18.4L39.2 18.6L36.9 20.6L37.7 23.6L35 21.9L32.3 23.6L33.1 20.6L30.8 18.6L33.8 18.4Z" fill="#25305c" stroke="#25305c" stroke-width=".8" stroke-linejoin="round"/></svg>',
  'coffee bean': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32) rotate(30) scale(17 23)"><circle r="1" fill="#7c4b2c"/><path d="M0.29 -0.96A1 1 0 0 1 -0.22 0.97A1.3 1.3 0 0 0 0.29 -0.96Z" fill="#5a321b"/><ellipse cx="-0.43" cy="-0.12" rx="0.2" ry="0.12" transform="rotate(-45 -0.43 -0.12)" fill="#a87150"/></g><g transform="translate(32 32) rotate(30)"><path d="M0-20C-7.5-8 7.5 8 0 20" stroke="#3e2112" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M-1.6-17.5C-6.5-8.5-1-4.5-1.2 0" stroke="#9a6644" stroke-width="1" fill="none" stroke-linecap="round"/></g></svg>',
  'kidney bean': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32) rotate(18) scale(25 19)"><path d="M-.95-.1C-.95-.55-.55-.7-.25-.55C-.05-.45.05-.45.25-.55C.55-.7.95-.55.95-.1C.95.4.5.62 0 .62C-.5.62-.95.4-.95-.1Z" fill="#922c32" stroke="#a6434a" stroke-width="0.04"/><path d="M.95-.1C.95.4.5.62 0 .62C-.5.62-.85.42-.92.2C-.5.42.2.42.55.2C.8.05.9-.05.95-.1Z" fill="#6b1c22"/><ellipse cx="-.45" cy="-.28" rx=".24" ry=".09" transform="rotate(-18 -.45 -.28)" fill="#c76268"/></g></svg>',
  'olive': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M38 21C41 13 48 8.5 56 7.5C53 14 46 19.5 38 21Z" fill="#9fae7c"/><path d="M38 21C44 16 50 12 56 7.5C53 14 46 19.5 38 21Z" fill="#7d8c5c"/><path d="M37.6 20.8L39.4 18" stroke="#6d6a35" stroke-width="1.8" stroke-linecap="round"/><g transform="translate(30 36) rotate(30) scale(15 19.5)"><circle r="1" fill="#7f9236"/><path d="M0.29 -0.96A1 1 0 0 1 -0.22 0.97A1.3 1.3 0 0 0 0.29 -0.96Z" fill="#5d6d21"/><ellipse cx="-0.43" cy="-0.12" rx="0.2" ry="0.12" transform="rotate(-45 -0.43 -0.12)" fill="#b6c76c"/></g><circle cx="38.2" cy="21.4" r="1.7" fill="#6d6a35"/><circle cx="21.6" cy="50.4" r="1.6" fill="#4b5818"/><circle cx="21.6" cy="50.4" r=".7" fill="#a0ae5a"/></svg>',
  'gumball': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#ee6197"/><path d="M48.09 17A22 22 0 0 1 17 48.09A29.7 29.7 0 0 0 48.09 17Z" fill="#c9447b"/><ellipse cx="22.76" cy="22.76" rx="7.48" ry="4.64" transform="rotate(-45 22.76 22.76)" fill="#ffc4d9"/><circle cx="18.6" cy="20.4" r="2.2" fill="#fff4f0"/><path d="M44 46.5C47.5 44 50 40.5 51 36.5" stroke="#f58db4" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
  'cherry': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M22 31C24 22 30 14 37 9.5M42 34C40 25 39 17 37 9.5" stroke="#6f7d34" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M37 9.5C41 6 48 6.5 52 10C47 13.5 41 13 37 9.5Z" fill="#6fae4a"/><path d="M37 9.5C42 10.5 47 10.5 52 10C47 13.5 41 13 37 9.5Z" fill="#4f8a34"/><circle cx="42" cy="45" r="12" fill="#c6233a"/><path d="M50.78 36.82A12 12 0 0 1 33.82 53.78A15.6 15.6 0 0 0 50.78 36.82Z" fill="#951629"/><ellipse cx="36.96" cy="39.96" rx="3.6" ry="2.23" transform="rotate(-45 36.96 39.96)" fill="#f27884"/><circle cx="23" cy="42" r="13.6" fill="#951629"/><circle cx="23" cy="42" r="13" fill="#d02a40"/><path d="M32.51 33.13A13 13 0 0 1 14.13 51.51A16.9 16.9 0 0 0 32.51 33.13Z" fill="#9c182c"/><ellipse cx="17.54" cy="36.54" rx="3.9" ry="2.42" transform="rotate(-45 17.54 36.54)" fill="#f6808a"/><path d="M21.5 30.5C22.3 29.5 23.5 29.5 24.2 30.6M40.8 34.3C41.6 33.2 42.8 33.3 43.4 34.4" stroke="#7a1020" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
  'peanut in its shell': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="translate(32 32) rotate(35)"><path d="M0-23C7-23 11-18 11-12C11-6 7-3 7 0C7 3 12 5 12 12C12 19 7 24 0 24C-7 24-12 19-12 12C-12 5-7 3-7 0C-7-3-11-6-11-12C-11-18-7-23 0-23Z" fill="#d9ad6e"/><path d="M0-23C7-23 11-18 11-12C11-6 7-3 7 0C7 3 12 5 12 12C12 19 7 24 0 24C4.5 22 8.4 18 8.4 12C8.4 6 4.6 3 4.6 0C4.6-3 8-7 8-12C8-18 4.4-21.6 0-23Z" fill="#b98b4d"/><ellipse cx="-6" cy="-15" rx="2" ry="4.2" fill="#f0d6a4"/><ellipse cx="-7" cy="9" rx="2" ry="4.2" fill="#f0d6a4"/><path d="M-6.4 0H6.4" stroke="#b98b4d" stroke-width="1.2" stroke-linecap="round"/><g fill="#b98b4d"><circle cx="-2" cy="-18" r="1"/><circle cx="3" cy="-15" r="1"/><circle cx="-1" cy="-11" r="1"/><circle cx="4" cy="-7" r="1"/><circle cx="-4" cy="-6" r="1"/><circle cx="0" cy="5" r="1"/><circle cx="-4" cy="15" r="1"/><circle cx="1" cy="10" r="1"/><circle cx="1" cy="18" r="1"/><circle cx="-7" cy="17.5" r=".9"/></g><g fill="#9a7038"><circle cx="5.5" cy="12" r="1"/><circle cx="6" cy="-13" r=".9"/></g></g></svg>',
  'strawberry': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 58C22 54 11 42 11 30C11 21 18 17 25 18C28 18.5 30 19.5 32 19.5C34 19.5 36 18.5 39 18C46 17 53 21 53 30C53 42 42 54 32 58Z" fill="#e03b40"/><path d="M53 30C53 42 42 54 32 58C38.5 52 46 42 47 32C47.5 26 46.5 22 44.5 18.6C49.5 20 53 24 53 30Z" fill="#b8242f"/><ellipse cx="19.5" cy="29" rx="3.4" ry="6" transform="rotate(25 19.5 29)" fill="#f37d75"/><g fill="#f7d572"><ellipse cx="22" cy="38" rx=".9" ry="1.5"/><ellipse cx="28" cy="31" rx=".9" ry="1.5"/><ellipse cx="36" cy="30" rx=".9" ry="1.5"/><ellipse cx="43" cy="33" rx=".9" ry="1.5"/><ellipse cx="31" cy="39" rx=".9" ry="1.5"/><ellipse cx="39" cy="41" rx=".9" ry="1.5"/><ellipse cx="25" cy="45" rx=".9" ry="1.5"/><ellipse cx="34" cy="48" rx=".9" ry="1.5"/><ellipse cx="17" cy="33" rx=".9" ry="1.5"/></g><g fill="#e3b44f"><ellipse cx="46" cy="40" rx=".9" ry="1.5"/><ellipse cx="41" cy="49" rx=".9" ry="1.5"/></g><path d="M32 22C27 22 20 21.5 16 18C21 16.5 25 16.5 28 17.5C26 14.5 26 12 27 10C30 12 31.5 14 32 16.5C32.5 14 34 12 37 10C38 12 38 14.5 36 17.5C39 16.5 43 16.5 48 18C44 21.5 37 22 32 22Z" fill="#5aa547"/><path d="M32 22C37 22 44 21.5 48 18C43 18.5 37 19.5 32 19.5ZM32 16.5C32.5 14 34 12 37 10C36.5 13 35 15.5 32 18Z" fill="#3f8636"/><path d="M32 17C32 13 32.8 9.5 34.5 7" stroke="#3f8636" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
};
const ART_2 = {
  'chestnut': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 9C38 14 54 23 54 37C54 49 44 55 32 55C20 55 10 49 10 37C10 23 26 14 32 9Z" fill="#5f2e15"/><path d="M32 9C38 14 54 23 54 37C54 49 44 55 32 55C20 55 10 49 10 37C10 23 26 14 32 9Z" fill="#8a4520" transform="matrix(0.92 0 0 0.92 1.76 1.92)"/><path d="M11.5 44C16 51 24 55 32 55C40 55 48 51 52.5 44C46 47.5 40 48.5 32 48.5C24 48.5 18 47.5 11.5 44Z" fill="#c9a676"/><path d="M14 45.5C19 47.5 25 48.5 32 48.5C39 48.5 45 47.5 50 45.5C46 49 40 50.5 32 50.5C24 50.5 18 49 14 45.5Z" fill="#e2c799"/><ellipse cx="22" cy="27" rx="4.5" ry="9" fill="#b8703f" transform="rotate(-30 22 27)"/><ellipse cx="21" cy="25" rx="1.6" ry="5" fill="#efd2b0" transform="rotate(-30 21 25)" opacity="0.85"/><path d="M30.5 10L32 5.5L33.5 10Z" fill="#c9a676"/></svg>',
  'kiwi': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="matrix(1.1 0 0 1.1 -2.9 -4.2)"><g transform="rotate(-20 24 27)"><ellipse cx="24" cy="27" rx="18" ry="14.5" fill="#6b4e2a"/><ellipse cx="22.7" cy="25.7" rx="16.6" ry="13.1" fill="#8d6b3f"/><ellipse cx="18" cy="21" rx="6" ry="3" fill="#a98757" transform="rotate(0 18 21)"/></g><circle cx="14" cy="22" r=".7" fill="#5e4425"/><circle cx="19" cy="17" r=".7" fill="#5e4425"/><circle cx="25" cy="20" r=".7" fill="#5e4425"/><circle cx="30" cy="15" r=".7" fill="#5e4425"/><circle cx="16" cy="30" r=".7" fill="#5e4425"/><circle cx="22" cy="27" r=".7" fill="#5e4425"/><circle cx="29" cy="24" r=".7" fill="#5e4425"/><circle cx="34" cy="20" r=".7" fill="#5e4425"/><circle cx="20" cy="35" r=".7" fill="#5e4425"/><circle cx="27" cy="32" r=".7" fill="#5e4425"/><circle cx="7.6" cy="32.5" r="1.3" fill="#5e4425"/><circle cx="40" cy="39" r="16" fill="#6b4e2a"/><circle cx="39.5" cy="38.5" r="14.6" fill="#8fc24a"/><circle cx="40" cy="39" r="14" fill="#7db23c" opacity=".0"/><path d="M54.1 39A14.1 14.1 0 0 1 40 53.1A12.5 12.5 0 0 0 54.1 39Z" fill="#6e9f30"/><circle cx="40" cy="39" r="8.5" fill="#a8d468"/><ellipse cx="40" cy="39" rx="4.2" ry="3.4" fill="#eef2cf"/><ellipse cx="46.6" cy="39" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(0 46.6 39)"/><ellipse cx="45.72" cy="42.3" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(30 45.72 42.3)"/><ellipse cx="43.3" cy="44.72" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(60 43.3 44.72)"/><ellipse cx="40" cy="45.6" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(90 40 45.6)"/><ellipse cx="36.7" cy="44.72" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(120 36.7 44.72)"/><ellipse cx="34.28" cy="42.3" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(150 34.28 42.3)"/><ellipse cx="33.4" cy="39" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(180 33.4 39)"/><ellipse cx="34.28" cy="35.7" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(210 34.28 35.7)"/><ellipse cx="36.7" cy="33.28" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(240 36.7 33.28)"/><ellipse cx="40" cy="32.4" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(270 40 32.4)"/><ellipse cx="43.3" cy="33.28" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(300 43.3 33.28)"/><ellipse cx="45.72" cy="35.7" rx="1.1" ry=".6" fill="#2a2118" transform="rotate(330 45.72 35.7)"/><ellipse cx="33" cy="31" rx="3.5" ry="1.6" fill="#c4e48e" transform="rotate(-40 33 31)" opacity="0.9"/></g></svg>',
  'garlic bulb': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M28.5 16C28.5 11 29.5 8 31 6.5L33 6.5C34.5 8 35.5 11 35.5 16Z" fill="#d9ccb0"/><path d="M33 6.5C34.5 8 35.5 11 35.5 16L33.5 16C33.5 12 33.2 9 33 6.5Z" fill="#c2b291"/><path d="M32 15C22 20 10 28 11 40C12 50 22 55 32 55C42 55 52 50 53 40C54 28 42 20 32 15Z" fill="#d9ccb4" stroke="#cbbb9c" stroke-width="1"/><path d="M32 15C22 20 10 28 11 40C12 50 22 55 32 55C42 55 52 50 53 40C54 28 42 20 32 15Z" fill="#f4efe6" transform="matrix(0.93 0 0 0.93 1.54 1.96)"/><g fill="none" stroke="#d3c3a3" stroke-width="1.1" stroke-linecap="round"><path d="M31 17C25 26 23 40 26 54"/><path d="M33 17C39 26 41 40 38 54"/><path d="M30 18C20 25 15 37 17.5 49"/><path d="M34 18C44 25 49 37 46.5 49"/></g><path d="M27 53C29 46 35 46 37 53Z" fill="#e8d6dc" opacity=".7"/><ellipse cx="20" cy="33" rx="3" ry="7" fill="#fbf8f2" transform="rotate(-20 20 33)"/><g stroke="#b9a27c" stroke-width="1" stroke-linecap="round"><path d="M29 55.5L27.5 58.5"/><path d="M32 55.8V59"/><path d="M35 55.5L36.5 58.5"/></g></svg>',
  'lime': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-20 32 32)"><ellipse cx="54" cy="32" rx="2.4" ry="2.2" fill="#5a8f2a"/><ellipse cx="10" cy="32" rx="1.8" ry="1.8" fill="#6f9f33"/><ellipse cx="32" cy="32" rx="22" ry="19" fill="#4f8a26"/><ellipse cx="30.6" cy="30.6" rx="20.4" ry="17.4" fill="#78b13e"/><ellipse cx="22" cy="25" rx="7" ry="3.5" fill="#a3d06a" transform="rotate(0 22 25)"/><ellipse cx="19" cy="24" rx="2.5" ry="1.2" fill="#d4eca8" transform="rotate(0 19 24)"/></g><circle cx="36" cy="30" r=".7" fill="#64a032"/><circle cx="40" cy="38" r=".7" fill="#64a032"/><circle cx="30" cy="40" r=".7" fill="#64a032"/><circle cx="44" cy="30" r=".7" fill="#64a032"/><circle cx="35" cy="45" r=".7" fill="#64a032"/><circle cx="26" cy="34" r=".7" fill="#64a032"/></svg>',
  'egg': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 8C43 8 50 27 50 38C50 50 42 56 32 56C22 56 14 50 14 38C14 27 21 8 32 8Z" fill="#ddd1bc" stroke="#d2c4ab" stroke-width="1"/><path d="M32 8C43 8 50 27 50 38C50 50 42 56 32 56C22 56 14 50 14 38C14 27 21 8 32 8Z" fill="#f4efe6" transform="matrix(0.92 0 0 0.92 1.92 1.92)"/><ellipse cx="23" cy="26" rx="3.5" ry="8" fill="#fcf9f3" transform="rotate(-20 23 26)"/></svg>',
  'lemon': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="matrix(1.16 0 0 1.16 -5.12 -5.12)"><g transform="rotate(-25 32 32)"><path d="M7 32C9 30.5 11.5 29.5 13.5 27.5C19 16 45 16 50.5 27.5C52.5 29.5 55 30.5 57 32C55 33.5 52.5 34.5 50.5 36.5C45 48 19 48 13.5 36.5C11.5 34.5 9 33.5 7 32Z" fill="#ddb021"/><path d="M7 32C9 30.5 11.5 29.5 13.5 27.5C19 16 45 16 50.5 27.5C52.5 29.5 55 30.5 57 32C55 33.5 52.5 34.5 50.5 36.5C45 48 19 48 13.5 36.5C11.5 34.5 9 33.5 7 32Z" fill="#f7d63c" transform="matrix(0.92 0 0 0.92 1.76 2.08)"/><ellipse cx="24" cy="25" rx="8" ry="3" fill="#fbe984" transform="rotate(0 24 25)"/><ellipse cx="21" cy="24.5" rx="3" ry="1" fill="#fdf6c8" transform="rotate(0 21 24.5)"/></g><circle cx="36" cy="30" r=".65" fill="#e6be2c"/><circle cx="40" cy="38" r=".65" fill="#e6be2c"/><circle cx="30" cy="40" r=".65" fill="#e6be2c"/><circle cx="44" cy="30" r=".65" fill="#e6be2c"/><circle cx="35" cy="44" r=".65" fill="#e6be2c"/><circle cx="24" cy="36" r=".65" fill="#e6be2c"/></g></svg>',
  'tomato': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 15C46 15 55 23 55 35C55 47 45 55 32 55C19 55 9 47 9 35C9 23 18 15 32 15Z" fill="#b22827"/><path d="M32 15C46 15 55 23 55 35C55 47 45 55 32 55C19 55 9 47 9 35C9 23 18 15 32 15Z" fill="#e23b32" transform="matrix(0.92 0 0 0.92 1.76 2.08)"/><g fill="none" stroke="#c9302b" stroke-width="1" stroke-linecap="round" opacity=".7"><path d="M25 18C20 24 19 32 21 38"/><path d="M39 18C44 24 45 32 43 38"/></g><ellipse cx="19" cy="29" rx="3.5" ry="7" fill="#f2705f" transform="rotate(-30 19 29)"/><ellipse cx="18" cy="27" rx="1.3" ry="3" fill="#fbb3a5" transform="rotate(-30 18 27)"/><path d="M32 13L35 18.5L42 17L37 21L40 25L33.5 22L32 26L30.5 22L24 25L27 21L22 17L29 18.5Z" fill="#4c8a2e"/><path d="M32 21.5L33.5 22L40 25L37 21L42 17L37 20Z" fill="#3a6f23"/><path d="M31 15C31 12 31.5 10 33.5 8.5L35 9.5C33.5 11 33 13 33 15Z" fill="#4c8a2e"/></svg>',
  'peach': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 17C34 14 39 13 43 14C51 17 55 26 54 36C53 48 44 56 32 56C20 56 11 48 10 36C9 26 14 17 22 14C26 13 30 14 32 17Z" fill="#e46d55"/><path d="M32 17C34 14 39 13 43 14C51 17 55 26 54 36C53 48 44 56 32 56C20 56 11 48 10 36C9 26 14 17 22 14C26 13 30 14 32 17Z" fill="#f8a868" transform="matrix(0.9 0 0 0.9 2 2.4)"/><path d="M44 22C52 30 52 44 42 52C48 44 49 32 44 22Z" fill="#d95f4c" opacity=".55"/><path d="M32 18C27 26 26 40 31 54" fill="none" stroke="#e0855a" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="19" cy="29" rx="4" ry="8" fill="#fcd391" transform="rotate(-25 19 29)"/><ellipse cx="18" cy="27" rx="1.4" ry="3.2" fill="#fff0d0" transform="rotate(-25 18 27)" opacity="0.9"/><path d="M31.5 17.5C31.5 13 32 11 33.5 9" stroke="#7a5230" stroke-width="2" fill="none" stroke-linecap="round"/><g transform="translate(33 11) rotate(-15)"><path d="M0 0C3-4 9-5 13-3C10 1 4 3 0 0Z" fill="#5f9e3a"/><path d="M1 0C5-1.5 9-2.5 12-3" stroke="#4a8030" stroke-width=".8" fill="none" stroke-linecap="round"/></g></svg>',
  'orange': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><circle cx="32" cy="34" r="22" fill="#d27412"/><circle cx="30.46" cy="32.46" r="19.8" fill="#f6982a"/><ellipse cx="22" cy="25" rx="6" ry="9" fill="#fbb85a" transform="rotate(-40 22 25)"/><ellipse cx="20" cy="23" rx="2" ry="3.5" fill="#fde2b0" transform="rotate(-40 20 23)"/><circle cx="38" cy="30" r=".75" fill="#e2831c"/><circle cx="42" cy="40" r=".75" fill="#e2831c"/><circle cx="32" cy="44" r=".75" fill="#e2831c"/><circle cx="46" cy="32" r=".75" fill="#e2831c"/><circle cx="36" cy="50" r=".75" fill="#e2831c"/><circle cx="28" cy="38" r=".75" fill="#e2831c"/><circle cx="44" cy="46" r=".75" fill="#e2831c"/><circle cx="26" cy="46" r=".75" fill="#e2831c"/><circle cx="32" cy="13.5" r="2.2" fill="#6e7d2e"/><g transform="translate(33 13) rotate(-25)"><path d="M0 0C3-4 9-5 13-3C10 1 4 3 0 0Z" fill="#5f9e3a"/><path d="M1 0C5-1.5 9-2.5 12-3" stroke="#4a8030" stroke-width=".8" fill="none" stroke-linecap="round"/></g></svg>',
  'onion': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M29.5 16C30 11 30.5 7.5 31 5.5L33.5 6C33.8 9 34 12 34.5 16Z" fill="#b07a3a"/><path d="M32 13C28 20 12 25 11 39C10 50 21 55 32 55C43 55 54 50 53 39C52 25 36 20 32 13Z" fill="#a5672a"/><path d="M32 13C28 20 12 25 11 39C10 50 21 55 32 55C43 55 54 50 53 39C52 25 36 20 32 13Z" fill="#cf9145" transform="matrix(0.92 0 0 0.92 1.76 2.24)"/><g fill="none" stroke="#b47734" stroke-width="1.1" stroke-linecap="round"><path d="M31 16C24 26 22 42 26 53"/><path d="M33 16C40 26 42 42 38 53"/><path d="M30 18C20 26 15 39 18 49"/></g><ellipse cx="20" cy="34" rx="3" ry="7.5" fill="#e8b672" transform="rotate(-20 20 34)"/><ellipse cx="19.5" cy="32" rx="1.1" ry="3.5" fill="#f7dcb0" transform="rotate(-20 19.5 32)"/><g stroke="#9c7a52" stroke-width="1" stroke-linecap="round"><path d="M29 55.5L27 58.5"/><path d="M32 55.8V59"/><path d="M35 55.5L37 58.5"/></g></svg>',
  'apple': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 19C26 13 12 14 11 30C10 44 20 56 27 55C30 54.5 34 54.5 37 55C44 56 54 44 53 30C52 14 38 13 32 19Z" fill="#a8272b"/><path d="M32 19C26 13 12 14 11 30C10 44 20 56 27 55C30 54.5 34 54.5 37 55C44 56 54 44 53 30C52 14 38 13 32 19Z" fill="#da3a36" transform="matrix(0.92 0 0 0.92 1.6 2.08)"/><ellipse cx="19" cy="29" rx="4" ry="8" fill="#ef6c5e" transform="rotate(-25 19 29)"/><ellipse cx="18" cy="27" rx="1.4" ry="3.2" fill="#fbb6a8" transform="rotate(-25 18 27)"/><path d="M31.5 20C31.5 15 32 11.5 34.5 8" stroke="#6e4628" stroke-width="2.2" fill="none" stroke-linecap="round"/><g transform="translate(34 13) rotate(-20)"><path d="M0 0C3-4 9-5 13-3C10 1 4 3 0 0Z" fill="#5f9e3a"/><path d="M1 0C5-1.5 9-2.5 12-3" stroke="#4a8030" stroke-width=".8" fill="none" stroke-linecap="round"/></g></svg>',
  'potato': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="matrix(1.08 0 0 1.08 -2.56 -2.56)"><path d="M12 26C15 18 26 15 34 16C44 16 54 20 55 30C56 39 50 47 40 49C30 51 18 50 12 43C8 38 9 31 12 26Z" fill="#a37647"/><path d="M12 26C15 18 26 15 34 16C44 16 54 20 55 30C56 39 50 47 40 49C30 51 18 50 12 43C8 38 9 31 12 26Z" fill="#c99f68" transform="matrix(0.92 0 0 0.92 1.76 1.92)"/><ellipse cx="21" cy="24" rx="8" ry="3.5" fill="#e0bf8c" transform="rotate(-15 21 24)"/><ellipse cx="18" cy="23.5" rx="3" ry="1.2" fill="#f0dbb5" transform="rotate(-15 18 23.5)"/><path d="M23.4 30Q25 31.4 26.6 30" fill="none" stroke="#8c6438" stroke-width="1" stroke-linecap="round" transform="rotate(-20 25 30)"/><path d="M38.4 25Q40 26.4 41.6 25" fill="none" stroke="#8c6438" stroke-width="1" stroke-linecap="round" transform="rotate(10 40 25)"/><path d="M42.4 39Q44 40.4 45.6 39" fill="none" stroke="#8c6438" stroke-width="1" stroke-linecap="round" transform="rotate(30 44 39)"/><path d="M28.4 42Q30 43.4 31.6 42" fill="none" stroke="#8c6438" stroke-width="1" stroke-linecap="round" transform="rotate(-10 30 42)"/><path d="M16.4 36Q18 37.4 19.6 36" fill="none" stroke="#8c6438" stroke-width="1" stroke-linecap="round" transform="rotate(40 18 36)"/><circle cx="34" cy="33" r=".7" fill="#9b7244"/><circle cx="22" cy="44" r=".7" fill="#9b7244"/><circle cx="48" cy="32" r=".7" fill="#9b7244"/></g></svg>',
  'avocado': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 6C40 6 43 16 46 26C52 34 52 46 46 52C40 58 24 58 18 52C12 46 12 34 18 26C21 16 24 6 32 6Z" fill="#2f5520"/><path d="M32 6C40 6 43 16 46 26C52 34 52 46 46 52C40 58 24 58 18 52C12 46 12 34 18 26C21 16 24 6 32 6Z" fill="#4a7a2c" transform="matrix(.95 0 0 .95 1.55 1.5)"/><path d="M32 6C40 6 43 16 46 26C52 34 52 46 46 52C40 58 24 58 18 52C12 46 12 34 18 26C21 16 24 6 32 6Z" fill="#b7d064" transform="matrix(0.86 0 0 0.86 4.48 4.76)"/><path d="M32 6C40 6 43 16 46 26C52 34 52 46 46 52C40 58 24 58 18 52C12 46 12 34 18 26C21 16 24 6 32 6Z" fill="#e2e89e" transform="matrix(.7 0 0 .7 9.6 11.4)"/><circle cx="32" cy="41" r="9.5" fill="#6b4022"/><circle cx="31" cy="40" r="8.4" fill="#8f5a30"/><ellipse cx="28" cy="37" rx="2.5" ry="3.5" fill="#b57a48" transform="rotate(-35 28 37)"/><ellipse cx="27.5" cy="36" rx="0.9" ry="1.6" fill="#e0b48a" transform="rotate(-35 27.5 36)"/><ellipse cx="26" cy="20" rx="1.6" ry="5" fill="#eef2c0" transform="rotate(-10 26 20)" opacity="0.8"/></svg>',
  'softball': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#bdb52c"/><circle cx="30.46" cy="30.46" r="19.8" fill="#e4dd3e"/><g fill="none" stroke-linecap="round"><path d="M17 15.5C25.5 24 25.5 40 17 48.5" stroke="#c9302b" stroke-width="1"/><path d="M47 15.5C38.5 24 38.5 40 47 48.5" stroke="#c9302b" stroke-width="1"/><path d="M17 15.5C25.5 24 25.5 40 17 48.5" stroke="#d63a30" stroke-width="3.2" stroke-dasharray="1.1 2.2"/><path d="M47 15.5C38.5 24 38.5 40 47 48.5" stroke="#d63a30" stroke-width="3.2" stroke-dasharray="1.1 2.2"/></g><ellipse cx="27" cy="19" rx="5" ry="2.5" fill="#f3ef8e" transform="rotate(-25 27 19)"/><ellipse cx="25" cy="18" rx="2" ry="1" fill="#fbf9d0" transform="rotate(-25 25 18)"/></svg>',
  'pear': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 11C37 11 39 15 39.5 20C40 26 50 32 50 43C50 52 42 57 32 57C22 57 14 52 14 43C14 32 24 26 24.5 20C25 15 27 11 32 11Z" fill="#98a92f"/><path d="M32 11C37 11 39 15 39.5 20C40 26 50 32 50 43C50 52 42 57 32 57C22 57 14 52 14 43C14 32 24 26 24.5 20C25 15 27 11 32 11Z" fill="#c6d14a" transform="matrix(0.91 0 0 0.91 2.16 2.7)"/><ellipse cx="21" cy="40" rx="3.5" ry="7" fill="#dfe682" transform="rotate(-15 21 40)"/><ellipse cx="20.5" cy="38" rx="1.2" ry="3" fill="#f2f4c2" transform="rotate(-15 20.5 38)"/><ellipse cx="29" cy="19" rx="1.4" ry="4" fill="#dfe682" transform="rotate(-10 29 19)"/><circle cx="40" cy="47" r=".7" fill="#8f9e2c"/><circle cx="36" cy="51" r=".7" fill="#8f9e2c"/><circle cx="44" cy="41" r=".7" fill="#8f9e2c"/><path d="M32 12C32 9 32.5 6.5 34.5 4.5" stroke="#6e4628" stroke-width="2" fill="none" stroke-linecap="round"/><g transform="translate(34 8) rotate(-10)"><path d="M0 0C3-4 9-5 13-3C10 1 4 3 0 0Z" fill="#5f9e3a"/><path d="M1 0C5-1.5 9-2.5 12-3" stroke="#4a8030" stroke-width=".8" fill="none" stroke-linecap="round"/></g></svg>',
  'sweet potato': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-25 32 33)"><path d="M5 34C10 26 20 19 32 19C45 19 55 26 59 32C55 39 45 46 32 46C20 46 10 41 5 34Z" fill="#8a3b2b"/><path d="M5 34C10 26 20 19 32 19C45 19 55 26 59 32C55 39 45 46 32 46C20 46 10 41 5 34Z" fill="#b8553c" transform="matrix(0.92 0 0 0.92 1.92 2.24)"/><ellipse cx="26" cy="25" rx="11" ry="2.6" fill="#d6806a" transform="rotate(0 26 25)"/><ellipse cx="22" cy="24.5" rx="4" ry="1" fill="#efb7a6" transform="rotate(0 22 24.5)"/><g fill="none" stroke="#9a4532" stroke-width="1" stroke-linecap="round"><path d="M21 29Q23.5 33 21 37"/><path d="M36 26Q38.5 33 36 40"/><path d="M47 29Q49 33 47 37"/></g><path d="M5 34L1.5 35.5" stroke="#8a3b2b" stroke-width="1.2" stroke-linecap="round"/><path d="M59 32L62 31" stroke="#8a3b2b" stroke-width="1.2" stroke-linecap="round"/><path d="M30 46L29.5 49" stroke="#8a3b2b" stroke-width=".9" stroke-linecap="round"/></g></svg>',
  'bell pepper': '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 17C26 13 14 13 12 25C10 35 12 48 20 54C24 57 28 55.5 32 53.5C36 55.5 40 57 44 54C52 48 54 35 52 25C50 13 38 13 32 17Z" fill="#2a6e2a"/><path d="M32 17C26 13 14 13 12 25C10 35 12 48 20 54C24 57 28 55.5 32 53.5C36 55.5 40 57 44 54C52 48 54 35 52 25C50 13 38 13 32 17Z" fill="#3f9a3a" transform="matrix(0.92 0 0 0.92 1.76 2.08)"/><g fill="none" stroke="#2f7a2e" stroke-width="1.2" stroke-linecap="round"><path d="M32 22C30 33 30.5 44 32 53"/><path d="M22 19C17 30 18 44 22 52"/></g><ellipse cx="18" cy="31" rx="3" ry="8" fill="#6cc25a" transform="rotate(-12 18 31)"/><ellipse cx="17.5" cy="28" rx="1.1" ry="3.5" fill="#b6e8a4" transform="rotate(-12 17.5 28)"/><path d="M24 18C26 14 38 14 40 18C38 20.5 26 20.5 24 18Z" fill="#3b7a2a"/><path d="M30.5 17C30.5 12 31.5 9 35 6.5L37 8.5C34 10.5 33.5 13 33.5 17Z" fill="#5a8a32"/><path d="M33.5 17C33.5 13 34 10.5 37 8.5L36 7.5C33 10 32.5 13 32.5 17Z" fill="#4a7428"/></svg>',
};
const ART_3 = {
  'mango': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><path d="M45 13q2-4 4-5" stroke="#6b4a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="35" rx="20" ry="24" transform="rotate(35 32 35)" fill="#e0742a"/><ellipse cx="31" cy="34" rx="18.4" ry="22.6" transform="rotate(35 32 35)" fill="#f5a93b"/><path d="M38 15c8 0 14 6 15 13-6-1-12-6-15-13z" fill="#e8823a" opacity=".55"/><ellipse cx="23" cy="30" rx="4.5" ry="8" transform="rotate(35 23 30)" fill="#fcd27b"/><path d="M48 10c4-5 11-5 13-3-3 5-9 6-13 3z" fill="#5aa24a"/><path d="M48 10c4-1 8-2 13-3-3 5-9 6-13 3z" fill="#3f8a3a"/></svg>',
  'banana': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><path d="M51 12l3-6" stroke="#7a6a2a" stroke-width="3.4" stroke-linecap="round"/><path d="M7 41C13 61 47 59 53 11C47 33 26 44 7 41z" fill="#f2cf3c"/><path d="M7 41C13 61 47 59 53 11C51 40 28 55 7 41z" fill="#d9a526"/><path d="M12 43C27 46 43 37 50 19" stroke="#f9e489" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="7.5" cy="41.5" r="2.2" fill="#6b4a2a"/></svg>',
  'carrot': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-45 32 32)"><path d="M51 30c5-6 9-9 13-9-2 5-6 8-13 9z" fill="#5aa24a"/><path d="M51 34c5 6 9 9 13 9-2-5-6-8-13-9z" fill="#3f8a3a"/><path d="M51 32c4-1 8-1 13 0-5 2-9 2-13 0z" fill="#4c9640"/><path d="M3 32Q26 23 45 23.5Q52 24 52 32Q52 40 45 40.5Q26 41 3 32z" fill="#d0681c"/><path d="M3 32Q26 23 45 23.5Q51 24 51.5 30Q40 34 3 32z" fill="#ef8a2c"/><path d="M14 29Q30 25.5 44 26" stroke="#f8b46a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 34.5h5M32 30.5h6M38 37h5M27 37.5h3" stroke="#b9561a" stroke-width="1.3" stroke-linecap="round"/></g></svg>',
  'cucumber': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-45 32 32)"><rect x="2" y="22" width="60" height="20" rx="10" fill="#36692c"/><rect x="2" y="22" width="58.5" height="17.5" rx="8.8" fill="#4f8f3c"/><path d="M10 27.5H50" stroke="#7fb35a" stroke-width="2.6" stroke-linecap="round"/><g fill="#a8d080"><circle cx="16" cy="33" r=".9"/><circle cx="26" cy="35" r=".9"/><circle cx="36" cy="32.5" r=".9"/><circle cx="46" cy="34.5" r=".9"/><circle cx="21" cy="30" r=".8"/><circle cx="41" cy="29.8" r=".8"/></g><rect x="59" y="29.5" width="4" height="5" rx="1.5" fill="#8a9a4a"/></g></svg>',
  'baguette': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-45 32 32)"><path d="M1 32Q3 23 14 22.5H50Q63 23 63 32Q63 41 50 41.5H14Q3 41 1 32z" fill="#b5722d"/><path d="M1 32Q3 23 14 22.5H50Q61.5 23 61.5 30.5Q60 38.5 49 39H14Q3 39 1 32z" fill="#d99a4a"/><path d="M10 33q3-6 8-7.5M22 33q3-6 8-7.5M34 33q3-6 8-7.5M46 33q3-6 8-7.5" stroke="#f2d49a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M8 27Q12 24.5 18 24.3" stroke="#ecc07c" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></svg>',
  'bunch of grapes': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><path d="M32 16Q32 9 37 5" stroke="#6b4a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M34 11c4-6 12-7 16-4-3 6-11 8-16 4z" fill="#5aa24a"/><path d="M34 11c5-1 11-3 16-4-3 6-11 8-16 4z" fill="#3f8a3a"/><circle cx="14" cy="20" r="6.6" fill="#4d2a66"/><circle cx="13.3" cy="19.3" r="5.6" fill="#7d4a9e"/><circle cx="11.7" cy="17.6" r="1.6" fill="#b88ad0"/><circle cx="26" cy="19" r="6.6" fill="#4d2a66"/><circle cx="25.3" cy="18.3" r="5.6" fill="#7d4a9e"/><circle cx="23.7" cy="16.6" r="1.6" fill="#b88ad0"/><circle cx="38" cy="19" r="6.6" fill="#4d2a66"/><circle cx="37.3" cy="18.3" r="5.6" fill="#7d4a9e"/><circle cx="35.7" cy="16.6" r="1.6" fill="#b88ad0"/><circle cx="50" cy="20" r="6.6" fill="#4d2a66"/><circle cx="49.3" cy="19.3" r="5.6" fill="#7d4a9e"/><circle cx="47.7" cy="17.6" r="1.6" fill="#b88ad0"/><circle cx="20" cy="30" r="6.6" fill="#4d2a66"/><circle cx="19.3" cy="29.3" r="5.6" fill="#7d4a9e"/><circle cx="17.7" cy="27.6" r="1.6" fill="#b88ad0"/><circle cx="32" cy="29.5" r="6.6" fill="#4d2a66"/><circle cx="31.3" cy="28.8" r="5.6" fill="#7d4a9e"/><circle cx="29.7" cy="27.1" r="1.6" fill="#b88ad0"/><circle cx="44" cy="30" r="6.6" fill="#4d2a66"/><circle cx="43.3" cy="29.3" r="5.6" fill="#7d4a9e"/><circle cx="41.7" cy="27.6" r="1.6" fill="#b88ad0"/><circle cx="26" cy="40" r="6.6" fill="#4d2a66"/><circle cx="25.3" cy="39.3" r="5.6" fill="#7d4a9e"/><circle cx="23.7" cy="37.6" r="1.6" fill="#b88ad0"/><circle cx="38" cy="40" r="6.6" fill="#4d2a66"/><circle cx="37.3" cy="39.3" r="5.6" fill="#7d4a9e"/><circle cx="35.7" cy="37.6" r="1.6" fill="#b88ad0"/><circle cx="32" cy="50" r="6.6" fill="#4d2a66"/><circle cx="31.3" cy="49.3" r="5.6" fill="#7d4a9e"/><circle cx="29.7" cy="47.6" r="1.6" fill="#b88ad0"/></svg>',
  'ear of corn': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-45 32 32)"><ellipse cx="36" cy="32" rx="22" ry="10" fill="#c98f22"/><g fill="#fbe07a"><ellipse cx="22" cy="26" rx="2.2" ry="2.5"/><ellipse cx="27" cy="26" rx="2.2" ry="2.5"/><ellipse cx="32" cy="26" rx="2.2" ry="2.5"/><ellipse cx="37" cy="26" rx="2.2" ry="2.5"/><ellipse cx="42" cy="26" rx="2.2" ry="2.5"/><ellipse cx="47" cy="26" rx="2.2" ry="2.5"/></g><g fill="#f5c842"><ellipse cx="22" cy="32" rx="2.2" ry="2.5"/><ellipse cx="27" cy="32" rx="2.2" ry="2.5"/><ellipse cx="32" cy="32" rx="2.2" ry="2.5"/><ellipse cx="37" cy="32" rx="2.2" ry="2.5"/><ellipse cx="42" cy="32" rx="2.2" ry="2.5"/><ellipse cx="47" cy="32" rx="2.2" ry="2.5"/><ellipse cx="52" cy="32" rx="2.2" ry="2.5"/></g><g fill="#dba52a"><ellipse cx="22" cy="38" rx="2.2" ry="2.5"/><ellipse cx="27" cy="38" rx="2.2" ry="2.5"/><ellipse cx="32" cy="38" rx="2.2" ry="2.5"/><ellipse cx="37" cy="38" rx="2.2" ry="2.5"/><ellipse cx="42" cy="38" rx="2.2" ry="2.5"/><ellipse cx="47" cy="38" rx="2.2" ry="2.5"/></g><path d="M2 32Q16 34 24 46Q34 46 46 44Q26 44 18 32z" fill="#3f8a3a"/><path d="M2 32Q14 32 24 20Q36 18 50 20Q28 22 18 32z" fill="#7cb84f"/><path d="M3 31Q12 29 28 31Q16 36 3 33z" fill="#5c9a3c"/><path d="M10 30Q18 26 24 21.5" stroke="#a6d47a" stroke-width="1.4" fill="none" stroke-linecap="round"/></g></svg>',
  'eggplant': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-45 32 32)"><path d="M54 32h8" stroke="#6b7a34" stroke-width="3.6" stroke-linecap="round"/><path d="M5 33C5 18 20 17 30 21.5C38 25 44 25 50 25.5L50 38.5C44 39 38 39 30 43C19 48 5 46 5 33z" fill="#3e1c4e"/><path d="M5 33C5 18 20 17 30 21.5C38 25 44 25 50 25.5L50 36C43 36.5 37 37 29 40C18 44 5 43 5 33z" fill="#5f2f73"/><path d="M10 28Q16 21 26 23.5" stroke="#9a6ab0" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M56 32C53 23 46 22 42 25C45 27 46 28 47 29C43 30 40 32 39 34C43 34 46 35 47 36C46 38 44 39 42 40C46 42 53 41 56 32z" fill="#5a8a3a"/><path d="M56 32C54 37 50 40 42 40C44 39 46 38 47 36C50 35 53 34 56 32z" fill="#3f6e2c"/></g></svg>',
  'head of broccoli': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><path d="M25 34h14l-2 20q-1 3-5 3t-5-3z" fill="#7ea24f"/><path d="M25 34h14l-4 20q-1 2-3 2t-3-2z" fill="#a5c973"/><path d="M30 40l-6-5M34 41l6-5" stroke="#a5c973" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="28" r="10" fill="#336b2b"/><circle cx="16" cy="27" r="8.6" fill="#4f8f3a"/><circle cx="47" cy="28" r="10" fill="#336b2b"/><circle cx="46" cy="27" r="8.6" fill="#4f8f3a"/><circle cx="24" cy="19" r="10.5" fill="#336b2b"/><circle cx="23" cy="18" r="9.1" fill="#4f8f3a"/><circle cx="40" cy="19" r="10.5" fill="#336b2b"/><circle cx="39" cy="18" r="9.1" fill="#4f8f3a"/><circle cx="32" cy="29" r="11" fill="#336b2b"/><circle cx="31" cy="28" r="9.6" fill="#4f8f3a"/><g fill="#77b257"><circle cx="20" cy="15" r="2.2"/><circle cx="26" cy="13" r="1.8"/><circle cx="37" cy="14" r="2"/><circle cx="12" cy="25" r="1.8"/><circle cx="28" cy="25" r="2.2"/><circle cx="43" cy="24" r="1.8"/><circle cx="17" cy="30" r="1.4"/><circle cx="34" cy="22" r="1.4"/></g><g fill="#3b7330"><circle cx="50" cy="31" r="1.6"/><circle cx="37" cy="34" r="1.6"/><circle cx="44" cy="21" r="1.3"/></g></svg>',
  'loaf of bread': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><path d="M6 44C6 22 19 14 32 14C45 14 58 22 58 44Q58 51 51 51H13Q6 51 6 44z" fill="#a4672c"/><path d="M6 44C6 22 19 14 32 14C44 14 56 21 56.5 41Q56 47.5 50 47.5H13Q6 48 6 44z" fill="#c98a45"/><path d="M14 30Q20 18 32 17" stroke="#e2ab68" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M16 34l7-9M28 30l7-9M40 33l7-9" stroke="#f0cf92" stroke-width="3.2" stroke-linecap="round"/></svg>',
  'coconut': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><circle cx="32" cy="33" r="24" fill="#5e3a20"/><circle cx="31" cy="32" r="22.4" fill="#8a5a34"/><path d="M20 22l1 3M28 16l2 3M38 17l3 3M45 24l3 3M18 34l1 3M26 28l2 3M36 27l3 3M46 35l3 3M22 44l1 3M31 38l2 3M40 43l3 3M30 50l2 3M14 28l1 3M49 45l3 3" stroke="#a9774a" stroke-width="1.5" stroke-linecap="round"/><path d="M14 26Q20 14 32 12" stroke="#b78958" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M25 51l2-3M36 50l1-3M46 43l2-2M51 33l2-1" stroke="#4c2e19" stroke-width="1.4" stroke-linecap="round"/><g fill="#3f2615"><circle cx="40" cy="20" r="1.7"/><circle cx="44" cy="23.5" r="1.7"/><circle cx="39.5" cy="25" r="1.7"/></g></svg>',
  'pineapple': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><path d="M32 24L22 5q6 4 10 13 4-9 10-13z" fill="#3a7f38"/><path d="M31 24Q24 14 13 11q6 7 12 15zM33 24Q40 14 51 11q-6 7-12 15z" fill="#4f9a45"/><path d="M32 24Q30 10 32 2q3 9 1 22z" fill="#78b85a"/><ellipse cx="32" cy="41" rx="17" ry="19" fill="#c07d26"/><ellipse cx="31.1" cy="40.1" rx="15.6" ry="17.6" fill="#e6a93a"/><path d="M32.4 23.1L46.6 39.9M25.7 24.4L45 47.4M20.9 28L41.5 52.6M17.4 33.2L36.7 56.2M15.8 40.7L30 57.5" stroke="#b5762a" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M15.8 39.9L30 23.1M17.4 47.4L36.7 24.4M20.9 52.6L41.5 28M25.7 56.2L45 33.2M32.4 57.5L46.6 40.7" stroke="#b5762a" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M19 35Q20 28 26 25" stroke="#f6cd6e" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
  'football': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-30 32 32)"><path d="M3 32C12 11 52 11 61 32C52 53 12 53 3 32z" fill="#5f2e19"/><path d="M3 32C12 11 52 11 61 32C51 50 13 50 3 32z" fill="#8b4a2b"/><path d="M14 26Q22 18 32 17.5" stroke="#b06a44" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M22 31H42" stroke="#f4efe6" stroke-width="2" stroke-linecap="round"/><path d="M25 28v6M29 28v6M33 28v6M37 28v6M41 28.5v5" stroke="#f4efe6" stroke-width="1.8" stroke-linecap="round"/></g></svg>',
  'cantaloupe': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><circle cx="32" cy="33" r="25" fill="#a9844c"/><circle cx="31" cy="32" r="23.4" fill="#d6b273"/><path d="M16 22Q21 15 30 13" stroke="#ead29e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14 40Q24 34 30 24T48 16M10 30Q20 30 26 38T44 50M24 52Q28 42 38 38T54 36M20 18Q30 22 34 30T38 46M42 22Q46 30 52 30" stroke="#f0e2bf" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="32" cy="9.5" r="2" fill="#8a7a3c"/></svg>',
  'pumpkin': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><path d="M32 18Q31 11 35 7" stroke="#5f6e2c" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M35 9q6-3 9 1" stroke="#7a8a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="19" cy="37" rx="14" ry="18" fill="#c4621c"/><ellipse cx="45" cy="37" rx="14" ry="18" fill="#b8571a"/><ellipse cx="18.2" cy="36.2" rx="12.8" ry="16.8" fill="#e8802a"/><ellipse cx="45" cy="37" rx="12.5" ry="16.6" fill="#d76f22"/><ellipse cx="32" cy="37" rx="13" ry="19" fill="#c4621c"/><ellipse cx="31.2" cy="36.2" rx="11.8" ry="17.8" fill="#ee8a30"/><path d="M24 26Q26 21 30 19.5M11 32Q12 26 16 23" stroke="#f6aa5e" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
  'honeydew melon': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><ellipse cx="32" cy="33" rx="26" ry="24" fill="#a9bd72"/><ellipse cx="31" cy="32" rx="24.4" ry="22.4" fill="#d3e0a0"/><path d="M14 26Q19 15 31 12" stroke="#eef4cf" stroke-width="3.4" fill="none" stroke-linecap="round"/><g fill="#c0cf8a"><circle cx="40" cy="40" r=".9"/><circle cx="24" cy="44" r=".8"/><circle cx="46" cy="28" r=".8"/><circle cx="33" cy="48" r=".8"/></g><circle cx="33" cy="10.5" r="1.8" fill="#8a9a4a"/></svg>',
  'watermelon': '<svg viewBox="5 5 54 54" width="1em" height="1em" aria-hidden="true"><g transform="rotate(-20 32 32)"><ellipse cx="32" cy="32" rx="29" ry="21" fill="#2f6b2e"/><ellipse cx="31.2" cy="31" rx="27.6" ry="19.8" fill="#7cb85a"/><path d="M6.4 31.5Q18 8.4 32 10.5T57.6 31.5" stroke="#2f6b2e" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="7 1.5 5 1.5"/><path d="M5.2 31.5Q18 19.2 32 20.5T58.8 31.5" stroke="#2f6b2e" stroke-width="3.8" fill="none" stroke-linecap="round" stroke-dasharray="7 1.5 5 1.5"/><path d="M4 31.5Q18 30 32 30.5T60 31.5" stroke="#2f6b2e" stroke-width="3.8" fill="none" stroke-linecap="round" stroke-dasharray="7 1.5 5 1.5"/><path d="M5.2 31.5Q18 40.8 32 40.5T58.8 31.5" stroke="#2f6b2e" stroke-width="3.8" fill="none" stroke-linecap="round" stroke-dasharray="7 1.5 5 1.5"/><path d="M6.4 31.5Q18 51.6 32 50.5T57.6 31.5" stroke="#2f6b2e" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="7 1.5 5 1.5"/><path d="M12 24Q20 16 32 15" stroke="#a6d47f" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/></g></svg>',
};
export const SIZE_ART = { ...ART_1, ...ART_2, ...ART_3 }
