<template>
  <v-container fill-height fluid max-width="1024px">
    <!-- List -->
    <v-row class="text-center" justify="center" max-width="1024px">
      <v-card>
        <v-toolbar
          flat
          color="primary"
          dark
        >
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center">Liste des permissions</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <!--          Add button-->
        <template>
          <div class="text-center mx-1-rem">
            <v-btn
                v-if="$store.getters.hasPerm('permission-create')"
                color="primary"
                dark
                class="mb-2"
                @click="showCreateNewPermissionCard"
            >
              Nouveau permission
              <v-icon
                  right
                  dark
              >
                mdi-plus
              </v-icon>
            </v-btn>
          </div>
        </template>
<!--        permissions list-->
        <v-data-table
            :headers="headers"
            :items="permissions"
            :items-per-page="5"
            class="elevation-1 fill-width"
       >
          <template
              v-if="$store.getters.hasPerm('permission-update') || $store.getters.hasPerm('permission-delete')"
              v-slot:[`item.actions`]="{ item }"
          >
            <v-btn
                color="primary"
                icon
                v-if="$store.getters.hasPerm('permission-update')"
                @click="showEditNewPermissionCard({...item})"
            >
              <v-icon
                  small
              >
                mdi-pencil
              </v-icon>
            </v-btn>
            <v-btn
                color="red"
                class="mr-2"
                icon
                v-if="$store.getters.hasPerm('permission-delete')"
                @click="showDeleteConfirm(item)"
            >
              <v-icon
                  small
              >
                mdi-delete
              </v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-row>
    <v-divider></v-divider>
    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify="center" max-width="1024px">
        <v-card style="width: 600px">
          <v-toolbar
            flat
            color="primary"
            dark
          >
            <v-spacer></v-spacer>
            <v-toolbar-title>
              {{ showCreateOrUpdateCard > 0 ? `Modification de : ${selectedPermission.name}`:`Création d'une nouvelle permission` }}
            </v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <v-text-field v-model="selectedPermission.name" label="Spécifiez le nom de permission"></v-text-field>
            </v-card-text>
          </v-card>
          <v-card-actions class="justify-center" align="center" justify="center">
            <v-btn
              @click="createOrUpdatePermission"
              class="my-2"
              outlined
              rounded
              text
              color="primary"
            >
              Sauvegarder
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-row>
    </v-expand-transition>
  </v-container>
</template>

<script>
export default {
  computed: {
    showCreateOrUpdateCard() {
      return this.selectedPermission.id
    }
  },
  data: () => {
    return {
      selectedPermission: {
        id: 0
      },
      headers: [
        { text: '#', value: 'id', align: 'start' },
        { text: "Permission", value: 'name' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      permissions: [],
    }
  },
  created() {
    this.loadPermissions();
  },
  methods: {
    loadPermissions() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/permissions`).then(res => {
        this.permissions = res.data.data;
      });
    },
    showCreateNewPermissionCard() {
      this.selectedPermission = { id: -1 };
    },
    createOrUpdatePermission() {
      if ( !this.selectedPermission.name || !this.selectedPermission.name.trim().length)
        return this.$swal(
            'Saisie manquante!',
            "Veuillez vous assurer d'avoir rempli tous les champs correctement.",
            'warning'
          )
      const data = {
        name: this.selectedPermission.name,
      };

      if ( this.selectedPermission.id < 0 ) {
        this.axios.post(`${process.env.VUE_APP_API_URL}/permissions`, data).then(() => {
          this.resetAll();
          this.loadPermissions();
          this.$swal(
            'Succès!',
            'Les modifications ont été effectuées avec succès.',
            'success'
          )
        }).catch(err => {
          this.$swal(
              'Erreur!',
              err.response.status === 409 ?
                  "permission déja existante"  :
              "Une erreur s'est produite lors de la création de Permission",
              'warning'
          )
        })
      } else if ( this.selectedPermission.id >  0) {
        this.axios.put(`${process.env.VUE_APP_API_URL}/permissions/${this.selectedPermission.id}`, data).then(() => {
          this.resetAll();
          this.loadPermissions();
          this.$swal(
            'Succès!',
            'Les modifications ont été effectuées avec succès.',
            'success'
          )
        }).catch(() => {
          this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la modification de Permission",
              'error',
          )
        })
      }
    },
    resetAll() {
      this.selectedPermission = { id: 0 }
    },
    showEditNewPermissionCard(permission) {
      this.selectedPermission = permission;
    },
    showDeleteConfirm(permission) {
      this.$swal({
        title: 'Êtes-vous sûr?',
        text: "Vous ne pourrez pas revenir en arrière!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, supprimez-le!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.axios.delete(`${process.env.VUE_APP_API_URL}/permissions/${permission.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'permission a été supprimé.',
              'success'
            );
            this.loadPermissions();
          }).catch(() => {
            this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression de Permission",
              'error'
            )
          })
        } else {
          this.$swal(
            'Erreur!',
            "Une erreur s'est produite lors de la suppression de Permission",
            'error'
          )
        }
      })
    },
  }
}
</script>
<style>

</style>
