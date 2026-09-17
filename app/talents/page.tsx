import Link from "next/link";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TalentBadge } from "@/components/badges";
import { ProfileAvatar } from "@/components/profile-avatar";
import { parseSkills } from "@/lib/constants";
import { formatHourly } from "@/lib/utils";

export default async function TalentsPage() {
  const talents = await prisma.user.findMany({
    where: { role: "TALENT", onboardingDone: true },
    orderBy: [{ talentBadge: "desc" }, { name: "asc" }],
  });

  return (
    <div className="bg-paper-2 pb-16 pt-10">
      <div className="mx-auto w-[92%] max-w-[1080px]">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">Talent</h1>
        <p className="mt-2 text-muted">
          Browse developer profiles. A Talent badge appears only after they choose to pass the optional skill
          test.
        </p>
        <div className="mt-6 space-y-3">
          {talents.map((talent) => {
            const skills = parseSkills(talent.skills || "");
            return (
              <Link
                key={talent.id}
                href={`/profile/${talent.id}`}
                className="flex gap-4 rounded-[12px] border border-line bg-cream p-5 hover:border-[#14a800]"
              >
                <ProfileAvatar name={talent.name} src={talent.avatarUrl} size={72} badge={talent.talentBadge} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
                        {talent.name}
                        {talent.talentBadge ? <TalentBadge compact /> : null}
                      </h2>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                        <MapPin size={13} />
                        {talent.country || "Remote"}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-ink">{formatHourly(talent.hourlyRate)}</p>
                  </div>
                  <p className="mt-2 text-[15px] text-ink">{talent.title || "Freelance talent"}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {talent.bio || "Talent on Wova."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.slice(0, 6).map((skill) => (
                      <span key={skill} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-medium text-pine">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
