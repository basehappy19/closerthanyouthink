"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import addressDataRaw from "@/lib/data/address_tree.json";
import CustomSelect from "./components/CustomSelect";
import ThailandMap from "./components/ThailandMap";
import {
  FileText, BarChart2, BookOpen, Info, PlayCircle, Image as ImageIcon, CheckCircle,
  Smile, SmilePlus, Frown, Annoyed, Meh, Globe, MapPin, Users, Award, Shield, Key, Video,
  Newspaper, ClipboardList, Lock, Scale, ArrowRight,
} from "lucide-react";

const MOOD_SCALE_ICONS = [Frown, Annoyed, Meh, Smile, SmilePlus];

type AddressTree = Record<string, Record<string, string[]>>;
const addressTree = addressDataRaw as AddressTree;
const PROVINCES = Object.keys(addressTree).sort();

const KNOWLEDGE_ITEMS = [
  { field: "k1", text: "น้ำแข็งขั้วโลกละลายไม่ส่งผลกระทบต่อประเทศไทยเลย เพราะอยู่ไกลกันมาก", correct: "ผิด" },
  { field: "k2", text: "กรุงเทพมหานครมีความสูงเฉลี่ยเหนือระดับน้ำทะเลไม่ถึง 2 เมตร", correct: "ถูก" },
  { field: "k3", text: "กรุงเทพฯ ถูกจัดว่าเป็นหนึ่งในเมืองที่เสี่ยงที่สุดในโลกจากระดับน้ำทะเลสูงขึ้น", correct: "ถูก" },
  { field: "k4", text: "หากไม่มีการรับมือ พื้นที่บางส่วนของกรุงเทพฯ อาจจมอยู่ใต้น้ำได้ภายในปี 2050", correct: "ถูก" },
  { field: "k5", text: "ระดับน้ำทะเลโลกในช่วง 25 ปีหลังสุด เพิ่มขึ้นช้าลงกว่าในอดีต", correct: "ผิด" },
];

const VIDEO_YOUTUBE_ID = "";

