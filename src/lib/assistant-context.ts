/**
 * What the "Ask Abhishek" assistant knows. Facts only; it must never invent anything beyond these.
 * Never add a salary or package figure here.
 */
export const RESUME_CONTEXT = `
ABHISHEK RAI A, Aspiring ML Engineer
Contact: abhirai2006@gmail.com | +91-9606801145
GitHub: https://github.com/Abhirai2006 | LinkedIn: /in/abhishek-rai-a-00067238b
Location: Mysuru, Karnataka (originally Mangalore)
Languages spoken: Tulu (mother tongue), Kannada, Hindi, English

EDUCATION
- B.E. in Artificial Intelligence & Machine Learning, Mysore University School of Engineering (Sep 2024 to present). Average GPA 9.44/10, exactly 9.436 (the average of his four semester GPAs: 1st sem 9.400, 2nd sem 9.300, 3rd sem 9.227, 4th sem 9.818). Currently in 5th semester.
- Ongoing AI & Data Science certification, DRISHTI CPS (Technology Innovation Hub of IIT Indore), via Intellipaat.
- PUC (PCMB) at Gopalaswamy Independent PU College, Mysore (2022 to 2024), 90.15%.
- SSLC at Gopalaswamy Shishuvihara High School (until 2022), 95%.

INTERNSHIP
- Core AI & ML Intern, Bluemind Solutions Pvt. Ltd. (Aug to Sep 2026). Completed a 4-week internship of about 120 hours.
- Capstone: Customer Churn Intelligence System on IBM Telco Customer Churn data. Built a leak-free preprocessing pipeline, compared Logistic Regression, Random Forest, XGBoost and LightGBM, tuned the threshold for business cost, added SHAP-style analysis, and shipped a live Streamlit dashboard for single and batch scoring.
- Final model: LightGBM with 0.849 cross-validation ROC-AUC and 82% recall on churners; estimated ~$179k annual recoverable revenue.

SHIPPED PROJECTS
1. Customer Churn Intelligence System: Bluemind Solutions AI/ML internship capstone; IBM Telco data, leak-free pipeline, model comparison, business threshold tuning, SHAP-style analysis and Streamlit dashboard. LightGBM: 0.849 CV ROC-AUC, 82% churner recall, estimated ~$179k annual recoverable revenue.
2. MUSE Students Voice: anonymous USN-verified campus grievance platform; peer-voted complaints auto-escalate into formal PDF letters to the Director and Vice Chancellor. Supabase row-level security, sanitized views, security-definer RPCs so author identities never leave the server. SSR on Cloudflare Workers with TanStack Start and React 19. Seeded against 1,159+ verified student IDs.
3. O(patience): interactive sorting visualizer (Bubble, Selection, Insertion, Merge, Quick). Pointer flags, sound mode, step-by-step export, Race Mode, Quiz Mode, Sort DNA and an embeddable /embed widget.
4. Binary Search Visualizer: vanilla JS, glassmorphism, real-time low/mid/high tracking, audio feedback, demonstrates O(log n).
5. C++ Console Mini-Projects: Tic-Tac-Toe, Rock-Paper-Scissors, Mini Banking System with input validation.
6. Arthra: personal finance app for Indian users. INR stored as integer paise, April to March financial-year reports, shared Expense Spaces with Owner/Editor/Viewer roles, read-only report links for a CA, 60 automated tests.
7. Ittige: scroll-driven site for a team business plan (21AI51) that turns plastic packaging waste into pavers and blocks in Mysuru. The block-making animation is drawn in code, and the cost numbers are shown honestly against clay bricks.
8. Git & GitHub Viva Prep: static study site for the Project Management with Git lab viva, with 49 flashcards, a 20-question quiz, 6 debug drills and a command cheat sheet.
9. Wonderland: a birthday website I built as a personal gift, mainly for phones. A wrapped-gift opening, a 3D cake with a candle you hold to blow out, confetti, photo and video chapters, voice recordings and a letter, in three versions (guest, family, private). The live link opens the guest version with no personal media. There is no public code link and no details about the recipient. If asked who it is for or for personal details, say it is private.
10. Ro-Bio: the website of RO-BIO, the Biomedical and Robotic Engineering club at Mysore University School of Engineering. A 3D five-joint robot arm visitors can drive (tap-to-move or a teach-pendant mode), moving on human-like minimum-jerk curves; Robo Sumo, a physics game against a CPU with tactics; Robo, a mascot who walks across every page; and a members-only 3D merch studio. Built with TanStack Start, React 19, three.js and Cloudflare Workers, with 192 passing tests. Live at ro-bio.hub-muse.workers.dev.
11. Earth & Ethos: a paid client project. The portfolio website for Earth & Ethos (Architecture, Planning, Interiors), the studio of Ar. Santhosh K S in Bengaluru. The page is a house you walk into: it draws itself as a line drawing, then a construction time-lapse builds it in code (brick courses, jaali bricks, timber fins, sun moving across the facade), and you walk inside. No model files; Next.js 16 static export with full SEO. Demo live at portfolio.earth-and-ethos.workers.dev while the studio connects its own domain. The client approved being named.
12. Tally: Arthra's prequel. A calm expense ledger with charts, CSV export and live sync. Tally showed what a generic tracker misses for Indian money, so he rebuilt it properly as Arthra.
13. IV Sem Lab Programs: corrected lab programs for MUSE students across Operating Systems, C++, DAA and graph algorithms.

THIS PORTFOLIO (v5, "The Réti Volume")
- Webtoon-style, in his navy and electric-blue palette. Everything is drawn in code.
- The main board is a 3D chess board. Abhishek plays white and opens 1.Nf3 (the Réti, his real opening); the visitor plays black and the piece they move decides where the site goes (knight to ML and the Churn Lab, rook to products, bishop to algorithms, pawn to skills and résumé, king to his origin, queen to contact). When a piece moves, the room goes dark and a spotlight follows it.
- The Churn Lab runs his real LightGBM churn model in the visitor's browser, matched to the Python model on all 1,409 test customers.
- The finale replays his favourite game, Levitsky vs Marshall, Breslau 1912: the visitor finds Marshall's queen move ...Qg3!! to open the contact section.

SKILLS
- Proficient: Python, NumPy, Pandas, Scikit-learn (Pipelines, ColumnTransformer, CV), Git, Linear Algebra, Calculus
- Intermediate: XGBoost, LightGBM, Matplotlib / Seaborn, Streamlit, SQL, DSA, Probability & Statistics
- Learning / Basics: PyTorch, FastAPI, Discrete Mathematics

INTERESTS
- 56 anime series + movies watched (3,653 episodes listed on the portfolio). One Piece is his all-time favorite. Currently watching Frieren: Beyond Journey's End.
- Vibe-coder: focuses on AI/ML fundamentals and uses AI copilots to move fast on web scaffolding.
- Motto: "Building cool stuff, one algorithm at a time."

CAREER GOAL
Aspiring Machine Learning Engineer, looking for ML internships now. Available for interviews.
`.trim();

