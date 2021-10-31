import type { Snowflake } from "discord-api-types";
import {
  ButtonInteraction,
  Client,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageSelectMenu,
  MessageSelectOptionData,
  Message,
} from "discord.js";
import type { RedisClient } from "redis";
import type Store from "../../../../../utils/store";
import type modalState from "../votingModal/voteModalState";

import { promisify } from "util";
import { Election } from "../../../../../types/elections/Election";

interface args {
  store: Store;
  cache: RedisClient;
  userId: Snowflake;
  electionId: string;
  interaction: MessageComponentInteraction | CommandInteraction;
  channel: Snowflake;
  client: Client;
}

export default async function createVotingModal(args: args) {
  let { store, cache, userId, electionId, client, interaction } = args;

  const getAsync = promisify(cache.get).bind(cache);

  const reply = interaction.reply.bind(interaction);

  let currentUsersModal = await getAsync(`elections:voteModals:${userId}`);

  if (currentUsersModal) {
    let state = JSON.parse(currentUsersModal);
    let expMin = Math.floor((state.expireAt - Date.now()) / 60000);
    let expSec = Math.floor((state.expireAt - Date.now()) / 1000) - expMin * 60;

    reply({
      embeds: [
        {
          title: "Could not create voting modal",
          description: `It looks like you already have an active voting modal. Please either submit your vote, cancel the modal, or wait ${expMin}:${expSec} for it to expire.`,
        },
      ],
      ephemeral: true,
    });
    return;
  }

  let election = await store.collections.elections.findOne({ id: electionId });

  if (!election) {
    reply({
      embeds: [
        {
          title: "Could not create voting modal",
          description: "An election with that id does not exist.",
        },
      ],
      ephemeral: true,
    });
    return;
  }

  if (new Date(election.voteStartDate).valueOf() > Date.now()) {
    reply({
      embeds: [{ title: "Could not create voting modal", description: "Voting has not yet started for this election." }],
      ephemeral: true,
    });
    return;
  }

  if (new Date(election.voteEndDate).valueOf() < Date.now()) {
    reply({
      embeds: [{ title: "Could not create voting modal", description: "Voting has already ended for this election." }],
      ephemeral: true,
    });
    return;
  }

  if (election.votedUsers.includes(interaction.user.id)) {
    reply({
      embeds: [{ title: "Could not create voting modal", description: "You have already voted in this election." }],
      ephemeral: true,
    });
    return;
  }

  let candidates: MessageSelectOptionData[] = [];

  for (let i = 0; i < election.candidates.length; i++) {
    candidates.push({ label: election.candidates[i].name, value: election.candidates[i].id });
  }

  let candidateSelector = new MessageActionRow().addComponents(
    new MessageSelectMenu({ customId: `modal-electionVote-candidateSelector-${election.id}`, options: candidates })
  );

  let modalMenu = new MessageActionRow().addComponents(
    ...[
      new MessageButton({
        label: "Next",
        customId: `modal-electionVote-next-${election.id}`,
        style: "PRIMARY",
        disabled: true,
      }),
      new MessageButton({
        label: "Back",
        customId: `modal-electionVote-back-${election.id}`,
        style: "PRIMARY",
        disabled: true,
      }),
      new MessageButton({
        label: "Submit",
        customId: `modal-electionVote-submit-${election.id}`,
        style: "DANGER",
        disabled: true,
      }),
      new MessageButton({
        label: "Cancel",
        customId: `modal-electionVote-cancel-${election.id}`,
        style: "DANGER",
      }),
    ]
  );

  let msg = await interaction.reply({
    embeds: [
      {
        title: election.name,
        description: "Choose first place candidate",
        color: "DARK_VIVID_PINK",
        footer: { text: "Modal expires in 15 minutes." },
      },
    ],
    components: [candidateSelector, modalMenu],
    ephemeral: true,
    fetchReply: true,
  });

  let state: modalState = {
    user: userId,
    expireAt: Date.now() + 900000,
    selected: { id: "", name: "" },
    election: {
      name: election.name,
      id: election.id,
      candidates: election.candidates,
      remainingCandidates: election.candidates,
      votes: [],
    },
    message: {
      id: msg.id,
      channelId: interaction.channelId!,
      guildId: interaction.guildId!,
    },
  };

  cache.setex(`elections:voteModals:${userId}`, 900, JSON.stringify(state));
}
