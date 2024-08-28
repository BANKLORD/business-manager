<template>
  <div>
    <h3 class="grey--text text-center">
      Bénéfice du client pour {{ items.find(option => option.value == selectedOption).text }}
    </h3>
    <v-divider></v-divider>
    <v-btn-toggle v-model="selectedOption" group>
      <v-container>
        <v-row class="text-center" justify="center">
          <v-col v-for="option in items" :key="option.value">
            <v-btn small color="primary" :value="option.value">
              {{ option.text }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-btn-toggle>
    <v-divider></v-divider>
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  watch: {
    selectedOption() {
      this.loadData();
    },
    client() {
      this.loadData();
    },
  },
  props: {
    client: Object,
  },
  data() {
    return {
      selectedOption: 'last_week',
      items: [
        { text: 'Dernières 24 heures', value: 'last_24_hours' },
        { text: 'La semaine dernière', value: 'last_week' },
        { text: 'Les 30 derniers jours', value: 'last_30_days' },
        { text: 'Cette année', value: 'this_year' },
      ],
      chart: null,
      chartData: [],
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.axios.get(
        `${process.env.VUE_APP_API_URL}/client/${this.client.id}/profit`,
        { params: { timeRange: this.selectedOption } }
      ).then((res) => {
        this.chartData = res.data;
        this.renderChart();
      });
    },
    renderChart() {
      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(this.$refs.chart.getContext('2d'), {
        type: 'line',
        data: {
          labels: this.chartData.map(data => data.day),
          datasets: [{
            label: 'Profit',
            data: this.chartData.map(data => data.profit),
            borderColor: 'blue',
            borderWidth: 2,
            fill: false,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Le profit au fil du temps',
            },
            legend: {
              display: false,
            },
          },
        },
      });
    },
  },
};
</script>
