import { BadgeCheck, Check, MapPin, Pencil, Share2, Star, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@/lib/prisma";
import { parseSkills } from "@/lib/constants";
import { parseExtras } from "@/lib/profile-extras";
import { formatCompactUsd, formatDate, formatHourly, formatMoney } from "@/lib/utils";
import { TalentLogo } from "@/components/badges";
import { ProfileAvatar } from "@/components/profile-avatar";
import { AvatarInput } from "@/components/avatar-input";
import { startConversation } from "@/app/actions/messages";
import {
  addCertification,
  addEducation,
  addEmployment,
  addLanguage,
  addOtherExperience,
  addPortfolio,
  removeCertification,
  removeEducation,
  removeEmployment,
  removeOtherExperience,
  removePortfolio,
  toggleAvailableNow,
  updateProfileBasics,
} from "@/app/actions/profile";
import { SubmitButton } from "@/components/submit-button";
import {
  AddPanel,
  LocalTime,
  OverviewText,
  PencilLink,
  TrashSubmit,
  WorkTabs,
} from "@/components/profile-widgets";

type WorkItem = {
  id: string;
  status: string;
  createdAt: Date;
  job?: {
    id: string;
    title: string;
    budgetMin: number | null;
    budgetMax: number | null;
    budgetType?: string;
    client?: { companyName: string | null; name: string } | null;
  } | null;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted";
const cardClass = "rounded-2xl border border-line bg-cream p-5";

function SectionHead({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[22px] font-semibold">{title}</h3>
      {action}
    </div>
  );
}

export function TalentProfile({
  profile,
  viewerId,
  work,
  publicView,
}: {
  profile: User;
  viewerId?: string;
  work: WorkItem[];
  publicView?: boolean;
}) {
  const isOwner = viewerId === profile.id;
  const editing = isOwner && !publicView;
  const extras = parseExtras(profile.extras);
  const skills = parseSkills(profile.skills || "");
  const hired = work.filter((item) => item.status === "HIRED");
  const progress = work.filter((item) => item.status !== "HIRED" && item.status !== "REJECTED");
  const earnings = hired.reduce((sum, item) => {
    const min = item.job?.budgetMin ?? 0;
    const max = item.job?.budgetMax ?? min;
    return sum + (min + max) / 2;
  }, 0);
  const hours = hired.length * 42;
  const rate = formatHourly(profile.hourlyRate);
  const location = [extras.city, profile.country].filter(Boolean).join(", ") || "Remote";
  const overview =
    profile.bio ||
    "This talent has not written an overview yet. Add a short story about the work you want and the results you ship.";

  return (
    <div className="min-h-screen bg-paper pb-16 text-ink" data-upwork-profile>
      <div className="mx-auto w-[94%] max-w-[1180px] space-y-4 pt-5">
        <section className={cardClass}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="relative shrink-0">
                <ProfileAvatar
                  name={profile.name}
                  src={profile.avatarUrl}
                  size={96}
                  badge={profile.talentBadge}
                />
                {editing ? (
                  <a
                    href="#profile-settings"
                    className={`absolute inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#14a800] bg-cream text-[#14a800] ${
                      profile.talentBadge ? "-bottom-0.5 -left-0.5" : "bottom-0 right-0"
                    }`}
                    aria-label="Change photo"
                  >
                    <Pencil size={14} />
                  </a>
                ) : null}
              </div>
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-[28px] font-semibold tracking-[-0.03em]">
                  {profile.name}
                  {profile.phoneVerified ? <BadgeCheck size={20} className="text-[#14a800]" /> : null}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[14px] text-muted">
                  <MapPin size={14} />
                  {location}
                  <span className="text-muted">–</span>
                  <LocalTime timeZone={extras.timezone} />
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {extras.availableNow ? <span className="text-[#14a800]">Open for work</span> : <span className="text-muted">Not available</span>}
                  {profile.talentBadge ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-[13px] font-semibold text-brand">
                      <Trophy size={14} />
                      100% Job Success
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {editing ? (
                <>
                  <Link
                    href={`/profile/${profile.id}?view=public`}
                    className="rounded-full border-2 border-[#14a800] px-5 py-2 text-sm font-semibold text-[#14a800]"
                  >
                    See public view
                  </Link>
                  <a
                    href="#profile-settings"
                    className="rounded-full bg-[#14a800] px-5 py-2 text-sm font-semibold text-white hover:bg-[#13a000]"
                  >
                    Profile settings
                  </a>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#14a800] text-[#14a800]">
                    <Share2 size={16} />
                  </span>
                </>
              ) : (
                <>
                  {isOwner ? (
                    <Link href={`/profile/${profile.id}`} className="rounded-full border-2 border-[#14a800] px-5 py-2 text-sm font-semibold text-[#14a800]">
                      Back to edit view
                    </Link>
                  ) : null}
                  {viewerId && !isOwner ? (
                    <form action={startConversation.bind(null, profile.id)}>
                      <SubmitButton className="!rounded-full !bg-[#14a800] !px-6">Message</SubmitButton>
                    </form>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className={`${cardClass} grid grid-cols-3 gap-2 text-center`}>
              <div>
                <p className="text-[22px] font-semibold">{formatCompactUsd(Math.max(earnings, hired.length ? 1200 : 0))}</p>
                <p className="mt-1 text-[12px] text-muted">Total earnings</p>
              </div>
              <div>
                <p className="text-[22px] font-semibold">{hired.length}</p>
                <p className="mt-1 text-[12px] text-muted">Total jobs</p>
              </div>
              <div>
                <p className="text-[22px] font-semibold">{hours.toLocaleString()}</p>
                <p className="mt-1 text-[12px] text-muted">Total hours</p>
              </div>
            </section>

            {editing ? (
              <>
                <section className="rounded-2xl bg-paper-2 p-5">
                  <p className="text-lg font-semibold">Promote with ads</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>Open for work</span>
                    <form action={toggleAvailableNow}>
                      <SubmitButton className="!rounded-md !bg-transparent !px-2 !py-1 !text-brand underline">
                        {extras.availableNow ? "On" : "Off"}
                      </SubmitButton>
                    </form>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>Boost your profile</span>
                    <span className="text-muted">Off</span>
                  </div>
                </section>
                <section className={cardClass}>
                  <p className="text-lg font-semibold">Connects: {profile.connects}</p>
                  <div className="mt-3 flex gap-4 text-sm font-semibold text-[#14a800]">
                    <Link href="/connects">View details</Link>
                    <Link href="/connects">Buy Connects</Link>
                  </div>
                </section>
              </>
            ) : null}

            {extras.videoImage ? (
              <section className={cardClass}>
                <p className="mb-3 text-sm font-semibold">Meet {profile.name.split(" ")[0]}</p>
                <div className="overflow-hidden rounded-xl">
                  <img src={extras.videoImage} alt="" className="aspect-video w-full object-cover" />
                </div>
                <p className="mt-2 text-sm text-muted">{extras.videoTitle}</p>
              </section>
            ) : null}

            <section className={cardClass}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">Hours per week</p>
                  <p className="mt-1 text-sm text-muted">{extras.hoursPerWeek}</p>
                  {extras.availableNow ? <p className="mt-1 text-sm text-[#14a800]">Open to contract to hire</p> : null}
                </div>
                {editing ? <PencilLink href="#profile-settings" /> : null}
              </div>
              <div className="mt-5">
                <p className="font-semibold">Avg. response</p>
                <p className="mt-1 text-sm text-muted">{extras.avgResponse}</p>
              </div>
            </section>

            <section className={cardClass}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">Languages</p>
                {editing ? (
                  <AddPanel label="Add language">
                    <form action={addLanguage} className="space-y-2">
                      <input name="name" placeholder="French" className={fieldClass} />
                      <input name="level" placeholder="Basic" className={fieldClass} />
                      <SubmitButton className="!rounded-full !bg-[#14a800] !text-sm">Save</SubmitButton>
                    </form>
                  </AddPanel>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {extras.languages.map((lang) => (
                  <li key={`${lang.name}-${lang.level}`}>
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-muted">: {lang.level}</span>
                    {lang.level.toLowerCase().includes("native") ? (
                      <BadgeCheck size={14} className="ml-1 inline text-[#14a800]" />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className={cardClass}>
              <p className="font-semibold">Verifications</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  ID: {profile.phoneVerified ? "Verified" : "Not verified"}
                  {profile.phoneVerified ? <BadgeCheck size={14} className="text-[#14a800]" /> : null}
                </li>
                <li className="flex items-center gap-2">
                  Skill test:
                  {profile.talentBadge ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-brand">
                      <TalentLogo size={18} />
                      Talent badge
                    </span>
                  ) : (
                    "Optional"
                  )}
                </li>
              </ul>
            </section>

            <section className={cardClass}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">Education</p>
                {editing ? (
                  <AddPanel label="Add education">
                    <form action={addEducation} className="space-y-2">
                      <input name="school" placeholder="School" className={fieldClass} />
                      <input name="degree" placeholder="Degree" className={fieldClass} />
                      <input name="years" placeholder="2018-2022" className={fieldClass} />
                      <SubmitButton className="!rounded-full !bg-[#14a800] !text-sm">Save</SubmitButton>
                    </form>
                  </AddPanel>
                ) : null}
              </div>
              <ul className="mt-3 space-y-3 text-sm">
                {extras.education.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.school}</p>
                      <p className="text-muted">{item.degree}</p>
                      <p className="text-muted">{item.years}</p>
                    </div>
                    {editing ? (
                      <form action={removeEducation}>
                        <input type="hidden" name="id" value={item.id} />
                        <TrashSubmit />
                      </form>
                    ) : null}
                  </li>
                ))}
                {extras.education.length === 0 ? <li className="text-muted">No education listed.</li> : null}
              </ul>
            </section>

            <section className={cardClass}>
              <p className="font-semibold">Linked accounts</p>
              {extras.githubUrl ? (
                <a
                  href={extras.githubUrl}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#14a800] py-2 text-sm font-semibold text-[#14a800]"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted">No linked accounts yet.</p>
              )}
              {extras.stackoverflowUrl ? (
                <a href={extras.stackoverflowUrl} className="mt-3 block text-sm text-muted" target="_blank" rel="noreferrer">
                  StackOverflow
                  <span className="mt-1 block font-medium">{extras.stackoverflowName}</span>
                </a>
              ) : null}
              {profile.linkedinUrl ? (
                <a href={profile.linkedinUrl} className="mt-3 block text-sm font-semibold text-[#14a800]" target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              ) : null}
            </section>
          </aside>

          <div className="space-y-4">
            <section className={cardClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="max-w-3xl text-[26px] font-semibold leading-8 tracking-[-0.03em]">
                  {profile.title || "Freelance talent"}
                </h2>
                <div className="flex items-center gap-2">
                  {rate ? <p className="text-[22px] font-semibold">{rate}</p> : null}
                  {editing ? <PencilLink href="#profile-settings" /> : null}
                </div>
              </div>
              <div className="mt-5">
                <OverviewText text={overview} />
              </div>
              {skills.length ? (
                <div className="mt-6">
                  <p className="mb-2 font-semibold">Core Skills:</p>
                  <ul className="space-y-1.5 text-sm text-ink/80">
                    {skills.slice(0, 8).map((skill) => (
                      <li key={skill} className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-[#14a800]" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className={cardClass}>
              <SectionHead
                title="Portfolio"
                action={
                  editing ? (
                    <AddPanel label="Add portfolio item">
                      <form action={addPortfolio} className="space-y-2">
                        <input name="title" placeholder="Project title" className={fieldClass} />
                        <input name="url" placeholder="https://" className={fieldClass} />
                        <input name="image" type="file" accept="image/*" className="text-sm" />
                        <SubmitButton className="!rounded-full !bg-[#14a800] !text-sm">Save</SubmitButton>
                      </form>
                    </AddPanel>
                  ) : null
                }
              />
              <p className="mb-4 text-sm font-semibold">Published</p>
              {extras.portfolio.length === 0 ? (
                <p className="text-sm text-muted">No portfolio items yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {extras.portfolio.map((item) => (
                    <article key={item.id} className="min-w-0">
                      <div className="overflow-hidden rounded-xl bg-paper">
                        <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                      </div>
                      <p className="mt-2 text-sm leading-5">{item.title}</p>
                      {editing ? (
                        <form action={removePortfolio} className="mt-2">
                          <input type="hidden" name="id" value={item.id} />
                          <TrashSubmit />
                        </form>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={cardClass}>
              <SectionHead title="Work history on Wova" />
              <WorkTabs
                completed={
                  hired.length === 0 ? (
                    <p className="text-sm text-muted">No completed jobs yet.</p>
                  ) : (
                    <ul className="space-y-6">
                      {hired.map((item) => {
                        const pay =
                          item.job?.budgetMin && item.job?.budgetMax
                            ? `${formatMoney(item.job.budgetMin * 100)} – ${formatMoney(item.job.budgetMax * 100)}`
                            : null;
                        return (
                          <li key={item.id} className="border-b border-line pb-5 last:border-0">
                            <Link href={`/jobs/${item.job?.id}`} className="text-[17px] font-semibold hover:underline">
                              {item.job?.title}
                            </Link>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                              <span className="inline-flex items-center gap-1 text-[#f5c451]">
                                <Star size={14} fill="currentColor" /> 5.0
                              </span>
                              <span>{formatDate(item.createdAt)}</span>
                            </p>
                            <p className="mt-3 text-sm leading-6 text-muted">
                              Hired by {item.job?.client?.companyName || item.job?.client?.name}.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {parseSkills(profile.skills || "")
                                .slice(0, 4)
                                .map((skill) => (
                                  <span key={skill} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs text-muted">
                                    {skill}
                                  </span>
                                ))}
                            </div>
                            <p className="mt-3 text-sm text-muted">
                              {pay} {item.job?.budgetType === "hourly" && rate ? `· ${rate}` : null}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )
                }
                inProgress={
                  progress.length === 0 ? (
                    <p className="text-sm text-muted">No jobs in progress.</p>
                  ) : (
                    <ul className="space-y-4">
                      {progress.map((item) => (
                        <li key={item.id}>
                          <Link href={`/jobs/${item.job?.id}`} className="font-semibold hover:underline">
                            {item.job?.title}
                          </Link>
                          <p className="text-sm text-muted">
                            {item.status} · {item.job?.client?.companyName}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )
                }
              />
            </section>

            <section className={cardClass}>
              <SectionHead title="Skills" action={editing ? <PencilLink href="#profile-settings" /> : null} />
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-paper-2 px-3 py-1.5 text-sm text-ink">
                    {skill}
                  </span>
                ))}
                {skills.length === 0 ? <p className="text-sm text-muted">No skills listed.</p> : null}
              </div>
            </section>

            <section className={cardClass}>
              <SectionHead title="Testimonials" />
              {extras.testimonials.length === 0 ? (
                <p className="text-sm text-muted">Endorsements from past clients will show here.</p>
              ) : (
                <ul className="space-y-4">
                  {extras.testimonials.map((item) => (
                    <li key={item.id} className="text-sm leading-6 text-ink/80">
                      “{item.quote}”
                      <p className="mt-2 text-muted">
                        {item.client} · {item.date}
                        {item.verified ? " · Verified" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={cardClass}>
              <SectionHead
                title="Certifications"
                action={
                  editing ? (
                    <AddPanel label="Add certification">
                      <form action={addCertification} className="space-y-2">
                        <input name="name" placeholder="Certification" className={fieldClass} />
                        <input name="issuer" placeholder="Issuer" className={fieldClass} />
                        <SubmitButton className="!rounded-full !bg-[#14a800] !text-sm">Save</SubmitButton>
                      </form>
                    </AddPanel>
                  ) : null
                }
              />
              {extras.certifications.length === 0 ? (
                <p className="text-sm text-muted">No certifications yet.</p>
              ) : (
                <ul className="space-y-3">
                  {extras.certifications.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted">{item.issuer}</p>
                        {item.verified ? (
                          <p className="mt-1 flex items-center gap-1 text-sm text-[#14a800]">
                            <BadgeCheck size={14} /> Verified
                          </p>
                        ) : null}
                      </div>
                      {editing ? (
                        <form action={removeCertification}>
                          <input type="hidden" name="id" value={item.id} />
                          <TrashSubmit />
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={cardClass}>
              <SectionHead
                title="Employment history"
                action={
                  editing ? (
                    <AddPanel label="Add employment">
                      <form action={addEmployment} className="space-y-2">
                        <input name="title" placeholder="Title" className={fieldClass} />
                        <input name="company" placeholder="Company" className={fieldClass} />
                        <input name="dates" placeholder="2022 - Present" className={fieldClass} />
                        <textarea name="summary" rows={3} placeholder="What you did" className={fieldClass} />
                        <SubmitButton className="!rounded-full !bg-[#14a800] !text-sm">Save</SubmitButton>
                      </form>
                    </AddPanel>
                  ) : null
                }
              />
              {extras.employment.length === 0 ? (
                <p className="text-sm text-muted">No employment history yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {extras.employment.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-4 first:pt-0">
                      <div>
                        <p className="font-semibold">
                          {item.title} | {item.company}
                        </p>
                        <p className="mt-1 text-sm text-muted">{item.dates}</p>
                        <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
                      </div>
                      {editing ? (
                        <form action={removeEmployment}>
                          <input type="hidden" name="id" value={item.id} />
                          <TrashSubmit />
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={cardClass}>
              <SectionHead
                title="Other experiences"
                action={
                  editing ? (
                    <AddPanel label="Add other experience">
                      <form action={addOtherExperience} className="space-y-2">
                        <input name="title" placeholder="Title" className={fieldClass} />
                        <input name="url" placeholder="https://" className={fieldClass} />
                        <textarea name="summary" rows={3} className={fieldClass} />
                        <SubmitButton className="!rounded-full !bg-[#14a800] !text-sm">Save</SubmitButton>
                      </form>
                    </AddPanel>
                  ) : null
                }
              />
              {extras.otherExperience.length === 0 ? (
                <p className="text-sm text-muted">Add independent work, teaching, or a personal site.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {extras.otherExperience.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-4 first:pt-0">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        {item.url ? (
                          <a href={item.url} className="text-sm text-[#14a800] underline" target="_blank" rel="noreferrer">
                            {item.url}
                          </a>
                        ) : null}
                        <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
                      </div>
                      {editing ? (
                        <form action={removeOtherExperience}>
                          <input type="hidden" name="id" value={item.id} />
                          <TrashSubmit />
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {editing && !profile.talentBadge ? (
              <section className={cardClass}>
                <h3 className="text-lg font-semibold">Skill test is optional</h3>
                <p className="mt-2 text-sm text-muted">
                  Pass the camera-proctored test when you want a Talent badge for high-badge jobs.
                </p>
                <Link href="/skill-test" className="mt-4 inline-flex rounded-full bg-[#14a800] px-4 py-2 text-sm font-semibold">
                  Take the skill test
                </Link>
              </section>
            ) : null}

            {editing ? (
              <section id="profile-settings" className={cardClass}>
                <h3 className="text-[22px] font-semibold">Profile settings</h3>
                <form action={updateProfileBasics} className="mt-5 space-y-4">
                  <AvatarInput personName={profile.name} currentSrc={profile.avatarUrl} required={!profile.avatarUrl} />
                  <label className="block text-sm">
                    Name
                    <input name="name" defaultValue={profile.name} className={fieldClass} />
                  </label>
                  <label className="block text-sm">
                    City
                    <input name="city" defaultValue={extras.city || ""} className={fieldClass} />
                  </label>
                  <label className="block text-sm">
                    Title
                    <input name="title" defaultValue={profile.title || ""} className={fieldClass} />
                  </label>
                  <label className="block text-sm">
                    Hourly rate (USD)
                    <input name="hourlyRate" type="number" min={5} max={500} defaultValue={profile.hourlyRate ?? 40} className={fieldClass} />
                  </label>
                  <label className="block text-sm">
                    Hours per week
                    <input name="hoursPerWeek" defaultValue={extras.hoursPerWeek} className={fieldClass} />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="availableNow" defaultChecked={extras.availableNow} className="accent-[#14a800]" />
                    Open for work
                  </label>
                  <label className="block text-sm">
                    GitHub URL
                    <input name="githubUrl" defaultValue={extras.githubUrl || ""} className={fieldClass} />
                  </label>
                  <label className="block text-sm">
                    Skills (comma-separated)
                    <input name="skills" defaultValue={skills.join(", ")} className={fieldClass} />
                  </label>
                  <label className="block text-sm">
                    Overview
                    <textarea name="bio" rows={8} defaultValue={profile.bio || ""} className={fieldClass} />
                  </label>
                  <SubmitButton className="!rounded-full !bg-[#14a800]">Save profile</SubmitButton>
                </form>
              </section>
            ) : null}
          </div>
        </div>

        <p className="pt-2 text-sm text-muted">
          <Link href="/talents" className="text-[#14a800]">
            All talents
          </Link>
        </p>
      </div>
    </div>
  );
}
