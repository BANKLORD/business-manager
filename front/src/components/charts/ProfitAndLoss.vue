<template>
  <div>
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';


export default {
  mounted() {
    this.renderChart();
  },
  methods: {
    renderChart() {
      const chartData = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
          {
            label: 'Profit',
            borderColor: 'green',
            backgroundColor: 'rgba(75,192,192,0.4)',
            data: [2000, 3000, 4000, 5000, 5500, 6000, 7000],
            yAxisID: 'profit',
          },
          {
            label: 'Loss',
            borderColor: 'red',
            backgroundColor: 'rgba(255, 99, 132, 0.4)',
            data: [500, 1000, 2000, 3000, 4000, 5000, 6000],
            yAxisID: 'loss',
          },
        ],
      };

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          yAxes: [
            {
              type: 'linear',
              display: true,
              position: 'left',
              id: 'profit',
              ticks: {
                beginAtZero: true,
              },
            },
            {
              type: 'linear',
              display: true,
              position: 'right',
              id: 'loss',
              ticks: {
                beginAtZero: true,
              },
              gridLines: {
                drawOnChartArea: false,
              },
            },
          ],
        },
      };

      this.chart = new Chart(this.$refs.chart, {
        type: 'line',
        data: chartData,
        options: chartOptions,
      });
    },
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  },
};
</script>
