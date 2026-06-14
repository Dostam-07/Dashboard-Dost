const fs = require('fs');
let code = fs.readFileSync('src/components/ChartWrapper.tsx', 'utf8');

const heatmapCase = `
      case 'heatmap': {
        const columns = yAxisKeys.length ? yAxisKeys : Object.keys(data[0] || {}).filter(k => k !== xAxisKey && typeof data[0][k] === 'number');
        let maxVal = -Infinity;
        let minVal = Infinity;
        data.forEach(d => columns.forEach(c => {
           if(typeof d[c] === 'number') {
             if(d[c] > maxVal) maxVal = d[c];
             if(d[c] < minVal) minVal = d[c];
           }
        }));
        
        const getColor = (val) => {
           if(typeof val !== 'number') return 'transparent';
           const ratio = (maxVal - minVal) === 0 ? 0.5 : (val - minVal) / (maxVal - minVal);
           return \`hsla(\${220 - (ratio * 220)}, 70%, 55%, 0.85)\`;
        };

        return (
          <div className={\`\${isFullscreen ? 'flex-1 h-[65vh] sm:h-[75vh]' : 'h-64 sm:h-72'} w-full mt-4 flex flex-col overflow-auto custom-scrollbar\`}>
            <div className="flex w-full min-h-[24px] mb-1">
              <div className="w-20 shrink-0" />
              {columns.map(c => (
                 <div key={c} className="flex-1 text-center text-[9px] font-bold text-slate-500 truncate px-1 flex items-center justify-center break-all" title={c}>{c}</div>
              ))}
            </div>
            {data.map((row, i) => (
              <div key={i} className="flex w-full flex-1 mb-1 min-h-[24px]">
                 <div className="w-20 shrink-0 flex items-center justify-end text-[9px] font-bold text-slate-500 truncate pr-3" title={row[xAxisKey]}>
                   {row[xAxisKey]}
                 </div>
                 {columns.map(c => (
                   <div key={c} className="flex-1 flex items-center justify-center m-[1px] rounded-[3px] relative group transition-transform hover:scale-[1.05] hover:z-10 shadow-sm cursor-crosshair" style={{ backgroundColor: getColor(row[c]) }}>
                      <span className="text-[9px] text-white opacity-0 group-hover:opacity-100 font-bold drop-shadow-md z-10 pointer-events-none select-none">
                        {typeof row[c] === 'number' ? row[c].toFixed(1) : ''}
                      </span>
                   </div>
                 ))}
              </div>
            ))}
          </div>
        );
      }
`;

code = code.replace(/      default:\n        return null;/, heatmapCase + "\n      default:\n        return null;");
fs.writeFileSync('src/components/ChartWrapper.tsx', code);
