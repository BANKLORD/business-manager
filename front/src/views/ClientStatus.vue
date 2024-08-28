<template>
  <v-container fill-height fluid max-width="1024px">
    <v-row></v-row>
    <v-row class="my-5" justify="center">
      <!-- Table -->
      <v-col cols="12" md="8">
        <v-card>
          <v-toolbar
            flat
            color="primary"
            dark
          >
            <v-spacer></v-spacer>
            <v-toolbar-title>Clients</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-row class="mx-3 my-2" justify="center">
            <v-col>
              <v-text-field
                v-model.lazy="searchTerm"
                @change="searchTermChanged"
                label="Rechercher"
                append-icon="mdi-magnify"
                @click:append="searchTermChanged"
                v-on:keyup.enter="searchTermChanged"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-data-table
            :headers="clientsTableColumns"
            :items="clients"
            :items-per-page="10"
          >
            <template v-slot:[`item.totalInSales`]="{ item }">
              <p :style="{ color: 'green' }">
                {{ item.totalInSales | formatPrice }}
              </p>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-btn
                color="primary"
                icon
                v-if="$store.getters.hasPerm('concern-read')"
                @click="toggleSelectedClient(item)"
              >
                <v-icon
                  small
                >
                  {{ (selectedClient.id == item.id) ? 'mdi-eye-off':'mdi-eye' }}
                </v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <!-- Analytics -->
      <v-col cols="12" md="4">
        <v-card>
          <v-toolbar
            flat
            color="primary"
            dark
          >
            <v-spacer></v-spacer>
            <v-toolbar-title>Analyse</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <!-- Client Selected -->
          <v-container v-if="selectedClient.id > 0">
            <ClientProfitChart :client="selectedClient"></ClientProfitChart>
          </v-container>
          <!-- No Clients Selected -->
          <v-container v-else>
            <v-simple-table vertical>
              <template v-slot:default>
                <tbody>
                  <tr>
                    <th class="text-center">Client le plus rentable</th>
                    <td :style="{ color: 'blue' }">
                      {{ mostProfitableClient.companyName }} <br>
                      {{ mostProfitableClient.totalInSales | formatPrice }}
                    </td>
                  </tr>
                  <tr>
                    <th class="text-center">Total profit</th>
                    <td :style="{ color: 'green' }">
                      {{ totalProfit | formatPrice }}
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
            <v-divider class="my-5"></v-divider>
            <h3 class="text-center">Clients Chart</h3>
            <ProfitPieChart :clients="clients" ></ProfitPieChart>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ClientProfitChart from '@/components/client/ClientProfitChart.vue';
import ProfitPieChart from '@/components/client/ProfitPieChart.vue';
export default {
  components: {
    ProfitPieChart, ClientProfitChart
  },  
  computed: {
    totalProfit() {
      if ( this.clients.length > 0 ) {
        return this.clients.reduce((acc, client) => acc + client.totalInSales, 0);
      } return 0;
    },
    mostProfitableClient() {
      if ( this.clients.length > 0 ) {
        return this.clients.reduce((acc, client) => {
          return client.totalInSales > client.totalInSales ? client : acc;
        });
      } return { companyName: '', totalInSales: 0 };
    },
  },
  data: () => {
    return {
      clientsTableColumns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Nom', value: 'companyName' },
        { text: 'ICE', value: 'ice' },
        { text: 'Bénéfice', value: 'totalInSales' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      clients: [],
      searchTerm: '',
      selectedClient: { id: 0 }
    }
  },
  methods: {
    searchTermChanged() {
      this.loadClientsTable();
    },
    loadClientsTable() {
      let searchParams = {};
      searchParams.type = 'Client';
      if ( this.searchTerm )
        searchParams.searchTerm = this.searchTerm
      /** Load clients */
      this.axios.get(`${process.env.VUE_APP_API_URL}/client/analytics`, { params: searchParams }).then(res => { this.clients = res.data })
    },
    toggleSelectedClient(item) {
      if ( this.selectedClient.id == item.id ) {
        this.selectedClient = Object.assign({}, { id: 0 })
      } else
        this.selectedClient = item;
    }
  },
  created() { this.loadClientsTable() }
}
</script>