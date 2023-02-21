<template>
  <div class="layout">
    <div class="head-bar">
      <router-link to="/" class="logo">
        <img :src="appLogo" v-if="appLogo" />
        <span>{{ appName }}</span>
        <i>{{ networkType }}net</i>
      </router-link>
      <div class="more" @click="handleOpenPicker">
        <img src="/public/img/icon-more.svg" />
      </div>
    </div>
    <div class="main-content">
      <router-view></router-view>
    </div>
  </div>

  <mo-picker v-model="showPicker" :list="pickerList" @onItemClick="handlePickerItemClick"></mo-picker>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import i18n from '@/i18n';
import { sendMessageFromExtPageToBackground } from '@/util/chromeUtil';

export default {
  name: 'layout',
  computed: {
    ...mapGetters('system', ['config', 'locale', 'networkType']),
    ...mapGetters('user', ['user']),
    appLogo() {
      return this.config?.CONFIG_APP_LOGO || '';
    },
    appName() {
      return this.config?.CONFIG_APP_NAME || '';
    },
    version() {
      return this.config?.version || '';
    },
  },
  data() {
    return {
      showPicker: false,
      pickerList: [
        { label: i18n('menu.editAccount'), name: 'editAccount' },
        // {
        //   label: () =>
        //     `${i18n('menu.changeNetwork')}: ${this.networkType + 'net'} -> ${
        //       this.networkType === 'main' ? 'testnet' : 'mainnet'
        //     }`,
        //   name: 'changeNetwork',
        // },
        { label: i18n('menu.changeLang'), name: 'changeLang' },
        { label: i18n('menu.logout'), name: 'logout' },
      ],
    };
  },
  methods: {
    ...mapActions({
      setSession: 'system/setSession',
      setLocale: 'system/setLocale',
      removeCurrentAccount: 'account/removeCurrentAccount',
    }),
    handleOpenPicker() {
      this.showPicker = true;
    },
    async handlePickerItemClick(item) {
      switch (item.name) {
        case 'editAccount': {
          this.$router.push({
            path: '/edit',
          });
          break;
        }
        case 'logout': {
          this.removeCurrentAccount();
          this.$router.push({
            path: '/welcome',
          });
          break;
        }
        case 'changeLang': {
          this.setLocale(this.locale === 'en' ? 'zh' : 'en');
          window.location.reload(true);
          break;
        }
        case 'changeNetwork': {
          const targetNetworkType = this.networkType === 'main' ? 'test' : 'main';
          // if (targetNetworkType === 'main') {
          //   return this.$toast({ message: i18n('functionWillComingSoon') });
          // }
          await sendMessageFromExtPageToBackground('changeNetwork', {
            networkType: targetNetworkType,
          });
          window.location.reload(true);
          break;
        }
      }
    },
  },
};
</script>
<style lang="less" scoped>
.layout {
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  .head-bar {
    width: 100%;
    height: 80px;
    background: var(--background-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    color: #fff;
    padding: 0 20px;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;

    .logo {
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      transition: var(--transition);
      &:hover {
        opacity: 0.8;
      }

      img {
        display: block;
        height: 50px;
        width: auto;
        margin-right: 10px;
      }

      span {
        color: var(--primary-text-color);
        font-size: 32px;
        font-weight: bold;
        font-family: 'Inter Black';
      }

      i {
        margin-left: 16px;
        font-size: 24px;
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
        padding: 2px 6px;
        border-radius: 8px;
      }
    }

    .more {
      width: 50px;
      height: 50px;
      cursor: pointer;
      transition: var(--transition);
      &:hover {
        opacity: 0.8;
      }
      img {
        display: block;
        width: auto;
        height: 100%;
      }
    }
  }

  .main-content {
    box-sizing: border-box;
    margin: 80px 0 0 0;
    position: relative;
    overflow: auto;
    padding-bottom: 60px;
  }
}
</style>
