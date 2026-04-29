-- Axiom Demo Data Seed Script
-- Run this AFTER the main migration to pre-fill data for demo
-- Replace 'DEMO_USER_ID' with the actual auth.users UUID after sign up

-- First, sign up a demo student in the app, then get their user ID:
-- SELECT id FROM auth.users WHERE email = 'demo@axiom.study';

-- Then replace all occurrences of 'DEMO_USER_ID' below and run this script.

-- ===== STUDENT PROFILE =====
UPDATE users SET full_name = 'Arjun Sharma' WHERE id = 'DEMO_USER_ID';

UPDATE students SET
  exam_type = 'JEE',
  target_date = (NOW() + INTERVAL '45 days')::date,
  syllabus_text = 'JEE Main 2026 - Complete Physics, Chemistry, Mathematics syllabus including Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics, Organic Chemistry, Inorganic Chemistry, Physical Chemistry, Calculus, Algebra, Coordinate Geometry, Trigonometry'
WHERE user_id = 'DEMO_USER_ID';

-- ===== STUDY GOALS =====
INSERT INTO study_goals (student_id, exam_name, target_date, target_score, progress_pct)
SELECT s.id, 'JEE Advanced 2026', (NOW() + INTERVAL '45 days')::date, 250, 58
FROM students s WHERE s.user_id = 'DEMO_USER_ID';

-- ===== DAILY PROGRESS (last 7 days) =====
INSERT INTO daily_progress (student_id, date, study_minutes, chapters_covered, quiz_score)
SELECT s.id, d.date, d.minutes, d.chapters, d.score
FROM students s, (VALUES
  (CURRENT_DATE - 6, 145, '["Kinematics", "Newton Laws"]'::jsonb, 78),
  (CURRENT_DATE - 5, 120, '["Work Energy Power"]'::jsonb, 82),
  (CURRENT_DATE - 4, 180, '["Rotational Motion", "Gravitation"]'::jsonb, 75),
  (CURRENT_DATE - 3, 90, '["Chemical Bonding"]'::jsonb, 88),
  (CURRENT_DATE - 2, 160, '["Calculus - Derivatives"]'::jsonb, 71),
  (CURRENT_DATE - 1, 200, '["Thermodynamics", "Kinetic Theory"]'::jsonb, 85),
  (CURRENT_DATE, 45, '["Electrostatics"]'::jsonb, NULL)
) AS d(date, minutes, chapters, score)
WHERE s.user_id = 'DEMO_USER_ID';

-- ===== STUDY PLAN =====
INSERT INTO study_plans (student_id, title, subject, milestones, status)
SELECT s.id, 'JEE 2026 Master Plan', 'All',
  '[
    {"week": 1, "title": "Mechanics & Kinematics", "done": true},
    {"week": 2, "title": "Work, Energy & Rotational Motion", "done": true},
    {"week": 3, "title": "Thermodynamics & Kinetic Theory", "done": false},
    {"week": 4, "title": "Electrostatics & Current Electricity", "done": false},
    {"week": 5, "title": "Organic Chemistry & Bonding", "done": false},
    {"week": 6, "title": "Calculus & Coordinate Geometry", "done": false}
  ]'::jsonb,
  'active'
FROM students s WHERE s.user_id = 'DEMO_USER_ID';

-- ===== CONVERSATIONS =====
INSERT INTO conversations (student_id, title, summary_text)
SELECT s.id, 'Newton''s Laws Deep Dive', 'Discussed all three laws, free body diagrams, and solved 5 JEE-level problems'
FROM students s WHERE s.user_id = 'DEMO_USER_ID';

INSERT INTO conversations (student_id, title, summary_text)
SELECT s.id, 'Organic Chemistry Nomenclature', 'Covered IUPAC naming, functional groups, and common JEE reaction mechanisms'
FROM students s WHERE s.user_id = 'DEMO_USER_ID';

INSERT INTO conversations (student_id, title, summary_text)
SELECT s.id, 'Integration by Parts', 'Mastered the LIATE rule, solved 10 problems, discussed common JEE patterns'
FROM students s WHERE s.user_id = 'DEMO_USER_ID';

