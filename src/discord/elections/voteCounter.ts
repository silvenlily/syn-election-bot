import { randomBytes } from "crypto";
import { Snowflake } from "discord.js";
import { ContextMenuInteraction } from "discord.js";
import md5 from "md5";
import { resolve } from "path/posix";
import Random from "seed-random";

//seeded Fisher–Yates shuffle
function shuffle(array: any[], seed: string) {
  var m = array.length,
    t,
    i;

  while (m) {
    let a = Random(seed)() * m--;
    seed = md5(`${seed}${a}${m}`);
    i = Math.floor(a);

    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

export default class voteCounter {
  roundIndex: number;
  requiredToWin: number;
  canadates: string[];
  remainingCanadates: string[];
  eliminated: Snowflake[];
  votes: { power: number; votes: string[]; voteId: number }[];
  roundVotes: { [key: string]: number };
  rounds: { [key: string]: { total: number; voteIds: number[] } }[];
  numWinners: number;
  winners: Snowflake[];
  voteCount: number;
  constructor(votes: string[][], candidates: string[], winners: number, electionId: string) {
    this.votes = [];
    for (let i = 0; i < votes.length; i++) {
      this.votes.push({ power: 1, votes: votes[i], voteId: i });
    }
    this.votes = shuffle(this.votes, electionId);
    this.rounds = [];
    this.eliminated = [];
    this.roundVotes = {};
    this.roundIndex = -1;
    if (winners >= 1) {
      this.requiredToWin = 1 / winners;

      this.numWinners = winners;
    } else {
      this.requiredToWin = 0.5;
      this.numWinners = 1;
    }
    this.voteCount = 0;
    this.winners = [];
    this.canadates = shuffle(candidates, electionId);
    this.remainingCanadates = this.canadates;
    this.count = this.count.bind(this);
    this.__ResolveTie = this.__ResolveTie.bind(this);
    this._checkWinner = this._checkWinner.bind(this);
    this._countRoundVotes = this._countRoundVotes.bind(this);
    this._eliminateLowest = this._eliminateLowest.bind(this);
  }

  count() {
    console.log(`counting ${this.votes.length} votes for ${this.canadates.length} canadates`);
    console.log("votes " + JSON.stringify(this.votes));
    return this._countRoundVotes();
  }

  _countRoundVotes(): string[] {
    this.voteCount = 0;
    this.roundVotes = {};
    this.roundIndex++;
    console.log(`\ncounting votes for round ${this.roundIndex}`);

    if (this.roundIndex > 30) {
      console.log("too many rounds");
      return [];
    }

    this.rounds[this.roundIndex] = {};
    for (let i = 0; i < this.remainingCanadates.length; i++) {
      this.roundVotes[this.remainingCanadates[i]] = 0;
      this.rounds[this.roundIndex][this.remainingCanadates[i]] = { total: 0, voteIds: [] };
    }

    for (let a = 0; a < this.votes.length; a++) {
      for (let b = 0; b < this.votes[a].votes.length; b++) {
        if (!this.eliminated.includes(this.votes[a].votes[b])) {
          console.log(`${this.votes[a].voteId} voted for ${this.votes[a].votes[b]}`);
          this.roundVotes[this.votes[a].votes[b]] += this.votes[a].power;
          this.rounds[this.roundIndex][this.votes[a].votes[b]].total += this.votes[a].power;
          this.rounds[this.roundIndex][this.votes[a].votes[b]].voteIds.push(this.votes[a].voteId);
          this.voteCount += this.votes[a].power;
          break;
        }
      }
    }

    return this._checkWinner();
  }

  _checkWinner(): string[] {
    console.log("checking for winner");
    let winners = [];
    for (let i = 0; i < this.remainingCanadates.length; i++) {
      console.log(
        `canadate: ${this.remainingCanadates[i]} - ` +
          `${this.roundVotes[this.remainingCanadates[i]]} / ${this.voteCount} > ${this.requiredToWin} ` +
          `- ${this.roundVotes[this.remainingCanadates[i]] / this.voteCount > this.requiredToWin}`
      );
      if (this.roundVotes[this.remainingCanadates[i]] / this.voteCount > this.requiredToWin) {
        winners.push(this.remainingCanadates[i]);
        console.log(
          `canadate: ${this.remainingCanadates[i]}` +
            ` won with ${(this.roundVotes[this.remainingCanadates[i]] / this.voteCount) * 100}%` +
            ` in round ${this.roundIndex}`
        );
      }
    }

    // if someone won
    if (winners.length > 0) {
      if (winners.length == 1) {
        this.winners.push(winners[0]);
        console.log(`${winners[0]} added to winner list - ${JSON.stringify(this.winners)}`);
      } else {
        console.log(`resovling winning tie`);
        // if multiple won, resolve tie to choose single winner
        let winner = winners[0];
        for (let i = 1; i < winners.length; i++) {
          winner = this.__ResolveTie(winners[i], winner);
        }
        winners = [winner];

        this.winners.push(winner);
        console.log(`${winner} added to winner list - ${JSON.stringify(this.winners)}`);
      }

      // if number of winners matches require then return winners
      if (this.winners.length == this.numWinners) {
        console.log(
          `Found ${this.winners.length} of ${this.numWinners} election winners: ${JSON.stringify(this.winners)}`
        );
        return this.winners;
      }

      return this._weakenWinnerVotes(winners[0]);
    } else {
      if (this.remainingCanadates.length == this.numWinners - this.winners.length) {
        console.log("remaining canadate(s) win by default");
        this.winners.push(...this.remainingCanadates);
        return this.winners;
      }
      console.log("no canadate won, eliminating lowest placed");
      return this._eliminateLowest();
    }
  }

  _weakenWinnerVotes(winner: Snowflake) {
    console.log("weakening winners votes");

    let ids: number[] = [];
    for (let b = 0; b < this.rounds[this.roundIndex][winner].voteIds.length; b++) {
      ids.push(this.rounds[this.roundIndex][winner].voteIds[b]);
    }

    let canVotes = ids.length;
    let reqVotes = this.voteCount * this.requiredToWin;
    let extraVotes = canVotes - reqVotes;

    let multiplier = extraVotes / canVotes;

    console.log(`decresing vote power for ${winner} by ${multiplier}`);

    if (extraVotes > 0) {
      for (let c = 0; c < this.votes.length; c++) {
        if (ids.includes(this.votes[c].voteId)) {
          this.votes[c].power = this.votes[c].power * multiplier;
        }
      }
    }

    this.eliminated.push(winner);

    this.remainingCanadates = this.remainingCanadates.filter((can) => {
      if (winner != can) {
        return true;
      }
    });

    return this._countRoundVotes();
  }

  _eliminateLowest(): string[] {
    console.log("finding lowest placed canadate");

    let canadates = Object.keys(this.roundVotes);
    let lowest: Snowflake[] = [canadates[0]];
    let lowestVal = this.roundVotes[canadates[0]];
    for (let i = 1; i < canadates.length; i++) {
      if (this.roundVotes[canadates[i]] < lowestVal) {
        lowest = [canadates[i]];
        lowestVal = this.roundVotes[canadates[i]];
      }
      if (this.roundVotes[canadates[i]] == lowestVal) {
        lowest.push(canadates[i]);
      }
    }

    let eliminate: Snowflake;
    if (lowest.length == 1) {
      eliminate = lowest[0];
    } else {
      eliminate = lowest[0];
      for (let i = 1; i < lowest.length; i++) {
        eliminate = this.__ResolveTie(lowest[i], eliminate);
      }
    }

    console.log(`eliminated canadate ${eliminate}`);
    this.remainingCanadates = this.remainingCanadates.filter((can) => {
      if (can != eliminate) {
        return true;
      }
    });
    this.eliminated.push(eliminate);
    console.log(`remaining canadates(${this.remainingCanadates.length}): '${this.remainingCanadates.join("', '")}'`);
    return this._countRoundVotes();
  }

  __ResolveTie(canA: Snowflake, canB: Snowflake) {
    console.log("resovling tie");
    for (let i = 0; i < this.rounds.length; i++) {
      if (this.rounds[i][canA] > this.rounds[i][canB]) {
        console.log(`${canA} won tie resolve in round ${i}`);
        return canA;
      }
      if (this.rounds[i][canA] < this.rounds[i][canB]) {
        console.log(`${canB} won tie resolve in round ${i}`);
        return canB;
      }
    }

    console.log(`${canA} won tie resolve by lottery`);
    return canA;
  }
}
