<script setup lang="ts">
import StatisticsCard from "@/components/admin/StatisticsCard.vue";
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
            <h2>Knotenstatistik</h2>

            <div class="statistics">
                <StatisticsCard
                    title="Registrierte Knoten"
                    icon="circle-o"
                    variant="info"
                    :value="statistics.getStatistics.nodes.registered"
                    link="/admin/nodes"
                    />
                <StatisticsCard
                    title="Mit hinterlegtem fastd-Key"
                    icon="lock"
                    variant="warning"
                    :value="statistics.getStatistics.nodes.withVPN"
                    link="/admin/nodes"
                    :filter="{hasKey: true}"
                    />
                <StatisticsCard
                    title="Mit Koordinaten"
                    icon="map-marker"
                    variant="success"
                    :value="statistics.getStatistics.nodes.withCoords"
                    link="/admin/nodes"
                    :filter="{hasCoords: true}"
                    />
                <StatisticsCard
                    title="Monitoring aktiv"
                    icon="heartbeat"
                    variant="success"
                    :value="statistics.getStatistics.nodes.monitoring.active"
                    link="/admin/nodes"
                    :filter="{monitoringState: 'active'}"
                    />
                <StatisticsCard
                    title="Monitoring noch nicht bestätigt"
                    icon="envelope"
                    variant="danger"
                    :value="statistics.getStatistics.nodes.monitoring.pending"
                    link="/admin/nodes"
                    :filter="{monitoringState: 'pending'}"
                    />
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped>
.statistics {
    display: grid;
    // TODO: Responsive sizes
    grid-template-columns: repeat(auto-fill, minmax(25%, 100%));
}
</style>
