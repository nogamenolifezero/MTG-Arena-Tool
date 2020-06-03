import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SeasonalRankData } from "../../../types/Season";
import globalStore from "../../store";

const initialSeasonalState = {
  seasonal: {} as Record<string, string[]>,
};

type Seasonal = typeof initialSeasonalState;

const seasonalSlice = createSlice({
  name: "seasonal",
  initialState: {
    seasonal: {} as Record<string, string[]>,
  },
  reducers: {
    setSeasonal: (
      state: Seasonal,
      action: PayloadAction<SeasonalRankData>
    ): void => {
      const update = action.payload;
      // Add to global store
      globalStore.seasonal[update.id] = update;
      const season = `${update.rankUpdateType.toLowerCase()}_${
        update.seasonOrdinal
      }`;
      // Add to indexes
      state.seasonal[season] = [...(state.seasonal[season] || []), update.id];
    },
    setManySeasonal: (
      state: Seasonal,
      action: PayloadAction<SeasonalRankData[]>
    ): void => {
      const newSeasonal = { ...state.seasonal };
      action.payload.forEach((update) => {
        // Add to global store
        globalStore.seasonal[update.id] = update;
        const season = `${update.rankUpdateType.toLowerCase()}_${
          update.seasonOrdinal
        }`;
        // Add to indexes
        newSeasonal[season] = [...(newSeasonal[season] || []), update.id];
      });
      state.seasonal = newSeasonal;
    },
  },
});

export const { setSeasonal, setManySeasonal } = seasonalSlice.actions;

export default seasonalSlice;
