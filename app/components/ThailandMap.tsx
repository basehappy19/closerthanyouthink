"use client";

import { useState, useRef, useCallback } from "react";
import svgData from "@/lib/data/thailand_svg.json";

interface Province {
  name: string;
  en: string;
  d: string;
  cx: number;
  cy: number;
}

interface ThailandMapProps {
  countByProvince: Record<string, number>;
  onProvinceClick?: (name: string, count: number) => void;
}

const { viewBox, provinces } = svgData as {
  viewBox: string;
  provinces: Province[];
};

function getHeatColor(count: number, max: number): string {
  if (max === 0 || count === 0) return "#d8edee"; // mist (no data)
  const t = count / max;
  // ice-50 to ice-700 gradient
  if (t < 0.2) return "#c5e8ec";
  if (t < 0.4) return "#8fd6dd";
  if (t < 0.6) return "#4db5c2";
  if (t < 0.8) return "#1b8a9e";
  return "#0f5c6b";
}

export default function ThailandMap({
  countByProvince,
  onProvinceClick,
}: ThailandMapProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    name: string;
    count: number;
  }>({ visible: false, x: 0, y: 0, name: "", count: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const maxCount = Math.max(...Object.values(countByProvince), 1);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, prov: Province) => {
      const count = countByProvince[prov.name] || 0;
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        name: prov.name,
        count,
      });
    },
    [countByProvince]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleClick = useCallback(
    (prov: Province) => {
      const count = countByProvince[prov.name] || 0;
      onProvinceClick?.(prov.name, count);
    },
    [countByProvince, onProvinceClick]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, prov: Province) => {
      const touch = e.touches[0];
      const count = countByProvince[prov.name] || 0;
      setTooltip({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        name: prov.name,
        count,
      });
    },
    [countByProvince]
  );

  return (
    <div className="map-wrap">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        style={{ width: "100%", height: "auto", display: "block" }}
        aria-label="แผนที่จังหวัดไทย"
      >
        {provinces.map((prov) => {
          const count = countByProvince[prov.name] || 0;
          const fill = getHeatColor(count, maxCount);
          return (
            <path
              key={prov.name}
              d={prov.d}
              fill={fill}
              className="province-path"
              style={{ fill }}
              onMouseEnter={(e) => handleMouseEnter(e, prov)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(prov)}
              onTouchStart={(e) => handleTouchStart(e, prov)}
              onTouchEnd={() =>
                setTimeout(() => setTooltip((p) => ({ ...p, visible: false })), 2000)
              }
              aria-label={`${prov.name}: ${count} คน`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleClick(prov);
              }}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          fontSize: 11,
          color: "var(--ink-soft)",
        }}
      >
        <span>น้อย</span>
        {["#d8edee", "#c5e8ec", "#8fd6dd", "#4db5c2", "#1b8a9e", "#0f5c6b"].map((c) => (
          <div
            key={c}
            style={{
              width: 18,
              height: 10,
              background: c,
              borderRadius: 2,
            }}
          />
        ))}
        <span>มาก</span>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="map-tooltip visible"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.name}
          {tooltip.count > 0 ? ` · ${tooltip.count} คน` : " · ยังไม่มีข้อมูล"}
        </div>
      )}
    </div>
  );
}
