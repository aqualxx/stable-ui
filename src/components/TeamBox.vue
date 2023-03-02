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
import type { TeamDetails } from '../types/stable_horde';
import { formatSeconds } from '@/utils/format';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    team: TeamDetails,
    top: boolean
}>();

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
        <div>This team has been online for <strong>{{formatSeconds(team.uptime, true, { days: true, hours: true, minutes: true })}}</strong></div>
        <div>They've fulfilled <strong>{{team.requests_fulfilled}}</strong> requests</div>
        <el-collapse style="margin-top: 0.5rem; --el-collapse-header-height: 2.5rem">
            <el-collapse-item :title="`${team.worker_count} worker(s)`" name="1">
                <div v-if="team.worker_count === 0">They have no workers.</div>
                <div v-else>
                    <div>They have {{team.worker_count}} worker(s):</div>
                    <ul class="remove-list-styling">
                        <li v-for="worker in team.workers" :key="worker.id">
                            <strong>
                                <el-icon :size="10" color="var(--el-color-success)" v-if="worker.online"><CircleFilled /></el-icon>
                                <el-icon :size="10" color="var(--el-color-danger)" v-else><CircleFilled /></el-icon>
                                <span style="margin-left: 5px">{{worker.name}}</span>
                            </strong>
                        </li>
                    </ul>
                </div>
            </el-collapse-item>
            <el-collapse-item :title="`${team.models?.length} model(s)`" name="2">
                <div v-if="team.models?.length === 0">They are hosting no models.</div>
                <div v-else>
                    <div>They are hosting the models:</div>
                    <ul class="remove-list-styling">
                        <li v-for="model in modelSorted" :key="model">
                            <strong>{{model.name}} ({{model.count}})</strong>
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

    .remove-list-styling {
        list-style-type: none;
        margin-top: 0;
    }

    .small-font {
        font-style: oblique;
        font-size: 12px;
    }

    .team-box {
        max-height: 100%;
    }
</style>