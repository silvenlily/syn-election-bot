import type SlashLib from "silver-lily-slash-lib";
import type Store from "../utils/store";
import type { Client } from "discord.js";
import type { RedisClient } from "redis";
import type { Config } from "../utils/validateConfig";
import type EventScheduler from "../utils/eventScheduler";

import createElection from "./interactions/commands/elections/create-election/create-election";
import createVoteModal from "./interactions/commands/elections/createStartVotingModal/create-startVotingModal";
import canadates from "./interactions/commands/elections/canadates/canadates";
import countVotes from "./interactions/commands/elections/count-votes/count-votes";

function createCommands(
  slashLib: SlashLib,
  cache: RedisClient,
  store: Store,
  bot: Client,
  settings: Config,
  scheduler: EventScheduler
) {
  console.log("creating commands");
  slashLib.createCommand(countVotes.command, countVotes.handler, {
    store: store,
  });

  slashLib.createCommand(createElection.command, createElection.handler, {
    store: store,
    cache: cache,
    bot: bot,
    settings: settings,
  });

  slashLib.createCommand(createVoteModal.command, createVoteModal.handler, {
    store: store,
    cache: cache,
    bot: bot,
    settings: settings,
    scheduler: scheduler,
  });

  slashLib.createCommand(canadates.command, canadates.handler, {
    store: store,
    cache: cache,
    bot: bot,
    settings: settings,
  });
}

export default createCommands;
