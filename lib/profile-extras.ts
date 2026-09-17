export type ProfileLanguage = { name: string; level: string };
export type ProfileEducation = { id: string; school: string; degree: string; years: string };
export type ProfileEmployment = { id: string; title: string; company: string; dates: string; summary: string };
export type ProfilePortfolio = { id: string; title: string; image: string; url?: string };
export type ProfileCertification = { id: string; name: string; issuer: string; verified?: boolean };
export type ProfileOther = { id: string; title: string; url?: string; summary: string };
export type ProfileTestimonial = { id: string; quote: string; client: string; date: string; verified?: boolean };

export type ProfileExtras = {
  city?: string;
  timezone?: string;
  availableNow?: boolean;
  hoursPerWeek?: string;
  avgResponse?: string;
  githubUrl?: string;
  stackoverflowUrl?: string;
  stackoverflowName?: string;
  videoTitle?: string;
  videoImage?: string;
  languages: ProfileLanguage[];
  education: ProfileEducation[];
  employment: ProfileEmployment[];
  portfolio: ProfilePortfolio[];
  certifications: ProfileCertification[];
  otherExperience: ProfileOther[];
  testimonials: ProfileTestimonial[];
};

export function emptyExtras(): ProfileExtras {
  return {
    availableNow: true,
    hoursPerWeek: "More than 30 hrs/week",
    avgResponse: "0-4 hours",
    timezone: "America/New_York",
    languages: [{ name: "English", level: "Native or Bilingual" }],
    education: [],
    employment: [],
    portfolio: [],
    certifications: [],
    otherExperience: [],
    testimonials: [],
  };
}

export function parseExtras(raw: string | null | undefined): ProfileExtras {
  const base = emptyExtras();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<ProfileExtras>;
    return {
      ...base,
      ...parsed,
      languages: Array.isArray(parsed.languages) ? parsed.languages : base.languages,
      education: Array.isArray(parsed.education) ? parsed.education : [],
      employment: Array.isArray(parsed.employment) ? parsed.employment : [],
      portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      otherExperience: Array.isArray(parsed.otherExperience) ? parsed.otherExperience : [],
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : [],
    };
  } catch {
    return base;
  }
}

export function stringifyExtras(extras: ProfileExtras) {
  return JSON.stringify(extras);
}

export const DEMO_EXTRAS: Record<string, ProfileExtras> = {
  "maya@talent.test": {
    city: "New York",
    timezone: "America/New_York",
    availableNow: true,
    hoursPerWeek: "More than 30 hrs/week",
    avgResponse: "0-4 hours",
    githubUrl: "https://github.com",
    stackoverflowUrl: "https://stackoverflow.com",
    stackoverflowName: "Maya Chen",
    videoTitle: "Product design walkthrough",
    videoImage: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=800&q=80",
    languages: [
      { name: "English", level: "Native or Bilingual" },
      { name: "Mandarin", level: "Conversational" },
    ],
    education: [
      { id: "maya-edu-1", school: "Rhode Island School of Design", degree: "BFA Graphic Design", years: "2014-2018" },
    ],
    employment: [
      {
        id: "maya-job-1",
        title: "Product Designer",
        company: "Northfield Studio",
        dates: "2021 - Present",
        summary: "Lead product UI for B2B dashboards, design systems, and clinician-facing flows.",
      },
      {
        id: "maya-job-2",
        title: "Front-End Engineer",
        company: "LumenOps",
        dates: "2018 - 2021",
        summary: "Shipped React design-system components and intake forms used by operations teams.",
      },
    ],
    portfolio: [
      {
        id: "maya-p-1",
        title: "B2B dashboard system",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "maya-p-2",
        title: "Healthcare intake UI",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "maya-p-3",
        title: "Mobile refill flow",
        image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "maya-p-4",
        title: "Marketing site",
        image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=800&q=80",
      },
    ],
    certifications: [{ id: "maya-c-1", name: "Google UX Design Certificate", issuer: "Google", verified: true }],
    otherExperience: [
      { id: "maya-o-1", title: "Design critique newsletter", url: "https://example.com", summary: "Weekly notes on product UI for B2B teams." },
    ],
    testimonials: [
      {
        id: "maya-t-1",
        quote: "Maya turned a messy brief into a clear UI and shipped the React with it. Easy to work with and on time.",
        client: "Jordan H.",
        date: "Aug 2024",
        verified: true,
      },
    ],
  },
  "diego@talent.test": {
    city: "Chicago",
    timezone: "America/Chicago",
    availableNow: true,
    hoursPerWeek: "More than 30 hrs/week",
    avgResponse: "0-4 hours",
    githubUrl: "https://github.com",
    stackoverflowUrl: "https://stackoverflow.com",
    stackoverflowName: "Diego Alvarez",
    videoTitle: "Marketplace build recap",
    videoImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    languages: [
      { name: "English", level: "Native or Bilingual" },
      { name: "Spanish", level: "Native or Bilingual" },
    ],
    education: [
      { id: "diego-edu-1", school: "University of Illinois", degree: "BS Computer Science", years: "2013-2017" },
    ],
    employment: [
      {
        id: "diego-job-1",
        title: "Full-Stack Engineer",
        company: "Harbor Ledger",
        dates: "2020 - Present",
        summary: "Payments, Stripe, and TypeScript APIs for finance workflows.",
      },
    ],
    portfolio: [
      {
        id: "diego-p-1",
        title: "Job marketplace",
        image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "diego-p-2",
        title: "Billing dashboard",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "diego-p-3",
        title: "Checkout flow",
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80",
      },
    ],
    certifications: [{ id: "diego-c-1", name: "AWS Certified Developer", issuer: "Amazon", verified: true }],
    otherExperience: [
      { id: "diego-o-1", title: "Open-source billing helpers", url: "https://github.com", summary: "Small TypeScript utilities for Stripe webhooks." },
    ],
    testimonials: [
      {
        id: "diego-t-1",
        quote: "Diego shipped the marketplace piece we actually needed and explained tradeoffs without the fluff.",
        client: "Priya R.",
        date: "Jan 2025",
        verified: true,
      },
    ],
  },
  "coder@talent.test": {
    city: "Austin",
    timezone: "America/Chicago",
    availableNow: true,
    hoursPerWeek: "More than 30 hrs/week",
    avgResponse: "1 day",
    githubUrl: "https://github.com",
    languages: [{ name: "English", level: "Native or Bilingual" }],
    education: [],
    employment: [],
    portfolio: [
      {
        id: "coder-p-1",
        title: "Algorithm notes",
        image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80",
      },
    ],
    certifications: [],
    otherExperience: [],
    testimonials: [],
  },
};
