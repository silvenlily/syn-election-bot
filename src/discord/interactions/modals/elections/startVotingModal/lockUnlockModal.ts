import { MessageActionRow, MessageButton, Client, Snowflake, TextChannel, MessageEmbedOptions } from "discord.js";
import { startVotingModal } from "../../../../../types/modals/startVoting";
import Store from "../../../../../utils/store";

async function updateModal(
  client: Client,
  msgId: Snowflake,
  channelId: Snowflake,
  actionRow: MessageActionRow,
  embed: MessageEmbedOptions
) {
  let ch = (await client.channels.fetch(channelId)) as TextChannel;
  let msg = await ch.messages.fetch(msgId);
  await msg.edit({ embeds: [embed], components: [actionRow] });
}

export async function lockStartVotingModal(modal: startVotingModal, client: Client, store: Store) {
  let row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(`modal-electionVoteStart-${modal.electionId}`)
      .setLabel("Vote!")
      .setStyle("SUCCESS")
      .setDisabled(true)
  );

  var embed: MessageEmbedOptions = {
    author: { name: "Vote in election" },
    title: modal.electionName,
    color: "LUMINOUS_VIVID_PINK",
    fields: [
      { name: "election id", value: `${modal.electionCode}` },
      { name: "Voting started", value: new Date(modal.voteStartDate).toUTCString() },
      { name: "Voting ended", value: new Date(modal.voteEndDate).toUTCString() },
    ],
    footer: { text: "After clicking vote you have 15 minutes to submit your vote." },
  };

  updateModal(client, modal.msgId, modal.channelId, row, embed);
}

export async function unlockStartVotingModal(modal: startVotingModal, client: Client, store: Store) {
  let row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(`modal-electionVoteStart-${modal.electionId}`)
      .setLabel("Vote!")
      .setStyle("SUCCESS")
      .setDisabled(false)
  );

  var embed: MessageEmbedOptions = {
    author: { name: "Vote in election" },
    title: modal.electionName,
    color: "LUMINOUS_VIVID_PINK",
    fields: [
      { name: "election id", value: `${modal.electionCode}` },
      { name: "Voting started", value: new Date(modal.voteStartDate).toUTCString() },
      { name: "Voting will end", value: new Date(modal.voteEndDate).toUTCString() },
    ],
    footer: { text: "After clicking vote you have 15 minutes to submit your vote." },
  };

  updateModal(client, modal.msgId, modal.channelId, row, embed);
}
