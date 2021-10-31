import type { RedisClient } from "redis";
import type Store from "../../utils/store";
import type eventScheduler from "../../utils/eventScheduler";
import type { Client } from "discord.js";

import loadElectionModals from "./loadElections";

export default async function loadState(cache: RedisClient, store: Store, scheduler: eventScheduler, client: Client) {
  loadElectionModals(store, scheduler, client);
}
