<script setup lang="ts">
import {useNodesStore} from "@/stores/nodes";
import {onMounted, ref} from "vue";
import type {EnhancedNode, MAC} from "@/types";
import Pager from "@/components/Pager.vue";
import LoadingContainer from "@/components/LoadingContainer.vue";

const NODE_PER_PAGE = 50;

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
        await nodes.refresh(page, NODE_PER_PAGE);
    } finally {
        loading.value = false;
    }
}

function redactAllFields(shallRedactFields: boolean): void {
    redactFieldsByDefault.value = shallRedactFields;
    nodesRedactFieldsMap.value = {};
}

function shallRedactField(node: EnhancedNode, field: NodeRedactField): boolean {
    const redactFieldsMap = nodesRedactFieldsMap.value[node.mac];
    if (!redactFieldsMap) {
        return redactFieldsByDefault.value;
    }
    const redactField = redactFieldsMap[field];
    return redactField === undefined ? redactFieldsByDefault.value : redactField;
}

function setRedactField(node: EnhancedNode, field: NodeRedactField, value: boolean): void {
    let redactFieldsMap = nodesRedactFieldsMap.value[node.mac];
    if (!redactFieldsMap) {
        redactFieldsMap = {};
        nodesRedactFieldsMap.value[node.mac] = redactFieldsMap;
    }
    redactFieldsMap[field] = value;
}

onMounted(async () => await refresh(1));
</script>

<template>
    <h2>Knoten</h2>

    <div>
        <span>Gesamt: {{ nodes.getTotalNodes }}</span>
        <button
            v-if="redactFieldsByDefault"
            @click="redactAllFields(false)">
            Sensible Daten einblenden
        </button>
        <button
            v-if="!redactFieldsByDefault"
            @click="redactAllFields(true)">
            Sensible Daten ausblenden
        </button>
    </div>

    <Pager
        :page="nodes.getPage"
        :itemsPerPage="nodes.getNodesPerPage"
        :totalItems="nodes.getTotalNodes"
        @changePage="refresh"/>

    <LoadingContainer :loading="loading">
        <table>
            <thead>
            <tr>
                <th>Name</th>
                <th>Besitzer*in</th>
                <th>E-Mail</th>
                <th>Token</th>
                <th>MAC</th>
                <th>VPN</th>
                <th>Site</th>
                <th>Domäne</th>
                <th>GPS</th>
                <th>Status</th>
                <th>Monitoring</th>
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

table {
    border-collapse: collapse;

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
