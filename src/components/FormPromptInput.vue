<script setup lang="ts">
import {
    ElButton,
    ElTooltip,
    ElSelect,
    ElOption,
    ElInput,
    ElSwitch
} from 'element-plus';
import {
    Plus,
    Search,
} from '@element-plus/icons-vue';
import { useGeneratorStore } from '@/stores/generator';
import FormInput from './FormInput.vue';
import DialogList from './DialogList.vue';
import { ref } from 'vue';
import { useUIStore } from '@/stores/ui';
const store = useGeneratorStore();
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

const searchStyle = ref("");
const showDetails = ref(false);
</script>

<template>
    <form-input prop="prompt" v-model="store.prompt" :autosize="{ minRows: 2 }" resize="vertical" type="textarea" placeholder="Enter prompt here" label-position="top" label-style="justify-content: space-between; width: 100%;">
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
            <el-button class="small-btn" style="margin-top: 2px" @click="() => promptLibrary = true" text>Load history</el-button>
            <el-button class="small-btn" style="margin-top: 2px" @click="() => selectStyle = true"   text>Load style</el-button>
        </template>
    </form-input>
    <DialogList
        v-model="promptLibrary"
        :list="store.promptHistory"
        title="Prompt History"
        empty-description="No prompt history found - try generating an image!"
        useText="Use Prompt"
        deleteText="Delete Prompt"
        @use="prompt => store.prompt = prompt"
        @delete="prompt => store.removeFromPromptHistory(prompt)"
    />
    <DialogList
        v-if="selectStyle"
        v-model="selectStyle"
        :list="Object.keys(store.styles).filter(el => el !== 'raw' && el.includes(searchStyle))"
        title="Prompt Styles"
        empty-description="No styles found"
        useText="Use Style"
        @use="handleUseStyle"
        width="50%"
    >
        <template #top>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <el-input  v-model="searchStyle" style="width: 180px;" :suffix-icon="Search" placeholder="Search by name" />
                <div>
                    <span style="margin-right: 10px">Show Details</span>
                    <el-switch v-model="showDetails" />
                </div>
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

.trigger-select {
    width: 30px;
    height: 30px;
}

.trigger-select .el-input__wrapper {
    padding: 0;
}

.trigger-select .el-select__caret {
    margin: 0;
}

.trigger-select .el-input__suffix, .trigger-select .el-input__suffix-inner {
    width: 100%
}
</style>