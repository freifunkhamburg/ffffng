<script setup lang="ts">
import {useNodesStore} from "@/stores/nodes";
import {onMounted, type PropType, ref, watch} from "vue";
import type {DomainSpecificNodeResponse, MAC, NodesFilter, SearchTerm} from "@/types";
import {ButtonSize, ComponentVariant, NodeSortField, SortDirection} from "@/types";
import Pager from "@/components/Pager.vue";
import ActionButton from "@/components/form/ActionButton.vue";
import LoadingContainer from "@/components/LoadingContainer.vue";
import NodesFilterPanel from "@/components/nodes/NodesFilterPanel.vue";
import {SortTH} from "@/components/table/SortTH.vue";
import router from "@/router";

const NODE_PER_PAGE = 50;

// noinspection JSUnusedGlobalSymbols
const sth = SortTH<NodeSortField>();

const props = defineProps({
    filter: {
        type: Object as PropType<NodesFilter>,
        required: true,
    },
    searchTerm: {
        type: String as unknown as PropType<SearchTerm>,
        default: "" as SearchTerm,
    },

    sortDirection: {
        type: String as PropType<SortDirection>,
        default: SortDirection.ASCENDING,
    },
    sortField: {
        type: String as PropType<NodeSortField>,
        default: NodeSortField.HOSTNAME,
    },
});

type NodeRedactField = "nickname" | "email" | "token";
type NodeRedactFieldsMap = Partial<Record<NodeRedactField, boolean>>;

type NodesRedactFieldsMap = Partial<Record<MAC, NodeRedactFieldsMap>>;
const nodes = useNodesStore();
const redactFieldsByDefault = ref(true);
const nodesRedactFieldsMap = ref({} as NodesRedactFieldsMap)

const loading = ref(false);

async function refresh(page: number): Promise<void> {
    loading.value = true;
    redactAllFields(true);
    try {
        await nodes.refresh(
            page,
            NODE_PER_PAGE,
            props.sortDirection,
            props.sortField,
            props.filter,
            props.searchTerm,
        );
    } finally {
        loading.value = false;
    }
}

function redactAllFields(shallRedactFields: boolean): void {
    redactFieldsByDefault.value = shallRedactFields;
    nodesRedactFieldsMap.value = {};
}

function shallRedactField(node: DomainSpecificNodeResponse, field: NodeRedactField): boolean {
    const redactFieldsMap = nodesRedactFieldsMap.value[node.mac];
    if (!redactFieldsMap) {
        return redactFieldsByDefault.value;
    }
    const redactField = redactFieldsMap[field];
    return redactField === undefined ? redactFieldsByDefault.value : redactField;
}

function setRedactField(node: DomainSpecificNodeResponse, field: NodeRedactField, value: boolean): void {
    let redactFieldsMap = nodesRedactFieldsMap.value[node.mac];
    if (!redactFieldsMap) {
        redactFieldsMap = {};
        nodesRedactFieldsMap.value[node.mac] = redactFieldsMap;
    }
    redactFieldsMap[field] = value;
}

async function updateRouterState(
    filter: NodesFilter,
    searchTerm: SearchTerm,
    sortDirection: SortDirection,
    sortField: NodeSortField,
): Promise<void> {
    const filterStr = Object.keys(filter).length > 0 ? JSON.stringify(filter) : undefined;
    await router.replace({
        path: '/admin/nodes',
        query: {
            q: searchTerm || undefined,
            filter: filterStr,
            sortDir: sortDirection,
            sortField: sortField,
        }
    });
}

async function updateFilter(filter: NodesFilter, searchTerm: SearchTerm): Promise<void> {
    await updateRouterState(filter, searchTerm, props.sortDirection, props.sortField);
}

async function updateSortOrder(sortField: NodeSortField, sortDirection: SortDirection): Promise<void> {
    await updateRouterState(props.filter, props.searchTerm, sortDirection, sortField);
}

onMounted(async () => {
    await refresh(1);
});
watch(props, async () => {
    await refresh(1);
});
</script>

