<template>
  <v-menu
    ref="menu"
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    min-width="auto"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        v-model="date"
        :label="label"
        prepend-icon="mdi-calendar"
        readonly
        v-bind="attrs"
        v-on="on"
      ></v-text-field>
    </template>
    <v-date-picker
      v-model="date"
      :active-picker.sync="activePicker"
      @change="save"
      :min="min"
      :max="max"
    ></v-date-picker>
  </v-menu>
</template>

<script>
export default {
  props: {
    label: String,
    value: String,
    bound: Number,
    min: String,
    max: String,
  },
  data: () => ({
    activePicker: null,
    date: null,
    menu: false,
  }),
  mounted() {
    this.date = this.value ? new Date(this.value):null;

    this.$emit('input', this.date)
  },
  watch: {
    menu (val) {
      val && setTimeout(() => (this.activePicker = 'YEAR'))
    },
    value (val) {
      this.date = val;
    }
  },
  methods: {
    save (date) {
      this.$refs.menu.save(date);
      this.$emit('input', date)
    },
  },
}
</script>

<style>

</style>
