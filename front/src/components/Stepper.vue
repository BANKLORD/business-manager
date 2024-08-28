<template>
  <div>
    <v-stepper v-model="e1">
      <v-stepper-header>
        <template v-for="n in stepsLength">
          <v-stepper-step
              :key="`${n}-step`"
              :complete="e1 > n"
              :step="n"
              editable
          >
            {{steps[n-1]}}
          </v-stepper-step>

          <v-divider
              v-if="n !== stepsLength"
              :key="n"
          ></v-divider>
        </template>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content
            v-for="n in stepsLength"
            :key="`${n}-content`"
            :step="n"
        >
          <v-card
              class="mt-6 mb-6"
              height="600px"
          >
            <slot :name="n"></slot>
          </v-card>

          <v-btn
              v-if="e1<=n && n!==stepsLength"
              color="primary"
              @click="nextStep(n)"
          >
            Continue
          </v-btn>
          <v-btn
              v-else
              color="primary"
              @click="emitFinalze"
          >
            enregistrer
          </v-btn>

          <v-btn text @click="emitCancel">
            Cancel
          </v-btn>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </div>
</template>

<script>
export default {
  data () {
    return {
      e1: 1,
    }
  },
  props: {
    pSteps: Array
  },
  computed: {
    stepsLength() {
      return this.pSteps.length
    },
    steps() {
      return this.pSteps
    }
  },
  watch: {
    stepsLength (val) {
      if (this.e1 > val) {
        this.e1 = val
      }
    },
  },

  methods: {
    nextStep (n) {
      if (n === this.stepsLength) {
        this.e1 = 1
      } else {
        this.e1 = n + 1
      }
    },
    emitCancel() {
      this.e1 = 1
      this.$emit('sale-service-closed')
    },
    emitFinalze() {
      this.e1 = 1
      this.$emit('sale-service-completed')
    }
  },
}
</script>
