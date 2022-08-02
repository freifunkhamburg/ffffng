<script setup lang="ts">
import StatisticsCard from "@/components/admin/StatisticsCard.vue";
import {useStatisticsStore} from "@/stores/statistics";
import {ComponentVariant, MonitoringState} from "@/types";
import PageContainer from "@/components/page/PageContainer.vue";

const statistics = useStatisticsStore();

function refresh(): void {
    statistics.refresh();
}

refresh();
</script>

<template>
    <PageContainer v-if="statistics.getStatistics">
        <h2>Knotenstatistik</h2>

        <div class="statistics">
            <StatisticsCard
                title="Registrierte Knoten"
                icon="circle-o"
                :variant="ComponentVariant.INFO"
                :value="statistics.getStatistics.nodes.registered"
                link="/admin/nodes"
            />
            <StatisticsCard
                title="Mit hinterlegtem fastd-Key"
                icon="lock"
                :variant="ComponentVariant.WARNING"
                :value="statistics.getStatistics.nodes.withVPN"
                link="/admin/nodes"
                :filter="{hasKey: true}"
            />
            <StatisticsCard
                title="Mit Koordinaten"
                icon="map-marker"
                :variant="ComponentVariant.SUCCESS"
                :value="statistics.getStatistics.nodes.withCoords"
                link="/admin/nodes"
                :filter="{hasCoords: true}"
            />
            <StatisticsCard
                title="Monitoring aktiv"
                icon="heartbeat"
                :variant="ComponentVariant.SUCCESS"
                :value="statistics.getStatistics.nodes.monitoring.active"
                link="/admin/nodes"
                :filter="{monitoringState: MonitoringState.ACTIVE}"
            />
            <StatisticsCard
                title="Monitoring noch nicht bestätigt"
                icon="envelope"
                :variant="ComponentVariant.DANGER"
                :value="statistics.getStatistics.nodes.monitoring.pending"
                link="/admin/nodes"
                :filter="{monitoringState: MonitoringState.PENDING}"
            />
        </div>
    </PageContainer>
</template>

<style lang="scss" scoped>
@import "../scss/variables";
@import "../scss/mixins";

.statistics {
    display: grid;
}

@each $breakpoint, $width in $statistics-card-widths {
    @include page-breakpoint($breakpoint) {
        .statistics {
            grid-template-columns: repeat(auto-fill, $width);
        }
    }
}

</style>
