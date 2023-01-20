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
</script>

<template>
    <div class="centerIcons">
        <div class="stackedIcons">
            <el-icon class="firstIcon"  :size="size"><component :is="props.iconOne" /></el-icon>
            <el-icon class="secondIcon" :size="size"><component :is="props.iconTwo" /></el-icon>
        </div>
    </div>
</template>

<style scoped>
.firstIcon {
    position: absolute;
    right: 15%;
    bottom: 12%;
    opacity: 0.8;
    z-index: 0;
}

.secondIcon {
    position: absolute;
    left: 15%;
    top: 12%;
    z-index: 1;
}

.centerIcons {
    width: v-bind(size+"px");
    height: v-bind(size+"px");
    display: flex;
    align-items: center;
    justify-content: center;
}

.stackedIcons {
    position: relative;
    width: 100%;
    height: 100%
}


/* The icons flip around on mobile for some reason */
@media only screen and (max-width: 768px) {
    .firstIcon {
        right: 30%;
    }

    .secondIcon {
        left: 30%;
    }
}
</style>