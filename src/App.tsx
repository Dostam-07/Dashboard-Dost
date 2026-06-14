import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useAppStore, loadDashboardFromIDB } from './store';
import { SavedDashboardsManager } from './components/SavedDashboardsManager';
import { RecentActivityWidget } from './components/RecentActivityWidget';
import { chaupalInsightsSeed, recentChaupalSessions } from './utils/seedData';
import { parsePartialPayload } from './utils/jsonRepair';
import { filterComponentData, ActiveFilterState } from './utils/filterEngine';
import { normalizeGeoData } from './utils/dataNormalization';
import { ChartWrapper } from './components/ChartWrapper';
import { FiltersPanel } from './components/FiltersPanel';
import { SuggestionChips } from './components/SuggestionChips';
import { ConversationalPanel } from './components/ConversationalPanel';
import { validateDashboardPayload } from './utils/schemaValidation';
import { EditComponentModal } from './components/EditComponentModal';
import { EditFilterModal } from './components/EditFilterModal';
import { DashboardComponent, DashboardFilter, MasterDashboardPayload, ChatMessage } from './types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;
} catch(e) {}
import * as mammoth from 'mammoth';
import {
  Sparkles,
  Sun,
  Moon,
  Activity,
  Code,
  Share2,
  RefreshCcw,
  BarChart,
  Grid2X2,
  ListRestart,
  Undo,
  Redo,
  Upload,
  Download,
  Plus,
  Compass,
  CheckCircle,
  AlertOctagon,
  X,
  Camera,
  Database,
  GripVertical,
  History,
  MessageSquare,
  Search,
  LayoutTemplate,
  Copy,
  CornerDownLeft,
  Trash2,
  FileJson,
  Check,
  Bot,
  ChevronDown,
  ChevronRight,
  Home,
  SlidersHorizontal,
  Lock,
  Settings,
  Users,
  Bell,
  HelpCircle,
  MoreVertical,
  Star
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { HomeLandingView } from './components/HomeLandingView';

interface SortableDashboardItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableDashboardItem({ id, children }: SortableDashboardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full relative group/draggable">
      <div className="h-full w-full transition-transform duration-200 hover:scale-[1.02]">
        <div 
          {...attributes} 
          {...listeners} 
          data-html2canvas-ignore
          className="absolute top-4 left-4 z-10 opacity-0 group-hover/draggable:opacity-100 transition-all p-1 bg-white/95 hover:bg-slate-50 dark:bg-zinc-900/95 dark:hover:bg-zinc-850 rounded border border-slate-200 dark:border-zinc-800 cursor-grab active:cursor-grabbing text-slate-450 hover:text-indigo-650 shadow-sm"
          title="Drag to reorder component"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
        {children}
      </div>
    </div>
  );
}

interface SortableSectionItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableSectionItem({ id, children }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="col-span-12 relative group/section-draggable">
      <div 
        {...attributes} 
        {...listeners} 
        data-html2canvas-ignore
        className="absolute top-2 left-2 z-10 opacity-0 group-hover/section-draggable:opacity-100 transition-all p-1.5 bg-white/95 hover:bg-slate-50 dark:bg-zinc-900/95 dark:hover:bg-zinc-850 rounded border border-slate-200 dark:border-zinc-800 cursor-grab active:cursor-grabbing text-slate-450 hover:text-indigo-650 shadow-sm"
        title="Drag to reorder section"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      {children}
    </div>
  );
}

interface SortableTabItemProps {
  key: string | number;
  id: string;
  activeTab: string;
  onClick: () => void;
  onDuplicate: (tab: string) => void;
}

