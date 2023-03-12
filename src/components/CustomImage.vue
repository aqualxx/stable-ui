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

const containerRef = ref<HTMLElement | null>(null);

onLongPress(
    containerRef,
    uiStore.toggleMultiSelect,
    { modifiers: { prevent: true } }
)

const shouldRender = ref(false);
useIntersectionObserver(
    containerRef,
    ([{ isIntersecting }]) => {
        if (isIntersecting) shouldRender.value = isIntersecting;
    }, {
        rootMargin: '500px',
    }
);

const isSelected = computed(() => uiStore.selected.includes(props.imageData.id));
</script>

<template>
    <div class="relative" ref="containerRef">
        <el-image
            class="thumbnail"
            :src="imageData.image"
            @click="uiStore.activeModal = imageData.id"
            fit="cover"
            loading="lazy"
            :style="`${isSelected && 'opacity: 0.5'}`"
            v-if="shouldRender"
        />
        <div class="image-action" v-if="shouldRender">
            <el-icon v-if="imageData.starred" class="starred-icon" :size="35" color="var(--el-color-warning)"><StarFilled /></el-icon>
            <div v-if="uiStore.multiSelect" class="select-container" @click="uiStore.toggleSelection(imageData.id)">
                <el-icon class="select-icon" :size="35" :color="`rgba(255, 255, 255, ${isSelected ? '1' : '0.5'})`">
                    <CircleCheck v-if="!isSelected" />
                    <CircleCheckFilled v-if="isSelected" />
                </el-icon>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .thumbnail {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 4px;
    }

    .thumbnail:hover {
        cursor: pointer;
    }

    .relative {
        position: relative;
    }

    .image-action {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
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
</style>