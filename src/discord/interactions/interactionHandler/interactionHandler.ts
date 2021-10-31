import type { Interaction } from "discord.js";
import type Store from "../../../utils/store";
import type { RedisClient } from "redis";

import handleModal from "../modals/ModalHandler";

async function handleInteraction(interaction: Interaction, store: Store, cache: RedisClient) {
  if (interaction.isMessageComponent()) {
    let ids = interaction.customId.split("-");
    switch (ids[0]) {
      case "modal":
        handleModal(interaction, ids, store, cache);
        break;

      default:
        console.log("b " + ids[0]);
        interaction.reply({ content: "Something went wrong...", ephemeral: true });
        break;
    }
  }
}

export default handleInteraction;
