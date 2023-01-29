<template>
    <div class="frame" @click="clearMenu">
        <div class="image-container" :style="{
            height: props.height,
            width: props.width
        }" @click.right.prevent="onContainerRightClick($event)">
            <template v-for="(item, key) in props.project.images" :key="item">
                <img :src="item" :sha256="key" class="image-item"
                    @click.right.prevent.stop="onImageRightClick($event, key.toString())" />
            </template>
        </div>
        <div class="right-click-on-image right-click"
            v-if="imageRightClickMenuPos.height + imageRightClickMenuPos.width" :style="{
                top: imageRightClickMenuPos.height + 'px',
                left: imageRightClickMenuPos.width + 'px'
            }">
            <div class="menu-item">
                sha256 <input type="text" class="sha256-container" :value="imageRightClickMenuPos.sha256" readonly
                    autofocus :title="props.i18n.click_me_to_copy"
                    @click="copyToClipboard(imageRightClickMenuPos.sha256)" />
            </div>
            <div class="menu-item" @click="openImageInNewTab(imageRightClickMenuPos.sha256)">{{
                props.i18n.open_in_new_page
            }}</div>
            <div class="menu-item" @click="downloadSelectedImage(imageRightClickMenuPos.sha256)">{{
                props.i18n.download_image
            }}</div>
            <div class="menu-item" @click="selectImageToAdd()">{{
                props.i18n.add_image
            }}</div>
            <div class="menu-item" @click="deleteImage(imageRightClickMenuPos.sha256)">{{
                props.i18n.delete_image
            }}</div>
        </div>
        <div class="right-click-on-container right-click"
            v-if="mainRightClickMenuPos.width + mainRightClickMenuPos.height" :style="{
                top: mainRightClickMenuPos.height + 'px',
                left: mainRightClickMenuPos.width + 'px'
            }">
            <div class="menu-item" @click="selectImageToAdd()">{{
                props.i18n.add_image
            }}</div>
        </div>
    </div>

</template>
<style scoped>
.image-item {
    max-height: 50%;
    max-width: 50%;
}

.image-container {
    position: relative;
    top: 2px;
    overflow-y: scroll;
}

.frame {
    margin: 0px;
}

.right-click {
    position: absolute;
    border: 1px solid seashell;
    background-color: snow;
    padding: 2px 6px;
    user-select: none;
}

.sha256-container {
    outline: none;
    padding: 2px 6px;
    border-radius: 2px;
    cursor: copy;
}

.sha256-container::selection {
    color: skyblue;
}

.menu-item {
    color: rgb(24, 24, 24);
}

.menu-item:hover {
    color: rgb(60, 60, 60);
    background-color: rgb(200, 200, 200);
    cursor: pointer;
}

/* .image-item {
    cursor: grab;
} */
</style>
<script lang="ts" setup>
import Project from '@/utils/ProjectManager';
import { i18nMap } from '@/i18n';
import { defineProps, reactive } from 'vue';
import calcSha256WithWorker from '@/utils/calcSha256WithWorker';

const props = defineProps<{
    i18n: i18nMap,
    project: Project,
    height: string,
    width: string
}>();

const onImageRightClick = ($event: MouseEvent, sha256: string) => {
    imageRightClickMenuPos.width = $event.offsetX;
    imageRightClickMenuPos.height = $event.offsetY;
    imageRightClickMenuPos.sha256 = sha256;
};

const imageRightClickMenuPos = reactive({
    height: 0,
    width: 0,
    sha256: ''
});

const clearMenu = () => {
    imageRightClickMenuPos.height = 0;
    imageRightClickMenuPos.width = 0;
    mainRightClickMenuPos.width = 0;
    mainRightClickMenuPos.height = 0;
};

const openImageInNewTab = (sha256: string) => {
    const dataurl = props.project.images[sha256];
    fetch(dataurl)
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 3000);
        });
};
const downloadSelectedImage = (sha256: string) => {
    const dataurl = props.project.images[sha256];
    fetch(dataurl)
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = sha256 + '.' + blob.type.split('/')[1];
            a.click();
            URL.revokeObjectURL(url);
        });
};

const copyToClipboard = (s: string) => {
    navigator.clipboard.writeText(s);
};

const selectImageToAdd = () => {
    const element = document.createElement('input');
    element.type = 'file';
    element.accept = 'image/*';
    element.multiple = true;
    element.click();
    element.onchange = () => {
        const filelist = element.files || [];
        for (let i = 0; i < filelist.length; ++i) {
            (file => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        // ignore ts check
                        const dataurl = reader.result;
                        calcSha256WithWorker(reader.result).then(sha256 => {
                            // eslint-disable-next-line vue/no-mutating-props
                            props.project.images[sha256] = dataurl;
                        });
                    }
                };
            })(filelist[i]);
        }
    };
};

const deleteImage = (sha256: string) => {
    delete props.project.images[sha256];
};

const mainRightClickMenuPos = reactive({
    height: 0,
    width: 0
});
const onContainerRightClick = ($event: MouseEvent) => {
    mainRightClickMenuPos.width = $event.offsetX;
    mainRightClickMenuPos.height = $event.offsetY;
};
</script>
