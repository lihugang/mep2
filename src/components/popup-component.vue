<template>
    <div class="mask" v-if="popups.length"></div>
    <div class="popup" v-if="popups.length">
        <div class="text">
            {{ popups[0].text }}
        </div>
        <div class="button-container">
            <template v-for="button in popups[0].buttons" :key="button">
                <span class="button" @click="buttonClick(popups[0], button.text)">{{
                    button.text
                }}</span>
                <span style="user-select: none">&thinsp;&thinsp;</span>
            </template>
        </div>
    </div>
</template>
<style scoped>
.mask {
    position: fixed;
    top: 0%;
    left: 0%;
    height: 100%;
    width: 100%;
    backdrop-filter: blur(4px) brightness(75%);
}

.popup {
    position: fixed;
    top: 30%;
    left: 30%;
    height: 30%;
    min-height: 300px;
    width: 40%;
    min-width: 240px;
    border: 2px solid snow;
    border-radius: 8px;
    padding: 10px 30px;
    font-size: 1.2em;
    text-align: center;
}

.button-container {
    position: absolute;
    bottom: 4px;
    right: 2px;
}

.text {
    user-select: none;
}

.button {
    position: relative;
    bottom: 4px;
    color: snow;
    background-color: rgb(128, 187, 205);
    padding: 4px 12px;
    cursor: pointer;
    user-select: none;
}

.button:hover {
    background-color: rgb(98, 157, 175);
}
</style>
<script lang="ts" setup>
import { defineExpose, reactive } from 'vue';
import type * as popup from './popup';
const popups: popup.task[] = reactive([]);
defineExpose({
    registerTask: (text: string, buttons: popup.button[], onClick?: popup.task['onClick']) => {
        popups.push({
            text: text,
            buttons: buttons,
            onClick: onClick
        });
    }
});
const buttonClick = (task: popup.task, text: string) => {
    const cb = task.onClick;
    popups.shift();
    cb && cb(text);
};
</script>
