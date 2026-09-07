import ClientPage from "./ClientPage";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

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
        if (r.age_range) initialStats.byAge[r.age_range] = (initialStats.byAge[r.age_range] || 0) + 1;
        if (r.school) {
          initialStats.bySchool[r.school] = (initialStats.bySchool[r.school] || 0) + 1;
          if (!initialStats.scoreBySchool[r.school]) initialStats.scoreBySchool[r.school] = { pre: 0, post: 0, count: 0 };
          initialStats.scoreBySchool[r.school].pre += r.pre_score;
          initialStats.scoreBySchool[r.school].post += r.post_score;
          initialStats.scoreBySchool[r.school].count += 1;
        }
      });
    }
  } catch (err) {}

  return <ClientPage initialSchools={knownSchools} initialStats={initialStats} />;
}
