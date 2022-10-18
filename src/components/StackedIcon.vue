<script setup lang="ts">
import type { Component } from 'vue';
import {
    ElIcon
} from 'element-plus';

const props = defineProps<{
    iconOne: Component<any>;
    iconTwo: Component<any>;
    size: number;
}>();

console.log(props.size)
</script>

<template>
    <div class="stackedIcons">
        <el-icon class="firstIcon"  :size="size"><component :is="props.iconOne" /></el-icon>
        <el-icon class="secondIcon" :size="size"><component :is="props.iconTwo" /></el-icon>
    </div>
</template>

<style scoped>
.firstIcon {
    position: relative;
    opacity: 0.8;
    z-index: 0;
}

.secondIcon {
    position: relative;
    right: v-bind((size / 2.5)+"px");
    top: v-bind((size / 4)+"px");
    z-index: 1;
}

.stackedIcons {
    position: relative;
    bottom: v-bind((size / 5)+"px");
}
</style>