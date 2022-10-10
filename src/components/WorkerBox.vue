<script setup lang="ts">
import {
    ElCard,
    ElDivider
} from 'element-plus';
import type { WorkerKudosDetails } from '@/types/stable_horde';

defineProps<{
    max_pixels: number;
    megapixelsteps_generated: number;
    /** The Name given to this worker. */
    name: string;

    /** The UUID of this worker. */
    id: string;

    /** How many images this worker has generated. */
    requests_fulfilled: number;

    /** How many Kudos this worker has been rewarded in total. */
    kudos_rewards: number;
    kudos_details: WorkerKudosDetails;

    /** The average performance of this worker in human readable form. */
    performance: string;

    /** The amount of seconds this worker has been online for this Horde. */
    uptime: number;

    /**
     * When True, this worker will not pick up any new requests
     * @example false
     */
    maintenance_mode: boolean;

    /**
     * When True, this worker not be given any new requests.
     * @example false
     */
    paused?: boolean;

    /**
     * Extra information or comments about this worker provided by its owner.
     * @example https://dbzer0.com
     */
    info?: string;

    /**
     * Whether this server can generate NSFW requests or not.
     * @example https://dbzer0.com
     */
    nsfw: boolean;
}>();

function secondsToDhm(seconds: number | string) {
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

</script>

<template>
    <el-card class="worker-box">
        <template #header>
            <div class="card-header">
                <span>{{name}}</span>
            </div>
        </template>
        <div>This worker has run for <b>{{secondsToDhm(uptime)}}</b></div>
        <div>They have generated <b>{{megapixelsteps_generated}}</b> MPS</div>
        <div>They're going at a speed of <b>{{performance.split(" ")[0]}}</b> MPS/s</div>
        <div>They have fulfilled <b>{{requests_fulfilled}}</b> requests</div>
        <el-divider v-if="info" style="margin: 10px 0" />
        <div class="small-font">{{info}}</div>
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

    @media only screen and (max-width: 1000px) {
        .worker-box {
            width: 100vw;
        }
    }
</style>