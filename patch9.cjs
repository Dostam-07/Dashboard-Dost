
const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the problematic block which contains both the button and the panel render logic
// lines 2939 to 2970 approx.
const startMarker = '{/* PANEL C: RIGHT SIDEBAR - ASSISTANTS & CONVERSATIONS */}';
const endMarker = '{/* PANEL D: ... something else? ... */}'; // This is hard.
// Actually, I can just replace the block I know is there.

const searchString = `        {/* PANEL C: RIGHT SIDEBAR - ASSISTANTS & CONVERSATIONS */}
        {isQAPanelCollapsed && (
          <button 
            onClick={() => setIsQAPanelCollapsed(false)}
            className="fixed bottom-20 right-4 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        )}
        {!isQAPanelCollapsed && (
          <>
            <PanelResizeHandle className="w-1.5 bg-slate-200/50 hover:bg-indigo-500 dark:bg-zinc-900 dark:hover:bg-indigo-500 transition-colors cursor-col-resize shrink-0" />
            <Panel id="right-sidebar" defaultSize={20} collapsible={true} maxSize={40} minSize={15} className="bg-slate-50/70 dark:bg-[#09090c]/90 h-full overflow-hidden border-l border-slate-200 dark:border-zinc-900 transition-all flex flex-col">
              <div className="p-4 lg:p-5 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Panel</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setIsQAPanelCollapsed(true)} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                </div>
                <ConversationalPanel />
              </div>
            </Panel>
          </>
        )}`;

// I'll try to find the button block first and just remove it.
const buttonBlock = `        {isQAPanelCollapsed && (
          <button 
            onClick={() => setIsQAPanelCollapsed(false)}
            className="fixed bottom-20 right-4 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        )}`;

code = code.replace(buttonBlock, '');
fs.writeFileSync('src/App.tsx', code);
