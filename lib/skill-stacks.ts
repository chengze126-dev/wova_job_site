export const PROBLEMS_PER_STACK = 1000;
export const QUESTIONS_PER_TEST = 10;

export type SkillStack = {
  slug: string;
  name: string;
  blurb: string;
};

export const SKILL_STACKS: SkillStack[] = [
  { slug: "mern", name: "MERN Stack", blurb: "MongoDB, Express, React, Node.js" },
  { slug: "python", name: "Python", blurb: "Language, data, and backend basics" },
  { slug: "javascript", name: "JavaScript", blurb: "Language, DOM, and async" },
  { slug: "typescript", name: "TypeScript", blurb: "Types, generics, and tooling" },
  { slug: "django", name: "Django", blurb: "Models, views, and ORM" },
  { slug: "flask", name: "Flask", blurb: "Routes, apps, and extensions" },
  { slug: "laravel", name: "Laravel", blurb: "Eloquent, routes, and Blade" },
  { slug: "react", name: "React", blurb: "Components, hooks, and state" },
  { slug: "nodejs", name: "Node.js", blurb: "Runtime, modules, and APIs" },
  { slug: "nextjs", name: "Next.js", blurb: "App Router, server, and data" },
  { slug: "php", name: "PHP", blurb: "Language and web request cycle" },
  { slug: "java", name: "Java", blurb: "OOP, collections, and JVM" },
  { slug: "csharp", name: "C#", blurb: ".NET, LINQ, and async" },
  { slug: "go", name: "Go", blurb: "Goroutines, packages, and APIs" },
  { slug: "rails", name: "Ruby on Rails", blurb: "MVC, Active Record, and routes" },
  { slug: "vue", name: "Vue.js", blurb: "Reactivity, components, and Vuex/Pinia" },
  { slug: "angular", name: "Angular", blurb: "Modules, RxJS, and templates" },
  { slug: "sql", name: "SQL", blurb: "Queries, joins, and indexes" },
  { slug: "devops", name: "DevOps", blurb: "CI/CD, Docker, and cloud ops" },
  { slug: "react-native", name: "React Native", blurb: "Mobile UI, navigation, and native APIs" },
];

export function getSkillStack(slug: string) {
  return SKILL_STACKS.find((stack) => stack.slug === slug) ?? null;
}
