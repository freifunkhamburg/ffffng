<script setup lang="ts">
import {
    isMap,
    isNodesFilter,
    isString,
    MonitoringState,
    NODES_FILTER_FIELDS,
    type NodesFilter,
    OnlineState,
    type UnixTimestampMilliseconds,
} from "@/types";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useConfigStore} from "@/stores/config";

interface Props {
    filter: NodesFilter;
}

const SEARCH_THROTTLE_DELAY_MS = 500;

const FILTER_LABELS: Record<string, string | Map<any, any>> = {
    hasKey: new Map([
        [true, "Mit VPN-Schlüssel"],
        [false, "Ohne VPN-Schlüssel"],
    ]),
    hasCoords: new Map([
        [true, "Mit Koordinaten"],
        [false, "Ohne Koordinaten"],
    ]),
    monitoringState: new Map([
        [MonitoringState.ACTIVE, "Monitoring: aktiv"],
        [MonitoringState.PENDING, "Monitoring: Bestätigung ausstehend"],
        [MonitoringState.DISABLED, "Monitoring: nicht aktiv"],
    ]),
    site: "Site",
    domain: "Domäne",
    onlineState: new Map([
        [OnlineState.ONLINE, "online"],
        [OnlineState.OFFLINE, "offline"],
    ]),
}

const emit = defineEmits<{
    (e: "updateFilter", filter: NodesFilter, searchTerm?: string): void,
}>();

const props = defineProps<Props>();
const input = ref();
const hasFocus = ref(false);
const suggestedFiltersExpanded = ref(false);
const config = useConfigStore();

type Filter = {
    field: string,
    value: any,
};
const selectedFilters = ref<Filter[]>([]);

function selectedFilterIndex(filter: Filter): number {
    for (let i = 0; i < selectedFilters.value.length; i += 1) {
        const selectedFilter = selectedFilters.value[i];
        if (selectedFilter.field === filter.field && selectedFilter.value === filter.value) {
            return i;
        }
    }

    return -1;
}

function selectedFilterIndexForField(field: string): number {
    for (let i = 0; i < selectedFilters.value.length; i += 1) {
        const selectedFilter = selectedFilters.value[i];
        if (selectedFilter.field === field) {
            return i;
        }
    }

    return -1;
}

const suggestedFilters = computed<Filter[][]>(() => {
    const cfg = config.getConfig;
    const sites = cfg?.community.sites || [];
    const domains = cfg?.community.domains || [];

    const filterGroups: Filter[][] = [];

    for (const field of Object.keys(NODES_FILTER_FIELDS)) {
        const filterGroup: Filter[] = []

        function pushFilter(filter: Filter): void {
            if (selectedFilterIndex(filter) < 0) {
                filterGroup.push(filter);
            }
        }

        switch (field) {
            case "site":
                for (const site of sites) {
                    pushFilter({
                        field: "site",
                        value: site,
                    });
                }
                break;

            case "domain":
                for (const domain of domains) {
                    pushFilter({
                        field: "domain",
                        value: domain,
                    });
                }
                break;

            default:
                const labels = FILTER_LABELS[field];
                if (!isMap(labels)) {
                    throw new Error(`Missing case for field ${field}.`);
                }

                for (const value of labels.keys()) {
                    pushFilter({
                        field,
                        value,
                    });
                }
        }

        filterGroups.push(filterGroup);
    }
    return filterGroups;
});

function addSelectedFilter(filter: Filter): void {
    const i = selectedFilterIndexForField(filter.field);
    if (i >= 0) {
        selectedFilters.value.splice(selectedFilterIndex(filter), 1);
    }
    selectedFilters.value.push(filter);
    doSearch();
}

function removeSelectedFilter(filter: Filter): void {
    selectedFilters.value.splice(selectedFilterIndex(filter), 1);
    doSearch();
}

function updateSelectedFilters() {
    const filter = props.filter as Record<string, any>;
    selectedFilters.value = [];
    for (const field of Object.keys(NODES_FILTER_FIELDS)) {
        if (filter.hasOwnProperty(field)) {
            addSelectedFilter({
                field,
                value: filter[field],
            });
        }
    }
}

watch(props, updateSelectedFilters);
onMounted(updateSelectedFilters);

function renderFilter(filter: Filter): string {
    if (!FILTER_LABELS.hasOwnProperty(filter.field)) {
        throw new Error(`Filter has no translation: ${filter.field}`);
    }

    const label = FILTER_LABELS[filter.field];
    if (isString(label)) {
        return `${label}: ${filter.value}`;
    }

    if (!label.has(filter.value)) {
        throw new Error(`Filter ${filter.field} has no translation for value: ${filter.value}(${typeof filter.value})`);
    }

    return label.get(filter.value);
}

function setFocus(focus: boolean): void {
    hasFocus.value = focus;
}

function focusInput(): void {
    nextTick(() => input.value.focus());
}

function showSuggestedFilters(expanded: boolean): void {
    suggestedFiltersExpanded.value = expanded;
}

