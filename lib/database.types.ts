export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
          due_date: string | null
          id: string
          parent_task_id: string | null
          picked_up_by: string | null
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          result_details: Json | null
          result_summary: string | null
          status: string
          tags: string[] | null
          target_agent: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          picked_up_by?: string | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          result_details?: Json | null
          result_summary?: string | null
          status?: string
          tags?: string[] | null
          target_agent?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          picked_up_by?: string | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          result_details?: Json | null
          result_summary?: string | null
          status?: string
          tags?: string[] | null
          target_agent?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "v_agent_tasks_dashboard"
            referencedColumns: ["id"]
          },
        ]
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
      embeddings: {
        Row: {
          chunk_index: number | null
          chunk_text: string
          content_section_id: string | null
          created_at: string | null
          embedding: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          chunk_index?: number | null
          chunk_text: string
          content_section_id?: string | null
          created_at?: string | null
          embedding?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          chunk_index?: number | null
          chunk_text?: string
          content_section_id?: string | null
          created_at?: string | null
          embedding?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_content_section_id_fkey"
            columns: ["content_section_id"]
            isOneToOne: false
            referencedRelation: "content_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_content_section_id_fkey"
            columns: ["content_section_id"]
            isOneToOne: false
            referencedRelation: "v_content_with_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_stakeholders: {
        Row: {
          created_at: string | null
          id: string
          initiative_id: string
          person_id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          initiative_id: string
          person_id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          initiative_id?: string
          person_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_stakeholders_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_stakeholders_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "v_initiative_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_stakeholders_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_stakeholders_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_stakeholders_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "initiatives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
        ]
      }
      meeting_action_items: {
        Row: {
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          meeting_id: string
          owner_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          meeting_id: string
          owner_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          meeting_id?: string
          owner_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "v_meetings_with_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_action_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string
          person_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id: string
          person_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "v_meetings_with_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "people_reports_to_id_fkey"
            columns: ["reports_to_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_reports_to_id_fkey"
            columns: ["reports_to_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_reports_to_id_fkey"
            columns: ["reports_to_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "people_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          accomplishments: string | null
          challenges: string | null
          created_at: string | null
          development_goals: string | null
          growth_areas: string | null
          id: string
          manager_summary: string | null
          notes: string | null
          overall_rating: string | null
          peer_feedback: string | null
          person_id: string
          rating_score: number | null
          review_date: string | null
          review_file_path: string | null
          review_period: string
          reviewer_id: string | null
          self_assessment: string | null
          strengths: string | null
          updated_at: string | null
        }
        Insert: {
          accomplishments?: string | null
          challenges?: string | null
          created_at?: string | null
          development_goals?: string | null
          growth_areas?: string | null
          id?: string
          manager_summary?: string | null
          notes?: string | null
          overall_rating?: string | null
          peer_feedback?: string | null
          person_id: string
          rating_score?: number | null
          review_date?: string | null
          review_file_path?: string | null
          review_period: string
          reviewer_id?: string | null
          self_assessment?: string | null
          strengths?: string | null
          updated_at?: string | null
        }
        Update: {
          accomplishments?: string | null
          challenges?: string | null
          created_at?: string | null
          development_goals?: string | null
          growth_areas?: string | null
          id?: string
          manager_summary?: string | null
          notes?: string | null
          overall_rating?: string | null
          peer_feedback?: string | null
          person_id?: string
          rating_score?: number | null
          review_date?: string | null
          review_file_path?: string | null
          review_period?: string
          reviewer_id?: string | null
          self_assessment?: string | null
          strengths?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ppp_sections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppp_sections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppp_sections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "ppp_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ppp_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppp_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "v_ppp_swimlanes"
            referencedColumns: ["report_id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          status: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      project_decisions: {
        Row: {
          category: string
          created_at: string | null
          decided_at: string | null
          description: string
          id: string
          status: string
          supersedes_id: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          decided_at?: string | null
          description: string
          id?: string
          status?: string
          supersedes_id?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          decided_at?: string | null
          description?: string
          id?: string
          status?: string
          supersedes_id?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decisions_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "project_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          blocked_by_task_id: string
          created_at: string | null
          id: string
          task_id: string
        }
        Insert: {
          blocked_by_task_id: string
          created_at?: string | null
          id?: string
          task_id: string
        }
        Update: {
          blocked_by_task_id?: string
          created_at?: string | null
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_blocked_by_task_id_fkey"
            columns: ["blocked_by_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "tasks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "v_initiative_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          joined_date: string | null
          person_id: string
          role: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_date?: string | null
          person_id: string
          role?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_date?: string | null
          person_id?: string
          role?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_overview"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "v_org_tree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "v_person_teams"
            referencedColumns: ["person_id"]
          },
        ]
      }
    }
    Views: {
      v_agent_tasks_dashboard: {
        Row: {
          agent_name: string | null
          agent_type: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          health: string | null
          id: string | null
          parent_task_id: string | null
          picked_up_by: string | null
          priority: string | null
          result_summary: string | null
          status: string | null
          tags: string[] | null
          target_agent: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "v_agent_tasks_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      v_content_with_entity: {
        Row: {
          content: string | null
          date: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          is_private: boolean | null
          section_type: string | null
          title: string | null
        }
        Relationships: []
      }
      v_initiative_dashboard: {
        Row: {
          id: string | null
          objective: string | null
          owner_name: string | null
          priority: string | null
          slug: string | null
          start_date: string | null
          status: string | null
          target_date: string | null
          tasks_blocked: number | null
          tasks_done: number | null
          tasks_in_progress: number | null
          tasks_todo: number | null
          title: string | null
        }
        Relationships: []
      }
      v_meetings_with_attendees: {
        Row: {
          attendee_slugs: string[] | null
          attendees: string[] | null
          date: string | null
          discussion_notes: string | null
          id: string | null
          meeting_type: string | null
          private_notes: string | null
          purpose: string | null
          topic: string | null
        }
        Relationships: []
      }
      v_open_action_items: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          meeting_date: string | null
          meeting_topic: string | null
          meeting_type: string | null
          owner_name: string | null
          owner_slug: string | null
        }
        Relationships: []
      }
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
      v_person_teams: {
        Row: {
          name: string | null
          person_id: string | null
          role: string | null
          team_mission: string | null
          team_name: string | null
          team_role: string | null
          team_slug: string | null
          type: string | null
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
      v_ppp_week_comparison: {
        Row: {
          current_quality: number | null
          current_status: string | null
          current_summary: string | null
          current_tags: string[] | null
          current_week: string | null
          lead_name: string | null
          previous_quality: number | null
          previous_status: string | null
          previous_summary: string | null
          previous_tags: string[] | null
          previous_week: string | null
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
      get_person_context: {
        Args: { person_slug: string }
        Returns: {
          current_focus: string
          growth_areas: string[]
          name: string
          person_id: string
          relationship_notes: string
          role: string
          section_content: string
          section_date: string
          section_title: string
          section_type: string
          strengths: string[]
          team_name: string
          type: string
          working_style: string
        }[]
      }
      get_team_with_members: {
        Args: { team_slug: string }
        Returns: {
          leader_name: string
          member_name: string
          member_role: string
          member_slug: string
          mission: string
          north_star_metric: string
          scope: string[]
          team_id: string
          team_name: string
        }[]
      }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

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

export const AgentTaskStatus = {
  PENDING: 'pending',
  PICKED_UP: 'picked-up',
  DONE: 'done',
  FAILED: 'failed',
} as const
