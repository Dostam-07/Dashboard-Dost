import { MasterDashboardPayload } from '../types';

export const chaupalInsightsSeed: MasterDashboardPayload = {
  dashboardId: "chaupal-insights-default",
  title: "Chaupal Insights",
  subtitle: "Community Engagement & Impact Analytics Dashboard",
  tabOrder: ["Overview", "178-Chaupal Insights", "Participation", "Challenges & Resolution", "Impact", "Feedback", "Demographics"],
  filters: [
    {
      id: "district",
      type: "category_select",
      targetKeys: ["District", "district"],
      label: "District",
      options: ["All", "Jaipur", "Alwar", "Dausa", "Tonk", "Karauli", "Sikar", "Bharatpur"]
    },
    {
      id: "location",
      type: "category_select",
      targetKeys: ["Village", "location"],
      label: "Location",
      options: ["All", "Ramsinghpura", "Bhankrota", "Malpura", "Govindpura", "Dausa Kalan"]
    },
    {
      id: "session_type",
      type: "category_select",
      targetKeys: ["SessionType", "sessionType"],
      label: "Session Type",
      options: ["All", "Agriculture", "Health", "Education", "Infrastructure", "Livelihood"]
    }
  ],
  components: [
    // KPIs
    {
      id: "kpi-chaupals",
      type: "kpi_card",
      title: "Total Chaupals",
      layout: { sm: 12, md: 6, lg: 2 },
      tab: "178-Chaupal Insights",
      config: {
        kpiValue: "189",
        kpiTrend: {
          direction: "up",
          label: "12.4% vs last 30 days"
        },
        colors: ["#10b981"] // green
      },
      seriesData: [{ value: 189 }]
    },
    {
      id: "kpi-participants",
      type: "kpi_card",
      title: "Total Participants",
      layout: { sm: 12, md: 6, lg: 2 },
      tab: "178-Chaupal Insights",
      config: {
        kpiValue: "5,743",
        kpiTrend: {
          direction: "up",
          label: "18.7% vs last 30 days"
        },
        colors: ["#3b82f6"] // blue
      },
      seriesData: [{ value: 5743 }]
    },
    {
      id: "kpi-challenges-shared",
      type: "kpi_card",
      title: "Challenges Shared",
      layout: { sm: 12, md: 6, lg: 2 },
      tab: "178-Chaupal Insights",
      config: {
        kpiValue: "312",
        kpiTrend: {
          direction: "up",
          label: "9.2% vs last 30 days"
        },
        colors: ["#a855f7"] // purple
      },
      seriesData: [{ value: 312 }]
    },
    {
      id: "kpi-challenges-resolved",
      type: "kpi_card",
      title: "Challenges Resolved",
      layout: { sm: 12, md: 6, lg: 2 },
      tab: "178-Chaupal Insights",
      config: {
        kpiValue: "201",
        kpiTrend: {
          direction: "up",
          label: "23.5% vs last 30 days"
        },
        colors: ["#10b981"] // green
      },
      seriesData: [{ value: 201 }]
    },
    {
      id: "kpi-resolution-rate",
      type: "kpi_card",
      title: "Resolution Rate",
      layout: { sm: 12, md: 6, lg: 2 },
      tab: "178-Chaupal Insights",
      config: {
        kpiValue: "64.4%",
        kpiTrend: {
          direction: "up",
          label: "8.6% vs last 30 days"
        },
        colors: ["#f97316"] // orange
      },
      seriesData: [{ value: 64.4 }]
    },

    // First main row of charts
    {
      id: "chart-chaupals-over-time",
      type: "area_chart",
      title: "Chaupals Over Time",
      description: "Monthly trends representing sessions and participant footfalls",
      layout: { sm: 12, md: 12, lg: 4 },
      tab: "178-Chaupal Insights",
      config: {
        xAxisKey: "month",
        yAxisKeys: ["Chaupals Conducted", "Participants"],
        seriesColors: {
          "Chaupals Conducted": "#a855f7",
          "Participants": "#3b82f6"
        }
      },
      seriesData: [
        { month: "Apr '24", "Chaupals Conducted": 25, "Participants": 450 },
        { month: "Jun '24", "Chaupals Conducted": 48, "Participants": 720 },
        { month: "Aug '24", "Chaupals Conducted": 35, "Participants": 610 },
        { month: "Oct '24", "Chaupals Conducted": 65, "Participants": 1150 },
        { month: "Dec '24", "Chaupals Conducted": 82, "Participants": 1520 },
        { month: "Feb '25", "Chaupals Conducted": 70, "Participants": 1390 },
        { month: "Apr '25", "Chaupals Conducted": 92, "Participants": 1780 }
      ]
    },
    {
      id: "chart-chaupals-by-district",
      type: "bar_chart",
      title: "Chaupals by District",
      layout: { sm: 12, md: 6, lg: 4 },
      tab: "178-Chaupal Insights",
      config: {
        xAxisKey: "district",
        yAxisKeys: ["count"],
        seriesColors: {
          "count": "#a855f7"
        }
      },
      seriesData: [
        { district: "Jaipur", "count": 78, District: "Jaipur" },
        { district: "Alwar", "count": 32, District: "Alwar" },
        { district: "Dausa", "count": 24, District: "Dausa" },
        { district: "Tonk", "count": 20, District: "Tonk" },
        { district: "Karauli", "count": 15, District: "Karauli" },
        { district: "Sikar", "count": 10, District: "Sikar" },
        { district: "Bharatpur", "count": 10, District: "Bharatpur" }
      ]
    },
    {
      id: "chart-district-map",
      type: "geo_map",
      title: "Chaupals by District (Map)",
      layout: { sm: 12, md: 6, lg: 4 },
      tab: "178-Chaupal Insights",
      config: {
        xAxisKey: "district",
        yAxisKeys: ["count"],
        mapType: "india"
      },
      seriesData: [
        { state: "Rajasthan", "count": 189, "id": "IND.RJ", district: "Rajasthan" },
        { state: "Maharashtra", "count": 45, "id": "IND.MH", district: "Maharashtra" },
        { state: "Gujarat", "count": 22, "id": "IND.GJ", district: "Gujarat" }
      ]
    },

    // Category donut
    {
      id: "chart-challenges-by-category",
      type: "pie_chart",
      title: "Challenges by Category",
      layout: { sm: 12, md: 6, lg: 4 },
      tab: "178-Chaupal Insights",
      config: {
        xAxisKey: "category",
        yAxisKeys: ["count"]
      },
      seriesData: [
        { category: "Water Scarcity", count: 78 },
        { category: "Agriculture", count: 65 },
        { category: "Infrastructure", count: 52 },
        { category: "Livelihood", count: 46 },
        { category: "Education", count: 38 },
        { category: "Health", count: 33 }
      ]
    },

    // Status ring donut
    {
      id: "chart-challenges-status",
      type: "pie_chart",
      title: "Challenges Status",
      layout: { sm: 12, md: 6, lg: 4 },
      tab: "178-Chaupal Insights",
      config: {
        xAxisKey: "status",
        yAxisKeys: ["count"],
        colors: ["#10b981", "#ef4444"]
      },
      seriesData: [
        { status: "Resolved", count: 201 },
        { status: "Pending", count: 111 }
      ]
    }
  ]
};

// Static dataset representing Recent Chaupal Sessions
export const recentChaupalSessions = [
  { date: "28 Apr 2025", village: "Ramsinghpura", district: "Jaipur", sessionType: "Agriculture", participants: 215, challengesShared: 12, status: "Completed" },
  { date: "27 Apr 2025", village: "Bhankrota", district: "Jaipur", sessionType: "Health", participants: 198, challengesShared: 8, status: "Completed" },
  { date: "26 Apr 2025", village: "Malpura", district: "Tonk", sessionType: "Education", participants: 176, challengesShared: 10, status: "Completed" },
  { date: "25 Apr 2025", village: "Govindpura", district: "Alwar", sessionType: "Infrastructure", participants: 162, challengesShared: 7, status: "Completed" },
  { date: "24 Apr 2025", village: "Dausa Kalan", district: "Dausa", sessionType: "Livelihood", participants: 158, challengesShared: 9, status: "Completed" }
];
