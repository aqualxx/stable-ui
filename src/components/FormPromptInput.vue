<script setup lang="ts">
import {
    ElButton,
    ElTooltip,
    ElSelect,
    ElOption,
    ElSwitch,
} from 'element-plus';
import {
    Plus,
    Delete,
    Check,
} from '@element-plus/icons-vue';
import { useGeneratorStore } from '@/stores/generator';
import { useTagsStore, type TagList } from '@/stores/tags';
import FormInput from './FormInput.vue';
import DialogList from './DialogList.vue';
import Star12Filled from './icons/Star12Filled.vue';
import Star12Regular from './icons/Star12Regular.vue';
import { computed, ref } from 'vue';
import { useUIStore } from '@/stores/ui';
import { formatDate } from '@/utils/format';
import { onKeyStroke } from '@vueuse/core';
const store = useGeneratorStore();
const tagStore = useTagsStore();

const uiStore = useUIStore();
const promptLibrary = ref(false);
const selectStyle = ref(false);

function getStyle(key: string) {
    const style = store.styles[key as any];
    const [prompt, negativePrompt] = style.prompt.split("###");
    return {
        prompt,
        promptSplit: prompt.replace("{np}", "").split("{p}"),
        negativePrompt,
        negativePromptSplit: negativePrompt ? negativePrompt.split("{np}") : undefined,
        model: style.model,
    }
}

function getPromptFromHistory(prompt: string) {
    return store.promptHistory.find(el => el.prompt === prompt);
}

function handleUseStyle(style: string) {
    const { prompt, negativePrompt, model } = getStyle(style);
    store.prompt = prompt.replace("{p}", store.prompt).replace("{np}", "");
    if (negativePrompt) store.negativePrompt = negativePrompt.replace("{np}", store.negativePrompt);
    if (store.filteredAvailableModels.map(el => el.value).includes(model)) {
        store.selectedModel = model;
    } else {
        uiStore.raiseWarning("Warning: style's model isn't available.", false)
    }
}

function handleFavourite(prompt: string) {
    const promptHistoryPrompt = store.promptHistory.findIndex(el => el.prompt === prompt);
    if (promptHistoryPrompt === -1) return;
    store.promptHistory[promptHistoryPrompt].starred = !store.promptHistory[promptHistoryPrompt].starred;
}

const sortedPromptHistory = computed(
    () => store.promptHistory
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp)
        .sort((a, b) => Number(b.starred) - Number(a.starred))
        .map(el => el.prompt || el)
)

const searchStyle = ref("");
const showDetails = ref(false);
const promptFocused = ref(false);
const selectedIndex = ref(0);
const maxTags = 8;

const currentWord = computed(() => store.prompt.split(' ')[store.prompt.split(' ').length - 1]);

const filteredTags = computed(() => {
    const tags = tagStore.currentTags.tags;
    const idx = binarySearch(tags, currentWord.value);
    if (idx < 0) {
        return [];
    }
    const filtered = [tags[idx]];
    for (let i = idx + 1; i < tags.length; i++) {
        const el = tags[i];
        if (el.name.startsWith(currentWord.value)) {
            filtered.push(el);
        } else {
            break;
        }
    }
    const numberFormatter = Intl.NumberFormat(undefined, { notation: "compact" });
    return filtered.sort((a,b) => b.postCount - a.postCount).slice(0, maxTags).map(el => ({ ...el, postCount: numberFormatter.format(el.postCount) }));
})

