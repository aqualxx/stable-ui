<script setup lang="ts">
import {
    ElButton,
    ElDialog,
    ElDivider,
    ElEmpty
} from 'element-plus';

defineProps<{
    modelValue: boolean;
    list: any[];
    title: string;
    emptyDescription: string;
    useText: string;
    deleteText?: string;
    width?: string;
}>();

const emit = defineEmits<{
    (e: 'use', prompt: string): void;
    (e: 'delete', prompt: string): void;
    (e: 'update:modelValue', value: boolean): void;
}>();

function handleClose() {
    emit('update:modelValue', false);
}

function handleUse(item: string) {
    emit('use', item);
    handleClose();
}
</script>

<template>
    <el-dialog :model-value="modelValue" @close="handleClose" :title="title" :width="width || '30%'" style="min-width: 370px;" center>
        <slot name="top"></slot>
        <el-empty v-if="list.length === 0" :description="emptyDescription" />
        <div v-else>
            <ul style="list-style: none; padding: 0">
                <li v-for="item in list" :key="item" style="background-color: #171717; padding: 1rem; margin: 10px 0;">
                    <slot name="item" :item="item">{{item}}</slot>
                    <el-divider style="margin: 12px 0" />
                    <div style="display: flex; justify-content:space-between">
                        <el-button class="small-btn" @click="() => handleUse(item)">{{ useText }}</el-button>
                        <el-button class="small-btn" type="danger" @click="$emit('delete', item)" v-if="deleteText !== undefined">{{ deleteText }}</el-button>
                    </div>
                </li>
            </ul>
        </div>
    </el-dialog>
</template>