<template>
    <h2>Knoten</h2>

    <NodesFilterPanel :search-term="searchTerm" :filter="filter" @update-filter="updateFilter"/>

    <Pager
        :page="nodes.getPage"
        :itemsPerPage="nodes.getNodesPerPage"
        :totalItems="nodes.getTotalNodes"
        @changePage="refresh"/>

    <div class="actions">
        <ActionButton
            v-if="redactFieldsByDefault"
            :variant="ComponentVariant.WARNING"
            :size="ButtonSize.SMALL"
            icon="eye"
            @click="redactAllFields(false)">
            Sensible Daten einblenden
        </ActionButton>
        <ActionButton
            v-if="!redactFieldsByDefault"
            :variant="ComponentVariant.SUCCESS"
            :size="ButtonSize.SMALL"
            icon="eye-slash"
            @click="redactAllFields(true)">
            Sensible Daten ausblenden
        </ActionButton>
    </div>

    <LoadingContainer :loading="loading">
        <table>
            <thead>
            <tr>
                <sth
                    :field="NodeSortField.HOSTNAME"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    Name
                </sth>
                <sth
                    :field="NodeSortField.NICKNAME"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    Besitzer*in
                </sth>
                <sth
                    :field="NodeSortField.EMAIL"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    E-Mail
                </sth>
                <sth
                    :field="NodeSortField.TOKEN"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    Token
                </sth>
                <sth
                    :field="NodeSortField.MAC"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    MAC
                </sth>
                <sth
                    :field="NodeSortField.KEY"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    VPN
                </sth>
                <sth
                    :field="NodeSortField.SITE"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    Site
                </sth>
                <sth
                    :field="NodeSortField.DOMAIN"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    Domäne
                </sth>
                <sth
                    :field="NodeSortField.COORDS"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    GPS
                </sth>
                <sth
                    :field="NodeSortField.ONLINE_STATE"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    Status
                </sth>
                <sth
                    :field="NodeSortField.MONITORING_STATE"
                    :currentField="sortField"
                    :currentDirection="sortDirection"
                    @sort="updateSortOrder">
                    Monitoring
                </sth>
            </tr>
            </thead>

            <tbody>
            <tr
                v-for="node in nodes.getNodes"
                :class="[node.onlineState ? node.onlineState.toLowerCase() : 'online-state-unknown']">
                <td>{{ node.hostname }}</td>
                <td v-if="shallRedactField(node, 'nickname')">
                    <span
                        class="redacted"
                        @click="setRedactField(node, 'nickname', false)">
                        nickname
                    </span>
                </td>
                <td v-if="!shallRedactField(node, 'nickname')">
                    <span
                        class="redactable"
                        @click="setRedactField(node, 'nickname', true)">
                        {{ node.nickname }}
                    </span>
                </td>
                <td v-if="shallRedactField(node, 'email')">
                    <span
                        class="redacted"
                        @click="setRedactField(node, 'email', false)">
                        email@example.com
                    </span>
                </td>
                <td v-if="!shallRedactField(node, 'email')">
                    <span
                        class="redactable"
                        @click="setRedactField(node, 'email', true)">
                        {{ node.email }}
                    </span>
                </td>
                <td v-if="shallRedactField(node, 'token')">
                    <span
                        class="redacted"
                        @click="setRedactField(node, 'token', false)">
                        0123456789abcdef
                    </span>
                </td>
                <td v-if="!shallRedactField(node, 'token')">
                    <span
                        class="redactable"
                        @click="setRedactField(node, 'token', true)">
                        {{ node.token }}
                    </span>
                </td>
                <td>{{ node.mac }}</td>
                <td class="icon">
                    <i
                        v-if="node.key"
                        class="fa fa-lock"
                        aria-hidden="true"
                        title="Hat VPN-Schlüssel"/>
                    <i
                        v-if="!node.key"
                        class="fa fa-times not-available"
                        aria-hidden="true"
                        title="Hat keinen VPN-Schlüssel"/>
                </td>
                <td>{{ node.site }}</td>
                <td>{{ node.domain }}</td>
                <td class="icon">
                    <i
                        v-if="node.coords"
                        class="fa fa-map-marker"
                        aria-hidden="true"
                        title="Hat Koordinaten"/>
                    <i
                        v-if="!node.coords"
                        class="fa fa-times not-available"
                        aria-hidden="true"
                        title="Hat keinen Koordinaten"/>
                </td>
                <td v-if="node.onlineState !== undefined">{{ node.onlineState.toLowerCase() }}</td>
                <td v-if="node.onlineState === undefined">unbekannt</td>
                <td class="icon">
                    <i
                        v-if="node.monitoring && node.monitoringConfirmed"
                        class="fa fa-heartbeat"
                        aria-hidden="true"
                        title="Monitoring aktiv"/>
                    <i
                        v-if="node.monitoring && !node.monitoringConfirmed"
                        class="fa fa-envelope"
                        aria-hidden="true"
                        title="Monitoring nicht bestätigt"/>
                    <i
                        v-if="!node.monitoring"
                        class="fa fa-times not-available"
                        aria-hidden="true"
                        title="Monitoring deaktiviert"/>
                </td>
            </tr>
            </tbody>
        </table>
    </LoadingContainer>

    <Pager
        :page="nodes.getPage"
        :itemsPerPage="nodes.getNodesPerPage"
        :totalItems="nodes.getTotalNodes"
        @changePage="refresh"/>
</template>

<style lang="scss" scoped>
@import "../scss/variables";

.actions {
    margin: 0 0 0.5em 0;
}

table {
    border-collapse: collapse;

    tbody tr:hover {
        background-color: $gray-darker;
    }

    th, td {
        padding: 0.5em 0.25em;
    }

    td {
        border-top: 1px solid $gray-light;
    }

    .online {
        color: $variant-color-success;
    }

    .offline {
        color: $variant-color-danger;
    }

    .online-state-unknown {
        color: $variant-color-warning;
    }

    .icon {
        text-align: center;
    }

    .redacted, .redactable {
        cursor: pointer;
    }

    .redacted {
        filter: blur(0.2em);
    }

    .not-available {
        color: $gray-dark
    }
}
</style>
