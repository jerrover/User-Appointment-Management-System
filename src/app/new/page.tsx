import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateForm from "./create-form";

export default async function NewAppointmentPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const currentUser = await db.user.findUnique({
    where: { id: session.sub as string },
  });

  if (!currentUser) redirect("/login");

  const users = await db.user.findMany({
    where: { NOT: { id: session.sub as string } },
  });

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gray-50/50">
      <CreateForm users={users} currentUser={currentUser} />
    </div>
  );
}