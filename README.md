# CAMPUSPILOT


**An agentic AI assistant that automates student utilities and guides students around campus.**

Built for **Track 01: #Smart_Campus** (2026 Tracks): *Automate student utilities plus campus navigation.*

> A student says what they need, in text or voice, in their own language. CampusPilot plans the steps, asks for confirmation, completes the task, and logs everything.

---

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Safety and Trust](#safety-and-trust)
- [Seed Data](#seed-data)
- [Roadmap](#roadmap)
- [Team](#team)
- [License](#license)

---

## Features

### 1. Utility automation (agentic)
- Understands requests like *"I need a bonafide certificate"*, *"book the physics lab Friday 3pm"*, *"hostel Wi-Fi is down"*, *"my ID card was lost"*.
- Plans multi-step actions: fills forms, files tickets, books slots, checks status.
- **Human-in-the-loop:** explicit student confirmation, and department approval where needed, before any consequential action.
- **Audit trail** for every action the agent takes.

### 2. Campus navigation
- Indoor and outdoor routing to buildings, labs, classrooms, library, canteen, and offices.
- Natural-language queries: *"nearest open printer"*, *"where is my next class?"*
- Considers timetable, opening hours, and accessibility (ramps, lifts).

### 3. Trust and safety
- Answers only from verified campus data and cites the source.
- Says *"I'm not sure"* and escalates to a human instead of guessing.
- College-email OTP login with role-based permissions.

### 4. Multilingual and voice
- Text and voice input and output in English plus at least 2 regional languages.

---

## Demo

**3-minute flow**

1. Log in with college-email OTP.
2. Say: *"Book the chemistry lab tomorrow at 2 and show me how to get there."*
3. The agent checks availability, asks for confirmation, books the slot, and logs it.
4. The map opens with step-by-step directions.
5. Ask something out of scope. The agent admits uncertainty and escalates to a human.

<!-- Add screenshots / GIF / video link here -->
- Demo video: _add link_
- Live app: _add link_

---

## Architecture

```
            +-------------------+
            |  Student (PWA)    |   text / voice (STT in, TTS out)
            +---------+---------+
                      |
                      v
            +-------------------+
            |   API Backend     |   auth, sessions, RBAC
            +---------+---------+
                      |
                      v
        +-----------------------------+
        |         Agent Layer         |
        |  Planner -> Tool Router ->  |
        |  Confirmation Gate          |
        +----+-----------+--------+---+
             |           |        |
             v           v        v
      +-----------+ +---------+ +-----------+
      |  Service  | |  RAG    | |  Maps /   |
      |  Tools    | | (verif. | |  Campus   |
      | (cert,    | |  docs + | |  Graph    |
      |  booking, | |  cites) | |           |
      |  tickets) | +---------+ +-----------+
      +-----+-----+
            |
            v
   +------------------+      +------------------+
   | Postgres         |      | Approval Queue   |
   | requests + audit |<---->| (departments)    |
   +------------------+      +------------------+
```

**Key design rule:** the agent can *propose* any action, but consequential actions only execute after the confirmation gate (student) and, where required, department approval.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React / Next.js PWA, dark theme, rounded cards, cream pill buttons |
| Backend | FastAPI (or Node) |
| Database | PostgreSQL (requests, approvals, audit log) |
| Agent | LLM with tool calling, planner, confirmation gate |
| Knowledge | RAG over campus documents with source citations |
| Maps | OpenStreetMap or custom campus graph |
| Voice | STT + TTS (e.g. Rime for speech output) |

> Adjust this table to match what you actually ship.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- API keys for your LLM and voice providers

### 1. Clone
```bash
git clone https://github.com/<your-username>/campuspilot.git
cd campuspilot
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in values
python scripts/seed.py           # loads sample campus data
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local       # then fill in values
npm run dev
```

Open http://localhost:3000.

---

## Environment Variables

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `LLM_API_KEY` | Key for the LLM provider |
| `TTS_API_KEY` | Key for the text-to-speech provider |
| `STT_API_KEY` | Key for the speech-to-text provider |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | For sending OTP emails |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated college domains |
| `JWT_SECRET` | Secret for session tokens |

**Frontend (`frontend/.env.local`)**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |

Never commit real keys. `.env` files are git-ignored.

---

## Project Structure

```
campuspilot/
├── frontend/            # Next.js PWA
│   ├── app/             # routes: login, chat, map, requests
│   └── components/
├── backend/
│   ├── app/
│   │   ├── agent/       # planner, tool router, confirmation gate
│   │   ├── tools/       # certificates, bookings, tickets, status
│   │   ├── rag/         # ingestion, retrieval, citations
│   │   ├── nav/         # campus graph and routing
│   │   ├── auth/        # OTP login, RBAC
│   │   └── audit/       # audit log
│   └── scripts/seed.py
├── data/                # seeded campus dataset (policies, timetable, map)
├── docs/                # architecture diagram, screenshots
└── README.md
```

> Update to match your real layout.

---

## Safety and Trust

- **No silent actions:** every consequential action needs explicit confirmation.
- **Approvals:** department approval is enforced for restricted workflows.
- **Audit log:** who asked, what the agent planned, what ran, what was approved, and when.
- **Grounded answers:** responses come from verified campus data and include citations.
- **Uncertainty handling:** low-confidence or policy-conflicting requests are escalated to a human instead of guessed.
- **Access control:** college-email OTP login with role-based permissions (student, staff, admin).

---

## Seed Data

The repo ships with a **sample campus dataset** so the demo is reproducible:

- Buildings, rooms, labs, and a walkable campus graph
- Sample timetable and opening hours
- Policy and handbook excerpts for retrieval
- Example departments and approvers

Re-seed anytime with `python backend/scripts/seed.py`.

---

## Roadmap

- [ ] Indoor navigation with floor-level routing
- [ ] More regional languages
- [ ] Push notifications for approval status
- [ ] Admin dashboard for request analytics
- [ ] Integration with the real college ERP

---

## Team

| Name | Role |
|---|---|
| _Your name_ | _Role_ |

---

## License

Released under the [MIT License](LICENSE). Replace if you choose a different license.
