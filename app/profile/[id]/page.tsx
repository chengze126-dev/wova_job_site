import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startConversation } from "@/app/actions/messages";
import { SubmitButton } from "@/components/submit-button";
import { updateProfile } from "@/app/actions/auth";
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
        <form action={updateProfile} className="mt-10 space-y-3 rounded-2xl border border-line bg-cream p-6">
          <h2 className="font-display text-2xl">Edit profile</h2>
          <label className="block text-sm">
            Name
            <input name="name" defaultValue={profile.name} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
          </label>
          <label className="block text-sm">
            Bio
            <textarea name="bio" defaultValue={profile.bio || ""} rows={4} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
          </label>
          <SubmitButton>Save</SubmitButton>
        </form>
      ) : null}
      <p className="mt-8 text-sm">
        <Link href="/talents" className="underline decoration-copper/40">
          All talents
        </Link>
      </p>
    </div>
  );
}
