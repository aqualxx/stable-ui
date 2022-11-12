<script setup lang="ts">
import { computed, ref } from 'vue';
import { 
    ElImage,
    ElDialog,
    ElIcon
} from 'element-plus';
import {
    StarFilled,
    CircleCheck,
    CircleCheckFilled,
} from '@element-plus/icons-vue'
import { useUIStore } from '@/stores/ui';
import { useOutputStore, type ImageData } from '@/stores/outputs';
import { onLongPress, useSwipe, type SwipeDirection } from '@vueuse/core';
import ImageActions from './ImageActions.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    imageData: ImageData
}>();

const uiStore = useUIStore();
const outputStore = useOutputStore();

const imageRef = ref<HTMLElement | null>(null)

// Add way to reset
onLongPress(
    imageRef,
    uiStore.toggleMultiSelect,
    { modifiers: { prevent: true } }
)

const modalOpen = computed({
    get() {
        return props.imageData === outputStore.sortedOutputs[uiStore.activeModal];
    },
    set(value: boolean) {
        uiStore.activeModal = value ? outputStore.sortedOutputs.indexOf(props.imageData) : -1;
    }
})

const target = ref();

useSwipe(target, {
    onSwipeEnd(e: TouchEvent, direction: SwipeDirection) {
        if (direction === "RIGHT") uiStore.openModalToLeft()
        if (direction === "LEFT") uiStore.openModalToRight()
    },
})

function handleClose(done: () => void) {
    modalOpen.value = false;
    done();
}
</script>

<template>
    <div id="content" ref="imageRef">
        <el-image class="thumbnail" :src="imageData.image" @click="modalOpen = true" fit="cover" loading="lazy" :style="uiStore.selected.includes(imageData.id) ? 'opacity: 0.5' : ''" />
        <div style="position: relative; height: 100%; width: 100%; pointer-events: none;">
            <el-icon v-if="imageData.starred" style="position: absolute; left: 5px; top: 5px" :size="35" color="var(--el-color-warning)"><StarFilled /></el-icon>
            <div v-if="uiStore.multiSelect" style="position: absolute; width: 100%; height: 100%; pointer-events: all;" @click="uiStore.toggleSelection(imageData.id)">
                <el-icon style="position: absolute; right: 5px; top: 5px" :size="35" :color="uiStore.selected.includes(imageData.id) ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'">
                    <CircleCheck v-if="!uiStore.selected.includes(imageData.id)" />
                    <CircleCheckFilled v-if="uiStore.selected.includes(imageData.id)" />
                </el-icon>
            </div>
        </div>
    </div>
    <el-dialog
        :model-value="modalOpen"
        :title="imageData.prompt ? imageData.prompt : 'Unkown Creation'"
        :width="imageData.width"
        class="image-viewer"
        :before-close="handleClose"
        align-center
    >
        <div class="main-photo" ref="target"><el-image :src="imageData.image" fit="fill" loading="lazy" /></div>
        <template #footer>
            <div class="modal-footer">
                <div class="text-left" style="grid-area: info; text-align: center;">
                    <span>Model Name: {{imageData.modelName ? imageData.modelName : "Unknown"}} - </span>
                    <span>Sampler: {{imageData.sampler_name ? imageData.sampler_name : "Unknown"}} - </span>
                    <span>Seed: {{imageData.seed ? imageData.seed : "Unknown"}} - </span>
                    <span>Steps: {{imageData.steps ? imageData.steps : "Unknown"}} - </span>
                    <span>CFG Scale: {{imageData.cfg_scale ? imageData.cfg_scale : "Unknown"}} - </span>
                    <span>Dimensions: {{imageData.width}}x{{imageData.height}}</span>
                </div>
                <div style="grid-area: main; width: 100%; text-align: center; margin-top: 10px">
                    <ImageActions :image-data="imageData" />
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

        .image-viewer {
            min-width: 90vw;
        }

        .image-viewer > .el-dialog__header {
            --el-dialog-title-font-size: 16px;
        }

        .image-viewer > .el-dialog__body {
            padding: 0
        }

        .main-photo {
            width: 95%
        }
    }
</style>