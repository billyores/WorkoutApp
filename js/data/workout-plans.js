// WT.Plans — workout plan templates
// goal: 'strength' | 'shred' | 'weight-loss'
// restSec: recommended rest time between sets (drives the in-app timer)
window.WT = window.WT || {};

WT.Plans = (function () {

  const PLANS = [

    // ════════════════════════════════════════════════════════
    // STRENGTH
    // ════════════════════════════════════════════════════════

    {
      id:           'stronglifts_5x5',
      name:         'StrongLifts 5×5',
      goal:         'strength',
      durationWeeks: 12,
      daysPerWeek:  3,
      restSec:      180,   // 3 min rest — heavy compound lifts
      description:  'The original strength-building program. Alternate two full-body workouts (A & B) three times a week. Add 5 lbs to every lift each session. Best for beginners to intermediates chasing raw strength and size.',
      highlights:   ['Progressive overload every session', 'Heavy compound lifts only', 'Squat every workout', 'Proven 40+ year track record'],
      schedule:     [1, 3, 5],  // Mon, Wed, Fri (0=Sun)
      // Template weeks — week 1 repeats on a pattern; weeks 2+ shown as "same pattern"
      weeks: [
        {
          weekNumber: 1,
          note: 'Alternate A/B each session. Start with a weight you can complete comfortably — you will add weight every single session.',
          days: [
            {
              dayNumber: 1,
              label: 'Workout A',
              focus: ['quads', 'hamstrings', 'glutes', 'chest', 'back'],
              restSec: 180,
              exercises: [
                { exerciseId: 'ex_squat',      name: 'Squat',       targetSets: 5, targetReps: '5',     restSec: 180 },
                { exerciseId: 'ex_bench_press', name: 'Bench Press', targetSets: 5, targetReps: '5',     restSec: 180 },
                { exerciseId: 'ex_barbell_row', name: 'Barbell Row', targetSets: 5, targetReps: '5',     restSec: 180 },
              ],
            },
            {
              dayNumber: 2,
              label: 'Rest',
              focus: [],
              restSec: 0,
              exercises: [],
            },
            {
              dayNumber: 3,
              label: 'Workout B',
              focus: ['quads', 'hamstrings', 'glutes', 'shoulders', 'back'],
              restSec: 180,
              exercises: [
                { exerciseId: 'ex_squat',      name: 'Squat',              targetSets: 5, targetReps: '5', restSec: 180 },
                { exerciseId: 'ex_ohp',        name: 'Overhead Press',     targetSets: 5, targetReps: '5', restSec: 180 },
                { exerciseId: 'ex_deadlift',   name: 'Deadlift',           targetSets: 1, targetReps: '5', restSec: 300 },
              ],
            },
            { dayNumber: 4, label: 'Rest', focus: [], restSec: 0, exercises: [] },
            {
              dayNumber: 5,
              label: 'Workout A',
              focus: ['quads', 'hamstrings', 'glutes', 'chest', 'back'],
              restSec: 180,
              exercises: [
                { exerciseId: 'ex_squat',      name: 'Squat',       targetSets: 5, targetReps: '5', restSec: 180 },
                { exerciseId: 'ex_bench_press', name: 'Bench Press', targetSets: 5, targetReps: '5', restSec: 180 },
                { exerciseId: 'ex_barbell_row', name: 'Barbell Row', targetSets: 5, targetReps: '5', restSec: 180 },
              ],
            },
            { dayNumber: 6, label: 'Rest', focus: [], restSec: 0, exercises: [] },
            { dayNumber: 7, label: 'Rest', focus: [], restSec: 0, exercises: [] },
          ],
        },
      ],
      // For weeks 2-12: same pattern but increment weight 5 lbs per lift each session
      weekPattern: 'alternating-ab',
    },

    {
      id:           'wendler_531',
      name:         'Wendler 5/3/1',
      goal:         'strength',
      durationWeeks: 16,
      daysPerWeek:  4,
      restSec:      240,
      description:  'Jim Wendler\'s iconic 4-day strength program built around the squat, bench, deadlift, and overhead press. Monthly cycles of 5s, 3s, and 1s with an AMRAP final set. Best for intermediate to advanced lifters.',
      highlights:   ['4-week wave cycles', 'Built-in deload week', 'AMRAP sets drive progress', 'Easy to run for years'],
      schedule:     [1, 2, 4, 5],
      weeks: [
        {
          weekNumber: 1,
          note: 'Week 1: 5s week. All percentages are based on your Training Max (90% of 1RM). Last set is AMRAP (as many reps as possible).',
          days: [
            {
              dayNumber: 1,
              label: 'Press Day',
              focus: ['shoulders', 'triceps'],
              restSec: 240,
              exercises: [
                { exerciseId: 'ex_ohp',            name: 'OHP — 65% × 5, 75% × 5, 85% × 5+',      targetSets: 3, targetReps: '5/5/5+',  restSec: 240 },
                { exerciseId: 'ex_db_row',          name: 'Dumbbell Row (assistance)',                targetSets: 5, targetReps: '10',      restSec: 90  },
                { exerciseId: 'ex_pushup',          name: 'Push-Ups (assistance)',                   targetSets: 5, targetReps: '10',      restSec: 60  },
                { exerciseId: 'ex_db_curl',         name: 'Dumbbell Curl (assistance)',              targetSets: 3, targetReps: '10',      restSec: 60  },
              ],
            },
            {
              dayNumber: 2,
              label: 'Deadlift Day',
              focus: ['back', 'hamstrings', 'glutes'],
              restSec: 300,
              exercises: [
                { exerciseId: 'ex_deadlift',       name: 'Deadlift — 65% × 5, 75% × 5, 85% × 5+', targetSets: 3, targetReps: '5/5/5+',  restSec: 300 },
                { exerciseId: 'ex_leg_press',       name: 'Leg Press (assistance)',                  targetSets: 5, targetReps: '10',      restSec: 90  },
                { exerciseId: 'ex_leg_curl',        name: 'Leg Curl (assistance)',                   targetSets: 5, targetReps: '10',      restSec: 90  },
                { exerciseId: 'ex_hanging_leg_raise',name: 'Hanging Leg Raise',                      targetSets: 5, targetReps: '10',      restSec: 60  },
              ],
            },
            {
              dayNumber: 3,
              label: 'Bench Day',
              focus: ['chest', 'triceps'],
              restSec: 240,
              exercises: [
                { exerciseId: 'ex_bench_press',    name: 'Bench — 65% × 5, 75% × 5, 85% × 5+',    targetSets: 3, targetReps: '5/5/5+',  restSec: 240 },
                { exerciseId: 'ex_barbell_row',     name: 'Barbell Row (assistance)',                targetSets: 5, targetReps: '10',      restSec: 90  },
                { exerciseId: 'ex_db_fly',          name: 'Dumbbell Fly (assistance)',               targetSets: 5, targetReps: '10',      restSec: 60  },
                { exerciseId: 'ex_tricep_pushdown', name: 'Tricep Pushdown (assistance)',            targetSets: 3, targetReps: '10',      restSec: 60  },
              ],
            },
            {
              dayNumber: 4,
              label: 'Squat Day',
              focus: ['quads', 'hamstrings', 'glutes'],
              restSec: 300,
              exercises: [
                { exerciseId: 'ex_squat',          name: 'Squat — 65% × 5, 75% × 5, 85% × 5+',    targetSets: 3, targetReps: '5/5/5+',  restSec: 300 },
                { exerciseId: 'ex_leg_press',       name: 'Leg Press (assistance)',                  targetSets: 5, targetReps: '10',      restSec: 90  },
                { exerciseId: 'ex_leg_curl',        name: 'Leg Curl (assistance)',                   targetSets: 5, targetReps: '10',      restSec: 90  },
                { exerciseId: 'ex_plank',           name: 'Plank',                                   targetSets: 3, targetReps: '60s',     restSec: 60  },
              ],
            },
          ],
        },
      ],
      weekPattern: 'cycle-531',
    },

    // ════════════════════════════════════════════════════════
    // GETTING SHREDDED
    // ════════════════════════════════════════════════════════

    {
      id:           'ppl_volume',
      name:         'Push / Pull / Legs (High Volume)',
      goal:         'shred',
      durationWeeks: 12,
      daysPerWeek:  6,
      restSec:      60,
      description:  'Classic PPL split running 6 days a week with high volume and short rest periods. Builds muscle while keeping your heart rate elevated for maximum calorie burn.',
      highlights:   ['High volume — 20-25 sets per session', '60-90s rest for metabolic stress', 'Train each muscle twice a week', 'Mix of compounds and isolation'],
      schedule:     [1, 2, 3, 4, 5, 6],
      weeks: [
        {
          weekNumber: 1,
          note: 'Rest on Sunday. Keep rest times short (60-90s) to maintain elevated heart rate.',
          days: [
            {
              dayNumber: 1,
              label: 'Push A (Chest Focus)',
              focus: ['chest', 'front-delts', 'triceps'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_bench_press',    name: 'Bench Press',         targetSets: 4, targetReps: '8-12', restSec: 90  },
                { exerciseId: 'ex_incline_bench',  name: 'Incline Bench Press', targetSets: 4, targetReps: '8-12', restSec: 90  },
                { exerciseId: 'ex_db_fly',         name: 'Cable / DB Fly',      targetSets: 3, targetReps: '12-15',restSec: 60  },
                { exerciseId: 'ex_ohp',            name: 'Overhead Press',      targetSets: 3, targetReps: '8-12', restSec: 90  },
                { exerciseId: 'ex_lateral_raise',  name: 'Lateral Raise',       targetSets: 3, targetReps: '15-20',restSec: 45  },
                { exerciseId: 'ex_tricep_pushdown',name: 'Tricep Pushdown',      targetSets: 3, targetReps: '12-15',restSec: 60  },
                { exerciseId: 'ex_skullcrusher',   name: 'Skull Crusher',       targetSets: 3, targetReps: '10-12',restSec: 60  },
              ],
            },
            {
              dayNumber: 2,
              label: 'Pull A (Back Focus)',
              focus: ['back', 'lats', 'biceps', 'rear-delts'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_deadlift',       name: 'Deadlift',            targetSets: 4, targetReps: '6-8',  restSec: 180 },
                { exerciseId: 'ex_pullup',         name: 'Pull-Up',             targetSets: 4, targetReps: '6-10', restSec: 90  },
                { exerciseId: 'ex_barbell_row',    name: 'Barbell Row',         targetSets: 4, targetReps: '8-10', restSec: 90  },
                { exerciseId: 'ex_lat_pulldown',   name: 'Lat Pulldown',        targetSets: 3, targetReps: '10-12',restSec: 60  },
                { exerciseId: 'ex_face_pull',      name: 'Face Pull',           targetSets: 3, targetReps: '15-20',restSec: 45  },
                { exerciseId: 'ex_barbell_curl',   name: 'Barbell Curl',        targetSets: 3, targetReps: '10-12',restSec: 60  },
                { exerciseId: 'ex_hammer_curl',    name: 'Hammer Curl',         targetSets: 3, targetReps: '12-15',restSec: 45  },
              ],
            },
            {
              dayNumber: 3,
              label: 'Legs A (Quad Focus)',
              focus: ['quads', 'hamstrings', 'glutes', 'calves'],
              restSec: 90,
              exercises: [
                { exerciseId: 'ex_squat',          name: 'Squat',               targetSets: 4, targetReps: '8-12', restSec: 120 },
                { exerciseId: 'ex_leg_press',      name: 'Leg Press',           targetSets: 4, targetReps: '10-15',restSec: 90  },
                { exerciseId: 'ex_lunges',         name: 'Walking Lunges',      targetSets: 3, targetReps: '12',   restSec: 90  },
                { exerciseId: 'ex_leg_curl',       name: 'Leg Curl',            targetSets: 3, targetReps: '12-15',restSec: 60  },
                { exerciseId: 'ex_leg_ext',        name: 'Leg Extension',       targetSets: 3, targetReps: '15-20',restSec: 60  },
                { exerciseId: 'ex_calf_raise',     name: 'Calf Raise',          targetSets: 4, targetReps: '15-20',restSec: 60  },
              ],
            },
            {
              dayNumber: 4,
              label: 'Push B (Shoulder Focus)',
              focus: ['shoulders', 'chest', 'triceps'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_ohp',            name: 'Overhead Press',      targetSets: 4, targetReps: '8-12', restSec: 90  },
                { exerciseId: 'ex_db_ohp',         name: 'DB Shoulder Press',   targetSets: 3, targetReps: '10-12',restSec: 90  },
                { exerciseId: 'ex_lateral_raise',  name: 'Lateral Raise',       targetSets: 4, targetReps: '15-20',restSec: 45  },
                { exerciseId: 'ex_front_raise',    name: 'Front Raise',         targetSets: 3, targetReps: '12-15',restSec: 45  },
                { exerciseId: 'ex_incline_bench',  name: 'Incline Bench Press', targetSets: 3, targetReps: '10-12',restSec: 90  },
                { exerciseId: 'ex_cable_fly',      name: 'Cable Fly',           targetSets: 3, targetReps: '12-15',restSec: 60  },
                { exerciseId: 'ex_overhead_ext',   name: 'Overhead Tricep Ext', targetSets: 3, targetReps: '12-15',restSec: 60  },
              ],
            },
            {
              dayNumber: 5,
              label: 'Pull B (Lats Focus)',
              focus: ['lats', 'back', 'biceps'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_chinup',         name: 'Chin-Up',             targetSets: 4, targetReps: '6-10', restSec: 90  },
                { exerciseId: 'ex_lat_pulldown',   name: 'Lat Pulldown',        targetSets: 4, targetReps: '10-12',restSec: 90  },
                { exerciseId: 'ex_cable_row',      name: 'Cable Row',           targetSets: 4, targetReps: '10-12',restSec: 90  },
                { exerciseId: 'ex_db_row',         name: 'Dumbbell Row',        targetSets: 3, targetReps: '10-12',restSec: 60  },
                { exerciseId: 'ex_rear_delt_fly',  name: 'Rear Delt Fly',       targetSets: 3, targetReps: '15-20',restSec: 45  },
                { exerciseId: 'ex_preacher_curl',  name: 'Preacher Curl',       targetSets: 3, targetReps: '10-12',restSec: 60  },
                { exerciseId: 'ex_cable_curl',     name: 'Cable Curl',          targetSets: 3, targetReps: '12-15',restSec: 45  },
              ],
            },
            {
              dayNumber: 6,
              label: 'Legs B (Glute/Ham Focus)',
              focus: ['glutes', 'hamstrings', 'quads', 'calves'],
              restSec: 90,
              exercises: [
                { exerciseId: 'ex_rdl',            name: 'Romanian Deadlift',   targetSets: 4, targetReps: '8-10', restSec: 120 },
                { exerciseId: 'ex_hip_thrust',     name: 'Hip Thrust',          targetSets: 4, targetReps: '10-15',restSec: 90  },
                { exerciseId: 'ex_bulgarian_split', name: 'Bulgarian Split Squat',targetSets: 3, targetReps: '10-12',restSec: 90 },
                { exerciseId: 'ex_leg_curl',       name: 'Leg Curl',            targetSets: 4, targetReps: '12-15',restSec: 60  },
                { exerciseId: 'ex_glute_bridge',   name: 'Glute Bridge',        targetSets: 3, targetReps: '15-20',restSec: 60  },
                { exerciseId: 'ex_calf_raise',     name: 'Calf Raise',          targetSets: 4, targetReps: '15-20',restSec: 60  },
              ],
            },
            { dayNumber: 7, label: 'Rest', focus: [], restSec: 0, exercises: [] },
          ],
        },
      ],
      weekPattern: 'repeat',
    },

    {
      id:           'arnold_split',
      name:         'Arnold Split',
      goal:         'shred',
      durationWeeks: 12,
      daysPerWeek:  6,
      restSec:      60,
      description:  'Arnold Schwarzenegger\'s legendary 6-day split: chest/back, shoulders/arms, legs — twice a week. High volume with antagonist pairing for a massive pump and impressive physique.',
      highlights:   ['Antagonist muscle pairing (chest + back)', 'Double frequency for each muscle', 'High volume = max pump', 'The program that built a legend'],
      schedule:     [1, 2, 3, 4, 5, 6],
      weeks: [
        {
          weekNumber: 1,
          note: 'Superset chest and back exercises where possible for maximum pump.',
          days: [
            {
              dayNumber: 1,
              label: 'Chest & Back',
              focus: ['chest', 'back', 'lats'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_bench_press',  name: 'Bench Press',      targetSets: 4, targetReps: '8-12',  restSec: 90 },
                { exerciseId: 'ex_barbell_row',  name: 'Barbell Row',      targetSets: 4, targetReps: '8-12',  restSec: 90 },
                { exerciseId: 'ex_incline_bench',name: 'Incline Bench',    targetSets: 3, targetReps: '10-12', restSec: 60 },
                { exerciseId: 'ex_lat_pulldown', name: 'Lat Pulldown',     targetSets: 3, targetReps: '10-12', restSec: 60 },
                { exerciseId: 'ex_db_fly',       name: 'DB Fly',           targetSets: 3, targetReps: '12-15', restSec: 60 },
                { exerciseId: 'ex_cable_row',    name: 'Cable Row',        targetSets: 3, targetReps: '12-15', restSec: 60 },
                { exerciseId: 'ex_pullup',       name: 'Pull-Up',          targetSets: 3, targetReps: 'AMRAP', restSec: 90 },
              ],
            },
            {
              dayNumber: 2,
              label: 'Shoulders & Arms',
              focus: ['shoulders', 'biceps', 'triceps'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_arnold_press', name: 'Arnold Press',     targetSets: 4, targetReps: '10-12', restSec: 90 },
                { exerciseId: 'ex_lateral_raise',name: 'Lateral Raise',    targetSets: 4, targetReps: '12-15', restSec: 60 },
                { exerciseId: 'ex_barbell_curl', name: 'Barbell Curl',     targetSets: 4, targetReps: '10-12', restSec: 60 },
                { exerciseId: 'ex_skullcrusher', name: 'Skull Crusher',    targetSets: 4, targetReps: '10-12', restSec: 60 },
                { exerciseId: 'ex_db_curl',      name: 'Dumbbell Curl',    targetSets: 3, targetReps: '12-15', restSec: 45 },
                { exerciseId: 'ex_overhead_ext', name: 'Overhead Ext',     targetSets: 3, targetReps: '12-15', restSec: 45 },
                { exerciseId: 'ex_rear_delt_fly',name: 'Rear Delt Fly',    targetSets: 3, targetReps: '15-20', restSec: 45 },
              ],
            },
            {
              dayNumber: 3,
              label: 'Legs',
              focus: ['quads', 'hamstrings', 'glutes', 'calves'],
              restSec: 90,
              exercises: [
                { exerciseId: 'ex_squat',        name: 'Squat',            targetSets: 5, targetReps: '8-12',  restSec: 120 },
                { exerciseId: 'ex_rdl',          name: 'Romanian DL',      targetSets: 4, targetReps: '10-12', restSec: 90  },
                { exerciseId: 'ex_leg_press',    name: 'Leg Press',        targetSets: 4, targetReps: '12-15', restSec: 90  },
                { exerciseId: 'ex_leg_curl',     name: 'Leg Curl',         targetSets: 4, targetReps: '12-15', restSec: 60  },
                { exerciseId: 'ex_leg_ext',      name: 'Leg Extension',    targetSets: 3, targetReps: '15-20', restSec: 60  },
                { exerciseId: 'ex_calf_raise',   name: 'Calf Raise',       targetSets: 5, targetReps: '15-20', restSec: 60  },
              ],
            },
            { dayNumber: 4, label: 'Chest & Back', focus: ['chest', 'back', 'lats'], restSec: 60,
              exercises: [
                { exerciseId: 'ex_bench_press',  name: 'Bench Press',      targetSets: 4, targetReps: '8-12',  restSec: 90 },
                { exerciseId: 'ex_barbell_row',  name: 'Barbell Row',      targetSets: 4, targetReps: '8-12',  restSec: 90 },
                { exerciseId: 'ex_incline_bench',name: 'Incline Bench',    targetSets: 3, targetReps: '10-12', restSec: 60 },
                { exerciseId: 'ex_lat_pulldown', name: 'Lat Pulldown',     targetSets: 3, targetReps: '10-12', restSec: 60 },
                { exerciseId: 'ex_cable_fly',    name: 'Cable Fly',        targetSets: 3, targetReps: '12-15', restSec: 60 },
                { exerciseId: 'ex_pullup',       name: 'Pull-Up',          targetSets: 3, targetReps: 'AMRAP', restSec: 90 },
              ],
            },
            { dayNumber: 5, label: 'Shoulders & Arms', focus: ['shoulders', 'biceps', 'triceps'], restSec: 60,
              exercises: [
                { exerciseId: 'ex_db_ohp',       name: 'DB Shoulder Press',targetSets: 4, targetReps: '10-12', restSec: 90 },
                { exerciseId: 'ex_lateral_raise',name: 'Lateral Raise',    targetSets: 4, targetReps: '12-15', restSec: 60 },
                { exerciseId: 'ex_hammer_curl',  name: 'Hammer Curl',      targetSets: 4, targetReps: '12-15', restSec: 60 },
                { exerciseId: 'ex_dips_tricep',  name: 'Tricep Dips',      targetSets: 4, targetReps: 'AMRAP', restSec: 60 },
                { exerciseId: 'ex_cable_curl',   name: 'Cable Curl',       targetSets: 3, targetReps: '12-15', restSec: 45 },
                { exerciseId: 'ex_tricep_pushdown',name: 'Pushdown',        targetSets: 3, targetReps: '12-15', restSec: 45 },
              ],
            },
            { dayNumber: 6, label: 'Legs', focus: ['quads', 'hamstrings', 'glutes', 'calves'], restSec: 90,
              exercises: [
                { exerciseId: 'ex_squat',        name: 'Squat',            targetSets: 5, targetReps: '8-12',  restSec: 120 },
                { exerciseId: 'ex_hip_thrust',   name: 'Hip Thrust',       targetSets: 4, targetReps: '10-15', restSec: 90  },
                { exerciseId: 'ex_lunges',       name: 'Walking Lunges',   targetSets: 3, targetReps: '12',    restSec: 90  },
                { exerciseId: 'ex_leg_curl',     name: 'Leg Curl',         targetSets: 4, targetReps: '12-15', restSec: 60  },
                { exerciseId: 'ex_calf_raise',   name: 'Calf Raise',       targetSets: 5, targetReps: '15-20', restSec: 60  },
              ],
            },
            { dayNumber: 7, label: 'Rest', focus: [], restSec: 0, exercises: [] },
          ],
        },
      ],
      weekPattern: 'repeat',
    },

    // ════════════════════════════════════════════════════════
    // WEIGHT LOSS
    // ════════════════════════════════════════════════════════

    {
      id:           'full_body_cardio',
      name:         'Full Body + Cardio',
      goal:         'weight-loss',
      durationWeeks: 8,
      daysPerWeek:  5,
      restSec:      60,
      description:  'Three full-body resistance sessions plus two dedicated cardio sessions per week. Maintains and builds muscle while creating a calorie deficit. Great for beginners and those returning to training.',
      highlights:   ['Train full body 3×/week', '2 cardio sessions for fat burn', '45s rest keeps heart rate up', 'Beginner-friendly movements'],
      schedule:     [1, 2, 3, 5, 6],
      weeks: [
        {
          weekNumber: 1,
          note: 'Keep rest to 45-60 seconds. Intensity > weight.',
          days: [
            {
              dayNumber: 1,
              label: 'Full Body A',
              focus: ['full-body'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_squat',          name: 'Goblet Squat',       targetSets: 3, targetReps: '12-15',restSec: 60 },
                { exerciseId: 'ex_bench_press',    name: 'Bench Press',        targetSets: 3, targetReps: '10-12',restSec: 60 },
                { exerciseId: 'ex_barbell_row',    name: 'DB Row',             targetSets: 3, targetReps: '10-12',restSec: 60 },
                { exerciseId: 'ex_ohp',            name: 'Overhead Press',     targetSets: 3, targetReps: '10-12',restSec: 60 },
                { exerciseId: 'ex_rdl',            name: 'Romanian Deadlift',  targetSets: 3, targetReps: '12-15',restSec: 60 },
                { exerciseId: 'ex_plank',          name: 'Plank',              targetSets: 3, targetReps: '30-45s',restSec: 45 },
              ],
            },
            {
              dayNumber: 2,
              label: 'Cardio (LISS)',
              focus: ['cardio'],
              restSec: 0,
              exercises: [
                { exerciseId: 'ex_running',        name: '30 min Brisk Walk / Jog', targetSets: 1, targetReps: '30 min', restSec: 0 },
              ],
            },
            {
              dayNumber: 3,
              label: 'Full Body B',
              focus: ['full-body'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_deadlift',       name: 'Deadlift',           targetSets: 3, targetReps: '8-10', restSec: 90  },
                { exerciseId: 'ex_incline_bench',  name: 'Incline DB Press',   targetSets: 3, targetReps: '10-12',restSec: 60  },
                { exerciseId: 'ex_lat_pulldown',   name: 'Lat Pulldown',       targetSets: 3, targetReps: '10-12',restSec: 60  },
                { exerciseId: 'ex_lateral_raise',  name: 'Lateral Raise',      targetSets: 3, targetReps: '12-15',restSec: 45  },
                { exerciseId: 'ex_lunges',         name: 'Lunges',             targetSets: 3, targetReps: '12',   restSec: 60  },
                { exerciseId: 'ex_crunch',         name: 'Crunch',             targetSets: 3, targetReps: '20',   restSec: 45  },
              ],
            },
            { dayNumber: 4, label: 'Rest', focus: [], restSec: 0, exercises: [] },
            {
              dayNumber: 5,
              label: 'Full Body C',
              focus: ['full-body'],
              restSec: 60,
              exercises: [
                { exerciseId: 'ex_squat',          name: 'Squat',              targetSets: 3, targetReps: '10-12',restSec: 60  },
                { exerciseId: 'ex_pushup',         name: 'Push-Up',            targetSets: 3, targetReps: 'AMRAP',restSec: 60  },
                { exerciseId: 'ex_pullup',         name: 'Pull-Up / Lat PD',   targetSets: 3, targetReps: '8-10', restSec: 60  },
                { exerciseId: 'ex_hip_thrust',     name: 'Hip Thrust',         targetSets: 3, targetReps: '12-15',restSec: 60  },
                { exerciseId: 'ex_db_curl',        name: 'DB Curl',            targetSets: 2, targetReps: '12',   restSec: 45  },
                { exerciseId: 'ex_tricep_pushdown',name: 'Tricep Pushdown',    targetSets: 2, targetReps: '12',   restSec: 45  },
                { exerciseId: 'ex_mountain_climber',name: 'Mountain Climbers', targetSets: 3, targetReps: '30s',  restSec: 30  },
              ],
            },
            {
              dayNumber: 6,
              label: 'Cardio (HIIT)',
              focus: ['cardio'],
              restSec: 0,
              exercises: [
                { exerciseId: 'ex_burpee',         name: 'HIIT Circuit — Burpees', targetSets: 4, targetReps: '10',  restSec: 30 },
                { exerciseId: 'ex_jump_rope',      name: 'Jump Rope',             targetSets: 4, targetReps: '60s', restSec: 30 },
                { exerciseId: 'ex_jumping_jack',   name: 'Jumping Jacks',         targetSets: 4, targetReps: '30',  restSec: 30 },
                { exerciseId: 'ex_mountain_climber',name: 'Mountain Climbers',    targetSets: 4, targetReps: '30s', restSec: 30 },
              ],
            },
            { dayNumber: 7, label: 'Rest', focus: [], restSec: 0, exercises: [] },
          ],
        },
      ],
      weekPattern: 'repeat',
    },

    {
      id:           'hiit_resistance',
      name:         'HIIT + Resistance',
      goal:         'weight-loss',
      durationWeeks: 8,
      daysPerWeek:  4,
      restSec:      45,
      description:  'Four days of combined HIIT cardio and resistance training. Circuits keep your heart rate elevated while building lean muscle. Maximum calorie burn in minimum time.',
      highlights:   ['Circuit-style training', '45s rest = more calories burned', 'HIIT finishers every session', 'Time-efficient: 45-55 min'],
      schedule:     [1, 2, 4, 5],
      weeks: [
        {
          weekNumber: 1,
          note: 'Complete exercises as a circuit where noted. Minimal rest within circuit, 90s rest between rounds.',
          days: [
            {
              dayNumber: 1,
              label: 'Upper Body Circuit',
              focus: ['chest', 'back', 'shoulders', 'cardio'],
              restSec: 45,
              exercises: [
                { exerciseId: 'ex_bench_press',    name: 'Bench Press',        targetSets: 3, targetReps: '12',   restSec: 45 },
                { exerciseId: 'ex_barbell_row',    name: 'Barbell Row',        targetSets: 3, targetReps: '12',   restSec: 45 },
                { exerciseId: 'ex_ohp',            name: 'Overhead Press',     targetSets: 3, targetReps: '12',   restSec: 45 },
                { exerciseId: 'ex_pullup',         name: 'Pull-Up',            targetSets: 3, targetReps: 'AMRAP',restSec: 45 },
                { exerciseId: 'ex_burpee',         name: 'Burpees (finisher)', targetSets: 3, targetReps: '10',   restSec: 30 },
                { exerciseId: 'ex_mountain_climber',name: 'Mountain Climbers', targetSets: 3, targetReps: '30s',  restSec: 30 },
              ],
            },
            {
              dayNumber: 2,
              label: 'Lower Body Circuit',
              focus: ['quads', 'hamstrings', 'glutes', 'cardio'],
              restSec: 45,
              exercises: [
                { exerciseId: 'ex_squat',          name: 'Squat',              targetSets: 4, targetReps: '12',   restSec: 60 },
                { exerciseId: 'ex_rdl',            name: 'Romanian Deadlift',  targetSets: 3, targetReps: '12',   restSec: 60 },
                { exerciseId: 'ex_lunges',         name: 'Walking Lunges',     targetSets: 3, targetReps: '12ea', restSec: 45 },
                { exerciseId: 'ex_glute_bridge',   name: 'Glute Bridge',       targetSets: 3, targetReps: '15',   restSec: 45 },
                { exerciseId: 'ex_box_jump',       name: 'Box Jumps',          targetSets: 3, targetReps: '10',   restSec: 45 },
                { exerciseId: 'ex_jump_rope',      name: 'Jump Rope',          targetSets: 3, targetReps: '60s',  restSec: 30 },
              ],
            },
            { dayNumber: 3, label: 'Rest / Active Recovery', focus: [], restSec: 0, exercises: [] },
            {
              dayNumber: 4,
              label: 'Full Body HIIT',
              focus: ['full-body', 'cardio'],
              restSec: 30,
              exercises: [
                { exerciseId: 'ex_deadlift',       name: 'Deadlift',           targetSets: 3, targetReps: '10',   restSec: 90  },
                { exerciseId: 'ex_pushup',         name: 'Push-Up',            targetSets: 3, targetReps: 'AMRAP',restSec: 45  },
                { exerciseId: 'ex_kettlebell_swing',name: 'KB Swing',          targetSets: 4, targetReps: '15',   restSec: 45  },
                { exerciseId: 'ex_burpee',         name: 'Burpees',            targetSets: 3, targetReps: '10',   restSec: 30  },
                { exerciseId: 'ex_box_jump',       name: 'Box Jumps',          targetSets: 3, targetReps: '8',    restSec: 45  },
                { exerciseId: 'ex_mountain_climber',name: 'Mountain Climbers', targetSets: 3, targetReps: '30s',  restSec: 30  },
              ],
            },
            {
              dayNumber: 5,
              label: 'Core & Cardio',
              focus: ['core', 'cardio'],
              restSec: 30,
              exercises: [
                { exerciseId: 'ex_plank',          name: 'Plank Hold',         targetSets: 3, targetReps: '60s',  restSec: 45  },
                { exerciseId: 'ex_crunch',         name: 'Crunches',           targetSets: 3, targetReps: '20',   restSec: 30  },
                { exerciseId: 'ex_leg_raise',      name: 'Leg Raise',          targetSets: 3, targetReps: '15',   restSec: 30  },
                { exerciseId: 'ex_russian_twist',  name: 'Russian Twist',      targetSets: 3, targetReps: '20',   restSec: 30  },
                { exerciseId: 'ex_ab_wheel',       name: 'Ab Wheel Rollout',   targetSets: 3, targetReps: '10',   restSec: 45  },
                { exerciseId: 'ex_running',        name: '20 min LISS Run',    targetSets: 1, targetReps: '20 min',restSec: 0  },
              ],
            },
            { dayNumber: 6, label: 'Rest', focus: [], restSec: 0, exercises: [] },
            { dayNumber: 7, label: 'Rest', focus: [], restSec: 0, exercises: [] },
          ],
        },
      ],
      weekPattern: 'repeat',
    },
  ];

  function getAll() {
    return PLANS;
  }

  function getById(id) {
    return PLANS.find((p) => p.id === id) || null;
  }

  function getByGoal(goal) {
    return PLANS.filter((p) => p.goal === goal);
  }

  function getGoals() {
    return [
      { id: 'strength',    label: 'Strength',       emoji: '🏋️' },
      { id: 'shred',       label: 'Get Shredded',   emoji: '🔥' },
      { id: 'weight-loss', label: 'Weight Loss',    emoji: '⚡' },
    ];
  }

  // Get the workout day for a given date based on the active plan
  function getPlannedDayForDate(plan, dateStr) {
    if (!plan) return null;
    const start     = new Date(plan.startDate + 'T00:00:00');
    const target    = new Date(dateStr         + 'T00:00:00');
    const diffDays  = Math.round((target - start) / 86400000);
    if (diffDays < 0) return null;

    const planData  = getById(plan.planId);
    if (!planData) return null;

    const week1     = planData.weeks[0];
    const dayCount  = week1.days.length; // typically 7
    const dayIdx    = diffDays % dayCount;
    return week1.days[dayIdx] || null;
  }

  return { getAll, getById, getByGoal, getGoals, getPlannedDayForDate };
})();
