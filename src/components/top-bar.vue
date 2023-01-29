<template>
    <div class="top-bar">
        <img src="../../public/assets/logo.png" height="48" width="48" title="MEP-logo" class="logo" />
        <span style="user-select: none">&nbsp;</span>
        <span class="software-title">
            The <span class="red">M</span>ath <span class="red">E</span>ditor For <span class="red">P</span>hotos<span
                style="user-select: none">&nbsp;</span>(<span class="red">MEP</span>)
        </span>
    </div>
</template>
<style>
.top-bar {
    position: fixed;
    top: 0%;
    left: 0%;
    width: 100%;
    height: 60px;
    padding: 4px 8px;
    border-bottom: 3px solid rgb(24, 180, 220);
    border-radius: 5px;
    box-shadow: 6px;
}
</style>
<style scoped>
.red {
    color: red;
}

.top-bar {
    font-size: 40px;
    line-height: 56px;
    overflow-x: auto;
}

.software-title {
    user-select: none;
}

.logo {
    user-select: none;
}
</style>
<script lang="ts" setup>
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import { onMounted, ref } from 'vue';

const path = ref('');
onMounted(() => {
    path.value = useRoute().path;
});
onBeforeRouteUpdate(() => {
    path.value = useRoute().path;
});
</script>
