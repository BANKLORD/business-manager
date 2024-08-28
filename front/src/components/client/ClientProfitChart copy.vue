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
    <p>{{ client.companyName }}</p>
    <p>{{ data[0] }}</p>
    <canvas ref="lineChart"></canvas>
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
      data: [
        { day: '2024-03-20', profit: 1365.88 },
        // Add more data objects here
      ],
      chart: undefined,
    };
  },
  watch: {
    selectedOption() {
      this.loadData();
    },
    client() {
      this.loadData();
    },
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
      ).then(() => {
        // this.data = res.data;
        this.renderChart();
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
      const labels = this.data.map(item => item.day);
      const profits = this.data.map(item => item.profit);
      if (this.chart) {
        this.chart.destroy();
      }
      this.chart = new Chart(this.$refs.lineChart, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Profit',
            data: profits,
            borderColor: 'rgb(75, 192, 192)',
            fill: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Day',
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Profit',
              },
            },
          },
        },
      });
    }
  },
};
</script>
