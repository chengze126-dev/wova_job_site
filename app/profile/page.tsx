import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function OwnProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(`/profile/${user.id}`);
}
