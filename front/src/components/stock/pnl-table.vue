<template>
  <v-card>
    <v-simple-table vertical>
      <template v-slot:default>
        <tbody>
          <tr>
            <th class="text-center">Investissements</th>
            <td :style="{ color: 'blue' }">{{ totalInvestments | formatPrice }}</td>
          </tr>
          <tr>
            <th class="text-center">Profit (CA)</th>
            <td :style="{ color: 'green' }">{{ totalProfit | formatPrice }}</td>
          </tr>
          <tr>
            <th class="text-center">PNL</th>
            <td :style="{ color: pnl >= 0 ? 'green' : 'red' }">{{ pnl | formatPrice }}</td>
          </tr>
          <tr>
            <th class="text-center">Marge bénéficiaire</th>
            <td :style="{ color: 'purple' }">{{ margin | formatPriceWithoutCurrency }}%</td>
          </tr>
          <tr>
            <th class="text-center">Revenus estimés</th>
            <td :style="{ color: 'orange' }">{{ restStockWorth | formatPrice }}</td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </v-card>
</template>

<script>
export default {
  computed: {
    pnl() {
      return this.totalProfit - this.totalInvestments;
    },
    margin() {
      return (this.pnl * 100) / this.totalInvestments;
    }
  },
  props: {
    totalInvestments: undefined,
    totalProfit: undefined,
    restStockWorth: undefined,
  },
};
</script>
