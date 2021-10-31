import dotenv from "dotenv";

type Config = {
  tokens: {
    discord: string;
    mongoDB: string;
    redis: string;
    census: string;
  };
  devMode: boolean;
  appID: string;
  adminIds: string[];
  debug?: boolean;
};

function assertEnvVarExists(setting: string) {
  try {
    if (!process.env[setting]) throw setting;
  } catch (error) {
    console.error("Missing required enviorment variable: " + error);
    process.exit(1);
  }
}

function validateConfig() {
  dotenv.config({ path: "./default.env" });
  dotenv.config({ path: "./config.env" });

  assertEnvVarExists("DISCORD_TOKEN");
  assertEnvVarExists("CENSUS_SERVICE_ID");
  assertEnvVarExists("MONGODB_URL");
  assertEnvVarExists("REDIS_URL");
  assertEnvVarExists("APP_ID");

  let adminIds: string[];

  if (process.env.ADMIN_IDS) {
    adminIds = JSON.parse(process.env.ADMIN_IDS);
  } else {
    adminIds = ["229331045726552066", "861353197952172102"];
  }

  const config: Config = {
    tokens: {
      discord: process.env.DISCORD_TOKEN!,
      mongoDB: process.env.MONGODB_URL!,
      redis: process.env.REDIS_URL!,
      census: process.env.CENSUS_SERVICE_ID!,
    },
    devMode: Boolean(process.env.DEV_MODE),
    debug: Boolean(process.env.DEBUG),
    appID: process.env.APP_ID!,
    adminIds: adminIds,
  };
  return config;
}

export { validateConfig, Config };
export default validateConfig;
