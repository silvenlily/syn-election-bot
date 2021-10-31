import type { MessageComponentInteraction } from "discord.js";
import type { RedisClient } from "redis";
import type Store from "../../../utils/store";

import createVotingModal from "./elections/startVotingModal/startVotingModal";
import handleVoteModal from "./elections/votingModal/voteModal";

export default async function handleModal(
  interaction: MessageComponentInteraction,
  ids: string[],
  store: Store,
  cache: RedisClient
) {
  switch (ids[1]) {
    case "electionVoteStart":
      createVotingModal({
        client: interaction.client,
        channel: interaction.channelId,
        userId: interaction.user.id,
        store: store,
        cache: cache,
        interaction: interaction,
        electionId: ids[2],
      });
      break;

    case "electionVote":
      handleVoteModal({ interaction: interaction, store: store, cache: cache });
      break;

    default:
      console.log("a " + ids[1]);
      interaction.reply({ content: "Something went wrong...", ephemeral: true });
      break;
  }
}
