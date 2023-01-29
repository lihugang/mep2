<template>
    <div class="project-preview">
        {{ props.pageID }} - {{ props.projectName }} - MEP
    </div>
</template>
<style scoped>
.project-preview {
    position: absolute;
    top: 0%;
    left: 0%;
    width: 100%;
    height: 20px;
    user-select: none;
    font-size: 14px;
    line-height: 18px;
    text-align: center;
    border-bottom: 2px solid rgb(0, 122, 204);
    border-radius: 4px;
}
</style>
<script lang="ts" setup>
import { defineProps } from 'vue';
const props = defineProps<{
    pageID: number;
    projectName: string;
}>();
</script>