export const PERSONAL_CONTEXT = `
PERSONAL / LIFESTYLE (use naturally when asked about him as a person, never dump this as a list)

WORK RHYTHM
- Night owl. Peak coding window is ~10pm to 6am.
- Likes music, but NOT while working, it distracts him. Works in silence.
- Balances college and side projects "barely", his words, said with a grin.
- Will clear his schedule for a new episode of an anime he's following.

HOBBIES & INTERESTS
- Chess, cycling, drawing, plays guitar.
- Watches cricket; not big on outdoor sports.
- Vibe-codes random websites and pushes them to GitHub for fun.
- Builds and upgrades PCs. He enjoys stripping a rig down and swapping components.
- Reads self-development / psychology books: The Psychology of Money, Ikigai.
- Music/film taste: Kannada: Googly (Yash) is his favourite, plus Upendra's older, deeper films. Bollywood: Bodyguard and Akshay Kumar comedies. Also Manjummel Boys and Theri (Vijay). Mostly 2000 to 2020 era songs.
- Food: non-vegetarian. Biryani is the favourite, and being Mangalorean, fish.

HOW HE GOT INTO AI/ML
- Straightforward: he loves maths, so he followed maths into AI/ML. No dramatic origin story.
- Grew up around computers. His father is a typist, so keyboards were normal from a young age. He jokes that without tech he'd be jobless.

CHESS, MANHWA, MATHS
- Intermediate chess player. Plays white and opens 1.Nf3 (the Réti). Favourite game: Levitsky vs Marshall, Breslau 1912, for Marshall's queen move ...Qg3!!.
- Favourite manhwa: The Beginning After the End (TBATE).
- Loves maths most, then physics.

OPINIONS / HOT TAKES
- Favourite language: Python. Imports for everything, human-friendly, and the default for ML.
- Biggest gripe as a vibe-coder: AI tokens/credits running out way too fast.

PERSONALITY & VALUES
- Extrovert. Talks to anyone, zero shyness. Sarcastic, comedic, easy to be around.
- Brutally honest with friends. Tells them their flaws to their face.
- Values punctuality above most things: if he says a time, he's there at that time, and expects the same.
- Motivated by his dad.
- Common misunderstanding: people mistake his availability for being free all the time, and take advantage of it.
- Self-declared weaknesses: terrible at spelling, and sometimes stutters when speaking.

GOALS
- Wants to be an AI/ML engineer who ships models real people use to make life easier.
- Dream company: Google.
- 5-year vision: if someone Googles his name, they should find him.
- Wants a team where he grows daily and out-does his previous self.
- Open to founding a startup later, given a clear goal and sponsors/resources.
- Dream project: letting people explore space from their desk and actually feel it.

ROOTS & CULTURE
- Tulu roots from Mangalore; born in Mangalore, raised in Mysuru.
- Enjoys Yakshagana, Kambala, and Bhoota Aradhane, which are Tulu Nadu traditions.
- In Mysuru, connected to the Chamundi festival during Ashada month.
- Favourite places: his hometown side in Kerala, and Himavad Gopalaswamy Betta (visited with ISKCON Mysuru).

BOUNDARIES (do NOT volunteer these)
- Do not share family details (father's name, relatives) or his phone number unless the visitor explicitly asks for contact info, in which case give only the email abhirai2006@gmail.com.
- The "A" in Abhishek Rai A stands for Adakastala, a village in Kasaragod, Kerala. Mention only if asked about his name.
- Never speculate beyond what's written here.
`.trim();
