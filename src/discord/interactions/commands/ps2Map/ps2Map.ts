import type {
  ChatInputApplicationCommandData,
  CommandInteraction,
  Client,
  PermissionString,
  GuildChannel,
} from "discord.js";
import type { RedisClient } from "redis";
import type Store from "../../../../utils/store";
import type { Config } from "../../../../utils/validateConfig";

import { Permissions } from "discord.js";
import { util } from "@silver_lily/census-lib";

let command: ChatInputApplicationCommandData = {
  name: "ps2-map",
  description: "manages an elections canadates",
  options: [
    {
      name: "create",
      type: "SUB_COMMAND",
      description: "creates a live map",
      options: [
        {
          name: "continent",
          type: "STRING",
          description: "continent",
          required: true,
          choices: [
            { name: "indar", value: "indar" },
            { name: "hossin", value: "hossin" },
            { name: "esamir", value: "esamir" },
            { name: "amerish", value: "amerish" },
            { name: "koltyr", value: "koltyr" },
          ],
        },
        {
          name: "server",
          type: "STRING",
          description: "server",
          required: true,
          choices: [
            { name: "connery", value: "connery" },
            { name: "emerald", value: "emerald" },
            { name: "cobalt", value: "cobalt" },
            { name: "miller", value: "miller" },
            { name: "soltech", value: "soltech" },
            { name: "jaeger", value: "jaeger" },
          ],
        },
      ],
    },
    {
      name: "remove",
      type: "SUB_COMMAND",
      description: "removes a live map",
      options: [{ name: "id", type: "STRING", description: "message id of live map", required: true }],
    },
  ],
};

async function handler(
  interaction: CommandInteraction,
  args: { cache: RedisClient; store: Store; bot: Client; settings: Config }
) {
  let { cache, store, bot, settings } = args;
  //check if command is being used in a guild
  if (!interaction.member || !interaction.channel) {
    interaction.reply({ content: "This command must be used in a guild" });
    return;
  }

  // check if user has admin
  let guild = await interaction.client.guilds.fetch(interaction.guildId!);
  let member = await guild.members.fetch(interaction.user.id);

  if (!(interaction.channel as GuildChannel).permissionsFor(member).has("MANAGE_CHANNELS")) {
    interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
    return;
  }

  let sub = interaction.options.getSubcommand();

  if (sub == "create") {
    let server = {
      name: interaction.options.getString("server", true),
      id: util.serverIdFromName(interaction.options.getString("server", true)),
    };

    let world = {
      name: interaction.options.getString("continent", true),
    };

    if (!server.id) {
      interaction.reply(`Could not resolve server: ${server.name}.`);
      return;
    }

    interaction.channel.send({ embeds: [{ title: `${server.name}` }] });

    return;
  }

  if (sub == "remove") {
    return;
  }
}

export { command, handler };
export default { command: command, handler: handler };
