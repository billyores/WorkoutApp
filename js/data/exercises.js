// WT.Exercises — master exercise list with muscle group metadata
window.WT = window.WT || {};

WT.Exercises = (function () {
  const MUSCLE_GROUPS = {
    chest:         'Chest',
    back:          'Back',
    lats:          'Lats',
    traps:         'Traps',
    shoulders:     'Shoulders',
    'front-delts': 'Front Delts',
    'side-delts':  'Side Delts',
    'rear-delts':  'Rear Delts',
    biceps:        'Biceps',
    triceps:       'Triceps',
    forearms:      'Forearms',
    core:          'Core',
    quads:         'Quads',
    hamstrings:    'Hamstrings',
    glutes:        'Glutes',
    calves:        'Calves',
    'hip-flexors': 'Hip Flexors',
    cardio:        'Cardio',
    'full-body':   'Full Body',
  };

  // Joints are tracked for injury purposes but not assigned to exercises as muscle groups
  const JOINTS = {
    knee:          'Knee',
    elbow:         'Elbow',
    neck:          'Neck',
    'lower-back':  'Lower Back',
    hip:           'Hip',
    ankle:         'Ankle',
    wrist:         'Wrist',
  };

  const EXERCISES = [
    // ── Chest ──────────────────────────────────────────────
    { id: 'ex_bench_press',        name: 'Bench Press',            muscleGroups: ['chest', 'front-delts', 'triceps'],   isBodyweight: false },
    { id: 'ex_incline_bench',      name: 'Incline Bench Press',    muscleGroups: ['chest', 'front-delts', 'triceps'],   isBodyweight: false },
    { id: 'ex_decline_bench',      name: 'Decline Bench Press',    muscleGroups: ['chest', 'triceps'],                  isBodyweight: false },
    { id: 'ex_db_fly',             name: 'Dumbbell Fly',           muscleGroups: ['chest'],                             isBodyweight: false },
    { id: 'ex_cable_fly',          name: 'Cable Fly',              muscleGroups: ['chest'],                             isBodyweight: false },
    { id: 'ex_pushup',             name: 'Push-Up',                muscleGroups: ['chest', 'front-delts', 'triceps'],   isBodyweight: true  },
    { id: 'ex_incline_pushup',     name: 'Incline Push-Up',        muscleGroups: ['chest', 'triceps'],                  isBodyweight: true  },
    { id: 'ex_dips_chest',         name: 'Dips (Chest)',           muscleGroups: ['chest', 'triceps'],                  isBodyweight: true  },

    // ── Back ───────────────────────────────────────────────
    { id: 'ex_deadlift',           name: 'Deadlift',               muscleGroups: ['back', 'hamstrings', 'glutes', 'traps'], isBodyweight: false },
    { id: 'ex_barbell_row',        name: 'Barbell Row',            muscleGroups: ['back', 'lats', 'biceps'],            isBodyweight: false },
    { id: 'ex_db_row',             name: 'Dumbbell Row',           muscleGroups: ['back', 'lats', 'biceps'],            isBodyweight: false },
    { id: 'ex_cable_row',          name: 'Cable Row',              muscleGroups: ['back', 'lats', 'biceps'],            isBodyweight: false },
    { id: 'ex_lat_pulldown',       name: 'Lat Pulldown',           muscleGroups: ['lats', 'biceps'],                    isBodyweight: false },
    { id: 'ex_pullup',             name: 'Pull-Up',                muscleGroups: ['lats', 'biceps', 'back'],            isBodyweight: true  },
    { id: 'ex_chinup',             name: 'Chin-Up',                muscleGroups: ['lats', 'biceps'],                    isBodyweight: true  },
    { id: 'ex_face_pull',          name: 'Face Pull',              muscleGroups: ['rear-delts', 'traps'],               isBodyweight: false },
    { id: 'ex_shrug',              name: 'Barbell Shrug',          muscleGroups: ['traps'],                             isBodyweight: false },
    { id: 'ex_hyperextension',     name: 'Hyperextension',         muscleGroups: ['back', 'hamstrings', 'glutes'],      isBodyweight: true  },

    // ── Shoulders ──────────────────────────────────────────
    { id: 'ex_ohp',                name: 'Overhead Press (OHP)',   muscleGroups: ['shoulders', 'front-delts', 'triceps'], isBodyweight: false },
    { id: 'ex_db_ohp',             name: 'Dumbbell Shoulder Press',muscleGroups: ['shoulders', 'front-delts', 'triceps'], isBodyweight: false },
    { id: 'ex_lateral_raise',      name: 'Lateral Raise',          muscleGroups: ['side-delts'],                        isBodyweight: false },
    { id: 'ex_front_raise',        name: 'Front Raise',            muscleGroups: ['front-delts'],                       isBodyweight: false },
    { id: 'ex_rear_delt_fly',      name: 'Rear Delt Fly',          muscleGroups: ['rear-delts'],                        isBodyweight: false },
    { id: 'ex_arnold_press',       name: 'Arnold Press',           muscleGroups: ['shoulders', 'front-delts', 'side-delts'], isBodyweight: false },

    // ── Arms ───────────────────────────────────────────────
    { id: 'ex_barbell_curl',       name: 'Barbell Curl',           muscleGroups: ['biceps'],                            isBodyweight: false },
    { id: 'ex_db_curl',            name: 'Dumbbell Curl',          muscleGroups: ['biceps'],                            isBodyweight: false },
    { id: 'ex_hammer_curl',        name: 'Hammer Curl',            muscleGroups: ['biceps', 'forearms'],                isBodyweight: false },
    { id: 'ex_preacher_curl',      name: 'Preacher Curl',          muscleGroups: ['biceps'],                            isBodyweight: false },
    { id: 'ex_cable_curl',         name: 'Cable Curl',             muscleGroups: ['biceps'],                            isBodyweight: false },
    { id: 'ex_skullcrusher',       name: 'Skull Crusher',          muscleGroups: ['triceps'],                           isBodyweight: false },
    { id: 'ex_tricep_pushdown',    name: 'Tricep Pushdown',        muscleGroups: ['triceps'],                           isBodyweight: false },
    { id: 'ex_overhead_ext',       name: 'Overhead Tricep Extension', muscleGroups: ['triceps'],                        isBodyweight: false },
    { id: 'ex_dips_tricep',        name: 'Dips (Tricep)',          muscleGroups: ['triceps', 'chest'],                  isBodyweight: true  },
    { id: 'ex_close_grip_bench',   name: 'Close Grip Bench Press', muscleGroups: ['triceps', 'chest'],                  isBodyweight: false },

    // ── Legs ───────────────────────────────────────────────
    { id: 'ex_squat',              name: 'Squat',                  muscleGroups: ['quads', 'hamstrings', 'glutes'],     isBodyweight: false },
    { id: 'ex_front_squat',        name: 'Front Squat',            muscleGroups: ['quads', 'glutes'],                   isBodyweight: false },
    { id: 'ex_leg_press',          name: 'Leg Press',              muscleGroups: ['quads', 'hamstrings', 'glutes'],     isBodyweight: false },
    { id: 'ex_lunges',             name: 'Lunges',                 muscleGroups: ['quads', 'hamstrings', 'glutes'],     isBodyweight: false },
    { id: 'ex_rdl',                name: 'Romanian Deadlift (RDL)',muscleGroups: ['hamstrings', 'glutes', 'back'],       isBodyweight: false },
    { id: 'ex_leg_curl',           name: 'Leg Curl',               muscleGroups: ['hamstrings'],                        isBodyweight: false },
    { id: 'ex_leg_ext',            name: 'Leg Extension',          muscleGroups: ['quads'],                             isBodyweight: false },
    { id: 'ex_glute_bridge',       name: 'Glute Bridge',           muscleGroups: ['glutes', 'hamstrings'],              isBodyweight: true  },
    { id: 'ex_hip_thrust',         name: 'Hip Thrust',             muscleGroups: ['glutes', 'hamstrings'],              isBodyweight: false },
    { id: 'ex_calf_raise',         name: 'Calf Raise',             muscleGroups: ['calves'],                            isBodyweight: false },
    { id: 'ex_standing_calf',      name: 'Standing Calf Raise',    muscleGroups: ['calves'],                            isBodyweight: false },
    { id: 'ex_bulgarian_split',    name: 'Bulgarian Split Squat',  muscleGroups: ['quads', 'glutes', 'hamstrings'],     isBodyweight: false },
    { id: 'ex_bodyweight_squat',   name: 'Bodyweight Squat',       muscleGroups: ['quads', 'hamstrings', 'glutes'],     isBodyweight: true  },

    // ── Core ───────────────────────────────────────────────
    { id: 'ex_plank',              name: 'Plank',                  muscleGroups: ['core'],                              isBodyweight: true  },
    { id: 'ex_crunch',             name: 'Crunch',                 muscleGroups: ['core'],                              isBodyweight: true  },
    { id: 'ex_situp',              name: 'Sit-Up',                 muscleGroups: ['core'],                              isBodyweight: true  },
    { id: 'ex_leg_raise',          name: 'Leg Raise',              muscleGroups: ['core', 'hip-flexors'],               isBodyweight: true  },
    { id: 'ex_ab_wheel',           name: 'Ab Wheel Rollout',       muscleGroups: ['core'],                              isBodyweight: true  },
    { id: 'ex_cable_crunch',       name: 'Cable Crunch',           muscleGroups: ['core'],                              isBodyweight: false },
    { id: 'ex_russian_twist',      name: 'Russian Twist',          muscleGroups: ['core'],                              isBodyweight: true  },
    { id: 'ex_hanging_leg_raise',  name: 'Hanging Leg Raise',      muscleGroups: ['core', 'hip-flexors'],               isBodyweight: true  },

    // ── Cardio / Full Body ─────────────────────────────────
    { id: 'ex_running',            name: 'Running',                muscleGroups: ['cardio'],                            isBodyweight: true  },
    { id: 'ex_cycling',            name: 'Cycling',                muscleGroups: ['cardio', 'quads'],                   isBodyweight: false },
    { id: 'ex_rowing',             name: 'Rowing Machine',         muscleGroups: ['cardio', 'back', 'biceps'],          isBodyweight: false },
    { id: 'ex_jump_rope',          name: 'Jump Rope',              muscleGroups: ['cardio', 'calves'],                  isBodyweight: true  },
    { id: 'ex_burpee',             name: 'Burpee',                 muscleGroups: ['full-body', 'cardio'],               isBodyweight: true  },
    { id: 'ex_jumping_jack',       name: 'Jumping Jacks',          muscleGroups: ['cardio'],                            isBodyweight: true  },
    { id: 'ex_mountain_climber',   name: 'Mountain Climbers',      muscleGroups: ['core', 'cardio'],                    isBodyweight: true  },
    { id: 'ex_box_jump',           name: 'Box Jump',               muscleGroups: ['quads', 'glutes', 'cardio'],         isBodyweight: true  },
    { id: 'ex_kettlebell_swing',   name: 'Kettlebell Swing',       muscleGroups: ['glutes', 'hamstrings', 'back'],      isBodyweight: false },
    { id: 'ex_clean_press',        name: 'Clean & Press',          muscleGroups: ['full-body'],                         isBodyweight: false },
  ];

  function getAll() {
    const custom = (typeof WT !== 'undefined' && WT.Storage)
      ? WT.Storage.getCustomExercises()
      : [];
    return [...EXERCISES, ...custom];
  }

  function getById(id) {
    return EXERCISES.find((e) => e.id === id) || null;
  }

  function search(query) {
    if (!query) return EXERCISES;
    const q = query.toLowerCase().trim();
    return EXERCISES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroups.some((g) => g.includes(q) || MUSCLE_GROUPS[g]?.toLowerCase().includes(q))
    );
  }

  function getByMuscleGroup(group) {
    return EXERCISES.filter((e) => e.muscleGroups.includes(group));
  }

  function getMuscleGroups() {
    return MUSCLE_GROUPS;
  }

  function getJoints() {
    return JOINTS;
  }

  // Returns a human-readable string of muscle groups for an exercise
  function formatMuscles(exercise) {
    return exercise.muscleGroups
      .map((g) => MUSCLE_GROUPS[g] || g)
      .join(', ');
  }

  return { getAll, getById, search, getByMuscleGroup, getMuscleGroups, getJoints, formatMuscles };
})();
