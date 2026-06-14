import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

// Dynamic check of active provider model
const getActiveProvider = () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey.trim() !== "") {
    return {
      provider: "gemini" as const,
      providerName: "Google Gemini (gemini-3.5-flash)",
      isConfigured: true
    };
  } else if (openRouterKey && openRouterKey !== "MY_OPENROUTER_API_KEY" && openRouterKey.trim() !== "") {
    return {
      provider: "openrouter" as const,
      providerName: "OpenRouter (Claude 3.5 Sonnet)",
      isConfigured: true
    };
  } else {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1";
    return {
      provider: "ollama" as const,
      providerName: `Ollama Local (${ollamaModel})`,
      isConfigured: !!process.env.OLLAMA_BASE_URL
    };
  }
};

const getGeminiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const getOpenRouterClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://ai.studio/build",
      "X-Title": "Dash-Dost Dashboard Builder",
    }
  });
};

const getOllamaClient = () => {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  return new OpenAI({
    apiKey: "ollama",
    baseURL: `${ollamaUrl}/v1`
  });
};

// Robust Gemini generation wrappers with automatic backoff retry and model fallback queue
async function callGeminiStreamWithFallback(
  ai: any,
  contents: any[],
  systemInstruction: string,
  temperature: number,
  initialModelPriorities: string[] = ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
) {
  let lastError: any = null;

  for (const model of initialModelPriorities) {
    let retries = 2; // Try up to 3 times per model
    let delay = 1000;
    while (retries >= 0) {
      try {
        console.log(`[Gemini Client] Attempting stream generation on model: ${model}`);
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            temperature,
          }
        });
        return stream; // Success! Return the stream
      } catch (error: any) {
        lastError = error;
        const errorString = String(error?.message || error || "").toLowerCase();
        const isTransient = errorString.includes("503") ||
                            errorString.includes("unavailable") ||
                            errorString.includes("high demand") ||
                            errorString.includes("temporary") ||
                            error?.status === 503 ||
                            error?.code === 503;

        const isRateLimit = errorString.includes("rate") ||
                            errorString.includes("limit") ||
                            errorString.includes("quota") ||
                            error?.status === 429 ||
                            error?.code === 429;


        if (isRateLimit) {
          console.warn(`[Gemini Fallback] Rate limit hit on model ${model}. Immediately trying next model...`);
          break;
        } else if (isTransient && retries > 0) {
          console.warn(`[Gemini Retry] Model ${model} returned transient error. Retrying in ${delay}ms... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.floor(delay * 1.5);
          retries--;
        } else {
          console.warn(`[Gemini Fallback] Model ${model} failed or retries exhausted. Error was: ${error?.message || error}. Trying next model in pool...`);
          break; // break retry loop, try next model candidate
        }
      }
    }
  }

  throw lastError || new Error("All candidate models failed to generate content.");
}

async function callGeminiContentWithFallback(
  ai: any,
  prompt: string,
  systemInstruction: string,
  temperature: number,
  initialModelPriorities: string[] = ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
) {
  let lastError: any = null;

  for (const model of initialModelPriorities) {
    let retries = 2;
    let delay = 1000;
    while (retries >= 0) {
      try {
        console.log(`[Gemini Client] Attempting text content generation on model: ${model}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature,
          }
        });
        return response; // Success!
      } catch (error: any) {
        lastError = error;
        const errorString = String(error?.message || error || "").toLowerCase();
        const isTransient = errorString.includes("503") ||
                            errorString.includes("unavailable") ||
                            errorString.includes("high demand") ||
                            errorString.includes("temporary") ||
                            error?.status === 503 ||
                            error?.code === 503;

        const isRateLimit = errorString.includes("rate") ||
                            errorString.includes("limit") ||
                            errorString.includes("quota") ||
                            error?.status === 429 ||
                            error?.code === 429;


        if (isRateLimit) {
          console.warn(`[Gemini Fallback] Rate limit hit on model ${model}. Immediately trying next model...`);
          break;
        } else if (isTransient && retries > 0) {
          console.warn(`[Gemini Retry] Model ${model} returned transient error. Retrying in ${delay}ms... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.floor(delay * 1.5);
          retries--;
        } else {
          console.warn(`[Gemini Fallback] Model ${model} failed or retries exhausted. Error was: ${error?.message || error}. Trying next model in pool...`);
          break;
        }
      }
    }
  }

  throw lastError || new Error("All candidate models failed to generate content.");
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    const active = getActiveProvider();
    res.json({ status: "healthy", provider: active.providerName, apiKeyConfigured: active.isConfigured });
  });

  // Streaming Content Generation proxy
  app.post("/api/generate", async (req, res) => {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const active = getActiveProvider();

    try {
      // Construct system instruction that strictly forces conformance to the visual layout JSON schema
      const systemInstruction = `You are a highly structured, precise analytical engineer acting as the visual layout compiler for Dash-Dost Dashboard Builder.

Your purpose is to interpret natural language data descriptions into a flawless JSON specification that fully conforms to the MasterDashboardPayloadSchema.

Core Operations Directives:
1. Output MUST be strictly valid, pure JSON. Do not write introductory sentences, markdown blocks wrapper syntax like \`\`\`json or \`\`\`, or any surrounding text that invalidates a parser engine. Your response must begin with { and end with }.
2. Data Realism: Generate contextually relevant, dense mock datasets within the "seriesData" array in each component.
   - For Saas dashboards, include fields like revenue, churn, users, date (format: "YYYY-MM-DD" e.g. "2026-06-01" to "2026-06-30"), category, etc.
   - For Marketing, include clicks, impressions, conversionRate, cost, platform, adGroup, date.
   - Ensure these field keys line up EXACTLY with config.xAxisKey and config.yAxisKeys for that component.
3. Progressive Intent Alignment: Distribute components intelligently across layouts using the 12-column layout object (sm:12, md:6, lg:4 or lg:3 for KPIs; sm:12, lg:6 or lg:12 for charts).
4. Responsive Layouts:
   - "layout" has properties sm, md, lg. These are column numbers out of 12.
   - For 'kpi_card' (KPI block): sm: 12, md: 6, lg: 3 is recommended.
   - For other charts: sm: 12, md: 12, lg: 6 or lg: 12 is recommended.
5. Interactive Filter Provisioning: Always include filters at the "filters" array level. Create target filters mapping to target keys fields (e.g. key "category" or "date").
   - Filter types are 'date_range' or 'category_select'.
   - 'targetKeys' is an array of data field strings inside component seriesData (e.g. ["category"] or ["date"]) that this filter will restrict.
   - If 'category_select' is used, provide standard filter options array of strings (e.g. ["North", "South", "East", "West"] or brands/categories). This option is critical for local interactive filtering.
6. Support different chart types: 'kpi_card', 'bar_chart', 'line_chart', 'area_chart', 'pie_chart', 'scatter_chart', 'map_chart', 'geo_map'.
   - 'kpi_card' config should have: "kpiValue": string format (e.g. "$12,450", "94.2%"), "kpiTrend": { "direction": "up" | "down" | "neutral", "label": "+12% MoM" }
   - 'bar_chart', 'line_chart', 'area_chart', 'scatter_chart', 'map_chart', 'geo_map' config should specify: "xAxisKey" (usually "date" or "category") and "yAxisKeys" (array of numerical field names to map e.g. ["revenue", "costs"]). Keep stacked: boolean optional.
   - For 'map_chart' and 'geo_map', default to realistically populated datasets representing Indian states (e.g. Maharashtra, Karnataka, Delhi, etc.) or World countries, NOT US states.
   - Include realistic generated seriesData in EACH component (an array of 10-24 object rows tracking coordinates/metrics, e.g. { "date": "2026-06-01", "revenue": 1000, "costs": 400, "category": "Enterprise" }).
7. Be responsive to iterative user requests if history is provided. Integrate the conversational history context when editing, refining, or appending to the current dashboard. However, if the user uploads a NEW dataset or asks for a NEW dashboard, generate a completely fresh dashboard and do NOT carry over previous components unless explicitly requested.`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        const contents: any[] = [];
        
        if (history && history.length > 0) {
          let lastAddedRole: string | null = null;
          history.forEach((msg: any) => {
            const role = msg.role === 'user' ? 'user' : 'model';
            if (role !== lastAddedRole) {
              contents.push({
                role,
                parts: [{ text: msg.content }]
              });
              lastAddedRole = role;
            } else if (contents.length > 0) {
              contents[contents.length - 1].parts[0].text += "\n\n" + msg.content;
            }
          });
          
          if (lastAddedRole !== 'user') {
            contents.push({
              role: 'user',
              parts: [{ text: prompt }]
            });
          } else {
            const lastText = contents[contents.length - 1].parts[0].text;
            if (lastText !== prompt && !lastText.endsWith(prompt)) {
              contents[contents.length - 1].parts[0].text = prompt;
            }
          }
        } else {
          contents.push({
            role: 'user',
            parts: [{ text: prompt }]
          });
        }

        const stream = await callGeminiStreamWithFallback(
          ai,
          contents,
          systemInstruction,
          0.1,
          ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
        );

        // Successfully acquired stream, now set headers
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            res.write(text);
          }
        }
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const messages: any[] = [
          { role: "system", content: systemInstruction }
        ];

        if (history && history.length > 0) {
          history.forEach((msg: any) => {
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          });
        }

        messages.push({ role: "user", content: prompt });

        const stream = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.1,
          stream: true,
        });

        // Set headers right before writing to stream
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            res.write(text);
          }
        }
      }
      res.end();
    } catch (error: any) {
      console.error(`Error generating content with ${active.providerName}:`, error);
      
      const errorString = String(error?.message || error || "");
      const is503 = errorString.includes("503") || 
                    errorString.toLowerCase().includes("unavailable") || 
                    errorString.toLowerCase().includes("high demand") || 
                    errorString.toLowerCase().includes("temporary") ||
                    error?.status === 503 ||
                    error?.code === 503;

        const isRateLimit = errorString.includes("rate") ||
                            errorString.includes("limit") ||
                            errorString.includes("quota") ||
                            error?.status === 429 ||
                            error?.code === 429;


      let friendlyMessage = error?.message || "Something went wrong while generating details. Check server connection.";
      if (is503) {
        friendlyMessage = "Google Gemini is currently experiencing temporary high demand (553 Unavailable). Please click an Idea Template above to use pre-compiled visual assets, or try clicking Send again in a few seconds!";
      }

      if (!res.headersSent) {
        res.status(503).json({ error: friendlyMessage });
      } else {
        res.write(`\n\n[ERROR: ${friendlyMessage}]`);
        res.end();
      }
    }
  });

  // AI Suggestion endpoint
  app.post("/api/suggest", async (req, res) => {
    const { payload } = req.body;
    if (!payload) return res.status(200).json(["Tell me about the main performance trends.", "What are the key KPIs for this dashboard?", "Summarize the data in 3 points."]);

    const active = getActiveProvider();
    if (active.provider !== "gemini") return res.status(200).json(["Tell me about the main performance trends.", "What are the key KPIs for this dashboard?", "Summarize the data in 3 points."]);

    try {
      const ai = getGeminiClient();
      const prompt = `Based on the dashboard titled "${payload.title}" with components: ${JSON.stringify(payload.components?.map((c: any) => c.title) || [])}, suggest 3 short and insightful questions a user could ask. Return ONLY a JSON array of 3 strings, nothing else.`;
      
      const response = await callGeminiContentWithFallback(
        ai,
        prompt,
        "You are a helpful assistant that suggests dashboard questions.",
        0.5,
        ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
      );

      const text = response.text || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(cleaned));
    } catch (e) {
      console.error("Suggestion error", e);
      res.status(200).json(["Tell me about the main performance trends.", "What are the key KPIs for this dashboard?", "Summarize the data in 3 points."]);
    }
  });

  function extractDashboardIntelligence(payload: any): string {
    if (!payload) return "";

    const title = payload.title || "Untitled Dashboard";
    const subtitle = payload.subtitle || "N/A";
    const ingestedUrl = payload.ingestedUrl || "N/A";
    const filters = payload.filters || [];
    const components = payload.components || [];

    let report = `DASHBOARD TITLE: ${title}
SUBTITLE: ${subtitle}
SOURCE INGESTED URL: ${ingestedUrl}

--------------------------------------------------
1. ACTIVE FILTERS DEFINED
--------------------------------------------------
${filters.length > 0 
  ? filters.map((f: any) => `- ID: ${f.id}, Label: "${f.label}", Type: "${f.type}", Targets: ${JSON.stringify(f.targetKeys)}`).join("\n")
  : "None"
}

--------------------------------------------------
2. KEY PERFORMANCE INDICATORS (KPIs)
--------------------------------------------------
`;

    const kpiCards = components.filter((c: any) => c.type === 'kpi_card');
    if (kpiCards.length > 0) {
      kpiCards.forEach((k: any, idx: number) => {
        const val = k.config?.kpiValue || k.kpiValue || "N/A";
        const trend = k.config?.kpiTrend ? `${k.config.kpiTrend.direction.toUpperCase()} (${k.config.kpiTrend.label})` : "None";
        report += `KPI #${idx + 1}:
  - Title: "${k.title}"
  - Value: ${val}
  - Description: ${k.description || "N/A"}
  - Trend Indicator: ${trend}
\n`;
      });
    } else {
      report += "No KPI cards found.\n";
    }

    report += `
--------------------------------------------------
3. CHART & TABLE DATASETS & AGGREGATIONS
--------------------------------------------------
`;

    components.forEach((comp: any, idx: number) => {
      const rawData = comp.seriesData || [];
      report += `Widget #${idx + 1} ["${comp.title}"]:
  - ID: ${comp.id}
  - Type: ${comp.type}
  - Description: ${comp.description || "N/A"}
  - Data Record Count: ${rawData.length} records.
`;

      if (rawData.length > 0) {
        const keys = Object.keys(rawData[0]);
        const numericKeys: string[] = [];
        const categoricalKeys: string[] = [];

        keys.forEach(k => {
          const hasNumbers = rawData.some((row: any) => typeof row[k] === 'number' || (typeof row[k] === 'string' && !isNaN(Number(row[k]))));
          const lowerKey = k.toLowerCase();
          if (hasNumbers && !lowerKey.includes('id') && !lowerKey.includes('code') && !lowerKey.includes('year') && !lowerKey.includes('month') && !lowerKey.includes('date')) {
            numericKeys.push(k);
          } else {
            categoricalKeys.push(k);
          }
        });

        report += `  - Dimensions Detected: ${JSON.stringify(categoricalKeys)}
  - Measures/Metrics Detected: ${JSON.stringify(numericKeys)}
`;

        const aggregations: Record<string, { sum: number, avg: number, min: number, max: number, count: number }> = {};
        numericKeys.forEach(mKey => {
          let sum = 0;
          let count = 0;
          let min = Infinity;
          let max = -Infinity;

          rawData.forEach((row: any) => {
            const val = Number(row[mKey]);
            if (!isNaN(val)) {
              sum += val;
              count++;
              if (val < min) min = val;
              if (val > max) max = val;
            }
          });

          if (count > 0) {
            aggregations[mKey] = {
              sum,
              avg: sum / count,
              min,
              max,
              count
            };
          }
        });

        if (Object.keys(aggregations).length > 0) {
          report += `  - Computed Aggregations:\n`;
          Object.entries(aggregations).forEach(([mKey, agg]) => {
            report += `    * Metric ["${mKey}"]: Sum={${agg.sum}}, Average={${agg.avg.toFixed(2)}}, Min={${agg.min}}, Max={${agg.max}} (based on {${agg.count}} rows)\n`;
          });
        }

        report += `  - Full Dataset Raw Array:\n${JSON.stringify(rawData)}\n`;

        categoricalKeys.forEach(catKey => {
          const grouping: Record<string, Record<string, number>> = {};
          rawData.forEach((row: any) => {
            const catVal = String(row[catKey] || "Unknown");
            if (!grouping[catVal]) grouping[catVal] = {};
            numericKeys.forEach(mKey => {
              const val = Number(row[mKey]);
              if (!isNaN(val)) {
                grouping[catVal][mKey] = (grouping[catVal][mKey] || 0) + val;
              }
            });
          });

          numericKeys.forEach(mKey => {
            const sortedGroups = Object.entries(grouping)
              .map(([catVal, vals]) => ({ category: catVal, value: vals[mKey] || 0 }))
              .sort((a, b) => b.value - a.value);

            if (sortedGroups.length > 0) {
              report += `  - Ranked Categories by Metric ["${mKey}"] over dimension ["${catKey}"]:\n`;
              sortedGroups.slice(0, 10).forEach((item, rIdx) => {
                report += `    Rank #${rIdx + 1}: Category "${item.category}" = ${item.value}\n`;
              });
            }
          });
        });

      } else {
        report += "  - No series data array provided.\n";
      }
      report += "\n";
    });

    report += `
--------------------------------------------------
4. SEMANTIC SUMMARIES & COMPUTED INSIGHTS CUES
--------------------------------------------------
`;

    let totalChallengesShared = 0;
    let highestParticipationDistrict = { name: "N/A", value: 0 };
    const districtParticipationMap: Record<string, number> = {};
    const villageAttendanceMap: Record<string, number> = {};
    
    components.forEach((comp: any) => {
      (comp.seriesData || []).forEach((row: any) => {
        Object.entries(row).forEach(([k, v]) => {
          const lowerK = k.toLowerCase();
          const val = Number(v);
          if (!isNaN(val)) {
            if (lowerK.includes('challenges') && (lowerK.includes('shared') || lowerK.includes('count') || lowerK.includes('total'))) {
              totalChallengesShared += val;
            }
            
            let isDistrictKey = false;
            let distName = "";
            Object.entries(row).forEach(([rk, rv]) => {
              const lowerRk = rk.toLowerCase();
              if (lowerRk === 'district' || lowerRk === 'region' || lowerRk === 'state' || lowerRk === 'cat' || lowerRk === 'category') {
                isDistrictKey = true;
                distName = String(rv);
              }
            });
            if (isDistrictKey && distName) {
              if (lowerK.includes('participation') || lowerK.includes('attendance') || lowerK.includes('users') || lowerK.includes('count') || lowerK.includes('value')) {
                districtParticipationMap[distName] = (districtParticipationMap[distName] || 0) + val;
              }
            }

            let isVillageKey = false;
            let villageName = "";
            Object.entries(row).forEach(([rk, rv]) => {
              const lowerRk = rk.toLowerCase();
              if (lowerRk === 'village' || lowerRk === 'block' || lowerRk === 'town') {
                isVillageKey = true;
                villageName = String(rv);
              }
            });
            if (isVillageKey && villageName) {
              if (lowerK.includes('attendance') || lowerK.includes('participants') || lowerK.includes('value') || lowerK.includes('count')) {
                villageAttendanceMap[villageName] = (villageAttendanceMap[villageName] || 0) + val;
              }
            }
          }
        });
      });
    });

    const sortedDistricts = Object.entries(districtParticipationMap).sort((a,b) => b[1] - a[1]);
    if (sortedDistricts.length > 0) {
      highestParticipationDistrict = { name: sortedDistricts[0][0], value: sortedDistricts[0][1] };
    }

    const sortedVillages = Object.entries(villageAttendanceMap).sort((a,b) => b[1] - a[1]);

    report += `- Total Extracted Challenges Shared: ${totalChallengesShared}
- Highest Participation District: "${highestParticipationDistrict.name}" with total ${highestParticipationDistrict.value}
- Ranked Districts Details: ${JSON.stringify(sortedDistricts)}
- Top Villages by Attendance: ${JSON.stringify(sortedVillages.slice(0, 10))}
==================================================
`;

    return report;
  }

  // General chat endpoint for conversational Q&A over ingested URLs and layouts
  app.post("/api/chat", async (req, res) => {
    const { prompt, history, url, payload } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const active = getActiveProvider();
    try {
      let payloadContext = "";
      if (payload) {
        payloadContext = extractDashboardIntelligence(payload);
      }

      const systemInstruction = `You are DostSight AI, an intelligent, production-grade AI-native BI workspaces data analyst and systems advisor. You have access to the Dashboard Intelligence Engine context of the user's active dashboard, calculated dynamically.

CRITICAL MENTALITIES & INSTRUCTIONS:
1. STRICT DATA GROUNDING: You must answer specific metrics, calculations, trends, or question queries using the actual dashboard values, records, aggregations, ranks, and dataset arrays provided in the "ACTIVE DASHBOARD DATA CONTEXT" below. Never use hypothetical, mocked, calculated guesses or domain assumptions.
2. IF LOGS/METRICS ARE MISSING OR UNAVAILABLE: If the user asks about a specific metric, area, or element that is not successfully ingested, is empty, is null, or is not in the data context, you MUST explicitly output: "The dashboard data for this metric was not ingested successfully." Do not invent excuses, generic explanations, or industry averages!
3. ANSWER SPECS:
   - For "How many challenges shared?": Look for categories and total / count metrics related to shared challenges in the data or KPI cards. Answer with the actual calculated sum or specific series totals, e.g., "The total number of challenges shared is X".
   - For "Which district has the highest participation?": Cross-reference participation or engagement against district categories in the parsed series data. Report the exact district name and its total engagement score.
   - For "What changed compared to last month?": Look at temporal time-series trends, monthly dates, area trends, or specified KPI trend directions. Speak in precise delta percentages or value changes.
   - For "Show top 5 villages by attendance.": Scan village categories or dimension groupings, sort by attendance values, and output a exact numbered listing of the top 5 villages, showing their specific counts.
4. INGESTION VERIFICATION: Never claim a dashboard is fully ingested unless all dashboard units (KPI cards, charts, datasets) are active. In your responses, confidently ground yourself on the parsed semantic context object provided.
5. SOURCE PATHWAYS & LOCATIONS:
   - At the end of every data-grounded answer, provide the precise location pathway formatted as: **Verification Location:** [Your constructed hierarchical path]
   - Identify relevant dashboard components by their ID and output sources tag at the very end: [SOURCES: widget_id_1, widget_id_2] (or [SOURCES: none])

${payloadContext ? `ACTIVE DASHBOARD DATA CONTEXT:\n${payloadContext}` : 'No active dashboard data loaded. Please ask the user to load or create a dashboard first.'}

Keep responses in beautiful, professional markdown. Speak as a Senior BI Architect and Expert Advisor. Use clean, high-contrast tables for complex tabular lists and metrics. Do not output raw JSON.`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        const contents: any[] = [];
        
        if (history && history.length > 0) {
          let lastAddedRole: string | null = null;
          history.forEach((msg: any) => {
            const role = msg.role === 'user' ? 'user' : 'model';
            if (role !== lastAddedRole) {
              contents.push({
                role,
                parts: [{ text: msg.content }]
              });
              lastAddedRole = role;
            } else if (contents.length > 0) {
              contents[contents.length - 1].parts[0].text += "\n\n" + msg.content;
            }
          });
          
          if (lastAddedRole !== 'user') {
            contents.push({
              role: 'user',
              parts: [{ text: prompt }]
            });
          } else {
            const lastText = contents[contents.length - 1].parts[0].text;
            if (lastText !== prompt && !lastText.endsWith(prompt)) {
              contents[contents.length - 1].parts[0].text = prompt;
            }
          }
        } else {
          contents.push({
            role: 'user',
            parts: [{ text: prompt }]
          });
        }

        const stream = await callGeminiStreamWithFallback(
          ai,
          contents,
          systemInstruction,
          0.3,
          ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
        );

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) res.write(text);
        }
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const messages: any[] = [{ role: "system", content: systemInstruction }];
        if (history && history.length > 0) {
          history.forEach((msg: any) => {
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          });
        }
        messages.push({ role: "user", content: prompt });

        const stream = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.3,
          stream: true,
        });

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) res.write(text);
        }
      }
      res.end();
    } catch (error: any) {
      console.error(`Error generating chat content with ${active.providerName}:`, error);
      if (!res.headersSent) {
        res.status(503).json({ error: error?.message || "Chat Generation Failed" });
      } else {
        res.write(`\n\n[ERROR: ${error?.message || "Generation Failed"}]`);
        res.end();
      }
    }
  });

  // AI Insights generation endpoint
  app.post("/api/insights", async (req, res) => {
    const { payload } = req.body;
    if (!payload) {
      return res.status(400).json({ error: "Dashboard payload is required" });
    }

    const active = getActiveProvider();

    try {
      const summaryContext = {
        title: payload.title,
        subtitle: payload.subtitle || "",
        components: (payload.components || []).map((c: any) => ({
          title: c.title,
          type: c.type,
          data: (c.seriesData || []).slice(0, 15)
        }))
      };

      const systemInstruction = "You are a professional business intelligence advisor and expert data analyst. Generate short, clear, highly structured and valuable summaries and actionable recommendation items.";
      const prompt = `Given this active dashboard: ${JSON.stringify(summaryContext)}. Please write a brief, elegant analytical executive summary (max 3 sentences) and exactly 3 high-impact actionable business recommendations (bullet points). Keep layout professional and easy to scan using standard Markdown.`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        const response = await callGeminiContentWithFallback(
          ai,
          prompt,
          systemInstruction,
          0.2,
          ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
        );

        res.json({ insights: response.text || "" });
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
        });

        res.json({ insights: response.choices[0]?.message?.content || "" });
      }
    } catch (error: any) {
      console.error(`Insights Generation Error with ${active.providerName}:`, error);

      const errorString = String(error?.message || error || "");
      const is503 = errorString.includes("503") || 
                    errorString.toLowerCase().includes("unavailable") || 
                    errorString.toLowerCase().includes("high demand") || 
                    errorString.toLowerCase().includes("temporary") ||
                    error?.status === 503 ||
                    error?.code === 503;

        const isRateLimit = errorString.includes("rate") ||
                            errorString.includes("limit") ||
                            errorString.includes("quota") ||
                            error?.status === 429 ||
                            error?.code === 429;


      let friendlyMessage = error?.message || "Insights Generation Failed";
      if (is503) {
        friendlyMessage = "Google Gemini is currently experiencing temporary high demand. Failed to generate live insights at this moment.";
      }

      res.status(503).json({ error: friendlyMessage });
    }
  });

  // Vite Integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${isProd ? "production" : "development"} mode.`);
  });
}

startServer();
