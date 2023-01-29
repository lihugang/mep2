<template>
    <div class="bottom-bar">
        <div class="copyleft-container">
            Copyleft <img src="../../public/assets/copyleft.png" class="copyleft" title="copyleft" /> 2022-2023 MEP,
            <a href="/gpl-3.0.pdf" title="See license" target="_blank">GPL V3 LICENSE</a>
            , Official
            Website At <a href="https://mep2.deta.dev" class="official-website-link">mep2.deta.dev</a>
        </div>

    </div>

</template>
<style>
.bottom-bar {
    position: fixed;
    bottom: 0%;
    left: 0%;
    width: 100%;
    height: 12px;
    font-size: 12px;
    text-align: center;
    opacity: 0.8;
}
</style>
<style scoped>
.copyleft-container {
    position: relative;
    bottom: 6px;
    user-select: none;
}

.copyleft {
    height: 12px;
    width: 12px;
}

a {
    cursor: pointer;
    text-decoration: none;
    color: black;
}

a:hover,
a:focus,
a:active,
a:visited {
    color: rgb(32, 32, 32);
}
</style>
