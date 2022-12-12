<script setup lang="ts">
defineProps<{
    href: string;
}>();
</script>

<template>
    <a target="_blank" rel="noreferrer noopener" :href="href"><slot /></a>
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