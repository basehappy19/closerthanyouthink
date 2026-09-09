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

  // Transform applied to the <g> wrapping province paths
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const viewRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [gestureNotice, setGestureNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, tx: 0, ty: 0 });

  const [vbX, vbY, vbW, vbH] = useMemo(
    () => viewBox.split(/\s+/).map(Number),
    []
  );

  const maxCount = Math.max(...Object.values(countByProvince), 1);

  const updateView = useCallback((next: { scale: number; tx: number; ty: number }) => {
    viewRef.current = next;
    setView(next);
  }, []);

  // Convert screen coordinates to SVG viewBox coordinate space
  const screenToViewBox = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: vbX + ((clientX - rect.left) / rect.width) * vbW,
      y: vbY + ((clientY - rect.top) / rect.height) * vbH,
    };
  }, [vbX, vbY, vbW, vbH]);

  // Smooth mouse wheel zoom on desktop
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      setIsInteracting(true);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => setIsInteracting(false), 120);

      const factor = Math.pow(1.002, -e.deltaY);
      const p = screenToViewBox(e.clientX, e.clientY);
      const prev = viewRef.current;
      const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);

      if (newScale === 1) {
        updateView({ scale: 1, tx: 0, ty: 0 });
        return;
      }

      const contentX = (p.x - prev.tx) / prev.scale;
      const contentY = (p.y - prev.ty) / prev.scale;
      updateView({
        scale: newScale,
        tx: p.x - contentX * newScale,
        ty: p.y - contentY * newScale,
      });
    };

    svg.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => {
      svg.removeEventListener("wheel", onNativeWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [screenToViewBox, updateView]);

  // Mobile multi-touch: 2 fingers pinch to zoom & pan smoothly; 1 finger scrolls the webpage!
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchContentX = 0;
    let pinchContentY = 0;
    let isPinching = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        // Multi-finger gesture: intercept and prevent whole-page scroll/zoom
        e.preventDefault();
        isPinching = true;
        setIsInteracting(true);

        const t0 = e.touches[0];
        const t1 = e.touches[1];
        pinchStartDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        pinchStartScale = viewRef.current.scale;

        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        const p0 = screenToViewBox(midX, midY);

        pinchContentX = (p0.x - viewRef.current.tx) / viewRef.current.scale;
        pinchContentY = (p0.y - viewRef.current.ty) / viewRef.current.scale;
      } else if (e.touches.length === 1) {
        // Single finger: allow default vertical page scrolling!
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2 && isPinching && pinchStartDist > 0) {
        e.preventDefault();

        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const factor = currentDist / pinchStartDist;
        const newScale = clamp(pinchStartScale * factor, MIN_SCALE, MAX_SCALE);

        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        const p = screenToViewBox(midX, midY);

        const newTx = newScale === 1 ? 0 : p.x - pinchContentX * newScale;
        const newTy = newScale === 1 ? 0 : p.y - pinchContentY * newScale;

        updateView({ scale: newScale, tx: newTx, ty: newTy });
      } else if (e.touches.length === 1 && viewRef.current.scale > 1) {
        // If user drags horizontally when zoomed in, show friendly tip without blocking scroll
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > 25 && dx > dy * 1.4) {
          setGestureNotice("ใช้ 2 นิ้วเพื่อเลื่อนแผนที่");
          if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = setTimeout(() => setGestureNotice(null), 2000);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && isPinching) {
        isPinching = false;
        setIsInteracting(false);
        pinchStartDist = 0;
      }
    };

    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd, { passive: false });
    svg.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
      svg.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [screenToViewBox, updateView]);

  // Desktop double-click zoom
  const handleDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setIsInteracting(false);
    const p = screenToViewBox(e.clientX, e.clientY);
    const prev = viewRef.current;
    const newScale = clamp(prev.scale * 1.6, MIN_SCALE, MAX_SCALE);
    if (newScale === 1) {
      updateView({ scale: 1, tx: 0, ty: 0 });
      return;
    }
    const contentX = (p.x - prev.tx) / prev.scale;
    const contentY = (p.y - prev.ty) / prev.scale;
    updateView({
      scale: newScale,
      tx: p.x - contentX * newScale,
      ty: p.y - contentY * newScale,
    });
  }, [screenToViewBox, updateView]);

  // Reset & button zoom
  const resetView = useCallback(() => {
    setIsInteracting(false);
    updateView({ scale: 1, tx: 0, ty: 0 });
  }, [updateView]);

  const zoomButton = useCallback((factor: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsInteracting(false);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const p = screenToViewBox(cx, cy);
    const prev = viewRef.current;
    const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
    if (newScale === 1) {
      updateView({ scale: 1, tx: 0, ty: 0 });
      return;
    }
    const contentX = (p.x - prev.tx) / prev.scale;
    const contentY = (p.y - prev.ty) / prev.scale;
    updateView({
      scale: newScale,
      tx: p.x - contentX * newScale,
      ty: p.y - contentY * newScale,
    });
  }, [screenToViewBox, updateView]);

  // Desktop mouse drag pan (only active when zoomed in and using mouse)
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (viewRef.current.scale <= 1) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      tx: viewRef.current.tx,
      ty: viewRef.current.ty,
    };
    setIsInteracting(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "mouse" || !dragRef.current.dragging) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.moved = true;
    }
    updateView({
      scale: viewRef.current.scale,
      tx: dragRef.current.tx + dx * (vbW / rect.width),
      ty: dragRef.current.ty + dy * (vbH / rect.height),
    });
  }, [vbW, vbH, updateView]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "mouse" || !dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setIsInteracting(false);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
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
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const count = countByProvince[prov.name] || 0;
        setTooltip({
          visible: true,
          x: touch.clientX,
          y: touch.clientY,
          name: prov.name,
          count,
        });
      }
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
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          cursor: view.scale > 1 ? "grab" : "default",
          touchAction: "pan-y",
        }}
        aria-label="แผนที่จังหวัดไทย ซูมและลากเพื่อดูรายละเอียดได้"
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <g
          transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}
          style={{
            transition: isInteracting ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            transformOrigin: "0 0",
          }}
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
                onTouchEnd={() => {
                  setTimeout(() => setTooltip((p) => ({ ...p, visible: false })), 2500);
                }}
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

      {/* Floating gesture tip */}
      <div className="map-gesture-hint">
        {gestureNotice ? `✋ ${gestureNotice}` : "💡 แตะเพื่อดูจังหวัด • ใช้ 2 นิ้วเพื่อซูมและเลื่อน"}
      </div>

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
