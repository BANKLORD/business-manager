<template>
  <v-simple-table>
    <thead>
    <tr>
      <th>Nom</th>
      <th>Prix</th>
      <th>Remise</th>
      <th>Prix Aprés Remise</th>
      <th>Quantité</th>
      <th>Total</th>
      <th class="text-center">Actions</th>
    </tr>
    </thead>
    <tbody>
    <tr
        v-for="product in saleProducts"
        :key="'saleProduct' + products.find(p => p.id === product.productId).productCodes[0].code"
    >
      <td class="text-left">
        <ul>
          <li
              v-for="pCode in products.find(p => p.id === product.productId).productCodes"
              :key="'pcode' + pCode.id"
              v-text="pCode.code"
          >
          </li>
        </ul>
      </td>
      <td class="text-left"> {{ product.productPrice ?? products.find(p => p.id === product.productId).retail_price | formatPrice }} </td>
      <td class="text-left"> {{ 0 > (parseFloat(products.find(p => p.id === product.productId).retail_price) - parseFloat(product.price)) ? 0 :
          parseFloat(products.find(p => p.id === product.productId).retail_price) - parseFloat(product.price) | formatPrice }}
      </td>
      <td class="text-left"> {{ product.price | formatPrice }} </td>
      <td class="text-left"> {{ product.quantity | formatNumber }} </td>
      <td class="text-left"> {{ (product.price * product.quantity) | formatPrice }} </td>
      <td>
        <v-btn
            left
            color="primary"
            icon
            @click="editProduct(product)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
            left
            color="red"
            icon
            @click="removeProduct(product)"
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
    saleProducts: Array,
    products: Array,
    editProduct: Function,
    removeProduct: Function,
  }
}
</script>

<style scoped>

</style>
