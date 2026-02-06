export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_log: {
        Row: {
          agent_slug: string
          category: string
          created_at: string | null
          details: Json | null
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          summary: string
          tags: string[] | null
        }
        Insert: {
          agent_slug: string
          category: string
          created_at?: string | null
          details?: Json | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          summary: string
          tags?: string[] | null
        }
        Update: {
          agent_slug?: string
          category?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          summary?: string
          tags?: string[] | null
        }
        Relationships: []
      }
      agent_registry: {
        Row: {
          agent_type: string
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_type?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_type?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          picked_up_by: string | null
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          result_summary: string | null
          status: string
          tags: string[] | null
          target_agent: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          picked_up_by?: string | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          result_summary?: string | null
          status?: string
          tags?: string[] | null
          target_agent?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          picked_up_by?: string | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          result_summary?: string | null
          status?: string
          tags?: string[] | null
          target_agent?: string | null
          title?: string
        }
        Relationships: []
      }
      content_sections: {
        Row: {
          content: string
          created_at: string | null
          date: string | null
          entity_id: string
          entity_type: string
          id: string
          is_private: boolean | null
          section_type: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_private?: boolean | null
          section_type: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_private?: boolean | null
          section_type?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      context_store: {
        Row: {
          content: Json
          key: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          key: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations_log: {
        Row: {
          category: string | null
          created_at: string | null
          date: string
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          summary: string
          tags: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          summary: string
          tags?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          summary?: string
          tags?: string[] | null
        }
        Relationships: []
      }
      initiatives: {
        Row: {
          created_at: string | null
          id: string
          objective: string | null
          owner_id: string | null
          priority: string | null
          slug: string
          start_date: string | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          objective?: string | null
          owner_id?: string | null
          priority?: string | null
          slug: string
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          objective?: string | null
          owner_id?: string | null
          priority?: string | null
          slug?: string
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          why_it_matters?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string | null
          date: string
          discussion_notes: string | null
          id: string
          meeting_type: string | null
          private_notes: string | null
          purpose: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          discussion_notes?: string | null
          id?: string
          meeting_type?: string | null
          private_notes?: string | null
          purpose?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          discussion_notes?: string | null
          id?: string
          meeting_type?: string | null
          private_notes?: string | null
          purpose?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      people: {
        Row: {
          created_at: string | null
          current_focus: string | null
          department: string | null
          email: string | null
          growth_areas: string[] | null
          id: string
          name: string
          relationship_notes: string | null
          reports_to_id: string | null
          role: string | null
          slack: string | null
          slug: string
          started_date: string | null
          status: string | null
          strengths: string[] | null
          team_id: string | null
          type: string
          updated_at: string | null
          working_style: string | null
        }
        Insert: {
          created_at?: string | null
          current_focus?: string | null
          department?: string | null
          email?: string | null
          growth_areas?: string[] | null
          id?: string
          name: string
          relationship_notes?: string | null
          reports_to_id?: string | null
          role?: string | null
          slack?: string | null
          slug: string
          started_date?: string | null
          status?: string | null
          strengths?: string[] | null
          team_id?: string | null
          type: string
          updated_at?: string | null
          working_style?: string | null
        }
        Update: {
          created_at?: string | null
          current_focus?: string | null
          department?: string | null
          email?: string | null
          growth_areas?: string[] | null
          id?: string
          name?: string
          relationship_notes?: string | null
          reports_to_id?: string | null
          role?: string | null
          slack?: string | null
          slug?: string
          started_date?: string | null
          status?: string | null
          strengths?: string[] | null
          team_id?: string | null
          type?: string
          updated_at?: string | null
          working_style?: string | null
        }
        Relationships: []
      }
      ppp_reports: {
        Row: {
          created_at: string | null
          id: string
          overall_summary: string | null
          private_notes: string | null
          updated_at: string | null
          week_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          overall_summary?: string | null
          private_notes?: string | null
          updated_at?: string | null
          week_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          overall_summary?: string | null
          private_notes?: string | null
          updated_at?: string | null
          week_date?: string
        }
        Relationships: []
      }
      ppp_sections: {
        Row: {
          contributors: string[] | null
          created_at: string | null
          id: string
          lead_id: string | null
          quality_notes: string | null
          quality_score: number | null
          raw_text: string | null
          report_id: string
          status: string | null
          summary: string | null
          tags: string[] | null
          workstream_name: string
        }
        Insert: {
          contributors?: string[] | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          quality_notes?: string | null
          quality_score?: number | null
          raw_text?: string | null
          report_id: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          workstream_name: string
        }
        Update: {
          contributors?: string[] | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          quality_notes?: string | null
          quality_score?: number | null
          raw_text?: string | null
          report_id?: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          workstream_name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          created_date: string | null
          description: string | null
          due_date: string | null
          id: string
          initiative_id: string | null
          owner_id: string | null
          parent_task_id: string | null
          priority: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id?: string | null
          owner_id?: string | null
          parent_task_id?: string | null
          priority?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id?: string | null
          owner_id?: string | null
          parent_task_id?: string | null
          priority?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          leader_id: string | null
          mission: string | null
          name: string
          north_star_metric: string | null
          scope: string[] | null
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          leader_id?: string | null
          mission?: string | null
          name: string
          north_star_metric?: string | null
          scope?: string[] | null
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          leader_id?: string | null
          mission?: string | null
          name?: string
          north_star_metric?: string | null
          scope?: string[] | null
          slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_org_tree: {
        Row: {
          current_focus: string | null
          department: string | null
          growth_areas: string[] | null
          id: string | null
          name: string | null
          relationship_notes: string | null
          reports_to_name: string | null
          reports_to_slug: string | null
          role: string | null
          slug: string | null
          status: string | null
          strengths: string[] | null
          team_name: string | null
          team_slug: string | null
          type: string | null
          working_style: string | null
        }
        Relationships: []
      }
      v_ppp_swimlanes: {
        Row: {
          contributors: string[] | null
          lead_name: string | null
          lead_slug: string | null
          quality_notes: string | null
          quality_score: number | null
          raw_text: string | null
          report_id: string | null
          report_summary: string | null
          section_id: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          week_date: string | null
          workstream_name: string | null
        }
        Relationships: []
      }
      v_team_overview: {
        Row: {
          id: string | null
          leader_name: string | null
          leader_slug: string | null
          member_count: number | null
          members: string[] | null
          mission: string | null
          name: string | null
          north_star_metric: string | null
          scope: string[] | null
          slug: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      search_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          entity_id: string
          entity_type: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Common entity types
export type Person = Tables<'people'>
export type Team = Tables<'teams'>
export type Meeting = Tables<'meetings'>
export type Task = Tables<'tasks'>
export type Initiative = Tables<'initiatives'>
export type PPPReport = Tables<'ppp_reports'>
export type PPPSection = Tables<'ppp_sections'>
export type AgentLog = Tables<'agent_log'>
export type AgentTask = Tables<'agent_tasks'>
export type ContentSection = Tables<'content_sections'>

// View types
export type OrgTreePerson = Views<'v_org_tree'>
export type PPPSwimlane = Views<'v_ppp_swimlanes'>
export type TeamOverview = Views<'v_team_overview'>

// Enum-like constants
export const PersonType = {
  DIRECT_REPORT: 'direct-report',
  SKIP_LEVEL: 'skip-level',
  INTERNAL: 'internal',
  EXTERNAL: 'external',
  LEADERSHIP: 'leadership',
} as const

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  BLOCKED: 'blocked',
  DONE: 'done',
} as const

export const PPPStatus = {
  ON_TRACK: 'on-track',
  POTENTIAL_ISSUES: 'potential-issues',
  AT_RISK: 'at-risk',
  NA: 'na',
} as const

export const AgentLogCategory = {
  OBSERVATION: 'observation',
  FINDING: 'finding',
  ERROR: 'error',
  RECOMMENDATION: 'recommendation',
  DECISION: 'decision',
} as const
