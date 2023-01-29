<template>
    <div class="home">
        <top-bar></top-bar>
        <view>
            <div class="container">
                <div class="container-title">
                    MEP {{ props.i18n.settings }}
                </div>
                <div class="menu-list">
                    <ul>
                        <li>
                            <router-link to="/" class="button">{{ props.i18n.back }}</router-link>
                        </li>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                    </ul>
                </div>
                <div class="settings-container">
                    {{ props.i18n.language }}: <select class="language-select" v-model="customConfig.language">
                        <option value="en-US">en-US</option>
                        <option value="zh-CN">zh-CN</option>
                    </select>
                    <br />
                    {{ props.i18n.color }}: <input type="color" v-model="customConfig.editor.color" /> <br />
                    {{ props.i18n.size }}: <input type="number" min="1" max="300"
                        v-model="customConfig.editor.fontSize" /><br />
                    {{ props.i18n.font_family }}: <input type="text" maxlength="128"
                        v-model="customConfig.fontFamily" /><br />
                    <br />
                    {{ props.i18n.snippets }}<br />
                    <table border="1">
                        <tbody>
                            <tr>
                                <td>{{ props.i18n.show_text }}</td>
                                <td>{{ props.i18n.insert_code }}</td>
                            </tr>
                            <template v-for="item in customConfig.snippets" :key="item">
                                <tr>
                                    <td>
                                        <input type="text" maxlength="128" v-model="item.text" />
                                    </td>
                                    <td>
                                        <input type="text" maxlength="1024" v-model="item.code" />
                                    </td>
                                    <td>
                                        <span class="button" @click="removeSnippets(item.text, item.code)">{{
                                            props.i18n.remove
                                        }}</span>
                                    </td>
                                </tr>
                            </template>
                            <tr>
                                <td>
                                    <input type="text" maxlength="128" v-model="newText" />
                                </td>
                                <td>
                                    <input type="text" maxlength="128" v-model="newCode" />
                                </td>
                                <td>
                                    <span class="button" @click="insertSnippets">{{ props.i18n.add }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <br /><br />
                    <span class="button" @click="saveConfig">{{ props.i18n.save }}</span>
                </div>
            </div>
        </view>
        <bottom-bar></bottom-bar>
    </div>
</template>
<style scoped>
view {
    position: fixed;
    top: 72px;
    height: calc(100% - 72px - 18px);
    width: 100%;
}

.container-title {
    width: 100%;
    text-align: center;
    font-size: 36px;
    line-height: 48px;
    user-select: none;
}

.settings-container {
    user-select: none;
    font-size: 1.2em;
    overflow-y: scroll;
}

.menu-list ul {
    display: block;
    width: 100%;
    text-align: center;
    user-select: none;
    margin-top: 10px;
    margin-bottom: 10px;
    border: 2px solid rgb(200, 200, 200);
    padding: 6px 14px;
    border-radius: 8px;
    padding-inline-start: 0px;
    margin-block-start: 0px;
    /* cover user-agent */
}

.menu-list li {
    display: inline;
    font-size: 24px;
    line-height: 30px;
}

.menu-list li .button {
    text-decoration: none;
}

.button {
    color: rgb(40, 40, 40);
    cursor: pointer;
}

.button:hover {
    background-color: rgb(200, 200, 200);
}

select,
input {
    background-color: rgb(200, 241, 192);
    color: orangered;
    outline: none;
    padding: 3px 8px;
    border-radius: 2px;
    margin: 1px 3px;
}

input {
    border: 1px solid rgb(128, 128, 128);
}

input::selection {
    background-color: orangered;
    color: snow;
}
</style>
<script lang="ts" setup>
import { defineProps, ref, reactive } from 'vue';
import topBar from '@/components/top-bar.vue';
import bottomBar from '@/components/bottom-bar.vue';
import { i18nMap } from '@/i18n';
import { config } from '@/config';
import _ from 'lodash';
import updateConfig from '@/api/updateConfig';

const props = defineProps<{
    config: config,
    i18n: i18nMap
}>();

const customConfig = reactive(_.cloneDeep(props.config));

const newText = ref('');
const newCode = ref('');

const removeSnippets = (text: string, code: string) => {
    customConfig.snippets = customConfig.snippets.filter(item => !(item.code === code || item.text === text));
};
const insertSnippets = () => {
    if (newText.value === '' || newCode.value === '') return;
    customConfig.snippets.push({
        text: newText.value,
        code: newCode.value
    });
    newText.value = '';
    newCode.value = '';
};

const saveConfig = () => {
    updateConfig(customConfig).then(() => location.reload());
};
</script>
