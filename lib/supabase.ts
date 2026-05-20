import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for database tables
export interface AnalysisRecord {
  id?: string;
  project_id: string;
  analysis_date: string;
  report_date: string;
  trust_score: number;
  grade: string;
  status: string;
  data: Record<string, unknown>;
  created_at?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  token: string;
  type: string;
  last_analysis: string;
  market_cap: number;
}

// Database operations
export async function saveAnalysis(analysis: AnalysisRecord) {
  const { data, error } = await supabase
    .from('analyses')
    .upsert({
      project_id: analysis.project_id,
      analysis_date: analysis.analysis_date,
      report_date: analysis.report_date,
      trust_score: analysis.trust_score,
      grade: analysis.grade,
      status: analysis.status,
      data: analysis.data,
    }, {
      onConflict: 'project_id,analysis_date'
    });

  if (error) throw error;
  return data;
}

export async function getLatestAnalysis(projectId: string) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('project_id', projectId)
    .order('analysis_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateProjectLastAnalysis(projectId: string, date: string) {
  const { error } = await supabase
    .from('projects')
    .update({ last_analysis: date })
    .eq('id', projectId);

  if (error) throw error;
}
