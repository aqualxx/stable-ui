<script setup lang="ts">
import { computed, ref } from 'vue';
import { 
    ElImage,
    ElIcon,
} from 'element-plus';
import {
    StarFilled,
    CircleCheck,
    CircleCheckFilled,
} from '@element-plus/icons-vue'
import { useUIStore } from '@/stores/ui';
import type {  ImageData } from '@/stores/outputs';
import { onLongPress, useIntersectionObserver } from '@vueuse/core';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    imageData: ImageData
}>();

const uiStore = useUIStore();

const imageRef = ref<HTMLElement | null>(null)

onLongPress(
    imageRef,
    uiStore.toggleMultiSelect,
    { modifiers: { prevent: true } }
)

const shouldRender = ref(false);
useIntersectionObserver(
    imageRef,
    ([{ isIntersecting }]) => {
        shouldRender.value = isIntersecting;
    }, {
        rootMargin: '500px'
    }
);

const isSelected = computed(() => uiStore.selected.includes(props.imageData.id));
</script>

<template>
    <div ref="imageRef" id="content">
        <div id="content" v-if="shouldRender">
            <el-image
                class="thumbnail"
                :src="imageData.image"
                @click="uiStore.activeModal = imageData.id"
                fit="cover"
                loading="lazy"
                :style="`${isSelected && 'opacity: 0.5'}`"
            />
            <div class="image-action">
                <el-icon v-if="imageData.starred" class="starred-icon" :size="35" color="var(--el-color-warning)"><StarFilled /></el-icon>
                <div v-if="uiStore.multiSelect" class="select-container" @click="uiStore.toggleSelection(imageData.id)">
                    <el-icon class="select-icon" :size="35" :color="`rgba(255, 255, 255, ${isSelected ? '1' : '0.5'})`">
                        <CircleCheck v-if="!isSelected" />
                        <CircleCheckFilled v-if="isSelected" />
                    </el-icon>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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

    .image-action {
        position: relative;
        height: 100%;
        width: 100%;
        pointer-events: none;
    }

    .starred-icon {
        position: absolute;
        left: 5px;
        top: 5px;
    }

    .select-container {
        position: absolute;
        width: 100%;
        height: 100%;
        pointer-events: all;
    }

    .select-icon {
        position: absolute;
        right: 5px;
        top: 5px;
    }

    @media only screen and (max-width: 768px) {
        #content, .thumbnail {
            width: 150px;
            height: 150px;
        }
    }
</style>