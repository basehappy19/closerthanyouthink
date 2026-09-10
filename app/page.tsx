import ClientPage from "./ClientPage";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export function normalizeAgeRange(rawAge: string): string {
  if (!rawAge) return "";
  const s = String(rawAge).trim().replace(/-/g, "–");
  if (s === "15–18 ปี") return "16–18 ปี";
  if (s === "19–22 ปี") return "19–25 ปี";
  if (s === "ต่ำกว่า 15 ปี" || s === "ต่ำกว่า 15") return "12–15 ปี";
  return s;
}

export default async function Page() {
  let knownSchools: string[] = [];
  try {
    const { data: schoolsData } = await supabase.from("survey_responses").select("school");
    if (schoolsData) {
      knownSchools = [...new Set(schoolsData.map((r: any) => r.school).filter(Boolean))].sort() as string[];
    }
  } catch (err) {}

  let initialStats: any = { 
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
  
  try {
    const { data: statsData } = await supabase.from("survey_responses").select("*");
    if (statsData) {
      statsData.forEach((r: any) => {
        initialStats.total++;
        initialStats.sumPreScore += r.pre_score;
        initialStats.sumPostScore += r.post_score;
        if (r.province) {
          initialStats.byProvince[r.province] = (initialStats.byProvince[r.province] || 0) + 1;
          if (!initialStats.scoreByProvince[r.province]) initialStats.scoreByProvince[r.province] = { pre: 0, post: 0, count: 0 };
          initialStats.scoreByProvince[r.province].pre += r.pre_score;
          initialStats.scoreByProvince[r.province].post += r.post_score;
          initialStats.scoreByProvince[r.province].count += 1;
        }
        if (r.age_range) {
          const normAge = normalizeAgeRange(r.age_range);
          if (normAge) {
            initialStats.byAge[normAge] = (initialStats.byAge[normAge] || 0) + 1;
          }
        }
        if (r.school) {
          initialStats.bySchool[r.school] = (initialStats.bySchool[r.school] || 0) + 1;
          if (!initialStats.scoreBySchool[r.school]) initialStats.scoreBySchool[r.school] = { pre: 0, post: 0, count: 0 };
          initialStats.scoreBySchool[r.school].pre += r.pre_score;
          initialStats.scoreBySchool[r.school].post += r.post_score;
          initialStats.scoreBySchool[r.school].count += 1;

          const prov = (r.province && String(r.province).trim()) ? String(r.province).trim() : "ไม่ระบุจังหวัด";
          if (!initialStats.schoolsByProvince[prov]) {
            initialStats.schoolsByProvince[prov] = {};
          }
          if (!initialStats.schoolsByProvince[prov][r.school]) {
            initialStats.schoolsByProvince[prov][r.school] = { pre: 0, post: 0, count: 0 };
          }
          initialStats.schoolsByProvince[prov][r.school].pre += r.pre_score;
          initialStats.schoolsByProvince[prov][r.school].post += r.post_score;
          initialStats.schoolsByProvince[prov][r.school].count += 1;
        }
      });
      const allUnique = [
        ...knownSchools,
        ...Object.keys(initialStats.bySchool || {}),
        ...statsData.map((r: any) => r.school && String(r.school).trim()).filter(Boolean)
      ];
      knownSchools = [...new Set(allUnique)].sort((a, b) => a.localeCompare(b, "th"));
    }
  } catch (err) {}

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const hasSubmitted = cookieStore.get("surveySubmitted")?.value === "true";

  return <ClientPage initialSchools={knownSchools} initialStats={initialStats} hasSubmitted={hasSubmitted} />;
}
