<script setup lang="ts">
defineProps<{
    href: string;
    router?: boolean;
}>();
</script>

<template>
    <a v-if="!router" target="_blank" rel="noreferrer noopener" :href="href"><slot /></a>
    <router-link v-if="router" :to="href"><slot /></router-link>
</template>

<style scoped>
a {
    color: var(--el-color-primary);
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}
</style>