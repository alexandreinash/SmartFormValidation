import React, { useState, useMemo } from 'react';
import '../css/DataDashboard.css';

function DataDashboard() {
  const [dateRange, setDateRange] = useState('This Week');
  const [servicesFilter, setServicesFilter] = useState('All');
  const [postsFilter, setPostsFilter] = useState('All');

  // Mock data matching the image specifications
  const ebitdaData = useMemo(() => {
    // Generate 30 data points matching the image trend
    const data = [];
    const baseValues = [
      2500, 2400, 2300, 2100, 2000, 2200, 2500, 2800, 3000, 3200,
      3300, 3250, 3100, 2900, 2700, 2500, 2300, 2100, 1800, 1600,
      1500, 1600, 1700, 1900, 2100, 2200, 2150, 2200, 2250, 2200
    ];
    
    for (let i = 0; i < 30; i++) {
      const total = baseValues[i] || 2200;
      const brownValue = total * 0.6; // Brown area (bottom)
      const greenValue = total * 0.4; // Green area (top)
      data.push({
        day: i + 1,
        brown: brownValue,
        green: greenValue,
        total: total,
        redLine: brownValue // Red line follows brown area top
      });
    }
    return data;
  }, []);

  const netProfitMarginData = [6, 9, 12, 9, 4, 6]; // Bar chart values
  const debtToEquityData = [
    { blue: 5, red: 2 },
    { blue: 7, red: 3 },
    { blue: 4, red: 2 },
    { blue: 2, red: 1 },
    { blue: 4, red: 1 },
    { blue: 5, red: 2 }
  ];

  // Calculate chart dimensions and scales
  const chartHeight = 200;
  const chartWidth = 800;
  const maxEbitda = Math.max(...ebitdaData.map(d => d.total));
  const maxBarValue = Math.max(...netProfitMarginData, ...debtToEquityData.map(d => d.blue + d.red));

  // Generate EBITDA area chart paths
  const generateEbitdaPaths = () => {
    const points = ebitdaData.map((d, i) => ({
      x: (i / (ebitdaData.length - 1)) * chartWidth,
      brownY: chartHeight - (d.brown / maxEbitda) * chartHeight * 0.8,
      totalY: chartHeight - (d.total / maxEbitda) * chartHeight * 0.8,
      redLineY: chartHeight - (d.redLine / maxEbitda) * chartHeight * 0.8
    }));

    // Brown area path
    const brownPath = `M ${points[0].x},${chartHeight} L ${points.map(p => `${p.x},${p.brownY}`).join(' L ')} L ${points[points.length - 1].x},${chartHeight} Z`;
    
    // Green area path (stacked on brown)
    const greenPath = `M ${points[0].x},${points[0].brownY} L ${points.map(p => `${p.x},${p.brownY}`).join(' L ')} L ${points.map(p => `${p.x},${p.totalY}`).reverse().join(' L ')} Z`;
    
    // Red line path (follows brown top)
    const redLinePath = `M ${points.map(p => `${p.x},${p.redLineY}`).join(' L ')}`;

    return { brownPath, greenPath, redLinePath };
  };

  const { brownPath, greenPath, redLinePath } = generateEbitdaPaths();

  return (
    <div className="data-dashboard-container">
      {/* Header */}
      <div className="data-dashboard-header">
        <h1 className="data-dashboard-title">Data Dashboard</h1>
        <div className="data-dashboard-filters">
          <div className="data-dashboard-filter-group">
            <label className="data-dashboard-filter-label">Auto date range</label>
            <select 
              className="data-dashboard-filter"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div className="data-dashboard-filter-group">
            <label className="data-dashboard-filter-label">Services</label>
            <select 
              className="data-dashboard-filter"
              value={servicesFilter}
              onChange={(e) => setServicesFilter(e.target.value)}
            >
              <option>All</option>
              <option>Service A</option>
              <option>Service B</option>
            </select>
          </div>
          <div className="data-dashboard-filter-group">
            <label className="data-dashboard-filter-label">Posts</label>
            <select 
              className="data-dashboard-filter"
              value={postsFilter}
              onChange={(e) => setPostsFilter(e.target.value)}
            >
              <option>All</option>
              <option>Post Type 1</option>
              <option>Post Type 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main EBITDA Chart */}
      <div className="data-dashboard-ebitda-card">
        <h2 className="data-dashboard-chart-title">
          Earnings Before Interest, Taxes, Depreciation, and Amortization (EBITDA)
        </h2>
        <div className="data-dashboard-ebitda-chart">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`} className="data-dashboard-ebitda-svg">
            {/* Y-axis labels */}
            {[0, 1000, 2000, 3000, 4000].map((value, i) => (
              <text
                key={value}
                x="10"
                y={chartHeight - (value / maxEbitda) * chartHeight * 0.8 + 5}
                className="data-dashboard-y-axis-label"
              >
                {value.toLocaleString()}
              </text>
            ))}

            {/* Grid lines */}
            {[0, 1000, 2000, 3000, 4000].map((value) => (
              <line
                key={value}
                x1="40"
                y1={chartHeight - (value / maxEbitda) * chartHeight * 0.8}
                x2={chartWidth}
                y2={chartHeight - (value / maxEbitda) * chartHeight * 0.8}
                className="data-dashboard-grid-line"
              />
            ))}

            {/* Brown area */}
            <path
              d={brownPath}
              fill="#8B4513"
              opacity="0.7"
              className="data-dashboard-area"
            />
            
            {/* Green area (stacked) */}
            <path
              d={greenPath}
              fill="#90EE90"
              opacity="0.6"
              className="data-dashboard-area"
            />

            {/* Red line */}
            <path
              d={redLinePath}
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              className="data-dashboard-red-line"
            />

            {/* X-axis labels */}
            {ebitdaData.filter((_, i) => i % 5 === 0 || i === ebitdaData.length - 1).map((d, idx) => {
              const x = (d.day / 30) * chartWidth;
              return (
                <text
                  key={d.day}
                  x={x + 40}
                  y={chartHeight + 25}
                  className="data-dashboard-x-axis-label"
                  textAnchor="middle"
                >
                  {d.day}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Metrics Cards Row 1 */}
      <div className="data-dashboard-metrics-row">
        {/* Net Profit Margin - Bar Chart */}
        <div className="data-dashboard-metric-card data-dashboard-chart-card">
          <h3 className="data-dashboard-metric-title">Net Profit Margin</h3>
          <div className="data-dashboard-bar-chart">
            <svg viewBox="0 0 300 180" className="data-dashboard-bar-chart-svg">
              {/* Y-axis */}
              {[0, 3, 6, 9, 12].map((value) => (
                <g key={value}>
                  <line
                    x1="30"
                    y1={150 - (value / 12) * 120}
                    x2="280"
                    y2={150 - (value / 12) * 120}
                    className="data-dashboard-grid-line"
                  />
                  <text
                    x="25"
                    y={150 - (value / 12) * 120 + 5}
                    className="data-dashboard-bar-y-label"
                    textAnchor="end"
                  >
                    {value}
                  </text>
                </g>
              ))}
              
              {/* Bars */}
              {netProfitMarginData.map((value, i) => {
                const barWidth = 35;
                const barX = 40 + i * 45;
                const barHeight = (value / 12) * 120;
                return (
                  <rect
                    key={i}
                    x={barX}
                    y={150 - barHeight}
                    width={barWidth}
                    height={barHeight}
                    fill="#3B82F6"
                    className="data-dashboard-bar"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Debt-to-Equity Ratio - Stacked Bar Chart */}
        <div className="data-dashboard-metric-card data-dashboard-chart-card">
          <h3 className="data-dashboard-metric-title">Debt-to-Equity Ratio</h3>
          <div className="data-dashboard-bar-chart">
            <svg viewBox="0 0 300 180" className="data-dashboard-bar-chart-svg">
              {/* Y-axis */}
              {[0, 3, 6, 9, 12].map((value) => (
                <g key={value}>
                  <line
                    x1="30"
                    y1={150 - (value / 12) * 120}
                    x2="280"
                    y2={150 - (value / 12) * 120}
                    className="data-dashboard-grid-line"
                  />
                  <text
                    x="25"
                    y={150 - (value / 12) * 120 + 5}
                    className="data-dashboard-bar-y-label"
                    textAnchor="end"
                  >
                    {value}
                  </text>
                </g>
              ))}
              
              {/* Stacked Bars */}
              {debtToEquityData.map((data, i) => {
                const barWidth = 35;
                const barX = 40 + i * 45;
                const blueHeight = (data.blue / 12) * 120;
                const redHeight = (data.red / 12) * 120;
                return (
                  <g key={i}>
                    <rect
                      x={barX}
                      y={150 - blueHeight - redHeight}
                      width={barWidth}
                      height={blueHeight}
                      fill="#3B82F6"
                      className="data-dashboard-bar"
                    />
                    <rect
                      x={barX}
                      y={150 - redHeight}
                      width={barWidth}
                      height={redHeight}
                      fill="#EF4444"
                      className="data-dashboard-bar"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Revenue - Key Metric Card */}
        <div className="data-dashboard-metric-card data-dashboard-kpi-card">
          <h3 className="data-dashboard-metric-title">Revenue</h3>
          <div className="data-dashboard-kpi-value">$24.5</div>
          <div className="data-dashboard-kpi-change data-dashboard-kpi-change-positive">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 4L12 8H9V12H7V8H4L8 4Z" fill="#10B981"/>
            </svg>
            <span>13%</span>
          </div>
          <div className="data-dashboard-kpi-label">vs previous 7 days</div>
        </div>
      </div>

      {/* Metrics Cards Row 2 */}
      <div className="data-dashboard-metrics-row">
        {/* ROI - Key Metric Card */}
        <div className="data-dashboard-metric-card data-dashboard-kpi-card">
          <h3 className="data-dashboard-metric-title">Return On Investment (ROI)</h3>
          <div className="data-dashboard-kpi-value">19.1%</div>
          <div className="data-dashboard-kpi-compare">8%</div>
          <div className="data-dashboard-kpi-label">vs previous 7 days</div>
        </div>

        {/* Avg Profit Margin - Key Metric Card */}
        <div className="data-dashboard-metric-card data-dashboard-kpi-card">
          <h3 className="data-dashboard-metric-title">Avg Profit Margin</h3>
          <div className="data-dashboard-kpi-value">9.5%</div>
          <div className="data-dashboard-kpi-change data-dashboard-kpi-change-positive">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 4L12 8H9V12H7V8H4L8 4Z" fill="#10B981"/>
            </svg>
            <span>1</span>
          </div>
          <div className="data-dashboard-kpi-label">vs previous 7 days</div>
        </div>

        {/* CLV - Key Metric Card */}
        <div className="data-dashboard-metric-card data-dashboard-kpi-card">
          <h3 className="data-dashboard-metric-title">CLV (Customer Lifetime Value)</h3>
          <div className="data-dashboard-kpi-value">$2,176</div>
          <div className="data-dashboard-kpi-change data-dashboard-kpi-change-positive">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 4L12 8H9V12H7V8H4L8 4Z" fill="#10B981"/>
            </svg>
            <span>2.3%</span>
          </div>
          <div className="data-dashboard-kpi-label">vs previous 7 days</div>
        </div>
      </div>
    </div>
  );
}

export default DataDashboard;

