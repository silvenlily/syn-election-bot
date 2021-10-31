import type { ChatInputApplicationCommandData, CommandInteraction, PermissionString, Snowflake } from "discord.js";
import type { Config } from "../../../../../utils/validateConfig";
import type Store from "../../../../../utils/store";
import type { Client } from "discord.js";
import type { RedisClient } from "redis";

import { Permissions } from "discord.js";

import { generate as randomString } from "randomstring";
import createElectionObject from "./createElectionObject";

let command: ChatInputApplicationCommandData = {
  name: "create-election",
  description: "creates an election",
  options: [
    { name: "name", type: "STRING", description: "election name", required: true },
    {
      name: "voting-start",
      type: "STRING",
      description: "format: 'dd/mm/yy hh:mm' timezone must be UTC",
      required: true,
    },
    {
      name: "voting-end",
      type: "STRING",
      description: "format: 'dd/mm/yy hh:mm' timezone must be UTC",
      required: true,
    },
  ],
};

let handler = async function (
  interaction: CommandInteraction,
  args: { cache: RedisClient; store: Store; bot: Client; settings: Config }
) {
  //check if command is being used in a guild
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

  //extract args from args
  let { cache, store, bot, settings } = args;

  let election = await createElectionObject(interaction, store);

  if (!election) return;

  // push election to db
  store.collections.elections.insertOne(election);

  interaction.reply({
    embeds: [
      {
        title: "Election created:",
        color: "LUMINOUS_VIVID_PINK",
        fields: [
          { name: "name", value: election.name, inline: false },
          { name: "id", value: election.code, inline: false },
          { name: "voting start", value: election.voteStartDate.toUTCString(), inline: false },
          { name: "voting end", value: election.voteEndDate.toUTCString(), inline: false },
        ],
        footer: { text: `hashcode: ${election.id}` },
      },
    ],
  });
};

export { command, handler };
export default { command: command, handler: handler };
