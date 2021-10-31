import type { CommandInteraction, MessageComponentInteraction } from "discord.js";
import type { Snowflake } from "discord.js";

class Modal {
  mId: Snowflake;

  constructor(mId: Snowflake) {
    this.mId = mId;
  }

  async send(channel: Snowflake) {}
  async reply(interaction: CommandInteraction | MessageComponentInteraction) {
    interaction.applicationId;
  }
}

export { Modal };
export default Modal;
