import { MongoClient, Collection, Db } from "mongodb";
import { Election } from "../types/elections/Election";
import { Server } from "../types/server";
import modal from "../types/modals/collector";

class Store {
  client: MongoClient;
  db: Db;
  collections: {
    users: Collection;
    modals: Collection<modal>;
    servers: Collection<Server>;
    channels: Collection;
    elections: Collection<Election>;
  };
  constructor(mongoURL: string) {
    this.client = new MongoClient(mongoURL);
    this.client.connect();
    this.db = this.client.db("synAI");
    this.collections = {
      elections: this.db.collection("elections"),
      users: this.db.collection("users"),
      modals: this.db.collection("modals"),
      servers: this.db.collection("servers"),
      channels: this.db.collection("channels"),
    };
  }

  async modifyEntry(id: string, collection: Collection, changes: any) {
    let currentUserDb = await collection.findOne({ id: id });
    if (currentUserDb) {
      collection.updateOne(
        { id: id },
        {
          $set: changes,
        }
      );
    } else {
      let a = changes;
      a.id = id;
      collection.insertOne(a);
    }
  }
}

export default Store;
