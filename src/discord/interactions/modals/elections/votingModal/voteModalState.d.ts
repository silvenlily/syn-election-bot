import type { Snowflake } from "discord.js";
import type { candidate } from "../../../../types/elections/candidate";

export interface vote {
  id: string;
  name: string;
}

export default interface modalState {
  user: Snowflake;
  expireAt: number;
  selected: {
    id: Snowflake;
    name: string;
  };
  election: {
    name: string;
    id: string;
    candidates: candidate[];
    remainingCandidates: candidate[];
    votes: vote[];
  };
  message: {
    id: Snowflake;
    channelId: Snowflake;
    guildId: Snowflake;
  };
}
