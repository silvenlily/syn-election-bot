import md5 from "md5";
import { generate as randomString } from "randomstring";
import type { CommandInteraction, Snowflake } from "discord.js";
import Store from "../../../../../utils/store";
import type { Election } from "../../../../../types/elections/Election";
let friendlyWords = require("friendly-words");

function generateElectionId(name: string, interactionId: Snowflake) {
  let id: string;
  if (name.length < 14) {
    id = `${name}${randomString(14)}`.substring(0, 13) + interactionId;
  } else {
    id = name.substring(0, 13) + interactionId;
  }

  return md5(id);
}

async function createElectionObject(interaction: CommandInteraction, store: Store) {
  // generate election attributes

  let electionName = interaction.options.getString("name", true);
  let electionId = generateElectionId(electionName, interaction.id);

  // start generating unique election code
  let electionCode: Promise<string | undefined> | string | undefined = (async () => {
    let i = 0;
    while (i < 64) {
      i++;
      let code =
        `${friendlyWords.predicates[Math.floor(Math.random() * friendlyWords.predicates.length)]}-` +
        `${friendlyWords.objects[Math.floor(Math.random() * friendlyWords.objects.length)]}`;
      let existing = await store.collections.elections.findOne({ code: code });
      if (!existing) {
        return code;
      }
    }
  })();

  const rejexString = /^([012][0-9]|3[01])\/(0[0-9]|1[012])\/(\d\d) (2[01234]|[01][0-9]):([0-5][0-9])$/g;

  // voting start date
  try {
    if (!interaction.options.getString("voting-start", true).match(rejexString)) {
      throw "";
    }
    var voteStart = (() => {
      let raw = interaction.options.getString("voting-start", true);
      let yr = `20${raw.substring(6, 8)}`;
      let mo = raw.substring(3, 5);
      let dy = raw.substring(0, 2);
      let hr = raw.substring(9, 11);
      let mi = raw.substring(12);

      let ms = Date.parse(`${yr}-${mo}-${dy}T${hr}:${mi}:00.000Z`);
      return new Date(ms);
    })();
  } catch (error) {
    interaction.reply({ content: "Unable to parse voting start date", ephemeral: true });
    return;
  }

  // voting end date
  try {
    if (!interaction.options.getString("voting-end", true).match(rejexString)) {
      throw "";
    }

    var voteEnd = (() => {
      let raw = interaction.options.getString("voting-end", true);
      let yr = `20${raw.substring(6, 8)}`;
      let mo = raw.substring(3, 5);
      let dy = raw.substring(0, 2);
      let hr = raw.substring(9, 11);
      let mi = raw.substring(12);

      let ms = Date.parse(`${yr}-${mo}-${dy}T${hr}:${mi}:00.000Z`);
      return new Date(ms);
    })();
  } catch (error) {
    interaction.reply({ content: "Unable to parse voting end date", ephemeral: true });
    return;
  }

  if (voteStart.valueOf() < Date.now()) {
    interaction.reply({
      embeds: [{ title: "Could not create election", description: "Voting start date must be in the future." }],
      ephemeral: true,
    });
    return;
  }

  if (voteStart.valueOf() > voteEnd.valueOf()) {
    interaction.reply({
      embeds: [
        { title: "Could not create voting modal", description: "Voting start date must occur before voting end date." },
      ],
      ephemeral: true,
    });
    return;
  }

  // shortcode
  electionCode = await electionCode;

  if (!electionCode) {
    interaction.reply({
      content: "Something went wrong... I couldnt seem to generate an election id.",
      ephemeral: true,
    });
    return;
  }

  let election: Election = {
    id: electionId,
    name: electionName,
    code: electionCode,
    archived: false,
    voteStartDate: voteStart,
    voteEndDate: voteEnd,
    votedUsers: [],
    candidates: [],
    votes: [],
  };

  return election;
}

export default createElectionObject;
