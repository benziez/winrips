import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { SessionAuthWall } from "../components/auth/SessionAuthWall";
import { PlayHistoryTable } from "../components/profile/PlayHistoryTable";

export function PlayHistoryView() {
  const { isLoggedIn, userId } = useApp();
  const { user, authLoading, isAuthenticated } = useAuth();

  const hasAccess =
    !authLoading &&
    isAuthenticated &&
    Boolean(user?.id) &&
    isLoggedIn &&
    Boolean(userId) &&
    user!.id === userId;

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="overflow-hidden rounded-md border border-[#2A2D34] bg-[#1A1C20]">
        <div className="border-b border-[#2A2D34] px-5 py-5 sm:px-6">
          <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            Play History
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#A0A5B5]">
            Review every box you have opened — pack cost, pulled item, gem value, and the
            provably-fair roll that determined your outcome.
          </p>
        </div>
      </section>

      {!hasAccess ? (
        <div className="mt-6">
          <SessionAuthWall description="Sign in to view your personal play history. Records are private to your account." />
        </div>
      ) : (
        <PlayHistoryTable className="mt-6" />
      )}
    </div>
  );
}
