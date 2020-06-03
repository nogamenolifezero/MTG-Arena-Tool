/* eslint-disable require-atomic-updates */
import {
  IPC_BACKGROUND,
  IPC_OVERLAY,
  IPC_RENDERER,
  IPC_ALL,
} from "../shared/constants";
import { ipcSend } from "./backgroundUtil";
import globals from "./globals";

import getDeckAfterChange from "../shared/utils/getDeckAfterChange";
import isEpochTimestamp from "../shared/utils/isEpochTimestamp";
import { playerDb } from "../shared/db/LocalDatabase";
import { isV2CardsList, ArenaV3Deck, DeckChange } from "../types/Deck";
import arenaLogWatcher from "./arena-log-watcher";
import convertDeckFromV3 from "./convertDeckFromV3";
import { reduxAction } from "../shared/redux/sharedRedux";
import { InternalMatch } from "../types/match";
import store from "../shared/redux/stores/backgroundStore";
import { InternalEvent } from "../types/event";
import { InternalEconomyTransaction } from "../types/inventory";
import Deck from "../shared/deck";
import { InternalDraft } from "../types/draft";
import { SeasonalRankData } from "../types/Season";

const ipcLog = (message: string): void => ipcSend("ipc_log", message);
const ipcPop = (args: {
  text: string;
  time: number;
  progress?: number;
}): void => ipcSend("popup", args);

// Merges settings and updates singletons across processes
// (essentially fancy setData for settings field only)
export function syncSettings(
  dirtySettings = {},
  refresh = globals.debugLog || !globals.firstPass
): void {
  const settings = { ...store.getState().settings, ...dirtySettings };
  if (refresh) {
    reduxAction(
      globals.store.dispatch,
      { type: "SET_SETTINGS", arg: settings },
      IPC_ALL ^ IPC_BACKGROUND
    );
  }
}

function fixBadPlayerData(savedData: any): any {
  // 2020-01-17 discovered with @Thaoden that some old draft decks might be v3
  // probably caused by a bad label handler that was temporarily on stable
  // 2020-01-27 @Manwe discovered that some old decks are saved as Deck objects
  // TODO permanently convert them similar to approach used above
  const decks = { ...savedData.decks };
  Object.keys(decks).map((k: string) => {
    const deck = decks[k];
    if (!isV2CardsList(deck.mainDeck)) {
      ipcLog("Converting v3 deck: " + deck.id);
      const fixedDeck = convertDeckFromV3((deck as unknown) as ArenaV3Deck);
      // 2020-02-29 discovered by user Soil'n'Rock that empty decks were considered
      // as "Deck" by the isV2CardsList() function, thus de-archiving them.
      decks[deck.id] = { ...fixedDeck, archived: deck.archived };
    }
  });
  savedData.decks = decks;
  return savedData;
}

