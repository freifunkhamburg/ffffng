<script setup lang="ts">
import {computed, defineProps} from "vue";

const props = defineProps({
    page: {
        type: Number,
        required: true,
    },
    itemsPerPage: {
        type: Number,
        required: true,
    },
    totalItems: {
        type: Number,
        required: true,
    },
});

const firstItem = computed(() => {
    return Math.min(props.totalItems, (props.page - 1) * props.itemsPerPage + 1)
});
const lastItem = computed(() => Math.min(props.totalItems, firstItem.value + props.itemsPerPage - 1));
const lastPage = computed(() => Math.ceil(props.totalItems / props.itemsPerPage));
const pages = computed(() => {
    const pages: number[] = [];
    if (lastPage.value <= 2) {
        return pages;
    }

    let p1 = props.page - 1;
    if (props.page === lastPage.value) {
        p1 = props.page - 2;
    }
    if (p1 <= 1) {
        p1 = 2;
    }

    for (let p = p1; p <= p1 + 2; p += 1) {
        if (p < lastPage.value) {
            pages.push(p);
        }
    }

    return pages;
});

const showFirstEllipsis = computed(
    () => pages.value.length > 0 && pages.value[0] > 2
);
const showLastEllipsis = computed(
    () => pages.value.length > 0 && pages.value[pages.value.length - 1] < lastPage.value - 1
);

const emit = defineEmits<{
    (e: "changePage", page: number): void,
}>();

function toPage(page: number): void {
    emit("changePage", page);
}

// noinspection JSIncompatibleTypesComparison
const classes = computed(() => (p: number) => p === props.page ? ["current-page"] : []);
</script>

<template>
    <nav>
        <span class="total">
            <strong>{{ firstItem }}</strong>
            -
            <strong>{{ lastItem }}</strong>
            von
            <strong>{{ totalItems }}</strong>
        </span>

        <ul>
            <li v-if="page > 1" @click="toPage(page - 1)">‹</li>
            <li :class="classes(1)" @click="toPage(1)">1</li>
            <li v-if="showFirstEllipsis" class="ellipsis">…</li>
            <li v-for="page in pages" :class="classes(page)" @click="toPage(page)">{{ page }}</li>
            <li v-if="showLastEllipsis" class="ellipsis">…</li>
            <li v-if="lastPage > 1" :class="classes(lastPage)" @click="toPage(lastPage)">{{ lastPage }}</li>
            <li v-if="page < lastPage" @click="toPage(page + 1)">›</li>
        </ul>
    </nav>
</template>

<style lang="scss" scoped>
@import "../scss/variables";

ul {
    display: inline-block;
    list-style: none;

    li {
        display: inline-block;
        min-width: 2em;
        height: 1.5em;
        line-height: 1.5em;
        text-align: center;
        cursor: pointer;

        &.current-page {
            color: $variant-color-info;
        }

        &.ellipsis {
            cursor: initial;
        }
    }
}
</style>
