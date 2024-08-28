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
          <v-toolbar-title class="text-center">Liste des utilisateurs</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-data-table
            :headers="headers"
            :items="users"
            :items-per-page="5"
            class="elevation-1"
        >
          <template v-slot:top>
            <div class="text-center mx-1-rem">
              <v-btn
                  v-if="$store.getters.hasPerm('user-create')"
                  color="primary"
                  dark
                  class="mb-2"
                  @click="showCreateNewRoleCard"
              >
                Nouveau compte
                <v-icon
                    right
                    dark
                >
                  mdi-plus
                </v-icon>
              </v-btn>
            </div>
          </template>
          <template
              v-if="$store.getters.hasPerm('user-update') || $store.getters.hasPerm('user-delete')"
              v-slot:[`item.actions`]="{ item }"
          >
            <v-btn
                color="primary"
                icon
                v-if="$store.getters.hasPerm('user-update')"
                @click="showEditNewUserCard(item)"
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
                v-if="$store.getters.hasPerm('user-delete')"
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
              {{ showCreateOrUpdateCard ? `Création d'un nouveau compte`:`Modification de : ${selectedUser.username}` }}
            </v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <v-text-field v-model="selectedUser.username" label="Spécifiez le nom d'utilisateur"></v-text-field>
              <v-text-field v-model="selectedUser.password" label="Spécifiez le mot de passe"></v-text-field>
              <v-select
                  placeholder="Sélectionnez un rôle"
                  :items="roles"
                  item-value="id"
                  item-text="name"
                  v-model="assignedRole"
              ></v-select>
            </v-card-text>
          </v-card>
          <v-card-actions class="justify-center" align="center" justify="center">
            <v-btn
                @click="createOrUpdateUser"
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
  props: {
    companyId: Number
  },
  watch: {
    'selectedUser'() {
      if ( this.selectedUser.roleId > 0 )
        this.assignedRole = this.selectedUser.roleId
    },
  },
  computed: {
    showCreateOrUpdateCard() {
      return this.selectedUser.id
    }
  },
  data: () => {
    return {
      loading: false,
      selectedUser: {
        id: 0
      },
      headers: [
        { text: '#', value: 'id', align: 'start' },
        { text: "Nom d'utilisateur", value: 'username' },
        { text: 'Rôle', value: 'userHasRoles[0].role.name' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      users: [],
      roles: [],
      assignedRole: null,
    }
  },
  created() {
    this.loadUsers();
    this.loadRoles();
  },
  methods: {
    loadRoles() {
      const searchParams = {};

      this.axios.get(`${process.env.VUE_APP_API_URL}/company/${this.companyId}/roles`, { params: searchParams }).then(res => {
        this.roles = res.data.data;
      });
    },
    loadUsers() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/company/${this.companyId}/users`).then(res => {
        this.users = res.data.data;
        for (let i = 0; i < this.users.length; i++) {
          this.users[i].password = null
        }
      }).catch(() => {
        return this.$swal(
            'Erreur',
            "Un problème est survenu lors du chargement des données..",
            'warning'
        )
      });
    },
    showCreateNewRoleCard() {
      this.selectedUser = { id: -1 };
      this.assignedRole = null;
    },
    createOrUpdateUser() {
      if ( !this.selectedUser.username || !this.assignedRole) {
        this.loading = false
        return this.$swal(
            'Saisie manquante!',
            "Veuillez vous assurer d'avoir rempli tous les champs.",
            'warning'
        )
      }
      if ( this.selectedUser.id < 0 ) {
        if ( !this.selectedUser.password.trim()) {
          this.loading = false
          return this.$swal(
              'Saisie manquante!',
              "Veuillez vous assurer d'avoir rempli tous les champs.",
              'warning'
          )
        }
        const data = {
          username: this.selectedUser.username,
          password: this.selectedUser.password,
          companyId: this.companyId,
          role: this.assignedRole
        };
        this.axios.post(`${process.env.VUE_APP_API_URL}/users`, data).then(() => {
          this.loading = false
          this.resetAll();
          this.loadUsers();
          this.$swal(
              'Succès!',
              'Les modifications ont été effectuées avec succès.',
              'success'
          )
        }).catch(err => {
          this.loading = false
          this.$swal(
              'Erreur!',
              err.response.status === 409 ?
                  "Utlisateur déja existant"  :
                  "Une erreur s'est produite lors de la création de l'utilisateur",
              'warning'
          )
        })
      } else if ( this.selectedUser.id >  0) {
        const data = {
          username: this.selectedUser.username,
          password: this.selectedUser.password,
          companyId: this.companyId,
          role: this.assignedRole
        };
        this.axios.put(`${process.env.VUE_APP_API_URL}/users/${this.selectedUser.id}`, data).then(() => {
          this.loading = false
          this.resetAll();
          this.loadUsers();
          this.$swal(
              'Succès!',
              'Les modifications ont été effectuées avec succès.',
              'success'
          )
        }).catch(err => {
          this.loading = false
          this.$swal(
              'Erreur!',
              err.response.status === 409 ?
                  "Un utilisateur déja existant avec le meme username"  :
                  "Une erreur s'est produite lors de la création de l'utilisateur",
              'warning'
          )
        })
      }
    },
    resetAll() {
      this.selectedUser = { id: 0 }
      this.assignedRole = null
    },
    async showEditNewUserCard(user) {
      user.password = null;
      this.selectedUser = {...user};
      this.assignedRole = null;
      this.axios.get(`${process.env.VUE_APP_API_URL}/users/${this.selectedUser.id}/role`).then(res => {
        this.assignedRole = res.data && res.data.id;
      })
    },
    showDeleteConfirm(user) {
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/users/${user.id}`).then(() => {
            this.loadUsers();
            this.$swal(
                'Supprimé!',
                'Rôle a été supprimé.',
                'success'
            );
          }).catch(() => {
            this.$swal(
                'Erreur!',
                "Une erreur s'est produite lors de la suppression de rôle",
                'error'
            )
          })
        } else {
          this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression de rôle",
              'error'
          )
        }
      })
    },
  }
}
</script>
