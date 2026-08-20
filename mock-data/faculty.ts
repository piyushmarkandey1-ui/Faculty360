import type { FacultySummary, FacultyProfileResponse } from '../frontend/types/faculty'

export const MOCK_FACULTY_LIST: FacultySummary[] = [
  {
    id: "faculty-001",
    canonical_name: "Dr. Rajesh Kumar Sharma",
    department: "Information Technology",
    designation: "Associate Professor",
    onboarding_status: "active",
    completeness_score: 87,
    conflict_count: 1,
    last_synced_at: "2026-08-20T08:00:00Z",
    source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: true }
  },
  {
    id: "faculty-002",
    canonical_name: "Dr. Anjali Sharma",
    department: "Electronics Engineering",
    designation: "Associate Professor",
    onboarding_status: "active",
    completeness_score: 82,
    conflict_count: 2,
    last_synced_at: "2026-08-19T14:30:00Z",
    source_coverage: { google_scholar: true, researchgate: false, institutional: true, orcid: true }
  },
  {
    id: "faculty-003",
    canonical_name: "Dr. Vikram Singh",
    department: "Mechanical Engineering",
    designation: "Assistant Professor",
    onboarding_status: "pending",
    completeness_score: 55,
    conflict_count: 1,
    last_synced_at: "2026-08-10T09:15:00Z",
    source_coverage: { google_scholar: true, researchgate: false, institutional: true, orcid: false }
  },
  {
    id: "faculty-004",
    canonical_name: "Dr. Sneha Desai",
    department: "Physics",
    designation: "Professor",
    onboarding_status: "active",
    completeness_score: 91,
    conflict_count: 0,
    last_synced_at: "2026-08-18T16:45:00Z",
    source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: true }
  },
  {
    id: "faculty-005",
    canonical_name: "Dr. Manish Gupta",
    department: "Mathematics",
    designation: "Associate Professor",
    onboarding_status: "pending",
    completeness_score: 45,
    conflict_count: 0,
    last_synced_at: null,
    source_coverage: { google_scholar: false, researchgate: false, institutional: true, orcid: false }
  },
  {
    id: "faculty-006",
    canonical_name: "Dr. Priya Patel",
    department: "Civil Engineering",
    designation: "Professor",
    onboarding_status: "active",
    completeness_score: 88,
    conflict_count: 1,
    last_synced_at: "2026-08-19T10:20:00Z",
    source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: false }
  },
  {
    id: "faculty-007",
    canonical_name: "Dr. Amit Verma",
    department: "Computer Science",
    designation: "Assistant Professor",
    onboarding_status: "active",
    completeness_score: 65,
    conflict_count: 5,
    last_synced_at: "2026-08-15T11:30:00Z",
    source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: false }
  },
  {
    id: "faculty-008",
    canonical_name: "Dr. Kavita Reddy",
    department: "Electronics Engineering",
    designation: "Professor",
    onboarding_status: "active",
    completeness_score: 93,
    conflict_count: 0,
    last_synced_at: "2026-08-17T09:00:00Z",
    source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: true }
  },
  {
    id: "faculty-009",
    canonical_name: "Dr. Sanjay Kumar Mehta",
    department: "Physics",
    designation: "Associate Professor",
    onboarding_status: "active",
    completeness_score: 78,
    conflict_count: 2,
    last_synced_at: "2026-08-16T14:15:00Z",
    source_coverage: { google_scholar: true, researchgate: false, institutional: true, orcid: true }
  },
  {
    id: "faculty-010",
    canonical_name: "Dr. Neha Sharma",
    department: "Mathematics",
    designation: "Assistant Professor",
    onboarding_status: "pending",
    completeness_score: 50,
    conflict_count: 0,
    last_synced_at: null,
    source_coverage: { google_scholar: false, researchgate: false, institutional: true, orcid: false }
  },
  {
    id: "faculty-011",
    canonical_name: "Dr. Rahul Singh",
    department: "Mechanical Engineering",
    designation: "Professor",
    onboarding_status: "active",
    completeness_score: 89,
    conflict_count: 1,
    last_synced_at: "2026-08-19T08:45:00Z",
    source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: false }
  },
  {
    id: "faculty-012",
    canonical_name: "Dr. Sunita Mishra",
    department: "Civil Engineering",
    designation: "Associate Professor",
    onboarding_status: "active",
    completeness_score: 72,
    conflict_count: 3,
    last_synced_at: "2026-08-18T13:20:00Z",
    source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: false }
  }
];

