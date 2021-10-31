import type { CommandInteraction } from "discord.js";
import type { Collection } from "mongodb";
import type { candidate } from "../../../../../types/elections/candidate";
import type { Election } from "../../../../../types/elections/Election";

export default function removeCanadate(
  interaction: CommandInteraction,
  election: Election,
  elections: Collection<Election>,
  electionCode: string
) {
  let user = interaction.options.getUser("canadate")!;
  let canadate: candidate = { id: user.id, name: user.username };

  if (
    election.candidates.filter((c) => {
      if (c.id == canadate.id) return true;
      else return false;
    }).length == 0
  ) {
    interaction.reply({
      embeds: [
        {
          title: "Could not modify canadates",
          description: "This user is not a canadate in this election.",
        },
      ],
      ephemeral: true,
    });
    return;
  }

  elections.updateOne(
    { code: electionCode },
    {
      $pull: { candidates: canadate },
    }
  );

  interaction.reply({
    embeds: [
      {
        title: "Canadate removed:",
        color: "LUMINOUS_VIVID_PINK",
        fields: [
          { name: "election", value: election.name, inline: false },
          { name: "election id", value: election.code, inline: false },
          { name: "name", value: canadate.name, inline: false },
          { name: "id", value: canadate.id, inline: false },
        ],
      },
    ],
  });
}
