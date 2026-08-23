import React from 'react';
import { Award, Briefcase, TrendingUp, Users, Shield, Sparkles } from 'lucide-react';

const CareerMarket = () => {
  // Static dataset representing the seed metrics, explicitly marked as sample opportunities
  const trendingSkills = [
    { name: 'JavaScript', percentage: 92, count: 48, trend: '+4% MoM' },
    { name: 'React', percentage: 86, count: 42, trend: '+8% MoM' },
    { name: 'Node.js', percentage: 80, count: 36, trend: '+2% MoM' },
    { name: 'Docker', percentage: 74, count: 30, trend: '+12% MoM' },
    { name: 'Python', percentage: 68, count: 28, trend: '+6% MoM' },
    { name: 'Kubernetes', percentage: 55, count: 20, trend: '+15% MoM' }
  ];

  const popularRoles = [
    { title: 'Full Stack Developer', jobs: 24, averageSalary: '$140k', urgency: 'High' },
    { title: 'Backend Developer', jobs: 18, averageSalary: '$130k', urgency: 'High' },
    { title: 'Frontend Developer', jobs: 15, averageSalary: '$115k', urgency: 'Medium' },
    { title: 'DevOps Engineer', jobs: 12, averageSalary: '$150k', urgency: 'Medium' }
  ];

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto relative">
      
      {/* Page Title Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Market Intelligence</h1>
          <p className="text-xs text-slate-400 font-semibold">Engineering skill trends, role demands, and opportunity analytics.</p>
        </div>
        
        {/* Sample Marker Warning Banner */}
        <div className="mt-4 sm:mt-0 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Sample Market Data</span>
        </div>
      </div>

      {/* Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Skill Demand Trends) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-650" />
              <span>Trending Engineering Skills</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Index Rating</span>
          </div>

          <div className="space-y-4">
            {trendingSkills.map((sk) => (
              <div key={sk.name} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="text-slate-800">{sk.name}</span>
                  <div className="space-x-2">
                    <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{sk.trend}</span>
                    <span className="text-slate-450">{sk.percentage}% demand</span>
                  </div>
                </div>

                <div className="h-2.5 bg-slate-50 border border-slate-150/40 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${sk.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Popular Role Demands) */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-855 text-sm tracking-tight flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-4.5 h-4.5 text-indigo-650" />
              <span>Role Demands Summary</span>
            </h3>

            <div className="space-y-4 divide-y divide-slate-100">
              {popularRoles.map((role, idx) => (
                <div key={idx} className="pt-4.5 first:pt-0 flex items-center justify-between text-xs font-bold">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-xs">{role.title}</h4>
                    <p className="text-[10px] text-slate-400">Avg Salary: {role.averageSalary}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-800 block text-xs">{role.jobs} listings</span>
                    <span className={`text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      role.urgency === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {role.urgency} Demand
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Insights Info Card */}
          <div className="bg-gradient-to-tr from-indigo-50/50 to-pink-50/30 border border-slate-200/30 rounded-3xl p-6 shadow-sm space-y-3">
            <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Developer Insights</span>
            </h4>
            <p className="text-xs text-slate-450 leading-relaxed">
              Based on overall listing requirements, backend developers are expected to maintain at least Level 3 proficiency in Node.js, Express.js, and MongoDB NoSQL queries to unlock entry positions.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CareerMarket;
