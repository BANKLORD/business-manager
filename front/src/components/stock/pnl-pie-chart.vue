<template>
  <div>
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  props: {
    totalInvestments: undefined,
    totalProfit: undefined,
    restStockWorth: undefined,
  },
  watch: {
    totalInvestments() {
      this.updateChart();
    },
    totalProfit() {
      this.updateChart();
    },
    restStockWorth() {
      this.updateChart();
    },
  },
  mounted() {
    this.renderChart();
  },
  methods: {
    renderChart() {
      const chartData = {
        labels: ['Total Investments', 'Total Profit', 'Revenus estimés'],
        datasets: [
          {
            data: [this.totalInvestments, this.totalProfit, this.restStockWorth].filter(val => val >= 0),
            backgroundColor: ['#0074D9', '#2ECC40', '#FF851B'],
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
        this.chart.data.datasets[0].data = [this.totalInvestments, this.totalProfit, this.restStockWorth].filter(val => val >= 0);
        this.chart.update();
      } else {
        this.renderChart();
      }
    },
  },
};
</script>
