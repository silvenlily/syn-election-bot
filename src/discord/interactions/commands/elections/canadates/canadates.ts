import type { ChatInputApplicationCommandData, CommandInteraction, Client, PermissionString } from "discord.js";
import type { RedisClient } from "redis";
import type Store from "../../../../../utils/store";
import type { Config } from "../../../../../utils/validateConfig";

import { Permissions } from "discord.js";
import addCanadate from "./addCanadate";
import removeCanadate from "./removeCanadate";

let command: ChatInputApplicationCommandData = {
  name: "canadate",
  description: "manages an elections canadates",
  options: [
    {
      name: "add",
      type: "SUB_COMMAND",
      description: "adds a canadate to an election",
      options: [
        { name: "election", type: "STRING", description: "election id", required: true },
        { name: "canadate", type: "USER", description: "canadate", required: true },
      ],
    },
    {
      name: "remove",
      type: "SUB_COMMAND",
      description: "removes a canadate from an election",
      options: [
        { name: "election", type: "STRING", description: "election id", required: true },
        { name: "canadate", type: "USER", description: "canadate", required: true },
      ],
    },
  ],
};

async function handler(
  interaction: CommandInteraction,
  args: { cache: RedisClient; store: Store; bot: Client; settings: Config }
) {
  let { cache, store, bot, settings } = args;
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

  let electionCode = interaction.options.getString("election") as string;

  let elections = store.collections.elections;
  let election = await elections.findOne({ code: electionCode });

  if (!election) {
    interaction.reply({
      embeds: [
        {
          title: "Could not modify canadates",
          description: `Could not find election with id: ${electionCode}`,
        },
      ],
      ephemeral: true,
    });
    return;
  }

  if (new Date(election.voteStartDate).valueOf() < Date.now()) {
    interaction.reply({
      embeds: [
        {
          title: "Could not modify canadates",
          description: "This election has started voting, modifying canadates is not permitted.",
        },
      ],
      ephemeral: true,
    });
    return;
  }

  let sub = interaction.options.getSubcommand();

  if (sub == "add") {
    addCanadate(interaction, election, elections, electionCode);
    return;
  }

  if (sub == "remove") {
    removeCanadate(interaction, election, elections, electionCode);
    return;
  }
}

export { command, handler };
export default { command: command, handler: handler };
