<template>
  <mo-button @click="showToast">toast</mo-button>
  <mo-button @click="showToast2">toast2</mo-button>
  <mo-button @click="showLoading">loading</mo-button>
  <mo-button @click="getFeeb">getFeeb</mo-button>
  <mo-button @click="createAccount">createAccount</mo-button>
  <hr />
  <mo-card>
    <template #header>
      <div class="title">Tokens</div>
      <div class="ctrl">
        <i class="add"></i>
      </div>
    </template>
    12312323
  </mo-card>
</template>

<script>
import { sendMessageFromExtPageToBackground } from '@/util/chromeUtil';
import { mapGetters } from 'vuex';

export default {
  name: 'index.vue',
  computed: {
    ...mapGetters('account', ['currentAccount']),
  },
  methods: {
    showToast() {
      this.$toast({
        message: 'this is test',
      });
    },
    showToast2() {
      const toast = this.$toast({
        message: 'this is test',
        duration: 0,
      });

      setTimeout(() => {
        toast.close();
      }, 3000);
    },
    showLoading() {
      const loading = this.$loading({});
      setTimeout(() => {
        loading.close();
      }, 3000);
    },
    async getFeeb() {
      const { data } = await sendMessageFromExtPageToBackground('getFeeb', {
        wif: this.currentAccount.wif,
      });
      console.log(data);
    },
    async createAccount() {
      const { data: words } = await sendMessageFromExtPageToBackground('getMnemonicWords');
      const { data } = await sendMessageFromExtPageToBackground('createAccount', {
        mnemonicStr: words.join(' '),
        derivationPath: "m/44'/10001'/0'",
        alias: '123',
        password: '456',
        email: '789',
        phone: '000',
      });
      // const res = await sendMessageFromExtPageToBackground('checkOrCreateMetaId', data);
      console.log(res);
    },
  },
};
</script>

<style scoped></style>
