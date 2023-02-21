<template>
  <div class="page-connect">
    <mo-card v-if="account">
      <div class="wrapper">
        <h1 class="mo-title">{{ $t('connect.allow') }}</h1>
        <p class="mo-text">{{ origin }}</p>
        <img src="/public/img/icon-arrowUpDown.svg" />
        <p class="mo-text">{{ account.name || account.address }}</p>
        <div class="btns">
          <mo-button simple @click="handleClose">{{ $t('cancel') }}</mo-button>
          <mo-button @click="handleSubmit">{{ $t('confirm') }}</mo-button>
        </div>
      </div>
    </mo-card>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { sendMessageFromExtPageToBackground } from '@/util/chromeUtil';
import i18n from '@/i18n';

export default {
  name: 'page-connect',
  computed: {
    ...mapGetters({
      account: 'account/currentAccount',
    }),
    origin() {
      return decodeURIComponent(this.$route.query.origin);
    },
    funcId() {
      return this.$route.query.funcId;
    },
    type() {
      return this.$route.query.type;
    },
    clientId() {
      return this.$route.query.clientId;
    },
    time() {
      return this.$route.query.time;
    },
    tabId() {
      return this.$route.query.tabId;
    },
    windowId() {
      return this.$route.query.windowId;
    },
  },
  data() {
    return {};
  },
  created() {},
  methods: {
    handleClose() {
      window.close();
    },
    async handleSubmit() {
      await sendMessageFromExtPageToBackground('connectWalletConfirm', {
        origin: this.origin,
        funcId: this.funcId,
        type: this.type,
        clientId: this.clientId,
        time: this.time,
        xprv: this.account.xprv,
        flag: true,
        tabId: this.tabId,
        windowId: this.windowId,
      });
      window.close();
    },
  },
};
</script>
<style src="./style.less" lang="less" scoped></style>
