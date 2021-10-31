import type { Snowflake } from "discord-api-types";
import type { baseModal } from "../base/InteractionModal";

export interface voteModal extends baseModal {
  id: Snowflake /* interaction id */;
  uid: Snowflake /* voting user id */;
  election: string /* election id hash */;
  state: {};
}
