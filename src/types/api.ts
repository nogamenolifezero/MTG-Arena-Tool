import { RequestOptions } from "http";
import { InternalDeck } from "./Deck";
import { InternalDraft } from "./draft";
import { InternalEvent } from "./event";
import { InternalMatch } from "./match";
import { InternalEconomyTransaction } from "./inventory";
import { SeasonalRankData } from "./Season";
import { SettingsData } from "./settings";

export interface ExploreQuery {
  filterWCC: string;
  filterWCU: string;
  filterWCR: string;
  filterWCM: string;
  onlyOwned: boolean;
  filterType: string;
  filterEvent: string;
  filterSort: string;
  filterSortDir: -1 | 1;
  filteredMana: number[];
  filteredRanks: string[];
  filterSkip: number;
}

export interface SyncIds {
  courses: string[];
  matches: string[];
  drafts: string[];
  economy: string[];
  seasonal: string[];
}

export interface SyncRequestData extends SyncIds {
  arenaId: string;
}

export interface ArenaIdData {
  arenaid: string;
}

export type HttpMethod =
  | "authLogin"
  | "getSync"
  | "postCourse"
  | "postMatch"
  | "postEconomy"
  | "postSeasonal"
  | "postDraft"
  | "getCourse"
  | "getMatch"
  | "getEconomy"
  | "getSeasonal"
  | "getDraft"
  | "getBulkCourse"
  | "getBulkMatch"
  | "getBulkEconomy"
  | "getBulkSeasonal"
  | "getBulkDraft"
  | "postSettings"
  | "clearData"
  | "getDatabase"
  | "getDatabaseVersion"
  | "shareDraft"
  | "shareLog"
  | "shareDeck"
  | "getHome"
  | "postMythicRank"
  | "getExplore";

export interface BaseHttpTask {
  reqId: string;
  method_path: string;
  method: HttpMethod;
  options?: RequestOptions;
  data?: any;
}

export interface HttpLogin extends BaseHttpTask {
  method: "authLogin";
  data: {
    email: string;
    password: string;
  };
}

interface BulkResponse {
  page: number;
  ids: string[];
}

export interface BulkCourses extends BulkResponse {
  result: InternalEvent[];
}

export interface BulkMatches extends BulkResponse {
  result: InternalMatch[];
}

export interface BulkDrafts extends BulkResponse {
  result: InternalDraft[];
}

export interface BulkEconomy extends BulkResponse {
  result: InternalEconomyTransaction[];
}

export interface BulkSeasonal extends BulkResponse {
  result: SeasonalRankData[];
}

export interface HttpGetSync extends BaseHttpTask {
  method: "getSync";
  options: RequestOptions & { method: "GET" };
}

export interface HttpPostCourse extends BaseHttpTask {
  method: "postCourse";
  data: InternalEvent;
}

export interface HttpPostMatch extends BaseHttpTask {
  method: "postMatch";
  data: InternalMatch;
}

export interface HttpPostEconomy extends BaseHttpTask {
  method: "postEconomy";
  data: InternalEconomyTransaction;
}

export interface HttpPostSeasonal extends BaseHttpTask {
  method: "postSeasonal";
  data: SeasonalRankData;
}

export interface HttpPostDraft extends BaseHttpTask {
  method: "postDraft";
  data: InternalDraft;
}

export interface HttpGetCourse extends BaseHttpTask {
  method: "getCourse";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetMatch extends BaseHttpTask {
  method: "getMatch";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetEconomy extends BaseHttpTask {
  method: "getEconomy";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetSeasonal extends BaseHttpTask {
  method: "getSeasonal";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetDraft extends BaseHttpTask {
  method: "getDraft";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetBulkCourse extends BaseHttpTask {
  method: "getBulkCourse";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetBulkMatch extends BaseHttpTask {
  method: "getBulkMatch";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetBulkEconomy extends BaseHttpTask {
  method: "getBulkEconomy";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetBulkSeasonal extends BaseHttpTask {
  method: "getBulkSeasonal";
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetBulkDraft extends BaseHttpTask {
  method: "getBulkDraft";
  options: RequestOptions & { method: "GET" };
}

export interface HttpPostSettings extends BaseHttpTask {
  method: "postSettings";
  data: SettingsData;
}

export interface HttpClearData extends BaseHttpTask {
  method: "clearData";
  options: RequestOptions & { method: "DELETE" };
}

export interface HttpGetDatabase extends BaseHttpTask {
  method: "getDatabase";
  lang: string;
  options: RequestOptions & { method: "GET" };
}

export interface HttpGetDatabaseVersion extends BaseHttpTask {
  method: "getDatabaseVersion";
  options: RequestOptions & { method: "GET" };
}

export interface HttpShareDraft extends BaseHttpTask {
  method: "shareDraft";
  data: {
    id: string;
    draft: InternalDraft;
    expire: number;
  };
}

export interface HttpShareLog extends BaseHttpTask {
  method: "shareLog";
  data: {
    id: string;
    log: string;
    expire: number;
  };
}

export interface HttpShareDeck extends BaseHttpTask {
  method: "shareDeck";
  data: {
    deck: InternalDeck;
    expire: number;
  };
}

export interface HttpGetHome extends BaseHttpTask {
  method: "getHome";
  set: string;
}

export interface HttpPostMythicRank extends BaseHttpTask {
  method: "postMythicRank";
  data: {
    opp: string;
    rank: string;
  };
}

export interface HttpGetExplore extends BaseHttpTask, ExploreQuery {
  method: "getExplore";
  collection: string;
  options: RequestOptions & { method: "GET" };
}

export type HttpTask =
  | HttpLogin
  | HttpGetSync
  | HttpPostCourse
  | HttpPostMatch
  | HttpPostEconomy
  | HttpPostSeasonal
  | HttpPostDraft
  | HttpGetCourse
  | HttpGetMatch
  | HttpGetEconomy
  | HttpGetSeasonal
  | HttpGetDraft
  | HttpGetBulkCourse
  | HttpGetBulkMatch
  | HttpGetBulkEconomy
  | HttpGetBulkSeasonal
  | HttpGetBulkDraft
  | HttpPostSettings
  | HttpClearData
  | HttpGetDatabase
  | HttpGetDatabaseVersion
  | HttpShareDraft
  | HttpShareLog
  | HttpShareDeck
  | HttpGetHome
  | HttpPostMythicRank
  | HttpGetExplore;
