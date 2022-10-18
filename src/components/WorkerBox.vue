<script setup lang="ts">
import {
    ElCard,
    ElDivider,
    ElIcon,
    ElTooltip
} from 'element-plus';
import {
    VideoPause,
    CircleCheck,
    CircleClose,
    Warning
} from "@element-plus/icons-vue"
import type { CustomWorkerDetails } from '@/types/stable_horde';
import { computed } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    worker: CustomWorkerDetails
}>();

function secondsToDhm(seconds: number | string | undefined) {
    if (seconds == undefined) return "?";
    seconds = Number(seconds);
    if (seconds === 0) return "0s";
    let d = Math.floor(seconds / 86400)
    var h = Math.floor(seconds % 86400 / 3600);
    var m = Math.floor(seconds % 86400 % 3600 / 60);

    var dDisplay = d > 0 ? d + "d " : "";
    var hDisplay = h > 0 ? h + "h " : "";
    var mDisplay = m > 0 ? m + "m " : "";
    return dDisplay + hDisplay + mDisplay;
}

const status = computed(() => {
    if (props.worker.stale) {
        return "Offline";
    }
    if (props.worker.paused) {
        return "Paused";
    }
    if (props.worker.maintenance_mode) {
        return "Maintenance";
    }
    return "Online";
})

</script>

<template>
    <el-card class="worker-box">
        <template #header>
            <div style="display: flex; justify-content:space-between">
                <div class="card-header">
                    <el-tooltip
                        :content="status"
                        placement="top"
                    >
                        <el-icon :size="20" color="red"    v-if="worker.stale"><CircleClose /></el-icon>
                        <el-icon :size="20" color="orange" v-else-if="worker.paused"><VideoPause /></el-icon>
                        <el-icon :size="20" color="orange" v-else-if="worker.maintenance_mode"><Warning /></el-icon>
                        <el-icon :size="20" color="green"  v-else><CircleCheck /></el-icon>
                    </el-tooltip>
                    <span style="margin-left: 0.5rem">{{worker.name}}</span>
                </div>
                <slot name="header"></slot>
            </div>
        </template>
        <div class="small-font">ID: {{worker.id}}</div>
        <div>This worker has run for <strong>{{secondsToDhm(worker.uptime)}}</strong></div>
        <div>They have generated <strong>{{worker.megapixelsteps_generated}}</strong> MPS</div>
        <div>They're going at a speed of <strong>{{worker.performance?.split(" ")[0]}}</strong> MPS/s</div>
        <div>They have fulfilled <strong>{{worker.requests_fulfilled}}</strong> requests</div>
        <div>They have maintenance mode set to <strong>{{worker.maintenance_mode}}</strong></div>
        <div>They have NSFW set to <strong>{{worker.nsfw}}</strong></div>
        <div>They support the models: <strong>{{worker.models.length === 0 ? "stable_diffusion" : ""}}</strong><strong v-for="model in worker.models?.length" :key="model">{{worker.models[model-1]}}{{model == worker.models.length ? "" : ", "}}</strong></div>
        <el-divider v-if="worker.info" style="margin: 10px 0" />
        <div class="small-font">{{worker.info}}</div>
    </el-card>
</template>

<style scoped>
    .card-header {
        display: flex;
        align-items: center;
        font-weight: 800;
    }

    .small-font {
        font-style: oblique;
        font-size: 12px;
    }

    .worker-box {
        width: 18vw;
        max-height: 100%;
    }

    @media only screen and (max-width: 1600px) {
        .worker-box {
            width: 25vw;
        }
    }

    @media only screen and (max-width: 1280px) {
        .worker-box {
            width: 30vw;
        }
    }

    @media only screen and (max-width: 1000px) {
        .worker-box {
            width: 100vw;
        }
    }
</style>