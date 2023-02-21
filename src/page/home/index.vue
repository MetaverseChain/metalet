<template>
  <div class="page-home">
    <template v-if="account">
      <div class="mo-card money-card">
        <img class="refresh" src="/public/img/icon-refresh.svg" @click="fetchData" />

        <div class="space">
          <span>{{ $filter.satoshisToSpace(balance) }}</span>
          <span class="unit">SPACE</span>
        </div>
        <!--        <div class="lcy">-->
        <!--          <span>{{ $filter.satoshisToLcy(balance, rate) }}</span>-->
        <!--          <span class="unit">{{ rateUnit }}</span>-->
        <!--        </div>-->
        <div class="address">
          <div class="mo-text txt-hide">{{ account.address }}</div>
          <img class="btn" :data-clipboard-text="account.address" src="/public/img/icon-copy.svg" ref="outsideBtn" />
        </div>
      </div>
    </template>
    <mo-tab around v-model="curTab" :list="tabList" />
    <!-- tab1 - wallet -->
    <template v-if="curTab === 0">
      <div class="action-card">
        <mo-card class="card-item" @click="handleOpenReceiveDialog">
          <div class="one-raw">
            <img src="/public/img/icon-qrcode.svg" />
            <span>{{ $t('home.receive') }}</span>
          </div>
        </mo-card>
        <mo-card class="card-item" @click="handleOpenSendDialog">
          <div class="one-raw">
            <img src="/public/img/icon-transfer.svg" />
            <span>{{ $t('home.send') }}</span>
          </div>
        </mo-card>
        <mo-card class="card-item" @click="handleOpenHistory">
          <div class="one-raw">
            <img src="/public/img/icon-history.svg" />
            <span>{{ $t('home.history') }}</span>
          </div>
        </mo-card>
      </div>
    </template>
    <!-- tab1 - token -->
    <template v-if="curTab === 1">
      <div class="action-card">
        <div class="list">
          <template v-if="ftInfoList.length">
            <template v-for="(item, index) in ftInfoList" :key="index">
              <mo-card class="card-item" @click="handleOpenTransferTokenDialog(item, 'Token')">
                <div class="info-row">
                  <div class="head">
                    <img :src="item.logo" v-if="item && item.logo" />
                    <i v-else>{{ (item && item.name && item.name[0]) || 'T' }}</i>
                  </div>
                  <div class="info">
                    <div class="name txt-hide">{{ item.name }}</div>
                  </div>
                  <div class="num">{{ item.amount }}</div>
                  <div class="ctrl">
                    <i class="icon transfer"></i>
                  </div>
                </div>
              </mo-card>
            </template>
          </template>
          <template v-else>
            <mo-empty />
          </template>
        </div>
      </div>
    </template>
    <!-- tab1 - nft -->
    <template v-if="curTab === 2">
      <div class="action-card">
        <template v-if="nftInfoList.length">
          <div class="list">
            <template v-for="(item, index) in nftInfoList" :key="index">
              <mo-card class="card-item" @click="handleOpenTransferTokenDialog(item, 'NFT')">
                <div class="info-row">
                  <div class="head">
                    <img :src="item.logo" v-if="item && item.logo" />
                    <i v-else>{{ (item && item.genesis && item.genesis[0]) || 'N' }}</i>
                  </div>
                  <div class="info">
                    <div class="name txt-hide">{{ item.genesis }}</div>
                    <!--<div class="name txt-hide">{{ item.codeHash }}</div>-->
                  </div>
                  <div class="num">{{ item.count }}/{{ item.tokenSupply }}</div>
                  <div class="ctrl">
                    <i class="icon transfer"></i>
                  </div>
                </div>
              </mo-card>
            </template>
          </div>
        </template>
        <template v-else>
          <mo-empty />
        </template>
      </div>
    </template>
  </div>

  <!-- 接收弹窗 -->
  <mo-dialog v-model="showReceiveDialog" class="page-dialog">
    <h1 class="mo-sub-title">{{ $t('home.receiveDialogTitle') }}</h1>
    <img :src="qrcodeUrl" class="qrcode" />
    <div class="address">
      <div class="mo-text txt-hide">{{ account.address }}</div>
      <img src="/public/img/icon-copy.svg" @click.stop="clickOutsideClipboardBtn" />
    </div>
  </mo-dialog>

  <!-- 发送弹窗 -->
  <mo-dialog class="page-dialog" v-model="showSendDialog" @onClose="handleCloseSendDialog">
    <h1 class="mo-sub-title">{{ $t('home.sendDialogTitle') }}</h1>
    <mo-form>
      <mo-form-item :label="$t('home.sendAddress')">
        <mo-input
          v-model="sendAddress"
          :placeholder="$t('pleaseInput')"
          @input="handleAmountInput"
          @change="handleAmountInput"
        />
      </mo-form-item>
      <mo-form-item :label="$t('home.sendAmount')">
        <mo-input
          type="number"
          v-model="sendAmount"
          :placeholder="$t('pleaseInput') + ' ' + $t('home.unit')"
          :min="2000"
          @input="handleAmountInput"
          @change="handleAmountInput"
        />
      </mo-form-item>
      <hr class="mo-divider" />
      <mo-form-item inline :label="$t('home.yourBalance')">
        <div class="txt-hide mo-text dark">{{ $filter.satoshisToSpace(balance) }} SPACE</div>
      </mo-form-item>
      <mo-form-item inline :label="$t('home.fee')">
        <div class="txt-hide mo-text dark">{{ $filter.satoshisToSpace(fee) }} SPACE</div>
      </mo-form-item>
      <!--      <mo-form-item inline :label="$t('home.total')">-->
      <!--        <div class="txt-hide mo-text dark">{{ $filter.satoshisToSpace(sendAmount + fee) }} SPACE</div>-->
      <!--      </mo-form-item>-->
      <mo-form-item submitItem style="text-align: center">
        <mo-button simple @click="handleCloseSendDialog">{{ $t('cancel') }}</mo-button>
        <mo-button @click="handleSubmitSend">{{ $t('submit') }}</mo-button>
      </mo-form-item>
    </mo-form>
  </mo-dialog>

  <!-- 增加ft或nft -->
  <!--  <mo-dialog v-model="showTokenDialog" class="page-dialog">-->
  <!--    <h1 class="mo-sub-title">{{ $t('home.addTokenInfo') }}</h1>-->
  <!--    <mo-form>-->
  <!--      <mo-form-item :label="$t('home.genesis')">-->
  <!--        <mo-input :placeholder="$t('pleaseInput')" />-->
  <!--      </mo-form-item>-->
  <!--      <mo-form-item :label="$t('home.codehash')">-->
  <!--        <mo-input :placeholder="$t('pleaseInput')" />-->
  <!--      </mo-form-item>-->
  <!--      <mo-form-item submitItem style="text-align: center">-->
  <!--        <mo-button simple @click="handleCloseTokenDialog">{{ $t('cancel') }}</mo-button>-->
  <!--        <mo-button @click="handleSubmitTokenAdd">{{ $t('submit') }}</mo-button>-->
  <!--      </mo-form-item>-->
  <!--    </mo-form>-->
  <!--  </mo-dialog>-->

  <!-- 转发ft或nft -->
  <mo-dialog v-model="showTransferTokenDialog" class="page-dialog">
    <h1 class="mo-sub-title">{{ $t('home.sendDialogTitle') }} ({{ tokenDialogType }})</h1>
    <mo-form>
      <mo-form-item :label="$t('home.sendAddress')">
        <mo-input :placeholder="$t('pleaseInput')" v-model="transferAddress" />
      </mo-form-item>
      <mo-form-item :label="$t('home.sendAmount')" v-if="tokenDialogType === 'Token'">
        <mo-input :placeholder="$t('pleaseInput')" v-model="transferAmount" />
      </mo-form-item>
      <mo-form-item submitItem style="text-align: center">
        <mo-button simple @click="handleCloseTransferTokenDialog">{{ $t('cancel') }}</mo-button>
        <mo-button @click="handleSubmitTransferToken">{{ $t('submit') }}</mo-button>
      </mo-form-item>
    </mo-form>
  </mo-dialog>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { createQrCode, spaceTosatoshis } from '@/util';
