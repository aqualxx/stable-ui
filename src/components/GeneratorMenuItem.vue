<script setup lang="ts">
import type { Component } from 'vue';
import {
    ElTooltip,
    ElMenuItem
} from 'element-plus';
import StackedIcon from './StackedIcon.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    index: any;
    iconOne:Component<any>;
    iconTwo: Component<any>;
    isMobile: boolean;
}>();
</script>

<template>
    <el-tooltip :content="index" :placement="isMobile ? 'bottom' : 'right'" :enterable="false" :hide-after="100">
        <el-menu-item :index="index">
            <StackedIcon :iconOne="iconOne" :iconTwo="iconTwo" :size="40" />
        </el-menu-item>
    </el-tooltip>
</template>
