import React from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts';

const COLORS = ['#EF4444', '#F59E0B', '#6366F1', '#10B981'];

const AnalyticsCharts = ({ data }) => {
  if (!data) return <div className="text-text-dim text-sm">Loading safety analytics...</div>;

  const { trends = [], risk_distribution = [], response_times = [], categories = [] } = data;

  return (
    <div className="space-y-6">
      {/* Row 1: Line Trend & Doughnut Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend line */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-text-dim uppercase tracking-wider mb-4">Incident Trends</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <XAxis dataKey="label" stroke="#7C87B0" fontSize={12} tickLine={false} />
                <YAxis stroke="#7C87B0" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#131A2E', borderColor: 'rgba(148,163,255,0.12)', borderRadius: '10px' }} labelStyle={{ color: '#F8FAFC' }} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="reported" stroke="#6366F1" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="resolved" stroke="#22D3EE" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution pie */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-text-dim uppercase tracking-wider mb-4">Risk Distribution</h3>
          <div className="h-[280px] flex flex-col md:flex-row items-center justify-around">
            <div className="w-[200px] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={risk_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {risk_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#131A2E', borderColor: 'rgba(148,163,255,0.12)', borderRadius: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4 md:mt-0">
              {risk_distribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3 text-xs text-text-dim">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="font-semibold text-text">{entry.name} Zones</span>
                  <span>({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Response Bar & Category Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response times per zone */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-text-dim uppercase tracking-wider mb-4">Response Time by Zone (Min)</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={response_times}>
                <XAxis dataKey="label" stroke="#7C87B0" fontSize={11} tickLine={false} />
                <YAxis stroke="#7C87B0" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#131A2E', borderColor: 'rgba(148,163,255,0.12)', borderRadius: '10px' }} />
                <Bar dataKey="value" fill="#818CF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories radar chart */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-text-dim uppercase tracking-wider mb-4">Incidents by Category</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={categories}>
                <PolarGrid stroke="rgba(148, 163, 255, 0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="#7C87B0" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="rgba(148, 163, 255, 0.15)" />
                <Radar name="Incidents" dataKey="A" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.25} />
                <Tooltip contentStyle={{ backgroundColor: '#131A2E', borderColor: 'rgba(148,163,255,0.12)', borderRadius: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
