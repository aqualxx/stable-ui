<script setup lang="ts">
import { useGeneratorStore } from '@/stores/generator';
import { useUIStore } from '@/stores/ui';
import { ElProgress, ElIcon } from 'element-plus';
import { Right } from '@element-plus/icons-vue';
import { computed } from 'vue';
const store = useGeneratorStore();
const uiStore = useUIStore();

const pendingRequests = computed(() => store.queue.filter(el => el.jobId === "" || !el.waitData));
</script>

<template>
    <div v-if="uiStore.progress != 0" style="text-align: center;">
        <el-progress
            type="circle"
            :percentage="uiStore.progress / (pendingRequests.length + 1)"
            :width="200"
        >
            <template #default>
                <span>EST: {{ Math.round((store.queueStatus?.wait_time as number) * (pendingRequests.length + 1)) }}s</span><br>
            </template>
        </el-progress>
        <div style="font-size: 15px; padding: 8px; margin-top: 10px; background-color: var(--el-color-info-light-9); border-radius: 5px">
            <div style="font-size: 18px">Generation Status</div>
            <span>Pending: {{ (store.queueStatus.waiting || 0) + pendingRequests.map(el => el?.params?.n || 0).reduce((curr, next) => curr + next, 0) }} - </span>
            <span>Processing: {{ store.queueStatus.processing }} - </span>
            <span>Finished: {{ store.queueStatus.finished }} - </span>
            <span>Restarted: {{ store.queueStatus.restarted }}</span>
            <div>Queue Position: {{ store.queueStatus.queue_position }}</div>
        </div>
        <div @click="uiStore.showGeneratedImages = true" v-if="store.images.length != 0" class="view-images">
            <span>View {{ store.gatheredImages }} / {{ store.queue.map(el => el.params?.n || 0).reduce((curr, next) => curr + next, 0) }} images</span>
            <el-icon><Right /></el-icon>
        </div>
    </div>
</template>

<style scoped>
.view-images {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-info);
    font-weight: 500;
    margin-top: 8px;
    gap: 8px;
}

.view-images:hover {
    cursor: pointer;
    text-decoration: underline;
}
</style>