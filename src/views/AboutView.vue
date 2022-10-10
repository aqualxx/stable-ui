<template>
  <div class="about">
    <h1>What is Stable Horde?</h1>
    <div>Stable Horde is a <a href="https://github.com/db0/AI-Horde">crowdsourced distributed cluster</a> of <a href="https://github.com/db0/stable-diffusion-webui">Stable Diffusion workers</a>. If you like this service, consider <a href="https://github.com/db0/AI-Horde/blob/main/README_StableHorde.md">joining the horde yourself</a>!</div>
    <div>If you want prioritized generations, you may <a href="https://stablehorde.net/register">register</a> an account. This will give you an API that you can use to generate images on this site or others. Make sure to never share this key!</div>
    <div>if you do not want to register, you can use the "Anon?" button in the generation tab to set your API key to '0000000000' and connect anonymously. However anonymous accounts have the lowest priority when there's too many concurrent requests!</div>
    <div>To increase your priority you will need a unique API key and then to increase your Kudos. <a href="https://dbzer0.com/blog/the-kudos-based-economy-for-the-koboldai-horde/">Read how Kudos are working.</a></div>
    <div>You can also join its <a href="https://discord.gg/3DxrhksKzn">discord</a> or support its development on <a href="https://www.patreon.com/db0">Patreon</a> or <a href="https://github.com/db0">Github</a>.</div>
    <h1>What is this tool?</h1>
    <div>This tool was made to help the user's experience while generating images. I wanted to make sure that I could create the best experience when using Stable Diffusion by including a gallery that saves all of your pictures, and a tidy generation screen. All in one package.</div>
    <span>Special thanks to:</span>
    <ul style="margin-top:0">
        <li><a href="https://vuejs.org/">Vue</a></li>
        <li><a href="https://pinia.vuejs.org/">Pinia</a></li>
        <li><a href="https://element-plus.org/en-US/">Element Plus</a></li>
        <li>And the Stable Horde community!</li>
    </ul>
  </div>
</template>

<style scoped>
a {
    color: var(--el-color-primary)
}

.about {
    width: 60%;
}

@media only screen and (max-width: 1000px) {
    .about {
        width: 80%;
    }
}

@media only screen and (max-width: 700px) {
    .about {
        width: 100%;
    }
}
</style>
