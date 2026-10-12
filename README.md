# Placemap AI – Enterprise Placement Assessment Suite (in progress)

## Implemented
Auth (JWT + bcryptjs) with roles, resume builder + rule-based ATS estimate, aptitude tests (randomized, timed, scored server-side, review, history),
job description saving + application tracker, dashboard from real data, dark mode, collapsible sidebar.

## Not yet implemented
Coding platform (Judge0), AI mock interview, career coach/study plan, admin dashboard UI + CRUD, PDF export, resume upload, cover letter, Gemini integration, deployment guide.

## Run (Windows PowerShell)
Backend:
    cd backend
    npm install express mongoose bcryptjs jsonwebtoken zod helmet cors express-rate-limit dotenv morgan
    Copy-Item .env.example .env        # then set JWT_SECRET (32+ chars)
    $env:SEED_ADMIN_EMAIL="admin@example.com"; $env:SEED_ADMIN_PASSWORD="Admin12345"; npm run seed
    npm run dev
Frontend (new terminal):
    cd frontend
    npm install react react-dom react-router-dom lucide-react recharts
    npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
    npm run dev                          # open http://localhost:5173
Tests: `cd backend; npm test`  (14 pass, no database needed)

ATS score = round(0.7 x keyword match % + 0.3 x section completeness %). It is an estimate, not a real company ATS score.
Seeded aptitude questions are SAMPLE content.
