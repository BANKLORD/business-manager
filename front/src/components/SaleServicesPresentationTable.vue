<template>
  <v-simple-table>
    <thead>
    <tr>
      <th>Nom</th>
      <th>Prix de base</th>
      <th>Remise</th>
      <th>Prix de vente</th>
      <th>quantity</th>
      <th>Total</th>
      <th class="text-center">Actions</th>
    </tr>
    </thead>
    <tbody>
    <tr
        v-for="(service, index) in saleServices"
        :key="'saleService' + index + service.toString()"
    >
      <td class="text-left">
        <p class="my-0 py-0">{{services.find(s=>s.id === service.serviceId).name }}</p>
      </td>
      <td class="text-left"> {{services.find(s => s.id === service.serviceId).sell_price | formatPrice }} </td>
      <td class="text-left"> {{ 0 > (parseFloat(services.find(s => s.id === service.serviceId).sell_price) - parseFloat(service.price)) ? 0
          : parseFloat(services.find(s => s.id === service.serviceId).sell_price) - parseFloat(service.price) | formatPrice }}
      </td>
      <td class="text-left"> {{ service.price | formatPrice }} </td>
      <td class="text-left"> {{ service.quantity}} </td>
      <td class="text-left">{{totalPrice(service) | formatPrice}}</td>
      <td>
        <v-btn
            left
            color="primary"
            icon
            @click="editService(service)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
            left
            color="red"
            icon
            @click="removeService(service)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </td>
    </tr>
    </tbody>
  </v-simple-table>
</template>

<script>
export default {
  props: {
    saleServices: Array,
    services: Array,
    totalPrice: Function,
    editService: Function,
    removeService: Function,
  }
}
</script>

<style scoped>

</style>
