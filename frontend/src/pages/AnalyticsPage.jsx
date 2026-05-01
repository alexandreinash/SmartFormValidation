import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/AdminDashboard.css';

const ANALYTICS_CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatChartPercent(value) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function wrapChartLabel(label, maxCharsPerLine = 12, maxLines = 2) {
  const normalized = String(label || 'Untitled Form').trim();
  if (!normalized) {
    return ['Untitled Form'];
  }

  if (normalized.length <= maxCharsPerLine) {
    return [normalized];
  }

  const words = normalized.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxCharsPerLine) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
    if (lines.length === maxLines - 1) {
      break;
    }
  }

  const consumed = lines.join(' ').trim();
  const remainder = consumed ? normalized.slice(consumed.length).trim() : normalized;
  const finalLine = remainder || currentLine;
  lines.push(
    finalLine.length > maxCharsPerLine
      ? `${finalLine.slice(0, Math.max(1, maxCharsPerLine - 1))}...`
      : finalLine
  );

  return lines.slice(0, maxLines);
}

function AnalyticsPage() {
  const { user, authReady } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    loadAnalytics();
  }, [authReady, user, navigate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/analytics');
      setAnalytics(res.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load analytics data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate additional metrics
  const calculatedMetrics = useMemo(() => {
    if (!analytics) return null;

    const totalSubmissions = analytics.overview.totalSubmissions || 0;
    const totalUsers = analytics.overview.totalUsers || 0;
    const totalForms = analytics.overview.totalForms || 0;
    const aiFlags = analytics.aiValidation 
      ? (analytics.aiValidation.sentimentFlagged || 0) + (analytics.aiValidation.entityFlagged || 0)
      : 0;

    return {
      submissionsPerUser: totalUsers > 0 ? (totalSubmissions / totalUsers).toFixed(1) : '0',
      submissionsPerForm: totalForms > 0 ? (totalSubmissions / totalForms).toFixed(1) : '0',
      aiFlagRate: totalSubmissions > 0 ? ((aiFlags / totalSubmissions) * 100).toFixed(2) : '0',
      avgSubmissionsPerDay: analytics.submissionsOverTime?.length > 0
        ? (totalSubmissions / analytics.submissionsOverTime.length).toFixed(1)
        : '0',
    };
  }, [analytics]);

  // Prepare data for donut chart
  const donutChartData = useMemo(() => {
    if (!analytics?.topForms || analytics.topForms.length === 0) return null;
    
    const top5Forms = analytics.topForms.slice(0, 5);
    const total = top5Forms.reduce((sum, form) => sum + form.submissionCount, 0);
    if (total === 0) return null;

    let cumulativePercent = 0;
    return top5Forms.map((form, index) => {
      const percent = (form.submissionCount / total) * 100;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      
      return {
        ...form,
        percent: Number(percent.toFixed(1)),
        startPercent,
        endPercent: cumulativePercent,
        color: ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length],
      };
    });
  }, [analytics]);

  // Vertical Bar Chart Data - Top Forms by Submissions (using same colors as donut chart)
  const verticalBarChartData = useMemo(() => {
    if (!donutChartData || donutChartData.length === 0) return [];
    
    // Use the same forms and colors as the donut chart
    const total = donutChartData.reduce((sum, form) => sum + form.submissionCount, 0);
    if (total === 0) return [];

    return donutChartData.map((form) => {
      const percent = (form.submissionCount / total) * 100;
      return {
        formTitle: form.formTitle,
        submissionCount: form.submissionCount,
        percent: Math.round(percent * 10) / 10,
        color: form.color,
        formId: form.formId,
      };
    });
  }, [donutChartData]);

  const totalTopFormSubmissions = useMemo(
    () => donutChartData?.reduce((sum, form) => sum + form.submissionCount, 0) || 0,
    [donutChartData]
  );

  const comparisonChartLayout = useMemo(() => {
    if (!verticalBarChartData.length) {
      return null;
    }

    const chartHeight = 310;
    const chartWidth = Math.max(540, verticalBarChartData.length * 118);
    const topMargin = 28;
    const bottomMargin = 88;
    const leftMargin = 58;
    const rightMargin = 22;
    const chartAreaWidth = chartWidth - leftMargin - rightMargin;
    const chartAreaHeight = chartHeight - topMargin - bottomMargin;
    const maxValue = Math.max(...verticalBarChartData.map((form) => form.percent), 0);
    const roundedMax = Math.max(10, Math.ceil(maxValue / 5) * 5);
    const tickStep = Math.max(5, Math.ceil((roundedMax / 4) / 5) * 5);
    const yTicks = [];

    for (let value = tickStep; value <= roundedMax; value += tickStep) {
      yTicks.push(value);
    }

    const barSpacing = chartAreaWidth / verticalBarChartData.length;
    const barWidth = Math.min(78, Math.max(48, barSpacing * 0.62));
    const labelCharLimit = Math.max(10, Math.floor(barSpacing / 7));

    return {
      chartHeight,
      chartWidth,
      chartAreaWidth,
      chartAreaHeight,
      topMargin,
      bottomMargin,
      leftMargin,
      rightMargin,
      maxPercent: roundedMax,
      yTicks,
      barSpacing,
      barWidth,
      labelCharLimit,
    };
  }, [verticalBarChartData]);

  if (!authReady) {
    return (
      <div className="analytics-dashboard-container">
        <div className="analytics-header">
          <div className="analytics-header-center">
            <div className="analytics-header-title">Data Analytics Dashboard</div>
          </div>
        </div>
        <div className="analytics-content">
          <div className="analytics-loading">Restoring session...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-dashboard-container">
        <div className="analytics-header">
          <button
            type="button"
            className="analytics-back-button"
            onClick={() => navigate('/admin')}
          >
            Back to Dashboard
          </button>
          <div className="analytics-header-center">
            <div className="analytics-header-title">Data Analytics Dashboard</div>
          </div>
        </div>
        <div className="analytics-content">
          <div className="analytics-loading">Loading Analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard-container">
        <div className="analytics-header">
          <button
            type="button"
            className="analytics-back-button"
            onClick={() => navigate('/admin')}
          >
            Back to Dashboard
          </button>
          <div className="analytics-header-center">
            <div className="analytics-header-title">Data Analytics Dashboard</div>
          </div>
        </div>
        <div className="analytics-content">
          <div className="analytics-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard-container">
      <div className="analytics-header">
        <button
          type="button"
          className="analytics-back-button"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </button>
        <div className="analytics-header-center">
          <div className="analytics-header-title">Data Analytics Dashboard</div>
        </div>
      </div>

      <div className="analytics-content">
        {analytics && (
          <>
            {/* KPI Cards Row - Only 3 cards */}
            <div className="analytics-kpi-grid">
              <div className="analytics-kpi-card">
                <div className="analytics-kpi-label">SUBMISSIONS PER USER</div>
                <div className="analytics-kpi-value">{calculatedMetrics?.submissionsPerUser || '0.0'}</div>
                <div className="analytics-kpi-icon analytics-kpi-icon-linechart">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 10H16V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="analytics-kpi-card">
                <div className="analytics-kpi-label">SUBMISSIONS PER FORM</div>
                <div className="analytics-kpi-value">{calculatedMetrics?.submissionsPerForm || '0.0'}</div>
                <div className="analytics-kpi-icon analytics-kpi-icon-document">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="analytics-kpi-card analytics-kpi-card-warning">
                <div className="analytics-kpi-label">AI FLAGS</div>
                <div className="analytics-kpi-value analytics-kpi-value-danger">
                  {(() => {
                    if (!analytics.aiValidation) return 0;
                    const sentiment = parseInt(analytics.aiValidation.sentimentFlagged) || 0;
                    const entity = parseInt(analytics.aiValidation.entityFlagged) || 0;
                    return sentiment + entity;
                  })()}
                </div>
                <div className="analytics-kpi-icon analytics-kpi-icon-warning">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="analytics-charts-grid">
              {/* Vertical Bar Chart - Top Forms by Submissions */}
              {verticalBarChartData && verticalBarChartData.length > 0 && comparisonChartLayout && (
                <div className="analytics-chart-card">
                  <div className="analytics-chart-header">
                    <h3 className="analytics-chart-title">Form Submission Comparison</h3>
                    <div className="analytics-chart-subtitle">Submission Share Analysis</div>
                  </div>
                  <div className="analytics-chart-scroll-frame">
                    <div className="analytics-line-chart-container analytics-line-chart-container-comparison">
                      <svg
                        viewBox={`0 0 ${comparisonChartLayout.chartWidth} ${comparisonChartLayout.chartHeight}`}
                        className="analytics-line-chart-svg analytics-line-chart-svg-comparison"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <rect
                          x={comparisonChartLayout.leftMargin}
                          y={comparisonChartLayout.topMargin}
                          width={comparisonChartLayout.chartAreaWidth}
                          height={comparisonChartLayout.chartAreaHeight}
                          rx="24"
                          fill="rgba(148, 163, 184, 0.06)"
                        />

                      {/* Y-axis labels and grid lines */}
                      {comparisonChartLayout.yTicks.map((value) => {
                        const yPos = comparisonChartLayout.topMargin + comparisonChartLayout.chartAreaHeight - (value / comparisonChartLayout.maxPercent) * comparisonChartLayout.chartAreaHeight;
                        return (
                          <g key={value}>
                            <text
                              x={comparisonChartLayout.leftMargin - 10}
                              y={yPos + 4}
                              className="analytics-line-chart-x-label"
                              textAnchor="end"
                              fill="#7c8698"
                              fontSize="11"
                              fontWeight="500"
                            >
                              {formatChartPercent(value)}
                            </text>
                            <line
                              x1={comparisonChartLayout.leftMargin}
                              y1={yPos}
                              x2={comparisonChartLayout.chartWidth - comparisonChartLayout.rightMargin}
                              y2={yPos}
                              stroke="rgba(148, 163, 184, 0.22)"
                              strokeWidth="1"
                            />
                          </g>
                        );
                      })}

                      {/* Y-axis label */}
                      <text
                        x="18"
                        y={comparisonChartLayout.chartHeight / 2}
                        className="analytics-line-chart-x-label"
                        textAnchor="middle"
                        fill="#7c8698"
                        fontSize="10"
                        fontWeight="600"
                        transform={`rotate(-90, 18, ${comparisonChartLayout.chartHeight / 2})`}
                      >
                        Submission Share (%)
                      </text>

                      {/* Vertical Bars */}
                      {verticalBarChartData.map((form, index) => {
                        const barX = comparisonChartLayout.leftMargin + index * comparisonChartLayout.barSpacing + (comparisonChartLayout.barSpacing - comparisonChartLayout.barWidth) / 2;
                        const scaledBarHeight = (form.percent / comparisonChartLayout.maxPercent) * comparisonChartLayout.chartAreaHeight;
                        const barHeight = form.percent > 0 ? Math.max(18, scaledBarHeight) : 0;
                        const barY = comparisonChartLayout.topMargin + comparisonChartLayout.chartAreaHeight - barHeight;
                        const labelLines = wrapChartLabel(form.formTitle, comparisonChartLayout.labelCharLimit, 2);
                        
                        return (
                          <g key={form.formId || form.formTitle}>
                            {/* Bar */}
                            <rect
                              x={barX}
                              y={barY}
                              width={comparisonChartLayout.barWidth}
                              height={barHeight}
                              fill={form.color}
                              rx="18"
                              style={{ transition: 'opacity 0.2s, transform 0.2s' }}
                              className="analytics-chart-bar analytics-comparison-bar"
                            />
                            <title>{`${form.formTitle}: ${form.submissionCount} submissions (${formatChartPercent(form.percent)}%)`}</title>
                            
                            {/* Percentage label on top of bar */}
                            <text
                              x={barX + comparisonChartLayout.barWidth / 2}
                              y={barY - 10}
                              className="analytics-line-chart-x-label"
                              textAnchor="middle"
                              fill="#4f1020"
                              fontSize="12"
                              fontWeight="600"
                            >
                              {formatChartPercent(form.percent)}%
                            </text>
                            
                            {/* X-axis label (Form name) */}
                            <text
                              x={barX + comparisonChartLayout.barWidth / 2}
                              y={comparisonChartLayout.chartHeight - 34}
                              className="analytics-line-chart-x-label"
                              textAnchor="middle"
                              fill="#556173"
                              fontSize="10"
                              fontWeight="600"
                            >
                              {labelLines.map((line, lineIndex) => (
                                <tspan
                                  key={`${form.formId || form.formTitle}-${lineIndex}`}
                                  x={barX + comparisonChartLayout.barWidth / 2}
                                  dy={lineIndex === 0 ? 0 : 13}
                                >
                                  {line}
                                </tspan>
                              ))}
                            </text>
                          </g>
                        );
                      })}
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Donut Chart - Form Distribution */}
              {donutChartData && donutChartData.length > 0 && (
                <div className="analytics-chart-card">
                  <div className="analytics-chart-header">
                    <h3 className="analytics-chart-title">Form Distribution</h3>
                    <div className="analytics-chart-subtitle">Top Forms by Submissions</div>
                  </div>
                  <div className="analytics-donut-chart-container">
                    <div className="analytics-donut-chart">
                      <svg viewBox="0 0 200 200" className="analytics-donut-svg">
                        <circle
                          cx="100"
                          cy="100"
                          r="70"
                          fill="none"
                          stroke="rgba(148, 163, 184, 0.18)"
                          strokeWidth="34"
                        />
                        {donutChartData.map((form, index) => {
                          const radius = 70;
                          const circumference = 2 * Math.PI * radius;
                          const percent = Number(form.percent);
                          const strokeDasharray = circumference;
                          const strokeDashoffset = circumference - (percent / 100) * circumference;
                          const rotation = form.startPercent * 3.6 - 90;
                          
                          return (
                            <circle
                              key={form.formId}
                              className="analytics-donut-segment"
                              cx="100"
                              cy="100"
                              r={radius}
                              fill="none"
                              stroke={form.color}
                              strokeWidth="34"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              transform={`rotate(${rotation} 100 100)`}
                              strokeLinecap="butt"
                              style={{ transition: 'all 0.3s ease' }}
                            />
                          );
                        })}
                      </svg>
                      <div className="analytics-donut-center">
                        <div className="analytics-donut-center-value">
                          {totalTopFormSubmissions}
                        </div>
                        <div className="analytics-donut-center-label">Submissions</div>
                      </div>
                    </div>
                    <div className="analytics-donut-legend">
                      {donutChartData.map((form, index) => (
                        <div key={form.formId} className="analytics-donut-legend-item">
                          <div 
                            className="analytics-donut-legend-color" 
                            style={{ backgroundColor: form.color }}
                          />
                          <div className="analytics-donut-legend-text">
                            <div className="analytics-donut-legend-name" title={form.formTitle}>{form.formTitle}</div>
                            <div className="analytics-donut-legend-value">
                              {form.submissionCount} ({formatChartPercent(form.percent)}%)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Row - Top Forms and Recent Activity */}
            <div className="analytics-bottom-grid">
              {/* Top Forms List */}
              {analytics.topForms && analytics.topForms.length > 0 && (
                <div className="analytics-chart-card">
                  <div className="analytics-chart-header">
                    <h3 className="analytics-chart-title">Top Forms by Submissions</h3>
                    <div className="analytics-chart-subtitle">Most Active Forms</div>
                  </div>
                  <div className="analytics-top-forms-list">
                    {analytics.topForms.slice(0, 5).map((form, index) => (
                      <div key={form.formId} className="analytics-top-form-item">
                        <div className="analytics-top-form-rank">#{index + 1}</div>
                        <div className="analytics-top-form-info">
                          <div className="analytics-top-form-title">{form.formTitle}</div>
                          <div className="analytics-top-form-count">{form.submissionCount} submissions</div>
                        </div>
                        <div className="analytics-top-form-bar">
                          <div 
                            className="analytics-top-form-bar-fill"
                            style={{ 
                              width: `${(form.submissionCount / analytics.topForms[0].submissionCount) * 100}%`,
                              backgroundColor: donutChartData?.[index]?.color || '#3b82f6'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {analytics.recentActivity && analytics.recentActivity.length > 0 && (
                <div className="analytics-chart-card">
                  <div className="analytics-chart-header">
                    <h3 className="analytics-chart-title">Recent Activity</h3>
                    <div className="analytics-chart-subtitle">Latest Submissions</div>
                  </div>
                  <div className="analytics-recent-activity-list">
                    {analytics.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="analytics-activity-item">
                        <div className="analytics-activity-icon">📋</div>
                        <div className="analytics-activity-content">
                          <div className="analytics-activity-form">{activity.formTitle}</div>
                          <div className="analytics-activity-meta">
                            Submission #{activity.id} • {new Date(activity.submittedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;

