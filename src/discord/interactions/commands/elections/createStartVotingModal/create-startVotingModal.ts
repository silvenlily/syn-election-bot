import {
  ButtonInteraction,
  ChatInputApplicationCommandData,
  CommandInteraction,
  MessageActionRow,
  MessageActionRowOptions,
  MessageButton,
  PermissionString,
  Snowflake,
} from "discord.js";
import type { Config } from "../../../../../utils/validateConfig";
import type Store from "../../../../../utils/store";
import type { Client } from "discord.js";
import type { RedisClient } from "redis";

import { Permissions } from "discord.js";

import { Election } from "../../../../../types/elections/Election";
import scheduleTasksStartVotingModal from "../../../modals/elections/startVotingModal/scheduleTasks";
import { startVotingModal } from "../../../../../types/modals/startVoting";
import EventScheduler from "../../../../../utils/eventScheduler";

let command: ChatInputApplicationCommandData = {
  name: "create-vote-modal",
  description: "creates a voting modal",
  options: [{ name: "id", type: "STRING", description: "election id", required: true }],
};

async function handler(
  interaction: CommandInteraction,
  args: { cache: RedisClient; store: Store; bot: Client; settings: Config; scheduler: EventScheduler }
) {
  try {
    if (!interaction.member) {
      interaction.reply({ content: "This command must be used in a guild" });
      return;
    }

    // create permissions object if member.permissions is permission string instead of permissions object
    if (typeof interaction.member.permissions == "string") {
      var perms: Readonly<Permissions> = new Permissions(interaction.member.permissions as PermissionString).freeze();
    } else {
      var perms: Readonly<Permissions> = interaction.member.permissions;
    }

    // check if user has admin
    if (!perms.has("ADMINISTRATOR")) {
      interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
      return;
    }

    let id = interaction.options.getString("id") as string;
    let { cache, store, bot, settings } = args;
    let election: Election | null = await store.collections.elections.findOne({ code: id });

    if (!election) {
      interaction.reply({ content: `Could not find election with id: ${id}`, ephemeral: true });
      return;
    }

    if (new Date(election.voteEndDate).valueOf() < Date.now()) {
      interaction.reply({
        embeds: [
          {
            title: "Could not create voting modal",
            description: "Voting ended for this election on " + `${new Date(election.voteEndDate).toUTCString()}.`,
          },
        ],
        ephemeral: true,
      });
      return;
    }

    if (election.candidates.length < 2) {
      interaction.reply({
        content: `There must be at least two canadates to create a vote modal, there are currently ${election.candidates.length}`,
        ephemeral: true,
      });
      return;
    }

    interaction.reply({ content: "Creating vote modal...", ephemeral: true });

    let row = new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`modal-electionVoteStart-${election.id}`).setLabel("Vote!").setStyle("SUCCESS")
    );

    if (election.voteStartDate.valueOf() < Date.now()) {
      var voting = true;
    } else {
      var voting = false;
    }
    console.log(`create startvotingmodal - voting: ${voting}`);
    if (voting) {
      var msg = await interaction.channel?.send({
        embeds: [
          {
            author: { name: "Vote in election" },
            title: election.name,
            color: "LUMINOUS_VIVID_PINK",
            fields: [
              { name: "election id", value: `${election.code}` },
              { name: "Voting started", value: election.voteStartDate.toUTCString() },
              { name: "Voting will end", value: election.voteEndDate.toUTCString() },
            ],
            footer: { text: "After clicking vote you have 15 minutes to submit your vote." },
          },
        ],
        components: [row],
      });
    } else {
      row.components[0].setDisabled(true);
      var msg = await interaction.channel?.send({
        embeds: [
          {
            author: { name: "Vote in election" },
            title: election.name,
            color: "LUMINOUS_VIVID_PINK",
            fields: [
              { name: "election id", value: election.code },
              { name: "voting will start", value: new Date(election.voteStartDate).toUTCString() },
            ],
            footer: { text: "After clicking vote you have 15 minutes to submit your vote." },
          },
        ],
        components: [row],
      });
    }

    let modal: startVotingModal = {
      electionName: election.name,
      electionCode: election.code,
      baseType: "guild",
      guildId: interaction.guildId!,
      msgId: msg!.id,
      channelId: interaction.channelId,
      modalType: "startVotingModal",
      electionId: election.id,
      voting: voting,
      voteEndDate: election.voteEndDate.valueOf(),
      voteStartDate: election.voteStartDate.valueOf(),
    };
    args.store.collections.modals.insertOne(modal);
    scheduleTasksStartVotingModal(modal, args.scheduler, interaction.client, args.store);
  } catch (error) {
    console.log(error);
    interaction.reply("Something went wrong...");
  }
}

export { command, handler };
export default { command: command, handler: handler };
