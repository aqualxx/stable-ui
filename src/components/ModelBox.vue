<script setup lang="ts">
import {
    ElDivider,
    ElCard,
    ElIcon,
    ElTooltip,
    ElImage,
    ElCarousel,
    ElCarouselItem,
    ElEmpty,
    vLoading,
    ElLoading,
} from 'element-plus';
import {
    CircleCheck,
    CircleClose,
    VideoPause
} from "@element-plus/icons-vue";
import { computed, ref } from 'vue';
import type { IModelData } from '@/stores/generator';
import { useIntersectionObserver } from '@vueuse/core';
const props = defineProps<{
    model: IModelData;
}>();

const status = computed(() => {
    if (props.model.count === 0) {
        return "Offline";
    }
    if (props.model.queued === 0) {
        return "Standby";
    }
    return "Online";
})

const imageRef = ref(null);
const shouldRender = ref(false);
useIntersectionObserver(
    imageRef,
    ([{ isIntersecting }]) => {
        shouldRender.value = isIntersecting;
    }, {
        rootMargin: '500px',
    }
);
</script>

<template>
    <el-card class="model-box" :body-style="{ padding: '0px' }" ref="imageRef">
        <div v-if="shouldRender">
            <el-carousel
                style="margin-top: 10px; width: 100%; margin: 0"
                :autoplay="false"
                indicator-position="none"
                v-if="model.showcases"
                :arrow="model.showcases.length === 1 ? 'never' : 'always'"
                v-loading=""
            >
                <el-carousel-item v-for="showcase in model.showcases" :key="showcase">
                    <el-image :src="showcase">
                        <template #placeholder>
                            <div v-loading="true" element-loading-text="Loading..." style="height: 300px"></div>
                        </template>
                    </el-image>
                </el-carousel-item>
            </el-carousel>
            <el-empty v-else description="No showcase found!" />
        </div>
        <div v-else style="height: 300px"></div>
        <div style="padding: 20px">
            <div style="display: flex; justify-content:space-between; font-size: 16px;">
                <div class="card-header">
                    <el-tooltip
                        :content="status"
                        placement="top"
                    >
                        <el-icon :size="20" color="red"    v-if="model.count === 0"><CircleClose /></el-icon>
                        <el-icon :size="20" color="orange" v-else-if="model.queued === 0"><VideoPause /></el-icon>
                        <el-icon :size="20" color="green"  v-else><CircleCheck /></el-icon>
                    </el-tooltip>
                    <span style="margin-left: 0.5rem">{{model.name}}</span>
                </div>
                <slot name="header"></slot>
            </div>
            <div>There are <strong>{{model.count}}</strong> workers running this model</div>
            <div>There are <strong>{{Math.floor((model.queued || 0) / 10_000) / 100}}</strong> MPS queued</div>
            <div>The average model speed is <strong>{{Math.floor((model.performance || 0) / 10_000) / 100}}</strong> MPS/s</div>
            <div>It is expected to take <strong>{{model.eta}}s</strong> to clear this queue</div>
            <div></div>
            <div>The style of this model is <strong>{{model.style}}</strong></div>
            <div v-if="model.nsfw">This model may produce NSFW images.</div>
            <el-divider v-if="model.description" style="margin: 10px 0" />
            <div class="small-font">{{model.description}}</div>
        </div>
    </el-card>
</template>

<style scoped>
    .card-header {
        display: flex;
        align-items: center;
        font-weight: 800;
    }

    .small-font {
        font-style: oblique;
        font-size: 12px;
    }

    .model-box {
        width: 32%;
        min-width: 350px;
        min-height: 100%;
    }
</style>