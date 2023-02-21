<template>
  <div class="page-edit">
    <mo-card>
      <p class="mo-text">{{ $t('account.desc_6') }}</p>
    </mo-card>
    <mo-card>
      <h2 class="mo-sub-title">{{ $t('account.mnemonic') }}:</h2>
      <p class="mo-text">{{ $t('account.desc_2') }}</p>
      <div class="word-list">
        <template v-for="(word, index) in mnemonicWords" :key="index">
          <span class="word">{{ word }}</span>
        </template>
      </div>
    </mo-card>
    <mo-card>
      <h2 class="mo-sub-title">{{ $t('account.otherInfo') }}:</h2>
      <mo-form>
        <mo-form-item :label="$t('account.derivationPath')">
          <mo-input disabled="disabled" v-model="derivationPath" />
        </mo-form-item>
        <mo-form-item :label="$t('account.address')">
          <mo-input disabled="disabled" v-model="address" />
        </mo-form-item>
        <mo-form-item :label="$t('account.publicKey')">
          <mo-input disabled="disabled" v-model="publicKey" />
        </mo-form-item>
        <!--        <mo-form-item :label="$t('account.HDPrivateKey')">-->
        <!--          <mo-input disabled="disabled" v-model="xprv" />-->
        <!--        </mo-form-item>-->
        <!--        <mo-form-item :label="$t('account.xpub')">-->
        <!--          <mo-input disabled="disabled" v-model="xpub" />-->
        <!--        </mo-form-item>-->
        <!--        <mo-form-item :label="$t('account.wif')">-->
        <!--          <mo-input disabled="disabled" v-model="wif" />-->
        <!--        </mo-form-item>-->
        <mo-form-item :label="$t('account.password')">
          <mo-input type="password" :placeholder="$t('pleaseInput') + $t('optional')" v-model="password" />
        </mo-form-item>
        <mo-form-item :label="$t('account.alias')">
          <mo-input :placeholder="$t('pleaseInput') + $t('optional')" v-model="alias" />
        </mo-form-item>
        <mo-form-item :label="$t('account.email')">
          <mo-input :placeholder="$t('pleaseInput') + $t('optional')" v-model="email" />
        </mo-form-item>
        <mo-form-item :label="$t('account.phone')">
          <mo-input :placeholder="$t('pleaseInput') + $t('optional')" v-model="phone" />
        </mo-form-item>
        <mo-form-item submitItem style="text-align: center">
          <mo-button @click="updateAccount">{{ $t('account.update') }}</mo-button>
        </mo-form-item>
      </mo-form>
    </mo-card>
    <mo-card>
      <h2 class="mo-sub-title">{{ $t('account.configurations') }}:</h2>
      <mo-form>
        <mo-form-item :label="$t('account.feeb')">
          <mo-input v-model="feeb" type="number" min="0.2" max="1" step="0.1" />
        </mo-form-item>
        <mo-form-item submitItem style="text-align: center">
          <mo-button @click="updateFeeb">{{ $t('account.update') }}</mo-button>
        </mo-form-item>
      </mo-form>
    </mo-card>
  </div>
</template>
<script>
import i18n from '@/i18n';
import { mapActions, mapGetters } from 'vuex';
import { sendMessageFromExtPageToBackground } from '@/util/chromeUtil';

export default {
  name: 'page-edit',
  data() {
    return {
      mnemonicWords: [],
      mnemonicStr: '',
      xprv: '',
      derivationPath: "m/44'/10001'/0'",
      password: '',
      alias: '',
      email: '',
      phone: '',
      address: '',
      xpub: '',
      feeb: 0,
      publicKey: '',
    };
  },
  computed: {
    ...mapGetters('account', ['currentAccount']),
  },
  created() {
    this.initData();
  },
  methods: {
    ...mapActions('account', ['setCurrentAccount']),
    async initData() {
      if (!this.currentAccount || !this.currentAccount.wif) {
        this.$toast({ message: i18n('error.noAccount') });
        setTimeout(() => {
          this.$router.replace({
            path: '/welcome',
          });
        }, 1000);
        return;
      }
      this.mnemonicStr = this.currentAccount.mnemonicStr;
      this.mnemonicWords = this.currentAccount.mnemonicStr.split(' ');
      this.xprv = this.currentAccount.xprv;
      this.password = this.currentAccount.password;
      this.alias = this.currentAccount.alias;
      this.address = this.currentAccount.address;
      this.email = this.currentAccount.email;
      this.phone = this.currentAccount.phone;
      this.publicKey = this.currentAccount.publicKey;

      const { data } = await sendMessageFromExtPageToBackground('getFeeb');
      this.feeb = data;
    },
    async updateAccount() {
      await sendMessageFromExtPageToBackground('updateAccount', {
        xprv: this.xprv,
        password: this.password,
        alias: this.alias,
        email: this.email,
        phone: this.phone,
      });
      this.$toast({
        message: i18n('success'),
      });
    },
    async updateFeeb() {
      await sendMessageFromExtPageToBackground('updateFeeb', {
        feeb: this.feeb,
      });
      this.$toast({
        message: i18n('success'),
      });
    },
  },
};
</script>
<style lang="less" scoped>
.page-edit {
  box-sizing: border-box;
  padding: 36px;

  p {
    margin-top: 20px;

    &:first-child {
      margin-top: 0;
    }
  }

  .word-list {
    margin-top: 20px;
    font-size: 0;

    .word {
      display: inline-block;
      font-size: 28px;
      padding: 8px 18px;
      //background-color: var(--primary-color);
      color: var(--primary-color);
      border: 1px solid var(--primary-color);
      border-radius: 46px;
      margin: 0 20px 20px 0;
    }
  }

  .mo-form {
    margin-top: 20px;
  }

  .mo-radio-group {
    margin-top: 20px;
  }
}
</style>
