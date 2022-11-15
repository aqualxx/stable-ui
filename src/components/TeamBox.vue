<script setup lang="ts">
import {
    ElCard,
    ElDivider,
    ElIcon,
    ElCollapse,
    ElCollapseItem,
} from 'element-plus';
import { computed } from 'vue';
import CrownIcon from '../components/icons/CrownIcon.vue';
import CircleFilled from '../components/icons/CircleFilled.vue';
import type { TeamDetailsStable, WorkerDetailsLite } from '../types/stable_horde';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    team: TeamDetailsStable,
    top: boolean
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

const modelSorted = computed(() => [...props.team.models as any].sort((a, b) => b.count - a.count));
</script>

<template>
    <el-card class="team-box">
        <template #header>
            <div style="display: flex; justify-content:space-between">
                <div class="card-header">
                    <el-icon :size="20" color="var(--el-color-warning)" v-if="top" style="margin-right: 0.5rem"><CrownIcon /></el-icon>
                    <span>{{team.name}}</span>
                </div>
                <slot name="header"></slot>
            </div>
        </template>
        <div class="small-font">ID: {{team.id}}</div>
        <div>This team has been online for <strong>{{secondsToDhm(team.uptime)}}</strong></div>
        <div>They've generated <strong>{{team.contributions}}</strong> MPS</div>
        <div>They're going at a speed of <strong>{{team.speed}}</strong> MPS/s</div>
        <div>They've fulfilled <strong>{{team.requests_fulfilled}}</strong> requests</div>
        <el-collapse style="margin-top: 0.5rem">
            <el-collapse-item title="Workers" name="1">
                <div v-if="team.worker_count === 0">They have no workers.</div>
                <div v-else>
                    <div>They have {{team.worker_count}} worker(s):</div>
                    <ul style="list-style-type: none; margin-top: 0">
                        <li v-for="worker in team.workers?.length" :key="worker">
                            <strong>
                                <el-icon :size="10" color="var(--el-color-success)" v-if="(team.workers as WorkerDetailsLite[])[worker - 1].online"><CircleFilled /></el-icon>
                                <el-icon :size="10" color="var(--el-color-danger)" v-else><CircleFilled /></el-icon>
                                <span style="margin-left: 5px">{{(team.workers as WorkerDetailsLite[])[worker - 1].name}}</span>
                            </strong>
                        </li>
                    </ul>
                </div>
            </el-collapse-item>
            <el-collapse-item title="Models" name="2">
                <div v-if="team.models?.length === 0">They are hosting no models.</div>
                <div v-else>
                    <div>They are hosting the models:</div>
                    <ul style="list-style-type: none; margin-top: 0">
                        <li v-for="model in modelSorted?.length" :key="model">
                            <strong>{{modelSorted[model-1].name}} ({{modelSorted[model-1].count}})</strong>
                        </li>
                    </ul>
                </div>
            </el-collapse-item>
        </el-collapse>
        <el-divider v-if="team.info" style="margin: 10px 0" />
        <div class="small-font">{{team.info}}</div>
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

    .team-box {
        width: 18vw;
        max-height: 100%;
    }

    @media only screen and (max-width: 1600px) {
        .team-box {
            width: 25vw;
        }
    }

    @media only screen and (max-width: 1280px) {
        .team-box {
            width: 30vw;
        }
    }

    @media only screen and (max-width: 1000px) {
        .team-box {
            width: 100vw;
        }
    }
</style>