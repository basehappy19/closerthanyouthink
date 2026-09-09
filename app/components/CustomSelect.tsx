"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchable?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "— เลือก —",
  searchable = true,
  invalid = false,
  disabled = false,
  allowCustom = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setQuery("");
  }, [open, searchable]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (open && value && listRef.current) {
      const selected = listRef.current.querySelector(".selected");
      if (selected) {
        (selected as HTMLElement).scrollIntoView({ block: "nearest" });
      }
    }
  }, [open, value]);

  const handleSelect = useCallback(
    (opt: string) => {
      onChange(opt);
      setOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" && !open) setOpen(true);
  };

  return (
    <div className="custom-select-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`custom-select-trigger${open ? " open" : ""}${invalid ? " invalid" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={value ? "" : "custom-select-placeholder"}>
          {value || placeholder}
        </span>
        <span className={`custom-select-arrow${open ? " open" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7.5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="custom-select-dropdown" role="listbox">
          {searchable && (
            <div className="custom-select-search">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ชื่อโรงเรียน / สถาบัน..."
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter") {
                    if (filtered.length === 1) handleSelect(filtered[0]);
                    else if (allowCustom && query.trim()) handleSelect(query.trim());
                  }
                }}
              />
            </div>
          )}
          <div className="custom-select-list" ref={listRef}>
            {filtered.length === 0 ? (
              allowCustom && query.trim() ? (
                <div className="custom-select-item" onClick={() => handleSelect(query.trim())}>
                  ใช้ "{query.trim()}"
                </div>
              ) : (
                <div className="custom-select-empty">ไม่พบผลลัพธ์</div>
              )
            ) : (
              <>
                {allowCustom && query.trim() && !options.some(o => o.toLowerCase() === query.trim().toLowerCase()) && (
                  <div className="custom-select-item" onClick={() => handleSelect(query.trim())}>
                    ใช้ "{query.trim()}"
                  </div>
                )}
                {filtered.map((opt) => (
                  <div
                    key={opt}
                    role="option"
                    aria-selected={opt === value}
                    className={`custom-select-item${opt === value ? " selected" : ""}`}
                    onClick={() => handleSelect(opt)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSelect(opt);
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
