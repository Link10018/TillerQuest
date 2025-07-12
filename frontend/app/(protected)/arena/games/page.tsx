import MainContainer from "@/components/MainContainer";
import React from "react";
import { notFound } from "next/navigation";
import { getUserById } from "@/data/user/getUser";
import GameLeaderboard from "./_components/GameLeaderboard";
import GameTabs from "./_components/GameTabs";
import { requireActiveUser } from "@/lib/redirectUtils";

async function Games() {
  const session = await requireActiveUser();

  if (!session?.user) {
    return notFound();
  }

  const user = await getUserById(session.user.id);

  if (!user) {
    return notFound();
  }

  return (
    <MainContainer>
      <GameTabs user={user} />
      <div className="flex justify-center mt-5">
        <GameLeaderboard gameName="TypeQuest" />
      </div>
    </MainContainer>
  );
}

export default Games;
