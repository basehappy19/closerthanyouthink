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
  Newspaper, ClipboardList, Lock, Scale, ArrowRight, ArrowLeft, Target, School, TrendingUp,
  ChevronDown, ChevronUp, Search,
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

const VIDEO_YOUTUBE_ID = "XHkL25uLrBM";

const CLIMATE_IMAGES = [
  { src: "https://images.theconversation.com/files/758011/original/file-20260904-50-pi6a1q.jpg?ixlib=rb-4.1.1&q=45&auto=format&w=754&h=503&fit=crop&dpr=1", alt: "Climate change" },
  { src: "https://static.naewna.com/uploads/news/source/979965.jpg", alt: "อีก 24 ปี กรุงเทพฯ จมน้ำจริงไหม?" },
  { src: "https://d3dyak49qszsk5.cloudfront.net/large_drought_land_ae03d33561.jpg", alt: "เอลนีโญ" },
];

const NEWS_ITEMS = [
  {
    tag: "ไทย",
    title: "ภายในปี พ.ศ. 2573 หรือ ค.ศ. 2030 มากกว่า 96% ของพื้นที่กรุงเทพฯ อาจถูกน้ำท่วมหากเกิดอุทกภัยครั้งใหญ่กว่าปกติในรอบ 10 ปี...",
    source: "BBC Thai",
    href: "https://www.bbc.com/thai/international-59204934",
    img: "https://ichef.bbci.co.uk/ace/ws/800/cpsprodpb/B849/production/_121477174_15048850378044.jpg.webp",
  },
  {
    tag: "โลก",
    title: "นักวิทยาศาสตร์ให้ความเห็นว่าเกาะ กรีนแลนด์ กำลังเข้าสู่จุดวิกฤต และมีแนวโน้มทำให้ระดับน้ำทะเลของโลกสูงขึ้น",
    source: "National Geographic",
    href: "https://ngthai.com/environment/36097/greenlandmelt4times/",
    img: "https://ngthai.com/app/uploads/2021/05/193292982_144549254282523_2536269575684065765_n.jpg",
  },
  {
    tag: "ไทย",
    title: "จับตา'เอลนีโญ'อุณหภูมิระอุ อนาคตไทยร้อนทุบสถิติถี่ขึ้น",
    source: "ไทยโพสต์",
    href: "https://www.thaipost.net/news-update/979197/",
    img: "https://storage-wp.thaipost.net/2026/04/aaa444.jpg",
  },
  {
    tag: "โลก",
    title: "หากอุณหภูมิเฉลี่ยผิวโลกเกิน 2 องศาเซลเซียส จะเป็นจุดพลิกผันที่ทำให้แอนตาร์กติกเปลี่ยนไปตลอดกาล",
    source: "GREENPEACE",
    href: "https://www.greenpeace.org/thailand/story/27735/climate-antarctic-tipping-points/",
    img: "https://www.greenpeace.org/static/planet4-aotearoa-stateless/2023/06/33eac12e-gp1swv18_medium_res_with_credit_line-1024x684.jpg",
  },
  {
    tag: "เอเชีย",
    title: "น้ำท่วมหนักในบังกลาเทศและอินเดีย เสียชีวิตกว่า 60 ไร้บ้านหลักล้าน",
    source: "ไทยโพสต์",
    href: "https://www.thaipost.net/abroad-news/146820/",
    img: "https://storage-wp.thaipost.net/2022/05/32AL2KE-highres.jpg",
  },
  {
    tag: "โลก",
    title: "โลกร้อนอุณหภูมิน้ำทะเลสูงขึ้น ทำปลาในเกาหลีตายกว่าล้านตัว",
    source: "SPRING NEWS",
    href: "https://www.springnews.co.th/keep-the-world/environment/842756",
    img: "https://image.springnews.co.th/uploads/images/md/2023/09/cl69LeX6CpgFgh0yWiL4.webp?x-image-process=style/LG-webp",
  },
];

