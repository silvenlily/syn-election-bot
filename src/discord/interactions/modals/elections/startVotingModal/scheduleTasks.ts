import type { RedisClient } from "redis";
import type Store from "../../../../../utils/store";
import type eventScheduler from "../../../../../utils/eventScheduler";

import type { Client } from "discord.js";
import type { startVotingModal } from "../../../../../types/modals/startVoting";

import { lockStartVotingModal, unlockStartVotingModal } from "./lockUnlockModal";

export default async function scheduleTasksStartVotingModal(
  modal: startVotingModal,
  scheduler: eventScheduler,
  client: Client,
  store: Store
) {
  let endDate = new Date(modal.voteEndDate);
  // check if currently voting
  if (modal.voting) {
    console.log("currently voting");
    // currently voting
    // check if before end date
    if (Date.now() <= endDate.valueOf()) {
      console.log("before end date");
      // before end date
      // schedule locking voting modal
      scheduler.addTask(
        (args: { modal: startVotingModal; client: Client }) => {
          lockStartVotingModal(modal, client, store);
        },
        endDate.valueOf(),
        {
          modal: modal,
          client: client,
        }
      );
    } else {
      console.log("after end date");
      // after end date
      lockStartVotingModal(modal, client, store);
    }
  } else {
    // not currently voting
    // check if before end date
    if (Date.now() < endDate.valueOf()) {
      let startDate = new Date(modal.voteStartDate);
      // check if before start date
      if (Date.now() < startDate.valueOf()) {
        // before start date
        // schedule unlocking voting modal
        scheduler.addTask(
          (args: { modal: startVotingModal; client: Client }) => {
            unlockStartVotingModal(modal, client, store);
          },
          startDate.valueOf(),
          {
            modal: modal,
            client: client,
          }
        );
        // schedule locking voting modal
        scheduler.addTask(
          (args: { modal: startVotingModal; client: Client }) => {
            lockStartVotingModal(modal, client, store);
          },
          endDate.valueOf(),
          {
            modal: modal,
            client: client,
          }
        );
      } else {
        // after start date
        unlockStartVotingModal(modal, client, store);
      }
    }
  }
}
