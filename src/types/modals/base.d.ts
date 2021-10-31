import { Snowflake } from "discord-api-types";

export interface modalBase {
  msgId: Snowflake;
  channelId: Snowflake;
  baseType: "guild" | "dm" | "generic";
}

export interface guildModalBase extends modalBase {
  guildId: Snowflake;
  baseType: "guild";
}

export interface dmModalBase extends modalBase {
  ownerId: Snowflake;
  baseType: "dm";
}

export interface genericModalBase extends modalBase {
  baseType: "generic";
}

export { modalBase, genericModalBase, dmModalBase, guildModalBase };
