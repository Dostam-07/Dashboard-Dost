import React from 'react';
import { Upload, Plus, BarChart2, MessageSquare, LayoutDashboard, Lightbulb, Share, Layers, FileDown } from 'lucide-react';

export const HomeLandingView = ({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div className="max-w-4xl w-full mx-auto flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-10 w-full animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-zinc-50 tracking-tight font-sans">
            Welcome to Dashboard-Dost
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Your AI-powered partner for data analysis and storytelling. 
            <br className="hidden sm:block" />
            Upload data, ask questions, and get insights in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('datasets')}
              className="w-full sm:w-auto px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Dataset
            </button>
            <button
              onClick={() => onNavigate('dashboards')}
              className="w-full sm:w-auto px-6 py-3 font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Dashboard
            </button>
          </div>
        </div>

        {/* What You Can Do Section (5 Cards) */}
        <div className="w-full mb-12 animate-fade-in [animation-delay:150ms]">
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-4 tracking-tight">What you can do</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Upload & Explore Data', desc: 'Upload CSV/Excel files and instantly profile your data with AI.', icon: BarChart2, bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' },
              { title: 'Ask Anything', desc: 'Ask questions in natural language and get accurate answers from your data.', icon: MessageSquare, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
              { title: 'Create Dashboards', desc: 'Build interactive dashboards in seconds with AI-powered recommendations.', icon: LayoutDashboard, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
              { title: 'Get AI Insights', desc: 'Discover trends, anomalies, and key insights automatically.', icon: Lightbulb, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
              { title: 'Export & Share', desc: 'Export dashboards and reports or share with your team.', icon: FileDown, bg: 'bg-pink-100 dark:bg-pink-900/30', color: 'text-pink-600 dark:text-pink-400' },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-4 rounded-full mb-4 ${feature.bg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm mb-2">{feature.title}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works Section */}
        <div className="w-full bg-slate-50 dark:bg-zinc-900/40 rounded-2xl p-6 md:p-8 border border-slate-200/60 dark:border-zinc-800/60 animate-fade-in [animation-delay:300ms]">
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-6 text-center tracking-tight">How it works</h3>
          <div className="flex flex-col sm:flex-row justify-between relative gap-6">
            <div className="hidden sm:block absolute top-[22px] left-[10%] right-[10%] h-px border-t-2 border-dashed border-slate-200 dark:border-zinc-800" />
            {[
              { step: '1', title: 'Upload Data', desc: 'Upload your CSV or Excel files in just a few clicks.', icon: Upload, bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600' },
              { step: '2', title: 'Ask Questions', desc: 'Use natural language to ask questions about your data.', icon: MessageSquare, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600' },
              { step: '3', title: 'Get Insights', desc: 'AI analyzes your data and delivers instant insights.', icon: Lightbulb, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600' },
              { step: '4', title: 'Build & Share', desc: 'Create dashboards, customize, export and share with others.', icon: Layers, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
            ].map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center relative z-10 w-full">
                <div className="flex items-center gap-3 sm:flex-col mb-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm ${step.color}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className={`font-black text-xl font-mono ${step.color}`}>{step.step}</div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm mb-1">{step.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 stroke-current border-slate-400 rounded-sm stroke-2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          Your data is private and secure. We never share your data with anyone.
        </div>
      </div>
    </div>
  );
};
