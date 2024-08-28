<template>
  <div>
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  data: () => {
    return {
      chart: undefined,
    }
  },
  watch: {
    clients() {
      this.updateChart()
    }
  },
  props: {
    clients: Array,
  },
  mounted() {
    this.renderChart();
  },
  methods: {
    getRandomColor() {
      const letters = '0123456789ABCDEF'
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color;
    },
    renderChart() {
      const chartData = {
        labels: [...this.clients.map(client => client.companyName)],
        datasets: [
          {
            data: [...this.clients.map(client => client.totalInSales)],
            backgroundColor: [...this.clients.map(client => this.getRandomColor(client))],
          },
        ],
      };

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
      };

      this.chart = new Chart(this.$refs.chart, {
        type: 'pie',
        data: chartData,
        options: chartOptions,
      });
    },
    updateChart() {
      if (this.chart) {
        this.chart.data.labels = [...this.clients.map(client => client.companyName)];
        this.chart.data.datasets[0].data = [...this.clients.map(client => client.totalInSales)];
        this.chart.data.datasets[0].backgroundColor = [...this.clients.map(client => this.getRandomColor(client))];
        this.chart.update();
      } else {
        this.renderChart();
      }
    },
  },
};
</script>
