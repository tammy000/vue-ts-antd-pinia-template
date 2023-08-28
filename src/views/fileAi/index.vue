<template>
  <a-config-provider
    :theme="{
      token: themeToken,
    }"
    >
    <div class="container">
      <fileAnalyse @file-view="getFileView"></fileAnalyse>
      <dialogue class="dialogue" :fileView="fileView"></dialogue>
    </div>
  </a-config-provider>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import fileAnalyse from './fileAnalyse.vue'
  import dialogue from './dialogue.vue'
  import { themeToken } from '@/utils/themeToken';

  const fileView = ref<string>('');
  const getFileView = (value) => {
    fileView.value = value
  }

</script>
<style lang="less" scoped>
  .container {
    padding: 20px;
    display: flex;
    height: 100%;
    box-sizing: border-box;
    border-radius: 8px;
  }
</style>