export default function ClientPage({ initialSchools, initialStats, hasSubmitted }: { initialSchools: string[], initialStats: any, hasSubmitted: boolean }) {
  const [activeView, setActiveView] = useState("view-survey");
  const [currentPhase, setCurrentPhase] = useState(hasSubmitted ? "summary" : "start");

  const [demographics, setDemographics] = useState({
    ageRange: "", province: "", district: "", subdistrict: "", school: "",
  });

  const [round1Answers, setRound1Answers] = useState<Record<string, string>>({});
  const [round2Answers, setRound2Answers] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<any>(initialStats);
  const loadingStats = false;
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [formIncompleteMsg, setFormIncompleteMsg] = useState("");
  const [knownSchools, setKnownSchools] = useState<string[]>(initialSchools);
  const [showAllSchools, setShowAllSchools] = useState(false);
  const [openProvinces, setOpenProvinces] = useState<Record<string, boolean>>({});
  const [schoolTabMode, setSchoolTabMode] = useState<"province" | "all">("all");
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

  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    (knownSchools || []).forEach((s) => {
      const trimmed = s?.trim();
      if (trimmed) set.add(trimmed);
    });
    if (stats?.bySchool) {
      Object.keys(stats.bySchool).forEach((s) => {
        const trimmed = s?.trim();
        if (trimmed) set.add(trimmed);
      });
    }
    if (stats?.scoreBySchool) {
      Object.keys(stats.scoreBySchool).forEach((s) => {
        const trimmed = s?.trim();
        if (trimmed) set.add(trimmed);
      });
    }
    if (stats?.schoolsByProvince) {
      Object.values(stats.schoolsByProvince).forEach((provSchools: any) => {
        if (provSchools && typeof provSchools === "object") {
          Object.keys(provSchools).forEach((s) => {
            const trimmed = s?.trim();
            if (trimmed) set.add(trimmed);
          });
        }
      });
    }

    const all = Array.from(set).filter(Boolean);

    // If province is selected, prioritize schools from that province at the top
    if (demographics.province && stats?.schoolsByProvince?.[demographics.province]) {
      const provSchoolNames = new Set(
        Object.keys(stats.schoolsByProvince[demographics.province]).map((s) => s.trim())
      );
      const provList = all.filter((s) => provSchoolNames.has(s)).sort((a, b) => {
        const countA = stats?.schoolsByProvince?.[demographics.province]?.[a]?.count || stats?.bySchool?.[a] || 0;
        const countB = stats?.schoolsByProvince?.[demographics.province]?.[b]?.count || stats?.bySchool?.[b] || 0;
        return countB - countA || a.localeCompare(b, "th");
      });
      const otherList = all.filter((s) => !provSchoolNames.has(s)).sort((a, b) => {
        const countA = stats?.bySchool?.[a] || 0;
        const countB = stats?.bySchool?.[b] || 0;
        return countB - countA || a.localeCompare(b, "th");
      });
      return [...provList, ...otherList];
    }

    return all.sort((a, b) => {
      const countA = stats?.bySchool?.[a] || 0;
      const countB = stats?.bySchool?.[b] || 0;
      return countB - countA || a.localeCompare(b, "th");
    });
  }, [knownSchools, stats, demographics.province]);

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
      setTimeout(() => setErrors({}), 1500);
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
    })) {
      setFormIncompleteMsg("กรุณากรอกข้อมูลให้ครบถ้วนก่อนไปต่อ");
      setTimeout(() => setFormIncompleteMsg(""), 3000);
      return;
    }
    setFormIncompleteMsg("");
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
      setFormIncompleteMsg("กรุณาตอบคำถามให้ครบทุกข้อก่อนไปต่อ");
      setTimeout(() => {
        setErrors({});
        setFormIncompleteMsg("");
      }, 3000);
      return;
    }
    setFormIncompleteMsg("");
    if (currentPhase === "questions-r1") {
      setCurrentPhase("media");
    } else {
      finishSurvey();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const computeScore = (answers: Record<string, string>) =>
    KNOWLEDGE_ITEMS.filter((item) => answers[item.field] === item.correct).length;

  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [restoredNotification, setRestoredNotification] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const isSubmitted = localStorage.getItem("surveySubmitted") === "true";
    if (isSubmitted) {
      setCurrentPhase("summary");
      const lastSub = localStorage.getItem("last_submission");
      if (lastSub) {
        try {
          const parsed = JSON.parse(lastSub);
          if (parsed.round1Answers) setRound1Answers(parsed.round1Answers);
          if (parsed.round2Answers) setRound2Answers(parsed.round2Answers);
        } catch (e) {}
      }
    } else {
      const savedDraft = localStorage.getItem("survey_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          let restored = false;
          if (parsed.phase && parsed.phase !== "summary" && parsed.phase !== "start") {
            setCurrentPhase(parsed.phase);
            restored = true;
          }
          if (parsed.demographics && typeof parsed.demographics === "object") {
            setDemographics((prev) => ({ ...prev, ...parsed.demographics }));
            if (Object.values(parsed.demographics).some(Boolean)) restored = true;
          }
          if (parsed.round1Answers && typeof parsed.round1Answers === "object") {
            setRound1Answers(parsed.round1Answers);
            if (Object.keys(parsed.round1Answers).length > 0) restored = true;
          }
          if (parsed.round2Answers && typeof parsed.round2Answers === "object") {
            setRound2Answers(parsed.round2Answers);
            if (Object.keys(parsed.round2Answers).length > 0) restored = true;
          }
          if (restored) {
            setRestoredNotification(true);
          }
        } catch (e) {
          console.error("Failed to restore draft", e);
        }
      }
    }
    const savedView = localStorage.getItem("activeView");
    if (savedView) {
      setActiveView(savedView);
    }
    setIsDraftRestored(true);
  }, []);

  // Persist draft to prevent losing progress on refresh or accidental exit
  useEffect(() => {
    if (!isDraftRestored) return;
    if (localStorage.getItem("surveySubmitted") === "true") return;
    if (currentPhase === "summary") return;

    const hasData =
      currentPhase !== "start" ||
      Object.values(demographics).some(Boolean) ||
      Object.keys(round1Answers).length > 0 ||
      Object.keys(round2Answers).length > 0;

    if (hasData) {
      try {
        localStorage.setItem("survey_draft", JSON.stringify({
          phase: currentPhase,
          demographics,
          round1Answers,
          round2Answers,
        }));
      } catch (e) {}
    }
  }, [isDraftRestored, currentPhase, demographics, round1Answers, round2Answers]);

  const handleResetSurvey = () => {
    localStorage.removeItem("surveySubmitted");
    localStorage.removeItem("survey_draft");
    localStorage.removeItem("last_submission");
    document.cookie = "surveySubmitted=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setCurrentPhase("start");
    setDemographics({ ageRange: "", province: "", district: "", subdistrict: "", school: "" });
    setRound1Answers({});
    setRound2Answers({});
    setRestoredNotification(false);
  };

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  useEffect(() => {
    if (initialSchools && initialSchools.length > 0) {
      setKnownSchools((prev) => [...new Set([...prev, ...initialSchools.map((s) => s.trim()).filter(Boolean)])]);
    }
  }, [initialSchools]);

  const refreshFullStats = useCallback(async () => {
    try {
      const { data: statsData, error } = await supabase.from("survey_responses").select("*");
      if (!error && statsData) {
        const newStats: any = {
          total: 0,
          sumPreScore: 0,
          sumPostScore: 0,
          byProvince: {},
          byAge: {},
          bySchool: {},
          scoreByProvince: {},
          scoreBySchool: {},
          schoolsByProvince: {},
        };
        statsData.forEach((r: any) => {
          newStats.total++;
          newStats.sumPreScore += Number(r.pre_score) || 0;
          newStats.sumPostScore += Number(r.post_score) || 0;
          if (r.province) {
            newStats.byProvince[r.province] = (newStats.byProvince[r.province] || 0) + 1;
            if (!newStats.scoreByProvince[r.province]) {
              newStats.scoreByProvince[r.province] = { pre: 0, post: 0, count: 0 };
            }
            newStats.scoreByProvince[r.province].pre += Number(r.pre_score) || 0;
            newStats.scoreByProvince[r.province].post += Number(r.post_score) || 0;
            newStats.scoreByProvince[r.province].count += 1;
          }
          if (r.age_range) {
            newStats.byAge[r.age_range] = (newStats.byAge[r.age_range] || 0) + 1;
          }
          if (r.school) {
            newStats.bySchool[r.school] = (newStats.bySchool[r.school] || 0) + 1;
            if (!newStats.scoreBySchool[r.school]) {
              newStats.scoreBySchool[r.school] = { pre: 0, post: 0, count: 0 };
            }
            newStats.scoreBySchool[r.school].pre += Number(r.pre_score) || 0;
            newStats.scoreBySchool[r.school].post += Number(r.post_score) || 0;
            newStats.scoreBySchool[r.school].count += 1;

            const prov = (r.province && String(r.province).trim()) ? String(r.province).trim() : "ไม่ระบุจังหวัด";
            if (!newStats.schoolsByProvince[prov]) {
              newStats.schoolsByProvince[prov] = {};
            }
            if (!newStats.schoolsByProvince[prov][r.school]) {
              newStats.schoolsByProvince[prov][r.school] = { pre: 0, post: 0, count: 0 };
            }
            newStats.schoolsByProvince[prov][r.school].pre += Number(r.pre_score) || 0;
            newStats.schoolsByProvince[prov][r.school].post += Number(r.post_score) || 0;
            newStats.schoolsByProvince[prov][r.school].count += 1;
          }
        });
        const liveSchools = statsData
          .map((r: any) => r.school && String(r.school).trim())
          .filter(Boolean) as string[];
        if (liveSchools.length > 0) {
          setKnownSchools((prev) => [...new Set([...prev, ...liveSchools])]);
        }
        setStats(newStats);
      }
    } catch (err) {
      console.error("Live stats refresh error", err);
    }
  }, []);

  const refreshLiveCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("survey_responses")
        .select("*", { count: "exact", head: true });
      if (!error && typeof count === "number") {
        setStats((prev: any) => ({ ...prev, total: count }));
      }
    } catch (err) {
      console.error("Live count refresh error", err);
    }
  }, []);

  useEffect(() => {
    refreshLiveCount();
    const interval = setInterval(refreshLiveCount, 8000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshLiveCount();
        if (activeView === "view-stats") refreshFullStats();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    let channel: any;
    try {
      channel = supabase
        .channel("live_survey_counter")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "survey_responses" },
          () => {
            refreshLiveCount();
            refreshFullStats();
          }
        )
        .subscribe();
    } catch (e) {}

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refreshLiveCount, refreshFullStats, activeView]);

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    localStorage.setItem("activeView", viewId);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (viewId === "view-stats") {
      refreshFullStats();
    }
  };

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
      localStorage.setItem("last_submission", JSON.stringify({ round1Answers, round2Answers }));
      localStorage.removeItem("survey_draft");
      document.cookie = "surveySubmitted=true; path=/; max-age=31536000";
      setRestoredNotification(false);
      if (demographics.school && demographics.school.trim()) {
        const trimmed = demographics.school.trim();
        setKnownSchools((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed]);
      }
      
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

  const renderSchoolStatsByProvince = (
    schoolsByProvince: Record<string, Record<string, { pre: number; post: number; count: number }>> = {},
    fallbackScores: Record<string, { pre: number; post: number; count: number }> = {},
    fallbackCounts: Record<string, number> = {}
  ) => {
    let provinceData: Record<string, Record<string, { pre: number; post: number; count: number }>> = { ...(schoolsByProvince || {}) };
    const hasData = Object.keys(provinceData).length > 0 &&
      Object.values(provinceData).some((schs) => schs && Object.keys(schs).length > 0);

    if (!hasData) {
      if (fallbackScores && Object.keys(fallbackScores).length > 0) {
        provinceData["ทั่วไป / ไม่ระบุจังหวัด"] = fallbackScores;
      } else {
        return <p className="muted" style={{ padding: "16px 0", textAlign: "center" }}>ยังไม่มีข้อมูลโรงเรียนที่ตอบแบบสำรวจ</p>;
      }
    }

    type SchoolItem = {
      name: string;
      province: string;
      count: number;
      pre: number;
      post: number;
      avgPre: number;
      avgPost: number;
      diff: number;
    };

    type ProvinceGroup = {
      province: string;
      schools: SchoolItem[];
      totalCount: number;
      avgPost: number;
      avgGain: number;
    };

    const provinceGroups: ProvinceGroup[] = Object.entries(provinceData).map(([provName, schs]) => {
      const schools: SchoolItem[] = Object.entries(schs || {})
        .filter(([_, s]) => s && s.count > 0)
        .map(([schName, s]) => {
          const avgPre = s.count ? s.pre / s.count : 0;
          const avgPost = s.count ? s.post / s.count : 0;
          const diff = avgPost - avgPre;
          return {
            name: schName,
            province: provName,
            count: s.count,
            pre: s.pre,
            post: s.post,
            avgPre,
            avgPost,
            diff,
          };
        })
        .sort((a, b) => b.count - a.count || b.avgPost - a.avgPost);

      const totalCount = schools.reduce((sum, s) => sum + s.count, 0);
      const totalPost = schools.reduce((sum, s) => sum + s.post, 0);
      const totalPre = schools.reduce((sum, s) => sum + s.pre, 0);
      const avgPost = totalCount ? totalPost / totalCount : 0;
      const avgGain = totalCount ? (totalPost - totalPre) / totalCount : 0;

      return {
        province: provName,
        schools,
        totalCount,
        avgPost,
        avgGain,
      };
    })
    .filter((g) => g.schools.length > 0)
    .sort((a, b) => b.totalCount - a.totalCount);

    if (provinceGroups.length === 0) {
      return <p className="muted" style={{ padding: "16px 0", textAlign: "center" }}>ยังไม่มีข้อมูลโรงเรียนที่ตอบแบบสำรวจ</p>;
    }

    const allSchoolsNationwide: SchoolItem[] = provinceGroups
      .flatMap((g) => g.schools)
      .sort((a, b) => b.count - a.count || b.avgPost - a.avgPost);

    const totalSchoolCount = allSchoolsNationwide.length;
    const maxCount = Math.max(1, ...allSchoolsNationwide.map((s) => s.count));

    const isProvinceOpen = (provName: string, index: number) => {
      if (openProvinces[provName] !== undefined) return openProvinces[provName];
      return index === 0;
    };

    const toggleProvince = (provName: string, index: number) => {
      const current = isProvinceOpen(provName, index);
      setOpenProvinces((prev) => ({ ...prev, [provName]: !current }));
    };

    const expandAll = () => {
      const next: Record<string, boolean> = {};
      provinceGroups.forEach((g) => { next[g.province] = true; });
      setOpenProvinces(next);
    };

    const collapseAll = () => {
      const next: Record<string, boolean> = {};
      provinceGroups.forEach((g) => { next[g.province] = false; });
      setOpenProvinces(next);
    };

    return (
      <div className="school-stats-container">
        {/* Controls bar */}
        <div className="school-stats-toolbar">
          <div className="school-stats-tabs">
            <button
              type="button"
              className={`school-tab-btn ${schoolTabMode === "all" ? "active" : ""}`}
              onClick={() => setSchoolTabMode("all")}
            >
              <School size={13} /> ทุกโรงเรียนทั่วประเทศ ({totalSchoolCount})
            </button>
            <button
              type="button"
              className={`school-tab-btn ${schoolTabMode === "province" ? "active" : ""}`}
              onClick={() => setSchoolTabMode("province")}
            >
              <MapPin size={13} /> แยกตามจังหวัด ({provinceGroups.length})
            </button>
          </div>

          {schoolTabMode === "province" && (
            <div className="school-expand-btns">
              <button type="button" onClick={expandAll} className="btn-mini">
                ขยายทั้งหมด
              </button>
              <button type="button" onClick={collapseAll} className="btn-mini">
                หุบทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Nationwide all schools (default) */}
        {schoolTabMode === "all" && (
          <div className="province-schools-grid nationwide-grid">
            {allSchoolsNationwide.map((sch, idx) => {
              const barPct = Math.min(100, Math.max(8, (sch.count / maxCount) * 100));
              const diffText = sch.diff >= 0 ? `+${sch.diff.toFixed(2)}` : sch.diff.toFixed(2);
              const rankClass = idx === 0 ? "rank-gold" : idx === 1 ? "rank-silver" : idx === 2 ? "rank-bronze" : "rank-normal";

              return (
                <div className="province-school-card compact" key={`${sch.province}-${sch.name}`}>
                  <div className="sch-compact-row">
                    <div className="sch-compact-left">
                      <span className={`sch-rank-badge ${rankClass}`}>#{idx + 1}</span>
                      <div className="sch-name-wrap">
                        <span className="sch-name" title={sch.name}>{sch.name}</span>
                        {sch.province && (
                          <span className="sch-prov-tag">
                            <MapPin size={9} style={{ marginRight: 2 }} /> {sch.province}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sch-compact-right">
                      <span className="sch-count-tag">{sch.count} คน</span>
                      <div className={`sch-score-chip gain ${sch.diff >= 0 ? "positive" : "negative"}`} title="ยอดคะแนนที่เพิ่มขึ้น">
                        <TrendingUp size={11} />
                        <span className="val">{diffText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sch-compact-bar-row">
                    <span className="sch-bar-sub">
                      ก่อน <b>{sch.avgPre.toFixed(1)}</b> → หลัง <b style={{ color: "var(--good)" }}>{sch.avgPost.toFixed(1)}</b>
                    </span>
                    <div className="sch-bar-track">
                      <div
                        className="sch-bar-fill"
                        style={{ width: `${barPct}%` }}
                        title={`${sch.name}: ${sch.count} คน`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Grouped by Province */}
        {schoolTabMode === "province" && (
          <div className="province-accordion-list">
            {provinceGroups.map((group, groupIndex) => {
              const isOpen = isProvinceOpen(group.province, groupIndex);
              const gainSign = group.avgGain >= 0 ? `+${group.avgGain.toFixed(2)}` : group.avgGain.toFixed(2);

              return (
                <div className={`province-accordion-card ${isOpen ? "open" : ""}`} key={group.province}>
                  <button
                    type="button"
                    className="province-accordion-header"
                    onClick={() => toggleProvince(group.province, groupIndex)}
                    aria-expanded={isOpen}
                  >
                    <div className="prov-header-left">
                      <div className="prov-icon-wrap">
                        <MapPin size={14} />
                      </div>
                      <div className="prov-title-wrap">
                        <span className="prov-name">{group.province}</span>
                        <div className="prov-meta-tags">
                          <span className="prov-badge count">{group.totalCount} คน</span>
                          <span className="prov-badge schools">{group.schools.length} โรงเรียน</span>
                        </div>
                      </div>
                    </div>

                    <div className="prov-header-right">
                      <div className="prov-score-summary">
                        <span className={`prov-gain-score ${group.avgGain >= 0 ? "positive" : "negative"}`}>
                          <TrendingUp size={11} /> {gainSign}
                        </span>
                      </div>
                      <div className={`prov-chevron ${isOpen ? "open" : ""}`}>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="province-accordion-content">
                      <div className="province-schools-grid">
                        {group.schools.map((sch, schIdx) => {
                          const barPct = Math.min(100, Math.max(8, (sch.count / maxCount) * 100));
                          const diffText = sch.diff >= 0 ? `+${sch.diff.toFixed(2)}` : sch.diff.toFixed(2);
                          const rankClass = schIdx === 0 ? "rank-gold" : schIdx === 1 ? "rank-silver" : schIdx === 2 ? "rank-bronze" : "rank-normal";

                          return (
                            <div className="province-school-card compact" key={sch.name}>
                              <div className="sch-compact-row">
                                <div className="sch-compact-left">
                                  <span className={`sch-rank-badge ${rankClass}`}>#{schIdx + 1}</span>
                                  <div className="sch-name-wrap">
                                    <span className="sch-name" title={sch.name}>{sch.name}</span>
                                  </div>
                                </div>

                                <div className="sch-compact-right">
                                  <span className="sch-count-tag">{sch.count} คน</span>
                                  <div className={`sch-score-chip gain ${sch.diff >= 0 ? "positive" : "negative"}`} title="ยอดคะแนนที่เพิ่มขึ้น">
                                    <TrendingUp size={11} />
                                    <span className="val">{diffText}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="sch-compact-bar-row">
                                <span className="sch-bar-sub">
                                  ก่อน <b>{sch.avgPre.toFixed(1)}</b> → หลัง <b style={{ color: "var(--good)" }}>{sch.avgPost.toFixed(1)}</b>
                                </span>
                                <div className="sch-bar-track">
                                  <div
                                    className="sch-bar-fill"
                                    style={{ width: `${barPct}%` }}
                                    title={`${sch.name}: ${sch.count} คน`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSchoolScoreBarChart = (scoreBySchool: Record<string, { pre: number; post: number; count: number }>) => {
    const entries = Object.entries(scoreBySchool || {}).filter(([_, s]) => s && s.count > 0);
    if (entries.length === 0) {
      return <p className="muted">ยังไม่มีข้อมูลคะแนนแยกตามโรงเรียน</p>;
    }

    const sorted = [...entries].sort((a, b) => b[1].count - a[1].count || (b[1].post / b[1].count) - (a[1].post / a[1].count));
    const displayList = showAllSchools ? sorted : sorted.slice(0, 8);

    return (
      <div>
        <div className="chart-legend-row">
          <div className="legend-item">
            <span className="legend-bar-sample" style={{ background: "linear-gradient(90deg, #99d6dc, #4db5c2)" }} />
            <span>ก่อนดูสื่อ (Pre-test)</span>
          </div>
          <div className="legend-item">
            <span className="legend-bar-sample" style={{ background: "linear-gradient(90deg, #34d399, #10b981)" }} />
            <span>หลังดูสื่อ (Post-test)</span>
          </div>
          <div className="legend-item" style={{ marginLeft: "auto" }}>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>คะแนนเต็ม 5.0</span>
          </div>
        </div>

        <div className="school-compare-list">
          {displayList.map(([schoolName, s]) => {
            const avgPre = s.count ? s.pre / s.count : 0;
            const avgPost = s.count ? s.post / s.count : 0;
            const diff = avgPost - avgPre;
            const preWidth = Math.min(100, Math.max(5, (avgPre / 5) * 100));
            const postWidth = Math.min(100, Math.max(5, (avgPost / 5) * 100));

            return (
              <div className="school-compare-item" key={schoolName}>
                <div className="school-compare-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <School size={15} color="var(--ice-700)" />
                    <span className="school-name-text">{schoolName}</span>
                    <span className="school-count-badge">({s.count} คน)</span>
                  </div>
                  <div className="school-diff-badge">
                    <TrendingUp size={13} />
                    <span>{diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} คะแนน</span>
                  </div>
                </div>

                <div className="school-bars-stack">
                  {/* Pre bar */}
                  <div className="school-bar-row">
                    <span className="school-bar-tag">ก่อน</span>
                    <div className="school-bar-track">
                      <div className="school-bar-fill-pre" style={{ width: `${preWidth}%` }} />
                    </div>
                    <span className="school-bar-score" style={{ color: "var(--ice-700)" }}>
                      {avgPre.toFixed(2)}
                    </span>
                  </div>

                  {/* Post bar */}
                  <div className="school-bar-row">
                    <span className="school-bar-tag" style={{ color: "var(--good)" }}>หลัง</span>
                    <div className="school-bar-track">
                      <div className="school-bar-fill-post" style={{ width: `${postWidth}%` }} />
                    </div>
                    <span className="school-bar-score" style={{ color: "var(--good)" }}>
                      {avgPost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sorted.length > 8 && (
          <button
            type="button"
            className="btn-secondary"
            style={{ width: "100%", marginTop: 8, padding: "8px", fontSize: 12.5 }}
            onClick={() => setShowAllSchools((prev) => !prev)}
          >
            {showAllSchools ? "แสดงเฉพาะ 8 อันดับแรก" : `ดูโรงเรียนทั้งหมด (${sorted.length} โรงเรียน)`}
          </button>
        )}
      </div>
    );
  };

  const renderProvinceGainLineChart = (scoreByProvince: Record<string, { pre: number; post: number; count: number }>) => {
    const entries = Object.entries(scoreByProvince || {}).filter(([_, s]) => s && s.count > 0);
    if (entries.length === 0) {
      return <p className="muted">ยังไม่มีข้อมูลคะแนนแยกตามจังหวัด</p>;
    }

    const sorted = [...entries]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, s]) => {
        const avgPre = s.count ? s.pre / s.count : 0;
        const avgPost = s.count ? s.post / s.count : 0;
        const gain = Math.max(0, avgPost - avgPre);
        return {
          name,
          count: s.count,
          avgPre,
          avgPost,
          gain,
        };
      });

    const svgWidth = Math.max(500, sorted.length * 80);
    const svgHeight = 220;
    const padding = { left: 42, right: 36, top: 28, bottom: 44 };
    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = svgHeight - padding.top - padding.bottom;

    const getY = (val: number) => {
      const clamped = Math.min(5, Math.max(0, val));
      return padding.top + plotHeight * (1 - clamped / 5);
    };

    const getX = (i: number) => {
      if (sorted.length === 1) return padding.left + plotWidth / 2;
      return padding.left + (i / (sorted.length - 1)) * plotWidth;
    };

    const postPoints = sorted.map((p, i) => ({ x: getX(i), y: getY(p.avgPost), ...p }));
    const gainPoints = sorted.map((p, i) => ({ x: getX(i), y: getY(p.gain), ...p }));

    const postPathD = postPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
    const gainPathD = gainPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
    const areaD = postPoints.length > 0
      ? `${postPathD} L ${postPoints[postPoints.length - 1].x},${padding.top + plotHeight} L ${postPoints[0].x},${padding.top + plotHeight} Z`
      : "";

    const ticks = [0, 1, 2, 3, 4, 5];

    return (
      <div>
        <div className="chart-legend-row">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: "#10b981" }} />
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>คะแนนหลังดูสื่อ (Post-score)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: "#0284c7" }} />
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>ยอดคะแนนที่เพิ่มขึ้น (Score Gain)</span>
          </div>
          <div className="legend-item" style={{ marginLeft: "auto" }}>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>แกน Y: 0 – 5 คะแนน</span>
          </div>
        </div>

        <div className="line-chart-container">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="line-chart-svg" style={{ minWidth: svgWidth }}>
            <defs>
              <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines & Y ticks */}
            {ticks.map((t) => {
              const y = getY(t);
              return (
                <g key={t}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="rgba(15, 92, 107, 0.10)"
                    strokeDasharray={t === 0 ? "none" : "3 3"}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--ink-soft)"
                    fontWeight="500"
                  >
                    {t}
                  </text>
                </g>
              );
            })}

            {/* Gradient fill under post line */}
            {areaD && <path d={areaD} fill="url(#lineAreaGrad)" />}

            {/* Post line (Green) */}
            <path
              d={postPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Gain line (Blue dashed) */}
            <path
              d={gainPathD}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.6"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Post points */}
            {postPoints.map((pt, i) => (
              <g key={`post-pt-${i}`}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="#fff" stroke="#10b981" strokeWidth="3" />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight="700"
                  fill="#047857"
                >
                  {pt.avgPost.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Gain points */}
            {gainPoints.map((pt, i) => (
              <g key={`gain-pt-${i}`}>
                <circle cx={pt.x} cy={pt.y} r="4" fill="#fff" stroke="#0284c7" strokeWidth="2.5" />
                <text
                  x={pt.x}
                  y={pt.y + 17}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  fill="#0284c7"
                >
                  +{pt.gain.toFixed(1)}
                </text>
              </g>
            ))}

            {/* X-axis province names & respondent counts */}
            {sorted.map((p, i) => {
              const x = getX(i);
              return (
                <g key={`lbl-${p.name}`}>
                  <text
                    x={x}
                    y={svgHeight - 20}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="var(--ice-900)"
                  >
                    {p.name}
                  </text>
                  <text
                    x={x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--ink-soft)"
                  >
                    ({p.count} คน)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Quick Summary Grid for Mobile */}
        <div className="province-summary-grid">
          {sorted.map((p) => (
            <div className="province-summary-card" key={p.name}>
              <div className="province-summary-name">{p.name}</div>
              <div className="province-summary-sub">
                <span>หลังดู: <b style={{ color: "var(--good)" }}>{p.avgPost.toFixed(1)}</b></span>
                <span style={{ color: "#0284c7", fontWeight: 700 }}>+{p.gain.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TABS = [
    { id: "view-survey", label: "ทำแบบสำรวจ", icon: FileText },
    { id: "view-stats", label: "ดูสถิติ", icon: BarChart2 },
    { id: "view-knowledge", label: "ความรู้", icon: BookOpen },
    { id: "view-about", label: "เกี่ยวกับโครงงาน", icon: Info },
  ];

  const BrandSvg = () => (
    <svg width="36" height="36" viewBox="0 0 120 120" fill="none">
      <rect x="26" y="26" width="68" height="68" rx="20" fill="#eef9fa" stroke="#a9dfe4" strokeWidth="2.5"/>
      <circle cx="50" cy="56" r="4.5" fill="#0f5c6b"/>
      <circle cx="74" cy="56" r="4.5" fill="#0f5c6b"/>
      <path d="M48 70 Q62 80 78 70" stroke="#0f5c6b" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M40 96 Q40 108 32 112 Q44 112 46 100 Q48 108 58 108 Q50 100 52 92 Z" fill="#1b8a9e"/>
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
          {restoredNotification && currentPhase !== "start" && currentPhase !== "summary" && (
            <div style={{
              background: "var(--tint-a)",
              border: "1px solid var(--ice-200)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              fontSize: 12.5,
              color: "var(--ice-800)",
              animation: "fadeIn 0.3s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🔄</span>
                <span>กู้คืนข้อมูลขั้นตอนและคำตอบที่กรอกค้างไว้ให้อัตโนมัติ</span>
              </div>
              <button
                type="button"
                onClick={handleResetSurvey}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ink-soft)",
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "inherit",
                  padding: 0,
                  whiteSpace: "nowrap"
                }}
              >
                เริ่มใหม่ทั้งหมด
              </button>
            </div>
          )}

          {currentPhase === "start" && (
            <div className="hero" style={{ animation: "fadeIn 0.4s ease", minHeight: "68vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="mascot" style={{ display: "inline-block", marginBottom: 16 }}>
                <svg width="72" height="72" viewBox="0 0 120 120" fill="none">
                  <rect x="18" y="18" width="84" height="84" rx="26" fill="#eef9fa" stroke="#a9dfe4" strokeWidth="3"/>
                  <circle cx="46" cy="54" r="5.5" fill="#0f5c6b"/>
                  <circle cx="76" cy="54" r="5.5" fill="#0f5c6b"/>
                  <path d="M44 70 Q62 84 80 70" stroke="#0f5c6b" strokeWidth="5" strokeLinecap="round" fill="none"/>
                  <path d="M30 96 Q30 110 20 116 Q34 116 37 102 Q40 112 52 112 Q42 102 45 92 Z" fill="#1b8a9e"/>
                </svg>
              </div>
              <h1 style={{ marginTop: 8 }}>พร้อมจะทดสอบความเข้าใจเรื่องโลกร้อนหรือยัง?</h1>
              
              <div className="live-counter-badge" title="อัปเดตสถิติตามเวลาจริง">
                <span className="live-dot" />
                <span>มีผู้ร่วมทำแบบสำรวจแล้ว</span>
                <span className="live-counter-num">{stats?.total ?? 0}</span>
                <span>คน</span>
              </div>
              
              <div className="climate-strip" style={{ marginTop: 24, marginBottom: 28 }}>
                {CLIMATE_IMAGES.map((img) => (
                  <div className="climate-img-cell" key={img.src}>
                    <img src={img.src} alt={img.alt} loading="lazy" />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 6, padding: "0 16px", width: "100%", maxWidth: 400 }}>
                <button type="button" className="btn-primary" onClick={() => setCurrentPhase("demographics")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" }}>
                  เริ่มทำแบบสำรวจ <ArrowRight size={18} />
                </button>
              </div>
              <p className="privacy-note" style={{ marginTop: 16 }}>คำตอบของเธอจะถูกรวมเป็นสถิติภาพรวมที่ทุกคนเห็นได้ ไม่มีการเก็บชื่อจริง</p>
            </div>
          )}

          {currentPhase !== "start" && currentPhase !== "summary" && (
            <div id="progressWrap">
              <div className="progress-segments">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className={`progress-segment ${step <= progressStep ? "filled" : ""}`} />
                ))}
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
                    options={schoolOptions}
                    value={demographics.school}
                    onChange={(v) => setDemographics({ ...demographics, school: v })}
                    placeholder="เช่น โรงเรียนภูเขียว"
                    invalid={errors.school}
                    allowCustom={true}
                  />
                </div>
              )}
              {formIncompleteMsg && currentPhase === "demographics" && (
                <div style={{ background: "rgba(224,100,74,0.12)", border: "1px solid var(--danger)", color: "var(--danger)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 16, animation: "fadeIn 0.25s ease" }}>
                  {formIncompleteMsg}
                </div>
              )}

              <div className="form-nav-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setCurrentPhase("start"); scrollToTop(); }}
                >
                  <ArrowLeft size={16} /> ย้อนกลับ
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleDemographicsNext}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  ถัดไป <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {(currentPhase === "questions-r1" || currentPhase === "questions-r2") && (
            <div className="phase active card">
              <div className="phase-header-with-back">
                <span className={`round-badge ${currentPhase === "questions-r1" ? "pre" : "post"}`}>
                  {currentPhase === "questions-r1" ? "ก่อนดูคลิปและโปสเตอร์" : "หลังดูคลิปและโปสเตอร์"}
                </span>
                <button
                  type="button"
                  className="btn-back-link"
                  onClick={() => {
                    if (currentPhase === "questions-r1") setCurrentPhase("demographics");
                    else setCurrentPhase("media");
                    scrollToTop();
                  }}
                >
                  <ArrowLeft size={15} /> ย้อนกลับ
                </button>
              </div>
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
              
              {formIncompleteMsg && (currentPhase === "questions-r1" || currentPhase === "questions-r2") && (
                <div style={{ background: "rgba(224,100,74,0.12)", border: "1px solid var(--danger)", color: "var(--danger)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 14, animation: "fadeIn 0.25s ease" }}>
                  {formIncompleteMsg}
                </div>
              )}

              <div className="form-nav-group" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (currentPhase === "questions-r1") setCurrentPhase("demographics");
                    else setCurrentPhase("media");
                    scrollToTop();
                  }}
                >
                  <ArrowLeft size={16} /> ย้อนกลับ
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleQuestionsSubmit}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {currentPhase === "questions-r1"
                    ? <>ส่งคำตอบรอบแรก <ArrowRight size={18} /></>
                    : <>ส่งคำตอบรอบสุดท้าย <CheckCircle size={18} /></>}
                </button>
              </div>
            </div>
          )}

          {currentPhase === "media" && (
            <div className="phase active card">
              <div className="phase-header-with-back" style={{ marginBottom: 12 }}>
                <span className="round-badge pre">
                  สื่อการเรียนรู้
                </span>
                <button
                  type="button"
                  className="btn-back-link"
                  onClick={() => { setCurrentPhase("questions-r1"); scrollToTop(); }}
                >
                  <ArrowLeft size={15} /> ย้อนกลับ
                </button>
              </div>

              <h2>ก่อนตอบอีกรอบ ลองดูคลิปกับโปสเตอร์นี้ก่อนนะ</h2>

              <div style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => { setCurrentPhase("questions-r2"); scrollToTop(); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: "14px 20px",
                    fontSize: 15,
                    boxShadow: "0 4px 14px rgba(15,92,107,0.22)"
                  }}
                >
                  ถัดไป <ArrowRight size={18} />
                </button>
              </div>
              <div className="media-block">
                <div className="media-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Video size={16} /> คลิปวิดีโอรณรงค์</div>
                <div className="video-frame">
                  {VIDEO_YOUTUBE_ID ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${VIDEO_YOUTUBE_ID}`}
                      title="คลิปวิดีโอรณรงค์"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
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
                  <img src="/poster.png" alt="โปสเตอร์ น้ำแข็งขั้วโลกละลาย ไกลจริงหรือ?"
                    onError={(e) => {
                      const t = e.currentTarget; t.style.display = "none";
                      const n = t.nextElementSibling as HTMLElement;
                      if (n) n.style.display = "flex";
                    }} />
                  <div style={{ display: "none", background: "var(--tint-a)", padding: "32px 20px", borderRadius: "var(--radius-md)", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
                    <div style={{ color: "var(--ice-500)" }}><ImageIcon size={40} /></div>
                    <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 13 }}>วางไฟล์โปสเตอร์ที่ <code>public/poster.png</code></p>
                  </div>
                </div>
              </div>
              <div className="form-nav-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setCurrentPhase("questions-r1"); scrollToTop(); }}
                >
                  <ArrowLeft size={16} /> ย้อนกลับ
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => { setCurrentPhase("questions-r2"); scrollToTop(); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  ถัดไป <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {currentPhase === "summary" && (() => {
            const hasAnswers = Object.keys(round1Answers).length > 0;
            const pre = computeScore(round1Answers);
            const post = computeScore(round2Answers);
            const diff = post - pre;
            return (
              <div className="phase active card" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="summary-icon" style={{ color: "var(--ice-500)", display: "flex", justifyContent: "center", marginBottom: 12, marginInline: "auto" }}><Award size={40} /></div>
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
                  <button type="button" className="btn-primary" onClick={() => handleViewChange("view-stats")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>ดูสถิติภาพรวมของทุกคน <ArrowRight size={18} /></button>
                  <button type="button" onClick={handleResetSurvey} style={{ background: "transparent", border: "1px solid var(--mist)", padding: "12px", borderRadius: "999px", color: "var(--ink-soft)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>ทำแบบสำรวจใหม่อีกครั้ง</button>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ======================== STATS VIEW ======================== */}
      {activeView === "view-stats" && (
        <section className="view active full-bleed-mobile">
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

                {/* 1. โรงเรียน / สถาบันที่ตอบเยอะที่สุด */}
                <div className="stat-card white full-width">
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <Award size={18} color="var(--ice-600)" /> โรงเรียน / สถาบันที่ตอบเยอะที่สุด
                    </h3>
                  </div>
                  {renderSchoolStatsByProvince(stats.schoolsByProvince || {}, stats.scoreBySchool || {}, stats.bySchool || {})}
                </div>

                {/* 2. จังหวัดที่ตอบเยอะที่สุด */}
                <div className="stat-card tint-a">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={16}/> จังหวัดที่ตอบเยอะที่สุด
                  </h3>
                  {renderDetailedBarChart(stats.byProvince || {}, stats.scoreByProvince || {}, 5)}
                </div>

                {/* 3. ช่วงอายุของผู้ตอบ */}
                <div className="stat-card tint-a">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={16}/> ช่วงอายุของผู้ตอบ
                  </h3>
                  {renderBarChart(stats.byAge || {}, 7)}
                </div>

                {/* 4. แผนที่จังหวัดที่ตอบแบบสำรวจ */}
                <div className="stat-card white full-width">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={16}/> แผนที่จังหวัดที่ตอบแบบสำรวจ
                  </h3>
                  <ThailandMap countByProvince={stats.byProvince || {}} />
                </div>

                {/* 5. ใต้แผนที่: กราฟแท่งเปรียบเทียบคะแนนก่อน-หลังแต่ละโรงเรียน */}
                <div className="stat-card white full-width">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BarChart2 size={16}/> เปรียบเทียบคะแนนก่อน - หลัง แต่ละโรงเรียน / สถาบัน
                  </h3>
                  {renderSchoolScoreBarChart(stats.scoreBySchool || {})}
                </div>

                {/* 6. กราฟเส้นแสดงคะแนนหลังและยอดคะแนนที่เพิ่มขึ้นแยกจังหวัด */}
                <div className="stat-card white full-width">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={16}/> คะแนนหลังและยอดคะแนนที่เพิ่มขึ้น แยกตามจังหวัด
                  </h3>
                  {renderProvinceGainLineChart(stats.scoreByProvince || {})}
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
        <section className="view active full-bleed-mobile">
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

            {/* ======================== SDGs SECTION ======================== */}
            <div className="about-section" style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <Globe size={18} color="#007dbb" /> เป้าหมายการพัฒนาที่ยั่งยืน (SDGs) กับโครงงานนี้
                </h3>
                <span className="sdg-un-tag">UN 2030 Agenda</span>
              </div>
              
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 14 }}>
                <strong>เป้าหมายการพัฒนาที่ยั่งยืน (Sustainable Development Goals: SDGs)</strong> คือ 17 เป้าหมายระดับโลกที่องค์การสหประชาชาติ (UN) ร่วมกับ 193 ประเทศสมาชิกกำหนดขึ้นเป็นวาระการพัฒนาปี 2030 เพื่อร่วมกันแก้ไขปัญหาความยากจน ความไม่เท่าเทียม และวิกฤตสิ่งแวดล้อมเพื่ออนาคตของมนุษยชาติ
              </p>

              <div className="sdg-intro-box">
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ice-800)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Target size={16} color="var(--ice-700)" /> โครงงาน "ไกลแค่ไหนก็ท่วมถึง" ตรงกับ SDGs ข้อไหนบ้าง?
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.6 }}>
                  โครงงานนี้สอดคล้องโดยตรงกับ <strong>4 เป้าหมายการพัฒนาที่ยั่งยืน</strong> โดยมี <b>SDG 13 (Climate Action)</b> เป็นเป้าหมายหลักในการรณรงค์และวัดผล:
                </div>
              </div>

              <div className="sdg-grid">
                {/* SDG 13 */}
                <div className="sdg-card sdg-highlight">
                  <div className="sdg-header">
                    <span className="sdg-badge" style={{ background: "#3F7E44", color: "#fff" }}>SDG 13</span>
                    <span className="sdg-core-label">★ เป้าหมายหลักของโครงงาน</span>
                  </div>
                  <div className="sdg-title" style={{ color: "#2d6332" }}>
                    การรับมือกับการเปลี่ยนแปลงสภาพภูมิอากาศ (Climate Action)
                  </div>
                  <p className="sdg-desc">
                    สร้างความตระหนักรู้ต่อวิกฤตน้ำแข็งขั้วโลกละลาย (Polar Ice Melt) และภาวะโลกร้อนที่ส่งผลกระทบต่อเนื่องจนระดับน้ำทะเลเพิ่มสูงขึ้นและเสี่ยงท่วมประเทศไทย
                  </p>
                  <div className="sdg-target">
                    <strong>เป้าหมายย่อย 13.3:</strong> พัฒนาการศึกษา การสร้างความตระหนักรู้ และขีดความสามารถของมนุษย์ในการลดผลกระทบ การปรับตัว และการเตือนภัยล่วงหน้าด้านสภาพภูมิอากาศ
                  </div>
                </div>

                {/* SDG 14 */}
                <div className="sdg-card">
                  <div className="sdg-header">
                    <span className="sdg-badge" style={{ background: "#0A97D9", color: "#fff" }}>SDG 14</span>
                  </div>
                  <div className="sdg-title" style={{ color: "#0877ab" }}>
                    การใช้ประโยชน์จากมหาสมุทรและทรัพยากรทางทะเล (Life Below Water)
                  </div>
                  <p className="sdg-desc">
                    การละลายของธารน้ำแข็งและแผ่นน้ำแข็งส่งผลให้อุณหภูมิและกระแสน้ำในมหาสมุทรแปรปรวน มหาสมุทรเป็นกรดมากขึ้น และคุกคามระบบนิเวศทางทะเลทั่วโลก
                  </p>
                  <div className="sdg-target">
                    <strong>เป้าหมายย่อย 14.2 & 14.3:</strong> ปกป้องและฟื้นฟูระบบนิเวศทางทะเลและชายฝั่งอย่างยั่งยืน พร้อมทั้งรับมือกับภาวะมหาสมุทรเป็นกรด (Ocean Acidification)
                  </div>
                </div>

                {/* SDG 11 */}
                <div className="sdg-card">
                  <div className="sdg-header">
                    <span className="sdg-badge" style={{ background: "#F99D26", color: "#fff" }}>SDG 11</span>
                  </div>
                  <div className="sdg-title" style={{ color: "#c67006" }}>
                    เมืองและถิ่นฐานมนุษย์อย่างยั่งยืน (Sustainable Cities & Communities)
                  </div>
                  <p className="sdg-desc">
                    ชี้ให้เห็นความเสี่ยงของกรุงเทพฯ และชุมชนริมชายฝั่งทะเลของไทยที่เสี่ยงจมน้ำถาวรภายในปี 2050 เพื่อกระตุ้นการวางผังเมือง การป้องกันน้ำท่วม และการตั้งรับปรับตัวของเมือง
                  </p>
                  <div className="sdg-target">
                    <strong>เป้าหมายย่อย 11.5 & 11.b:</strong> ลดผลกระทบและความเสียหายจากภัยพิบัติที่เกี่ยวกับน้ำ และเสริมสร้างขีดความสามารถในการฟื้นตัว (Resilience) ของชุมชนเมือง
                  </div>
                </div>

                {/* SDG 4 */}
                <div className="sdg-card">
                  <div className="sdg-header">
                    <span className="sdg-badge" style={{ background: "#C5192D", color: "#fff" }}>SDG 4</span>
                  </div>
                  <div className="sdg-title" style={{ color: "#9f1222" }}>
                    การศึกษาที่มีคุณภาพและเท่าเทียม (Quality Education)
                  </div>
                  <p className="sdg-desc">
                    ใช้นวัตกรรมดิจิทัล สถิติแบบ Interactive และแบบทดสอบก่อน-หลังเพื่อวัดผลการเรียนรู้จริง ส่งเสริมการเรียนรู้วิทยาศาสตร์โลกและดาราศาสตร์สู่การนำไปใช้ในชีวิตประจำวัน
                  </p>
                  <div className="sdg-target">
                    <strong>เป้าหมายย่อย 4.7:</strong> สร้างหลักประกันว่าผู้เรียนได้รับความรู้และทักษะที่จำเป็นในการส่งเสริมการพัฒนาที่ยั่งยืน (Education for Sustainable Development : ESD)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================== ABOUT VIEW ======================== */}
      {activeView === "view-about" && (
        <section className="view active full-bleed-mobile">
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
              <li><strong>ข้อมูลที่เก็บ:</strong> ช่วงอายุ, จังหวัด, อำเภอ/เขต, ตำบล/แขวง, ชื่อโรงเรียน / สถาบัน, คำตอบแบบสำรวจ, คะแนนก่อน-หลัง</li>
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
              <rect x="18" y="18" width="84" height="84" rx="26" fill="#eef9fa" stroke="#a9dfe4" strokeWidth="3"/>
              <circle cx="46" cy="54" r="5" fill="#0f5c6b"/>
              <circle cx="76" cy="54" r="5" fill="#0f5c6b"/>
              <path d="M44 70 Q62 82 80 70" stroke="#0f5c6b" strokeWidth="5" strokeLinecap="round" fill="none"/>
              <path d="M32 96 Q32 108 22 114 Q36 114 39 100 Q42 110 54 110 Q44 100 47 90 Z" fill="#1b8a9e"/>
            </svg>
            <div className="sidebar-brand-text">ไกลแค่ไหน<br/>ก็ท่วมถึง</div>
          </div>
          <nav className="sidebar-tabs">
            {TABS.map((t) => (
              <button key={t.id}
                className={`sidebar-tab${activeView === t.id ? " active" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                onClick={() => handleViewChange(t.id)}
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
              <rect x="26" y="26" width="68" height="68" rx="20" fill="#eef9fa" stroke="#a9dfe4" strokeWidth="2.5"/>
              <circle cx="50" cy="56" r="4.5" fill="#0f5c6b"/>
              <circle cx="74" cy="56" r="4.5" fill="#0f5c6b"/>
              <path d="M48 70 Q62 80 78 70" stroke="#0f5c6b" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M40 96 Q40 108 32 112 Q44 112 46 100 Q48 108 58 108 Q50 100 52 92 Z" fill="#1b8a9e"/>
            </svg>
            <span style={{ color: "#ffffff", fontWeight: 800, textShadow: "0 2px 8px rgba(3,25,32,0.75)" }}>ไกลแค่ไหน<br/>ก็ท่วมถึง</span>
          </div>
        </div>
        {renderMainContent()}
        <div className="mobile-bottom-bar">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`tab${activeView === t.id ? " active" : ""}`}
                onClick={() => { handleViewChange(t.id); scrollToTop(); }}><t.icon size={22} /> <span style={{fontSize: '10px'}}>{t.label}</span></button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Wave layer (decorative, pinned to bottom) ===== */}
      <div className="wave-bg" aria-hidden="true">
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,80 C180,120 360,40 540,80 C720,120 900,40 1080,80 C1260,120 1440,40 1440,80 L1440,160 L0,160 Z" fill="rgba(255,255,255,0.08)"/>
          <path d="M0,100 C240,60 480,140 720,100 C960,60 1200,140 1440,100 L1440,160 L0,160 Z" fill="rgba(255,255,255,0.06)"/>
          <path d="M0,120 C200,90 400,150 600,120 C800,90 1000,150 1200,120 C1300,105 1380,115 1440,120 L1440,160 L0,160 Z" fill="rgba(255,255,255,0.12)"/>
        </svg>
      </div>
    </>
  );
}

