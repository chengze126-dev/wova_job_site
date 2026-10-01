export type CountryMeta = {
  name: string;
  dial: string;
  cities: string[];
};

export const COUNTRY_META: CountryMeta[] = [
  { name: "United States", dial: "+1", cities: ["New York", "Los Angeles", "Chicago", "Austin", "San Francisco", "Seattle", "Miami", "Boston"] },
  { name: "United Kingdom", dial: "+44", cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Bristol"] },
  { name: "Canada", dial: "+1", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"] },
  { name: "Australia", dial: "+61", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
  { name: "Germany", dial: "+49", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"] },
  { name: "France", dial: "+33", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"] },
  { name: "Netherlands", dial: "+31", cities: ["Amsterdam", "Rotterdam", "Utrecht", "The Hague"] },
  { name: "Spain", dial: "+34", cities: ["Madrid", "Barcelona", "Valencia", "Seville"] },
  { name: "Italy", dial: "+39", cities: ["Rome", "Milan", "Naples", "Turin"] },
  { name: "Ireland", dial: "+353", cities: ["Dublin", "Cork", "Galway"] },
  { name: "Sweden", dial: "+46", cities: ["Stockholm", "Gothenburg", "Malmö"] },
  { name: "Norway", dial: "+47", cities: ["Oslo", "Bergen", "Trondheim"] },
  { name: "Denmark", dial: "+45", cities: ["Copenhagen", "Aarhus", "Odense"] },
  { name: "Finland", dial: "+358", cities: ["Helsinki", "Tampere", "Turku"] },
  { name: "Poland", dial: "+48", cities: ["Warsaw", "Kraków", "Wrocław", "Gdańsk"] },
  { name: "Portugal", dial: "+351", cities: ["Lisbon", "Porto", "Braga"] },
  { name: "India", dial: "+91", cities: ["Bengaluru", "Hyderabad", "Mumbai", "Pune", "Delhi", "Chennai"] },
  { name: "Pakistan", dial: "+92", cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi"] },
  { name: "Bangladesh", dial: "+880", cities: ["Dhaka", "Chittagong", "Sylhet"] },
  { name: "Philippines", dial: "+63", cities: ["Manila", "Cebu", "Davao"] },
  { name: "Indonesia", dial: "+62", cities: ["Jakarta", "Bandung", "Surabaya", "Bali"] },
  { name: "Singapore", dial: "+65", cities: ["Singapore"] },
  { name: "United Arab Emirates", dial: "+971", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { name: "Saudi Arabia", dial: "+966", cities: ["Riyadh", "Jeddah", "Dammam"] },
  { name: "Nigeria", dial: "+234", cities: ["Lagos", "Abuja", "Port Harcourt"] },
  { name: "Kenya", dial: "+254", cities: ["Nairobi", "Mombasa"] },
  { name: "South Africa", dial: "+27", cities: ["Johannesburg", "Cape Town", "Durban"] },
  { name: "Brazil", dial: "+55", cities: ["São Paulo", "Rio de Janeiro", "Brasília"] },
  { name: "Mexico", dial: "+52", cities: ["Mexico City", "Guadalajara", "Monterrey"] },
  { name: "Argentina", dial: "+54", cities: ["Buenos Aires", "Córdoba", "Rosario"] },
  { name: "Japan", dial: "+81", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama"] },
  { name: "South Korea", dial: "+82", cities: ["Seoul", "Busan", "Incheon"] },
  { name: "New Zealand", dial: "+64", cities: ["Auckland", "Wellington", "Christchurch"] },
  { name: "Ukraine", dial: "+380", cities: ["Kyiv", "Lviv", "Kharkiv"] },
  { name: "Romania", dial: "+40", cities: ["Bucharest", "Cluj-Napoca", "Timișoara"] },
  { name: "Other", dial: "+", cities: [] },
];

export function countryMeta(name?: string | null) {
  return COUNTRY_META.find((item) => item.name === name) || COUNTRY_META[0];
}

export function formatLocation(city?: string | null, country?: string | null) {
  return [city?.trim(), country?.trim()].filter(Boolean).join(", ") || "";
}

export function parsePhoneParts(phone?: string | null) {
  const raw = (phone || "").trim();
  if (!raw) return { country: "United States", dial: "+1", national: "" };
  const digits = raw.replace(/[^\d+]/g, "");
  const sorted = [...COUNTRY_META].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find((item) => item.dial !== "+" && (digits.startsWith(item.dial) || raw.startsWith(item.dial)));
  if (!match) return { country: "United States", dial: "+1", national: raw.replace(/^\+\d+\s*/, "") };
  const national = raw.replace(match.dial, "").replace(/[^\d]/g, "");
  return { country: match.name, dial: match.dial, national };
}

export function skillOverlap(left: string[], right: string[]) {
  const set = new Set(left.map((item) => item.trim().toLowerCase()).filter(Boolean));
  return right.filter((item) => set.has(item.trim().toLowerCase()));
}

export function textMatchesQuery(haystack: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}
