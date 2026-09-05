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
    q1Pre: {}, q1Post: {}, 
    q2Pre: {}, q2Post: {} 
  };
  
  try {
    const { data: statsData } = await supabase.from("survey_responses").select("*");
    if (statsData) {
      statsData.forEach((r: any) => {
        initialStats.total++;
        initialStats.sumPreScore += r.pre_score;
        initialStats.sumPostScore += r.post_score;
        if (r.province) initialStats.byProvince[r.province] = (initialStats.byProvince[r.province] || 0) + 1;
        if (r.age_range) initialStats.byAge[r.age_range] = (initialStats.byAge[r.age_range] || 0) + 1;
        if (r.school) initialStats.bySchool[r.school] = (initialStats.bySchool[r.school] || 0) + 1;
      });
    }
  } catch (err) {}

  return <ClientPage initialSchools={knownSchools} initialStats={initialStats} />;
}
