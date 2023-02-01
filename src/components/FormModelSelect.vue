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
    <form-select
        label="Models"
        prop="models"
        v-model="store.selectedModelMultiple"
        :options="store.filteredAvailableModels"
        filterable
        multiple
        placement="top" 
        v-if="store.multiModelSelect === 'Enabled'"
        class="multi-model-select"
    />
    <form-select label="Model" prop="model"  v-model="store.selectedModel" :options="store.filteredAvailableModels" filterable v-else>
        <template #label>
            <div style="display: flex; align-items: center; width: 100%">
                <div style="margin-right: 5px">Model</div>
                <InfoTooltip>
                    <div>Model Description: {{store.modelDescription}}</div>
                    <el-carousel
                        v-if="store.selectedModelData?.showcases"
                        style="margin-top: 10px"
                        :autoplay="false"
                        indicator-position="none"
                        :arrow="store.selectedModelData.showcases.length === 1 ? 'never' : 'always'"
                        height="220px"
                    >
                        <el-carousel-item v-for="showcase in store.selectedModelData.showcases" :key="showcase">
                            <el-image :src="showcase" />
                        </el-carousel-item>
                    </el-carousel>
                </InfoTooltip>
            </div>
        </template>
    </form-select>
</template>

<style>
.multi-model-select > .el-form-item__content > .el-select {
    min-width: 80%
}
</style>