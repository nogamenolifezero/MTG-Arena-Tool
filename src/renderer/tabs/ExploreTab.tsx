import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  RANKS,
  SUB_DECK,
  IPC_NONE,
  WHITE,
  BLUE,
  BLACK,
  RED,
  GREEN,
  COLORLESS,
} from "../../shared/constants";
import db from "../../shared/database";
import ReactSelect from "../../shared/ReactSelect";
import { AppState } from "../../shared/redux/stores/rendererStore";
import { ListItemExplore } from "../components/list-item/ListItemExplore";
import Button from "../components/misc/Button";
import Checkbox from "../components/misc/Checkbox";
import Input from "../components/misc/Input";
import { ipcSend } from "../rendererUtil";
import { reduxAction } from "../../shared/redux/sharedRedux";
import { ExploreQuery } from "../../shared/redux/slices/exploreSlice";

import ranks16 from "../../assets/images/ranks_16.png";
import sharedCss from "../../shared/shared.css";
import indexCss from "../index.css";
import appCss from "../app/app.css";
import css from "./ExploreTab.css";

const manaClasses: string[] = [];
manaClasses[WHITE] = sharedCss.manaW;
manaClasses[BLUE] = sharedCss.manaU;
manaClasses[BLACK] = sharedCss.manaB;
manaClasses[RED] = sharedCss.manaR;
manaClasses[GREEN] = sharedCss.manaG;
manaClasses[COLORLESS] = sharedCss.manaC;

