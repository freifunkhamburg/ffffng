<script setup lang="ts">
import { useStatisticsStore } from "@/stores/statistics";

const statistics = useStatisticsStore();

function refresh(): void {
    statistics.refresh();
}

refresh();
</script>

<template>
    <main>
        <div v-if="statistics.getStatistics">
            <h1>Nodes</h1>

            <div>
                Registered: {{ statistics.getStatistics.nodes.registered }}<br />
                With VPN-key: {{ statistics.getStatistics.nodes.withVPN }}<br />
                With coordinates: {{ statistics.getStatistics.nodes.withCoords }}<br />
                Monitoring active: {{ statistics.getStatistics.nodes.monitoring.active }}<br />
                Monitoring pending: {{ statistics.getStatistics.nodes.monitoring.pending }}
            </div>
            <button @click="refresh()">Refresh</button>
        </div>
    </main>
</template>

<style lang="scss" scoped></style>