function buildNodesFilter(): NodesFilter {
    const nodesFilter: Record<string, any> = {};
    for (const filter of selectedFilters.value) {
        nodesFilter[filter.field] = filter.value;
    }
    if (!isNodesFilter(nodesFilter)) {
        throw new Error(`Invalid nodes filter: ${JSON.stringify(nodesFilter)}`);
    }
    return nodesFilter;
}

let lastSearchTimestamp: UnixTimestampMilliseconds = 0;
let searchTimeout: NodeJS.Timeout | undefined = undefined;
let lastSearchTerm = "";

function doSearch(): void {
    const nodesFilter = buildNodesFilter();
    lastSearchTerm = input.value.value;
    let searchTerm: string | undefined = lastSearchTerm.trim();
    if (!searchTerm) {
        searchTerm = undefined;
    }
    emit("updateFilter", nodesFilter, searchTerm);
}

function doThrottledSearch(): void {
    if (lastSearchTerm === input.value.value) {
        return
    }

    const now: UnixTimestampMilliseconds = Date.now();
    if (now - SEARCH_THROTTLE_DELAY_MS >= lastSearchTimestamp) {
        lastSearchTimestamp = now;
        doSearch();
    } else if (!searchTimeout) {
        searchTimeout = setTimeout(() => {
            searchTimeout = undefined
            doThrottledSearch();
        }, SEARCH_THROTTLE_DELAY_MS);
    }
}
</script>

<template>
    <div :class="{ 'nodes-filter-panel': true, 'focus': hasFocus}" @click="focusInput">
        <div class="nodes-filter-input">
            <div class="selected-filters">
                <span
                    v-for="filter in selectedFilters"
                    class="selected-filter"
                    @click="removeSelectedFilter(filter)"
                    :title="renderFilter(filter)">
                    {{ renderFilter(filter) }}
                    <i
                        class="fa fa-times remove-filter"
                        aria-hidden="true"
                        title="Filter entfernen"/>
                </span>
            </div>
            <input
                ref="input"
                @focus="setFocus(true)"
                @blur="setFocus(false)"
                @keyup="doThrottledSearch()"
                maxlength="64"
                type="search"
                placeholder="Knoten durchsuchen..."/>
            <i class="fa fa-search search" @click="doSearch()"/>
        </div>
        <div class="suggested-filters" v-if="suggestedFiltersExpanded">
            <div class="suggested-filter-group" v-for="filterGroup in suggestedFilters">
                <span
                    class="suggested-filter"
                    v-for="filter in filterGroup"
                    @click="addSelectedFilter(filter)"
                    :title="renderFilter(filter)">
                    {{ renderFilter(filter) }}
                    <i
                        class="fa fa-plus add-filter"
                        aria-hidden="true"
                        title="Filter hinzufügen"/>
                </span>
            </div>
        </div>
    </div>
    <a
        v-if="suggestedFiltersExpanded"
        class="toggle-suggested-filters"
        href="javascript:"
        @click="showSuggestedFilters(false)">
        Erweiterte Suche ausblenden
    </a>
    <a
        v-if="!suggestedFiltersExpanded"
        class="toggle-suggested-filters"
        href="javascript:"
        @click="showSuggestedFilters(true)">
        Erweiterte Suche einblenden
    </a>
</template>

<style lang="scss" scoped>
@import "../../scss/variables";

.nodes-filter-panel {
    position: relative;
    background-color: $input-background-color;
    border-radius: $input-border-radius;
    border: $input-border;

    &.focus {
        outline: $input-focus-outline;
    }

    .nodes-filter-input {
        display: flex;
        margin: 0 0.25em;
    }

    .selected-filters {
        margin: 0.3em 0.25em 0.3em 0;
        max-width: 60%;
    }

    .selected-filter,
    .suggested-filter {
        cursor: pointer;
        margin: 0.1em 0.25em 0.1em 0;
        padding: 0.25em 0.5em;
        border-radius: 0.75em;
        font-size: 0.75em;
        color: $nodes-filter-panel-pill-text-color;
        background-color: $nodes-filter-panel-pill-background-color;
        font-weight: $nodes-filter-panel-pill-font-weight;
        user-select: none;
        white-space: nowrap;

        .add-filter, .remove-filter {
            margin-left: 0.25em;
        }
    }

    .selected-filters, .suggested-filter-group {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        overflow: hidden;

        span {
            display: block;
        }
    }

    .suggested-filters {
        border-top: 0.1em solid $page-background-color;
    }

    .suggested-filter-group {
        margin: 0.5em 0.25em;
    }

    .search {
        margin: 0.5em 0.25em 0 0;
        color: $page-background-color;
        cursor: pointer;
    }

    input {
        margin: 0.75em 0.25em 0.6em 0;
        padding: 0;
        border: none;
        flex-grow: 1;
        height: 1em;
        outline: none;
        background-color: $input-background-color;
        color: $input-text-color;

        &::placeholder {
            opacity: $input-placeholder-opacity;
            color: $input-placeholder-color;
        }
    }
}

.toggle-suggested-filters {
    display: block;
    margin: 0.5em;
}
</style>