export default function ExploreTab(): JSX.Element {
  const dispatcher = useDispatch();
  const loading = useSelector((state: AppState) => state.renderer.loading);
  const exploreData = useSelector((state: AppState) => state.explore.data);
  const [queries, setQueries] = useState(0);
  const exploreFilters = useSelector(
    (state: AppState) => state.explore.filters
  );

  const [queryFilters, setQueryFilters] = useState(exploreFilters);
  useEffect(() => setQueryFilters(exploreFilters), [exploreFilters]);

  const queryExplore = useCallback(
    (filters: ExploreQuery) => {
      reduxAction(dispatcher, "SET_LOADING", true, IPC_NONE);
      reduxAction(dispatcher, "SET_EXPLORE_FILTERS", filters, IPC_NONE);
      ipcSend("request_explore", filters);
    },
    [dispatcher]
  );

  const newQuery = useCallback(() => {
    const newFilters = {
      ...queryFilters,
      filterSkip: 0,
    };
    queryExplore(newFilters);
    setQueries(queries + 1);
  }, [queries, queryExplore, queryFilters]);

  const scrollQuery = useCallback(() => {
    queryExplore(queryFilters);
  }, [queryExplore, queryFilters]);

  const openRow = useCallback(
    (row: any): void => {
      const deck = {
        mainDeck: row.mainDeck,
        sideboard: row.sideboard,
        deckTileId: row.tile,
        name: row.name,
        id: row._id,
      };
      reduxAction(dispatcher, "SET_BACK_GRPID", row.tile, IPC_NONE);
      reduxAction(
        dispatcher,
        "SET_SUBNAV",
        {
          type: SUB_DECK,
          id: row._id + "_",
          data: deck,
        },
        IPC_NONE
      );
    },
    [dispatcher]
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const onScroll = React.useCallback(() => {
    if (containerRef?.current) {
      const container = containerRef?.current;
      const desiredHeight = Math.round(
        container.scrollTop + container.offsetHeight
      );
      if (
        desiredHeight >= container.scrollHeight &&
        !loading &&
        exploreData.results_number !== -1
      ) {
        scrollQuery();
      }
    }
  }, [exploreData.results_number, loading, scrollQuery]);

  return (
    <div ref={containerRef} onScroll={onScroll} className={appCss.uxItem}>
      <div
        style={{ width: "100%", flexDirection: "column" }}
        className={indexCss.flexItem}
      >
        <ExploreFilters doSearch={newQuery} />
        <div className="explore_list">
          {exploreData?.result?.length > 0 ? (
            exploreData.result.map((row: any) => {
              return (
                <ListItemExplore
                  key={row._id}
                  row={row}
                  openCallback={openRow}
                />
              );
            })
          ) : !loading ? (
            <div
              style={{ marginTop: "32px" }}
              className={`${indexCss.messageSub} ${sharedCss.red}`}
            >
              {queries == 0
                ? "Click Search to begin."
                : "Query returned no data."}
            </div>
          ) : (
            <></>
          )}
          {loading ? (
            <div
              style={{ margin: "16px" }}
              className={`${indexCss.messageSub} ${sharedCss.white}`}
            >
              Loading...
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

function getEventPrettyName(event: string): string {
  return db.event(event) || event;
}

interface ExploreFiltersProps {
  doSearch: () => void;
}

function ExploreFilters(props: ExploreFiltersProps): JSX.Element {
  const { doSearch } = props;
  const filters = useSelector((state: AppState) => state.explore.filters);
  const activeEvents = useSelector(
    (state: AppState) => state.explore.activeEvents
  );
  const [eventFilters, setEventFilters] = useState(["Ladder"]);
  const dispatcher = useDispatch();

  const typeFilter = ["Events", "Ranked Constructed", "Ranked Draft"];
  const sortFilters = ["By Date", "By Wins", "By Winrate", "By Player"];
  const sortDirection = ["Descending", "Ascending"];

  const updateFilters = useCallback(
    (filters: ExploreQuery): void => {
      reduxAction(dispatcher, "SET_EXPLORE_FILTERS", filters, IPC_NONE);
    },
    [dispatcher]
  );

  const setManaFilter = useCallback(
    (value: number[]): void => {
      updateFilters({
        ...filters,
        filteredMana: value,
      });
    },
    [filters, updateFilters]
  );

  const setRanksFilter = useCallback(
    (value: string[]): void => {
      updateFilters({
        ...filters,
        filteredRanks: value,
      });
    },
    [filters, updateFilters]
  );

  const getFilterEvents = useCallback(
    (prevFilters: ExploreQuery = filters): string[] => {
      let newFilters: string[] = [];
      let sep = true;
      if (prevFilters.filterType === "Events") {
        sep = false;
        newFilters = db.eventIds
          .concat(activeEvents)
          .filter((item) => item && !db.single_match_events.includes(item));

        newFilters = [...new Set(newFilters)];
      } else if (prevFilters.filterType === "Ranked Draft") {
        newFilters = [...db.limited_ranked_events];
      } else if (prevFilters.filterType === "Ranked Constructed") {
        newFilters = [...db.standard_ranked_events];
      }
      newFilters.sort(function (a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      newFilters.forEach((item, index: number) => {
        if (activeEvents.includes(item)) {
          newFilters.splice(newFilters.indexOf(item), 1);
          newFilters.unshift(item);
        } else if (!sep) {
          sep = true;
          newFilters.splice(index, 0, "%%Archived");
        }
      });
      if (prevFilters.filterType === "Events") {
        newFilters.splice(0, 0, "%%Active");
      }
      setEventFilters(newFilters);
      return newFilters;
    },
    [filters, activeEvents]
  );

  const getFirstEvent = useCallback(
    (filter: string): string => {
      let ret = "%%";
      let i = 0;
      while (ret.startsWith("%%")) {
        ret = getFilterEvents({
          ...filters,
          filterType: filter,
        })[i];
        i++;
      }
      return ret;
    },
    [filters, getFilterEvents]
  );

  function validateWildcardValues(
    e: React.ChangeEvent<HTMLInputElement>
  ): void {
    if (parseInt(e.target.value) < 0) {
      e.target.value = "";
    }
  }

  return (
    <div className={css.exploreButtonsContainer}>
      <div className={`${css.exploreButtonsRow} ${css.exploreButtonsTop}`}>
        <ReactSelect
          options={typeFilter}
          current={filters.filterType}
          callback={(filter: string): void =>
            updateFilters({
              ...filters,
              filterType: filter,
              filterEvent: getFirstEvent(filter),
            })
          }
        />
        <ReactSelect
          options={eventFilters}
          key={filters.filterType}
          current={filters.filterEvent}
          optionFormatter={getEventPrettyName}
          callback={(filter: string): void =>
            updateFilters({ ...filters, filterEvent: filter })
          }
        />
        <label style={{ marginLeft: "16px" }}>Sort:</label>
        <ReactSelect
          style={{ width: "130px" }}
          options={sortFilters}
          current={filters.filterSort}
          callback={(filter: string): void =>
            updateFilters({ ...filters, filterSort: filter })
          }
        />
        <ReactSelect
          options={sortDirection}
          style={{ width: "130px" }}
          current={
            filters.filterSortDir == -1 ? sortDirection[0] : sortDirection[1]
          }
          callback={(filter: string): void =>
            updateFilters({
              ...filters,
              filterSortDir: filter == sortDirection[0] ? -1 : 1,
            })
          }
        />
      </div>
      <div className={css.exploreButtonsRow}>
        <Checkbox
          text="Only Owned"
          value={filters.onlyOwned}
          callback={(value: boolean): void =>
            updateFilters({
              ...filters,
              onlyOwned: value,
            })
          }
        />
        <div className={`${indexCss.wcCommon} ${indexCss.wcSearchIcon}`}></div>
        <Input
          type="number"
          containerClassName={`${indexCss.inputContainerExplore} ${css.exploreWcInput}`}
          value={filters.filterWCC}
          placeholder=""
          validate={validateWildcardValues}
          callback={(value: string): void =>
            updateFilters({
              ...filters,
              filterWCC: value,
            })
          }
        />
        <div
          className={`${indexCss.wcUncommon} ${indexCss.wcSearchIcon}`}
        ></div>
        <Input
          type="number"
          containerClassName={`${indexCss.inputContainerExplore} ${css.exploreWcInput}`}
          value={filters.filterWCU}
          placeholder=""
          validate={validateWildcardValues}
          callback={(value: string): void =>
            updateFilters({
              ...filters,
              filterWCU: value,
            })
          }
        />
        <div className={`${indexCss.wcRare} ${indexCss.wcSearchIcon}`}></div>
        <Input
          type="number"
          containerClassName={`${indexCss.inputContainerExplore} ${css.exploreWcInput}`}
          value={filters.filterWCR}
          placeholder=""
          validate={validateWildcardValues}
          callback={(value: string): void =>
            updateFilters({
              ...filters,
              filterWCR: value,
            })
          }
        />
        <div className={`${indexCss.wcMythic} ${indexCss.wcSearchIcon}`}></div>
        <Input
          type="number"
          containerClassName={`${indexCss.inputContainerExplore} ${css.exploreWcInput}`}
          value={filters.filterWCM}
          placeholder=""
          validate={validateWildcardValues}
          callback={(value: string): void =>
            updateFilters({
              ...filters,
              filterWCM: value,
            })
          }
        />
      </div>
      <div className={css.exploreButtonsRow}>
        <ManaFilter callback={setManaFilter} filter={filters.filteredMana} />
        <RanksFilter callback={setRanksFilter} filter={filters.filteredRanks} />
        <Button
          className={indexCss.buttonSimple}
          style={{ margin: "0px" }}
          text="Search"
          onClick={doSearch}
        />
      </div>
    </div>
  );
}

interface ManaFilterProps {
  filter: number[];
  callback: (filter: number[]) => void;
}

function ManaFilter(props: ManaFilterProps): JSX.Element {
  const { filter, callback } = props;
  const [filters, setFilters] = useState(filter);

  const filterSize = { height: "20px", width: "30px" };

  const setFilter = (filter: number): void => {
    const n = filters.indexOf(filter);
    const newFilters = [...filters];
    if (n > -1) {
      newFilters.splice(n, 1);
    } else {
      newFilters.push(filter);
    }
    setFilters(newFilters);
    callback(newFilters);
  };

  useEffect(() => {
    setFilters(filter);
  }, [filter]);

  const manas = [1, 2, 3, 4, 5];

  return (
    <div className={indexCss.manaFiltersExplore}>
      {manas.map((mana: number) => {
        return (
          <div
            key={"mana-filter-" + mana}
            onClick={(): void => setFilter(mana)}
            style={filterSize}
            className={`${indexCss.manaFilter} ${manaClasses[mana]} ${
              filters.includes(mana) ? "" : indexCss.manaFilterOn
            }`}
          ></div>
        );
      })}
    </div>
  );
}

interface RanksFilterProps {
  filter: string[];
  callback: (filter: string[]) => void;
}

function RanksFilter(props: RanksFilterProps): JSX.Element {
  const { filter, callback } = props;
  const [filters, setFilters] = useState(filter);

  const setFilter = (filter: string): void => {
    const n = filters.indexOf(filter);
    const newFilters = [...filters];
    if (n > -1) {
      newFilters.splice(n, 1);
    } else {
      newFilters.push(filter);
    }
    setFilters(newFilters);
    callback(newFilters);
  };

  useEffect(() => {
    setFilters(filter);
  }, [filter]);

  return (
    <div className={indexCss.manaFiltersExplore}>
      {RANKS.map((rank: string, index: number) => {
        return (
          <div
            key={"rank-filter-" + rank}
            onClick={(): void => setFilter(rank)}
            style={{
              backgroundPosition: (index + 1) * -16 + "px 0px",
              backgroundImage: `url(${ranks16})`,
            }}
            className={
              indexCss.rankFilter +
              " " +
              (filters.includes(rank) ? "" : indexCss.rankFilterOn)
            }
          ></div>
        );
      })}
    </div>
  );
}