-- ===== NOTES =====
INSERT INTO notes (student_id, title, content_json, subject, chapter, source_type, tags)
SELECT s.id, title, content, subject, chapter, source, tags
FROM students s, (VALUES
  ('Newton''s Laws Summary',
   E'## Newton''s Three Laws\n\n**First Law (Inertia):** A body remains at rest or in uniform motion unless acted upon by an external force.\n\n**Second Law:** $F = ma$\n\n**Third Law:** For every action, there is an equal and opposite reaction.\n\n### Key Formulas\n- $F_{net} = \\sum F_i$\n- Weight: $W = mg$\n- Friction: $f = \\mu N$\n\n### JEE Tips\n- Always draw free body diagrams\n- Identify pseudo forces in non-inertial frames\n- Common mistakes: forgetting normal reaction components',
   'Physics', 'Laws of Motion', 'chat_export', ARRAY['mechanics', 'jee', 'important']),
  ('Organic Nomenclature Rules',
   E'## IUPAC Nomenclature\n\n1. Find the longest carbon chain (parent chain)\n2. Number carbons from the end nearest to first substituent\n3. Name substituents alphabetically\n4. Use multiplying prefixes: di-, tri-, tetra-\n\n### Functional Group Priority\nCarboxylic acid > Ester > Amide > Aldehyde > Ketone > Alcohol > Amine\n\n### Common JEE Reactions\n- Wurtz reaction: $2RX + 2Na → R-R + 2NaX$\n- Grignard: $RMgX + CO_2 → RCOOH$',
   'Chemistry', 'Organic Chemistry', 'manual', ARRAY['organic', 'neet', 'naming']),
  ('Derivatives & Applications',
   E'## Differentiation Rules\n\n- Power: $\\frac{d}{dx}x^n = nx^{n-1}$\n- Chain: $\\frac{d}{dx}f(g(x)) = f''(g(x)) \\cdot g''(x)$\n- Product: $(uv)'' = u''v + uv''$\n- Quotient: $(u/v)'' = (u''v - uv'')/v^2$\n\n### Applications\n- Rate of change\n- Maxima/Minima (set $f''(x) = 0$)\n- Tangent slope at point\n\n### JEE Patterns\n- L''Hopital''s Rule for limits\n- Mean Value Theorem\n- Rolle''s Theorem special case',
   'Mathematics', 'Calculus', 'chat_export', ARRAY['calculus', 'jee-advanced'])
) AS n(title, content, subject, chapter, source, tags)
WHERE s.user_id = 'DEMO_USER_ID';

-- ===== FLASHCARDS =====
INSERT INTO flashcards (student_id, subject, chapter, front, back, ease_factor, interval, repetitions, next_review)
SELECT s.id, subject, chapter, front, back, ease, intv, reps, CURRENT_DATE + intv * INTERVAL '1 day'
FROM students s, (VALUES
  ('Physics', 'Laws of Motion', 'State Newton''s Second Law', 'F = ma. The net force on an object equals its mass times acceleration.', 2.6, 4, 3),
  ('Physics', 'Laws of Motion', 'What is a free body diagram?', 'A diagram showing all forces acting on an isolated body, with arrows indicating magnitude and direction.', 2.5, 1, 1),
  ('Physics', 'Thermodynamics', 'Define entropy', 'Entropy (S) is a measure of disorder/randomness. ΔS = Q_rev/T. Always increases in isolated systems.', 2.5, 1, 0),
  ('Chemistry', 'Organic', 'What is Markovnikov''s rule?', 'In addition of HX to an alkene, H adds to the carbon with more H atoms (less substituted carbon).', 2.7, 6, 4),
  ('Chemistry', 'Bonding', 'Explain hybridization', 'Mixing of atomic orbitals to form new hybrid orbitals. sp3=tetrahedral, sp2=trigonal planar, sp=linear.', 2.5, 2, 2),
  ('Mathematics', 'Calculus', 'State L''Hopital''s Rule', 'If lim f(x)/g(x) gives 0/0 or ∞/∞, then lim f(x)/g(x) = lim f''(x)/g''(x).', 2.8, 8, 5),
  ('Mathematics', 'Calculus', 'Integration by parts formula', '∫u dv = uv - ∫v du. Use LIATE for choosing u: Log, Inverse trig, Algebraic, Trig, Exponential.', 2.5, 1, 0),
  ('Physics', 'Electrostatics', 'Coulomb''s Law', 'F = kq₁q₂/r². k = 9×10⁹ Nm²/C². Force is along the line joining charges.', 2.5, 1, 0)
) AS f(subject, chapter, front, back, ease, intv, reps)
WHERE s.user_id = 'DEMO_USER_ID';

-- ===== VIDEO WATCHES =====
INSERT INTO video_watches (student_id, youtube_video_id, title, summary, timestamps_json)
SELECT s.id, vid, title, summary, timestamps
FROM students s, (VALUES
  ('dQw4w9WgXcQ', 'Newton''s Laws — One Shot JEE',
   '## Key Timestamps\n00:00 - Introduction\n05:30 - First Law\n12:00 - Second Law Problems\n25:00 - Third Law Applications\n\n## Main Concepts\n- Inertia and frames of reference\n- F=ma applications\n- Action-reaction pairs\n\n## Key Takeaways\n1. Always draw FBD before solving\n2. Pseudo forces in non-inertial frames\n3. Connected bodies: tension is same throughout',
   '{"timestamps": ["00:00 - Introduction", "05:30 - First Law", "12:00 - Second Law", "25:00 - Third Law"]}'::jsonb)
) AS v(vid, title, summary, timestamps)
WHERE s.user_id = 'DEMO_USER_ID';
