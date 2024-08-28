<template>
  <v-card>
    <v-navigation-drawer v-model="sidebar" app>
      <v-list>
        <!-- Dashboard Items -->
        <v-list-item
          v-for="item in dashboardItems"
          v-show="!item.permission || (item.permission && hasPerm(item.permission))"
          :key="item.title"
          :to="item.path"
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>{{ item.title }}</v-list-item-content>
        </v-list-item>
        <!-- Stock Management Items -->
        <v-list-group
          prepend-icon="mdi-inbox-multiple"
          :value="true"
        >
          <template v-slot:activator>
            <v-list-item-title>Gestion de produits</v-list-item-title>
          </template>
          <v-list-item
            v-for="(item, index) in productItems"
            v-show="!item.permission || (item.permission && hasPerm(item.permission))"
            :key="index +'_'+ item.title"
            :to="item.path"
          >
            <v-list-item-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>{{ item.title }}</v-list-item-content>
          </v-list-item>
        </v-list-group>

        <template v-if="hasPerm('brand-read') || hasPerm('product-read') || hasPerm('category-read')">
          <v-divider></v-divider>
          <p class="my-3 text-center text-uppercase primary--text font-weight-black" color="primary"> Gestion de produits </p>
          <v-divider></v-divider>
        </template>
        <v-list-item
          v-for="(item, index) in productItems"
          v-show="!item.permission || (item.permission && hasPerm(item.permission))"
          :key="index +'_'+ item.title"
          :to="item.path"
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>{{ item.title }}</v-list-item-content>
        </v-list-item>
        <template v-if="hasPerm('inventory-read')">
          <v-divider></v-divider>
          <p class="my-3 text-center text-uppercase primary--text font-weight-black" color="primary"> Gestion de stock </p>
          <v-divider></v-divider>
        </template>
        <v-list-item
          v-for="(item, index) in stockItems"
          v-show="!item.permission || (item.permission && hasPerm(item.permission))"
          :key="index +'_'+ item.title"
          :to="item.path"
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>{{ item.title }}</v-list-item-content>
        </v-list-item>
        <!-- Sales & Purchases Management Items -->
        <template v-if="hasPerm('concern-read') || hasPerm('purchase-read')">
          <v-divider ></v-divider>
          <p class="my-3 text-center text-uppercase primary--text font-weight-black" color="primary"> ventes / achats <br>  clients / Fournisseurs </p>
          <v-divider></v-divider>
        </template>
        <v-list-item
          v-for="(item, index) in salesPurchasesItems"
          v-show="!item.permission || (item.permission && hasPerm(item.permission))"
          :key="index +'_'+ item.title"
          :to="item.path"
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>{{ item.title }}</v-list-item-content>
        </v-list-item>
        <!-- Sales & Purchases Management Items -->
        <template v-if="hasPerm('sale-read')">
          <v-divider ></v-divider>
          <p class="my-3 text-center text-uppercase primary--text font-weight-black" color="primary"> Comptabilité </p>
          <v-divider></v-divider>
        </template>
        <v-list-item
          v-for="item in accountingItems"
          v-show="!item.permission || (item.permission && hasPerm(item.permission))"
          :key="item.title"
          :to="item.path"
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>{{ item.title }}</v-list-item-content>
        </v-list-item>
        <!-- Tools -->
        <template v-if="hasPerm('role-read') || hasPerm('user-read')">
          <v-divider ></v-divider>
          <p class="my-3 text-center text-uppercase primary--text font-weight-black" color="primary"> Outils </p>
          <v-divider></v-divider>
        </template>
        <v-list-item
          v-for="item in userRoleItems"
          v-show="!item.permission || (item.permission && hasPerm(item.permission))"
          :key="item.title"
          :to="item.path"
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>{{ item.title }}</v-list-item-content>
        </v-list-item>
        <!-- Sidebar Items -->
        <v-list-item
          v-for="item in sideBarItems"
          v-show="!item.permission || (item.permission && hasPerm(item.permission))"
          :key="item.title"
          :to="item.path"
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>{{ item.title }}</v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    
    <v-app-bar app color="#7957d5">
      <span class="">
        <v-app-bar-nav-icon color="white" @click="sidebar = !sidebar"></v-app-bar-nav-icon>
      </span>
      <v-toolbar-title>
        <router-link class="white--text" to="/" tag="span" style="cursor: pointer">
          {{ appTitle }}
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-xs-only">
        <v-btn
          class="white--text"
          text
          v-for="item in menuItems"
          :key="item.title"
          :to="item.path"
        >
          <v-icon left dark>{{ item.icon }}</v-icon>
          {{ item.title }}
        </v-btn>

        <!--  Log-out button -->
        <v-btn
          v-if="$store.getters.loggedIn"
          class="white--text"
          text
          @click="logout"
        >
          <v-icon left dark>mdi-logout</v-icon>
          Se déconnecter
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>
  </v-card>
