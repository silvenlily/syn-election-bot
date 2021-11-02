import type Store from "../../../../../utils/store";
import type { RedisClient } from "redis";
import type {
  Client,
  Message,
  MessageComponentInteraction,
  SelectMenuInteraction,
  Snowflake,
  TextBasedChannels,
} from "discord.js";

import { MessageActionRow, MessageSelectMenu, MessageButton } from "discord.js";

import modalState from "./voteModalState";

import { promisify } from "util";

function getModalMenu(state: modalState) {
  if (state.selected.id == "") {
    var disableNext = true;
  } else {
    var disableNext = false;
  }

  if (state.election.votes.length == 0) {
    var disableSubmit = true;
  } else {
    var disableSubmit = false;
  }

  return new MessageActionRow().addComponents(
    ...[
      new MessageButton({
        label: "Next",
        customId: `modal-electionVote-next-${state.election.id}`,
        style: "PRIMARY",
        disabled: disableNext,
      }),
      new MessageButton({
        label: "Back",
        customId: `modal-electionVote-back-${state.election.id}`,
        style: "PRIMARY",
        disabled: disableSubmit,
      }),
      new MessageButton({
        label: "Submit",
        customId: `modal-electionVote-submit-${state.election.id}`,
        style: "DANGER",
        disabled: disableSubmit,
      }),
      new MessageButton({
        label: "Cancel",
        customId: `modal-electionVote-cancel-${state.election.id}`,
        style: "DANGER",
      }),
    ]
  );
}

function getcandidateSelector(state: modalState) {
  if (state.election.remainingCandidates.length < 1) {
    return undefined;
  }
  let candidates = [];

  for (let i = 0; i < state.election.remainingCandidates.length; i++) {
    candidates.push({
      label: state.election.remainingCandidates[i].name,
      value: state.election.remainingCandidates[i].id,
    });
  }

  return new MessageActionRow().addComponents(
    new MessageSelectMenu({
      customId: `modal-electionVote-candidateSelector-${state.election.id}`,
      options: candidates,
    }).setPlaceholder(state.selected.name)
  );
}

async function updateModal(interaction: MessageComponentInteraction, state: modalState) {
  let candidateSelector = getcandidateSelector(state);
  let modalMenu = getModalMenu(state);

  if (state.election.votes.length >= 1) {
    var desc = "Choose next favorite candidate or submit.";
    for (let i = 0; i < state.election.votes.length; i++) {
      desc = desc + `\n ${i + 1} - ${state.election.votes[i].name}`;
    }
  } else {
    var desc = "Choose first place candidate";
  }

  let expMin = Math.floor((state.expireAt - Date.now()) / 60000) + 1;

  if (candidateSelector) {
    interaction.update({
      embeds: [
        {
          title: state.election.name,
          description: desc,
          footer: { text: `Modal expires in ${expMin} minutes.` },
          color: "DARK_VIVID_PINK",
        },
      ],
      components: [candidateSelector, modalMenu],
    });
    return;
  }

  interaction.update({
    embeds: [
      {
        title: state.election.name,
        description: desc,
        footer: { text: `Modal expires in ${expMin} minutes.` },
        color: "DARK_VIVID_PINK",
      },
    ],
    components: [modalMenu],
  });
}

interface args {
  store: Store;
  cache: RedisClient;
  interaction: MessageComponentInteraction;
}

export default async function handleVoteModal(args: args) {
  let { interaction, cache, store } = args;
  let modalIds = interaction.customId.split("-");
  let action = modalIds[2];

  const getAsync = promisify(cache.get).bind(cache);

  let stateRaw = await getAsync(`elections:voteModals:${interaction.user.id}`);

  if (!stateRaw) {
    interaction.reply({ content: "This menu has expired.", ephemeral: true });
    return;
  }

  let state: modalState = JSON.parse(stateRaw);

  if (action == "candidateSelector") {
    state.selected.id = (interaction as SelectMenuInteraction).values[0];
    state.selected.name = state.election.candidates.find((e) => {
      if (e.id == state.selected.id) return true;
    })!.name;
    updateModal(interaction, state);
    let remTime = Math.round((state.expireAt - Date.now()) / 1000);
    cache.setex(`elections:voteModals:${interaction.user.id}`, remTime, JSON.stringify(state));
    return;
  }

  if (action == "cancel") {
    interaction.update({ embeds: [{ title: "Voting canceled" }], components: [] });
    cache.del(`elections:voteModals:${interaction.user.id}`);
    return;
  }

  if (action == "back") {
    if (state.election.votes.length == 0) {
      interaction.deferUpdate();
      return;
    }

    let last = state.election.votes.pop()!;
    state.selected = { id: "", name: "" };

    state.election.remainingCandidates.push(last);
    updateModal(interaction, state);

    let remTime = Math.round((state.expireAt - Date.now()) / 1000);
    cache.setex(`elections:voteModals:${interaction.user.id}`, remTime, JSON.stringify(state));
    return;
  }

  if (action == "next") {
    let rem = state.election.remainingCandidates.filter((e) => {
      if (e.id != state.selected.id) return true;
    });
    state.election.remainingCandidates = rem;

    state.election.votes.push({ id: state.selected.id, name: state.selected.name });

    state.selected = { id: "", name: "" };

    updateModal(interaction, state);

    let remTime = Math.round((state.expireAt - Date.now()) / 1000);
    cache.setex(`elections:voteModals:${interaction.user.id}`, remTime, JSON.stringify(state));
    return;
  }

  if (action == "submit") {
    if (state.election.votes.length == 0) {
      interaction.deferUpdate();
      return;
    }

    let votedFor: string[] = [];
    let votes = [];
    for (let i = 0; i < state.election.votes.length; i++) {
      votes.push(state.election.votes[i].id);
      votedFor.push(`${i + 1} - ${state.election.votes[i].name}`);
    }

    await store.collections.elections.updateOne(
      { id: state.election.id },
      { $push: { votes: votes, votedUsers: interaction.user.id } }
    );

    interaction.update({
      embeds: [
        {
          title: "Votes cast!",
          fields: [
            { name: "election:", value: state.election.name },
            { name: "Votes:", value: votedFor.join("\n") },
          ],
          footer: { text: `Hashcode: ${state.election.id}` },
          color: "DARK_VIVID_PINK",
        },
      ],
      components: [],
    });
    cache.del(`elections:voteModals:${interaction.user.id}`);
    return;
  }

  console.log(`unhandled event: ${action}`);
}
