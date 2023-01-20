<script setup lang="ts">
import type { Component } from 'vue';
import {
    ElTooltip,
    ElMenuItem,
    ElIcon
} from 'element-plus';
import StackedIcon from './StackedIcon.vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    index: any;
    iconOne:Component<any>;
    iconTwo?: Component<any>;
    isMobile: boolean;
}>();
</script>

<template>
    <el-tooltip :content="index" :placement="isMobile ? 'bottom' : 'right'" :enterable="false" :hide-after="100">
        <el-menu-item :index="index" style="height: 60px; display: flex; justify-content: center;">
            <StackedIcon :iconOne="iconOne" :iconTwo="iconTwo" :size="40" v-if="iconTwo" />
            <div style="width: 40px;" v-else>
                <el-icon style="width: 35px" :size="40"><component :is="props.iconOne" /></el-icon>
            </div>
        </el-menu-item>
    </el-tooltip>
</template>
