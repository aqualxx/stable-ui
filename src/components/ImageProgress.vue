<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { useUIStore } from '@/stores/ui';
import { ElProgress } from 'element-plus';
const store = useGeneratorStore();
const uiStore = useUIStore();
</script>

<template>
    <div v-if="uiStore.progress != 0" style="text-align: center;">
        <el-progress
            type="circle"
            :percentage="uiStore.progress"
            :width="200"
        >
            <template #default>
                <span>EST: {{ Math.round(store.queueStatus?.wait_time as number) }}s</span><br>
            </template>
        </el-progress>
        <div style="font-size: 15px; padding: 8px; margin-top: 10px; background-color: var(--el-color-info-light-9); border-radius: 5px">
            <div style="font-size: 18px">Generation Status</div>
            <span>Pending: {{ store.queueStatus.waiting }} - </span>
            <span>Processing: {{ store.queueStatus.processing }} - </span>
            <span>Finished: {{ store.queueStatus.finished }} - </span>
            <span>Restarted: {{ store.queueStatus.restarted }}</span>
            <span v-if="store.queueStatus.done"> - Gathering {{ (store.queueStatus.finished || 0) - store.gatheredImages }} image(s)...</span>
        </div>
    </div>
</template>