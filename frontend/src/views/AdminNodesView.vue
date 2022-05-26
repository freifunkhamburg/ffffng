<script setup lang="ts">
import {useNodesStore} from "@/stores/nodes";
import {ref} from "vue";
import type {MAC} from "@/types";

type NodeRedactField = "nickname" | "email" | "token";
type NodeRedactFieldsMap = Partial<Record<NodeRedactField, boolean>>;
type NodesRedactFieldsMap = Partial<Record<MAC, NodeRedactFieldsMap>>;

const nodes = useNodesStore();
const page = ref(0);

function refresh(): void {
    nodes.refresh();
}

refresh();
</script>

<template>
    <main>
        <h2>Knoten</h2>

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
                <tr v-for="node in nodes.getNodes">
                    <td>{{node.hostname}}</td>
                    <td>{{node.nickname}}</td><!-- TODO: Redact values -->
                    <td>{{node.email}}</td><!-- TODO: Redact values -->
                    <td>{{node.token}}</td><!-- TODO: Redact values -->
                    <td>{{node.mac}}</td>
                    <td>{{node.key}}</td><!-- TODO: Icon if set -->
                    <td>{{node.site}}</td>
                    <td>{{node.domain}}</td>
                    <td>{{node.coords}}</td><!-- TODO: Icon with link if set -->
                    <td>{{node.onlineState}}</td>
                    <td>{{node.monitoring}}</td><!-- TODO: Icon regarding state -->
                </tr>
            </tbody>
        </table>
    </main>
</template>

<style lang="scss" scoped>
</style>
