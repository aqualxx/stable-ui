<script setup lang="ts">
import {
    ElImage,
    ElCarousel,
    ElCarouselItem,
} from 'element-plus';
import FormSelect from './FormSelect.vue';
import InfoTooltip from './InfoTooltip.vue';
import { useGeneratorStore } from '@/stores/generator';
const store = useGeneratorStore();
</script>

<template>
    <form-select label="Model" prop="model" filterable v-model="store.selectedModel" :options="store.filteredAvailableModels">
        <template #label>
            <div style="display: flex; align-items: center; width: 100%">
                <div style="margin-right: 5px">Model</div>
                <InfoTooltip>
                    <div>Model Description: {{store.modelDescription}}</div>
                    <el-carousel
                        v-if="store.selectedModelJSON?.showcases"
                        style="margin-top: 10px"
                        :autoplay="false"
                        indicator-position="none"
                        :arrow="store.selectedModelJSON.showcases.length === 1 ? 'never' : 'always'"
                        height="220px"
                    >
                        <el-carousel-item v-for="showcase in store.selectedModelJSON.showcases" :key="showcase">
                            <el-image :src="showcase" />
                        </el-carousel-item>
                    </el-carousel>
                </InfoTooltip>
            </div>
        </template>
    </form-select>
</template>