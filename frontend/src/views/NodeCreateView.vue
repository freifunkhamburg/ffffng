<script setup lang="ts">
import PageContainer from "@/components/page/PageContainer.vue";
import NodeCreateForm from "@/components/nodes/NodeCreateForm.vue";
import NodeCreatedPanel from "@/components/nodes/NodeCreatedPanel.vue";
import { ref } from "vue";
import type { StoredNode, Token } from "@/types";

const createdNode = ref<StoredNode | undefined>(undefined);

async function onCreate(node: StoredNode) {
    createdNode.value = node;
}
</script>

<template>
    <PageContainer>
        <NodeCreateForm v-if="!createdNode" @create="onCreate" />
        <NodeCreatedPanel v-if="createdNode" :node="createdNode" />
    </PageContainer>
</template>

<style lang="scss" scoped></style>
