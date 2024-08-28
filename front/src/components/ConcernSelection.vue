<template>
  <v-autocomplete
    :label="label ?? 'Concern'"
    v-model="selectedConcern"
    :items="concerns"
    item-value="id"
    item-text="companyName"
    :prepend-icon="icon ?? 'fas fa-handshake'"
  >
    <template v-slot:item="{ item }">
      <div>{{ item.companyName || item.name + ' ' + item.surname }}</div>
    </template>
  </v-autocomplete>
</template>

<script>

export default {
  props: {
    label: String,
    icon: String,
    type: String,
    selectAll: Boolean
  },
  data: () => {
    return {
      concerns: [],
      selectedConcern: -1,
    }
  },
  computed: {
    selectedItem: {
      get() {
        return this.value
      },
      set(newValue) {
        this.$emit('input', newValue)
      },
    },
  },
  methods: {
    onSelectedItemChange(selectedItem) {
      this.$emit('input', selectedItem)
    },
  },
  mounted() {
    this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=${this.type}`).then(res => {
      this.concerns = res.data;
      if ( this.selectAll ) {
        this.concerns.unshift({ companyName: 'Tous', id: -1 })
      }
    });
  }
}
</script>