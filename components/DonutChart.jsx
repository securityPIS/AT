// Donut/pie chart sederhana berbasis SVG untuk ringkasan jumlah subtask
// di Dashboard. Menerima data: [{ label, value, color }].
const DonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent) => { const x = Math.cos(2 * Math.PI * percent); const y = Math.sin(2 * Math.PI * percent); return [x, y]; };

  if (total === 0) return <div className="flex items-center justify-center h-48 w-48 rounded-full border-4 border-slate-100"><span className="text-slate-400 text-xs">No Data</span></div>;

  return (
    <div className="relative w-48 h-48">
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full">
        {data.map((slice, index) => {
          if (slice.value === 0) return null;
          const startPercent = cumulativePercent; const slicePercent = slice.value / total; cumulativePercent += slicePercent; const endPercent = cumulativePercent;
          const [startX, startY] = getCoordinatesForPercent(startPercent); const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
          const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
          return <path key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.05" />;
        })}
        <circle cx="0" cy="0" r="0.6" fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-2xl font-bold text-slate-800">{total}</span><span className="text-xs text-slate-500">Subtasks</span></div>
    </div>
  );
};

export default DonutChart;
