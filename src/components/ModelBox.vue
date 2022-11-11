<script setup lang="ts">
import {
    ElDivider,
    ElCard,
    ElIcon,
    ElTooltip
} from 'element-plus';
import {
    CircleCheck,
    CircleClose,
    VideoPause
} from "@element-plus/icons-vue";
import { computed } from 'vue';
import type { IModelData } from '@/stores/generator';
const props = defineProps<{
    model: IModelData;
}>();

const status = computed(() => {
    if (props.model.count === 0) {
        return "Offline";
    }
    if (props.model.queued === 0) {
        return "Standby";
    }
    return "Online";
})

</script>

<template>
    <el-card class="model-box">
        <template #header>
            <div style="display: flex; justify-content:space-between">
                <div class="card-header">
                    <el-tooltip
                        :content="status"
                        placement="top"
                    >
                        <el-icon :size="20" color="red"    v-if="model.count === 0"><CircleClose /></el-icon>
                        <el-icon :size="20" color="orange" v-else-if="model.queued === 0"><VideoPause /></el-icon>
                        <el-icon :size="20" color="green"  v-else><CircleCheck /></el-icon>
                    </el-tooltip>
                    <span style="margin-left: 0.5rem">{{model.name}}</span>
                </div>
                <slot name="header"></slot>
            </div>
        </template>
        <div>There are <strong>{{model.count}}</strong> workers running this model</div>
        <div>There are <strong>{{Math.floor(model.queued / 10_000) / 100}}</strong> MPS queued</div>
        <div>The average model speed is <strong>{{Math.floor(model.performance / 10_000) / 100}}</strong> MPS/s</div>
        <div>It is expected to take <strong>{{model.eta}}s</strong> to clear this queue</div>
        <div></div>
        <div>The style of this model is <strong>{{model.style}}</strong></div>
        <div v-if="model.nsfw">This model may produce NSFW images.</div>
        <el-divider v-if="model.description" style="margin: 10px 0" />
        <div class="small-font">{{model.description}}</div>
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

    .model-box {
        width: 18vw;
        max-height: 100%;
    }

    @media only screen and (max-width: 1600px) {
        .model-box {
            width: 25vw;
        }
    }

    @media only screen and (max-width: 1280px) {
        .model-box {
            width: 30vw;
        }
    }

    @media only screen and (max-width: 1000px) {
        .model-box {
            width: 100vw;
        }
    }
</style>