import type Store from "../../utils/store";
import type eventScheduler from "../../utils/eventScheduler";

import type { Client } from "discord.js";

import scheduleTasksStartVotingModal from "../interactions/modals/elections/startVotingModal/scheduleTasks";

export default async function loadElectionModals(store: Store, scheduler: eventScheduler, client: Client) {
  let modals = store.collections.modals.find({ modalType: "startVotingModal" });
  modals.forEach((modal) => {
    scheduleTasksStartVotingModal(modal, scheduler, client, store);
  });
}
