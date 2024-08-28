<template>
  <v-container>
    <v-row>
      <v-col lg="6" sm="12">
        <ConcernSelection v-model="sale.concernId" label="Client" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ConcernSelection from "@/components/ConcernSelection.vue";
export default {
  components: { ConcernSelection },
  props: {
    deliveryForm: Object
  },
  data: () => {
    return {
      sale: Object,
    }
  },
  async mounted() {
    const result = await this.axios.get(`${process.env.VUE_APP_API_URL}/sale/${this.deliveryForm?.sale?.id}`);
    console.log(result);
  }
}
</script>