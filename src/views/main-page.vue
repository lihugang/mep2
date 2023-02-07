<template>
    <div class="home">
        <top-bar></top-bar>
        <view>
            <div class="loading" v-if="isLoading">
                {{ loadingDisplayWords }}
            </div>
            <div class="container" v-else>
                <div class="container-title">
                    MEP
                </div>
                <div class="menu-list">
                    <ul>
                        <li>
                            <router-link to='/editor' class="button">{{ props.i18n.start_editor }}</router-link>
                        </li>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <!-- <li>
                            <router-link to='/versionControl' class="button">{{
                                props.i18n.version_control
                            }}</router-link>
                        </li>
                        &nbsp;&nbsp;&nbsp;&nbsp; -->
                        <!-- TODO -->
                        <li>
                            <router-link to='/settings' class="button">{{ props.i18n.settings }}</router-link>
                        </li>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <li>
                            <router-link to='/about' class="button">{{ props.i18n.about_us }}</router-link>
                        </li>
                    </ul>
                </div>
                <div class="release-log">
                    <div class="release-log-title">{{ props.i18n.release_log }}</div>
                    <div class="monaco-editor release-show" ref="releaseLogBox">
                        <div class="editor-loading" v-if="isReleaseLogLoading">
                            {{ props.i18n.loading_release_log }}
                            <br />{{ props.i18n.please_wait_for_a_minute }}
                        </div>
                    </div>
                </div>
            </div>
        </view>
        <bottom-bar :i18n="props.i18n"></bottom-bar>
        <popup-component ref="popup"></popup-component>
    </div>
</template>
<style scoped>
view {
    position: fixed;
    top: 72px;
    height: calc(100% - 72px - 18px);
    width: 100%;
}

.loading,
.container-title,
.release-log-title {
    width: 100%;
    text-align: center;
    font-size: 36px;
    line-height: 48px;
    user-select: none;
}

.release-log-title {
    font-size: 24px;
    line-height: 30px;
}

.editor-loading {
    font-size: 16px;
    line-height: 24px;
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
</style>
<script lang="ts" setup>
import { ref, defineProps, onMounted } from 'vue';
import topBar from '@/components/top-bar.vue';
import bottomBar from '@/components/bottom-bar.vue';
import popupComponent from '@/components/popup-component.vue';
import isElectron from '@/api/isElectron';
import type { i18nMap } from '@/i18n';
import type { config } from '@/config';

const props = defineProps<{
    config: config,
    i18n: i18nMap
}>();
const isLoading = ref(true);
const isReleaseLogLoading = ref(true);

// the first step, check whether it is in electron
const loadingDisplayWords = ref(
    props.i18n.detecting_running_environment
);

const popup = ref<null | InstanceType<typeof popupComponent>>(null);

onMounted(() => {
    isElectron.then(isElectron => {
        if (isElectron) {
            // electron, check for updates
            import('../api/getVersion').then(getVersion => getVersion.default).then(getVersion => {
                Promise.all(
                    [
                        getVersion.localVersion,
                        getVersion.latestVersion
                    ]
                ).then(version => {
                    if (
                        JSON.stringify(version[0]) ===
                        JSON.stringify(version[1])
                        // stringify version arraies, compare whether they fits, the comparison between objects are comparing their memory addresses, not values
                    ) {
                        // version equals
                        return loadComponents();
                    } else {
                        // update to the latest version
                        import('../api/updateVersion').then(updateVersion => updateVersion.default());
                        loadingDisplayWords.value = props.i18n.update_version;
                    }
                });
            });
        } else {
            requestIdleCallback(() => {
                // when browser idle, notice user he/she is using web platform, some function may be disabled, suggest he/she installing app
                popup.value?.registerTask(props.i18n.web_side_notification, [{
                    text: props.i18n.confirm
                }]);
            });

            return loadComponents();
        }
    });
});

const releaseLogBox = ref<HTMLElement | null>(null);
const loadComponents = () => {
    Promise.all([

    ]).then(() => {
        isLoading.value = false; // finished initializing, load page components
        import('../api/getLatestReleaseLog').then(releaseLogGetter => releaseLogGetter.default(props.i18n.lang as config['language'])).then(value => value.data).then(releaseLog => {
            // get release log
            // import editor
            import('monaco-editor').then(monaco => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                if (releaseLogBox.value) {
                    const releaseContainer = monaco.editor.create(releaseLogBox.value, {
                        value: releaseLog,
                        colorDecorators: true,
                        language: 'text',
                        theme: 'vs',
                        selectOnLineNumbers: true,
                        roundedSelection: true,
                        readOnly: true,
                        glyphMargin: true,
                        contextmenu: true,
                        columnSelection: true,
                        autoSurround: 'never',
                        copyWithSyntaxHighlighting: true,
                        cursorBlinking: 'solid',
                        cursorSmoothCaretAnimation: true,
                        cursorStyle: 'underline-thin',
                        cursorWidth: 2,
                        minimap: {
                            enabled: true
                        },
                        links: true,
                        overviewRulerBorder: false,
                        renderLineHighlight: 'gutter',
                        scrollBeyondLastColumn: 10,
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        foldingStrategy: 'indentation',
                        lineHeight: 20,
                        fontSize: 16,
                        lineNumbers: 'on'
                    });
                    isReleaseLogLoading.value = false;

                    const updateEditorSize = () => {
                        releaseContainer.layout({
                            width: releaseLogBox.value?.offsetWidth || 0,
                            height: window.innerHeight - (releaseLogBox.value?.getBoundingClientRect().top ?? 0) - 8
                        });
                    };

                    window.addEventListener('resize', updateEditorSize);
                    requestAnimationFrame(updateEditorSize);
                }
            });
        });
    });
};
</script>
