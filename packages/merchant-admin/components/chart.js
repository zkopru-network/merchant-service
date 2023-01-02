import {
  Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2548E4', '#F6641C'];

function Chart(props) {
  const {
    title, data, xAxisKey, yAxisKeys, xAxisFormatter, yAxisFormatter, yAxisLabels = [], loading, height, className,
  } = props;

  if (loading) {
    return <div className="section section--loading w-100" />;
  }

  return (
    <div className={`section h-100 ${className} p-4`}>

      <div className="section__subtitle">
        {title}
      </div>

      <ResponsiveContainer minHeight={height}>
        <ComposedChart
          data={data}
          margin={{
            top: 5, right: 5, left: -15, bottom: 0,
          }}
        >
          <XAxis dataKey={xAxisKey} tickFormatter={xAxisFormatter} />
          <YAxis tickFormatter={yAxisFormatter} domain={['auto', 'auto']} />
          <Tooltip labelFormatter={xAxisFormatter} formatter={yAxisFormatter} />

          {yAxisKeys.map((yAxisKey, i) => (
            <Line
              key={yAxisKey}
              name={yAxisLabels[i] || yAxisKey}
              type="monotone"
              strokeLinecap="round"
              strokeWidth={3}
              dataKey={yAxisKey}
              stroke={COLORS[i]}
              legendType="none"
            />
          ))}

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Chart;
