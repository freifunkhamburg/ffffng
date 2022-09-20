import { defineStore } from "pinia";
import { isStatistics, type Path, type Statistics } from "@/types";
import { internalApi } from "@/utils/api";

interface StatisticsStoreState {
    statistics: Statistics | null;
}

export const useStatisticsStore = defineStore({
    id: "statistics",
    state(): StatisticsStoreState {
        return {
            statistics: null,
        };
    },
    getters: {
        getStatistics(state: StatisticsStoreState): Statistics | null {
            return state.statistics;
        },
    },
    actions: {
        async refresh(): Promise<void> {
            this.statistics = await internalApi.get<Statistics>(
                "statistics" as Path,
                isStatistics
            );
        },
    },
});
