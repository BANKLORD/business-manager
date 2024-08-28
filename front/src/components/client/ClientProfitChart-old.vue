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
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  data: () => {
    return {
      labels: [
        { option: `last_24_hours`, values: ['1', '2'] },
        { option: `last_week`, values: ['1', '2'] },
        { option: `last_30_days`, values: ['1', '2'] },
        { option: `this_year`, values: ['1', '2'] },
      ],
      selectedOption: 'last_week',
      items: [
        { text: 'Dernières 24 heures', value: 'last_24_hours' },
        { text: 'La semaine dernière', value: 'last_week' },
        { text: 'Les 30 derniers jours', value: 'last_30_days' },
        { text: 'Cette année', value: 'this_year' },
      ],
      data: [],
      chart: undefined,
    };
  },
  watch: {
    // selectedOption() {
    //   this.loadData();
    // },
    // client() {
    //   this.loadData();
    // },
    // data() {
    //   this.updateChart();
    // },
  },
  props: {
    client: Object,
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
        this.data = res.data;
        this.updateChart()
        // console.log(this.data.map(profitAndLoss => profitAndLoss.day));
        // console.log(this.data.map(profitAndLoss => profitAndLoss.profit));
      });
    },
    getRandomColor() {
      const letters = '0123456789ABCDEF'
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color;
    },
    renderChart() {
      if ( !this.data.length ) return;
      const chartData = {
        labels: this.data.map(dataItem => dataItem.day),
        datasets: [
          {
            data: this.data.map(dataItem => dataItem.profit),
            backgroundColor: [ this.getRandomColor() ]
          },
        ],
      }
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
      }
      this.chart = new Chart(this.$refs.chart, {
        type: 'pie',
        data: chartData,
        options: chartOptions,
      });
    },
    updateChart() {
      if (this.chart) {
        this.chart.data.labels = this.data.map(profitAndLoss => profitAndLoss.day);
        this.chart.data.datasets[0].data = this.data.map(profitAndLoss => profitAndLoss.profit);
        this.chart.update();
      } else {
        this.renderChart();
      }
    },
  },
};
</script>