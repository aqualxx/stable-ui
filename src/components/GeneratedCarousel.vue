<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { useOptionsStore } from '@/stores/options';
import { ElCarousel, ElCarouselItem, ElImage, ElDivider, ElScrollbar } from 'element-plus';
import { ref } from 'vue';
import ImageActions from './ImageActions.vue';
import type { ImageData } from "@/stores/outputs";
const store = useGeneratorStore();
const optionStore = useOptionsStore();

const index = ref(0);
function onChange(newIndex: number) {
    index.value = newIndex;
    console.log(store.images[index.value])
}

function onDelete(id: number) {
    store.images.splice(store.images.findIndex(el => el.id === id), 1)
}
</script>

<template>
    <div style="position: relative; height: 100%; width: 100%" v-if="store.images.length != 0">
        <el-carousel
            style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%;"
            :autoplay="optionStore.autoCarousel === 'Enabled'"
            trigger="click"
            indicator-position="outside"
            @change="onChange"
        >
            <el-carousel-item v-for="imageData in store.images" :key="imageData.seed">
                <el-image
                    :src="imageData.image"
                    style="width: 100%; height: 100%;"
                    fit="scale-down"
                ></el-image>
            </el-carousel-item>
        </el-carousel>
        <div class="carousel-footer">
            <el-divider />
            <div style="display: flex; justify-content: center">
                <el-scrollbar>
                    <div style="white-space: nowrap;">
                        <ImageActions
                            :imageData="store.images[index]"
                            :on-delete="onDelete"
                        />
                    </div>
                </el-scrollbar>
            </div>
        </div>
    </div>
</template>

<style scoped>
.carousel-footer {
    position: absolute;
    bottom: 24px;
    width: 100%;
}

@media only screen and (max-width: 1280px) {
    .carousel-footer {
        bottom: 5px;
    }
    .carousel-footer > .el-divider {
        margin: 5px 0;
    }
}
</style>