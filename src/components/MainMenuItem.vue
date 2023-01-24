<script setup lang="ts">
import {
    ElMenuItem,
} from 'element-plus';

defineProps<{
    index: string;
    isMobile: boolean;
}>();
</script>

<template>
    <el-menu-item :index="index">
        <slot name="icon" />
        <slot name="title" v-if="!isMobile" />
    </el-menu-item>
</template>