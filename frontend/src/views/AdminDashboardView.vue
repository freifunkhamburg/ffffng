<script setup lang="ts">
import StatisticsCard from "@/components/admin/StatisticsCard.vue";
import { useStatisticsStore } from "@/stores/statistics";
import { ComponentVariant, MonitoringState } from "@/types";
import { RouteName } from "@/router";
import PageContainer from "@/components/page/PageContainer.vue";

const statisticsStore = useStatisticsStore();

function refresh(): void {
    statisticsStore.refresh();
}

refresh();
</script>

<template>
    <PageContainer v-if="statisticsStore.getStatistics">
        <h2>Knotenstatistik</h2>

        <div class="statistics">
            <StatisticsCard
                title="Registrierte Knoten"
                icon="circle-o"
                :variant="ComponentVariant.INFO"
                :value="statisticsStore.getStatistics.nodes.registered"
                :route="RouteName.ADMIN_NODES"
            />
            <StatisticsCard
                title="Mit hinterlegtem fastd-Key"
                icon="lock"
                :variant="ComponentVariant.WARNING"
                :value="statisticsStore.getStatistics.nodes.withVPN"
                :route="RouteName.ADMIN_NODES"
                :filter="{ hasKey: true }"
            />
            <StatisticsCard
                title="Mit Koordinaten"
                icon="map-marker"
                :variant="ComponentVariant.SUCCESS"
                :value="statisticsStore.getStatistics.nodes.withCoords"
                :route="RouteName.ADMIN_NODES"
                :filter="{ hasCoords: true }"
            />
            <StatisticsCard
                title="Monitoring aktiv"
                icon="heartbeat"
                :variant="ComponentVariant.SUCCESS"
                :value="statisticsStore.getStatistics.nodes.monitoring.active"
                :route="RouteName.ADMIN_NODES"
                :filter="{ monitoringState: MonitoringState.ACTIVE }"
            />
            <StatisticsCard
                title="Monitoring noch nicht bestätigt"
                icon="envelope"
                :variant="ComponentVariant.DANGER"
                :value="statisticsStore.getStatistics.nodes.monitoring.pending"
                :route="RouteName.ADMIN_NODES"
                :filter="{ monitoringState: MonitoringState.PENDING }"
            />
        </div>
    </PageContainer>
</template>

<style lang="scss" scoped>
@import "../scss/variables";
@import "../scss/mixins";

.statistics {
    display: grid;
    justify-content: center;
}

@each $breakpoint, $width in $statistics-card-widths {
    @include page-breakpoint($breakpoint) {
        .statistics {
            grid-template-columns: repeat(auto-fill, $width);
        }
    }
}
</style>