function SortableTabItem({ id, activeTab, onClick, onDuplicate }: SortableTabItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : 'auto',
  };

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="relative group/tab flex items-center pr-1 pl-1 min-w-0">
      <button
        {...attributes}
        {...listeners}
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-bold rounded-l-lg transition-all border font-mono select-none flex items-center gap-1.5 cursor-pointer shrink-0 ${
          activeTab === id
            ? 'bg-indigo-50 border-y-indigo-200 border-l-indigo-200 border-r-transparent text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400'
            : 'bg-white border-y-slate-200 border-l-slate-200 border-r-transparent text-slate-500 hover:bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === id ? 'bg-indigo-505 animate-pulse' : 'bg-slate-300 dark:bg-zinc-650'}`}></span>
        {id}
      </button>
      <div 
         className={`relative px-1.5 py-1.5 border-y border-r rounded-r-lg cursor-pointer ${
          activeTab === id
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400'
            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'
        }`}
        onClick={() => setShowMenu(!showMenu)}
        onMouseLeave={() => setShowMenu(false)}
      >
        <GripVertical className="h-3.5 w-3.5 opacity-50" />
        {showMenu && (
          <div className="absolute top-full right-0 mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDuplicate(id);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 min-w-0"
            >
              <Plus className="h-3.5 w-3.5" /> Duplicate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const getColSpanClasses = (sm: number, md: number, lg: number) => {
  const smMap: Record<number, string> = {
    1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
    5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
    9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12'
  };
  const mdMap: Record<number, string> = {
    1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
    5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8',
    9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12'
  };
  const lgMap: Record<number, string> = {
    1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4',
    5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8',
    9: 'lg:col-span-9', 10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12'
  };
  return `${smMap[sm] || 'col-span-12'} ${mdMap[md] || 'md:col-span-12'} ${lgMap[lg] || 'lg:col-span-6'}`;
};

export default function App() {
  const {
    theme,
    setTheme,
    toggleTheme,
    chats,
    addChatMessage,
    setChats,
    clearChats,
    currentPayload,
    logActivity,
    setCurrentPayload,
    isStreaming,
    setIsStreaming,
    setStreamProgressText,
    streamProgressText,
    saveDashboard,
    loadSavedDashboardsList,
    
    // Undo/Redo structure de-structures
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    pushState,
    undo,
    redo
  } = useAppStore();

  const [promptInput, setPromptInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [qaChats, setQaChats] = useState<ChatMessage[]>([]);
  const [qaInput, setQaInput] = useState('');
  const [isQaStreaming, setIsQaStreaming] = useState(false);
  const [rightActiveChatTab, setRightActiveChatTab] = useState<'builder' | 'qa'>('builder');
  const [builderInput, setBuilderInput] = useState('');
  const [builderMode, setBuilderMode] = useState<'edit' | 'new'>('edit');
  const [filterState, setFilterState] = useState<ActiveFilterState>({
    selectedCategories: {}
  });
  
  // UI Layout States
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<string[]>([]);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(() => localStorage.getItem('isLeftSidebarCollapsed') === 'true');
  const [isQAPanelCollapsed, setIsQAPanelCollapsed] = useState(() => localStorage.getItem('isQAPanelCollapsed') === 'true');
  const [isCanvasLoading, setIsCanvasLoading] = useState(false); 

  useEffect(() => {
    localStorage.setItem('isLeftSidebarCollapsed', String(isLeftSidebarCollapsed));
  }, [isLeftSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('isQAPanelCollapsed', String(isQAPanelCollapsed));
  }, [isQAPanelCollapsed]);
  
  const resetWorkspaceLayout = () => {
    setIsLeftSidebarCollapsed(false);
    setIsQAPanelCollapsed(false);
    setCollapsedSectionIds([]);
    setSections([]);
    setActivePresetId(null);
    showNotification("Workspace layout reset to default.", "success");
    logActivity("Workspace layout reset.");
  };
  
  // Custom Dashboard-Dost v2.0 Workspace states
  const [activeSidebarMenu, setActiveSidebarMenu] = useState<'home' | 'dashboards' | 'datasets' | 'explorer' | 'reports' | 'settings'>('home');
  const [isStarred, setIsStarred] = useState(false);
  
  // Dashboard skeleton — grid-aware placeholders matching real chart layout
  const DashboardSkeleton = () => {
    const skeletonCards = [
      { sm: 12, md: 4, h: 'h-32' },
      { sm: 12, md: 4, h: 'h-32' },
      { sm: 12, md: 4, h: 'h-32' },
      { sm: 12, md: 6, h: 'h-64' },
      { sm: 12, md: 6, h: 'h-64' },
      { sm: 12, md: 12, h: 'h-72' },
    ];
    return (
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6 mb-8 min-w-0">
          <div className="space-y-2 min-w-0">
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-40 animate-pulse"></div>
            <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-2 min-w-0">
            {[1,2,3,4,5].map(i => <div key={i} className="h-9 w-9 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch min-w-0">
          {skeletonCards.map((card, i) => (
            <div key={i} className={`col-span-${card.sm} md:col-span-${card.md} min-w-0`}>
              <div className={`${card.h} bg-slate-100 dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-zinc-800/60 animate-pulse relative overflow-hidden min-w-0`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 dark:via-zinc-700/20 to-transparent animate-[shimmer_2s_infinite] translate-x-[-100%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Right Sidebar Accordion Panel Collapsibles
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
  const [isDataExplorerExpanded, setIsDataExplorerExpanded] = useState(false);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false);
  const [isDashboardHistoryExpanded, setIsDashboardHistoryExpanded] = useState(false);

  // Reconciliation Key based on filterState and currentPayload to bypass React reconciliation bottlenecks
  const reconciliationKey = useMemo(() => {
    const filterSummary = JSON.stringify(filterState || {});
    const payloadId = currentPayload?.dashboardId || 'none';
    return `${payloadId}_${filterSummary}`;
  }, [filterState, currentPayload]);

  const lastLoadedDashId = useRef<string | null>(null);

  // Set up automated context Q&A greeting when dashboard changes
  useEffect(() => {
    if (currentPayload) {
      setQaChats([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi there! I am your context-aware **Data Assistant**. I have fully ingested the "**${currentPayload.title}**" dashboard.

Ask me any questions about the metrics, trends, or records displayed above! For example:
- *"Can you summarize the main findings from the charts?"*
- *"Which items are leading or lagging in performance?"*
- *"Are there any notable spikes or anomalies in the dataset?"*`,
          timestamp: new Date().toISOString()
        }
      ]);
      fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: currentPayload })
      }).then(r => r.json()).then(setSuggestions).catch(console.error);
    } else {
      setQaChats([]);
      setSuggestions([]);
    }
  }, [currentPayload?.dashboardId]);

  // Load and save logic for filters
  useEffect(() => {
    if (!currentPayload?.dashboardId) {
      if (Object.keys(filterState.selectedCategories).length > 0 || filterState.dateRange) {
        setFilterState({ selectedCategories: {} });
      }
      return;
    }

    if (lastLoadedDashId.current !== currentPayload.dashboardId) {
      try {
        const stored = localStorage.getItem(`luminate_filters_for_${currentPayload.dashboardId}`);
        if (stored) {
          setFilterState(JSON.parse(stored));
        } else {
          setFilterState({ selectedCategories: {} });
        }
      } catch (e) {
        console.warn("Failed retrieving persisted filters", e);
        setFilterState({ selectedCategories: {} });
      }
      lastLoadedDashId.current = currentPayload.dashboardId;
    } else {
      localStorage.setItem(`luminate_filters_for_${currentPayload.dashboardId}`, JSON.stringify(filterState));
    }
  }, [filterState, currentPayload?.dashboardId]);

  // Slide-in premium inline notification
  const [notify, setNotify] = useState<{ message: string; type: 'success' | 'refuse' } | null>(null);

  // Hidden JSON files collector ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to target the active dashboard canvas for html2canvas screenshot execution
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Modular editing states
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<DashboardComponent | null>(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<DashboardFilter | null>(null);

  // Multipage / Active Tab indexing
  const [activeTab, setActiveTab] = useState<string>('');

  // Full viewport deep analysis state
  const [fullscreenComponentId, setFullscreenComponentId] = useState<string | null>(null);

  // Responsive mobile active section selector ('history' | 'dashboard' | 'chat')
  const [mobileTab, setMobileTab] = useState<'history' | 'dashboard' | 'chat'>('dashboard');

  const [leftSidebarInput, setLeftSidebarInput] = useState('');
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Add-on 1: Global Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const savedDashboards = useAppStore(state => state.savedDashboards);

  const searchResults = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return savedDashboards.filter(dash => 
      (dash.title || '').toLowerCase().includes(term) ||
      (dash.subtitle || '').toLowerCase().includes(term) ||
      (dash.prompt || '').toLowerCase().includes(term)
    );
  }, [searchTerm, savedDashboards]);

  // Add-on 2: Live Mode States
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Add-on 3: AI Insights States
  const [insightsPromptOpen, setInsightsPromptOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsText, setInsightsText] = useState<string | null>(null);

  // Add-on 4: Dashboard Layout Presets
  interface PresetConfig {
    id: string;
    name: string;
    description: string;
  }
  const [layoutPresets] = useState<PresetConfig[]>([
    {
      id: 'preset_bento',
      name: 'Bento Grid',
      description: 'Balanced arrangement with KPIs at top and side-by-side charts'
    },
    {
      id: 'preset_kpi',
      name: 'KPI Focus',
      description: 'Prioritizes KPIs as wider cards and compacts secondary charts'
    },
    {
      id: 'preset_analytic',
      name: 'Analytical Exp',
      description: 'Stretches all components to 12-column full widths for deep details'
    }
  ]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Add-on 5: Visual Section Groupings
  interface VisualSection {
    id: string;
    title: string;
    description?: string;
    componentIds: string[];
  }
  const [sections, setSections] = useState<VisualSection[]>([]);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [selectedSectionComponentIds, setSelectedSectionComponentIds] = useState<string[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Template Gallery
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const dashboardTemplates = [
    {
      id: 'template_sales',
      title: 'Sales & Revenue Overview',
      subtitle: 'Track essential business sales, ARR, and recurring revenue',
      icon: <BarChart className="h-4 w-4 text-emerald-500" />
    },
    {
      id: 'template_marketing',
      title: 'Marketing Campaign Tracking',
      subtitle: 'Web traffic, conversions, and ad performance overview',
      icon: <Activity className="h-4 w-4 text-blue-500" />
    },
    {
      id: 'template_server',
      title: 'Infrastructure & DevOps',
      subtitle: 'System load, uptime, networking and server resource telemetry',
      icon: <Database className="h-4 w-4 text-indigo-500" />
    }
  ];

  const applyTemplate = async (templateId: string) => {
    let payloadStr = "";
    
    if (templateId === "template_sales") {
      payloadStr = JSON.stringify({
        title: "Sales & Revenue Overview",
        subtitle: "Track essential business sales metrics, MRR, and returning users",
        tabOrder: ["Overview"],
        filters: [
          { id: "date_1", type: "date_range", label: "Date Range", targetKeys: ["date"] }
        ],
        components: [
          {
            id: "sales_kpi_1",
            title: "Total Revenue",
            type: "kpi_card",
            colSpan: { sm: 12, md: 4 },
            tab: "Overview",
            seriesData: [],
            kpiValue: "$145,200",
            kpiTrend: { direction: "up", label: "+12.5% MoM" }
          },
          {
            id: "sales_kpi_2",
            title: "Average Deal Size",
            type: "kpi_card",
            colSpan: { sm: 12, md: 4 },
            tab: "Overview",
            seriesData: [],
            kpiValue: "$4,250",
            kpiTrend: { direction: "up", label: "+2.1% MoM" }
          },
          {
            id: "sales_kpi_3",
            title: "New Customers",
            type: "kpi_card",
            colSpan: { sm: 12, md: 4 },
            tab: "Overview",
            seriesData: [],
            kpiValue: "842",
            kpiTrend: { direction: "down", label: "-4.2% MoM" }
          },
          {
            id: "sales_chart_1",
            title: "Revenue by Region",
            type: "bar_chart",
            colSpan: { sm: 12, md: 12 },
            tab: "Overview",
            seriesData: [
              { region: "North America", revenue: 65000, target: 60000 },
              { region: "Europe", revenue: 45000, target: 50000 },
              { region: "Asia Pacific", revenue: 25000, target: 20000 },
              { region: "Latin America", revenue: 10200, target: 15000 }
            ],
            xAxisKey: "region",
            yAxisKeys: ["revenue", "target"]
          }
        ]
      });
    }

    if (templateId === "template_marketing") {
      payloadStr = JSON.stringify({
        title: "Marketing Campaign Tracking",
        subtitle: "Web traffic, conversions, and ad performance overview",
        tabOrder: ["Traffic", "Social"],
        filters: [],
        components: [
          {
            id: "mkt_kpi_1",
            title: "Total Visitors",
            type: "kpi_card",
            colSpan: { sm: 12, md: 6 },
            tab: "Traffic",
            seriesData: [],
            kpiValue: "1.2M",
            kpiTrend: { direction: "up", label: "+18% vs Last Month" }
          },
          {
            id: "mkt_chart_1",
            title: "Visitor Traffic Sources",
            type: "pie_chart",
            colSpan: { sm: 12, md: 6 },
            tab: "Traffic",
            seriesData: [
              { source: "Direct", visitors: 400000 },
              { source: "Organic Search", visitors: 500000 },
              { source: "Social", visitors: 200000 },
              { source: "Referral", visitors: 100000 }
            ],
            xAxisKey: "source",
            yAxisKeys: ["visitors"]
          }
        ]
      });
    }

    if (templateId === "template_server") {
      payloadStr = JSON.stringify({
        title: "Infrastructure & DevOps",
        subtitle: "System load, uptime, networking and server resource telemetry",
        tabOrder: ["System Resources"],
        filters: [],
        components: [
          {
            id: "devops_chart_1",
            title: "CPU & Memory Load",
            type: "line_chart",
            colSpan: { sm: 12, md: 12 },
            tab: "System Resources",
            seriesData: Array.from({length: 24}).map((_, i) => ({
              time: `${String(i).padStart(2, '0')}:00`,
              cpu: 40 + Math.random() * 40,
              memory: 60 + Math.random() * 20
            })),
            xAxisKey: "time",
            yAxisKeys: ["cpu", "memory"]
          }
        ]
      });
    }

    if (payloadStr) {
      try {
        const payloadObj = JSON.parse(payloadStr) as MasterDashboardPayload;
        validateDashboardPayload(payloadObj);
        
        // Setup new session ID and overwrite
        const newDId = crypto.randomUUID();
        const updatedPayload = { ...payloadObj, dashboardId: newDId };
        
        // Reset state
        setCurrentPayload(updatedPayload);
        useAppStore.getState().undoStack.length = 0;
        useAppStore.getState().redoStack.length = 0;
        setChats([]);
        setPromptInput('');
        
        // Push initial state
        await pushState(updatedPayload);
        showNotification("Template applied successfully as a new layout configuration.", "success");
    logActivity(String("Template applied successfully as a new layout configuration."));
        setIsTemplateGalleryOpen(false);
      } catch (err: any) {
        showNotification(`Failed to load template payload: ${err.message}`, "refuse");
    logActivity(String(`Failed to load template payload: ${err.message}`));
      }
    }
  };

  // Sync / Cache Add-ons for the active Dashboard ID
  useEffect(() => {
    if (!currentPayload?.dashboardId) {
      setSections([]);
      setActivePresetId(null);
      return;
    }
    try {
      const stored = localStorage.getItem(`dost_addons_${currentPayload.dashboardId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sections) setSections(parsed.sections);
        if (parsed.activePresetId) setActivePresetId(parsed.activePresetId);
      } else {
        setSections([]);
        setActivePresetId(null);
      }
    } catch (_) {
      setSections([]);
      setActivePresetId(null);
    }
  }, [currentPayload?.dashboardId]);

  const saveAddons = (newSections: VisualSection[], presetId: string | null = activePresetId) => {
    if (!currentPayload?.dashboardId) return;
    try {
      localStorage.setItem(`dost_addons_${currentPayload.dashboardId}`, JSON.stringify({
        sections: newSections,
        activePresetId: presetId
      }));
    } catch (e) {
      console.warn("Failed caching addons", e);
    }
  };

  // Live Mode Tick Interval Runner
  useEffect(() => {
    if (!refreshInterval || !currentPayload) return;
    const intervalId = setInterval(() => {
      handleRefreshData();
    }, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [refreshInterval, currentPayload]);

  // Live Refresh Mutator
  const handleRefreshData = () => {
    if (!currentPayload) return;
    setLastRefreshTime(new Date());
    
    const nextComponents = (currentPayload.components || []).map(comp => {
      // 1. Mutate KPI Values slightly
      let nextConfig = { ...comp.config };
      if (comp.type === 'kpi_card' && comp.config?.kpiValue) {
        const rawNum = parseFloat(comp.config.kpiValue.replace(/[^0-9.-]/g, ''));
        if (!isNaN(rawNum)) {
          const delta = (Math.random() - 0.5) * 0.08; // +/- 4% fluctuation
          const nextVal = Math.max(0, rawNum * (1 + delta));
          if (comp.config.kpiValue.includes('$')) {
            nextConfig.kpiValue = `$${nextVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
          } else if (comp.config.kpiValue.includes('%')) {
            nextConfig.kpiValue = `${nextVal.toFixed(1)}%`;
          } else {
            nextConfig.kpiValue = nextVal.toLocaleString(undefined, { maximumFractionDigits: 0 });
          }
        }
      }
      
      // 2. Mutate chart series points
      const nextSeries = (comp.seriesData || []).map(row => {
        const updatedRow = { ...row };
        Object.keys(updatedRow).forEach(k => {
          if (k !== comp.config?.xAxisKey && typeof updatedRow[k] === 'number') {
            const deltaPercent = (Math.random() - 0.5) * 0.12; // +/- 6% change
            const fluctuated = Math.max(0, updatedRow[k] * (1 + deltaPercent));
            updatedRow[k] = Number(Number(fluctuated).toFixed(0));
          }
        });
        return updatedRow;
      });

      return {
        ...comp,
        config: nextConfig,
        seriesData: nextSeries
      };
    });
    
    const nextPayload = {
      ...currentPayload,
    logActivity,
      components: nextComponents
    };
    setCurrentPayload(nextPayload);
    showNotification("Refreshed components data with latest stream metrics!", "success");
    logActivity(String("Refreshed components data with latest stream metrics!"));
  };

  // AI Insights Client Fetcher
  const fetchAIInsights = async () => {
    if (!currentPayload) return;
    setInsightsLoading(true);
    setInsightsText(null);
    setInsightsPromptOpen(true);
    
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: currentPayload })
      });
      if (response.ok) {
        const data = await response.json();
        setInsightsText(data.insights);
      } else {
        const errData = await response.json();
        setInsightsText(`### Analysis Failed\n\nFailed to compile metrics. Details: ${errData.error || response.statusText}`);
      }
    } catch (e: any) {
      setInsightsText(`### Network Timeout\n\nConnection timed out generating AI summary. Please check your connectivity.`);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Apply layout presets modifying components structure
  const applyPresetLayout = (presetId: string) => {
    if (!currentPayload) return;
    setActivePresetId(presetId);
    
    const updatedComponents = currentPayload.components.map((comp) => {
      let nextLayout = { ...comp.layout };
      if (presetId === 'preset_bento') {
        nextLayout = {
          sm: 12,
          md: comp.type === 'kpi_card' ? 6 : 12,
          lg: comp.type === 'kpi_card' ? 3 : 6
        };
      } else if (presetId === 'preset_kpi') {
        nextLayout = {
          sm: 12,
          md: comp.type === 'kpi_card' ? 12 : 6,
          lg: comp.type === 'kpi_card' ? 4 : 4
        };
      } else if (presetId === 'preset_analytic') {
        nextLayout = {
          sm: 12,
          md: 12,
          lg: 12
        };
      }
      return { ...comp, layout: nextLayout };
    });
    
    const nextPayload = { ...currentPayload,
    logActivity, components: updatedComponents };
    setCurrentPayload(nextPayload);
    pushState(nextPayload);
    saveAddons(sections, presetId);
    showNotification(`Applied preset layout: ${presetId === 'preset_bento' ? 'Bento Grid' : presetId === 'preset_kpi' ? 'KPI Focus' : 'Analytical Expanded'}!`, "success");
    logActivity(String(`Applied preset layout: ${presetId === 'preset_bento' ? 'Bento Grid' : presetId === 'preset_kpi' ? 'KPI Focus' : 'Analytical Expanded'}!`));
  };

  // Section managers
  const handleCreateSection = () => {
    if (!newSectionTitle.trim()) return;
    
    const newSec: VisualSection = {
      id: editingSectionId || `section_${Date.now()}`,
      title: newSectionTitle,
      description: newSectionDesc,
      componentIds: selectedSectionComponentIds
    };
    
    let nextSections = [...sections];
    if (editingSectionId) {
      nextSections = nextSections.map(s => s.id === editingSectionId ? newSec : s);
    } else {
      nextSections.push(newSec);
    }
    
    setSections(nextSections);
    saveAddons(nextSections);
    
    setNewSectionTitle('');
    setNewSectionDesc('');
    setSelectedSectionComponentIds([]);
    setEditingSectionId(null);
    setIsSectionModalOpen(false);
    showNotification(editingSectionId ? "Visual section updated!" : "New grouping container section created!", "success");
  };

  const handleDeleteSection = (secId: string) => {
    const nextSections = sections.filter(s => s.id !== secId);
    setSections(nextSections);
    saveAddons(nextSections);
    showNotification("Visual container section disbanded.", "success");
    logActivity(String("Visual container section disbanded."));
  };

  // DND Sensors definition
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTabDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentPayload) return;

    const oldIndex = orderedTabs.indexOf(active.id.toString());
    const newIndex = orderedTabs.indexOf(over.id.toString());

    if (oldIndex === -1 || newIndex === -1) return;

    const newTabOrder = arrayMove(orderedTabs, oldIndex, newIndex);
    const nextPayload = {
      ...currentPayload,
    logActivity,
      tabOrder: newTabOrder
    };

    await pushState(nextPayload);
    showNotification("Tab reordered", "success");
    logActivity(String("Tab reordered"));
  };

  const handleDuplicateTab = async (tabName: string) => {
    if (!currentPayload) return;
    
    // Find all components in this tab
    const tabComponents = currentPayload.components.filter(c => c.tab === tabName);
    const newTabName = `${tabName} (Copy)`;
    
    // Create duplicated components with new IDs and new tabname
    const duplicatedComponents = tabComponents.map(c => ({
      ...c,
      id: `${c.id}_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${c.title} (Copy)`,
      tab: newTabName
    }));
    
    const newComponents = [...currentPayload.components, ...duplicatedComponents];
    
    const newTabOrder = [...orderedTabs];
    const insertIndex = newTabOrder.indexOf(tabName);
    if (insertIndex !== -1) {
      newTabOrder.splice(insertIndex + 1, 0, newTabName);
    } else {
      newTabOrder.push(newTabName);
    }
    
    const nextPayload = {
      ...currentPayload,
    logActivity,
      components: newComponents,
      tabOrder: newTabOrder
    };
    
    await pushState(nextPayload);
    setActiveTab(newTabName);
    showNotification(`Duplicated tab '${tabName}' to '${newTabName}'`);
    logActivity(String(`Duplicated tab '${tabName}' to '${newTabName}'`));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Handle section reordering
    if (String(active.id).startsWith('section-') && String(over.id).startsWith('section-')) {
      const activeSecId = String(active.id).replace('section-', '');
      const overSecId = String(over.id).replace('section-', '');
      
      const oldIndex = sections.findIndex(s => s.id === activeSecId);
      const newIndex = sections.findIndex(s => s.id === overSecId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const nextSections = arrayMove(sections, oldIndex, newIndex);
        setSections(nextSections);
        showNotification("Visual Section reordered!", "success");
    logActivity(String("Visual Section reordered!"));
      }
      return;
    }

    // Handle component reordering
    const oldIndex = componentsToRender.findIndex((c) => c.id === active.id);
    const newIndex = componentsToRender.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTabComponents = arrayMove(componentsToRender, oldIndex, newIndex);

    if (!currentPayload) return;

    const resultComponents: DashboardComponent[] = [];
    let tabCompIndex = 0;
    
    currentPayload.components.forEach((originalComp) => {
      const isFromActiveTab = componentsToRender.some((tr) => tr.id === originalComp.id);
      if (isFromActiveTab) {
        resultComponents.push(reorderedTabComponents[tabCompIndex++]);
      } else {
        resultComponents.push(originalComp);
      }
    });

    const nextPayload = {
      ...currentPayload,
    logActivity,
      components: resultComponents,
    };

    await pushState(nextPayload);
    showNotification("Dashboard layout updated!", 'success');
  };

  // Extract unique custom pagination pages/tabs
  const uniqueTabs = Array.from(new Set(
    currentPayload?.components
      ?.map(c => c.tab)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0) || []
  ));

  const orderedTabs = currentPayload?.tabOrder
    ? [...uniqueTabs].sort((a, b) => {
        const idxA = currentPayload.tabOrder!.indexOf(a);
        const idxB = currentPayload.tabOrder!.indexOf(b);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      })
    : uniqueTabs;

  // Initialize active tab slice default
  useEffect(() => {
    if (orderedTabs.length > 0) {
      if (!activeTab || !orderedTabs.includes(activeTab)) {
        setActiveTab(orderedTabs[0]);
      }
    } else {
      setActiveTab('');
    }
  }, [currentPayload?.components, activeTab, orderedTabs]);

  // Synchronize theme on load
  useEffect(() => {
    const storedTheme = localStorage.getItem('luminate_theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme('dark');
    }

    // Load saved list
    loadSavedDashboardsList();

    const onAutosave = () => showNotification("Workspace auto-saved locally.", "success");
    window.addEventListener('dashboard-autosaved', onAutosave);

    // Check for deep links in search parameters
    const params = new URLSearchParams(window.location.search);
    const sharedPayloadBase64 = params.get('payload');
    const sharedFiltersBase64 = params.get('filters');
    const sharedDashId = params.get('dashId');

    let processedDeepLink = false;

    if (sharedPayloadBase64) {
      try {
        const jsonStr = decodeURIComponent(escape(atob(sharedPayloadBase64)));
        const parsedPayload = JSON.parse(jsonStr);
        if (parsedPayload && parsedPayload.dashboardId) {
          setCurrentPayload(parsedPayload);
          pushState(parsedPayload);
          
          if (sharedFiltersBase64) {
            try {
              const filtersJson = decodeURIComponent(escape(atob(sharedFiltersBase64)));
              const parsedFilters = JSON.parse(filtersJson);
              setFilterState(parsedFilters);
              localStorage.setItem(`luminate_filters_for_${parsedPayload.dashboardId}`, filtersJson);
            } catch (fe) {
              console.error("Failed parsing deep-linked filters", fe);
            }
          }
          
          processedDeepLink = true;
          showNotification(`Imported shared workspace: "${parsedPayload.title}"`, "success");
    logActivity(String(`Imported shared workspace: "${parsedPayload.title}"`));
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error("Failed to parse shared payload from deep-link", err);
      }
    } else if (sharedDashId) {
      loadDashboardFromIDB(sharedDashId).then((payload) => {
        if (payload) {
          setCurrentPayload(payload);
          if (sharedFiltersBase64) {
            try {
              const filtersJson = decodeURIComponent(escape(atob(sharedFiltersBase64)));
              const parsedFilters = JSON.parse(filtersJson);
              setFilterState(parsedFilters);
              localStorage.setItem(`luminate_filters_for_${sharedDashId}`, filtersJson);
            } catch (fe) {}
          }
          showNotification(`Loaded shared workspace: "${payload.title}"`, "success");
    logActivity(String(`Loaded shared workspace: "${payload.title}"`));
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }).catch((err) => {
        console.warn(err);
      });
      processedDeepLink = true;
    }

    if (!processedDeepLink) {
      // Auto-save: Reload last active session dashboard state from IndexedDB
      const activeId = localStorage.getItem('luminate_active_dashboard_id');
      if (activeId) {
        loadDashboardFromIDB(activeId).then((payload) => {
          if (payload) {
            setCurrentPayload(payload);
            showNotification(`Restored active session: "${payload.title}"`);
    logActivity(String(`Restored active session: "${payload.title}"`));
          } else {
            setCurrentPayload(chaupalInsightsSeed);
          }
        }).catch((err) => {
          console.warn("Could not restore active dashboard session from IndexedDB", err);
          setCurrentPayload(chaupalInsightsSeed);
        });
      } else {
        setCurrentPayload(chaupalInsightsSeed);
      }
    }

    return () => window.removeEventListener('dashboard-autosaved', onAutosave);
  }, [setTheme, setChats, loadSavedDashboardsList, setCurrentPayload]);

  // Attach keyboard shortcuts for Z & Y history manipulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut inputs inside input tags
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) {
          undo();
          showNotification("Undid layout change.");
    logActivity(String("Undid layout change."));
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) {
          redo();
          showNotification("Redid layout change.");
    logActivity(String("Redid layout change."));
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canRedo) {
          redo();
          showNotification("Redid layout change.");
    logActivity(String("Redid layout change."));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const showNotification = (message: string, type: 'success' | 'refuse' = 'success') => {
    setNotify({ message, type });
    setTimeout(() => {
      setNotify((current) => current?.message === message ? null : current);
    }, 4500);
  };

  const handleLeftSidebarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = leftSidebarInput.trim();
    if (!val || isStreaming) return;

    try {
      const parsedUrl = new URL(val);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        // Handle as external URL dashboard
        const newPayload: MasterDashboardPayload = {
          dashboardId: `dash_${Date.now()}`,
          title: "Ingested Dashboard",
          subtitle: `Source: ${parsedUrl.hostname}`,
          ingestedUrl: val,
          filters: [],
          components: []
        };
        setCurrentPayload(newPayload);
        pushState(newPayload);
        showNotification(`Ingested dashboard from ${parsedUrl.hostname}`, "success");
    logActivity(String(`Ingested dashboard from ${parsedUrl.hostname}`));
        setMobileTab('dashboard');
        
        // Add greeting chat
        addChatMessage({
          id: Math.random().toString(),
          role: 'assistant',
          content: `I've successfully mapped the dashboard from **${parsedUrl.hostname}** via Left Sidebar. You can now ask conversational queries about this data!`,
          timestamp: new Date().toISOString()
        });
        
        setLeftSidebarInput('');
        return;
      }
    } catch (_) {
      // not a url, fallthrough as prompt input
    }

    executeGeneration(val, false);
    setLeftSidebarInput('');
    setMobileTab('dashboard');
  };

  const handleShareWorkspace = () => {
    if (!currentPayload) {
      showNotification("No active workspace to share.", "refuse");
    logActivity(String("No active workspace to share."));
      return;
    }

    try {
      const baseUrl = window.location.origin + window.location.pathname;
      const urlParams = new URLSearchParams();
      
      urlParams.set('dashId', currentPayload.dashboardId);
      
      // Base64 encoding compatible with international UTF8 sets
      const payloadBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentPayload))));
      urlParams.set('payload', payloadBase64);
      
      const filtersBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(filterState))));
      urlParams.set('filters', filtersBase64);
      
      const shareUrl = `${baseUrl}?${urlParams.toString()}`;
      setShareLink(shareUrl);
      
      // Attempt automated clipboard save
      navigator.clipboard.writeText(shareUrl).then(() => {
        showNotification("Shareable deep-link copied to clipboard!", "success");
    logActivity(String("Shareable deep-link copied to clipboard!"));
      }).catch((err) => {
        console.warn("Secure Clipboard writing blocked:", err);
        showNotification("Generated share URL successfully!");
    logActivity(String("Generated share URL successfully!"));
      });
    } catch (e: any) {
      console.error(e);
      showNotification("Could not compile share specifications.", "refuse");
    logActivity(String("Could not compile share specifications."));
    }
  };

  const handleResetFilters = () => {
    setFilterState({
      selectedCategories: {}
    });
  };

  const handleNewDashboard = async () => {
    const rawId = `dash_${Date.now()}`;
    const newPayload: MasterDashboardPayload = {
      dashboardId: rawId,
      title: "New Custom Dashboard",
      subtitle: "Dynamic workspace configured in real-time. Start by typing prompts in the chatbot on the right!",
      filters: [],
      components: []
    };
    setCurrentPayload(newPayload);
    await pushState(newPayload);
    showNotification("Start building! Tell the SaaS chatbot on the right what you want to add.");
    logActivity(String("Start building! Tell the SaaS chatbot on the right what you want to add."));
    setMobileTab('dashboard');
  };

  const handleLoadDashboardMeta = async (meta: any) => {
    const payload = await loadDashboardFromIDB(meta.dashboardId);
    if (payload) {
      setCurrentPayload(payload);
      showNotification(`Restored workspace "${payload.title}"!`);
    logActivity(String(`Restored workspace "${payload.title}"!`));
      setMobileTab('dashboard');
    } else {
      showNotification("Failed to restore dashboard session", "refuse");
    logActivity(String("Failed to restore dashboard session"));
    }
  };

  const handleClearWorkspace = () => {
    setCurrentPayload(null);
    clearChats();
    handleResetFilters();
    setActiveTab('');
  };

  // component editing actions
  const handleSaveComponent = async (component: DashboardComponent) => {
    if (!currentPayload) return;

    let updatedComponents = [...(currentPayload.components || [])];
    if (editingComponent) {
      updatedComponents = updatedComponents.map(c => c.id === component.id ? component : c);
    } else {
      updatedComponents.push(component);
    }

    const nextPayload = {
      ...currentPayload,
    logActivity,
      components: updatedComponents
    };

    await pushState(nextPayload);
    setIsComponentModalOpen(false);
    setEditingComponent(null);
    showNotification(`Component "${component.title}" saved successfully!`);
    logActivity(String(`Component "${component.title}" saved successfully!`));
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!currentPayload) return;

    const targetComp = currentPayload.components?.find(c => c.id === componentId);
    const updatedComponents = (currentPayload.components || []).filter(c => c.id !== componentId);

    const nextPayload = {
      ...currentPayload,
    logActivity,
      components: updatedComponents
    };

    await pushState(nextPayload);
    showNotification(`Removed component "${targetComp?.title || 'Chart'}".`);
    logActivity(String(`Removed component "${targetComp?.title || 'Chart'}".`));
  };

  // filter editing actions
  const handleSaveFilter = async (filter: DashboardFilter) => {
    if (!currentPayload) return;

    let updatedFilters = [...(currentPayload.filters || [])];
    if (editingFilter) {
      updatedFilters = updatedFilters.map(f => f.id === filter.id ? filter : f);
    } else {
      updatedFilters.push(filter);
    }

    const nextPayload = {
      ...currentPayload,
    logActivity,
      filters: updatedFilters
    };

    await pushState(nextPayload);
    setIsFilterModalOpen(false);
    setEditingFilter(null);
    showNotification(`Filter "${filter.label}" created successfully.`);
    logActivity(String(`Filter "${filter.label}" created successfully.`));
  };

  const handleDeleteFilter = async (filterId: string) => {
    if (!currentPayload) return;

    const targetFilter = currentPayload.filters?.find(f => f.id === filterId);
    const updatedFilters = (currentPayload.filters || []).filter(f => f.id !== filterId);

    const nextPayload = {
      ...currentPayload,
    logActivity,
      filters: updatedFilters
    };

    await pushState(nextPayload);
    showNotification(`Removed filter logic "${targetFilter?.label || 'Condition'}".`);
    logActivity(String(`Removed filter logic "${targetFilter?.label || 'Condition'}".`));
  };

  // Export current configuration config to JSON file
  const handleExportDashboard = () => {
    if (!currentPayload) return;
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const safeTitle = currentPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadAnchor.setAttribute("download", `luminate_dashboard_${safeTitle}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification("JSON Schema configuration exported.");
    logActivity(String("JSON Schema configuration exported."));
    } catch (e: any) {
      showNotification("Failed to export JSON.", "refuse");
    logActivity(String("Failed to export JSON."));
    }
  };

  // Import configuration or data files
  const handleImportDashboard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isJSON = fileName.endsWith('.json');
    const isCSV = fileName.endsWith('.csv');
    const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isDOCX = fileName.endsWith('.docx');
    const isPDF = fileName.endsWith('.pdf');

    if (isJSON) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = JSON.parse(text);
          const validated = validateDashboardPayload(parsed);
          await pushState(validated);
          handleResetFilters();
          showNotification(`Success: Recreated board "${validated.title}"!`);
    logActivity(String(`Success: Recreated board "${validated.title}"!`));
        } catch (err: any) {
          showNotification(`Restore failed: ${err.message || "Invalid payload"}`, "refuse");
    logActivity(String(`Restore failed: ${err.message || "Invalid payload"}`));
        }
      };
      reader.readAsText(file);
      return;
    }

    try {
      showNotification(`Processing attached data: ${file.name}...`);
    logActivity(String(`Processing attached data: ${file.name}...`));
      let extractedContent = "";

      if (isCSV) {
        extractedContent = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            complete: (results) => resolve(JSON.stringify(normalizeGeoData(results.data, 'country').slice(0, 500))),
            error: (err) => reject(err),
          });
        });
      } else if (isXLSX) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        extractedContent = JSON.stringify(normalizeGeoData(rows, 'country').slice(0, 500));
      } else if (isDOCX) {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        extractedContent = result.value.slice(0, 50000); // limit to 50k chars
      } else if (isPDF) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((s: any) => s.str).join(' ') + '\n';
        }
        extractedContent = fullText.slice(0, 50000);
      } else {
        extractedContent = await file.text();
      }

      useAppStore.getState().setAttachedData({
        fileName: file.name,
        content: extractedContent
      });
      showNotification(`File attached successfully. Ask a question or generate a dashboard to use it.`);
    logActivity(String(`File attached successfully. Ask a question or generate a dashboard to use it.`));
      if (promptInput === '') {
        setPromptInput(`Generate a dashboard analyzing ${file.name}`);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to load data: ${err.message}`, "refuse");
    logActivity(String(`Failed to load data: ${err.message}`));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (e.target) e.target.value = '';
    }
  };

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) {
      showNotification("No workspace active to export to PDF.", "refuse");
    logActivity(String("No workspace active to export to PDF."));
      return;
    }

    try {
      showNotification("Generating PDF report...");
    logActivity(String("Generating PDF report..."));
      
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'dark' ? '#09090b' : '#FAFAFA',
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions (A4 portrait)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Handle multi-page
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Dost_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification("PDF report downloaded successfully!", "success");
    logActivity(String("PDF report downloaded successfully!"));
    } catch (err) {
      console.error(err);
      showNotification("Failed to generate PDF.", "refuse");
    logActivity(String("Failed to generate PDF."));
    }
  };

  // Capture active dashboard canvas and download as high-fidelity PNG screenshot
  const handleDownloadScreenshot = async () => {
    if (!dashboardRef.current) {
      showNotification("No workspace active to screenshot.", "refuse");
    logActivity(String("No workspace active to screenshot."));
      return;
    }

    try {
      showNotification("Capturing high-fidelity dashboard png...");
    logActivity(String("Capturing high-fidelity dashboard png..."));
      
      const element = dashboardRef.current;
      
      // Execute camera rendering
      const canvas = await html2canvas(element, {
        scale: 2, // retina 2x density
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'dark' ? '#09090b' : '#FAFAFA', // background color matching zinc-950/slate-50
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      const safeTitle = currentPayload?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'dashboard';
      link.download = `luminate_${safeTitle}_screenshot.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification("Dashboard screenshot downloaded successfully!");
    logActivity(String("Dashboard screenshot downloaded successfully!"));
    } catch (err: any) {
      console.error("Screenshot rendering failed:", err);
      showNotification(`Capture failed: ${err.message || "Canvas error"}`, "refuse");
    logActivity(String(`Capture failed: ${err.message || "Canvas error"}`));
    }
  };

  const executeGeneration = async (promptText: string, isIterative = false, editMode = false) => {
    if (isStreaming) return;

    setIsStreaming(true);
    setStreamProgressText("Connecting to Dash-Dost engine...");
    
    const userMsgId = Math.random().toString();
    const assistantMsgId = Math.random().toString();
    
    const attachedData = useAppStore.getState().attachedData;
    const currentPayload = useAppStore.getState().currentPayload;

    let finalPrompt = promptText;
    if (attachedData) {
      finalPrompt = `${promptText}\n\n[SYSTEM INSTRUCTION: The user has attached a new dataset. Try to update existing charts/components if they share the same data structure/columns, or create new ones if necessary. Map to existing dashboard structure if possible instead of completely replacing it, unless explicitly asked to rebuild.]\n\n[ATTACHED DATA - File: ${attachedData.fileName}]:\n${attachedData.content}`;
    } else if (editMode && currentPayload) {
      finalPrompt = `${promptText}\n\n[SYSTEM INSTRUCTION: The user wants to EDIT the existing dashboard. Use the following current dashboard state as the context/basis for your modifications. Update only the necessary components and maintain the existing structure if not requested otherwise. Here is the current dashboard:\n${JSON.stringify(currentPayload)}]`;
    }

    const userMsg = {
      id: userMsgId,
      role: 'user' as const,
      content: promptText + (attachedData ? ` (Attached: ${attachedData.fileName})` : ''),
      timestamp: new Date().toISOString()
    };
    
    // Clear the attached data after first use? We might want to keep it or let user clear it?
    // User usually expects it to apply only once unless they re-upload, or keep it stateful.
    // We'll clear it after use.
    useAppStore.getState().setAttachedData(null);
    
    addChatMessage(userMsg);

    const historyPayload = isIterative 
      ? chats.map(c => ({ role: c.role, content: c.content })) 
      : [];

    try {
      if (currentPayload?.ingestedUrl) {
        setStreamProgressText("Analyzing cross-referenced data...");
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             prompt: promptText,
             history: historyPayload,
             url: currentPayload.ingestedUrl
          })
        });

        if (!res.ok) throw new Error("Failed connecting to AI Chat");
        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let textBuffer = "";

        // Add placeholder message for streaming
        addChatMessage({
          id: assistantMsgId,
          role: 'assistant',
          content: "",
          timestamp: new Date().toISOString()
        });

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            textBuffer += chunk;
            
            // Update chat message live
            useAppStore.getState().setChats(
              useAppStore.getState().chats.map(msg => 
                msg.id === assistantMsgId ? { ...msg, content: textBuffer } : msg
              )
            );
          }
        }
        
        if (textBuffer.includes('[ERROR:')) {
           const match = textBuffer.match(/\[ERROR:\s*(.*?)\]/);
           if (match && match[1]) throw new Error(match[1]);
        }
      } else {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            history: historyPayload
          })
        });

        if (!res.ok) {
          let errorMsg = "Failed connection to Gemini server";
          try {
            const errObj = await res.json();
            errorMsg = errObj.error || errorMsg;
          } catch(e) {}
          throw new Error(errorMsg);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let streamedBuffer = "";

        if (reader) {
          setStreamProgressText("Compiling structural schema...");
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            streamedBuffer += chunk;

            const parsed = parsePartialPayload(streamedBuffer);
            if (parsed) {
              setCurrentPayload(parsed);
              const count = parsed.components?.length || 0;
              if (count > 0) {
                setStreamProgressText(`Assembled ${count} dynamic KPI & analytic containers...`);
              }
            }
          }

          const finalPayload = parsePartialPayload(streamedBuffer);
          if (streamedBuffer.includes('[ERROR:')) {
            const match = streamedBuffer.match(/\[ERROR:\s*(.*?)\]/);
            if (match && match[1]) {
              throw new Error(match[1]);
            }
          }
          
          if (finalPayload) {
            await pushState(finalPayload);
            setStreamProgressText("");
            addChatMessage({
              id: assistantMsgId,
              role: 'assistant',
              content: `Interactive dashboard **${finalPayload.title}** generated successfully! Try toggle standard or category dropdown filters inside the toolbox below.`,
              timestamp: new Date().toISOString(),
              associatedPayload: finalPayload
            });
          } else {
            throw new Error("Unable to construct valid dashboard structure. Please try again with different keywords!");
          }
        }
      }
    } catch (error: any) {
      console.error("Streaming error:", error);
      setStreamProgressText("");
      
      addChatMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: `Error: ${error.message || "Something went wrong while generating details. Check server connection."}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleLandingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isStreaming) return;

    try {
      const parsedUrl = new URL(promptInput);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        // Handle as external URL dashboard
        const newPayload: MasterDashboardPayload = {
          dashboardId: crypto.randomUUID(),
          title: "Ingested Dashboard",
          subtitle: `Source: ${parsedUrl.hostname}`,
          ingestedUrl: promptInput,
          filters: [],
          components: []
        };
        setCurrentPayload(newPayload);
        pushState(newPayload);
        showNotification(`Ingested dashboard from ${parsedUrl.hostname}`, "success");
    logActivity(String(`Ingested dashboard from ${parsedUrl.hostname}`));
        setMobileTab('dashboard');
        
        // Add greeting chat
        addChatMessage({
          id: Math.random().toString(),
          role: 'assistant',
          content: `I've successfully mapped the dashboard from **${parsedUrl.hostname}**. You can now ask conversational queries about this data and I'll cross-reference the visual metrics.`,
          timestamp: new Date().toISOString()
        });
        
        setPromptInput('');
        return;
      }
    } catch (_) {
      // not a url, fallthrough
    }

    executeGeneration(promptInput, false);
    setPromptInput('');
  };

  const handleBuilderSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!builderInput.trim() || isStreaming) return;
    const userPrompt = builderInput.trim();
    setBuilderInput('');
    executeGeneration(userPrompt, true, currentPayload ? builderMode === 'edit' : false);
  };

  const handleQaSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!qaInput.trim() || isQaStreaming || !currentPayload) return;

    const userPrompt = qaInput.trim();
    setQaInput('');
    setIsQaStreaming(true);

    const userMsgId = Math.random().toString();
    const assistantMsgId = Math.random().toString();

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toISOString()
    };

    const nextChats = [...qaChats, userMsg];
    setQaChats(nextChats);

    // Placeholder message for assistant stream
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: 'Analyzing metrics...',
      timestamp: new Date().toISOString()
    };
    setQaChats(prev => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          history: nextChats.map(c => ({ role: c.role, content: c.content })),
          url: currentPayload.ingestedUrl || '',
          payload: currentPayload // Send the entire layout and seriesData!
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive response from Data Assistant");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let textBuffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          textBuffer += chunk;

          // Parse sources on the fly
          let cleanContent = textBuffer;
          let sourceWidgetIds: string[] = [];
          
          // Look for [SOURCES: widget_id_1, widget_id_2] format.
          // IMPORTANT: Do not remove the content inside the brackets if it contains numbers!
          // Only remove the bracketed tag line, and ensure numbers remain.
          const srcMatch = textBuffer.match(/\[SOURCES:\s*([^\]]+)\]/i);
          if (srcMatch) {
            const rawList = srcMatch[1].trim();                
            cleanContent = textBuffer.replace(srcMatch[0], "").trim(); // Only remove the matched tag
            if (rawList.toLowerCase() !== 'none') {
              sourceWidgetIds = rawList.split(',').map(s => s.trim()).filter(Boolean);
            }
          }

          // Update message content live!
          setQaChats(prev =>
            prev.map(msg =>
              msg.id === assistantMsgId ? { ...msg, content: cleanContent, sourceWidgetIds } : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error("QA error:", err);
      setQaChats(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, content: `⚠️ Error analyzing data: ${err.message || 'System unavailable'}` }
            : msg
        )
      );
    } finally {
      setIsQaStreaming(false);
    }
  };

  // Slices coordinates filtered components rendering inside canvas
  const componentsToRender = currentPayload?.components?.filter(comp => {
    if (uniqueTabs.length === 0) return true;
    const compTab = comp.tab ? comp.tab.trim() : '';
    const currentSelectedTab = activeTab ? activeTab.trim() : '';
    if (!compTab) {
      // Fallback: assign components without a tab to the first tab
      return currentSelectedTab === uniqueTabs[0];
    }
    return compTab === currentSelectedTab;
  }) || [];

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300 flex flex-col antialiased min-w-0">
      
      {/* PERSISTENT APP HEADER BAR */}
      <header className="sticky top-0 z-40 w-full shrink-0 border-b border-slate-200 bg-white/95 dark:border-zinc-900/90 dark:bg-zinc-950/95 shadow-xs backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6 sm:px-8 min-w-0">
          <div className="flex items-center gap-4 min-w-0">
            {/* Logo container brand segment */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md transform hover:scale-105 transition-all duration-300 cursor-pointer min-w-0">
              <div className="relative flex items-center justify-center h-5 w-5 rounded-full border-2 border-white/90 min-w-0">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            
            <div className="flex items-center min-w-0">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white font-sans">
                Chaupal-Insights
              </span>
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-850 mx-3"></div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping" /> Live Console
              </span>
            </div>
          </div>

          {/* GLOBAL DASHBOARD SEARCH */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative min-w-0">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search dashboards, datasets, metrics... (⌘K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 255)}
                className="w-full pl-10 pr-12 py-2 text-xs bg-slate-50 border border-slate-205 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900/80 transition-all font-sans placeholder-slate-400 dark:placeholder-zinc-650"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-bold text-slate-400 font-sans shadow-xs dark:bg-zinc-950 dark:border-zinc-800">
                ⌘K
              </div>

              {/* Dropdown Results Box */}
              {isSearchFocused && searchTerm.trim() && (
                <div className="absolute top-11 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 max-h-80 overflow-y-auto custom-scrollbar animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono border-b border-slate-100 dark:border-zinc-900/80 mb-1">
                    SAVED DASHBOARDS ({searchResults.length})
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400 font-mono">
                      No matching dashboards found
                    </div>
                  ) : (
                    searchResults.map((dash) => (
                      <button
                        key={dash.dashboardId}
                        onClick={() => {
                          handleLoadDashboardMeta(dash);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-indigo-50/55 dark:hover:bg-indigo-950/20 rounded-lg transition-all flex flex-col gap-0.5 cursor-pointer select-none group min-w-0"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-150 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-sans truncate">
                          {dash.title || "Untitled"}
                        </span>
                        {dash.subtitle && (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                            {dash.subtitle}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            {isStreaming && (
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 dark:bg-zinc-900/40 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-105 dark:border-zinc-800/80 min-w-0">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></div>
                <span>Streaming Ready</span>
              </div>
            )}
            
            {/* Share button */}
            <button
              onClick={handleShareWorkspace}
              className="relative p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 text-slate-500 hover:text-indigo-600 dark:border-zinc-800 dark:hover:border-indigo-900/40 dark:hover:bg-indigo-950/20 dark:text-zinc-400 dark:hover:text-indigo-400 transition-all cursor-pointer inline-flex items-center justify-center h-9 w-9 min-w-0"
              title="Share current dashboard deep-link"
            >
              <Share2 className="h-4.5 w-4.5" />
              {currentPayload && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 min-w-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 min-w-0"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 min-w-0"></span>
                </span>
              )}
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                className="relative p-2 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-500 hover:text-slate-850 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all cursor-pointer inline-flex items-center justify-center h-9 w-9 min-w-0"
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-650 text-[9px] font-black text-white hover:scale-110 transition-transform min-w-0">
                  3
                </span>
              </button>
            </div>

            {/* Help / FAQ Question Info */}
            <button
              className="p-2 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-500 hover:text-slate-850 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all cursor-pointer inline-flex items-center justify-center h-9 w-9 min-w-0"
              title="Help & Documentation"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>

            {/* Toggle Buttons for Panels */}
            <button
                onClick={resetWorkspaceLayout}
                className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-indigo-600 dark:text-zinc-550 dark:hover:text-indigo-400 transition-all h-9 flex items-center justify-center cursor-pointer px-3 text-xs font-bold gap-2 min-w-0"
                title="Reset Workspace Layout"
            >
                <RefreshCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
            </button>
            <button
                onClick={() => setIsLeftSidebarCollapsed(prev => !prev)}
                className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-900 dark:text-zinc-550 dark:hover:text-zinc-100 transition-all h-9 w-9 flex items-center justify-center cursor-pointer min-w-0"
                title="Toggle Left Sidebar"
            >
              <ListRestart className="h-4.5 w-4.5" />
            </button>
            <button
                onClick={() => setIsQAPanelCollapsed(prev => !prev)}
                className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-900 dark:text-zinc-550 dark:hover:text-zinc-100 transition-all h-9 w-9 flex items-center justify-center cursor-pointer min-w-0"
                title="Toggle Q&A Panel"
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </button>

            {/* Theme switcher toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-205 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:border-zinc-805 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all cursor-pointer inline-flex items-center justify-center h-9 w-9 min-w-0"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <div className="h-7 w-px bg-slate-200 dark:bg-zinc-800/80 mx-1"></div>

            {/* USER PROFILE AVATAR BLOCK */}
            <div className="flex items-center gap-2.5 pl-1 shrink-0 select-none min-w-0">
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-violet-605 text-white text-xs font-black ring-2 ring-violet-500/20 font-sans shadow-sm min-w-0">
                AV
              </div>
              <div className="hidden lg:flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-105 leading-tight">Amit Verma</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 font-mono tracking-wide">Administrator</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* DYNAMIC PUSH NOTIFICATION BANNER */}
      {notify && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 shadow-2xl transition-all duration-300 ease-out border-slate-250 animate-bounce min-w-0">
          {notify.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-105 font-mono">
            {notify.message}
          </span>
          <button 
            onClick={() => setNotify(null)}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-105 ml-1.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* CORE WORKSPACE PORTION */}
      <PanelGroup orientation="horizontal" className="flex-1 w-full h-full relative min-h-0 min-w-0">
        
        {/* PANEL A: LEFT SIDEBAR - PREMIUM NAVIGATION */}
        {!isLeftSidebarCollapsed && (
          <Panel id="left-sidebar" collapsible={true} defaultSize={15} maxSize={30} minSize={15} className="h-full border-r border-slate-200 dark:border-zinc-900 bg-white dark:bg-[#0d0f17] flex flex-col z-30">
             <div className="p-4 lg:p-5 overflow-y-auto h-full flex flex-col justify-start custom-scrollbar min-w-0">
              {/* Logo container brand segment */}
              <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-slate-100 dark:border-zinc-800/60 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-indigo-600 shadow-md min-w-0">
                    <div className="relative flex items-center justify-center h-5 w-5 rounded-full border border-white/90 min-w-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-[13.5px] tracking-tight text-slate-900 dark:text-white font-sans">
                        Dashboard-Dost
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white bg-violet-600">v2.0</span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-medium tracking-wide block">
                      AI-Powered Analytics Platform
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsLeftSidebarCollapsed(true)} className="lg:hidden p-1.5 hover:bg-slate-105 dark:hover:bg-zinc-800 rounded-lg text-slate-400">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* New Dashboard primary action CTA */}
              <div className="mb-6">
                <button
                  onClick={handleNewDashboard}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-700 hover:to-indigo-700 transition-all font-sans cursor-pointer shadow-md inline-flex items-center justify-center group min-w-0"
                  title="Start a fresh blank dashboard session"
                >
                  <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  <span>+ New Dashboard</span>
                </button>
              </div>

              {/* SaaS Navigation groups */}
              <div className="space-y-6 flex-1 min-w-0">
                {[
                  {
                    title: "WORKSPACE",
                    items: [
                      { id: 'home', label: 'Home', icon: Home },
                      { id: 'dashboards', label: 'Dashboards', icon: Grid2X2, badge: savedDashboards.length > 0 ? String(savedDashboards.length) : undefined },
                      { id: 'datasets', label: 'Datasets', icon: Database },
                      { id: 'explorer', label: 'Data Explorer', icon: Compass },
                      { id: 'templates', label: 'Templates', icon: LayoutTemplate, action: () => setIsTemplateGalleryOpen(true) },
                      { id: 'reports', label: 'Reports', icon: SlidersHorizontal },
                      { id: 'alerts', label: 'Alerts', icon: Bell },
                    ]
                  },
                  {
                    title: "AI ANALYTICS",
                    items: [
                      { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'New', action: () => { setMobileTab('chat'); if (isQAPanelCollapsed) setIsQAPanelCollapsed(false); } },
                      { id: 'insights', label: 'Smart Insights', icon: Sparkles, action: fetchAIInsights },
                    ]
                  },
                  {
                    title: "MANAGE",
                    items: [
                      { id: 'users', label: 'Users & Teams', icon: Users },
                      { id: 'settings', label: 'Settings', icon: Settings },
                    ]
                  }
                ].map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 tracking-widest font-mono block px-2.5">
                      {group.title}
                    </span>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSidebarMenu === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveSidebarMenu(item.id as any);
                              if (item.action) item.action();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-705 dark:bg-zinc-900 dark:text-indigo-400 font-bold'
                                : 'text-slate-655 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-250 dark:hover:bg-zinc-900/40'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                              <span>{item.label}</span>
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-indigo-100 text-indigo-805 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/30 font-sans tracking-wider">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quick Saved Dashboard Ingestion on left side */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/40">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 tracking-widest font-mono block px-2.5 mb-2">
                    ACTIVE WORKSPACE LIST
                  </span>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar">
                    <SavedDashboardsManager onLoadDashboard={handleLoadDashboardMeta} />
                  </div>
                </div>

                <RecentActivityWidget />
              </div>

              {/* Quick Universal Ingestion form inside left side */}
              <div className="mt-6 mb-4 p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/5 space-y-2.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 font-sans uppercase tracking-wider">
                    Ingest & Build Studio
                  </span>
                </div>
                
                <form onSubmit={handleLeftSidebarSubmit} className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Paste Metabase/Tableau URL..."
                    value={leftSidebarInput}
                    onChange={(e) => setLeftSidebarInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-250 outline-none rounded-lg focus:ring-2 focus:ring-indigo-600/10 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-650"
                  />
                  <button
                    type="submit"
                    disabled={!leftSidebarInput.trim() || isStreaming}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-705 text-[10px] font-bold uppercase tracking-wider font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 min-w-0"
                  >
                    <span>Compile & Render</span>
                  </button>
                </form>
              </div>

              {/* STORAGE METRIC CAPSULE */}
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 border border-slate-205 dark:bg-zinc-900/30 dark:border-zinc-850 space-y-2">
                <div className="flex items-center justify-between min-w-0">
                  <span className="text-[9px] font-bold text-slate-405 dark:text-zinc-550 uppercase tracking-widest font-mono">Workspace Storage</span>
                  <span className="text-[9px] font-bold text-slate-705 dark:text-zinc-305 font-mono">6.5 GB / 10 GB</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-indigo-600 dark:bg-indigo-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </Panel>
        )}
        
        {!isLeftSidebarCollapsed && (
          <PanelResizeHandle className="w-1.5 bg-slate-200/50 hover:bg-indigo-500 dark:bg-zinc-900 dark:hover:bg-indigo-500 transition-colors cursor-col-resize shrink-0" />
        )}

        {/* PANEL B: MIDDLE DISPLAY CANVAS - CORE DASHBOARD VIEWPORT */}
        <Panel id="main-content" className="flex flex-col min-w-0" defaultSize={isLeftSidebarCollapsed && isQAPanelCollapsed ? 100 : 55}>
          <main className="p-4 sm:p-5 md:p-6 flex flex-col justify-start overflow-y-auto h-full custom-scrollbar bg-white dark:bg-[#0c0c11]/25 min-w-0">
          
          {isCanvasLoading ? (
             <DashboardSkeleton />
          ) : !currentPayload && activeSidebarMenu === 'home' ? (
            <HomeLandingView onNavigate={(menu: any) => setActiveSidebarMenu(menu as any)} />
          ) : !currentPayload ? (
            
            /* INTRO EXPERIENCE */
            <div className="max-w-2xl mx-auto w-full my-auto py-12 sm:py-20 flex flex-col items-center min-w-0">
              <div className="text-center space-y-5 mb-10">
                {/* Mockup styled capsule badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-violet-600 bg-violet-50/70 border border-violet-100/90 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/40 font-mono tracking-wide shadow-sm min-w-0">
                  <Activity className="h-3 w-3 text-violet-500 animate-pulse" />
                  <span>Interactive Dashboard Generator</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-sans leading-tight">
                  Turn plain English into high-performance analytical dashboards
                </h2>
                
                <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                  Dash-Dost streams gorgeous KPIs, interactive responsive charts, and client-side filters. Import, export or undo changes instantly.
                </p>
              </div>

              {/* Central landing prompt input */}
              <form onSubmit={handleLandingSubmit} className="w-full relative mb-12">
                {useAppStore.getState().attachedData && (
                  <div className="flex items-center gap-2 mb-2.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg w-max border border-indigo-100 dark:border-indigo-900/40 animate-fade-in min-w-0">
                    <Database className="h-3 w-3 text-indigo-500" />
                    <span className="text-xs text-indigo-700 dark:text-indigo-400 font-mono">
                      Data Attached: {useAppStore.getState().attachedData?.fileName}
                    </span>
                    <button 
                      type="button"
                      onClick={() => useAppStore.getState().setAttachedData(null)}
                      className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm dark:bg-zinc-900/40 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/50 transition-all duration-300 min-w-0">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    disabled={isStreaming}
                    placeholder="E.g., Paste a Dashboard URL (Tableau, Metabase...) or type a prompt"
                    className="flex-1 px-4 py-3.5 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-650 bg-transparent outline-none border-none focus:ring-0 min-w-0"
                  />
                  <div className="flex items-center gap-2 px-1 shrink-0 min-w-0">
                    {/* Inline Import on landing */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-805 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all font-mono text-xs inline-flex items-center gap-1.5 border border-slate-200 dark:border-zinc-800/80 h-11 px-4 shrink-0 transition-all duration-200 min-w-0"
                      title="Upload config or datasets (CSV/Excel/PDF)"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline font-bold">Attach File</span>
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!promptInput.trim() || isStreaming}
                      className="px-6 py-2.5 text-xs font-black text-white bg-violet-600 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-md hover:shadow-lg transition-all font-sans h-11 shrink-0 inline-flex items-center justify-center cursor-pointer min-w-[100px] min-w-0"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </form>

              {/* QUICK CHIP SUGGESTIONS */}
              <div className="w-full space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-center block">
                  Select a starter dataset template
                </span>
                <SuggestionChips onSelected={(p) => executeGeneration(p, false)} />
              </div>
            </div>

          ) : (

            /* ACTIVE LAYOUT */
            <div ref={dashboardRef} className="space-y-6 min-w-0">
              
              {/* Dashboard Title & Quick Actions Toolbelt */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6 mb-8 min-w-0">
                <div className="space-y-1">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-mono">Active Dashboard Workspace</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/30 font-mono select-none min-w-0">
                        <Database className="h-2.5 w-2.5 text-emerald-500" /> Auto-Saved
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 font-sans flex items-center gap-2 mt-0.5 min-w-0">
                      <span>{currentPayload.title}</span>
                      {isStreaming && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500 inline-block animate-ping" />
                      )}
                    </h1>
                  </div>
                  {currentPayload.subtitle && (
                    <p className="text-slate-400 dark:text-zinc-400 text-xs sm:text-sm">
                      {currentPayload.subtitle}
                    </p>
                  )}
                </div>

                {/* Operations cluster */}
                <div data-html2canvas-ignore className="flex flex-wrap items-center gap-2 self-start xl:self-center shrink-0 min-w-0">
                  {currentPayload.ingestedUrl ? null : (
                  <>
                  {/* Undo Button */}
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:text-zinc-400 transition-all cursor-pointer h-9 w-9 inline-flex items-center justify-center shadow-sm min-w-0"
                    title="Undo design change (Ctrl+Z)"
                  >
                    <Undo className="h-4 w-4" />
                  </button>

                  {/* Redo Button */}
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:text-zinc-400 transition-all cursor-pointer h-9 w-9 inline-flex items-center justify-center shadow-sm min-w-0"
                    title="Redo design change (Ctrl+Y)"
                  >
                    <Redo className="h-4 w-4" />
                  </button>

                  <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>

                  {/* Import Config file launcher */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-lg transition-all h-9 shadow-sm cursor-pointer min-w-0"
                    title="Attach CSV/Excel/PDF or upload JSON template"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Attach Data</span>
                  </button>

                  {/* Export Config button */}
                  <button
                    onClick={handleExportDashboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-lg transition-all h-9 shadow-sm cursor-pointer min-w-0"
                    title="Export and download dashboard JSON configuration"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Dashboard</span>
                  </button>
                  </>
                  )}

                  {/* Capture PDF Screenshot button */}
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-lg transition-all h-9 shadow-sm cursor-pointer min-w-0"
                    title="Download active dashboard layout view as a multi-page PDF"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>PDF</span>
                  </button>

                  {/* Capture Screenshot button */}
                  <button
                    onClick={handleDownloadScreenshot}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-lg transition-all h-9 shadow-sm cursor-pointer min-w-0"
                    title="Download active dashboard layout view as a PNG image"
                  >
                    <Camera className="h-3.5 w-3.5 text-slate-400" />
                    <span>Snapshot</span>
                  </button>

                  {currentPayload.ingestedUrl ? null : (
                  <>
                  <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>

                  {/* Add-on 2: Live Mode Selector */}
                  <div className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg h-9 dark:bg-zinc-950 dark:border-zinc-800 shrink-0 shadow-sm min-w-0" title="Periodically refresh components data simulating telemetry feeds">
                    <span className="relative flex h-2 w-2 mr-1 min-w-0">
                      <span className={`${refreshInterval ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 min-w-0"></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono">LIVE:</span>
                    <select
                      value={refreshInterval || 'off'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'off') {
                          setRefreshInterval(null);
                        } else {
                          setRefreshInterval(parseInt(val));
                        }
                      }}
                      className="bg-transparent text-[11px] font-bold text-slate-600 dark:text-zinc-350 focus:outline-none border-none py-0.5 cursor-pointer pr-1"
                    >
                      <option value="off">Off</option>
                      <option value="5">5s (Demo)</option>
                      <option value="30">30s</option>
                      <option value="60">1m</option>
                      <option value="300">5m</option>
                    </select>
                  </div>

                  {/* Add-on 3: AI Insights */}
                  <button
                    onClick={fetchAIInsights}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400 border border-indigo-150 rounded-lg transition-all h-9 shadow-sm cursor-pointer min-w-0"
                    title="Generate intelligent automated executive advice and business summaries from active metrics"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Insights</span>
                  </button>

                  <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>

                  {/* Add-on 4: Preset Layout Selector */}
                  <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg h-9 dark:bg-zinc-900/60 dark:border-zinc-800 shrink-0 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono mr-1">PRESET:</span>
                    {layoutPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPresetLayout(preset.id)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all border cursor-pointer select-none ${
                          activePresetId === preset.id
                            ? 'bg-white border-slate-300 text-indigo-650 dark:bg-zinc-950 dark:border-zinc-800 dark:text-indigo-400 shadow-sm'
                            : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                        title={preset.description}
                      >
                        {preset.name.split(' ')[0]} {/* shortened */}
                      </button>
                    ))}
                  </div>

                  <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>

                  {/* Template Gallery Button */}
                  <button
                    onClick={() => setIsTemplateGalleryOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-900 rounded-lg transition-all h-9 shadow-sm cursor-pointer min-w-0"
                    title="Browse and apply pre-configured dashboard templates"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 text-slate-400" />
                    <span>Templates</span>
                  </button>

                  {/* Add-on 5: Create Visual Section Button */}
                  <button
                    onClick={() => {
                      setEditingSectionId(null);
                      setNewSectionTitle('');
                      setNewSectionDesc('');
                      setSelectedSectionComponentIds([]);
                      setIsSectionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-900 rounded-lg transition-all h-9 shadow-sm cursor-pointer min-w-0"
                    title="Group related widgets together inside a cozy Visual Container"
                  >
                    <Grid2X2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Group Link</span>
                  </button>

                  {/* Add Component Action */}
                  <button
                    onClick={() => {
                      setEditingComponent(null);
                      setIsComponentModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-550 dark:hover:bg-indigo-600 rounded-lg transition-all h-9 shadow-md cursor-pointer shadow-indigo-500/10 min-w-0"
                    title="Assemble customized chart/KPI"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Widget</span>
                  </button>
                  </>
                  )}
                </div>
              </div>

              {/* INGESTED URL SANDBOX (DUAL-PANE) */}
              {currentPayload.ingestedUrl ? (
                <div className="w-full h-[70vh] rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm relative group">
                  <div className="absolute top-0 left-0 right-0 h-8 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center px-4 justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                       <div className="flex gap-1.5 min-w-0">
                         <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                       </div>
                       <span className="text-[10px] ml-2 font-mono text-slate-500 truncate max-w-[200px]">{currentPayload.ingestedUrl}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-widest uppercase">Secure Session Active</span>
                  </div>
                  <iframe 
                    src={currentPayload.ingestedUrl} 
                    className="w-full h-full pt-8 bg-white"
                    title="External Dashboard View"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              ) : (
                <>
                  {/* FILTERS TOOLBOX */}
                  <FiltersPanel
                    payload={currentPayload}
                    filterState={filterState}
                    onFilterStateChange={setFilterState}
                    onResetFilters={handleResetFilters}
                    onAddFilter={() => {
                      setEditingFilter(null);
                      setIsFilterModalOpen(true);
                    }}
                    onEditFilter={(f) => {
                      setEditingFilter(f);
                      setIsFilterModalOpen(true);
                    }}
                    onDeleteFilter={handleDeleteFilter}
                  />

                  {/* RESPONSIVE SUBPAGES / TAB SELECTOR */}
              {orderedTabs.length > 0 && (
                <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800/80 pb-2.5 mb-6 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mr-1 shrink-0 flex items-center gap-1 min-w-0">
                    <Compass className="h-3.5 w-3.5" /> Pages:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 pb-1 min-w-0">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleTabDragEnd}
                    >
                      <SortableContext
                        items={orderedTabs}
                        strategy={horizontalListSortingStrategy}
                      >
                        {orderedTabs.map(tabName => (
                          <SortableTabItem
                            key={tabName}
                            id={tabName}
                            activeTab={activeTab}
                            onClick={() => setActiveTab(tabName)}
                            onDuplicate={handleDuplicateTab}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              )}

              {/* CANVAS CHART GRID */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={[...sections.map(s => `section-${s.id}`), ...componentsToRender.map((c) => c.id)]}
                  strategy={rectSortingStrategy}
                >
                  <motion.div 
                    layout
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                        }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative w-full min-w-0 overflow-hidden"
                  >
                    {/* Visual Sections Group Cards */}
                    {sections.map((sec) => {
                      const secComps = componentsToRender.filter(c => sec.componentIds.includes(c.id));
                      if (secComps.length === 0) return null;

                      return (
                        <SortableSectionItem key={sec.id} id={`section-${sec.id}`}>
                          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 dark:bg-zinc-950/20 dark:border-zinc-800/80 space-y-4 shadow-sm animate-fade-in relative z-10 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200/50 pb-2.5 dark:border-zinc-800/50 pl-6 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <button 
                                  onClick={() => setCollapsedSectionIds(prev => prev.includes(sec.id) ? prev.filter(id => id !== sec.id) : [...prev, sec.id])} 
                                  className="text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                                >
                                  {collapsedSectionIds.includes(sec.id) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                                <div>
                                  <h4 className="text-xs font-mono uppercase tracking-widest text-indigo-650 dark:text-indigo-400 font-bold mb-0.5 flex items-center gap-1.5 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-505 animate-pulse"></span>
                                    Section Group: {sec.title}
                                  </h4>
                                  {sec.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium">
                                      {sec.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  onClick={() => {
                                    setEditingSectionId(sec.id);
                                    setNewSectionTitle(sec.title);
                                    setNewSectionDesc(sec.description || '');
                                    setSelectedSectionComponentIds(sec.componentIds);
                                    setIsSectionModalOpen(true);
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-all border border-slate-200 hover:border-indigo-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 rounded-lg cursor-pointer"
                                >
                                  Edit Group
                                </button>
                                <button
                                  onClick={() => handleDeleteSection(sec.id)}
                                  className="px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200 rounded-lg cursor-pointer transition-all shrink-0"
                                >
                                  Ungroup
                                </button>
                              </div>
                            </div>

                            <div
                              className={`grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative origin-top transition-all duration-550 ease-in-out overflow-hidden min-w-0 ${
                                collapsedSectionIds.includes(sec.id) 
                                  ? 'max-h-0 opacity-0 pointer-events-none border-none mt-0 pt-0 py-0' 
                                  : 'max-h-[8000px] opacity-100 mt-4'
                              }`}
                            >
                              {secComps.map((component) => {
                                 const smCol = component.layout?.sm || 12;
                                 const mdCol = component.layout?.md || 12;
                                 const lgCol = component.layout?.lg || 6;
                                 const colSpanClass = getColSpanClasses(smCol, mdCol, lgCol);
                                 const filteredRows = filterComponentData(component, currentPayload.filters || [], filterState);
  
                                return (
                                  <div key={`${component.id}_${reconciliationKey}`} id={`widget-card-${component.id}`} className={`${colSpanClass} scroll-mt-24 transition-all duration-300 rounded-3xl`}>
                                    <ChartWrapper
                                      component={component}
                                      filteredData={filteredRows}
                                      filterState={filterState}
                                      onEditComponent={(comp) => {
                                        setEditingComponent(comp);
                                        setIsComponentModalOpen(true);
                                      }}
                                      onDeleteComponent={handleDeleteComponent}
                                      isFullscreen={false}
                                      onToggleFullscreen={(id) => setFullscreenComponentId(id)}
                                      onDrillDown={(key, val) => {
                                        const normalizedKey = key.toLowerCase();
                                        const existingFilter = currentPayload.filters?.find(f => 
                                          f.targetKeys.some(tk => tk.toLowerCase() === normalizedKey)
                                        );
                                        if (existingFilter) {
                                          setFilterState(prev => {
                                            const prevVals = prev.selectedCategories[existingFilter.id] || [];
                                            const isSelected = prevVals.includes(val);
                                            const newVals = isSelected ? prevVals.filter(v => v !== val) : [...prevVals, val];
                                            return { ...prev, selectedCategories: { ...prev.selectedCategories, [existingFilter.id]: newVals } };
                                          });
                                        } else {
                                          const newFilterId = `f_${key}_${Date.now()}`;
                                          const nextPayload = { ...currentPayload,
    logActivity, filters: [...(currentPayload.filters||[]), { id: newFilterId, label: key.toUpperCase(), type: 'category_select' as const, targetKeys: [key] }] };
                                          pushState(nextPayload).then(() => setFilterState(prev => ({ ...prev, selectedCategories: { ...prev.selectedCategories, [newFilterId]: [val] } })));
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </SortableSectionItem>
                      );
                    })}

                    {/* Standalone Visual Components */}
                    {componentsToRender.filter(c => !sections.some(s => s.componentIds.includes(c.id))).map((component) => {
                      const smCol = component.layout?.sm || 12;
                      const mdCol = component.layout?.md || 12;
                      const lgCol = component.layout?.lg || 6;
                      
                      const colSpanClass = getColSpanClasses(smCol, mdCol, lgCol);

                      // Slice dataset rows by dynamic configuration limit parameters
                      const filteredRows = filterComponentData(component, currentPayload.filters || [], filterState);

                      return (
                        <motion.div
                          key={`${component.id}_${reconciliationKey}`}
                          id={`widget-card-${component.id}`}
                          layout
                          variants={{
                            hidden: { opacity: 0, y: 15 },
                            show: { 
                              opacity: 1, 
                              y: 0,
                              transition: {
                                type: "spring",
                                stiffness: 90,
                                damping: 15
                              }
                            }
                          }}
                          className={`${colSpanClass} scroll-mt-24 transition-all duration-300 rounded-3xl`}
                        >
                          <SortableDashboardItem id={component.id}>
                            <ChartWrapper
                              component={component}
                              filteredData={filteredRows}
                              onEditComponent={(comp) => {
                                setEditingComponent(comp);
                                setIsComponentModalOpen(true);
                              }}
                              onDeleteComponent={handleDeleteComponent}
                              isFullscreen={false}
                              onToggleFullscreen={(id) => setFullscreenComponentId(id)}
                              onDrillDown={(key, val) => {
                                const existingFilter = currentPayload.filters?.find(f => f.targetKeys.includes(key));
                                if (existingFilter) {
                                  setFilterState(prev => ({ ...prev, selectedCategories: { ...prev.selectedCategories, [existingFilter.id]: [val] } }));
                                } else {
                                  const newFilterId = `f_${key}_${Date.now()}`;
                                  const nextPayload = { ...currentPayload,
    logActivity, filters: [...(currentPayload.filters||[]), { id: newFilterId, label: key.toUpperCase(), type: 'category_select' as const, targetKeys: [key] }] };
                                  pushState(nextPayload).then(() => setFilterState(prev => ({ ...prev, selectedCategories: { ...prev.selectedCategories, [newFilterId]: [val] } })));
                                }
                              }}
                            />
                          </SortableDashboardItem>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </SortableContext>
              </DndContext>

              {componentsToRender.length === 0 && currentPayload.components?.length > 0 && (
                <div className="flex h-48 flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:bg-zinc-900/10 min-w-0">
                  <Grid2X2 className="h-6 w-6 text-slate-350 dark:text-zinc-700 mb-2" />
                  <span className="text-xs font-semibold text-slate-500 font-mono">Page Empty</span>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 max-w-sm">
                    No components have been assigned to page "{activeTab}". Customize or create a new widget specifically for this tab scope.
                  </p>
                </div>
              )}

              {currentPayload.components?.length === 0 && (
                <div className="flex h-64 flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/5 min-w-0">
                  <Grid2X2 className="h-10 w-10 text-slate-300 dark:text-zinc-700 animate-pulse mb-3" />
                  <span className="text-xs font-semibold text-slate-500 font-mono">Empty Canvas Grid</span>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 max-w-[240px]">
                    Create custom KPI aggregates or analytical graphs using "+ Add Component" above!
                  </p>
                </div>
              )}

              {/* CHAUPL SESSIONS INTERACTIVE SEED TABLE */}
              {((currentPayload.title || '').toLowerCase().includes('chaupal') || activeTab.toLowerCase().includes('chaupal')) && (
                <div className="mt-8 bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-900/80 shadow-xs overflow-hidden animate-fade-in w-full">
                  <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748b] dark:text-zinc-400 flex items-center gap-2 min-w-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        Recent Chaupal Sessions Log
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
                        Comprehensive audit status of community interventions, participants and local challenges
                      </p>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/25 dark:text-indigo-400 px-2.5 py-1 rounded-full font-mono font-bold">
                        {recentChaupalSessions.length} Active Records
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-zinc-900/40 border-b border-slate-200/50 dark:border-zinc-800/80">
                          <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">Session Date</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">Location / District</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">Category</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono text-center">Participants</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono text-center">Issues Shared</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                        {recentChaupalSessions.map((session, sidx) => (
                          <tr key={sidx} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                            <td className="p-4">
                              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 font-mono">
                                {session.date}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7.5 w-7.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-bold text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-mono min-w-0">
                                  {session.village.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                    {session.village}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                                    {session.district} District
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-zinc-900 dark:text-zinc-300 text-slate-600 border border-slate-200/40 dark:border-zinc-800/60 font-sans">
                                {session.sessionType}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-400 text-xs font-black font-mono min-w-0">
                                <Users className="h-3 w-3" />
                                {session.participants}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-xs font-bold font-mono text-slate-700 dark:text-zinc-200">
                                {session.challengesShared}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/30 min-w-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </>
              )}

            </div>
          )}
          {/* Active removable tag chips in Panel B */}
          {Object.keys(filterState.selectedCategories).length > 0 && (
            <div className="mt-6 p-3 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-900 rounded-2xl space-y-2 shrink-0 max-w-xl">
              <div className="flex items-center justify-between min-w-0">
                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Active Filters</span>
                <button 
                  onClick={handleResetFilters}
                  className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-805 dark:text-indigo-400 font-mono transition-all cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5 min-w-0">
                {Object.entries(filterState.selectedCategories).map(([filterId, val]) => {
                  if (!val) return null;
                  const filterObj = currentPayload?.filters?.find(f => f.id === filterId);
                  const filterLabel = filterObj ? filterObj.label : filterId;
                  return (
                    <span 
                      key={filterId}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/45 select-none animate-fade-in min-w-0"
                    >
                      <span className="opacity-80 truncate max-w-[80px]">{filterLabel}:</span>
                      <span className="truncate max-w-[80px] font-bold">{val}</span>
                      <button
                        onClick={() => {
                          setFilterState(current => {
                            const next = { ...current.selectedCategories };
                            delete next[filterId];
                            return { selectedCategories: next };
                          });
                        }}
                        className="hover:text-rose-500 cursor-pointer p-0.5 ml-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

        </main>
        </Panel>

        {/* PANEL C: RIGHT SIDEBAR - ASSISTANTS & CONVERSATIONS */}
        {!isQAPanelCollapsed && (
          <>
            <PanelResizeHandle className="w-1.5 bg-slate-200/50 hover:bg-indigo-500 dark:bg-zinc-900 dark:hover:bg-indigo-500 transition-colors cursor-col-resize shrink-0" />
            <Panel id="right-sidebar" defaultSize={20} collapsible={true} maxSize={40} minSize={15} className="bg-slate-50/70 dark:bg-[#09090c]/90 h-full overflow-hidden border-l border-slate-200 dark:border-zinc-900 transition-all flex flex-col z-30">
              <div className="p-4 lg:p-5 flex flex-col h-full overflow-hidden min-w-0">
                <div className="flex justify-between items-center mb-4 min-w-0">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Panel</h3>
                    <div className="flex gap-2 min-w-0">
                      <button onClick={() => setIsQAPanelCollapsed(true)} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                </div>
                
                {/* Segmented Tab Headers */}
                <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-xl p-0.5 border border-slate-200/60 dark:border-zinc-800 shadow-inner mb-4 w-full shrink-0 min-w-0">
                  <button
                    type="button"
                    onClick={() => setRightActiveChatTab('builder')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      rightActiveChatTab === 'builder'
                        ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                        : 'text-slate-450 hover:text-slate-750 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    🛠️ Layout Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightActiveChatTab('qa')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      rightActiveChatTab === 'qa'
                        ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                        : 'text-slate-450 hover:text-slate-750 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    💡 Data Analyst Q&A
                  </button>
                </div>

                {/* Active Tab View */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {rightActiveChatTab === 'builder' ? (
              /* TAB 1: DESIGN & LAYOUT BUILDER CHAT */
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {/* Header Info */}
                <div className="mb-3 shrink-0 flex items-center justify-between min-w-0">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-widest font-mono">Dost-Builder Chat</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">Type instructions to compile or edit layout state</p>
                  </div>
                  {currentPayload && (
                    <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/20 text-violet-750 dark:text-violet-400 border border-violet-100/40 dark:border-violet-900/40 px-2 py-0.5 rounded text-[9px] font-bold font-mono min-w-0">
                      <span>{builderMode === 'edit' ? 'EDIT MODE' : 'NEW MODE'}</span>
                    </div>
                  )}
                </div>

                {/* Undo / Redo / Clear Tools Row */}
                {currentPayload && (
                  <div className="mb-3 shrink-0 grid grid-cols-4 gap-1 text-[9px] font-mono">
                    <button
                      type="button"
                      onClick={undo}
                      disabled={!canUndo}
                      className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 text-slate-650 dark:text-zinc-300 hover:text-indigo-650 disabled:opacity-40 transition-all cursor-pointer min-w-0"
                      title="Undo last layout state changes"
                    >
                      <Undo className="h-3 w-3" />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={redo}
                      disabled={!canRedo}
                      className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 text-slate-650 dark:text-zinc-300 hover:text-indigo-650 disabled:opacity-40 transition-all cursor-pointer min-w-0"
                      title="Redo previously undone state transition"
                    >
                      <Redo className="h-3 w-3" />
                      <span>Redo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
                          setNotify({ type: 'success', message: 'Copied layout JSON configuration!' });
                        } catch (_) {}
                      }}
                      className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-slate-750 dark:text-zinc-300 hover:text-indigo-600 transition-all cursor-pointer min-w-0"
                      title="Copy JSON layout spec"
                    >
                      <FileJson className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearWorkspace}
                      className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-slate-750 dark:text-zinc-300 hover:text-rose-500 transition-all cursor-pointer min-w-0"
                      title="Reset canvas state"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                )}

                {/* Builder Chat Logs Area */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-100/50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/40 dark:border-zinc-900/60 custom-scrollbar mb-3 min-h-0 min-w-0">
                  {chats.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 my-auto min-w-0">
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-full shadow-xs">
                        <Bot className="h-5 w-5 text-indigo-500 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 font-sans block mb-1">Awaiting Layout Directives</span>
                        <p className="text-[10px] text-slate-450 dark:text-zinc-500 leading-relaxed font-sans max-w-[210px] mx-auto">
                          State your layout design, add components, or choose a template on the left to stream beautiful charts!
                        </p>
                      </div>
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`flex gap-2.5 max-w-[90%] ${
                          chat.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        <div className={`p-3 rounded-2xl text-[11px] sm:text-xs leading-relaxed shadow-xs transition-all whitespace-pre-wrap ${
                          chat.role === 'user'
                            ? 'bg-indigo-650 text-white rounded-tr-none border border-indigo-700 font-medium font-sans'
                            : 'bg-white border border-slate-200/80 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800/85 dark:text-zinc-250 rounded-tl-none font-sans'
                        }`}>
                          {chat.content}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Streaming Progression Animation */}
                  {isStreaming && (
                    <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-zinc-900/60 border border-indigo-100/50 dark:border-indigo-900/45 space-y-2 font-mono text-[10px] animate-pulse">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[9px] shrink-0 min-w-0">
                        <Activity className="h-3.5 w-3.5 animate-spin" />
                        <span>Compiling Layout Specs...</span>
                      </div>
                      
                      {streamProgressText && (
                        <div className="text-[9px] text-slate-400 dark:text-zinc-400 italic truncate">
                          {streamProgressText}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Builder Input Box */}
                <div className="shrink-0 bg-white dark:bg-zinc-950 p-3 border border-slate-300 dark:border-zinc-700 rounded-xl space-y-2">
                  {currentPayload && (
                    <div className="flex bg-slate-200 dark:bg-zinc-800 rounded-lg p-0.5 border border-slate-300/40 dark:border-zinc-700 items-center justify-around min-w-0">
                      <button
                        type="button"
                        onClick={() => setBuilderMode('edit')}
                        className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                          builderMode === 'edit'
                            ? 'bg-white dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-250/20'
                            : 'text-slate-450'
                        }`}
                        title="Edit active layout structure"
                      >
                        EDIT ACTIVE
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderMode('new')}
                        className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                          builderMode === 'new'
                            ? 'bg-white dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-250/20'
                            : 'text-slate-450'
                        }`}
                        title="Build layout from scratch"
                      >
                        NEW CANVAS
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleBuilderSubmit} className="relative flex items-center min-w-0">
                    <input
                      type="text"
                      value={builderInput}
                      onChange={(e) => setBuilderInput(e.target.value)}
                      disabled={isStreaming}
                      placeholder={
                        isStreaming
                          ? "Assembling dashboard specifications..."
                          : currentPayload && builderMode === 'edit'
                          ? "E.g., 'Change column to 3', 'Add conversion map'"
                          : "Type instructions to generate a custom dashboard..."
                      }
                      className="w-full pl-3 pr-11 py-2.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all shadow-xs shrink-0"
                    />
                    <button
                      type="submit"
                      disabled={!builderInput.trim() || isStreaming}
                      className={`absolute right-1 text-white p-1.5 rounded-md transition-all cursor-pointer ${
                        builderInput.trim() && !isStreaming
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xs transform active:scale-95'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-450 dark:text-zinc-650'
                      }`}
                    >
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* TAB 2: DATA ANALYST Q&A CHAT */
              <div className="flex-1 flex flex-col min-h-0 font-sans min-w-0">
                {/* Header Info */}
                <div className="mb-3 shrink-0 flex items-center justify-between min-w-0">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-widest font-mono">Data Analyst Q&A</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">Ask questions about trends and metrics context</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-405 border border-emerald-100/40 dark:border-emerald-900/35 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold shrink-0 min-w-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>DASHBOARD LIVE</span>
                  </div>
                </div>

                {/* Current Context Summary */}
                {currentPayload && (
                  <div className="mb-3 p-3 bg-violet-50/50 dark:bg-violet-950/15 border border-violet-100/40 dark:border-violet-900/45 rounded-xl space-y-1.5 text-[10px] shrink-0 transition-all">
                    <div className="flex items-center gap-1.5 font-bold text-violet-700 dark:text-violet-300 font-sans min-w-0">
                      <Compass className="h-3.5 w-3.5 text-violet-600" />
                      <span>Current Grounding Context</span>
                    </div>
                    <div className="space-y-1 text-slate-700 dark:text-zinc-300 ml-5 font-sans">
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white">Dashboard:</span> {currentPayload.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 leading-relaxed min-w-0">
                        <span className="font-extrabold text-slate-900 dark:text-white">Filters:</span>
                        {(() => {
                          const activeFilterLabels: string[] = [];
                          (currentPayload.filters || []).forEach(f => {
                            const selected = filterState.selectedCategories[f.id] || [];
                            if (selected.length > 0) {
                              activeFilterLabels.push(`${f.label}: ${selected.join(', ')}`);
                            }
                          });
                          if (activeFilterLabels.length === 0) {
                            return <span className="text-slate-500 dark:text-zinc-500 italic font-medium font-sans">None (All values loaded)</span>;
                          }
                          return activeFilterLabels.map((lbl, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100 rounded-md font-bold font-mono text-[9px] border border-violet-200 dark:border-violet-800 shadow-2xs">
                              {lbl}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Q&A Chat Logs Area */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-300 dark:border-zinc-800 custom-scrollbar mb-3 min-h-0 min-w-0">
                  {qaChats.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 my-auto font-sans min-w-0">
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full shadow-xs">
                        <MessageSquare className="h-5 w-5 text-emerald-500 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 font-sans block mb-1">Awaiting active dataset</span>
                        <p className="text-[10px] text-slate-450 dark:text-zinc-500 leading-relaxed font-sans max-w-[210px] mx-auto">
                          Load a dashboard template or compile custom datasets to query metrics, aggregates, ratios and find trends!
                        </p>
                      </div>
                    </div>
                  ) : (
                    qaChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`flex flex-col gap-1 max-w-[90%] ${
                          chat.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className={`flex gap-2.5 w-full ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-3 rounded-2xl text-[11px] sm:text-xs leading-relaxed shadow-xs transition-all whitespace-pre-wrap w-full ${
                            chat.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-700 font-medium font-sans'
                              : 'bg-white border border-slate-300 text-slate-800 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 rounded-tl-none font-sans'
                          }`}>
                            <div>{chat.content}</div>

                            {chat.role === 'assistant' && chat.sourceWidgetIds && chat.sourceWidgetIds.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-1.5 items-center min-w-0">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono font-bold">Sources:</span>
                                {chat.sourceWidgetIds.map(compId => {
                                  const widget = currentPayload?.components?.find(c => c.id === compId);
                                  const displayName = widget?.title || compId;
                                  return (
                                    <button
                                      key={compId}
                                      type="button"
                                      onClick={() => {
                                        const element = document.getElementById(`widget-card-${compId}`);
                                        if (element) {
                                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          element.classList.add('ring-4', 'ring-indigo-650', 'dark:ring-indigo-400', 'ring-offset-2', 'ring-opacity-90');
                                          setTimeout(() => {
                                            element.classList.remove('ring-4', 'ring-indigo-650', 'dark:ring-indigo-400', 'ring-offset-2', 'ring-opacity-90');
                                          }, 2500);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-750 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60 rounded-full text-[9px] font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer max-w-full truncate min-w-0"
                                      title={`Click to focus: ${displayName}`}
                                    >
                                      <Compass className="h-2.5 w-2.5 shrink-0 text-violet-500 animate-pulse" />
                                      <span className="truncate">{displayName}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {isQaStreaming && (
                    <div className="flex items-center gap-2 mr-auto text-indigo-650 dark:text-indigo-400 font-mono text-[9px] animate-pulse min-w-0">
                      <Activity className="h-3 w-3 animate-spin text-indigo-550" />
                      <span>Data Assistant is analyzing dashboard metrics...</span>
                    </div>
                  )}
                </div>

                {/* Q&A Suggestion Chips focused specifically on analytical reviews */}
                {currentPayload && (
                  <div className="mb-3 shrink-0">
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {[
                        { label: "📊 Summary", q: "Can you summarize the main metrics and key insights from the active dashboard?" },
                        { label: "📈 Spikes/Spurs", q: "Are there any major spikes or interesting trends inside the dataset metrics?" },
                        { label: "🏆 Leaders", q: "Which segment or category has the highest values or leading performance?" }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQaInput(item.q);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 rounded-lg text-[9px] font-semibold text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 transition-all cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q&A Input Box */}
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-2 pb-2 min-w-0">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setQaInput(suggestion);
                        }}
                        className="px-2.5 py-1 text-[10px] bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 text-violet-750 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-full transition-all hover:scale-105 active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div className="shrink-0 bg-white/50 dark:bg-zinc-900/20 p-2 border border-slate-205 dark:border-zinc-905 rounded-xl space-y-2">
                  <form onSubmit={handleQaSubmit} className="relative flex items-center min-w-0">
                    <input
                      type="text"
                      value={qaInput}
                      onChange={(e) => setQaInput(e.target.value)}
                      disabled={isQaStreaming || !currentPayload}
                      placeholder={
                        !currentPayload
                          ? "Compile a dashboard first to ask Q&A..."
                          : isQaStreaming
                          ? "Formulating data replies..."
                          : "Ask metric questions (e.g. 'what is the average category performance?')"
                      }
                      className="w-full pl-3 pr-11 py-2.5 text-xs rounded-lg border border-slate-205 text-slate-800 bg-white dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-550 focus:border-indigo-550 focus:outline-none transition-all shadow-xs disabled:opacity-50 shrink-0"
                    />
                    <button
                      type="submit"
                      disabled={!qaInput.trim() || isQaStreaming || !currentPayload}
                      className={`absolute right-1 text-white p-1.5 rounded-md transition-all cursor-pointer ${
                        qaInput.trim() && !isQaStreaming && currentPayload
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xs transform active:scale-95'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-450 dark:text-zinc-650'
                      }`}
                    >
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </button>
                  </form>
                  {qaChats.length > 1 && (
                    <div className="flex items-center justify-end min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentPayload) {
                            setQaChats([
                              {
                                id: 'welcome',
                                role: 'assistant',
                                content: `Hi there! I am your context-aware **Assistant**. I have ingested the "${currentPayload.title}" dashboard.
                    
Ask me any questions about the metrics, trends, or records displayed above!`,
                                timestamp: new Date().toISOString()
                              }
                            ]);
                          }
                        }}
                        className="text-[9px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer uppercase tracking-wider font-mono bg-transparent outline-none border-none"
                      >
                        Reset Thread
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
              </div>
            </Panel>
          </>
        )}

      </PanelGroup>

      {/* FLOATING CHAT BUTTON WHEN COLLAPSED */}
      {isQAPanelCollapsed && (
        <button
          onClick={() => setIsQAPanelCollapsed(false)}
          className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105 active:scale-95"
          title="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
          {isQaStreaming && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-indigo-600" />
          )}
        </button>
      )}

      {/* MOBILE RESPONSIVE BOTTOM TAB SELECTOR BAR */}
      <div className="lg:hidden shrink-0 h-16 border-t border-slate-200 bg-white/90 dark:border-zinc-900 dark:bg-zinc-950/90 backdrop-blur-md flex items-center justify-around px-2 sticky bottom-0 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe-bottom min-w-0">
        <button
          onClick={() => setMobileTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${mobileTab === 'history' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/10 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <History className="h-4.5 w-4.5" />
          <span className="text-[10px] font-sans">History</span>
        </button>

        <button
          onClick={() => setMobileTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${mobileTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/10 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <BarChart className="h-4.5 w-4.5" />
          <span className="text-[10px] font-sans">Dashboard</span>
          {isStreaming && (
            <span className="absolute top-1 right-3.5 h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${mobileTab === 'chat' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/10 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <span className="text-[10px] font-sans">Assistants</span>
          {isQaStreaming && (
            <span className="absolute top-1 right-3.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* COMPONENT MODAL */}
      <EditComponentModal
        isOpen={isComponentModalOpen}
        onClose={() => {
          setIsComponentModalOpen(false);
          setEditingComponent(null);
        }}
        onSave={handleSaveComponent}
        componentToEdit={editingComponent}
      />

      {/* FILTER MODAL */}
      <EditFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => {
          setIsFilterModalOpen(false);
          setEditingFilter(null);
        }}
        onSave={handleSaveFilter}
        filterToEdit={editingFilter}
      />

      {/* FULLSCREEN COMPONENT VIEW OVERLAY */}
      {fullscreenComponentId && (() => {
        const comp = currentPayload?.components?.find(c => c.id === fullscreenComponentId);
        if (!comp) return null;
        const filteredRows = filterComponentData(comp, currentPayload?.filters || [], filterState);
        return (
          <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 p-6 md:p-10 flex flex-col w-screen h-screen overflow-auto min-w-0">
            <div className="flex-1 flex flex-col h-full min-w-0">
              <ChartWrapper
                component={comp}
                filteredData={filteredRows}
                onEditComponent={(comp) => {
                  setEditingComponent(comp);
                  setIsComponentModalOpen(true);
                }}
                onDeleteComponent={(id) => {
                  handleDeleteComponent(id);
                  setFullscreenComponentId(null);
                }}
                isFullscreen={true}
                onToggleFullscreen={() => setFullscreenComponentId(null)}
                onDrillDown={(key, val) => {
                  const existingFilter = currentPayload?.filters?.find(f => f.targetKeys.includes(key));
                  if (existingFilter) {
                    setFilterState(prev => ({ ...prev, selectedCategories: { ...prev.selectedCategories, [existingFilter.id]: [val] } }));
                  } else if (currentPayload) {
                    const newFilterId = `f_${key}_${Date.now()}`;
                    const nextPayload = { ...currentPayload,
    logActivity, filters: [...(currentPayload.filters||[]), { id: newFilterId, label: key.toUpperCase(), type: 'category_select' as const, targetKeys: [key] }] };
                    pushState(nextPayload).then(() => setFilterState(prev => ({ ...prev, selectedCategories: { ...prev.selectedCategories, [newFilterId]: [val] } })));
                  }
                  setFullscreenComponentId(null); // exit fullscreen on drill down
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* AI INSIGHTS DIALOG VIEW OVERLAY */}
      {insightsPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in min-w-0">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col justify-start overflow-hidden font-sans min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 text-indigo-600 bg-indigo-50 border border-indigo-120 rounded-lg dark:bg-indigo-950/20 dark:text-indigo-400">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm tracking-tight uppercase">AI executive insights</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Powered by Gemini 3.5 Flash</p>
                </div>
              </div>
              <button
                onClick={() => setInsightsPromptOpen(false)}
                className="p-1 rounded-lg text-slate-455 hover:text-slate-650 dark:hover:text-zinc-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 custom-scrollbar text-xs leading-relaxed font-sans text-slate-700 dark:text-zinc-350 min-w-0">
              {insightsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3.5 min-w-0">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold text-slate-500 font-mono animate-pulse">Analyzing dashboard metrics...</span>
                </div>
              ) : insightsText ? (
                <div className="space-y-4">
                  {insightsText.split('\n').map((line, idx) => {
                    if (line.startsWith('###')) {
                      return <h4 key={idx} className="font-bold text-zinc-900 dark:text-white text-xs tracking-tight uppercase mt-3 mb-1">{line.replace('###', '').trim()}</h4>;
                    }
                    if (line.startsWith('-') || line.startsWith('*')) {
                      return (
                        <div key={idx} className="flex gap-2.5 items-start pl-2 min-w-0">
                          <span className="text-indigo-600 shrink-0 font-extrabold">•</span>
                          <span className="text-slate-600 dark:text-zinc-350">{line.substring(2).trim()}</span>
                        </div>
                      );
                    }
                    if (line.trim() === '') return <div key={idx} className="h-1" />;
                    return <p key={idx} className="text-slate-600 dark:text-zinc-300">{line}</p>;
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-400">No telemetry insights compiled yet.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-3 dark:border-zinc-800 min-w-0">
              {insightsText && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(insightsText);
                    showNotification("AI Insights copied to clipboard!", "success");
    logActivity(String("AI Insights copied to clipboard!"));
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:border-zinc-850 rounded-xl cursor-pointer shadow-sm"
                >
                  Copy Advice
                </button>
              )}
              <button
                onClick={() => setInsightsPromptOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-650 rounded-xl cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE Deep-link MODAL OVERLAY */}
      {shareLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in font-sans min-w-0">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-120 rounded-lg dark:bg-indigo-950/25 dark:text-indigo-400">
                  <Share2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-105 text-sm tracking-tight uppercase">Shareable Deep-Link Ready</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Anyone with this link can instantly load this exact workspace</p>
                </div>
              </div>
              <button
                onClick={() => setShareLink(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs font-sans">
              <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                The link below hosts a complete representation of your current dashboard canvas, including widget placements, colors, layout structures, and active category list filters:
              </p>
              
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 dark:bg-zinc-900/60 dark:border-zinc-800 min-w-0">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-transparent border-none outline-none font-mono text-[10px] text-slate-600 dark:text-zinc-300 overflow-ellipsis select-all min-w-0"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink).then(() => {
                      showNotification("Deep link copied to clipboard!", "success");
    logActivity(String("Deep link copied to clipboard!"));
                    });
                  }}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg dark:bg-zinc-850 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 inline-flex items-center justify-center cursor-pointer shrink-0 min-w-0"
                  title="Copy Link to Clipboard"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 pt-3 dark:border-zinc-800 min-w-0">
              <button
                onClick={() => setShareLink(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-505 dark:hover:bg-indigo-650 rounded-xl cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION GROUP CREATION OVERLAY */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in font-sans min-w-0">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-zinc-50 text-sm tracking-tight uppercase">
                {editingSectionId ? 'Configure Group Container' : 'Create Visual Section'}
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono text-[10px]">Title</label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Sales Metrics, Server Telemetry"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono text-[10px]">Description (Optional)</label>
                <input
                  type="text"
                  value={newSectionDesc}
                  onChange={(e) => setNewSectionDesc(e.target.value)}
                  placeholder="Briefly describe what this custom section groups together..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono text-[10px]">Select Components to Group</label>
                <p className="text-[10px] text-slate-400 font-mono">Assigned widgets will pack snugly inside this custom bordered panel group container card.</p>
                <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-zinc-800 rounded-xl p-2.5 bg-slate-50/50 dark:bg-zinc-950/20 space-y-1.5 custom-scrollbar">
                  {(currentPayload?.components || []).length === 0 ? (
                    <p className="text-center text-slate-400 py-3 font-mono">No widgets created yet</p>
                  ) : (
                    (currentPayload?.components || []).map((c) => {
                      const isSelected = selectedSectionComponentIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer text-slate-700 dark:text-zinc-200 select-none min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedSectionComponentIds(selectedSectionComponentIds.filter(id => id !== c.id));
                              } else {
                                setSelectedSectionComponentIds([...selectedSectionComponentIds, c.id]);
                              }
                            }}
                            className="h-3.5 w-3.5 accent-indigo-650 text-white"
                          />
                          <span>{c.title} <span className="text-[9px] text-slate-450 font-mono opacity-60">({c.type})</span></span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pb-1 text-xs font-sans min-w-0">
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="px-3.5 py-1.5 text-slate-550 hover:text-slate-850 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSection}
                disabled={!newSectionTitle.trim()}
                className="px-4 py-2 font-bold text-white bg-indigo-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-indigo-700 dark:bg-indigo-505 dark:hover:bg-indigo-600 rounded-xl cursor-pointer"
              >
                {editingSectionId ? 'Update Group' : 'Assemble Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE GALLERY OVERLAY */}
      {isTemplateGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs font-sans animate-fade-in min-w-0">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col justify-start overflow-hidden min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-lg text-slate-500 dark:text-zinc-400">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm tracking-tight uppercase">Dashboard Template Gallery</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Apply pre-configured JSON templates as a starting point</p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateGalleryOpen(false)}
                className="p-1 rounded-lg text-slate-450 hover:text-slate-650 dark:hover:text-zinc-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 custom-scrollbar text-xs leading-relaxed font-sans grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              {dashboardTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-50 hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-900 hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col gap-2 cursor-pointer group min-w-0"
                  onClick={() => applyTemplate(template.id)}
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="p-2 bg-white dark:bg-zinc-950 shadow-sm rounded-lg border border-slate-100 dark:border-zinc-800">
                      {template.icon}
                    </div>
                    <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply Template
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-100 mt-2">{template.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">{template.subtitle}</p>
                </div>
              ))}
              
              <div className="border border-slate-200 border-dashed dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 text-slate-400 dark:text-zinc-500 min-w-0">
                <Plus className="h-6 w-6 mb-1 opacity-50" />
                <h4 className="font-bold text-[12px]">More Templates Coming Soon</h4>
                <p className="text-[10px] max-w-[200px]">We're constantly adding new use-case templates to the registry.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file uploader collector */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportDashboard}
        accept=".json,.csv,.xlsx,.xls,.pdf,.docx"
        className="hidden"
      />
    </div>
  );
}