</template>

<script>
export default {
  name: 'OldAppBar',
  methods: {
    hasPerm(permissionName) {
      return this.$store.state.permissions.find(perm => perm.name == permissionName || perm.name == 'dev') ? true:false
    },
    logout() {
      this.$swal({
        title: 'Confirmer la déconnexion',
        text: "Assurez-vous d'avoir enregistré toutes les données, puis cliquez sur confirmer!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmer',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          this.$store.commit('changeAuthToken', null);
          window.location = '/login'
        }
      })
    }
  },
  computed: {
    menuItems() {
      if ( !this.$store.getters.loggedIn ) {
        return [
          // { title: 'Accueil', path: '/', icon: 'mdi-home' },
          { title: 'Connexion', path: '/login', icon: 'mdi-lock' },
        ]
      } else {
        return [
          { title: 'Dashboard', path: '/dashboard', icon: 'mdi-home' },
          // { title: 'Se déconnecter', path: '/logout', icon: 'mdi-logout' },
        ]
      }
    },
    dashboardItems() {
      if ( !this.$store.getters.loggedIn )
        return []
      else
        return [
          { title: 'Dashboard', path: '/dashboard', icon: 'mdi-home' },
        ]
    },
    userRoleItems() {
      if ( !this.$store.getters.loggedIn ) {
        return [
        ]
      } else {
        return [
          { title: 'Rôles', path: '/role', icon: 'mdi-wrench', permission: 'dev' },
          { title: 'Utilisateurs', path: '/users', icon: 'mdi-account-group', permission: 'dev' },
          { title: 'Sociétés', path: '/companies', icon: 'fas fa-briefcase', permission: 'dev' },
        ]
      }
    },
    sideBarItems() {
      // let isLogged = await 
      if ( !this.$store.getters.loggedIn ) {
        return [
          // { title: 'Accueil', path: '/', icon: 'mdi-home' },
          { title: 'Connexion', path: '/login', icon: 'mdi-lock' },
        ]
      } else {
        // Sidebar LoggedIn Users
        return [
          // { title: 'Se déconnecter', path: '/logout', icon: 'mdi-logout' },
        ]
      }
    },
    productItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Marques', path: '/brands', icon: 'fa-trademark', permission: 'brand-read' },
          { title: 'Familles', path: '/categories', icon: 'mdi-shape', permission: 'category-read' },
          { title: 'Produits', path: '/products', icon: 'mdi-inbox-multiple', permission: 'product-read' },
        ]
      }
      return []
    },
    stockItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Mouvements de stocks', path: '/inventory-movements', icon: 'fa-warehouse', permission: 'inventory-read' },
        ]
      } else {
        return []
      }
    },
    salesPurchasesItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Clients', path: '/clients', icon: 'fa-handshake', permission: 'concern-read' },
          { title: 'Fournisseurs', path: '/providers', icon: 'fa-handshake', permission: 'concern-read' },
          { title: 'Achats', path: '/purchases', icon: 'fa-cart-shopping', permission: 'purchase-read' },
          { title: 'Ventes', path: '/sales', icon: 'fa-hand-holding-dollar', permission: 'sale-read' },
        ]
      } else {
        return []
      }
    },
    accountingItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'B.L / Factures', path: '/deliveryForm', icon: 'fas fa-file-invoice', permission: 'sale-read' },
          { title: 'Factures', path: '/invoice', icon: 'fas fa-file-invoice', permission: 'sale-read' },
          { title: 'E-Documents', path: '/documents', icon: 'fas fa-file', permission: 'document-read' },
        ]
      } else return []
    }
  },
  data() {
    return {
      appTitle: 'OUSSAMA LLC - Gestion Commercial',
      sidebar: false,
    }
  },
}
</script>
<style>
/* @media (min-width: 720px) {
  .v-navigation-drawer {
    display: none !important;
  }
} */

</style>