// Loads this player's configuration file
export async function loadPlayerConfig(): Promise<void> {
  const { arenaId, playerId, playerName } = globals.store.getState().playerdata;
  ipcLog("Load player ID: " + playerId);
  ipcPop({ text: "Loading player history...", time: 0, progress: 2 });
  playerDb.init(playerId, playerName);

  reduxAction(
    globals.store.dispatch,
    { type: "SET_PLAYERDB", arg: playerDb.filePath },
    IPC_RENDERER
  );
  ipcLog("Player database: " + playerDb.filePath);

  ipcLog("Finding all documents in player database...");
  let savedData = await playerDb.findAll();
  savedData = fixBadPlayerData(savedData);
  const { settings } = savedData;

  // update initial settings to renderer
  if (settings) {
    reduxAction(
      globals.store.dispatch,
      { type: "SET_TOPNAV", arg: settings.last_open_tab },
      IPC_RENDERER
    );
  }

  // Private decks
  if (savedData.private_decks) {
    console.log(savedData.private_decks);
    reduxAction(
      globals.store.dispatch,
      { type: "SET_PRIVATE_DECKS", arg: savedData.private_decks },
      IPC_RENDERER
    );
  }

  // Get Rank data
  if (savedData.rank) {
    reduxAction(
      globals.store.dispatch,
      { type: "SET_RANK", arg: savedData.rank },
      IPC_RENDERER
    );
  }

  // Get Matches data
  const newMatchesIndex: string[] = Object.keys(savedData).filter(
    (id) =>
      (id.endsWith(arenaId) || savedData[id]?.player?.userid === arenaId) &&
      savedData[id]?.gameStats?.[0] !== undefined
  );

  const matchesList: InternalMatch[] = newMatchesIndex.map((id: string) => {
    // Calculate player deck hash
    if (savedData[id].playerDeck && !savedData[id].playerDeckHash) {
      const playerDeck = new Deck(savedData[id].playerDeck);
      savedData[id].playerDeckHash = playerDeck.getHash();
    }

    savedData[id].date = new Date(savedData[id].date ?? 0).toISOString();
    return savedData[id];
  });

  reduxAction(
    globals.store.dispatch,
    { type: "SET_MANY_MATCHES", arg: matchesList },
    IPC_RENDERER
  );

  // Get Events data
  if (savedData.courses_index) {
    const eventsList: InternalEvent[] = savedData.courses_index
      .filter((id: string) => savedData[id])
      .map((id: string) => {
        if (isEpochTimestamp(savedData[id].date)) savedData[id].date *= 1000;
        savedData[id].date = new Date(savedData[id].date).getTime();
        return savedData[id];
      });

    reduxAction(
      globals.store.dispatch,
      { type: "SET_MANY_EVENTS", arg: eventsList },
      IPC_RENDERER
    );
  }

  // Get Decks data
  if (savedData.decks) {
    const decks = { ...savedData.decks };
    const decksList = Object.keys(decks).map((k: string) => decks[k]);

    reduxAction(
      globals.store.dispatch,
      { type: "SET_MANY_DECKS", arg: decksList },
      IPC_RENDERER
    );
  }

  if (savedData.deck_changes_index) {
    // Get Deck Changes data
    const changesList: DeckChange[] = savedData.deck_changes_index
      .filter((id: string) => savedData.deck_changes[id] as DeckChange)
      .map((id: string) => {
        const current = savedData.deck_changes[id] as DeckChange;
        const decklist = getDeckAfterChange(current);
        savedData.deck_changes[id].newDeckHash = decklist.getHash();
        savedData.deck_changes[id].date = new Date(
          savedData.deck_changes[id].date
        ).toISOString();
        return savedData.deck_changes[id];
      });

    reduxAction(
      globals.store.dispatch,
      { type: "SET_MANY_DECK_CHANGES", arg: changesList },
      IPC_RENDERER
    );
  }

  // Get Economy data
  if (savedData.economy_index) {
    const economyList: InternalEconomyTransaction[] = savedData.economy_index
      .filter((id: string) => savedData[id])
      .map((id: string) => {
        savedData[id].date = new Date(savedData[id].date).toISOString();
        return savedData[id];
      });

    reduxAction(
      globals.store.dispatch,
      { type: "SET_MANY_ECONOMY", arg: economyList },
      IPC_RENDERER
    );
  }

  // Get Drafts data
  if (savedData.draft_index) {
    const draftsList: InternalDraft[] = savedData.draft_index
      .filter((id: string) => savedData[id])
      .map((id: string) => savedData[id]);

    reduxAction(
      globals.store.dispatch,
      { type: "SET_MANY_DRAFT", arg: draftsList },
      IPC_RENDERER
    );
  }

  // Get Seasonal data
  if (savedData.seasonal) {
    const newSeasonal = { ...savedData.seasonal };
    const seasonalAdd = Object.keys(newSeasonal)
      .map((id: string) => {
        const update = savedData.seasonal[id] as SeasonalRankData & {
          timestamp: any;
        };
        // Ugh.. some timestamps are stored as Date and string!
        if (typeof update.timestamp == "string") {
          update.timestamp = new Date(update.timestamp).getTime();
        }
        if (update.timestamp instanceof Date) {
          update.timestamp = update.timestamp.getTime();
        }
        return update as SeasonalRankData;
      })
      .filter((update) => update?.rankUpdateType);
    reduxAction(
      globals.store.dispatch,
      { type: "SET_MANY_SEASONAL", arg: seasonalAdd },
      IPC_RENDERER
    );
  }

  // Get cards data
  if (savedData.cards) {
    const newCards = savedData.cards;
    if (newCards.cards_time instanceof Date) {
      newCards.cards_time = newCards.cards_time.getTime();
    }

    reduxAction(
      globals.store.dispatch,
      { type: "ADD_CARDS_FROM_STORE", arg: newCards },
      IPC_RENDERER
    );
    const cards = globals.store.getState().playerdata.cards;
    playerDb.upsert("", "cards", cards);
  }

  // Get tags colors data
  if (savedData.tags_colors) {
    reduxAction(
      globals.store.dispatch,
      { type: "SET_TAG_COLORS", arg: savedData.tags_colors },
      IPC_RENDERER
    );
  }

  // Get deck tags data
  if (savedData.deck_tags) {
    reduxAction(
      globals.store.dispatch,
      { type: "SET_DECK_TAGS", arg: savedData.deck_tags },
      IPC_RENDERER
    );
  }

  // Other
  ipcSend("renderer_set_bounds", savedData.windowBounds);
  syncSettings(settings, true);

  // populate draft overlays with last draft if possible
  if (savedData.draft_index && savedData.draft_index.length) {
    const draftsList: InternalEconomyTransaction[] = savedData.draft_index
      .filter((id: string) => savedData[id])
      .map((id: string) => savedData[id]);

    const lastDraft = draftsList[draftsList.length - 1];
    ipcSend("set_draft_cards", lastDraft, IPC_OVERLAY);

    ipcLog("...found all documents in player database.");
    ipcPop({ text: "Player history loaded.", time: 3000, progress: -1 });
  }

  // Only if watcher is not initialized
  // Could happen when using multi accounts
  if (globals.watchingLog == false) {
    globals.watchingLog = true;
    const logUri = globals.store.getState().appsettings.logUri;
    ipcLog("Starting Arena Log Watcher: " + logUri);
    globals.stopWatchingLog = arenaLogWatcher.startWatchingLog(logUri);
    ipcLog("Calling back to http-api...");
  }
}
