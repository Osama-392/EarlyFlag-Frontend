EarlyFlag — FERPA & COPPA Compliance Checklist
Purpose: Requirements EarlyFlag must meet before selling into schools/districts. Organized
by legal framework, then by who owns the work (Legal vs. Dev/Product).
Note: This is a working checklist to guide development and legal review — not a substitute
for an education-privacy attorney drafting the actual contracts. Get counsel to finalize the
DPA and COPPA notice before signing any district.
1. FERPA (Family Educational Rights and Privacy Act)
Applies to all K-12 students regardless of age, whenever a school receives federal funding
(virtually all public schools).
Legal / Contract
Signed Data Privacy Agreement (DPA) with each district — use the Student Data
Privacy Consortium’s National Data Privacy Addendum (NDPA) as the base template
rather than drafting from scratch
EarlyFlag formally designated as a “school official” in the district’s annual FERPA rights
notice
Contract explicitly states data is used only for the authorized educational purpose
(intervention/risk tracking) — no secondary use
Contract requires data be returned or destroyed at contract termination
Product / Dev
District/school-level roster provisioning (SIS sync or admin-managed roster upload) —
no individual teacher self-signup that manually enters student PII
Mechanism for the school to access and review what data is stored on a given student
Mechanism for the school to request correction of inaccurate records
Role-based access control: teachers see only their own roster; school admin sees
school-wide; district admin sees district-wide
Audit log of every access/view/export of a student record
2. COPPA (Children’s Online Privacy Protection Act)
Applies to students under 13 — realistically 6th grade and part of 7th grade in your MS
population. High school is largely outside COPPA’s scope, but treat MS accounts as covered
by default rather than trying to carve out by age roster-by-roster.
Amended rule is now in full effect (compliance deadline was April 22, 2026) — this is
current, active law, not a future deadline.
Legal / Contract
Formal COPPA notice delivered to each school before data collection begins — a
specific document (not the general privacy policy), disclosing:
Categories of data collected
Categories of third parties who receive it
Data retention policy
Whether any biometric data is collected (facial recognition, voiceprints, etc. — flag if
this ever becomes relevant)
Documented school authorization on file (district consents in place of individual
parents) — must be an actual signed record, not implied consent via onboarding clickthrough
Contract explicitly states data is used only for educational purposes, never
commercial
Contract gives the school the ability to review or delete a child’s data and prevent
further collection
Explicit authorization clause for any use of student data in AI/LLM processing —
separate from general use terms
Separate, documented consent required before any third-party disclosure (no relying on
a blanket clause)
Product / Dev
Written information security program (this is now a legal requirement under the
amended rule, not just good practice)
Written data retention policy with a defined deletion timeline — indefinite retention is
explicitly banned under the amended rule
Full, actual data deletion capability per student (true purge, not just removal from an
active flagging list) with an audit trail proving deletion occurred
Student data must never be used to train or fine-tune models for other customers or
general product improvement, without separate explicit authorization
Encryption at rest and in transit
3. Cross-Cutting Requirements (both frameworks)
Never sell or share student data with any third party for any commercial purpose
No advertising use of student data, ever
Maintain a published, current subprocessor list (LLM provider, Twilio/SMS provider,
hosting) — each one contractually bound to the same restrictions
Breach detection and notification workflow — check state-specific notification
timelines in addition to federal requirements
Awareness of state-level student privacy laws layered on top of FERPA/COPPA (e.g.,
NY Ed Law 2-d, California, Illinois SOPPA) — the NDPA template above is built to cover
most of this patchwork in one document, but confirm with counsel for your target states
4. Sales/Go-to-Market Implication
Sell to districts or schools, not individual teachers directly — this is what makes the
“school official” (FERPA) and “school authorization” (COPPA) exceptions apply in the
first place. An individual teacher’s personal subscription with no institutional agreement
doesn’t get this legal cover.
Free-to-teacher / paid-to-institution is both the more defensible legal structure and the
more scalable revenue structure — they’re solving the same problem.