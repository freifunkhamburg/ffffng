<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import { onMounted, ref, watch } from "vue";
import { useConfigStore } from "@/stores/config";
import type { Coordinates } from "@/types";
import * as L from "leaflet";
import { parseToFloat } from "@/utils/Numbers";
import type { LatLngTuple } from "leaflet";
import { forConstraint } from "@/shared/validation/validator";
import CONSTRAINTS from "@/shared/validation/constraints";

const wrapper = ref<HTMLElement>();
const configStore = useConfigStore();

interface Props {
    coordinates?: Coordinates;
    editable?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "coordinatesSelected", value: Coordinates): void;
}>();

let map: L.Map | null = null;
let marker: L.Marker | null = null;

onMounted(renderMap);
watch(props, updateMarker);

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

function getCoordinates(): LatLngTuple | undefined {
    const coordinates = props.coordinates;
    if (!coordinates) {
        return undefined;
    }
    if (!forConstraint(CONSTRAINTS.node.coords, false)(coordinates)) {
        return undefined;
    }
    const [lat, lng] = props.coordinates.split(" ").map(parseToFloat);
    return [lat, lng];
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
    map = L.map(element, options);
    L.control.layers(layers).addTo(map);

    if (props.editable) {
        map.on("click", onClick);
    }
}

function updateMarker() {
    const coordinates = getCoordinates();
    if (!coordinates) {
        return;
    }

    if (!map) {
        console.error("Map is not initialized.");
        return;
    }

    if (marker) {
        marker.setLatLng(coordinates);
    } else {
        marker = L.marker(coordinates, {}).addTo(map);
    }

    if (!map.getBounds().contains(marker.getLatLng())) {
        map.setView(marker.getLatLng(), map.getZoom());
    }
}

function centerOnCoordinates() {
    if (!map) {
        console.error("Map is not initialized.");
        return;
    }
    let { lat, lng, defaultZoom: zoom } = configStore.getConfig.coordsSelector;

    const coordinates = getCoordinates();

    if (coordinates) {
        [lat, lng] = coordinates;
        zoom = map.getMaxZoom() - 1;
    }
    map.setView([lat, lng], zoom);
}

function renderMap() {
    const { layers, defaultLayers } = getLayers();
    createMap(defaultLayers, layers);
    centerOnCoordinates();
    updateMarker();
}

function onClick(event: L.LeafletMouseEvent) {
    emit(
        "coordinatesSelected",
        `${event.latlng.lat} ${event.latlng.lng}` as Coordinates
    );
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
