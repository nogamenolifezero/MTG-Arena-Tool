import { playerDb } from "../shared/db/LocalDatabase";
import { getTransaction, transactionExists } from "../shared/store";
import globals from "./globals";
import { reduxAction } from "../shared/redux/sharedRedux";
import { httpSetEconomy } from "./httpApi";
import { constants } from "mtgatool-shared";
import { InternalEconomyTransaction } from "mtgatool-shared/dist/types/inventory";

const { IPC_RENDERER } = constants;

export default function saveEconomyTransaction(
  transaction: InternalEconomyTransaction
): void {
  const id = transaction.id;
  const txnData = {
    // preserve custom fields if possible
    ...(getTransaction(id) || {}),
    ...transaction,
  };

  if (!transactionExists(id)) {
    const economyIndex = [...globals.store.getState().economy.economyIndex, id];
    playerDb.upsert("", "economy_index", economyIndex);
  }
  reduxAction(
    globals.store.dispatch,
    { type: "SET_ECONOMY", arg: txnData },
    IPC_RENDERER
  );
  playerDb.upsert("", id, txnData);
  httpSetEconomy(txnData);
}
