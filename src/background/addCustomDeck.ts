import { playerDb } from "../shared/db/LocalDatabase";
import { InternalDeck } from "../types/Deck";
import { getDeck } from "../shared/store";
import { reduxAction } from "../shared/redux/sharedRedux";
import globals from "./globals";
import { IPC_RENDERER } from "../shared/constants";

export default function addCustomDeck(customDeck: Partial<InternalDeck>): void {
  const id = customDeck.id ?? "";
  if (id == "00000000-0000-0000-0000-000000000000") return;
  const deckData = {
    // preserve custom fields if possible
    ...(getDeck(id) || {}),
    ...customDeck,
  } as InternalDeck;

  reduxAction(
    globals.store.dispatch,
    { type: "SET_DECK", arg: deckData },
    IPC_RENDERER
  );
  playerDb.upsert("decks", id, deckData);
}
