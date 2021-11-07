import type { Client, Snowflake, TextChannel, MessageOptions } from "discord.js";
import { Election } from "../../../../../types/elections/Election";

export default async function totalsMessage(client: Client, channel: Snowflake, winners: string[], election: Election) {
  let ch = (await client.channels.fetch(channel)) as TextChannel;
  let a: MessageOptions = {
    embeds: [
      {
        title: "Election Results:",
        fields: [
          { name: "election name:", value: election.name },
          { name: "election id:", value: election.code },
          { name: "election hashcode:", value: election.id },
        ],
      },
    ],
  };

  console.log(`winners: ${winners}`);

  if (winners.length == 0) {
    throw "Requires at least one winner";
  }

  a.embeds![0].fields!.push({
    name: "Winners",
    value: `<@${winners.join("> \n <@")}>`,
    inline: false,
  });

  ch.send(a);
}
