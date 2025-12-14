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

  // Prepare data for line chart
  const lineChartData = useMemo(() => {
    if (!analytics?.submissionsOverTime || analytics.submissionsOverTime.length === 0) return null;
    
    const maxCount = Math.max(...analytics.submissionsOverTime.map(i => i.count), 1);
    return analytics.submissionsOverTime.map(item => ({
      ...item,
      normalizedValue: (item.count / maxCount) * 100,
    }));
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

  if (loading) {
    return (
      <div className="analytics-dashboard-container">
        <div className="analytics-header">
          <div className="analytics-logo">Smart Form Validator</div>
          <button
            type="button"
            className="analytics-back-button"
            onClick={() => navigate('/admin')}
          >
            Back to Dashboard
          </button>
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
          <div className="analytics-logo">Smart Form Validator</div>
          <button
            type="button"
            className="analytics-back-button"
            onClick={() => navigate('/admin')}
          >
            Back to Dashboard
          </button>
        </div>
        <div className="analytics-content">
          <div className="analytics-error">{error}</div>
        </div>
      </div>
    );
  }

  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="analytics-dashboard-container">
      <div className="analytics-header">
        <div className="analytics-logo">
          <div className="analytics-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 19C9 19.5304 9.21071 20.0391 9.58579 20.4142C9.96086 20.7893 10.4696 21 11 21H13C13.5304 21 14.0391 20.7893 14.4142 20.4142C14.7893 20.0391 15 19.5304 15 19V17H9V19ZM12 3C10.34 3 9 4.34 9 6V7H15V6C15 4.34 13.66 3 12 3Z" fill="#ef4444"/>
            </svg>
          </div>
          <span>Smart Form Validator</span>
        </div>
        <div className="analytics-header-right">
          <div className="analytics-header-title">Web Analytics Dashboard</div>
          <div className="analytics-header-date">{monthYear}</div>
        </div>
        <button
          type="button"
          className="analytics-back-button"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </button>
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="analytics-charts-grid">
              {/* Line Chart - Submissions Over Time */}
              {lineChartData && lineChartData.length > 0 && (
                <div className="analytics-chart-card">
                  <div className="analytics-chart-header">
                    <h3 className="analytics-chart-title">Submissions</h3>
                    <div className="analytics-chart-subtitle">Last 30 Days</div>
                  </div>
                  <div className="analytics-line-chart-container">
                    <div className="analytics-line-chart">
                      <svg className="analytics-line-chart-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {(() => {
                          const points = lineChartData.map((item, index) => {
                            const x = lineChartData.length > 1 
                              ? (index / (lineChartData.length - 1)) * 800 
                              : 400;
                            const y = 200 - Math.max(item.normalizedValue * 1.8, 5);
                            return { x, y };
                          });
                          
                          // Create area path
                          const areaPath = points.length > 0 
                            ? `M ${points[0].x},200 L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},200 Z`
                            : '';
                          
                          // Create line path
                          const linePath = points.length > 0
                            ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
                            : '';
                          
                          return (
                            <>
                              <path
                                className="analytics-line-chart-area"
                                d={areaPath}
                                fill="url(#lineGradient)"
                              />
                              <path
                                className="analytics-line-chart-line"
                                d={linePath}
                                fill="none"
                              />
                              {points.map((point, index) => (
                                <circle
                                  key={index}
                                  className="analytics-line-chart-dot"
                                  cx={point.x}
                                  cy={point.y}
                                  r="4"
                                />
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                      <div className="analytics-line-chart-x-axis">
                        {lineChartData.length > 0 && (() => {
                          const step = Math.max(1, Math.floor(lineChartData.length / 5));
                          return lineChartData
                            .filter((_, i) => i % step === 0 || i === lineChartData.length - 1)
                            .map((item, index) => (
                              <div key={index} className="analytics-line-chart-x-label">
                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            ));
                        })()}
                      </div>
                    </div>
                    <div className="analytics-chart-footer">
                      {lineChartData && lineChartData.length > 0 && (
                        <div className="analytics-chart-date">
                          {new Date(lineChartData[lineChartData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                      <div className="analytics-chart-total">
                        {analytics.overview.totalSubmissions} Total Submissions
                      </div>
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

