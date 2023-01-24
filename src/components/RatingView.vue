<script setup lang="ts">
import {
    ElButton,
    vLoading,
    ElRate,
    ElImage
} from 'element-plus';
import BaseLink from '../components/BaseLink.vue';
import { useOptionsStore } from '@/stores/options';
import { useRatingStore } from '@/stores/rating';
import { ref } from 'vue';

const optionsStore = useOptionsStore();
const ratingStore = useRatingStore();

const showImage = ref(false);
</script>

<template>
    <h1 style="margin: 0">Image Rating</h1>
    <div>Rate images based on aesthetics to gain kudos and help <BaseLink href="https://laion.ai/">LAION</BaseLink> - the non-profit who helped train Stable Diffusion - improve their datasets!</div>
    <div v-if="optionsStore.apiKey === '0000000000' || optionsStore.apiKey === ''">You have rated a total of <strong>{{ ratingStore.imagesRated }}</strong> images! <BaseLink router href="/options">Sign in</BaseLink> using your API key to start earning kudos.</div>
    <div v-else>From rating a total of <strong>{{ ratingStore.imagesRated }}</strong> images, you have gained <strong>{{ ratingStore.kudosEarned }}</strong> kudos!</div>
    <el-button
        @click="() => ratingStore.getNewRating()"
        v-if="!ratingStore.currentRatingInfo.id"
        :disabled="ratingStore.submitted"
        style="margin-top: 10px"
        size="large"
    >{{ ratingStore.submitted ? "Loading image..." : "Start rating!"}}</el-button>
    <div v-if="ratingStore.currentRatingInfo.id" class="rate">
        <el-image v-show="showImage" @load="() => showImage = true" :src="ratingStore.currentRatingInfo.url" class="rate-image" />
        <div v-show="!showImage" v-loading="true" style="width: 512px; height: 512px" />
        <div>
            <div>How would you rate this image from 1 - 10?</div>
            <el-rate :max="10" v-model="ratingStore.currentRating.rating" />
        </div>
        <div>
            <div>How would you describe the flaws in this image? ({{ ratingStore.rating[ratingStore.currentRating.artifacts || 1] }})</div>
            <el-rate :max="6" v-model="ratingStore.currentRating.artifacts" />
        </div>
        <div><el-button style="height: 50px; width: 200px" @click="() => {
            ratingStore.sumbitRating();
            showImage = false;
        }" :disabled="ratingStore.submitted">Submit rating</el-button></div>
    </div>
</template>

<style scoped>
.rate {
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding-bottom: 50px;
}

:deep(.el-rate__icon) {
    font-size: 28px !important;
}

:deep(.el-image__inner) {
    object-fit: contain;
    width: 100%;
    max-width: 80vh;
    height: auto;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

:deep(.el-image__wrapper) {
    text-align:center;
}
</style>