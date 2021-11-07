import type { ChatInputApplicationCommandData, CommandInteraction, PermissionString, Snowflake } from "discord.js";
import type Store from "../../../../../utils/store";

import totalsMessage from "./totalsMessage";
import { Permissions } from "discord.js";
import { Election } from "../../../../../types/elections/Election";
import voteCounter from "../../../../elections/voteCounter";
import { createRequire } from "module";

let command: ChatInputApplicationCommandData = {
  name: "count-votes",
  description: "counts votes",
  options: [{ name: "id", type: "STRING", description: "election name", required: true }],
};

let handler = async function (interaction: CommandInteraction, args: { store: Store }) {
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
  let { store } = args;

  let id = interaction.options.getString("id", true);
  let election: Election | null = await store.collections.elections.findOne({ code: id });

  if (!election) {
    interaction.reply("not an election");
    return;
  }

  let candidates: string[] = [];

  for (let i = 0; i < election.candidates.length; i++) {
    candidates.push(election.candidates[i].id);
  }

  interaction.reply({ content: "counting votes...", ephemeral: true });
  let counter = new voteCounter(election.votes, candidates, election.numWinners, election.id);
  let winners = counter.count();

  console.log(`B - winners - ${winners}`);

  totalsMessage(interaction.client, interaction.channelId, winners, election);
};

export { command, handler };
export default { command: command, handler: handler };
