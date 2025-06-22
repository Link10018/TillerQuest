import MainContainer from "@/components/MainContainer";
import { getAllDeadUsers } from "@/data/admin/adminUserInteractions";
import { Button, Paper, Typography } from "@mui/material";
import Link from "next/link";
import React from "react";

export default async function GameMasterPage() {
  const deadUsers = await getAllDeadUsers();

  return (
    <MainContainer>
      <Typography variant="h1" align="center">
        Game Master
      </Typography>
      <Paper
        className="p-5 flex flex-col justify-center w-2/3 m-auto text-center gap-6"
        elevation={6}
      >
        {deadUsers && (
          <Typography color={"red"} variant="h3">
            Dead users: {deadUsers.length}
          </Typography>
        )}
        <div className="flex justify-evenly">
          {deadUsers && (
            <Link href={`/gamemaster/resurrect/`}>
              <Button variant="contained" color="error">
                Resurrect
              </Button>
            </Link>
          )}
        </div>
      </Paper>
      <div className="flex mt-10 justify-evenly">
        <Link href="/gamemaster/guilds">
          <Button color="secondary" variant="contained">
            Guilds
          </Button>
        </Link>
        <Link href="/gamemaster/manage">
          <Button color="secondary" variant="contained">
            Manage users
          </Button>
        </Link>
        <Link href="/gamemaster/dungeons">
          <Button color="secondary" variant="contained">
            Dungeons
          </Button>
        </Link>
        <Link href="/gamemaster/cosmic">
          <Button color="secondary" variant="contained">
            Cosmic
          </Button>
        </Link>
        <Link href="/gamemaster/users">
          <Button color="secondary" variant="contained">
            GM powers
          </Button>
        </Link>
        <Link href="/gamemaster/log">
          <Button color="secondary" variant="contained">
            Log
          </Button>
        </Link>
        <Link href="/gamemaster/abilities">
          <Button color="secondary" variant="contained" disabled={true}>
            Ability management
          </Button>
        </Link>
      </div>
    </MainContainer>
  );
}
