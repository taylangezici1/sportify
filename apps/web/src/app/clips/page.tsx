
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClipList from "@/components/ClipList";

export default async function ClipsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      clips: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const clips = user?.clips || [];

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Clips</h1>
        <div className="flex items-center gap-4">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-10 h-10 rounded-full border-2 border-green-500"
            />
          )}
        </div>
      </header>

      {clips.length === 0 ? (
        <div className="text-center text-neutral-400 mt-20">
          <p className="text-xl">No clips yet.</p>
          <p className="mt-2">Go to a playlist and create some clips!</p>
        </div>
      ) : (
        <ClipList clips={clips} />
      )}
    </main>
  );
}
