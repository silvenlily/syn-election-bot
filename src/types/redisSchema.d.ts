import { Snowflake } from "discord-api-types";

import type { candidate } from "./elections/candidate";
import type { vote } from "./elections/vote";

export type redisSchema = {
  modals: {
    guild: {};
    dm: {};
    generic: {};
  };
  elections: {
    voteModals: {
      [key: string /* user id */]: {};
    };
    electionList: {
      [key: string /* election id hash */]: {
        candidates: Map<Snowflake, candidate>;
        votes: vote[];
        votedUsers: { [key: Snowflake /* user id */]: true };
      };
    };
  };
};
