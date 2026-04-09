import React from 'react';
import { LucideTrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import '../../styles/AnalyticsCard.less';

const AnalyticsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'primary',
  chartData,
  chartType,
  dataKey = 'value',
  avatars
}) => {
  // Read semantic colors directly from CSS variables to ensure perfect theme sync
  const chartColor = React.useMemo(() => {
    // We need to wait for the browser environment to read computed styles
    if (typeof window === 'undefined') return '#7c69ef'; // SSR Fallback
    
    const rootStyle = getComputedStyle(document.documentElement);
    let cssVar = '--primary-color';
    
    switch (color) {
      case 'success': cssVar = '--success-color'; break;
      case 'warning': cssVar = '--warning-color'; break;
      case 'error': cssVar = '--error-color'; break;
      case 'primary':
      default: cssVar = '--primary-color'; break;
    }
    
    // getPropertyValue returns a string that might have whitespace, so we trim it
    const val = rootStyle.getPropertyValue(cssVar).trim();
    return val || '#7c69ef'; // Fallback to raw hex if variable isn't found
  }, [color]);

  // Custom tooltips to avoid white-on-white text and cleanly display the name + value
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p>{`${label || payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!chartData || !chartType) return null;

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={chartData}>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={chartColor} 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 4, fill: chartColor, stroke: 'var(--background)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--primary-focus-rgba)' }} />
            <Bar dataKey={dataKey} fill={chartColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie') {
      const getCssColor = (varName) => {
        if (typeof window === 'undefined') return '';
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      };

      const COLORS = [
        chartColor, 
        getCssColor('--border-color'), 
        getCssColor('--warning-color'), 
        getCssColor('--success-color'), 
        getCssColor('--error-color')
      ];
      return (
        <div className="pie-chart-wrapper">
          <div className="pie-container">
            <ResponsiveContainer width="100%" height={60}>
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={28}
                  paddingAngle={2}
                  dataKey={dataKey}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-chart-legend">
            {chartData.map((entry, index) => {
              if (entry[dataKey] === 0) return null; // Hide empty brackets
              return (
                <div key={index} className="legend-item">
                  <div className="legend-color-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="legend-text">
                    {entry.name} Yrs: <strong>{entry[dataKey]}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`analytics-card ${chartData ? 'has-chart' : ''}`}>
      <div className="card-top">
        <div className="card-info">
          <p className="card-title">{title}</p>
          <h3 className="card-value">{value}</h3>
        </div>
        <div className={`card-icon-box ${color}`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      
      {chartData && (
        <div className="card-chart-container">
          {renderChart()}
        </div>
      )}

      {avatars && avatars.length > 0 && (
        <div className="avatar-stack-container">
          <div className="avatar-stack">
            {avatars.slice(0, 3).map((avatar, idx) => (
              <img 
                key={idx} 
                src={avatar} 
                alt="User avatar" 
                className="avatar-img"
              />
            ))}
            {avatars.length > 3 && (
              <div className="avatar-more">
                +{avatars.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {trend && (
        <div className="card-trend">
          <LucideTrendingUp size={12} className="trend-icon" />
          <span className="trend-text">{trendValue} from last month</span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;
