import { Snowflake } from "discord-api-types";
import type { candidate } from "./candidate";
import type { vote } from "./vote";

export type Election = {
  id: string;
  name: string;
  code: string;
  archived: boolean;
  voteStartDate: Date;
  voteEndDate: Date;
  candidates: candidate[];
  votedUsers: Snowflake[];
  votes: Snowflake[][];
};
