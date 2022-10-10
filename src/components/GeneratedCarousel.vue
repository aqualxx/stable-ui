<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { ElCarousel, ElCarouselItem, ElImage } from 'element-plus';
const store = useGeneratorStore();
</script>

<template>
    <el-carousel
        v-if="store.images.length != 0"
        style="width: 50vw"
        trigger="click"
        indicator-position="outside"
    >
        <el-carousel-item v-for="image in store.images" :key="image.seed">
            <el-image
                :src="`data:image/webp;base64,${image.img}`"
                style="width: 100%; height: 100%"
                fit="scale-down"
            ></el-image>
        </el-carousel-item>
    </el-carousel>
</template>