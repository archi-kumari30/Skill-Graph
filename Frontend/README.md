# SkillGraph Frontend

This is the interactive frontend application for **SkillGraph**, built with React.js, Vite, React Router, Axios, and Tailwind CSS. It communicates directly with the running Node/Express backend to visualize personal and organizational capability registers.

---

## 1. Project Overview & Product Vision
SkillGraph provides developers and organizational managers with visual insights into competencies:
- **Landing Page**: Public marketing overview showing feature descriptions and How-it-Works instructions.
- **Login/Register**: Secure signup mapping name, email, department, and custom roles.
- **Executive Dashboard**: Organizational summary cards and lists of key skill gaps.
- **Skill Inventory (My Skills)**: Search, add, update, and cascade-remove skills from your profile using the database catalog.
- **Interactive SVG Graph**: Visually pan, zoom, click nodes, and display side drawers detailing prerequisite arrow links dynamically.
- **Recommendations**: prioritized roadmap recommendations resolving dependencies first.
- **Team Talent Analytics**: Simulates collective team scores and lists lead members for career roles (Managers/Admins only).

---

## 2. Technology Stack
- **React.js**: Single page application framework.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS**: Utility-first CSS styling framework.
- **Axios**: HTTP client configuration with central request/response interceptors.
- **Lucide React**: Clean vector icon widgets.
- **Recharts**: D3-driven React chart layouts.

---

## 3. Directory Layout
```
Frontend/
├── src/
│   ├── assets/
│   │   └── index.css       # Tailwind base styles and scrollbar definitions
│   ├── components/         # Reusable widgets
│   │   ├── EmptyState.jsx  # Zero-state indicator
│   │   ├── ErrorState.jsx  # Connection alert card
│   │   ├── LoadingSpinner.jsx # Spinner overlay
│   │   └── ProgressBar.jsx # Skill rating bar
│   ├── context/
│   │   └── AuthContext.jsx # Session contexts
│   ├── layouts/
│   │   └── DashboardLayout.jsx # Collapsible sidebar navigation layout
│   ├── pages/              # Landing, Login, Register, Dashboard, MySkills, SkillDetail, SkillGraph, SkillGaps, Recommendations, Progress, Profile, TeamAnalysis
│   ├── services/
│   │   └── api.js          # Centralized Axios setup
│   ├── App.jsx             # Routers configuration & private/role guards
│   └── main.jsx            # Mounting script
├── index.html              # Core HTML structure
├── postcss.config.js       # CSS post-processing plugins
├── tailwind.config.js      # Color schemes configurations
├── vite.config.js          # Vite plugins configurations
├── .env                    # Local environment variables
└── README.md               # User deployment guidelines
```

---

## 4. Environment Configurations
Create a `.env` file in the root of the `Frontend` folder with:
```env
VITE_API_URL=http://localhost:5000
```
This specifies the host of the backend server. The application loads this variable via `import.meta.env.VITE_API_URL` within the API service layer.

---

## 5. How to Run

### 1. Install Dependencies
Navigate into the `Frontend/` folder and run:
```bash
npm install
```

### 2. Boot Vite Dev Server
```bash
# Starts development environment on port 5173
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Compilation
```bash
# Bundles clean HTML/JS/CSS assets into a dist/ directory
npm run build
```
You can review the bundled outputs or serve them using `npm run preview`.
