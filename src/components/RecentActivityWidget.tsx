import React from 'react';
import { useAppStore } from '../store';
import { Activity } from 'lucide-react';

export const RecentActivityWidget = () => {
  const { activityLog } = useAppStore();

  return (
    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/40">
      <div className="flex items-center gap-1.5 mb-2 px-2.5">
        <Activity className="h-3.5 w-3.5 text-indigo-500" />
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 tracking-widest font-mono uppercase">
          Recent Activity
        </span>
      </div>
      <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1.5 px-2">
        {activityLog.length === 0 ? (
          <p className="text-[10px] text-slate-400 italic">No recent actions.</p>
        ) : (
          activityLog.slice(0, 10).map((act) => (
            <div key={act.id} className="text-[10px] p-2 bg-slate-50 dark:bg-zinc-900/40 rounded-lg flex flex-col gap-1">
              <span className="text-slate-600 dark:text-zinc-300 font-medium">{act.text}</span>
              <span className="text-[8px] text-slate-400 font-mono">
                {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