import { sendMessageFromExtPageToBackground } from '@/util/chromeUtil';
import { getExchangeRate, getFtBalance } from '@/api/common';
import ClipboardJS from 'clipboard';
import i18n from '@/i18n';
import { Decimal } from 'decimal.js';
export default {
  name: 'page-home',
  computed: {
    ...mapGetters({
      account: 'account/currentAccount',
      locale: 'system/locale',
      ftList: 'token/ftList',
      nftList: 'token/nftList',
    }),
    rateUnit() {
      return this.locale === 'en' ? 'USD' : 'CNY';
    },
  },
  data() {
    return {
      balance: 0,
      rate: 0,
      sendAddress: '',
      sendAmount: undefined,
      qrcodeUrl: '',
      showReceiveDialog: false,
      showSendDialog: false,
      showTokenDialog: false,
      clipboard: undefined,
      tabList: [
        { label: i18n('home.wallet'), name: 0 },
        { label: i18n('home.token'), name: 1 },
        { label: i18n('home.nft'), name: 2 },
      ],
      curTab: 0,
      inputAmountTimer: undefined,
      fee: 0,
      unspents: [],
      tokenGenesis: '',
      tokenCodehash: '',
      tokenDialogType: '',
      ftInfoList: [],
      nftInfoList: [],
      showTransferTokenDialog: false,
      transferAddress: '',
      transferAmount: '',
      transferItem: {},
    };
  },
  beforeUnmount() {
    this.clipboard.destroy();
  },
  mounted() {
    this.fetchData();
    this.drawQrCode();
    this.initClipboard();
  },
  methods: {
    ...mapActions('token', ['addFt', 'addNft', 'removeFt', 'removeNft']),
    initClipboard() {
      this.clipboard = new ClipboardJS('.btn');

      this.clipboard.on('success', (e) => {
        this.$toast({ message: i18n('copy') + ' ' + i18n('success') });
      });

      this.clipboard.on('error', (e) => {
        this.$toast({ message: i18n('copy') + ' ' + i18n('fail') });
      });
    },
    async fetchData() {
      const loading = this.$loading();
      // await this.getExchangeRate();
      await this.getBalance();
      await this.fetchTokenInfo();
      loading.close();
    },
    async getBalance() {
      const { data } = await sendMessageFromExtPageToBackground('getBalance', {
        address: this.account.address,
        xpub: this.account.xpub,
      });
      this.balance = data;
    },
    async getExchangeRate() {
      const { data } = await getExchangeRate();
      const { cnyRate, usdtRate } = data;
      if (this.locale === 'en') {
        this.rate = usdtRate;
      } else {
        this.rate = cnyRate;
      }
    },
    async drawQrCode() {
      if (this.account.address) {
        this.qrcodeUrl = await createQrCode(this.account.address);
      }
    },
    handleOpenReceiveDialog() {
      this.showReceiveDialog = true;
    },
    clickOutsideClipboardBtn() {
      this.$refs.outsideBtn.click();
    },
    handleOpenHistory() {
      window.open(`https://mvcscan.com/address/${this.account.address}`);
    },
    async handleOpenSendDialog() {
      this.showSendDialog = true;
      const { data } = await sendMessageFromExtPageToBackground('getUnspents', {
        address: this.account.address,
      });
      this.unspents = data;
    },
    handleCloseSendDialog() {
      this.showSendDialog = false;
      this.sendAddress = '';
      this.sendAmount = undefined;
    },
    async handleSubmitSend() {
      if (!this.sendAddress) {
        return this.$toast({ message: i18n('home.pleaseInputAddress') });
      }
      if (!this.sendAmount) {
        return this.$toast({ message: i18n('home.pleaseInputAmount') });
      }
      const satoshi = spaceTosatoshis(+this.sendAmount).toNumber();
      if (satoshi < 2000) {
        return this.$toast({ message: i18n('home.amountMoreThan2000') });
      }
      if (
        new Decimal(satoshi).add(new Decimal(this.fee).toNumber()).toNumber() >= new Decimal(this.balance).toNumber()
      ) {
        return this.$toast({ message: i18n('home.amountNotEnough') });
      }
      // const { data } = await sendMessageFromExtPageToBackground('sendAmount', {
      //   wif: this.account.wif,
      //   sendAddress: this.sendAddress,
      //   sendAmount: satoshi,
      //   address: this.account.address,
      // });
      // this.$toast({ message: i18n('home.paySuccess') });
      // this.handleCloseSendDialog();
      // await this.fetchData();
      this.$router.push({
        path: '/order',
        query: {
          type: 'send',
          sendAddress: this.sendAddress,
          sendAmount: satoshi,
          fee: this.fee,
        },
      });
    },
    handleAmountInput(e) {
      clearTimeout(this.inputAmountTimer);
      this.inputAmountTimer = setTimeout(async () => {
        if (+this.sendAmount > 0 && this.sendAddress) {
          const { data } = await sendMessageFromExtPageToBackground('countFee', {
            address: this.account.address,
            sendAmount: this.sendAmount,
            sendAddress: this.sendAddress,
            wif: this.account.wif,
            unspents: this.unspents,
          });
          this.fee = data;
        }
      }, 1000);
    },
    // 增加自定义的,暂时忽略
    // handleOpenTokenDialog(type) {
    //   this.showTokenDialog = true;
    //   this.tokenDialogType = type;
    // },
    // handleCloseTokenDialog() {
    //   this.showTokenDialog = false;
    //   this.tokenGenesis = '';
    //   this.tokenCodehash = '';
    // },
    // handleSubmitTokenAdd() {
    //   if (this.tokenDialogType === 'ft') {
    //     this.addFt({
    //       codehash: this.tokenCodehash,
    //       genesis: this.tokenGenesis,
    //     });
    //   } else if (this.tokenDialogType === 'nft') {
    //     this.addNft({
    //       codehash: this.tokenCodehash,
    //       genesis: this.tokenGenesis,
    //     });
    //   }
    //   this.handleCloseTokenDialog();
    // },
    async fetchTokenInfo() {
      sendMessageFromExtPageToBackground('getFtList', {
        address: this.account.address,
        ftList: this.ftList,
      }).then(({ data }) => {
        this.ftInfoList = data || [];
      });

      sendMessageFromExtPageToBackground('getNftList', {
        address: this.account.address,
        nftList: this.nftList,
      }).then(({ data }) => {
        this.nftInfoList = data || [];
      });
    },
    handleOpenTransferTokenDialog(item, type) {
      this.tokenDialogType = type;
      this.showTransferTokenDialog = true;
      this.transferAddress = '';
      this.transferAmount = '';
      this.transferItem = item;
    },
    handleCloseTransferTokenDialog() {
      this.showTransferTokenDialog = false;
      this.transferAddress = '';
      this.transferAmount = '';
    },
    async handleSubmitTransferToken() {
      if (!this.transferAddress) {
        return this.$toast({ message: i18n('home.pleaseInputAddress') });
      }
      if (this.tokenDialogType === 'Token' && !this.transferAmount) {
        return this.$toast({ message: i18n('home.pleaseInputAmount') });
      }
      const flag = await this.$alert({
        message: i18n('home.confirmToSend'),
        cancelBtn: true,
      })
        .then(() => true)
        .catch(() => false);
      if (!flag) {
        return;
      }
      if (this.tokenDialogType === 'Token') {
        const { data } = await sendMessageFromExtPageToBackground('transferFt', {
          wif: this.account.wif,
          transferAddress: this.transferAddress,
          transferAmount: this.transferAmount,
          transferItem: this.transferItem,
        });
      }
      if (this.tokenDialogType === 'NFT') {
        const { data } = await sendMessageFromExtPageToBackground('transferNft', {
          wif: this.account.wif,
          address: this.account.address,
          transferAddress: this.transferAddress,
          transferAmount: this.transferAmount,
          transferItem: this.transferItem,
        });
      }
      this.handleCloseTransferTokenDialog();
      this.$toast({ message: i18n('common.success') });
      await this.fetchTokenInfo();
      await this.fetchData();
    },
  },
};
</script>
<style lang="less" scoped src="./style.less"></style>