export const MOCK_FACULTY_PROFILES: Record<string, FacultyProfileResponse> = {
  "faculty-001": {
    entity: {
      id: "faculty-001",
      canonical_name: "Dr. Rajesh Kumar Sharma",
      canonical_email: "rajesh.sharma@nitwgal.ac.in",
      department: "Information Technology",
      designation: "Associate Professor",
      institution: "NIT Warangal",
      scholar_id: "rksharma_gs",
      researchgate_slug: "Rajesh-Kumar-Sharma",
      orcid_id: "0000-0002-1825-0097",
      onboarding_status: "active",
      created_at: "2025-01-15T08:00:00Z",
      updated_at: "2026-08-20T08:00:00Z"
    },
    unified_profile: {
      display_name: "Dr. Rajesh Kumar Sharma",
      bio: "Associate Professor of Information Technology at NIT Warangal, specialising in Machine Learning, Natural Language Processing, and Deep Learning. Published 87 papers in ACM, IEEE, and Springer venues with 1,842 citations and an h-index of 21. Active supervisor of 17 PhD and MTech students.",
      research_interests: ["Machine Learning", "Natural Language Processing", "Computer Vision", "Deep Learning", "AI Ethics", "Data Mining"],
      completeness_score: 87,
      source_coverage: { google_scholar: true, researchgate: true, institutional: true, orcid: true },
      conflict_count: 1,
      last_synced_at: "2026-08-20T08:00:00Z",
      updated_at: "2026-08-20T08:00:00Z"
    },
    publications_count: 87,
    latest_assessment: {
      id: "assessment-001",
      total_score: 84.7,
      completeness_score: 87,
      confidence_score: 91,
      status: "draft",
      assessed_at: "2026-08-20T08:05:00Z"
    }
  },
  "faculty-002": {
    entity: {
      id: "faculty-002",
      canonical_name: "Dr. Anjali Sharma",
      canonical_email: "anjali.sharma@nitwgal.ac.in",
      department: "Electronics Engineering",
      designation: "Associate Professor",
      institution: "NIT Warangal",
      scholar_id: "asharma_ee",
      researchgate_slug: null,
      orcid_id: "0000-0003-9876-5432",
      onboarding_status: "active",
      created_at: "2025-02-10T10:00:00Z",
      updated_at: "2026-08-19T14:30:00Z"
    },
    unified_profile: {
      display_name: "Dr. Anjali Sharma",
      bio: "Associate Professor in Electronics Engineering, focussing on VLSI Design, Embedded Systems, and IoT. Published 34 papers across IEEE and IET with 720 citations.",
      research_interests: ["VLSI Design", "Embedded Systems", "IoT", "Signal Processing"],
      completeness_score: 82,
      source_coverage: { google_scholar: true, researchgate: false, institutional: true, orcid: true },
      conflict_count: 2,
      last_synced_at: "2026-08-19T14:30:00Z",
      updated_at: "2026-08-19T14:30:00Z"
    },
    publications_count: 34,
    latest_assessment: {
      id: "assessment-002",
      total_score: 75.0,
      completeness_score: 82,
      confidence_score: 78,
      status: "draft",
      assessed_at: "2026-08-19T14:35:00Z"
    }
  },
  "faculty-003": {
    entity: {
      id: "faculty-003",
      canonical_name: "Dr. Vikram Singh",
      canonical_email: "vikram.singh@nitwgal.ac.in",
      department: "Mechanical Engineering",
      designation: "Assistant Professor",
      institution: "NIT Warangal",
      scholar_id: "vsingh_me",
      researchgate_slug: null,
      orcid_id: null,
      onboarding_status: "pending",
      created_at: "2025-03-20T09:00:00Z",
      updated_at: "2026-08-10T09:15:00Z"
    },
    unified_profile: {
      display_name: "Dr. Vikram Singh",
      bio: "Assistant Professor exploring Thermodynamics, Fluid Mechanics, and Heat Transfer. Recently joined NIT Warangal with 12 publications.",
      research_interests: ["Thermodynamics", "Fluid Mechanics", "Heat Transfer", "Computational Fluid Dynamics"],
      completeness_score: 55,
      source_coverage: { google_scholar: true, researchgate: false, institutional: true, orcid: false },
      conflict_count: 1,
      last_synced_at: "2026-08-10T09:15:00Z",
      updated_at: "2026-08-10T09:15:00Z"
    },
    publications_count: 12,
    latest_assessment: null
  }
};
