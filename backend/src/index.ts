import express from "express";
import cors from "cors";
import { db } from "./lib/db.js";
import cron from "node-cron";
import {
  activateCosmicEvent,
  randomCosmic,
  removeCosmicPassivesAndAbilities,
  removeExpiredPassives,
  resetGuildEnemies,
  removeOldLogs,
  removePassivesWithDecreasedValues,
  removePassivesWithIncreasedValues,
  resetGameHighscores,
  resetUserTurns,
  sessionCleanup,
  triggerGuildEnemyDamage,
  weeklyGuildReset,
} from "./cronjobs.js";
// import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
// import { auth } from "./auth.js";
// import authRoutes from "./routes/auth.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import rateLimit from "express-rate-limit";
import { logger } from "lib/logger.js";

const app = express();

// ------ Uncomment the following line to enable Better Auth authentication ------
// app.use("/auth", authRoutes);

// app.all("/api/auth/{*any}", toNodeHandler(auth));

// ----------------------------------------------------------------------------

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

// Rate limiting to prevent abuse and DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.use(
  cors({
    origin: "http://localhost:3000", // The frontend's origin
    methods: ["GET"], //  Allowed HTTP methods: ["GET", "POST", "PUT", "DELETE"]
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);

// app.use("/api/me", async (req, res) => {
//   const session = await auth.api.getSession({
//     headers: fromNodeHeaders(req.headers),
//   });
//   res.json(session);
//   return;
// });

app.use("/api", leaderboardRoutes);

// const server = http.createServer(app);

// ---------------------- CRONJOBS ------------------------------

// Schedule a job to run every minute to remove expired abilities
cron.schedule(
  "* * * * *",
  async () => {
    const now = new Date();
    try {
      await db.$transaction(async (db) => {
        await removePassivesWithIncreasedValues(db, now);

        await removePassivesWithDecreasedValues(db, now);

        await removeExpiredPassives(db, now);
      });
      console.log("Expired passives removed");
    } catch (error) {
      console.error("Error removing expired passives:", error);
    }
  },
  {
    name: "removeExpiredPassivesService",
  },
);

// Schedule a job to run every day at 11:20 to activate cosmic event
cron.schedule(
  "20 11 * * *",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await activateCosmicEvent(db);
      });

      console.log("Triggered cosmic event");
    } catch (error) {
      console.error("Error triggering cosmic event:", error);
    }
  },
  {
    name: "triggerCosmicEventService",
  },
);

// Schedule a job to run at 16:00 every weekday to damage active players if the Enemy hasn't been defeated.
cron.schedule(
  "00 16 * * 1-5",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await triggerGuildEnemyDamage(db);
      });
      console.log("Enemy damage triggered.");
    } catch (error) {
      console.log(error);
    }
  },
  {
    name: "dungeonDamage",
  },
);

// Schedule a job to run every day at 23:58 PM, clears expired sessions and sessions not used in 30 days.
cron.schedule(
  "58 23 * * *",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await sessionCleanup(db);
      });
      console.log("Cleared expired sessions.");
    } catch (error) {
      console.log(error);
    }
  },
  {
    name: "clearExpiredSessions",
  },
);

// Schedule a job to run every sunday to remove game highscores
cron.schedule(
  "59 23 * * 0",
  async () => {
    try {
      db.$transaction(async (db) => {
        await resetGameHighscores(db);
      });
      console.log("Game highscore rewards granted, and leaderboard reset.");
    } catch (error) {
      console.error("Error during game highscore reset:", error);
    }
  },
  {
    name: "gameHighscoreResetService",
  },
);

// Schedule a job to run every day before midnight to remove all cosmic passives and abilities
cron.schedule(
  "00 00 * * *",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await removeCosmicPassivesAndAbilities(db);
      });

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      await db.log.deleteMany({
        where: {
          createdAt: { lte: twoWeeksAgo },
        },
      });

      console.log("Removed cosmic passives, abilities and logs.");
    } catch (error) {
      console.error(
        "Error removing cosmic passives, abilities and logs:",
        error,
      );
    }
  },
  {
    name: "generateRandomCosmicEventService",
  },
);

// Schedule a job to run every day at midnight to recommend a random cosmic event
cron.schedule(
  "01 00 * * *",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await randomCosmic(db);
      });
      console.log("Generated random cosmic event");
    } catch (error) {
      logger.error("Generated random cosmic event:", error);
    }
  },
  {
    name: "generateRandomCosmicEventService",
  },
);

// Schedule a job to run every sunday to reset guilds and set new guild leader
cron.schedule(
  "02 00 * * 0",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await weeklyGuildReset(db);
      });
      console.log("Weekly guild reset completed");
    } catch (error) {
      console.error("Error during weekly guild reset:", error);
    }
  },
  {
    name: "weeklyGuildResetService",
  },
);

// Schedule a job to run every weekday morning at 00:03 AM, resets all users turn.
cron.schedule(
  "03 0 * * 1-5",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await resetUserTurns(db);
      });
      console.log("Reset user turns.");
    } catch (error) {
      console.log(error);
    }
  },
  {
    name: "resetUserTurns",
  },
);

// Schedule a job to run every weekday at 00:04 AM, removes the guilds enemy if it's dead.
cron.schedule(
  "04 0 * * 1-5",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await resetGuildEnemies(db);
      });
      console.log("Removed dead guild enemies and updated guild levels.");
    } catch (error) {
      console.log(error);
    }
  },
  {
    name: "resetSlainEnemies",
  },
);

// Schedule a job to run every day before midnight to remove 14 day old logs
cron.schedule(
  "05 00 * * *",
  async () => {
    try {
      await db.$transaction(async (db) => {
        await removeOldLogs(db);
      });

      console.log("Removed old logs.");
    } catch (error) {
      console.error("Error removing old logs:", error);
    }
  },
  {
    name: "removeOldLogsService",
  },
);

// print out scheduled tasks
console.log("Started cron jobs:");
cron.getTasks().forEach((task) => {
  console.log(` - ${task.name}`);
});

app.listen(8080, () => {
  console.log("🚀 Server is running at http://localhost:8080");
});
// Might consider to disconnect from db if there is a short script running in a long process https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management#disconnect
// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prismaclient-in-long-running-applications
