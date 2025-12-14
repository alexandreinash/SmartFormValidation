import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/AdminDashboard.css';

function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    loadAnalytics();
  }, [user, navigate]);

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
        percent: percent.toFixed(1),
        startPercent,
        endPercent: cumulativePercent,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
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
        percent: Math.round(percent * 10) / 10, // Round to 1 decimal
        color: form.color, // Use the same color from donut chart
        formId: form.formId,
      };
    });
  }, [donutChartData]);

  // Vertical bar chart dimensions - optimized to fit container
  const verticalChartHeight = 250;
  const verticalChartWidth = 500;
  const maxPercent = 30; // Max percentage value on Y-axis (like the image)
  const topMargin = 35;
  const bottomMargin = 50;
  const leftMargin = 45;
  const rightMargin = 20;
  
  // Calculate bar dimensions (always 5 bars from donut chart)
  const numBars = 5;
  const availableWidth = verticalChartWidth - leftMargin - rightMargin;
  const barWidth = Math.min(45, Math.floor(availableWidth / numBars - 8));
  const barSpacing = Math.floor(availableWidth / numBars);

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
              {verticalBarChartData && verticalBarChartData.length > 0 && (
                <div className="analytics-chart-card">
                  <div className="analytics-chart-header">
                    <h3 className="analytics-chart-title">Form Submission Comparison</h3>
                    <div className="analytics-chart-subtitle">Submission Share Analysis</div>
                  </div>
                  <div className="analytics-line-chart-container" style={{ padding: '0.5rem 0', overflow: 'visible' }}>
                    <svg viewBox={`0 0 ${verticalChartWidth} ${verticalChartHeight + 60}`} className="analytics-line-chart-svg" style={{ width: '100%', height: 'auto', maxWidth: '100%' }}>
                      {/* Y-axis labels and grid lines */}
                      {[5, 10, 20, 30].map((value) => {
                        const chartAreaHeight = verticalChartHeight - topMargin - bottomMargin;
                        const yPos = topMargin + chartAreaHeight - (value / maxPercent) * chartAreaHeight;
                        return (
                          <g key={value}>
                            <text
                              x={leftMargin - 8}
                              y={yPos + 4}
                              className="analytics-line-chart-x-label"
                              textAnchor="end"
                              fill="#6b7280"
                              fontSize="11"
                              fontWeight="500"
                            >
                              {value}
                            </text>
                            <line
                              x1={leftMargin}
                              y1={yPos}
                              x2={verticalChartWidth - rightMargin}
                              y2={yPos}
                              stroke="#e5e7eb"
                              strokeWidth="1"
                            />
                          </g>
                        );
                      })}

                      {/* Y-axis label */}
                      <text
                        x="18"
                        y={verticalChartHeight / 2 + 30}
                        className="analytics-line-chart-x-label"
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize="10"
                        fontWeight="500"
                        transform={`rotate(-90, 18, ${verticalChartHeight / 2 + 30})`}
                      >
                        Submission Share (%)
                      </text>

                      {/* Vertical Bars */}
                      {verticalBarChartData.map((form, index) => {
                        const chartAreaWidth = verticalChartWidth - leftMargin - rightMargin;
                        const chartAreaHeight = verticalChartHeight - topMargin - bottomMargin;
                        const barX = leftMargin + index * barSpacing + (barSpacing - barWidth) / 2;
                        const barHeight = (form.percent / maxPercent) * chartAreaHeight;
                        const barY = topMargin + chartAreaHeight - barHeight;
                        
                        // Truncate form name if too long - adjust based on available space
                        const maxNameLength = Math.floor(barSpacing / 6);
                        const displayName = form.formTitle.length > maxNameLength 
                          ? form.formTitle.substring(0, Math.max(6, maxNameLength - 3)) + '...' 
                          : form.formTitle;
                        
                        return (
                          <g key={form.formId || form.formTitle}>
                            {/* Bar */}
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={barHeight}
                              fill={form.color}
                              style={{ transition: 'opacity 0.2s' }}
                              className="analytics-chart-bar"
                            />
                            
                            {/* Percentage label on top of bar */}
                            <text
                              x={barX + barWidth / 2}
                              y={barY - 3}
                              className="analytics-line-chart-x-label"
                              textAnchor="middle"
                              fill="#1e293b"
                              fontSize="11"
                              fontWeight="600"
                            >
                              {form.percent}%
                            </text>
                            
                            {/* X-axis label (Form name) */}
                            <text
                              x={barX + barWidth / 2}
                              y={verticalChartHeight + 20}
                              className="analytics-line-chart-x-label"
                              textAnchor="middle"
                              fill="#6b7280"
                              fontSize="10"
                              fontWeight="500"
                            >
                              {displayName}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
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
                        {donutChartData.map((form, index) => {
                          const radius = 70;
                          const circumference = 2 * Math.PI * radius;
                          const percent = parseFloat(form.percent);
                          const strokeDasharray = circumference;
                          // Calculate offset: start from where previous segment ended
                          const strokeDashoffset = circumference - (percent / 100) * circumference;
                          // Rotate to start at the correct position
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
                              strokeWidth="40"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              transform={`rotate(${rotation} 100 100)`}
                              style={{ transition: 'all 0.3s ease' }}
                            />
                          );
                        })}
                      </svg>
                      <div className="analytics-donut-center">
                        <div className="analytics-donut-center-value">
                          {analytics.topForms.slice(0, 5).reduce((sum, f) => sum + f.submissionCount, 0)}
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
                            <div className="analytics-donut-legend-name">{form.formTitle}</div>
                            <div className="analytics-donut-legend-value">
                              {form.submissionCount} ({form.percent}%)
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

