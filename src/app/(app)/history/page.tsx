import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { HistoryContent } from "./HistoryContent";

export default async function HistoryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return <HistoryContent />;
}
