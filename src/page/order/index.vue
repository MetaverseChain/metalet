<template>
  <div class="page-order">
    <mo-card>
      <!-- ready -->
      <template v-if="orderStep === 0">
        <h1 class="mo-title" style="text-align: center">{{ $t('order.orderTransfer') }}</h1>
        <hr class="mo-divider" />
        <mo-form>
          <mo-form-item :label="$t('order.from')">
            <div class="txt-hide">{{ account.address }}</div>
          </mo-form-item>
          <mo-form-item :label="$t('order.to')">
            <div class="txt-hide">{{ sendAddress }}</div>
          </mo-form-item>
          <mo-form-item :label="$t('order.sendAmount')">
            <div class="txt-hide">
              <span style="color: var(--danger-color); font-weight: bold">{{
                $filter.satoshisToSpace(sendAmount)
              }}</span>
              SPACE
            </div>
          </mo-form-item>
          <hr class="mo-divider" />
          <mo-form-item :label="$t('order.fee')">
            <div>{{ $filter.satoshisToSpace(fee) }} SPACE</div>
          </mo-form-item>
          <hr class="mo-divider" />
          <mo-form-item submitItem style="text-align: center">
            <mo-button simple @click="handleCancel">{{ $t('cancel') }}</mo-button>
            <mo-button :disabled="allowSubmit" @click="handleConfirm">{{ $t('confirm') }}</mo-button>
          </mo-form-item>
        </mo-form>
      </template>
      <!-- success -->
      <template v-else-if="orderStep === 1">
        <img src="/public/img/icon-success.svg" class="success" />
        <h1 class="success-title mo-title">{{ $t('transfer') }} {{ $t('success') }}</h1>
        <hr class="mo-divider" />
        <mo-form>
          <mo-form-item :label="$t('order.sendAmount')">
            <div class="txt-hide">
              {{ $filter.satoshisToSpace(sendAmount) }}
              SPACE
            </div>
          </mo-form-item>
          <mo-form-item :label="$t('order.fee')">
            <div>{{ $filter.satoshisToSpace(fee) }} SPACE</div>
          </mo-form-item>
          <hr class="mo-divider" />
          <mo-form-item :label="$t('order.balance')">
            <div>{{ $filter.satoshisToSpace(balance) }} SPACE</div>
          </mo-form-item>
          <hr class="mo-divider" />
          <mo-form-item submitItem style="text-align: center">
            <mo-button @click="handleCancel">{{ $t('confirm') }}</mo-button>
          </mo-form-item>
        </mo-form>
      </template>
      <!-- fail -->
      <template v-else-if="orderStep === -1"> </template>
    </mo-card>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { sendMessageFromExtPageToBackground } from '@/util/chromeUtil';
import i18n from '@/i18n';
import { spaceTosatoshis } from '@/util';
import { Decimal } from 'decimal.js';
export default {
  name: 'page-order',
  computed: {
    ...mapGetters({
      account: 'account/currentAccount',
    }),
    sendAddress() {
      return this.$route.query.sendAddress;
    },
    sendAmount() {
      return Number(this.$route.query.sendAmount) || 0;
    },
    allowSubmit() {
      if (this.balance > 0) {
        return false;
      } else return true;
    },
  },
  data() {
    return {
      orderStep: 0, // 0:ready, 1:success
      fee: Number(this.$route.query.fee) || 0,
      balance: 0,
    };
  },
  created() {
    this.countFee();
    this.getBalance();
  },
  methods: {
    async countFee() {
      if (this.fee > 0) {
        return;
      }
      const { data } = await sendMessageFromExtPageToBackground('countFee', {
        address: this.account.address,
        sendAmount: this.sendAmount,
        sendAddress: this.sendAddress,
        wif: this.account.wif,
        // unspents: this.unspents,
      });
      this.fee = data;
    },
    handleCancel() {
      this.$router.push({ path: '/' });
    },
    async getBalance() {
      const { data } = await sendMessageFromExtPageToBackground('getBalance', {
        address: this.account.address,
      });
      this.balance = data;
    },
    async handleConfirm() {
      if (!this.sendAddress) {
        return this.$toast({ message: i18n('home.pleaseInputAddress') });
      }
      if (!this.sendAmount) {
        return this.$toast({ message: i18n('home.pleaseInputAmount') });
      }
      const satoshi = +this.sendAmount;
      if (satoshi < 2000) {
        return this.$toast({ message: i18n('home.amountMoreThan2000') });
      }
      console.log('余额', satoshi, this.fee, this.balance);
      if (
        new Decimal(satoshi).add(new Decimal(this.fee).toNumber()).toNumber() >= new Decimal(this.balance).toNumber()
      ) {
        return this.$toast({ message: i18n('home.amountNotEnough') });
      }
      const loading = this.$loading();
      const { data } = await sendMessageFromExtPageToBackground('sendAmount', {
        wif: this.account.wif,
        sendAddress: this.sendAddress,
        sendAmount: satoshi,
        address: this.account.address,
      }).finally(() => {
        loading.close();
      });
      this.$toast({ message: i18n('home.paySuccess') });
      await this.getBalance();
      this.orderStep = 1;
    },
  },
};
</script>

<style src="./style.less" lang="less" scoped></style>
