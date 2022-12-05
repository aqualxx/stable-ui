<template>
  <div class="about">
    <div class="about-content">
        <h1 style="margin-top: 0">Stable UI</h1>
        <div>This tool provides a front-end for generating free Stable Diffusion images without needing any special hardware. While Stable UI was originally created as a way to explore web APIs and <a target="_blank" rel="noreferrer" href="https://vuejs.org/">Vue</a>, it has since evolved into a tool that allows users to easily access Stable Diffusion to create fascinating images!</div><br>
        <div>If you want to help improve this tool, you can find the source code on <a target="_blank" rel="noreferrer" href="https://github.com/aqualxx/stable-ui">GitHub</a>. Feel free to contribute! Message me on Discord (aqualxx#5004) or through the <a target="_blank" rel="noreferrer" href="https://discord.com/channels/781145214752129095/1033312325668708393">Stable-UI Suggestions</a> thread if you have any problems or questions. Generate some images and enjoy using this tool!</div>
        <div class="faq">
            <h2>FAQ</h2>
            <h3>What is Stable Horde?</h3>
            <span>Stable Horde is an open source project that allows anyone to use Stable Diffusion - for free! For those who want the specifics, it's powered by a <a target="_blank" rel="noreferrer" href="https://github.com/db0/AI-Horde">crowdsourced distributed cluster</a> of <a target="_blank" rel="noreferrer" href="https://github.com/Sygil-Dev/nataili">Stable Diffusion workers</a>. Consider <a target="_blank" rel="noreferrer" href="https://github.com/db0/AI-Horde/blob/main/README_StableHorde.md">joining the horde yourself</a>! You can join the Stable Horde <a target="_blank" rel="noreferrer" href="https://discord.gg/3DxrhksKzn">discord server</a> or support its development on <a target="_blank" rel="noreferrer" href="https://www.patreon.com/db0">Patreon</a> or <a target="_blank" rel="noreferrer" href="https://github.com/db0">Github</a>.</span>
            <h3>How do I increase my generation speed?</h3>
            <span>If you want prioritized generations, you may <a target="_blank" rel="noreferrer" href="https://stablehorde.net/register">register</a> an account. This will give an API key that can be used to generate images on this site or others. Make sure to never share this key! Anonymous/non-registered users have the lowest priority in the queue, resulting in slower generation times. Your API key is set to connect anonymously by default; you can change this behaviour through the settings tab. To increase your priority futher, try increasing your Kudos by setting up a worker or by contributing and being gifted by the kind fellows in the discord server.</span>
            <h3>Why has my IP address been put in timeout?</h3>
            <span>This error occurs when your prompt has been flagged as unethical - it's to protect the Horde from the worst of the worst. To fix this error, try changing or removing words from your prompt that could be deemed as such.</span>
        </div>
        <h2>Helpful Resources</h2>
        <ul>
            <li><a target="_blank" rel="noreferrer" href="https://lexica.art/">Lexica.art</a> - A prompt search engine</li>
            <li><a target="_blank" rel="noreferrer" href="https://publicprompts.art/">Public Prompts</a> - A collection of prompts for creating unique styles</li>
            <li><a target="_blank" rel="noreferrer" href="https://openart.ai/promptbook">Promptbook</a> - A generalized prompting guide</li>
            <li><a target="_blank" rel="noreferrer" href="https://promptomania.com/stable-diffusion-prompt-builder/">Prompt Mania</a> - A Stable Diffusion prompt builder</li>
        </ul>
    </div>
  </div>
</template>

<style scoped>
a {
    color: var(--el-color-primary);
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

h3, h1 {
    margin-bottom: 0;
}

.about {
    width: 100%;
    font-size: 1.1rem;
    display: flex;
    justify-content: center;
}

.about-content {
    width: 60%
}

.faq {
    font-size: 1.05rem
}

@media only screen and (max-width: 1000px) {
    .about-content {
        width: 80%;
    }
}

@media only screen and (max-width: 700px) {
    .about-content {
        width: 100%;
    }
}
</style>
