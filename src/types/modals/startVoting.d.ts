import { guildModalBase } from "./base";

export interface startVotingModal extends guildModalBase {
  electionName: string;
  electionCode: string;
  modalType: "startVotingModal";
  electionId: string;
  voting: boolean;
  voteStartDate: number;
  voteEndDate: number;
}
