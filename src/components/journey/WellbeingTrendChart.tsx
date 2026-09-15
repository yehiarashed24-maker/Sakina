import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import type { CheckinItem } from '../../services/journeyService';

interface TrendChartProps {
  checkins: CheckinItem[];
  daysFilter: number;
  onDaysChange: (days: number) => void;
  lang?: 'en' | 'ar';
}

export default function WellbeingTrendChart({
  checkins = [],
  daysFilter,
  onDaysChange,
  lang = 'ar'
}: TrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<CheckinItem | null>(null);

  const hasEnoughData = checkins.length >= 2;

  // Chart coordinate math (SVG viewBox: 0 0 600 200)
  const chartWidth = 600;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 30;

  const points = checkins.map((c, idx) => {
    const x =
      checkins.length === 1
        ? chartWidth / 2
        : paddingX + (idx / (checkins.length - 1)) * (chartWidth - paddingX * 2);
    // Y maps 1..5 to (chartHeight - paddingY) .. paddingY
    const y =
      chartHeight - paddingY - ((c.mood_score - 1) / 4) * (chartHeight - paddingY * 2);
    return { x, y, item: c };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    // Smooth bezier curve
    const prev = points[idx - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`
      : '';

  return (
    <div className="rounded-[20px] p-6 md:p-8 border border-[#f3efe6]/15 bg-[#f3efe6]/[0.035] backdrop-blur-md space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f3efe6]/10 pb-5">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#f3efe6]/40 uppercase block">
            [ LONGITUDINAL TRAJECTORY ]
          </span>
          <h2 className="text-xl font-medium text-[#f3efe6] mt-1">
            {lang === 'ar' ? 'مشاعرك مع الوقت' : 'Wellbeing Trend'}
          </h2>
          <p className="text-xs text-[#f3efe6]/50 font-mono mt-0.5">
            {lang === 'ar'
              ? 'على حسب تقييمك إنت لشعورك'
              : 'Based on your voluntary wellbeing check-ins.'}
          </p>
        </div>

        {/* Time Filter Buttons (PRISMA Pill style) */}
        <div className="rounded-full p-1 flex items-center border border-[#f3efe6]/15 bg-[#f3efe6]/[0.03] self-start sm:self-auto">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                daysFilter === d
                  ? 'bg-[#f3efe6] text-[#0d0b09] font-medium shadow-sm'
                  : 'text-[#f3efe6]/60 hover:text-[#f3efe6]'
              }`}
            >
              {d} {lang === 'ar' ? 'يوم' : 'DAYS'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {!hasEnoughData ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-[16px] bg-[#f3efe6]/[0.05] border border-[#f3efe6]/10 flex items-center justify-center text-[#f3efe6]/40">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-[#f3efe6]/80">
            {lang === 'ar'
              ? 'لسه مفيش تسجيلات كفاية نرسم بيها التغيّر'
              : 'Not enough check-ins yet to calculate a meaningful trend.'}
          </h3>
          <p className="text-xs text-[#f3efe6]/40 font-mono max-w-md mx-auto">
            {lang === 'ar'
              ? 'سجّل شعورك مرتين على الأقل عشان تشوف التغيّر مع الوقت.'
              : 'Complete at least two voluntary check-ins to unlock your longitudinal wellbeing trajectory.'}
          </p>
        </div>
      ) : (
        <div className="relative pt-2">
          {/* SVG Line Graph */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 sm:h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="prismaTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f3efe6" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#f3efe6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Lines for 1..5 */}
              {[1, 2, 3, 4, 5].map(lvl => {
                const y = chartHeight - paddingY - ((lvl - 1) / 4) * (chartHeight - paddingY * 2);
                return (
                  <g key={lvl}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="rgba(243,239,230,0.08)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      fill="rgba(243,239,230,0.3)"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {lvl}
                    </text>
                  </g>
                );
              })}

              {/* Filled Warm Cream Gradient Area */}
              <path d={areaD} fill="url(#prismaTrendGradient)" />

              {/* Smooth Warm Cream Trend Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#f3efe6"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Individual Check-in Data Points */}
              {points.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  className="cursor-pointer transition-all hover:r-6"
                  fill="#0d0b09"
                  stroke="#f3efe6"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredPoint(pt.item)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>
          </div>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-2 right-4 bg-[#0d0b09] border border-[#f3efe6]/25 rounded-[14px] p-3 shadow-2xl text-xs font-mono z-20 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-[#f3efe6] font-medium">التقييم: {hoveredPoint.mood_score} / 5</span>
                <span className="text-[#f3efe6]/40">&bull; {hoveredPoint.date}</span>
              </div>
              {hoveredPoint.factors.length > 0 && (
                <div className="text-[11px] text-[#f3efe6]/60">
                  العوامل: {hoveredPoint.factors.join('، ')}
                </div>
              )}
              {hoveredPoint.note && (
                <div className="text-[11px] text-[#f3efe6]/80 italic">"{hoveredPoint.note}"</div>
              )}
            </motion.div>
          )}

          {/* X-Axis Labels */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#f3efe6]/40 pt-2 px-6">
            <span>{checkins[0]?.date}</span>
            <span className="text-[#f3efe6]/50">
              {lang === 'ar' ? 'المقياس من 1 إلى 5' : 'Scale: 1 to 5'}
            </span>
            <span>{checkins[checkins.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}