const CLIMATE_IMAGES = [
  { src: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400&q=70", alt: "น้ำแข็งขั้วโลกละลาย" },
  { src: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&q=70", alt: "น้ำท่วม" },
  { src: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&q=70", alt: "คลื่นความร้อน" },
];

const NEWS_ITEMS = [
  {
    tag: "ไทย",
    title: "กรุงเทพฯ เสี่ยงจมน้ำภายในปี 2030 จากภาวะโลกร้อน",
    source: "BBC Thai",
    href: "https://www.bbc.com/thai/topics/cxl9mvwzw3pt",
    img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=70",
  },
  {
    tag: "โลก",
    title: "แผ่นน้ำแข็งกรีนแลนด์ละลายเร็วกว่าที่คาดถึง 7 เท่า",
    source: "Nature",
    href: "https://www.nature.com/nclimate/",
    img: "https://images.unsplash.com/photo-1518414441020-fc6d7d6bfd89?w=400&q=70",
  },
  {
    tag: "ไทย",
    title: "พายุฤดูร้อนในไทยรุนแรงขึ้นจากการเปลี่ยนแปลงสภาพภูมิอากาศ",
    source: "Thai PBS World",
    href: "https://www.thaipbsworld.com/category/environment/",
    img: "https://images.unsplash.com/photo-1527482937786-6608f6e14c15?w=400&q=70",
  },
  {
    tag: "โลก",
    title: "ระดับน้ำทะเลสูงขึ้น 20 ซม. ภายในปี 2100 — รายงาน IPCC",
    source: "IPCC",
    href: "https://www.ipcc.ch/",
    img: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=400&q=70",
  },
  {
    tag: "เอเชีย",
    title: "บังกลาเทศจม: ชาวบ้านล้านคนอพยพหนีน้ำท่วม",
    source: "Reuters",
    href: "https://www.reuters.com/business/environment/",
    img: "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=400&q=70",
  },
  {
    tag: "โลก",
    title: "ปลาวาฬเกยตื้นเป็นสัญญาณของมหาสมุทรกำลังเปลี่ยนแปลง",
    source: "National Geographic",
    href: "https://www.nationalgeographic.com/environment/",
    img: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&q=70",
  },
];

export default function ClientPage({ initialSchools, initialStats }: { initialSchools: string[], initialStats: any }) {
  const [activeView, setActiveView] = useState("view-survey");
  const [currentPhase, setCurrentPhase] = useState("demographics");

  const [demographics, setDemographics] = useState({
    ageRange: "", province: "", district: "", subdistrict: "", school: "",
  });

  const [round1Answers, setRound1Answers] = useState<Record<string, string>>({});
  const [round2Answers, setRound2Answers] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<any>(initialStats);
  const loadingStats = false;
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [knownSchools, setKnownSchools] = useState<string[]>(initialSchools);
  const schoolInputRef = useRef<HTMLInputElement>(null);

  const districtOptions = useMemo(() => {
    if (!demographics.province || !addressTree[demographics.province]) return [];
    return Object.keys(addressTree[demographics.province]).sort();
  }, [demographics.province]);

  const subdistrictOptions = useMemo(() => {
    if (!demographics.province || !demographics.district) return [];
    const dists = addressTree[demographics.province];
    if (!dists || !dists[demographics.district]) return [];
    return dists[demographics.district].sort();
  }, [demographics.province, demographics.district]);

  const isBkk = demographics.province === "กรุงเทพมหานคร";
  const districtLabel = isBkk ? "เขต" : "อำเภอ";
  const subdistrictLabel = isBkk ? "แขวง" : "ตำบล";


  const validate = (fields: Record<string, string | undefined>) => {
    const newErrors: Record<string, boolean> = {};
    Object.entries(fields).forEach(([k, v]) => {
      if (!v || !v.trim()) newErrors[k] = true;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors({}), 800);
      return false;
    }
    return true;
  };

  const handleDemographicsNext = () => {
    if (!validate({
      ageRange: demographics.ageRange,
      province: demographics.province,
      district: demographics.district,
      subdistrict: demographics.subdistrict,
      school: demographics.school,
    })) return;
    setCurrentPhase("questions-r1");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuestionsSubmit = () => {
    const FIELDS = ["q1", "q2", "q3", "q4", "q5", "k1", "k2", "k3", "k4", "k5"];
    const currentAnswers = currentPhase === "questions-r1" ? round1Answers : round2Answers;
    const newErrors: Record<string, boolean> = {};
    FIELDS.forEach((f) => { if (!currentAnswers[f]) newErrors[f] = true; });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors({}), 800);
      return;
    }
    if (currentPhase === "questions-r1") {
      setCurrentPhase("media");
    } else {
      finishSurvey();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const computeScore = (answers: Record<string, string>) =>
    KNOWLEDGE_ITEMS.filter((item) => answers[item.field] === item.correct).length;

  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("surveySubmitted") === "true") {
      setCurrentPhase("summary");
      // Load previous answers if needed, or just show a simplified summary
    }
  }, []);

  const finishSurvey = async () => {
    const preScore = computeScore(round1Answers);
    const postScore = computeScore(round2Answers);
    setCurrentPhase("summary");
    try {
      await supabase.from("survey_responses").insert([{
        age_range: demographics.ageRange,
        province: demographics.province,
        district: demographics.district,
        subdistrict: demographics.subdistrict,
        school: demographics.school,
        pre_answers: round1Answers,
        post_answers: round2Answers,
        pre_score: preScore,
        post_score: postScore,
      }]);
      localStorage.setItem("surveySubmitted", "true");
      
      router.refresh(); // Refresh Next.js server components in the background
    } catch (err) { console.error("Save failed", err); }
  };


  const setAnswer = (field: string, value: string) => {
    if (currentPhase === "questions-r1") setRound1Answers((p) => ({ ...p, [field]: value }));
    else setRound2Answers((p) => ({ ...p, [field]: value }));
  };

  const getAnswer = (field: string) =>
    currentPhase === "questions-r1" ? round1Answers[field] : round2Answers[field];

  const renderChipGroup = (field: string, options: string[], isScale = false, isMoodScale = false) => (
    <div className={`chip-group ${isScale ? "scale" : ""} ${errors[field] ? "invalid" : ""}`}>
      {options.map((opt, i) => {
        const val = isScale ? String(i + 1) : opt;
        const MoodIcon = isMoodScale ? MOOD_SCALE_ICONS[i] : null;
        return (
          <button
            key={val} type="button"
            className={`chip${isMoodScale ? " chip-emoji" : ""}${getAnswer(field) === val ? " selected" : ""}`}
            onClick={() => setAnswer(field, val)}
            aria-label={isMoodScale ? opt : undefined}
          >{MoodIcon ? <MoodIcon size={22} /> : opt}</button>
        );
      })}
    </div>
  );

  const progressStep = ({ demographics: 1, "questions-r1": 2, media: 3, "questions-r2": 4 } as any)[currentPhase] || 1;

  const renderBarChart = (data: Record<string, number>, limit = 6) => {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, limit);
    const max = sorted.length ? sorted[0][1] : 1;
    return sorted.map(([k, v]) => (
      <div className="bar-row" key={k}>
        <div className="bar-row-top"><span>{k}</span><span className="bar-count">{v}</span></div>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(6, (v / max) * 100)}%` }} /></div>
      </div>
    ));
  };

  const renderDetailedBarChart = (data: Record<string, number>, scores: Record<string, {pre: number, post: number, count: number}>, limit = 6) => {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, limit);
    const max = sorted.length ? sorted[0][1] : 1;
    return sorted.map(([k, v]) => {
      const s = scores[k];
      const pre = s ? (s.pre / s.count).toFixed(1) : "-";
      const post = s ? (s.post / s.count).toFixed(1) : "-";
      return (
        <div className="bar-row" key={k} style={{ marginBottom: 12 }}>
          <div className="bar-row-top">
            <span>{k} <span style={{fontSize: 10.5, color: "var(--ink-soft)", fontWeight: "normal"}}>({v} คน)</span></span>
            <span className="bar-count" style={{ fontSize: 11.5, fontWeight: "normal" }}>
              ก่อน: <b style={{color:"var(--ice-700)"}}>{pre}</b> → หลัง: <b style={{color:"var(--good)"}}>{post}</b>
            </span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(6, (v / max) * 100)}%` }} /></div>
        </div>
      );
    });
  };

  const TABS = [
    { id: "view-survey", label: "ทำแบบสำรวจ", icon: FileText },
    { id: "view-stats", label: "ดูสถิติ", icon: BarChart2 },
    { id: "view-knowledge", label: "ความรู้", icon: BookOpen },
    { id: "view-about", label: "เกี่ยวกับโครงงาน", icon: Info },
  ];

  const BrandSvg = () => (
    <svg width="36" height="36" viewBox="0 0 120 120" fill="none">
      <rect x="26" y="26" width="68" height="68" rx="20" fill="url(#gs1)"/>
      <circle cx="50" cy="56" r="4.5" fill="#0f5c6b"/>
      <circle cx="74" cy="56" r="4.5" fill="#0f5c6b"/>
      <path d="M48 70 Q62 80 78 70" stroke="#0f5c6b" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M40 96 Q40 108 32 112 Q44 112 46 100 Q48 108 58 108 Q50 100 52 92 Z" fill="#1b8a9e"/>
      <defs>
        <linearGradient id="gs1" x1="26" y1="26" x2="94" y2="94" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eef9fa"/><stop offset="1" stopColor="#bfe7ea"/>
        </linearGradient>
      </defs>
    </svg>
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  // Rendered via renderMainContent() (a plain function call, not <RenderMainContent/>)
  // on purpose: this closes over ClientPage's state and has no props, so making it a
  // JSX component would give it a fresh identity on every ClientPage render, and React
  // would unmount+remount this whole subtree (losing dropdown focus, replaying every
  // fade-in) on each keystroke, chip click, or selection.
  const renderMainContent = () => (
    <>
      {/* ======================== SURVEY VIEW ======================== */}
      {activeView === "view-survey" && (
        <section className="view active">
          <div className="hero">
            <div className="mascot">
              <svg width="72" height="72" viewBox="0 0 120 120" fill="none">
                <rect x="18" y="18" width="84" height="84" rx="26" fill="url(#g2)"/>
                <circle cx="46" cy="54" r="5.5" fill="#0f5c6b"/>
                <circle cx="76" cy="54" r="5.5" fill="#0f5c6b"/>
                <path d="M44 70 Q62 84 80 70" stroke="#0f5c6b" strokeWidth="5" strokeLinecap="round" fill="none"/>
                <path d="M30 96 Q30 110 20 116 Q34 116 37 102 Q40 112 52 112 Q42 102 45 92 Z" fill="#1b8a9e"/>
                <defs>
                  <linearGradient id="g2" x1="18" y1="18" x2="102" y2="102" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#eef9fa"/><stop offset="1" stopColor="#a9dfe4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1>ก้อนน้ำแข็งขอถามอะไรหน่อยนะ</h1>
            <p>ตอบคำถามชุดแรกก่อน แล้วเราจะให้ดูคลิปกับโปสเตอร์ จากนั้นตอบอีกครั้ง เพื่อดูว่าความเข้าใจของเธอเปลี่ยนไปแค่ไหน</p>
          </div>

          <div className="climate-strip">
            {CLIMATE_IMAGES.map((img) => (
              <div className="climate-img-cell" key={img.src}>
                <img src={img.src} alt={img.alt} loading="lazy" />
              </div>
            ))}
          </div>

          {currentPhase !== "summary" && (
            <div id="progressWrap">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progressStep * 25}%` }} />
              </div>
              <div className="progress-label">ขั้นตอนที่ {progressStep} จาก 4</div>
            </div>
          )}

          {currentPhase === "demographics" && (
            <div className="phase active card">
              <h2>ข้อมูลเบื้องต้นของเธอ</h2>
              <div className="field" style={{ animation: "fadeIn 0.4s ease" }}>
                <label>ช่วงอายุ</label>
                <div className={`chip-group ${errors.ageRange ? "invalid" : ""}`}>
                  {["ต่ำกว่า 12 ปี", "12–15 ปี", "16–18 ปี", "19–25 ปี", "26–40 ปี", "มากกว่า 40 ปี"].map((age) => (
                    <button key={age} type="button"
                      className={`chip${demographics.ageRange === age ? " selected" : ""}`}
                      onClick={() => setDemographics({ ...demographics, ageRange: age, province: "", district: "", subdistrict: "" })}
                    >{age}</button>
                  ))}
                </div>
              </div>
              {demographics.ageRange && (
                <div className="field" style={{ animation: "fadeIn 0.35s ease" }}>
                  <label>จังหวัด</label>
                  <CustomSelect options={PROVINCES} value={demographics.province}
                    onChange={(v) => setDemographics({ ...demographics, province: v, district: "", subdistrict: "" })}
                    placeholder="— เลือกจังหวัด —" invalid={errors.province} />
                </div>
              )}
              {demographics.province && (
                <div className="field" style={{ animation: "fadeIn 0.35s ease" }}>
                  <label>{districtLabel}</label>
                  <CustomSelect options={districtOptions} value={demographics.district}
                    onChange={(v) => setDemographics({ ...demographics, district: v, subdistrict: "" })}
                    placeholder={`— เลือก${districtLabel} —`} invalid={errors.district} />
                </div>
              )}
              {demographics.district && (
                <div className="field" style={{ animation: "fadeIn 0.35s ease" }}>
                  <label>{subdistrictLabel}</label>
                  <CustomSelect options={subdistrictOptions} value={demographics.subdistrict}
                    onChange={(v) => setDemographics({ ...demographics, subdistrict: v })}
                    placeholder={`— เลือก${subdistrictLabel} —`} invalid={errors.subdistrict} />
                </div>
              )}
              {demographics.subdistrict && (
                <div className="field" style={{ animation: "fadeIn 0.35s ease" }}>
                  <label>โรงเรียน / สถานศึกษา <span className="hint">(พิมพ์ หรือเลือกจากรายการ)</span></label>
                  <CustomSelect
                    options={knownSchools}
                    value={demographics.school}
                    onChange={(v) => setDemographics({ ...demographics, school: v })}
                    placeholder="เช่น โรงเรียนภูเขียว"
                    invalid={errors.school}
                    allowCustom={true}
                  />
                </div>
              )}
              {demographics.school.trim().length > 0 && (
                <div style={{ animation: "fadeIn 0.35s ease", marginTop: 20 }}>
                  <button type="button" className="btn-primary" onClick={handleDemographicsNext} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>ต่อไป <ArrowRight size={18} /></button>
                </div>
              )}
            </div>
          )}

          {(currentPhase === "questions-r1" || currentPhase === "questions-r2") && (
            <div className="phase active card">
              <span className={`round-badge ${currentPhase === "questions-r1" ? "pre" : "post"}`}>
                {currentPhase === "questions-r1" ? "ก่อนดูคลิปและโปสเตอร์" : "หลังดูคลิปและโปสเตอร์"}
              </span>
              <h2>มุมมองและความรู้ของเธอเรื่องโลกร้อน</h2>
              {(() => {
                const atts = [
                  { field: "q1", label: "การเปลี่ยนแปลงสภาพภูมิอากาศเป็นเรื่องใกล้ตัวเธอแค่ไหน", scale: true, captions: ["ไม่ใกล้ตัวเลย", "ใกล้ตัวมาก"] },
                  { field: "q2", label: "คิดว่าน้ำแข็งขั้วโลกละลายกระทบประเทศไทยหรือไม่", opts: ["ใช่", "ไม่ใช่", "ไม่แน่ใจ"] },
                  { field: "q3", label: "ทราบไหมว่ากรุงเทพฯ เป็นพื้นที่เสี่ยงน้ำท่วมจากระดับน้ำทะเลสูงขึ้น", opts: ["ทราบดี", "เคยได้ยินบ้าง", "ไม่เคยทราบ"] },
                  { field: "q4", label: "กังวลเกี่ยวกับผลกระทบของโลกร้อนต่อพื้นที่ที่เธออาศัยอยู่แค่ไหน", scale: true, captions: ["ไม่กังวลเลย", "กังวลมาก"] },
                  { field: "q5", label: "เคยมีส่วนร่วมในกิจกรรมลดโลกร้อนไหม", opts: ["เคย", "ไม่เคย"] },
                ];
                const items = [...atts, ...KNOWLEDGE_ITEMS.map((k, i) => ({ ...k, isKnowledge: true, num: i + 1 }))];
                
                return items.map((q: any, idx: number) => {
                  if (idx > 0 && !getAnswer(items[idx - 1].field)) return null;
                  
                  return (
                    <div key={q.field} style={{ animation: "fadeIn 0.35s ease" }}>
                      {idx === 0 && <div className="section-divider first">ทัศนคติของเธอ</div>}
                      {idx === 5 && <div className="section-divider">ทดสอบความรู้ (ถูกหรือผิด?)</div>}
                      
                      <div className="field">
                        <label>{q.isKnowledge ? `${q.num}. ${q.text}` : q.label}</label>
                        {q.scale ? (<>
                          {renderChipGroup(q.field, ["น้อยที่สุด", "น้อย", "ปานกลาง", "มาก", "มากที่สุด"], true, true)}
                          <div className="scale-caption"><span>{q.captions[0]}</span><span>{q.captions[1]}</span></div>
                        </>) : q.isKnowledge ? (
                          renderChipGroup(q.field, ["ถูก", "ผิด"])
                        ) : (
                          renderChipGroup(q.field, q.opts)
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              
              {getAnswer("k5") && (
                <button type="button" className="btn-primary" onClick={handleQuestionsSubmit} style={{ marginTop: 8, animation: "fadeIn 0.35s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {currentPhase === "questions-r1"
                    ? <>ส่งคำตอบรอบแรก <ArrowRight size={18} /></>
                    : <>ส่งคำตอบรอบสุดท้าย <CheckCircle size={18} /></>}
                </button>
              )}
            </div>
          )}

          {currentPhase === "media" && (
            <div className="phase active card">
              <h2>ก่อนตอบอีกรอบ ลองดูคลิปกับโปสเตอร์นี้ก่อนนะ</h2>
              <div className="media-block">
                <div className="media-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Video size={16} /> คลิปวิดีโอรณรงค์</div>
                <div className="video-frame">
                  {VIDEO_YOUTUBE_ID ? (
                    <iframe src={`https://www.youtube.com/embed/${VIDEO_YOUTUBE_ID}`} title="คลิปวิดีโอรณรงค์" allowFullScreen loading="lazy" />
                  ) : (
                    <div className="video-placeholder">
                      <div className="play-badge"><PlayCircle size={24}/></div>
                      <p>คลิปวิดีโอรณรงค์จะแสดงที่นี่<span className="hint">(ใส่ YouTube ID ในตัวแปร VIDEO_YOUTUBE_ID)</span></p>
                    </div>
                  )}
                </div>
              </div>
              <div className="media-block">
                <div className="media-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ImageIcon size={16} /> โปสเตอร์ให้ความรู้</div>
                <div className="poster-frame">
                  <img src="/poster.jpg" alt="โปสเตอร์ น้ำแข็งขั้วโลกละลาย ไกลจริงหรือ?"
                    onError={(e) => {
                      const t = e.currentTarget; t.style.display = "none";
                      const n = t.nextElementSibling as HTMLElement;
                      if (n) n.style.display = "flex";
                    }} />
                  <div style={{ display: "none", background: "var(--tint-a)", padding: "32px 20px", borderRadius: "var(--radius-md)", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
                    <div style={{ color: "var(--ice-500)" }}><ImageIcon size={40} /></div>
                    <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 13 }}>วางไฟล์โปสเตอร์ที่ <code>public/poster.jpg</code></p>
                  </div>
                </div>
              </div>
              <button type="button" className="btn-primary" onClick={() => { setCurrentPhase("questions-r2"); scrollToTop(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                ทำแบบสำรวจอีกรอบ <ArrowRight size={18} />
              </button>
            </div>
          )}

          {currentPhase === "summary" && (() => {
            const hasAnswers = Object.keys(round1Answers).length > 0;
            const pre = computeScore(round1Answers);
            const post = computeScore(round2Answers);
            const diff = post - pre;
            return (
              <div className="phase active card">
                <div className="summary-icon" style={{ color: "var(--ice-500)", display: "flex", justifyContent: "center", marginBottom: 12 }}><Award size={40} /></div>
                <h2 style={{ textAlign: "center" }}>{hasAnswers ? "สรุปผลก่อน-หลังของเธอ" : "ขอบคุณที่ร่วมทำแบบสำรวจ!"}</h2>
                
                {hasAnswers ? (
                  <>
                    <div className="summary-hero">
                      <div className="summary-score-card"><div className="score-label">ตอบถูกก่อนดูสื่อ</div><div className="score-value">{pre}/5</div></div>
                      <div className="summary-score-card post"><div className="score-label">ตอบถูกหลังดูสื่อ</div><div className="score-value">{post}/5</div></div>
                    </div>
                    <div className="summary-delta" style={{ color: diff > 0 ? "var(--good)" : "var(--ink-soft)", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {diff > 0 ? <><CheckCircle size={16} /> เธอตอบถูกเพิ่มขึ้น {diff} ข้อ หลังดูคลิปกับโปสเตอร์</>
                        : diff < 0 ? `รอบหลังตอบถูกน้อยลง ${Math.abs(diff)} ข้อ ลองดูคลิปอีกครั้งได้นะ`
                        : "คะแนนเท่าเดิม ลองทบทวนคลิปกับโปสเตอร์อีกรอบได้"}
                    </div>
                    <div className="section-divider first">มุมมองของเธอเปลี่ยนไปยังไงบ้าง</div>
                    <div className="compare-list">
                      {[
                        { key: "q1", label: "รู้สึกว่าโลกร้อนใกล้ตัว", isScale: true },
                        { key: "q2", label: "คิดว่ากระทบไทย" },
                        { key: "q3", label: "ทราบเรื่องกรุงเทพเสี่ยง" },
                        { key: "q4", label: "ความกังวลต่อพื้นที่ตัวเอง", isScale: true },
                        { key: "q5", label: "เคยมีส่วนร่วมลดโลกร้อน" },
                      ].map(({ key, label, isScale }: any) => (
                        <div className="compare-row" key={key}>
                          <span className="compare-label">{label}</span>
                          <span className="compare-vals">{round1Answers[key]}{isScale ? "/5" : ""} → <b>{round2Answers[key]}{isScale ? "/5" : ""}</b></span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: "center", color: "var(--ink-soft)", marginBottom: 24 }}>เธอได้ส่งคำตอบจากเครื่องนี้ไปแล้ว</p>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                  <button type="button" className="btn-primary" onClick={() => setActiveView("view-stats")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>ดูสถิติภาพรวมของทุกคน <ArrowRight size={18} /></button>
                  <button type="button" onClick={() => { localStorage.removeItem("surveySubmitted"); setCurrentPhase("demographics"); setRound1Answers({}); setRound2Answers({}); }} style={{ background: "transparent", border: "1px solid var(--mist)", padding: "12px", borderRadius: "999px", color: "var(--ink-soft)", fontWeight: 600, cursor: "pointer" }}>ทำแบบสำรวจใหม่อีกครั้ง</button>
                </div>
              </div>
            );
          })()}
          <p className="privacy-note">คำตอบของเธอจะถูกรวมเป็นสถิติภาพรวมที่ทุกคนเห็นได้ ไม่มีการเก็บชื่อจริง</p>
        </section>
      )}

      {/* ======================== STATS VIEW ======================== */}
      {activeView === "view-stats" && (
        <section className="view active">
          {loadingStats ? (
            <div className="loading-spin" />
          ) : stats && stats.total > 0 ? (
            <>
              <div className="stats-hero">
                <div className="big-number">{stats.total}</div>
                <div className="big-label">คนทำแบบสำรวจครบทั้ง 2 รอบแล้ว</div>
              </div>
              <div className="stat-grid">
                <div className="stat-card tint-b">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BarChart2 size={16} /> คะแนนความรู้เฉลี่ย (จาก 5 ข้อ)</h3>
                  <div className="score-compare-row">
                    <div className="score-compare-item"><div className="n">{(stats.sumPreScore / stats.total).toFixed(1)}</div><div className="l">ก่อนดูสื่อ</div></div>
                    <div style={{ fontSize: 22, color: "var(--ice-300)", alignSelf: "center" }}>→</div>
                    <div className="score-compare-item"><div className="n" style={{ color: "var(--good)" }}>{(stats.sumPostScore / stats.total).toFixed(1)}</div><div className="l">หลังดูสื่อ</div></div>
                  </div>
                </div>
                <div className="stat-card tint-a"><h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16}/> จังหวัดที่ตอบเยอะที่สุด</h3>{renderDetailedBarChart(stats.byProvince, stats.scoreByProvince || {}, 5)}</div>
                <div className="stat-card tint-a"><h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16}/> ช่วงอายุของผู้ตอบ</h3>{renderBarChart(stats.byAge, 7)}</div>
                <div className="stat-card tint-c"><h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Award size={16}/> โรงเรียนที่ตอบเยอะที่สุด</h3>{renderDetailedBarChart(stats.bySchool, stats.scoreBySchool || {}, 5)}</div>
                <div className="stat-card white">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16}/> แผนที่จังหวัดที่ตอบแบบสำรวจ</h3>
                  <ThailandMap countByProvince={stats.byProvince} />
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>ยังไม่มีใครทำแบบสำรวจครบทั้ง 2 รอบเลย เป็นคนแรกกันเถอะ!</p>
              <button className="btn-primary" onClick={() => setActiveView("view-survey")}>ทำแบบสำรวจตอนนี้</button>
            </div>
          )}
        </section>
      )}

      {/* ======================== KNOWLEDGE VIEW ======================== */}
      {activeView === "view-knowledge" && (
        <section className="view active">
          <div className="card">
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ice-700)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}><Newspaper size={18} /> ความรู้และข่าวสาร</h2>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>ผลกระทบของการเปลี่ยนแปลงสภาพภูมิอากาศต่อไทยและโลก</p>
            </div>
            <div className="news-grid">
              {NEWS_ITEMS.map((n, i) => (
                <a key={i} className="news-card" href={n.href} target="_blank" rel="noopener noreferrer">
                  <img className="news-card-img" src={n.img} alt={n.title} loading="lazy" />
                  <div className="news-card-body">
                    <div className="news-card-tag">{n.tag}</div>
                    <div className="news-card-title">{n.title}</div>
                    <div className="news-card-source">{n.source}</div>
                  </div>
                </a>
              ))}
            </div>
            <div className="about-section">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Key size={16} /> ข้อเท็จจริงสำคัญ</h3>
              <ul>
                <li>ระดับน้ำทะเลโลกสูงขึ้น <strong>210–240 มม.</strong> นับตั้งแต่ปี ค.ศ. 1880</li>
                <li>กรุงเทพฯ มีความสูงเฉลี่ยเพียง <strong>1.5 เมตร</strong> เหนือระดับน้ำทะเล</li>
                <li>พื้นที่ถึง <strong>1 ใน 3</strong> ของกรุงเทพฯ อาจจมใต้น้ำภายในปี ค.ศ. 2050</li>
                <li>ประชาชนกว่า <strong>11 ล้านคน</strong> อาจได้รับผลกระทบ</li>
                <li>แผ่นน้ำแข็งกรีนแลนด์ละลายเร็วกว่าที่คาดถึง <strong>7 เท่า</strong></li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ======================== ABOUT VIEW ======================== */}
      {activeView === "view-about" && (
        <section className="view active">
          <div className="card">
            <div className="about-section">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><ClipboardList size={16} /> เกี่ยวกับโครงงาน</h3>
              <p><strong>ชื่อโครงงาน:</strong> การรณรงค์สร้างความตระหนักรู้เรื่อง ผลกระทบของน้ำแข็งขั้วโลกละลายต่อไทย</p>
              <p><strong>ชื่อภาษาอังกฤษ:</strong> An Awareness Campaign on the Impact of Melting Polar Ice on Thailand</p>
              <p><strong>ประเภท:</strong> กิจกรรมและแคมเปญเพื่อสร้างความตระหนักเกี่ยวกับการเปลี่ยนแปลงสภาพภูมิอากาศ</p>
              <p><strong>รายวิชา:</strong> โลก ดาราศาสตร์และอวกาศ 2 (ว30265) ภาคเรียนที่ 1 ปีการศึกษา 2569</p>
              <p><strong>กลุ่มสาระ:</strong> วิทยาศาสตร์และเทคโนโลยี โรงเรียนภูเขียว อำเภอภูเขียว จังหวัดชัยภูมิ</p>
              <p><strong>สำนักงาน:</strong> เขตพื้นที่การศึกษามัธยมศึกษาชัยภูมิ</p>
            </div>
            <div className="about-section">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Users size={16} /> จัดทำโดย</h3>
            {[
              { num: 1, name: "นายภาคภูมิ ทีดินดำ", cls: "ม.6/1 เลขที่ 9" },
              { num: 2, name: "นางสาวณัฐจิราภา ยศรุ่งเรือง", cls: "ม.6/1 เลขที่ 22" },
              { num: 3, name: "นางสาวแทมมารีน ตาปราบ", cls: "ม.6/1 เลขที่ 23" },
              { num: 4, name: "นางสาววรัญญา วิสิทธิ์สูงเนิน", cls: "ม.6/1 เลขที่ 33" },
            ].map((m) => (
              <div className="member-row" key={m.num}>
                <div className="member-num">{m.num}</div>
                <div><div className="member-name">{m.name}</div><div className="member-class">{m.cls}</div></div>
              </div>
            ))}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--mist)" }}>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink)" }}><strong>ครูที่ปรึกษา:</strong> นางสาวมาลินี เกื้อหนุน</p>
            </div>
          </div>
          <div className="about-section">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Lock size={16} /> นโยบายการเก็บข้อมูล (PDPA)</h3>
            <p>เว็บไซต์นี้เก็บข้อมูลดังต่อไปนี้เพื่อวัตถุประสงค์ทางการศึกษาเท่านั้น:</p>
            <ul>
              <li><strong>ข้อมูลที่เก็บ:</strong> ช่วงอายุ, จังหวัด, อำเภอ/เขต, ตำบล/แขวง, ชื่อโรงเรียน, คำตอบแบบสำรวจ, คะแนนก่อน-หลัง</li>
              <li><strong>ข้อมูลที่ไม่เก็บ:</strong> ชื่อจริง, เลขบัตรประชาชน, ข้อมูลส่วนตัวที่สามารถระบุตัวตนได้</li>
              <li><strong>วัตถุประสงค์:</strong> รวบรวมสถิติเพื่อประกอบโครงงานนักเรียน ไม่มีการเผยแพร่เชิงพาณิชย์</li>
              <li><strong>การเก็บรักษา:</strong> ข้อมูลถูกเก็บบน Supabase ด้วยการเข้ารหัส SSL และลบหลังสิ้นสุดโครงงาน</li>
              <li><strong>สิทธิ์ของผู้ตอบ:</strong> สามารถขอลบข้อมูลได้โดยติดต่อทีมงาน</li>
            </ul>
            <p style={{ marginTop: 10, fontSize: 12, color: "var(--ink-soft)" }}>
              อ้างอิง: <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</strong>
            </p>
          </div>
          <div className="about-section">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Scale size={16} /> กฎหมายและข้อตกลงที่เกี่ยวข้อง</h3>
            <ul>
              <li><strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</strong> — คุ้มครองสิทธิ์ส่วนตัวในการเก็บข้อมูล</li>
              <li><strong>พ.ร.บ. ส่งเสริมและรักษาคุณภาพสิ่งแวดล้อมแห่งชาติ พ.ศ. 2535</strong> — กำหนดหน้าที่ของรัฐและเอกชนในการดูแลสิ่งแวดล้อม</li>
              <li><strong>UNFCCC</strong> — กรอบอนุสัญญาสหประชาชาติว่าด้วยการเปลี่ยนแปลงสภาพภูมิอากาศ ไทยเป็นภาคีสมาชิก</li>
              <li><strong>ความตกลงปารีส (Paris Agreement, ค.ศ. 2016)</strong> — ไทยมีพันธกรณีลดก๊าซเรือนกระจก 20–25% ภายในปี ค.ศ. 2030</li>
              <li><strong>แผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ ฉบับที่ 13</strong> — บรรจุการรับมือกับการเปลี่ยนแปลงสภาพภูมิอากาศเป็นวาระสำคัญ</li>
            </ul>
          </div>
          <p className="privacy-note" style={{ marginTop: 24 }}>
            เว็บไซต์นี้จัดทำเพื่อการศึกษา ไม่แสวงหากำไร<br/>
            © 2569 นักเรียน ม.6/1 โรงเรียนภูเขียว จ.ชัยภูมิ
          </p>
          </div>
        </section>
      )}
    </>
  );

  return (
    <>
      {/* ===== DESKTOP two-column shell ===== */}
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <svg width="40" height="40" viewBox="0 0 120 120" fill="none">
              <rect x="18" y="18" width="84" height="84" rx="26" fill="url(#gd1)"/>
              <circle cx="46" cy="54" r="5" fill="#0f5c6b"/>
              <circle cx="76" cy="54" r="5" fill="#0f5c6b"/>
              <path d="M44 70 Q62 82 80 70" stroke="#0f5c6b" strokeWidth="5" strokeLinecap="round" fill="none"/>
              <path d="M32 96 Q32 108 22 114 Q36 114 39 100 Q42 110 54 110 Q44 100 47 90 Z" fill="#1b8a9e"/>
              <defs>
                <linearGradient id="gd1" x1="18" y1="18" x2="102" y2="102" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#eef9fa"/><stop offset="1" stopColor="#bfe7ea"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="sidebar-brand-text">ไกลแค่ไหน<br/>ก็ท่วมถึง</div>
          </div>
          <nav className="sidebar-tabs">
            {TABS.map((t) => (
              <button key={t.id}
                className={`sidebar-tab${activeView === t.id ? " active" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                onClick={() => { setActiveView(t.id); scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
              ><t.icon size={18} /> {t.label}</button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Award size={14}/> โครงงานนักเรียน ม.6/1</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><MapPin size={14}/> โรงเรียนภูเขียว จ.ชัยภูมิ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={14}/> ปีการศึกษา 2569</div>
          </div>
        </aside>
        <main className="content-area" ref={scrollRef}>
          <div className="content-inner">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* ===== MOBILE single-column wrap ===== */}
      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <svg width="28" height="28" viewBox="0 0 120 120" fill="none">
              <rect x="26" y="26" width="68" height="68" rx="20" fill="url(#gm1)"/>
              <circle cx="50" cy="56" r="4.5" fill="#0f5c6b"/>
              <circle cx="74" cy="56" r="4.5" fill="#0f5c6b"/>
              <path d="M48 70 Q62 80 78 70" stroke="#0f5c6b" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M40 96 Q40 108 32 112 Q44 112 46 100 Q48 108 58 108 Q50 100 52 92 Z" fill="#1b8a9e"/>
              <defs>
                <linearGradient id="gm1" x1="26" y1="26" x2="94" y2="94" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#eef9fa"/><stop offset="1" stopColor="#bfe7ea"/>
                </linearGradient>
              </defs>
            </svg>
            <span>ไกลแค่ไหน<br/>ก็ท่วมถึง</span>
          </div>
        </div>
        {renderMainContent()}
        <div className="mobile-bottom-bar">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`tab${activeView === t.id ? " active" : ""}`}
                onClick={() => { setActiveView(t.id); scrollToTop(); }}><t.icon size={22} /> <span style={{fontSize: '10px'}}>{t.label}</span></button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

