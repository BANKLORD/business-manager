<template>
     <div>
      <VueApexCharts
        type="area"
        :options="chartOptions"
        :series="series"
      ></VueApexCharts>
    </div>
</template>

<script>
import VueApexCharts from 'vue-apexcharts'

export default {
  name: 'BarChart',
  components: { VueApexCharts },
  data: () => {
    return {
      series: [
        { name: 'Purchases', data: [ 31, 40, 28, 51, 42, 109, 100 ] }
      ],
      chartOptions: {
        chart: {
          height: 350,
          type: 'area'
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth'
        },
        xaxis: {
          type: 'datetime',
          categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
        },
        tooltip: {
          x: {
            format: 'dd/MM/yy HH:mm'
          },
        },
      },
    }
  }
}
</script>
