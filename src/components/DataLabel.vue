<script setup lang="ts">
import {
    ElCard,
    ElAvatar
} from 'element-plus'
import type { DefineComponent } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    label: string;
    color: string;
    content: any;
    icon: DefineComponent<any>;
}>()

</script>

<template>
    <div style="width: 100%; display: flex; justify-content: center;">
        <el-card class="data-label" style="height: 70px; width: 100%">
            <div class="data-label-content">
                <div class="data-label-icon">
                    <el-avatar :size="60" :icon="icon" :style="'background:'+color" />
                </div>
                <div>
                    <div class="data-label-title">
                        {{ label }}
                    </div>
                    <div class="data-label-content">
                        <strong>{{ content == undefined ? "Loading..." : content }}</strong>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<style>
    .data-label-title {
        font-size: 16px;
        color: grey;
        display: flex;
        align-items: flex-end;
    }

    .data-label-content {
        font-size: 22px;
    }

    .data-label > .el-card__body {
        padding: 0;
        height: 100%;
    }

    .data-label {
        padding: 1rem;
    }

    .data-label-icon {
        margin-right: 2rem;
    }

    .data-label-content {
        display: flex;
        align-items: center;
        height: 100%;
    }
</style>