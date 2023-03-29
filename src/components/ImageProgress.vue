<script setup lang="ts">
import { useSlots } from 'vue';
import type { ICurrentGeneration } from '@/stores/generator';
import { ElProgress, ElIcon } from 'element-plus';
import { Right } from '@element-plus/icons-vue';
import type { RequestStatusCheck } from '@/types/stable_horde';

defineProps<{
    est?: string | number;
    progress?: number;
    failed?: number;
    total?: number;
    gathered?: number;
    pendingRequests?: ICurrentGeneration[];
    queueStatus?: RequestStatusCheck;
}>();

defineEmits(["showGenerated"]);

const slots = useSlots();
</script>

<template>
    <div style="text-align: center;">
        <el-progress
            type="circle"
            :percentage="(progress ?? 0) / ((pendingRequests?.length ?? 0) + 1)"
            :width="200"
        >
            <template #default>
                <span>{{ est }}</span><br>
            </template>
        </el-progress>
        <div class="queue-status" v-if="queueStatus || slots.status">
            <slot name="status">
                <div v-if="queueStatus">
                    <div style="font-size: 18px">Generation Status</div>
                    <span v-if="pendingRequests">Pending: {{ (queueStatus.waiting ?? 0) + pendingRequests.reduce((curr, next) => curr + (next.params?.n ?? 0), 0) - (failed ?? 0) }} - </span>
                    <span>Processing: {{ queueStatus.processing }} - </span>
                    <span>Finished: {{ queueStatus.finished }} - </span>
                    <span>Restarted: {{ queueStatus.restarted }} - </span>
                    <span>Failed: {{ failed }}</span>
                    <div>Queue Position: {{ queueStatus.queue_position }}</div>
                </div>
            </slot>
        </div>
        <div @click="$emit('showGenerated')" v-if="gathered && total" class="view-images">
            <span>View {{ gathered }} / {{ total }} images</span>
            <el-icon><Right /></el-icon>
        </div>
    </div>
</template>

<style scoped>
.queue-status {
    font-size: 15px;
    margin-top: 8px;
    padding: 8px;
    border-radius: 5px;
    min-width: 300px;
    background-color: var(--el-color-info-light-9);
}

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