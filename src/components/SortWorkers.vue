<script setup lang="ts">
import { useWorkerStore } from '@/stores/workers';
import FormSelect from './FormSelect.vue';
import FormInput from './FormInput.vue';
import ButtonCycle from './ButtonCycle.vue';
import SortDown from './icons/SortDown.vue';
import SortUp from './icons/SortUp.vue';
const store = useWorkerStore();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
    mobile?: boolean;
}>();
</script>

<template>
    <div class="sort-workers">
        <form-input  label="Search"  prop="search" v-model="store.searchFilter" clearable :style="mobile ? 'margin-bottom: 0' : ''" />
        <form-select label="Sort By" prop="sortBy" v-model="store.sortBy" :options="store.sortOptions" />
        <ButtonCycle v-model="store.sortDirection" :options="[{value: 'Descending', icon: SortDown}, {value: 'Ascending', icon: SortUp}]" :dimensions="32" />
    </div>
</template>

<style scoped>
    .sort-workers {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
    }
</style>