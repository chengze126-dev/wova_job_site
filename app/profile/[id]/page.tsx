import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startConversation } from "@/app/actions/messages";
import { SubmitButton } from "@/components/submit-button";
import { TalentProfile } from "@/components/talent-profile";

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const profile = await prisma.user.findUnique({ where: { id } });
  if (!profile || profile.role === "ADMIN") notFound();
  const viewer = await getCurrentUser();
  const isSelf = viewer?.id === profile.id;

  if (profile.role === "TALENT") {
    const work = await prisma.application.findMany({
      where: { talentId: profile.id },
      include: { job: { include: { client: true } } },
      orderBy: { createdAt: "desc" },
    });
    return (
      <TalentProfile
        profile={profile}
        viewerId={viewer?.id}
        work={work}
        publicView={query.view === "public" && isSelf}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">Client</p>
      <h1 className="font-display mt-2 text-4xl">{profile.name}</h1>
      {profile.companyName ? (
        <p className="mt-2 text-muted">
          {profile.companyName} · {profile.companySize} · {profile.companyIndustry}
        </p>
      ) : null}
      <p className="mt-5 leading-7 text-muted">{profile.bio || "No bio yet."}</p>
      {viewer && !isSelf ? (
        <form action={startConversation.bind(null, profile.id)} className="mt-6">
          <SubmitButton>Send a DM</SubmitButton>
        </form>
      ) : null}
      {isSelf ? (
        <Link
          href="/profile/settings"
          className="mt-8 inline-flex rounded-full bg-[#14a800] px-5 py-2 text-sm font-semibold text-white hover:bg-[#13a000]"
        >
          Profile settings
        </Link>
      ) : null}
      <p className="mt-8 text-sm">
        <Link href="/talents" className="underline decoration-copper/40">
          All talents
        </Link>
      </p>
    </div>
  );
}
