import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, Upload, CheckCircle, Compass, Code, LayoutTemplate, 
  Activity, SlidersHorizontal, Camera, Download, Users, Settings, Sun, Moon, 
  History, Search, HelpCircle, Share2, Star, Trash2
} from 'lucide-react';
import { useAppStore } from '../store';
import { SavedDashboardsManager } from './SavedDashboardsManager';
import { RecentActivityWidget } from './RecentActivityWidget';

interface SecondaryViewsProps {
  activeSidebarMenu: string;
  setActiveSidebarMenu: (menu: any) => void;
  savedDashboards: any[];
  activityLog: any[];
  executeGeneration: (p: string, silent?: boolean) => void;
  isStreaming: boolean;
  toggleTheme: () => void;
  theme: string;
  notify: any;
  setNotify: (notify: any) => void;
  handleNewDashboard: () => void;
  handleLoadDashboardMeta: (dash: any) => void;
  leftSidebarInput: string;
  setLeftSidebarInput: (input: string) => void;
  handleLeftSidebarSubmit: (e: React.FormEvent) => void;
  handleDownloadPDF: () => void;
  handleDownloadScreenshot: () => void;
  showNotification?: (text: string, type?: string) => void;
}

export const SecondaryViews: React.FC<SecondaryViewsProps> = ({
  activeSidebarMenu,
  setActiveSidebarMenu,
  savedDashboards,
  activityLog,
  executeGeneration,
  isStreaming,
  toggleTheme,
  theme,
  notify,
  setNotify,
  handleNewDashboard,
  handleLoadDashboardMeta,
  leftSidebarInput,
  setLeftSidebarInput,
  handleLeftSidebarSubmit,
  handleDownloadPDF,
  handleDownloadScreenshot
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [explorerWidgetType, setExplorerWidgetType] = useState('kpi_card');
  const [explorerXDim, setExplorerXDim] = useState('');
  const [explorerYMetric, setExplorerYMetric] = useState('');
  const [anomalySensitivity, setAnomalySensitivity] = useState(2.5);
  const [starredRating, setStarredRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [auditQuery, setAuditQuery] = useState('');

  const attachedData = useAppStore(state => state.attachedData);
  const setAttachedData = useAppStore(state => state.setAttachedData);

  const triggerNotification = (text: string, type = 'success') => {
    setNotify({ type, message: text });
    setTimeout(() => setNotify(null), 3000);
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedData({
        fileName: file.name,
        content: content
      });
      triggerNotification(`Attached dataset: ${file.name}`);
    };
    reader.readAsText(file);
  };

  switch (activeSidebarMenu) {
    case 'datasets':
      return (
        <div id="datasets-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLocalFileChange} 
            accept=".csv,.xlsx,.xls,.json,.txt" 
            className="hidden" 
          />
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span>Datasets & Connections</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Explore your loaded data schemas, spreadsheet files & relational logs</p>
            </div>
            {attachedData?.fileName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/40">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                Connected: {attachedData.fileName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Upload Structured Data</h3>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-all duration-300 group"
              >
                <Upload className="h-10 w-10 text-slate-400 group-hover:scale-110 group-hover:text-indigo-500 transition-all duration-300 mb-3" />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-250 font-sans">
                  Drag and drop your files here or <strong className="text-indigo-600 dark:text-indigo-400">Browse</strong>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">Supports CSV, XLS, XLSX, JSON, PDF formats (Max 15MB)</span>
              </div>

              {attachedData ? (
                <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-xl p-4 border border-slate-200/50 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-bold text-slate-700 dark:text-zinc-350 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 animate-bounce" />
                      {attachedData.fileName}
                    </span>
                    <button 
                      onClick={() => {
                        setAttachedData(null);
                        triggerNotification("Disconnected dataset", "warning");
                      }}
                      className="text-slate-400 hover:text-rose-500 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                  <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-3">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Schema Headers & Preview</h4>
                    <pre className="text-[10px] font-mono text-slate-550 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-3 rounded-lg max-h-36 overflow-y-auto border border-slate-200 dark:border-zinc-800 shadow-xs leading-relaxed">
                      {attachedData.content?.slice(0, 800) || "Empty file content representation..."}
                      {attachedData.content && attachedData.content.length > 800 ? "\n... (truncated for preview)" : ""}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-6 text-center text-xs text-slate-400 bg-slate-50/20 dark:bg-zinc-950/20 italic">
                  No custom dataset connected. Select a template or attach files to bootstrap dashboard telemetry.
                </div>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Sample Datasets</h3>
                <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Select pre-vetted telemetry metrics and load charts instantly:</p>
                <div className="space-y-2.5 mt-3">
                  {[
                    { title: "📊 Sales & Profits", desc: "Aggregate revenues, product classes, & segments.", prompt: "Generate sales operational dashboard with growth metrics, monthly conversion curves, and segment margins." },
                    { title: "📈 Web Traffic & Cohorts", desc: "User sessions, referral sources, and acquisitions.", prompt: "Generate interactive web traffic dashboard displaying sessions, referral metrics, and acquisition targets." },
                    { title: "🛍️ SaaS Executive Performance", desc: "Monthly active subscriptions, MRR trends, and CAC ratio.", prompt: "Generate modern enterprise SaaS board containing MRR graphs, CAC metrics, and active cohorts." },
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeGeneration(sample.prompt)}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-400 bg-slate-50/30 hover:bg-white dark:border-zinc-900 dark:hover:border-indigo-900 dark:bg-zinc-950/20 dark:hover:bg-zinc-950 transition-all shadow-2xs cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-250 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 block transition-all">{sample.title}</span>
                      <span className="text-[9.5px] text-slate-400 dark:text-zinc-550 block mt-0.5 leading-tight">{sample.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'explorer':
      return (
        <div id="explorer-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Compass className="h-5 w-5 text-violet-500 animate-spin-slow" />
                <span>Data Explorer Sandbox</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Build widgets, test dimensions & customize analytics interactively</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 md:col-span-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Composer Controls</h3>
              
              <div className="space-y-3 font-sans">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase font-mono block mb-1">Widget Type</label>
                  <select 
                    value={explorerWidgetType}
                    onChange={(e) => setExplorerWidgetType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="kpi_card">Aggregate KPI Card</option>
                    <option value="bar">Bar Analytics Chart</option>
                    <option value="line">Line Continuous Trend</option>
                    <option value="area">Area Segment Range</option>
                    <option value="pie">Pie Proportional Share</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase font-mono block mb-1">X-Axis Dimension</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Month, Region" 
                    value={explorerXDim}
                    onChange={(e) => setExplorerXDim(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-250 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase font-mono block mb-1">Y-Axis Metric Key</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Sales, Growth" 
                    value={explorerYMetric}
                    onChange={(e) => setExplorerYMetric(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-250 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none" 
                  />
                </div>

                <button
                  onClick={() => {
                    executeGeneration(`Add a custom ${explorerWidgetType} analyzing performance dimensions over x-axis: "${explorerXDim || 'Default'}" and y-metric: "${explorerYMetric || 'Default'}"`);
                    triggerNotification("Compiling sandbox widget...");
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider font-mono cursor-pointer"
                >
                  Compile Card
                </button>
              </div>
            </div>

            <div className="md:col-span-3 p-8 bg-slate-50 dark:bg-zinc-950/20 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[340px]">
              <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full shadow-md animate-bounce">
                <Code className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-850 dark:text-zinc-200 font-sans">Active Sandbox Compilation Workspace</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed mx-auto font-sans">
                  Use the composer controls on the left to immediately stream fresh responsive metrics directly on your primary layouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'templates':
      return (
        <div id="templates-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-indigo-500" />
                <span>Interactive Dashboard Presets</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Load pre-grouped layout configurations crafted by high-end design specifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "📊 Corporate Sales Operations", desc: "Operating profit, margins, revenues trends, and conversion cohorts.", prompt: "Generate sales and revenue operations dashboard with monthly bar charts and category segment breakdown." },
              { title: "🕸️ Executive Web Analytics", desc: "User acquisition paths, sessions duration, and conversion rates.", prompt: "Generate web analytics session metrics board displaying geo user distribution, daily conversions and search metrics." },
              { title: "🛍️ SaaS Executive Performance", desc: "MRR progress metrics, subscription active targets, ARR counts, and CAC.", prompt: "Generate premium SaaS corporate executive executive metric board with MRR trends, active ARR cohorts, and churn rates." },
              { title: "💰 CFO Ledger Analysis", desc: "Capital accounts, expenditures balances, and balance summaries.", prompt: "Generate a premium Financial Ledger Dashboard containing revenue KPIs, operating cost area charts, and cash balance breakdowns." },
              { title: "🎯 Marketing Campaigns", desc: "Click-through conversion rates, impressions, campaign spends, and ROAS.", prompt: "Generate marketing effectiveness dashboard outlining campaign spend ratios, CTR aggregations, and traffic metrics." }
            ].map((tmpl, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 hover:border-indigo-500 dark:border-zinc-800 dark:hover:border-indigo-500 shadow-sm p-5 space-y-4 flex flex-col justify-between transition-all duration-300 group"
              >
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase text-violet-605 bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded font-mono">Preset Collection</span>
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sans">{tmpl.title}</h3>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">{tmpl.desc}</p>
                </div>
                <button
                  onClick={() => {
                    executeGeneration(tmpl.prompt);
                    triggerNotification("Applying template layout...");
                    setActiveSidebarMenu('dashboards');
                  }}
                  className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-55 hover:bg-indigo-650 text-slate-700 hover:text-white dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-indigo-600 transition-all text-xs font-semibold rounded-xl cursor-pointer shadow-2xs border border-slate-150 dark:border-zinc-800"
                >
                  Load Layout
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    case 'anomaly':
      return (
        <div id="anomaly-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span>AI Anomaly Detection Intelligence</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Mathematical scans scanning standard deviation thresholds</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 font-mono text-xs font-bold rounded-full select-none animate-pulse">
              Outliers Found (2 Flags)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Time Series Outlier Scans</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-indigo-505" /> Median Limits
                  <span className="h-2 w-2 rounded-full bg-rose-550 ml-2" /> Outlier Spike
                </div>
              </div>

              <div className="h-56 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-900 p-4 flex flex-col justify-end relative">
                <div className="absolute top-4 left-4 font-mono text-[9px] text-slate-400">Sensitivity Limit: ±{anomalySensitivity}σ</div>
                
                <div className="flex items-end justify-between h-36 border-b border-l border-slate-200 dark:border-zinc-800 pb-2 pl-2">
                  {[32, 48, 35, 95, 42, 55, 118, 49, 65, 52, 38, 41].map((val, idx) => {
                    const isAbnormal = val > (anomalySensitivity * 30);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer mx-1">
                        <div 
                          style={{ height: `${val}%` }}
                          className={`w-4 sm:w-6 rounded-t transition-all duration-300 ${isAbnormal ? 'bg-gradient-to-t from-rose-500 to-rose-600 animate-pulse' : 'bg-gradient-to-t from-indigo-500 to-indigo-600/70'}`}
                        />
                        <span className="text-[8px] font-mono mt-1 text-slate-400">{idx + 1}h</span>
                        {isAbnormal && (
                          <span className="absolute -top-7 px-1.5 py-0.5 bg-rose-500 text-white font-mono text-[8px] font-bold rounded shadow-sm">!!</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono font-sans">Sensitivity Controls</h3>
              
              <div className="space-y-4 font-sans text-xs">
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="flex justify-between text-[11px] font-mono text-slate-550">
                    <span>Zscore Threshold:</span>
                    <strong>{anomalySensitivity}σ Limits</strong>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="4.0" 
                    step="0.5" 
                    value={anomalySensitivity} 
                    onChange={(e) => setAnomalySensitivity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-indigo-600" 
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <h4 className="text-[10px] font-bold text-rose-500 uppercase font-mono block">Outliers Detected</h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                    <div className="p-2 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-lg text-[9.5px]">
                      <strong className="text-rose-600 font-mono text-[9px] block">FLAG #01 (Acquisition Spike)</strong>
                      <span>Conversion index spiked to 118% of standard deviation limits. Z-Score: +3.65</span>
                    </div>
                    <div className="p-2 bg-yellow-50/40 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-900/40 rounded-lg text-[9.5px]">
                      <strong className="text-yellow-600 font-mono text-[9px] block">FLAG #02 (Sessions Drop)</strong>
                      <span>Referrals collapsed -38% under standard median line. Z-Score: -2.31</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'narrative':
      return (
        <div id="narrative-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-505" />
                <span>AI Smart Narratives Summary</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Automated plain-English explanations compiled directly from active telemetry</p>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 font-sans leading-relaxed">
            <div className="border-l-4 border-indigo-550 pl-4 py-1">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-150">Active Analytics Takeaways & Trends</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Generatively compiled at {new Date().toLocaleDateString()}</p>
            </div>

            <div className="text-xs text-slate-650 dark:text-zinc-300 space-y-3.5 leading-relaxed">
              <p>
                Our AI model has verified active workspace telemetry parameters. <strong>Product Conversion trends</strong> are strongly optimized, indicating structural growth (particularly across Campaign Segment C, leading with a +15.5% expansion rate).
              </p>
              <p>
                <strong>Bounce index fluctuations</strong> represent stable mid-week metrics. Anomaly checks confirm outliers remain well dentro baseline targets (refer to Anomaly controls to alter Sigma thresholds).
              </p>
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl space-y-2 border border-slate-200 dark:border-zinc-900">
                <h4 className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest font-mono">Statistical Highlights:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
                  <li>Conversion Medians: <strong>1,895 registrations / week</strong> (+6% versus forecast)</li>
                  <li>Inbound Channels: <strong>Direct traffic sessions</strong> represent 42.5% of total share</li>
                  <li>Corporate metrics ratio: optimized at <strong>5.5 : 1.0 MRR CAC</strong> (Highly robust)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    case 'reports':
      return (
        <div id="reports-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-indigo-500" />
                <span>Corporate Reports & Exports</span>
              </h1>
              <p className="text-[11px] text-slate-405 font-sans mt-0.5">Generate high-fidelity snapshots, prints, or layout backup files</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-805 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Immediate Exports</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDownloadPDF}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-indigo-500 rounded-xl hover:bg-slate-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/10 cursor-pointer transition-all gap-2 text-center"
                >
                  <Download className="h-6 w-6 text-indigo-500 hover:scale-110 duration-200 transition-all" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">Export High-Res PDF</span>
                  <span className="text-[9.5px] text-slate-400 leading-tight">Interactive multi-page print representation</span>
                </button>

                <button
                  onClick={handleDownloadScreenshot}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-indigo-500 rounded-xl hover:bg-slate-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/10 cursor-pointer transition-all gap-2 text-center"
                >
                  <Camera className="h-6 w-6 text-violet-500 hover:scale-110 duration-200 transition-all" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">Export Raw PNG</span>
                  <span className="text-[9.5px] text-slate-400 leading-tight">High fidelity dashboard screenshot</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-805 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Recurrent Delivery (Scheduler Mock)</h3>
              <div className="space-y-3 text-xs leading-normal font-sans">
                <div className="flex items-center justify-between">
                  <span>Destination:</span>
                  <strong className="font-mono">team@dost-analytics.com</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frequency:</span>
                  <strong className="font-mono">Every Monday (9:00 AM)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active State:</span>
                  <strong className="text-emerald-500 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-[9px] font-mono leading-none">ACTIVE</strong>
                </div>
                <button 
                  onClick={() => triggerNotification("Delivery recurrence schedule updated!")}
                  className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-705 text-white font-mono text-[10px] font-bold text-center mt-3 cursor-pointer"
                >
                  Configure Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    case 'users':
      return (
        <div id="users-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-805 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-505" />
                <span>Team Members & Multi-User Sharing</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Collaborate, view workspace participant roles, and send invite credentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Active Collaborators</h3>
              
              <div className="divide-y divide-slate-100 dark:divide-zinc-800 font-sans">
                {[
                  { name: "Amit Verma", email: "amit.verma@dashboard-dost.in", role: "Owner (Admin)", initials: "AV" },
                  { name: "Priya Patel", email: "priya.patel@dashboard-dost.in", role: "Layout Architect", initials: "PP" },
                  { name: "David Kim", email: "david.kim@dashboard-dost.in", role: "Data Analyst", initials: "DK" },
                ].map((usr, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8.5 w-8.5 rounded-full bg-indigo-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 text-indigo-650 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                        {usr.initials}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-850 dark:text-zinc-150 block truncate leading-tight">{usr.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-550 block font-mono truncate">{usr.email}</span>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-405 font-mono">{usr.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-405 uppercase tracking-wider font-mono">Invite Team Member</h3>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block mb-1">Invite Email</label>
                  <input type="email" placeholder="E.g., analyst@dost.com" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-805 dark:text-zinc-100 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-405 uppercase font-mono block mb-1">Role Type</label>
                  <select className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-805 dark:text-zinc-200 focus:outline-none">
                    <option value="editor">Layout Builder & Admin</option>
                    <option value="viewer">Data Analyst (Q&A Only)</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => triggerNotification("Invitation link dispatched to partner!", "success")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-4 rounded-xl shadow-xs uppercase tracking-wider font-mono cursor-pointer"
              >
                Dispatch Invite Link
              </button>
            </div>
          </div>
        </div>
      );
    case 'settings':
      return (
        <div id="settings-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-505" />
                <span>System Workspace Preferences</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Control generative model targets, interface colors, and client caching sizes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Generative Model Preferences</h3>
              
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-750 dark:text-zinc-250 block">Target Core LLM:</span>
                    <span className="text-[10px] text-slate-400">Layout compiler logic provider</span>
                  </div>
                  <select className="text-xs p-2 rounded-lg border border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-105 font-mono">
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Standard)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (High Quality)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Experimental)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3.5 font-sans">
                  <div>
                    <span className="text-xs font-bold text-slate-750 dark:text-zinc-250 block">Theme Toggler:</span>
                    <span className="text-[10px] text-slate-400">Toggle dark / light ambient panels</span>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-violet-500" />}
                    <span>{theme === 'dark' ? "Solar Light Mode" : "Cosmic Dark Mode"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-405 uppercase tracking-wider font-mono font-sans">Persistence Engine Caching</h3>
              <div className="space-y-3 pt-2 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span>Active Caching:</span>
                  <strong className="font-mono text-indigo-600">IndexedDB Secure-Session</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>caching Buffer size:</span>
                  <strong className="font-mono">1.28 MB / 50.0 MB</strong>
                </div>
                <div className="flex items-center justify-between font-sans">
                  <span>Boards saved spec count:</span>
                  <strong className="font-mono">{savedDashboards.length} Boards</strong>
                </div>
                
                <button 
                  onClick={() => triggerNotification("IndexedDB schema index checked!")}
                  className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-705 text-white font-mono text-[10px] font-bold text-center mt-3 cursor-pointer"
                >
                  Verify database indices
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    case 'audit':
      return (
        <div id="audit-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-550" />
                <span>System Audit Logs Trail</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Chronological log of layout compilations, backup actions & downloads</p>
            </div>
            <span className="text-[10px] font-bold bg-slate-50 dark:bg-zinc-950 px-2 py-0.5 border border-slate-100 rounded font-mono">
              Buffer Limit: 50 Records
            </span>
          </div>

          <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search audit trail by action keyword..." 
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-zinc-900 focus:outline-none"
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {activityLog.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-xs font-sans">No audit actions logged in current container session.</div>
              ) : (
                activityLog
                  .filter(log => log.text.toLowerCase().includes(auditQuery.toLowerCase()))
                  .map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-909 rounded-xl flex items-center justify-between text-[11px] font-mono leading-none">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-slate-705 dark:text-zinc-250 truncate block">{log.text}</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 shrink-0">
                        {log.time ? new Date(log.time).toLocaleTimeString() : new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      );
    case 'help':
      return (
        <div id="help-view" className="space-y-6 max-w-4xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-500" />
                <span>Docs & Help Center Manual</span>
              </h1>
              <p className="text-[11px] text-slate-405 font-sans mt-0.5">Learn hotkey shortcuts, prompt recipes, & canvas configurations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 md:col-span-2">
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-zinc-150">Command Palette Shortcuts</h3>
              
              <div className="space-y-2.5 pt-2">
                {[
                  { keys: ["Ctrl", "K"], action: "Launch workspace Command Palette helper modal" },
                  { keys: ["ESC"], action: "Dismiss active overlay modals and absolute slide drawers" },
                  { keys: ["Ctrl", "Z"], action: "Revert/undo last design change layout specs" },
                  { keys: ["Ctrl", "Y"], action: "Redo previously undone state change layout specs" }
                ].map((hot, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-zinc-800 last:border-none">
                    <span className="text-slate-600 dark:text-zinc-400 font-medium">{hot.action}</span>
                    <div className="flex items-center gap-1">
                      {hot.keys.map((k, i) => (
                        <kbd key={i} className="px-1.5 py-0.5 font-bold text-[9px] font-mono text-slate-700 bg-slate-100 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 rounded shadow-xs">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Prompt Recipes</h3>
              <div className="space-y-3.5 text-[11px] leading-relaxed">
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-lg">
                  <strong className="text-indigo-600 block mb-0.5">Preset #1: Fresh Board</strong>
                  <span className="italic">"Assemble bento CFO summary displaying MRR curves vs operating loss sectors..."</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-lg">
                  <strong className="text-indigo-600 block mb-0.5">Preset #2: Adjust Palette</strong>
                  <span className="italic">"Align KPI cards to grid-cols-4 and switch bar chart theme to violet gradient..."</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'feedback':
      return (
        <div id="feedback-view" className="space-y-6 max-w-2xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-805 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Share2 className="h-5 w-5 text-indigo-505" />
                <span>Provide Product Feedback</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Help us fine tune generative compiler behaviors!</p>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Rate Workspace Quality</span>
              <div className="flex items-center justify-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <button
                    type="button"
                    key={idx}
                    className="p-1 hover:scale-120 transition-transform cursor-pointer"
                    onClick={() => {
                      setStarredRating(idx);
                      triggerNotification(`Rated: ${idx} / 5 Stars`);
                    }}
                  >
                    <Star className={`h-8 w-8 text-amber-500 ${idx <= starredRating ? 'fill-amber-500' : 'opacity-30'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase font-mono block">Review Comments</label>
              <textarea 
                rows={4} 
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your thoughts on compiling dashboards, resizable assistant drawers, or any other layout feature..." 
                className="w-full text-xs p-3 px-3.5 rounded-xl border border-slate-200 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none" 
              />
            </div>

            <button 
              type="button"
              onClick={() => {
                triggerNotification("Thank you for your feedback!", "success");
                setFeedbackComment('');
                setStarredRating(0);
                setActiveSidebarMenu('dashboards');
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-xs rounded-xl shadow-xs uppercase tracking-wider font-mono cursor-pointer"
            >
              Submit Feedback Spec
            </button>
          </div>
        </div>
      );
    case 'trash':
      return (
        <div id="trash-view" className="space-y-6 max-w-2xl mx-auto w-full py-8 text-left select-none animate-in fade-in slide-in-from-bottom-5 duration-300 animate-in">
          <div className="flex items-center justify-between border-b border-slate-205 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-500" />
                <span>Workspace factory reset</span>
              </h1>
              <p className="text-[11px] text-slate-405 font-sans mt-0.5">Wipe cached state keys from localStorage and session structures</p>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-[#0e0e13]/85 rounded-2xl border border-rose-100 dark:border-rose-950/20 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest font-mono">DANGER ZONE</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Executing factory reset immediately flushes all saved client layout configurations, uploaded telemetry data models, undo records, and live parameters:
            </p>
            
            <div className="border border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
              <div>
                <span className="font-extrabold text-rose-600 block">Clear Local Session Cache</span>
                <span className="text-[10px] text-slate-400 font-mono">Wipes Index state keys, layouts histories</span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (confirm("Execute Factory Reset? This action cannot be undone and resets the browser workspace index.")) {
                    localStorage.clear();
                    triggerNotification("Reset complete, reloading...", "success");
                    setTimeout(() => window.location.reload(), 1200);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[10px] font-bold rounded-xl cursor-pointer shadow hover:shadow-lg transition-all uppercase tracking-wider h-10 shrink-0"
              >
                Factory Reset Mode
              </button>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};
