<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import { onMounted, ref } from "vue";
import { useConfigStore } from "@/stores/config";
import type { Coordinates } from "@/types";
import * as L from "leaflet";
import { parseToFloat } from "@/utils/Numbers";

const wrapper = ref<HTMLElement>();
const configStore = useConfigStore();

interface Props {
    coordinates?: Coordinates;
}

const props = defineProps<Props>();

onMounted(renderMap);

function getLayers(): {
    layers: { [name: string]: L.Layer };
    defaultLayers: L.Layer[];
} {
    const layers: { [name: string]: L.Layer } = {};
    const defaultLayers: L.Layer[] = [];
    for (const [id, layerCfg] of Object.entries(
        configStore.getConfig.coordsSelector.layers
    )) {
        const layerOptions = layerCfg.layerOptions;

        const layer = L.tileLayer(layerCfg.url, {
            id,
            ...layerOptions,
        });

        layers[layerCfg.name] = layer;
        if (defaultLayers.length === 0) {
            defaultLayers.push(layer);
        }
    }
    return { layers, defaultLayers };
}

function createMap(defaultLayers: L.Layer[], layers: { [p: string]: L.Layer }) {
    const element = wrapper.value;
    if (!element) {
        throw new Error("Illegal state: Map wrapper element not set.");
    }

    const options: L.MapOptions = {
        renderer: new L.Canvas(),
        minZoom: 2,
        crs: L.CRS.EPSG3857,
        zoomControl: true,
        worldCopyJump: true,
        maxBounds: L.latLngBounds([90, -540.5], [-90, 540.5]),
        attributionControl: true,
        layers: defaultLayers,
    };
    const map = L.map(element, options);
    L.control.layers(layers).addTo(map);

    return map;
}

function centerOnCoordinates(map: L.Map) {
    let { lat, lng, defaultZoom: zoom } = configStore.getConfig.coordsSelector;

    if (props.coordinates) {
        [lat, lng] = props.coordinates.split(" ").map(parseToFloat);
        zoom = map.getMaxZoom();
        L.marker([lat, lng], {}).addTo(map);
    }
    map.setView([lat, lng], zoom);
}

function renderMap() {
    const { layers, defaultLayers } = getLayers();
    const map = createMap(defaultLayers, layers);
    centerOnCoordinates(map);
}
</script>

<template>
    <div class="map-container">
        <div class="map" ref="wrapper"></div>
    </div>
</template>

<style lang="scss">
@use "sass:math";
@import "../scss/variables";
.map-container {
    position: relative;

    width: 100%;
    padding-top: math.percentage(math.div(1, $node-map-aspect-ratio));

    .map {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        border-radius: $node-map-border-radius;
    }
}
</style>
