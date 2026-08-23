import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import showcaseImage from '../assets/showcase.jpg';
import {
  Network,
  Compass,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Zap,
  CheckCircle,
  Play,
  ArrowUpRight,
  BookOpenCheck,
  Sparkles
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen bg-cream-50 text-slate-800 selection:bg-indigo-100 font-sans relative overflow-x-hidden">
      
      {/* Premium Lavender / Pink Background Waves */}
      <div className="absolute top-0 left-0 w-full h-[650px] pointer-events-none z-0 overflow-hidden">
        <svg className="absolute w-full h-full" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
          <path d="M-100 0 L1540 0 L1540 380 C1100 480 900 280 400 420 C100 480 -100 420 -100 380 Z" fill="url(#hero-grad)" opacity="0.45" />
          <defs>
            <linearGradient id="hero-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ede9fe" /> {/* Soft Lavender */}
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffe4e6" /> {/* Soft Pink */}
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 w-full h-16 bg-white/70 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <RouterLink to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-650/10">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">SkillGraph</span>
          </RouterLink>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-500">
            <a href="#what-is-it" className="hover:text-indigo-600 transition-colors">What is SkillGraph?</a>
            <a href="#flow" className="hover:text-indigo-600 transition-colors">Product Flow</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Core Capabilities</a>
            <a href="#showcase" className="hover:text-indigo-600 transition-colors">Showcase</a>
          </nav>

          <div className="flex items-center space-x-4">
            <RouterLink
              to="/login"
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              Login
            </RouterLink>
            <RouterLink
              to="/register"
              className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-600/15 transition-all hover:scale-[1.02]"
            >
              Get Started
            </RouterLink>
          </div>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="relative z-10 py-16 lg:py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left text column */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 leading-[1.08]">
            Map Your <span className="text-indigo-600">Skills.</span> <br />
            Build Your <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Future.</span>
          </h1>
          
          <p className="text-slate-655 text-sm md:text-base max-w-md leading-relaxed font-semibold">
            Understand what you know, discover what you're missing, and build the skills that move your career forward.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-3">
            <RouterLink
              to="/register"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs uppercase tracking-wider font-extrabold shadow-lg shadow-indigo-600/20 flex items-center justify-center transition-all hover:scale-[1.02]"
            >
              Explore Your Skills
              <ArrowRight className="w-4 h-4 ml-2" />
            </RouterLink>
            <RouterLink
              to="/login"
              className="px-6 py-3.5 border border-indigo-150 hover:border-indigo-200 bg-white/80 hover:bg-white text-indigo-650 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center justify-center transition-all"
            >
              Discover Skill Gaps
            </RouterLink>
          </div>
        </div>

        {/* Right Graphic Workspace column */}
        <div className="lg:col-span-7 flex justify-center relative">
          
          {/* Floating tags */}
          <div className="absolute top-2 left-16 bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-md animate-float pointer-events-none z-20">
            DSA
          </div>
          <div className="absolute top-12 -left-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-md animate-float-delayed animation-delay-2000 pointer-events-none z-20">
            TypeScript
          </div>
          <div className="absolute top-10 right-28 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-md animate-float animation-delay-4000 pointer-events-none z-20">
            Next.js
          </div>

          {/* Core high-polish Desk Illustration */}
          <svg className="w-full max-w-[540px] h-auto z-10 drop-shadow-2xl" viewBox="0 0 500 360" fill="none">
            {/* Table Surface */}
            <path d="M 50 310 Q 250 340 450 310 L 470 340 L 30 340 Z" fill="#e2e8f0" opacity="0.6" />
            
            {/* Blue Desk Lamp on the right */}
            <g id="desk-lamp">
              <ellipse cx="410" cy="305" rx="20" ry="6" fill="#1e1b4b" />
              <path d="M 410 300 C 420 250 440 220 420 160" stroke="#1e1b4b" strokeWidth="5" fill="none" />
              <path d="M 420 160 L 380 150" stroke="#1e1b4b" strokeWidth="4" />
              <path d="M 380 135 L 360 165 A 12 12 0 0 0 380 175 L 400 145 Z" fill="#312e81" />
              <polygon points="360,165 200,260 270,310 380,175" fill="#fef08a" opacity="0.12" />
            </g>

            {/* Book Cup/Holder with Pencils */}
            <g id="pencil-holder">
              <rect x="365" y="260" width="22" height="40" rx="3" fill="#1e1b4b" />
              <line x1="370" y1="260" x2="368" y2="245" stroke="#fbbf24" strokeWidth="3" />
              <line x1="376" y1="260" x2="376" y2="242" stroke="#f43f5e" strokeWidth="2.5" />
              <line x1="382" y1="260" x2="384" y2="246" stroke="#10b981" strokeWidth="3" />
            </g>

            {/* Standing vertical books on the right */}
            <g id="standing-books">
              <rect x="420" y="200" width="18" height="100" fill="#3b82f6" rx="2" />
              <rect x="422" y="205" width="14" height="90" fill="#1d4ed8" rx="1" />
              <text x="429" y="270" fill="#ffffff" fontSize="6" fontWeight="bold" transform="rotate(-90 429 270)" textAnchor="middle">DSA</text>

              <rect x="440" y="208" width="18" height="92" fill="#8b5cf6" rx="2" />
              <rect x="442" y="213" width="14" height="82" fill="#6d28d9" rx="1" />
              <text x="449" y="270" fill="#ffffff" fontSize="5" fontWeight="bold" transform="rotate(-90 449 270)" textAnchor="middle">DESIGN</text>
            </g>

            {/* Potted Plant */}
            <g id="potted-plant">
              <path d="M 215 270 L 235 270 L 230 295 L 220 295 Z" fill="#d1d5db" />
              <path d="M 225 270 Q 210 240 205 210" stroke="#10b981" strokeWidth="2.5" fill="none" />
              <ellipse cx="205" cy="210" rx="6" ry="12" fill="#10b981" transform="rotate(-30 205 210)" />
              <ellipse cx="212" cy="235" rx="5" ry="10" fill="#10b981" transform="rotate(20 212 235)" />
              
              <path d="M 225 270 Q 240 240 245 220" stroke="#10b981" strokeWidth="2" fill="none" />
              <ellipse cx="245" cy="220" rx="5" ry="10" fill="#10b981" transform="rotate(30 245 220)" />
            </g>

            {/* Coffee Mug on the left */}
            <g id="mug">
              <rect x="180" y="275" width="24" height="30" rx="6" fill="#1e1b4b" />
              <path d="M 180 282 C 170 282 170 298 180 298" stroke="#1e1b4b" strokeWidth="3" fill="none" />
            </g>

            {/* Open notebook */}
            <path d="M 200 305 L 260 295 L 320 305 L 290 320 L 230 320 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="260" y1="295" x2="260" y2="320" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Stack of books */}
            <g id="books-stack">
              <rect x="220" y="280" width="130" height="15" rx="3" fill="#f97316" />
              <rect x="222" y="283" width="126" height="3" fill="#ea580c" />
              
              <rect x="215" y="265" width="140" height="15" rx="3" fill="#fef3c7" stroke="#cbd5e1" strokeWidth="0.5" />
              <rect x="217" y="268" width="136" height="3" fill="#fde68a" />
              
              <rect x="225" y="250" width="120" height="15" rx="3" fill="#3b82f6" />
              <rect x="227" y="253" width="116" height="3" fill="#1d4ed8" />
            </g>

            {/* Laptop screen skill graph */}
            <g id="laptop">
              <path d="M 215 240 L 355 240 L 370 252 L 200 252 Z" fill="#475569" />
              <rect x="270" y="247" width="30" height="3" rx="1.5" fill="#334155" />
              
              <rect x="230" y="150" width="110" height="88" rx="6" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
              <rect x="234" y="154" width="102" height="80" rx="3" fill="#1e293b" />
              
              <g id="screen-network" opacity="0.95">
                <line x1="285" y1="194" x2="265" y2="175" stroke="#6366f1" strokeWidth="1" />
                <line x1="285" y1="194" x2="305" y2="175" stroke="#6366f1" strokeWidth="1" />
                <line x1="285" y1="194" x2="260" y2="194" stroke="#8b5cf6" strokeWidth="1" />
                <line x1="285" y1="194" x2="310" y2="194" stroke="#8b5cf6" strokeWidth="1" />
                <line x1="285" y1="194" x2="265" y2="213" stroke="#0ea5e9" strokeWidth="1" />
                <line x1="285" y1="194" x2="305" y2="213" stroke="#0d9488" strokeWidth="1" />
                
                <circle cx="285" cy="194" r="11" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="285" y="196" fontSize="5" fontWeight="bold" fill="#312e81" textAnchor="middle">You</text>
                
                <circle cx="265" cy="175" r="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
                <text x="265" y="177" fontSize="3" fontWeight="bold" fill="#ffffff" textAnchor="middle">JS</text>

                <circle cx="305" cy="175" r="6" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="1" />
                <text x="305" y="177" fontSize="3" fontWeight="bold" fill="#ffffff" textAnchor="middle">React</text>

                <circle cx="260" cy="194" r="6" fill="#1e1b4b" stroke="#0ea5e9" strokeWidth="1" />
                <text x="260" y="196" fontSize="3" fontWeight="bold" fill="#ffffff" textAnchor="middle">Node</text>

                <circle cx="310" cy="194" r="6" fill="#1e1b4b" stroke="#0d9488" strokeWidth="1" />
                <text x="310" y="196" fontSize="3" fontWeight="bold" fill="#ffffff" textAnchor="middle">Py</text>

                <circle cx="265" cy="213" r="6" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="1" />
                <text x="265" y="215" fontSize="3" fontWeight="bold" fill="#ffffff" textAnchor="middle">DB</text>

                <circle cx="305" cy="213" r="6" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1" />
                <text x="305" y="215" fontSize="3" fontWeight="bold" fill="#ffffff" textAnchor="middle">AI</text>
              </g>
            </g>
          </svg>
        </div>
      </section>

      {/* 2. What is SkillGraph Section */}
      <section id="what-is-it" className="py-24 bg-white border-y border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left illustration: Large network diagram */}
            <div className="lg:col-span-6 flex justify-center">
              <svg className="w-full max-w-[400px] h-auto" viewBox="0 0 320 260" fill="none">
                <g stroke="#cbd5e1" strokeWidth="2">
                  <line x1="160" y1="40" x2="80" y2="120" />
                  <line x1="160" y1="40" x2="240" y2="120" />
                  <line x1="80" y1="120" x2="80" y2="200" strokeDasharray="3,3" />
                  <line x1="240" y1="120" x2="240" y2="200" />
                  <line x1="80" y1="200" x2="160" y2="240" />
                  <line x1="240" y1="200" x2="160" y2="240" strokeDasharray="3,3" />
                </g>

                <circle cx="160" cy="40" r="20" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
                <text x="160" y="43" fontSize="8" fontWeight="extrabold" fill="#312e81" textAnchor="middle">JavaScript</text>

                <circle cx="80" cy="120" r="18" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="2" />
                <text x="80" y="123" fontSize="8" fontWeight="extrabold" fill="#5b21b6" textAnchor="middle">React</text>

                <circle cx="240" cy="120" r="18" fill="#ccfbf1" stroke="#0d9488" strokeWidth="2" />
                <text x="240" y="123" fontSize="8" fontWeight="extrabold" fill="#115e59" textAnchor="middle">Node.js</text>

                <circle cx="80" cy="200" r="18" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x="80" y="203" fontSize="7" fontWeight="extrabold" fill="#075985" textAnchor="middle">TypeScript</text>

                <circle cx="240" cy="200" r="18" fill="#ecfeff" stroke="#06b6d4" strokeWidth="1.5" />
                <text x="240" y="203" fontSize="7" fontWeight="extrabold" fill="#083344" textAnchor="middle">MongoDB</text>

                <circle cx="160" cy="240" r="16" fill="#fff1f2" stroke="#f43f5e" strokeWidth="2" />
                <text x="160" y="243" fontSize="7" fontWeight="extrabold" fill="#9f1239" textAnchor="middle">Full Stack</text>
              </svg>
            </div>

            {/* Right: Description text */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 w-fit">
                Career Intelligence Platform
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                What is SkillGraph?
              </h2>
              <p className="text-slate-655 text-sm leading-relaxed font-semibold">
                SkillGraph is a career and skill intelligence platform designed specifically for engineering students to systematically analyze their skills, identify visual paths, and unlock real job opportunities.
              </p>
              <ul className="space-y-3.5 text-xs text-slate-655 font-bold">
                {[
                  'Discover your current skills and log achievements.',
                  'Visualize your credentials as a connected visual Skill Graph.',
                  'Identify real gaps between your competencies and target career tracks.',
                  'Learn next steps dynamically via custom resources recommendations.'
                ].map((li, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-2.5 shrink-0 mt-0.5" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Flow Section */}
      <section id="flow" className="py-24 bg-cream-50/20 z-10 relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-150 rounded-full px-2.5 py-1">
              Your Journey Mapping
            </span>
            <h2 className="text-2xl font-black text-slate-850 tracking-tight">Your Skills. Your Career. One Connected Map.</h2>
            <p className="text-slate-600 text-xs font-semibold leading-relaxed">
              SkillGraph connects what you know with where you want to go through a unified engineering progression workflow.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            {[
              { step: 'YOUR CURRENT SKILLS', desc: 'Identify your strengths and log proficiencies.' },
              { step: 'SKILL GRAPH', desc: 'Visualize your capabilities as a network map.' },
              { step: 'SKILL GAP ANALYSIS', desc: 'Discover missing nodes for your target career.' },
              { step: 'PERSONALIZED LEARNING', desc: 'Study dynamically matched learning paths.' },
              { step: 'CAREER MATCH', desc: 'Compare matching scores against career tracks.' },
              { step: 'JOB OPPORTUNITIES', desc: 'Explore and apply to opportunities fitting your profile.' }
            ].map((item, idx) => (
              <div key={idx} className="relative p-5 bg-white border border-slate-200/50 rounded-3xl flex flex-col justify-between shadow-sm">
                <div>
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                    0{idx + 1}
                  </span>
                  <h4 className="font-extrabold text-[10.5px] text-slate-800 uppercase tracking-tight leading-tight">{item.step}</h4>
                </div>
                <p className="text-[9.5px] text-slate-455 mt-2 font-semibold leading-relaxed">{item.desc}</p>
                {idx < 5 && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 text-slate-350 font-bold text-base">&rarr;</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Core Features Section */}
      <section id="features" className="py-24 bg-white z-10 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-md mx-auto space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-650 bg-rose-50 border border-rose-150 rounded-full px-2.5 py-1">
              Capabilities Catalog
            </span>
            <h2 className="text-2xl font-black text-slate-850 tracking-tight">Core Platform Features</h2>
            <p className="text-slate-600 text-xs font-semibold leading-relaxed">
              Every tool you need to guide your engineering career with data-driven confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Network,
                title: 'Skill Graph',
                desc: 'See how your skills connect. View visual relationships mapping prerequisite dependencies, specializations, and related tracks.',
                color: 'text-indigo-650 bg-indigo-50 border-indigo-100'
              },
              {
                icon: Zap,
                title: 'Skill Gap Analysis',
                desc: 'Discover exactly what you\'re missing for your target career. Compare your profile levels against live role specifications.',
                color: 'text-rose-650 bg-rose-50 border-rose-100'
              },
              {
                icon: Compass,
                title: 'Career Explorer',
                desc: 'Compare career paths and understand their required skills. Explore technology areas, pathways, and role expectations.',
                color: 'text-amber-650 bg-amber-50 border-amber-100'
              },
              {
                icon: Award,
                title: 'Personalized Recommendations',
                desc: 'Know what to learn next based on your actual skill gaps. Prioritizes missing nodes to unblock your goals.',
                color: 'text-purple-650 bg-purple-50 border-purple-100'
              },
              {
                icon: BookOpen,
                title: 'Progress Tracking',
                desc: 'Track your growth from beginner to career ready. Complete study milestones and automatically update your skills catalog.',
                color: 'text-emerald-650 bg-emerald-50 border-emerald-100'
              },
              {
                icon: TrendingUp,
                title: 'Job Matching',
                desc: 'Discover opportunities that match your current skill profile. Renders compatibility scores and lists matched skill summaries.',
                color: 'text-sky-650 bg-sky-50 border-sky-100'
              },
              {
                icon: Sparkles,
                title: 'SkillGraph AI',
                desc: 'Ask an AI career assistant for personalized guidance. Review details, learn gap adjustments, and generate customized roadmaps.',
                color: 'text-indigo-650 bg-pink-50 border-pink-100'
              }
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200/40 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">{f.title}</h4>
                <p className="text-xs text-slate-655 leading-relaxed font-semibold">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-24 bg-white border-t border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
              Visual Workspace
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Experience Career Intelligence</h2>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Take control of your growth with an interactive skill mapping desk, dynamic gap analyzer, and target career paths.
            </p>
          </div>
          
          <div className="flex justify-center max-w-4xl mx-auto border border-slate-200/60 rounded-3xl overflow-hidden shadow-2xl p-4 bg-slate-50">
            <img 
              src={showcaseImage} 
              alt="SkillGraph Product Showcase" 
              className="w-full h-auto rounded-2xl border border-slate-205 shadow-inner"
            />
          </div>
        </div>
      </section>

      {/* 5. Turn Your Skills Into a Career Path CTA */}
      <section className="py-20 bg-cream-50 relative z-10 px-6 max-w-7xl mx-auto">
        <div className="bg-indigo-650 rounded-3xl p-8 md:p-12 text-center text-white space-y-6 relative overflow-hidden shadow-xl shadow-indigo-600/10">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Turn Your Skills Into a Career Path
          </h2>
          <p className="text-indigo-150 text-xs max-w-md mx-auto leading-relaxed font-bold">
            SkillGraph connects what you know, what you need to learn, and where you want your career to go — all in one visual platform.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <a
              href="#what-is-it"
              className="px-6 py-3.5 border border-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs uppercase tracking-wider font-extrabold inline-flex items-center shadow-md transition-all hover:scale-[1.02]"
            >
              Explore SkillGraph
            </a>
            <RouterLink
              to="/register"
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-indigo-650 rounded-xl text-xs uppercase tracking-wider font-extrabold inline-flex items-center shadow-md transition-all hover:scale-[1.02]"
            >
              Create Your Student Account
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </RouterLink>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 text-white">
            <Network className="w-5 h-5 text-indigo-500" />
            <span className="text-base font-bold">SkillGraph</span>
          </div>
          <p className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
            &copy; {new Date().getFullYear()} SkillGraph. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
