"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

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
  const [selected, setSelected] = useState<string | null>(null);

  // Pan/zoom transform applied to the <g> wrapping the province paths.
  // The outer <svg viewBox> never changes; we translate+scale the content
  // inside it, which keeps the tooltip's screen-space math untouched.
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, tx: 0, ty: 0 });

  const [vbX, vbY, vbW, vbH] = useMemo(
    () => viewBox.split(/\s+/).map(Number),
    []
  );

  const maxCount = Math.max(...Object.values(countByProvince), 1);

  // Convert a pointer's screen position into the SVG's own (viewBox) coordinate
  // space, independent of how much we've zoomed/panned the inner <g>.
  const screenToViewBox = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: vbX + ((clientX - rect.left) / rect.width) * vbW,
      y: vbY + ((clientY - rect.top) / rect.height) * vbH,
    };
  }, [vbX, vbY, vbW, vbH]);

  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    setView((prev) => {
      const p = screenToViewBox(clientX, clientY);
      const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      if (newScale === 1) return { scale: 1, tx: 0, ty: 0 };
      // Keep the point under the cursor/center fixed while scale changes.
      const contentX = (p.x - prev.tx) / prev.scale;
      const contentY = (p.y - prev.ty) / prev.scale;
      return {
        scale: newScale,
        tx: p.x - contentX * newScale,
        ty: p.y - contentY * newScale,
      };
    });
  }, [screenToViewBox]);

  // React attaches onWheel as a passive listener, so calling preventDefault()
  // inside a normal React handler silently fails to stop the page/container
  // from scrolling underneath the map. A native listener registered with
  // {passive:false} is the only way to actually block that scroll while the
  // cursor is over the map.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Smaller, deltaY-proportional steps (instead of one fixed multiplier
      // per event) plus the CSS transition on the <g> below are what make
      // this feel continuous rather than stepped.
      const factor = Math.pow(1.0016, -e.deltaY);
      zoomAt(e.clientX, e.clientY, factor);
    };
    svg.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onNativeWheel);
  }, [zoomAt]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    zoomAt(e.clientX, e.clientY, 1.6);
  }, [zoomAt]);

  const resetView = useCallback(() => setView({ scale: 1, tx: 0, ty: 0 }), []);
  const zoomButton = useCallback((factor: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }, [zoomAt]);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (view.scale <= 1) return;
    dragRef.current = { dragging: true, moved: false, startX: e.clientX, startY: e.clientY, tx: view.tx, ty: view.ty };
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [view.scale, view.tx, view.ty]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.dragging) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setView((prev) => ({
      ...prev,
      tx: dragRef.current.tx + dx * (vbW / rect.width),
      ty: dragRef.current.ty + dy * (vbH / rect.height),
    }));
  }, [vbW, vbH]);

  const handlePointerUp = useCallback(() => {
    dragRef.current.dragging = false;
    setIsDragging(false);
  }, []);

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
      // A click that ends a drag (panning) shouldn't also toggle selection.
      if (dragRef.current.moved) {
        dragRef.current.moved = false;
        return;
      }
      const count = countByProvince[prov.name] || 0;
      setSelected((prev) => (prev === prov.name ? null : prov.name));
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
      <div className="map-zoom-controls">
        <button type="button" className="map-zoom-btn" onClick={() => zoomButton(1.4)} aria-label="ซูมเข้า">
          <ZoomIn size={15} />
        </button>
        <button type="button" className="map-zoom-btn" onClick={() => zoomButton(1 / 1.4)} aria-label="ซูมออก">
          <ZoomOut size={15} />
        </button>
        <button type="button" className="map-zoom-btn" onClick={resetView} aria-label="รีเซ็ตมุมมอง">
          <RotateCcw size={13} />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={viewBox}
        style={{ width: "100%", height: "auto", display: "block", cursor: view.scale > 1 ? "grab" : "default", touchAction: "none" }}
        aria-label="แผนที่จังหวัดไทย ซูมและลากเพื่อดูรายละเอียดได้"
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <g
          transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}
          style={{ transition: isDragging ? "none" : "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          {provinces.map((prov) => {
            const count = countByProvince[prov.name] || 0;
            const fill = getHeatColor(count, maxCount);
            const isSelected = selected === prov.name;
            return (
              <path
                key={prov.name}
                d={prov.d}
                fill={fill}
                className={`province-path${isSelected ? " selected" : ""}`}
                style={{ fill }}
                vectorEffect="non-scaling-stroke"
                onMouseEnter={(e) => handleMouseEnter(e, prov)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(prov)}
                onTouchStart={(e) => handleTouchStart(e, prov)}
                onTouchEnd={() =>
                  setTimeout(() => setTooltip((p) => ({ ...p, visible: false })), 2000)
                }
                aria-label={`${prov.name}: ${count} คน`}
                aria-pressed={isSelected}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleClick(prov);
                }}
              />
            );
          })}
        </g>
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
        {selected && (
          <span style={{ marginLeft: "auto", fontWeight: 600, color: "var(--ice-700)" }}>
            เลือก: {selected}
          </span>
        )}
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
