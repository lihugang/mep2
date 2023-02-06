<template>
    <span class="drop-down-list" :id="dropListID">
        <span class="list-title list-item" :style="itemCSSStyle" @mouseenter="isHide = false"
            @mouseleave="isHide = true" @click="isHide = !isHide" :show="!isHide" v-if="!props.isSearch">
            <img v-if="titleImage" :src="titleImage" class="icon" />&thinsp;<span class="title-name">{{
                title
            }}</span>&nbsp;<span class="arrow-down">v</span>
        </span>
        <span class="list-title list-item" :style="itemCSSStyle" @click="searchContent = 'null' + searchContent"
            :show="!isHide" v-else>
            <img v-if="titleImage" :src="titleImage" class="icon" />&thinsp;<span class="search-box"><input
                    type="search" class="search-container" v-model="searchContent" @click="isHide = false" />
            </span>
        </span>
        <div class="hide-list" :hide="isHide" style="position: fixed" :style="hideListPos" @mouseenter="isHide = false"
            @mouseleave="isHide = true" v-if="content.filter(item => !item.isHide).length">
            <template v-for="item in content" :key="item">
                <span class="list-item" :style="itemCSSStyle" @click="onClick(item.name, !!props.isSearch)"
                    v-if="!item.isHide">
                    <img v-if="item.img" :src="item.img" class="icon" />&thinsp;<span :style="{
                        fontFamily: item.useFont || 'Noto Sans Light'
                    }">{{ item.content }}</span>
                </span>
                <br v-if="!item.isHide" />

            </template>

        </div>
    </span>
</template>
<style scoped>
.icon {
    height: 16px;
    width: 16px;
}

.list-title {
    user-select: none;
}

.arrow-down {
    font-size: 6px;
    position: relative;
    top: 2px;
}

.hide-list {
    user-select: none;
    border: 1px solid rgb(160, 160, 160);
    padding: 4px 8px;
    border-radius: 4px;
    z-index: 2;
    overflow-y: scroll;
}

.hide-list[hide='true'] {
    display: none;
}

.list-item {
    color: rgb(64, 64, 64);
    background-color: snow;
    display: inline-block;
}

.list-item:hover {
    background-color: rgb(200, 200, 200);
}

input[type=search] {
    outline: none;
    background-color: snow;
    color: rgb(32, 32, 32);
    padding: 0px 6px;
    border: 1px solid rgb(86, 175, 203);
}

input[type=search]:focus {
    background-color: rgb(220, 220, 220);
}

input[type=search]::selection {
    background-color: rgb(106, 195, 223);
}
</style>
<script lang="ts" setup>
import { ref, reactive, defineEmits, defineProps, onMounted, watch, nextTick, toRaw } from 'vue';
import type { dropDownList } from './drop-down-list-type';
const props = defineProps<{
    title: string;
    titleImage?: string;
    content: dropDownList[];
    isSearch?: boolean;
}>();

const isHide = ref(false);
const maxWidth = ref(-1);
const itemCSSStyle = reactive<Record<string, string>>({});
const hideListPos = reactive<Record<string, string>>({});
const dropListID = ref('e' + Math.random().toString(36).substring(3));
const searchContent = ref('');
if (props.isSearch) searchContent.value = toRaw(props.title);

const calcListWidth = () => {
    isHide.value = false;
    itemCSSStyle.width = '';
    // foreach all elements and get their width
    nextTick(() => {
        const elements = document.querySelector(`#${dropListID.value}`)?.querySelectorAll('.list-item');
        elements?.forEach(element => {
            maxWidth.value = Math.max(maxWidth.value, (element as HTMLElement).offsetWidth);
        });
        itemCSSStyle.width = maxWidth.value + 4 + 'px';
        isHide.value = true;
    });
    // waiting for vue rendering
};
const updateHideListPos = () => {
    const ele = document.querySelector(`#${dropListID.value}`)?.querySelector('.list-item') as HTMLElement;
    hideListPos.top = ele.offsetTop + ele.offsetHeight + ele.offsetHeight + 'px';
    hideListPos.left = ele.offsetLeft + 'px';
    hideListPos.maxHeight = window.innerHeight - parseInt(hideListPos.top) - 24 + 'px';
};
onMounted(calcListWidth);
watch(props, calcListWidth, {
    deep: true
}); // when props change, list changes, recalculate the width of the list

setInterval(updateHideListPos, 2000);

// eslint-disable-next-line func-call-spacing
const $emit = defineEmits<{
    (event: 'do', action: (typeof props.content)[number]['name']): void,
    (event: 'change', action: (typeof props.content)[number]['name']): void
}>();

const onClick = (name: string, isSearch: boolean) => {
    isHide.value = true;
    if (!isSearch) {
        $emit('do', name);
    } else {
        searchContent.value = name;
        $emit('change', name);
    }
};

watch(searchContent, (value) => {
    // when search content changes, find matching prefixs
    if (value.substring(0, 4) !== 'null') {
        value = value.toLowerCase();
        props.content.forEach(item => {
            if (item.content.toLowerCase().indexOf(value) === -1) item.isHide = true;
            else item.isHide = false;
        });
    } else {
        props.content.forEach(item => {
            item.isHide = false;
        });
        searchContent.value = value.substring(4);
    }
});
</script>
