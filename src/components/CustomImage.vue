<script setup lang="ts">
import { ref } from 'vue';
import { 
    ElImage,
    ElDialog,
    ElIcon
} from 'element-plus';
import {
    StarFilled,
    CircleCheck,
    CircleCheckFilled
} from '@element-plus/icons-vue'
import { useUIStore } from '@/stores/ui';
import { onLongPress } from '@vueuse/core';
import ImageActions from './ImageActions.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    id: number;
    image: string;
    prompt: string;
    sampler_name: "k_lms" | "k_heun" | "k_euler" | "k_euler_a" | "k_dpm_2" | "k_dpm_2_a" | "DDIM" | "PLMS";
    seed: string;
    steps: number;
    cfg_scale: number;
    height: number;
    width: number;
    modelName: string;
    starred: boolean;
}>();

const uiStore = useUIStore();

const centerDialogVisible = ref(false);
const imageRef = ref<HTMLElement | null>(null)

// Add way to reset
onLongPress(
    imageRef,
    uiStore.toggleMultiSelect,
    { modifiers: { prevent: true } }
)
</script>

<template>
    <div id="content" ref="imageRef">
        <el-image class="thumbnail" :src="image" @click="centerDialogVisible = true" fit="cover" loading="lazy" :style="uiStore.selected.includes(id) ? 'opacity: 0.5' : ''" />
        <el-icon v-if="starred" :size="40" color="var(--el-color-warning)"><StarFilled /></el-icon>
        <div v-if="uiStore.multiSelect" style="position: relative; width: 100%; height: 100%" @click="uiStore.toggleSelection(id)">
            <el-icon style="position: absolute; right: 5px; top: 5px" :size="35" :color="uiStore.selected.includes(id) ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'">
                <CircleCheck v-if="!uiStore.selected.includes(id)" />
                <CircleCheckFilled v-if="uiStore.selected.includes(id)" />
            </el-icon>
        </div>
    </div>
    <el-dialog
      v-model="centerDialogVisible"
      :title="prompt ? prompt : 'Unkown Creation'"
      :width="width"
      class="image-viewer"
      align-center
    >
      <div class="main-photo"><el-image :src="image" @click="centerDialogVisible = true" fit="fill" loading="lazy" /></div>
      <template #footer>
        <div class="modal-footer">
            <div class="text-left" style="grid-area: info; text-align: center;">
                <span>Model Name: {{modelName ? modelName : "Unknown"}} - </span>
                <span>Sampler: {{sampler_name ? sampler_name : "Unknown"}} - </span>
                <span>Seed: {{seed ? seed : "Unknown"}} - </span>
                <span>Steps: {{steps ? steps : "Unknown"}} - </span>
                <span>CFG Scale: {{cfg_scale ? cfg_scale : "Unknown"}} - </span>
                <span>Dimensions: {{width}}x{{height}}</span>
            </div>
            <div style="grid-area: main; width: 100%; text-align: center; margin-top: 10px">
                <ImageActions :id="id" :image="image" :prompt="prompt" :seed="seed" :starred="starred" />
            </div>
        </div>
      </template>
    </el-dialog>
</template>

<style>
    .thumbnail {
        position: absolute;
        display: inline-block;
        overflow: hidden;
        top: 0px;
        right: 0px;
        width: 200px;
        height: 200px;
    }

    #content {
        position: relative;
        width: 200px;
        height: 200px;
    }

    .main-photo {
        display:flex;
        justify-content:center;
        width: 100%;
        background-color: var(--el-fill-color-light);
    }

    .text-left {
        text-align: left;
    }

    .image-viewer {
        min-width: 50vw;
    }

    .image-viewer > .el-dialog__header {
        word-break: keep-all;
    }

    .image-viewer > .el-dialog__body {
        display:flex;
        justify-content:center;
        padding-bottom: 0
    }

    .modal-footer {
        display: grid;
        grid-template-areas:
            'info'
            'main';
    }

    @media only screen and (max-width: 768px) {
        #content, .thumbnail {
            width: 150px;
            height: 150px;
        }

        .image-viewer > .el-dialog__body {
            padding: 0
        }

        .main-photo {
            width: 80%
        }
    }
</style>