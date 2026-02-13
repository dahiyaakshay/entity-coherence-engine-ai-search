import React, { useMemo, useRef, useEffect, useState } from "react";

interface TrendPoint {
  auditId: string;
  createdAt: string;
  totalGap: number;
  avgSemanticScore: number;
  avgDominanceScore: number;
  authorityIndex: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  height = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  /* =========================================================
     Responsive Width
  ========================================================= */
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setWidth(rect.width);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        No trend data available yet.
      </div>
    );
  }

  /* =========================================================
     Layout
  ========================================================= */
  const padding = {
    top: 30,
    right: 40,
    bottom: 50,
    left: 70,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    ...data.map((d) => d.totalGap),
    1
  );

  const xStep =
    data.length > 1
      ? chartWidth / (data.length - 1)
      : 0;

  /* =========================================================
     Compute Points
  ========================================================= */
  const points = data.map((point, index) => {
    const x = padding.left + index * xStep;
    const y =
      padding.top +
      chartHeight -
      (point.totalGap / maxValue) * chartHeight;

    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  /* =========================================================
     Y Axis Ticks
  ========================================================= */
  const yTicks = 5;
  const yTickValues = Array.from(
    { length: yTicks + 1 },
    (_, i) => (maxValue / yTicks) * i
  );

  const labelInterval =
    data.length > 10
      ? Math.ceil(data.length / 6)
      : 1;

  return (
    <div ref={containerRef} className="w-full">

      <svg
        width={width}
        height={height}
        className="bg-[#24242A] rounded-xl border border-[#2F2F36]"
      >
        {/* GRID + Y Labels */}
        {yTickValues.map((value, i) => {
          const y =
            padding.top +
            chartHeight -
            (value / maxValue) * chartHeight;

          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#2F2F36"
              />
              <text
                x={padding.left - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#9CA3AF"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* X Axis */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke="#3A3A42"
        />

        {/* Trend Line (Orange Accent) */}
        <path
          d={pathD}
          fill="none"
          stroke="#FF6B35"
          strokeWidth="3"
        />

        {/* Data Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#FF6B35"
            stroke="#1F1F24"
            strokeWidth="2"
          />
        ))}

        {/* X Axis Labels */}
        {data.map((point, index) => {
          if (index % labelInterval !== 0)
            return null;

          const x =
            padding.left + index * xStep;

          return (
            <text
              key={index}
              x={x}
              y={height - 18}
              textAnchor="middle"
              fontSize="12"
              fill="#9CA3AF"
            >
              {new Date(
                point.createdAt
              ).toLocaleDateString()}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
