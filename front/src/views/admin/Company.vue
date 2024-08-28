<template>
  <v-container>
    <!-- List title and description -->
    <v-row>
      <v-col cols="12">
        <h2 class="text-center">Liste des Sociétés</h2>
      </v-col>
    </v-row>
    <!-- Buttons and filters -->
    <v-row>
      <v-col cols="12">
        <div class="text-center mx-1-rem">
          <v-btn
            v-if="$store.getters.hasPerm('company-create')"
            color="primary"
            dark
            class="mb-2"
            @click="showCreateOrUpdateCard"
          >
            Ajouter
            <v-icon
              right
              dark
            >
              mdi-plus
            </v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <!-- List of companies -->
    <v-row>
      <v-col cols="12">
        <v-data-table
          :headers="columns"
          :items="items"
          :items-per-page="5"
          class="elevation-3"
        >
          <template v-slot:[`item.active`]="{ item }">
            <template v-if="item.active">
              <v-chip class="text-uppercase" color="success" dark>
                Activé
              </v-chip>
            </template>
            <template v-else>
              <v-chip class="text-uppercase" color="red" dark>
                Désactivé
              </v-chip>
            </template>
          </template>
          <template v-slot:[`item.type`]="{ item }">
            {{ industryTypes.find(industryType => industryType.value == item.Settings?.industryType)?.text }}
          </template>
          <!-- List Actions -->
          <template
            v-if="$store.getters.hasPerm('dev')"
            v-slot:[`item.actions`]="{ item }"
          >
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="primary"
                  icon
                  v-bind="attrs"
                  v-on="on"
                  :loading="loading"
                  :disabled="loading"
                >
                  <v-icon>fas fa-wrench</v-icon>
                </v-btn>
              </template>
              <v-list
                nav
                dense
              >
                <v-list-item class="d-block" link @click="showCreateOrUpdateCard(item)">
                  <v-list-item-title>
                    <v-btn
                      text 
                      color="primary" 
                      :loading="loading"
                      :disabled="loading"
                    >
                      <v-icon left>fas fa-pencil</v-icon> Modifier
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="item.active" class="d-block" link @click="showDisableConfirm(item)">
                  <v-list-item-title>
                    <v-btn
                      text 
                      color="warning" 
                      :loading="loading"
                      :disabled="loading"
                    >
                      <v-icon left>fas fa-ban</v-icon> Désactiver
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="!item.active" class="d-block" link @click="activateCompany(item)">
                  <v-list-item-title>
                    <v-btn
                      text 
                      color="success" 
                      :loading="loading"
                      :disabled="loading"
                    >
                      <v-icon left>fas fa-check</v-icon> Activer
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <!-- Dialogs -->
    <v-dialog
      fullscreen
      transition="dialog-bottom-transition"
      persistent
      v-model="showCreateOrUpdateDialog"
    >
      <v-card tile>
        <v-toolbar dark color="primary" >
          <!-- Close Dialog Button -->
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeCreateOrUpdateDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-container>
          <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
              <CreateOrUpdate
                v-if="showCreateOrUpdateDialog"
                v-bind:_company="selectedCompany"
                v-bind:_settings="selectedCompany.Settings"
                v-on:saved="createOrUpdatedTriggered()"
              ></CreateOrUpdate>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import CreateOrUpdate from '../../components/admin/company/CreateOrUpdate.vue';
export default {
  components: { CreateOrUpdate },
  data: () => {
    return {
      industryTypes: [],
      selectedCompany: { id: -1 },
      showCreateOrUpdateDialog: false,
      loading: false,
      items: [],
      columns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Nom', value: 'name' },
        { text: 'ICE', value: 'ICE' },
        { text: 'Type', value: 'type' },
        { text: 'Status', value: 'active' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
    }
  },
  methods: {
    createOrUpdatedTriggered() {
      this.showCreateOrUpdateDialog = false;
      this.loadItems();
    },
    closeCreateOrUpdateDialog() {
      this.showCreateOrUpdateDialog = false;
      this.selectedCompany = Object.assign({}, { id: -1 });
    },
    showCreateOrUpdateCard(company) {
      if ( company ) {
        this.showCreateOrUpdateDialog = true;
        this.selectedCompany = Object.assign({}, company);
      } else {
        this.showCreateOrUpdateDialog = true;
        this.selectedCompany = Object.assign({}, {id: 0});
      }
    },
    loadItems() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/companies`).then(res => {
        this.items = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/company/types`).then(res => {
        this.industryTypes = res.data;
      });
    },
    async showDisableConfirm(item) {
      this.loading = true;
      const confirmResult = await this.$swal({
        title: 'Êtes-vous sûr?',
        text: "Vous êtes sur le point de désactiver une entreprise qui désactivera tous les accès pour l'entreprise choisie!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, Désactivez-le!'
      });
      if ( confirmResult.isConfirmed ) {
        this.axios.delete(`${process.env.VUE_APP_API_URL}/company/${item.id}/disable`).then(() => {
          this.$swal( 'Désactivée!', 'La société a été désactivée avec succès.', 'success' );
          this.loadItems();
          this.loading = false;
        }).catch(() => {
          this.$swal( 'Erreur!', `Une erreur s'est produite lors de la désactivation de la société`, 'warning' );
          this.loadItems();
          this.loading = false;
        })
      } else {
        this.$swal('Annulé', 'La désactivation a été annulée', 'info');
        this.loading = false;
      }
    },
    async activateCompany(item) {
      this.loading = true;
      this.axios.put(`${process.env.VUE_APP_API_URL}/company/${item.id}/activate`).then(() => {
        this.$swal( 'Activé!', 'La société a été activé avec succès.', 'success' );
        this.loadItems();
        this.loading = false;
      }).catch(() => {
        this.$swal( 'Erreur!', `Une erreur s'est produite lors de l'activation de la société`, 'warning' );
        this.loadItems();
        this.loading = false;
      })
    }
  },
  created() {
    this.loadItems();
  }
}
</script>