<script setup lang="ts">
import {
    ElButton,
    ElTooltip,
    ElSelect,
    ElOption,
} from 'element-plus';
import {
    Plus,
} from '@element-plus/icons-vue';
import { useGeneratorStore } from '@/stores/generator';
import FormInput from './FormInput.vue';
const store = useGeneratorStore();
</script>

<template>
    <form-input prop="prompt" v-model="store.prompt" resize="vertical" type="textarea" placeholder="Enter prompt here" label-position="top">
        <template #label>
            <div class="prompt-label">
                <div>Prompt</div>
                <el-tooltip content="Add trigger (dreambooth)" placement="top" v-if="store.selectedModelJSON?.trigger">
                    <el-button v-if="store.selectedModelJSON.trigger.length === 1" @click="() => store.addDreamboothTrigger()" :icon="Plus" class="trigger-select" />
                    <el-select v-else class="trigger-select" @change="store.addDreamboothTrigger">
                        <el-option
                            v-for="item in store.selectedModelJSON?.trigger"
                            :key="item"
                            :label="item"
                            :value="item"
                        />
                    </el-select>
                </el-tooltip>
            </div>
        </template>
    </form-input>
</template>

<style scoped>
    .prompt-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
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