function binarySearch(arr: TagList[], target: string) {
    let low = 0;
    let high = arr.length - 1;
    let closestIdx = -1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const cmp = arr[mid].name.localeCompare(target);
        if (cmp <= 0) {
            closestIdx = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return closestIdx;
}

function pushTag(index: number) {
    const selectedTag = filteredTags.value[index].name;
    const a = store.prompt.split(currentWord.value);
    a.pop();
    store.prompt = a.join(currentWord.value) + selectedTag + ", ";
}

onKeyStroke("ArrowDown", (e) => {
    if (!promptFocused.value || tagStore.currentTags.tags.length === 0) return;
    e.preventDefault();
    if (selectedIndex.value >= maxTags - 1) return;
    selectedIndex.value++;
});

onKeyStroke("ArrowUp", (e) => {
    if (!promptFocused.value || tagStore.currentTags.tags.length === 0) return;
    e.preventDefault();
    if (selectedIndex.value <= 0) return;
    selectedIndex.value--;
});

onKeyStroke("Enter", (e) => {
    if (!promptFocused.value || tagStore.currentTags.tags.length === 0) return;
    e.preventDefault();
    pushTag(selectedIndex.value);
    selectedIndex.value = 0;
});
</script>

<template>
    <form-input
        prop="prompt"
        v-model="store.prompt"
        :autosize="{ minRows: 2, maxRows: 15 }"
        resize="vertical"
        type="textarea"
        placeholder="Enter prompt here"
        label-position="top"
        label-style="justify-content: space-between; width: 100%;"
        @focus="promptFocused = true"
        @blur="promptFocused = false"
    >
        <template #label>
            <div>Prompt</div>
            <el-tooltip content="Add trigger (dreambooth)" placement="top" v-if="store.selectedModelData?.trigger">
                <el-button v-if="store.selectedModelData.trigger.length === 1" @click="() => store.addDreamboothTrigger()" :icon="Plus" class="trigger-select" />
                <el-select v-else class="trigger-select" @change="store.addDreamboothTrigger">
                    <el-option
                        v-for="item in store.selectedModelData?.trigger"
                        :key="item"
                        :label="item"
                        :value="item"
                    />
                </el-select>
            </el-tooltip>
        </template>
        <template #inline>
            <div style="margin-top: -3px; position: relative">
                <div
                    style="position: absolute; z-index: 5; margin-top: 3px;"
                    v-if="tagStore.currentTags.tags.length !== 0 && promptFocused"
                    @focus="promptFocused = true"
                    @blur="promptFocused = false"
                >
                    <div
                        v-for="(tag, index) in filteredTags"
                        :key="tag.name"
                        class="tag-select"
                        :style="{
                            backgroundColor: selectedIndex === index ? `rgb(100, 100, 100)` : index % 2 === 0 ? `rgb(48, 48, 48)` : `rgb(58, 58, 58)`
                        }"
                        @mousedown.prevent="pushTag(index)"
                    >
                        <span :style="{ color: tag.color }">{{ tag.name }}</span>
                        <span>{{ tag.postCount }}</span>
                    </div>
                </div>
                <el-button class="small-btn" @click="() => promptLibrary = true" text>Load history</el-button>
                <el-button class="small-btn" @click="() => selectStyle = true"   text>Load style</el-button>
            </div>
        </template>
    </form-input>
    <DialogList
        v-model="promptLibrary"
        :list="sortedPromptHistory"
        title="Prompt History"
        empty-description="No prompt history found - try generating an image!"
        search-text="Search by prompt"
        search-empty-description="Found no matching prompt(s) from your search."
        @use="prompt => store.prompt = prompt"
        @delete="store.removeFromPromptHistory"
    >
        <template #actions="{item, handleUse, handleDelete}">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap-reverse; align-items: center; width: 100%">
                <div style="color: var(--el-color-info); font-size: 12px">{{formatDate(getPromptFromHistory(item)?.timestamp || 0)}}</div> 
                <div>
                    <el-button class="small-btn" @click="() => handleUse(item)" :icon="Check">Apply</el-button>
                    <el-button
                        class="small-btn"
                        @click="() => handleFavourite(item)"
                        :icon="getPromptFromHistory(item)?.starred ? Star12Filled : Star12Regular"
                    ></el-button>
                    <el-button class="small-btn" type="danger" @click="() => handleDelete(item)" :icon="Delete">Delete</el-button>
                </div>
            </div>
        </template>
    </DialogList>
    <DialogList
        v-if="selectStyle"
        v-model="selectStyle"
        :list="Object.keys(store.styles).filter(el => el !== 'raw' && el.includes(searchStyle))"
        title="Prompt Styles"
        empty-description="No styles found"
        search-empty-description="Found no matching style(s) from your search."
        searchText="Search by style"
        useText="Use Style"
        @use="handleUseStyle"
        width="50%"
    >
        <template #options>
            <div>
                <span style="margin-right: 10px">Show Details</span>
                <el-switch v-model="showDetails" />
            </div>
        </template>
        <template #item="itemProps">
            <div style="display: flex; justify-content: space-between">
                <h3>{{itemProps.item}}</h3>
                <strong>{{store.styles[itemProps.item].model}}</strong>
            </div>
            <div v-if="showDetails">
                <h4>Your prompt after applying:</h4>
                <div>
                    <span>{{getStyle(itemProps.item).promptSplit[0]}}</span>
                    <span style="color: var(--el-color-primary)">{{store.prompt || "(none)"}}</span>
                    <span>{{getStyle(itemProps.item).promptSplit[1]}}</span>
                </div>
                <div v-if="getStyle(itemProps.item).negativePromptSplit || getStyle(itemProps.item).prompt.includes('{np}')">
                    <h4>Negative Prompt: </h4>
                    <span>{{getStyle(itemProps.item)?.negativePromptSplit?.[0] || ""}}</span>
                    <span style="color: var(--el-color-primary)">{{store.negativePrompt || "(none)"}}</span>
                    <span>{{getStyle(itemProps.item)?.negativePromptSplit?.[1] || ""}}</span>
                </div>
            </div>
        </template>
    </DialogList>
</template>

<style scoped>
h3 {
    margin: 0;
}

h4, h5 {
    margin-bottom: 0;
}

.tag-select {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    padding: 0px 8px;
    width: 240px;
}

.tag-select:hover {
    background-color: rgb(100, 100, 100) !important;
}

.trigger-select {
    width: 30px;
    height: 30px;
}

:deep(.trigger-select .el-input__wrapper) {
    padding: 0;
}

:deep(.trigger-select .el-input__suffix, .trigger-select .el-input__suffix-inner) {
    width: 100%
}
</style>