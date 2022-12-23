/*
import { eventsApi, util } from "@silver_lily/census-lib";

let census = new eventsApi.Client({ serviceID: "Tiyu0LkHBENDh6uo" });

census.on("connected", () => {
  console.log("Connected to ps2 events api");
  census.subscribe({
    eventNames: ["ContinentLock", "ContinentUnlock", "MetagameEvent"],
    characters: ["all"],
  });
});

census.on("ContinentLock", (e) => {
  console.log(`[ps2 event] - Continent Locked: ${e.world_id}`);
});

census.on("ContinentUnlock", (e) => {
  console.log(`[ps2 event] - Continent Unlocked: ${e.world_id} ${e.zone_id}`);
});

census.on("MetagameEvent", (e) => {
  console.log(`[ps2 event] - Metagame Event: ${e.world_id} - ${e.metagame_event_id} - ${e.metagame_event_state}`);
});
*/