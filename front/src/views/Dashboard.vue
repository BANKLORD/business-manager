<template>
  <div>
    <v-row justify="center">
      <v-col cols="12">
        <h3 class="text-center" v-text="company.name"></h3>
      </v-col>
      <v-col md="4" cols="12">
        <v-card
          elevation="8"
        >
          <v-card-text
            style="max-height: 450px;overflow-y: scroll;margin-top: 10px;"
          >
            <v-col cols="12" v-if="almostEmptyStocks.length > 0">
              <h2 class="text-center text-uppercase warning--text">Alertes de gestion des stocks</h2>
            </v-col>
            <v-col cols="12" v-else>
              <h2 class="text-center text-uppercase success--text">Vos stocks sont tous en bon état</h2>
            </v-col>
            <v-col
              class="my-0 py-0"
              v-for="product of almostEmptyStocks"
              cols="12"
              :key="'product'+product.id"
            >
              <v-alert
                dismissible
                color="warning"
                border="left"
                elevation="2"
                colored-border
                icon="fas fa-boxes"
              >
                <div
                  v-html="`<b>${product.productCodes[0].code}</b> est en rupture de stock (${product.quantity} ${product.unity ?? ''})`"
                ></div>
              </v-alert>
            </v-col>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col md="9" cols="12">
        <v-divider inset></v-divider>
      </v-col>
      <v-col class="text-center" cols="12">
        <div style="margin: 0 auto;">
          <v-row justify="center">
            <v-col md="3" cols="12">
              <v-select
                :items="pnlTimeFilter"
                v-model="pnlSelectedTimeFilter"
                item-value="value"
              ></v-select>
            </v-col>
            <v-col md="3" cols="12">
              <v-autocomplete
                label="Selectioné un client"
                :items="pnlConcernFilter"
                v-model="pnlSelectedConcernFilter"
                item-value="id"
                item-text="companyName"
              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="12">
              <h2 class="darkgrey--text">Profits et Investissement</h2>
            </v-col>
            <v-col class="text-center" md="6" cols="12">
              <BarChart :chart-data="profit" />
            </v-col>
            <v-divider vertical inset></v-divider>
            <v-col class="text-center" md="6" cols="12">
              <BarChart :chart-data="loss" />
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import moment from 'moment';
import BarChart from '../components/BarChart.vue';
export default {
  components: { BarChart },
  name: "Dashboard",
  data() {
    return {
      company: {},
      alert: true,
      almostEmptyStocks: [],
      pnlSelectedTimeFilter: 2,
      pnlTimeFilter: [
        { value: 1, text: "Aujourd'hui" },
        { value: 2, text: 'Cette semaine' },
        { value: 3, text: 'Ce mois-ci' },
      ],
      pnlSelectedConcernFilter: -1,
      pnlConcernFilter: [],
      profit: {
        labels: [],
        datasets: [
          {
            label: 'PROFIT',
            backgroundColor: '#4caf50',
            data: []
          }
        ]
      },
      loss: {
        labels: [],
        datasets: [
          {
            label: 'INVESTISSEMENT',
            backgroundColor: '#b71c1c',
            data: []
          }
        ],
      }
    };
  },
  async created() {
    this.$store.commit('setOverlay', true);
    this.$store.commit('changeCompany', this.company);
    const searchParams = { inventory: 10 };
    this.axios.get(`${process.env.VUE_APP_API_URL}/products`, { params: searchParams }).then(res => {
      this.almostEmptyStocks = res.data.filter(p => p.quantity <= p.stockAlert);
      this.$store.commit('setOverlay', false);
    }).catch(() => { this.$store.commit('setOverlay', false); });
    this.company = this.$store.getters.getCompany;
    this.getProfit();
    this.getLoss();
    this.getConcerns();
  },
  methods: {
    getProfit() {
      const queryParams = {};
      if ( this.pnlSelectedTimeFilter )
        queryParams.filterType = this.pnlSelectedTimeFilter;
      if ( this.pnlSelectedConcernFilter > 0 )
        queryParams.concern = this.pnlSelectedConcernFilter;
      /** Send request */
      this.axios.get(`${process.env.VUE_APP_API_URL}/dashboard/profit`, { params: queryParams }).then(res => {
        this.profit.datasets[0].data = res.data.profit.data;
        const labels = [];
        for (var label of res.data.profit.labels) {
          switch (this.pnlSelectedTimeFilter) {
            case 1:
              labels.push(moment(String(label)).format('HH:mm'))
              break;
            case 2:
              labels.push(moment(String(label)).format('dd, DD'))
              break;
            case 3:
              labels.push(moment(String(label)).format('MMM, DD'))
              break;
            default:
              labels.push(moment(String(label)).format('MMM, DD HH:mm'))
              break;
          }
        }
        this.profit.labels = labels;
      })
    },
    getLoss() {
      const queryParams = {};
      if ( this.pnlSelectedTimeFilter )
        queryParams.filterType = this.pnlSelectedTimeFilter;
      if ( this.pnlSelectedConcernFilter > 0 )
        queryParams.concern = this.pnlSelectedConcernFilter;
      /** Send request */
      this.axios.get(`${process.env.VUE_APP_API_URL}/dashboard/loss`, { params: queryParams }).then(res => {
        this.loss.datasets[0].data = res.data.loss.data;
        const labels = [];
        for (var label of res.data.loss.labels) {
          switch (this.pnlSelectedTimeFilter) {
            case 1:
              labels.push(moment(String(label)).format('HH:mm'))
              break;
            case 2:
              labels.push(moment(String(label)).format('dd, DD'))
              break;
            case 3:
              labels.push(moment(String(label)).format('MMM, DD'))
              break;
            default:
              labels.push(moment(String(label)).format('MMM, DD HH:mm'))
              break;
          }
          // labels.push(moment(String(label)).format('MMM, DD HH:mm'))
        }
        this.loss.labels = labels;
      });
    },
    getConcerns() {
      let searchParams = {};
      searchParams.type = 'Client';
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns`, { params: searchParams }).then(res => {
        this.pnlConcernFilter = res.data;
        this.pnlConcernFilter.unshift({ id: -1, companyName: 'Tous Les Clients' });
      });
    }
  },
  watch: {
    pnlSelectedTimeFilter() {
      this.getProfit();
      this.getLoss();
    },
    pnlSelectedConcernFilter() {
      this.getProfit();
      this.getLoss();
    }
  },
}
</script>
