<template>
  <v-card tile class="p-0">
    <v-navigation-drawer class="ng-nav-bar" v-model="sidebar" app dark>
      <v-list>
        <!-- Dashboard Items -->
        <v-list-item class="text-center">
          <v-list-item-action>
            <v-icon>fa-user</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            {{$store?.getters?.getCompany?.name}}
            <!-- <img :src="$store?.getters?.getCompany?.Settings?."> -->
          </v-list-item-content>
        </v-list-item>
        <v-divider class="ng-nav-divider"></v-divider>
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
        <!-- Product Management Items -->
        <v-list-group
          v-if="hasPerm('brand-read') || hasPerm('product-read') || hasPerm('category-read')"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>
              <p
                class="my-3 text-left text-uppercase  font-weight-black"
                color="primary"
                style="font-size: 13px;"
              >
                Gestion De Produits
              </p>
            </v-list-item-title>
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
        <!-- Service Management Items -->
        <v-list-group
          v-if="hasPerm('service-read') && false"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>
              <p
                class="my-3 text-left text-uppercase  font-weight-black"
                color="primary"
                style="font-size: 13px;"
              >
                Gestion De Services
              </p>
            </v-list-item-title>
          </template>
          <v-list-item
            v-for="(item, index) in serviceItems"
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
        <!-- Stock Management Items -->
        <v-list-group
          v-if="hasPerm('inventory-read') && false"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>
              <p
                class="my-3 text-left text-uppercase font-weight-black"
                color="primary"
                style="font-size: 13px;"
              >
                Gestion De Stock
              </p>
            </v-list-item-title>
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
        </v-list-group>
        <!-- Sales & Purchases Management Items -->
        <v-list-group
          v-if="hasPerm('purchase-read')"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>
              <p
                class="my-3 text-uppercase font-weight-black text-left"
                style="font-size: 13px;"
              >
              Achats
              </p>
            </v-list-item-title>
          </template>
          <v-list-item
            v-for="(item, index) in purchasesItems"
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
        <v-list-group
          v-if="hasPerm('sale-read')"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>
              <p
                class="my-3 text-left text-uppercase  font-weight-black"
                style="font-size: 13px;"
              >
              Ventes
              </p>
            </v-list-item-title>
          </template>
          <v-list-item
            v-for="(item, index) in salesItems"
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
        <!-- Concerns Management Items -->
        <v-list-group
          v-if="hasPerm('concern-read')  && false"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>
              <p class="my-3 text-left text-uppercase  font-weight-black" color="primary" style="font-size: 13px;"> Clients & Fournisseurs </p>
            </v-list-item-title>
          </template>
          <v-list-item
            v-for="(item, index) in concernsItems"
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
        <!-- Accounting Items -->
        <v-list-group
          v-if="hasPerm('sale-read') && false"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>
              <p
                class="my-3 text-left text-uppercase font-weight-black"
                style="font-size: 13px;"
              >
              Comptabilité
              </p>
            </v-list-item-title>
          </template>
          <v-list-item
            v-for="(item, index) in accountingItems"
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
        <!-- Tools -->
        <template v-if="hasPerm('role-read') || hasPerm('user-read')">
          <v-divider ></v-divider>
          <p class="my-3 text-center text-uppercase  font-weight-black" color="primary"> Outils </p>
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

    <v-app-bar class="ng-app-bar" app tile>
      <span>
        <v-app-bar-nav-icon @click="sidebar = !sidebar"></v-app-bar-nav-icon>
      </span>
      <v-toolbar-title class="ng-breadcrumb">
        <ul id="breadcrumb">
          <li>
            <router-link to="/" tag="a">
              <v-icon
                class="icon"
                size="25"
                color="white"
              >
                mdi-home
              </v-icon>
            </router-link>
          </li>
          <li>
            <router-link to="/" tag="a">
              <v-icon
                left
                class="icon"
                size="25"
                color="white"
              >
                {{ routeIcon }}
              </v-icon>
              {{ routeName }}
            </router-link>
          </li>
        </ul>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-xs-only">
        <v-btn
          class="primary--text"
          icon
          v-for="item in menuItems"
          :key="item.title"
          :to="item.path"
        >
          <v-icon dark>{{ item.icon }}</v-icon>
          <!-- {{ item.title }} -->
        </v-btn>

        <!--  Log-out button -->
        <v-btn
          v-if="$store.getters.loggedIn"
          class="primary--text"
          text
          @click="logout"
        >
          <v-icon dark>mdi-logout</v-icon>
          <!-- Se déconnecter -->
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>
  </v-card>
</template>

<script>
export default {
  name: 'AppBar',
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
          this.$store.commit('changeCompany', null);
          window.location = '/'
        }
      })
    }
  },
  computed: {
    routeIcon() {
      const routeName = this.$route.icon;
      if ( routeName?.includes('|') )
        return this.$route.name.split('|')[1];
      return this.$route.icon;
    },
    routeName() {
      const routeName = this.$route.name;
      if ( routeName?.includes('|') )
        return this.$route.name.split('|')[0];
      return this.$route.name;
    },
    menuItems() {
      if ( !this.$store.getters.loggedIn ) {
        return [
          // { title: 'Accueil', path: '/', icon: 'mdi-home' },
          { title: 'Connexion', path: '/', icon: 'mdi-lock' },
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
          { title: 'Tableau de bord', path: '/dashboard', icon: 'mdi-home' },
        ]
    },
    userRoleItems() {
      if ( !this.$store.getters.loggedIn ) {
        return [
        ]
      } else {
        return [
          { title: 'Sociétés', path: '/companies', icon: 'fas fa-briefcase', permission: 'dev' },
          // { title: 'Rôles', path: '/role', icon: 'mdi-wrench', permission: 'dev' },
          // { title: 'Utilisateurs', path: '/users', icon: 'mdi-account-group', permission: 'dev' },
          { title: 'Persmissions', path: '/permissions', icon: "fa-solid fa-key", permission: 'dev' },
        ]
      }
    },
    sideBarItems() {
      // let isLogged = await
      if ( !this.$store.getters.loggedIn ) {
        return [
          // { title: 'Accueil', path: '/', icon: 'mdi-home' },
          { title: 'Connexion', path: '/', icon: 'mdi-lock' },
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
          { title: 'Familles', path: '/categories', icon: 'fa-table-cells-large', permission: 'category-read' },
          { title: 'Produits', path: '/products', icon: 'fa-box-open', permission: 'product-read' },
        ]
      }
      return []
    },
    serviceItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Services', path: '/services', icon: 'fa-solid fa-bars-progress', permission: 'brand-read' },
        ]
      }
      return []
    },

    stockItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Mouvements', path: '/inventory-movements', icon: 'mdi-truck-delivery', permission: 'inventory-read' },
          { title: 'Status', path: '/inventory-status', icon: 'mdi-package-variant-closed', permission: 'inventory-read' },
        ]
      } else {
        return []
      }
    },
    purchasesItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Commande', path: '/purchase/order', icon: 'mdi-note-edit', permission: 'purchase-read' },
          { title: 'Bons de commande', path: '/purchase/purchaseOrder', icon: 'fa-cart-shopping', permission: 'purchase-read' },
          { title: 'Achats', path: '/purchases', icon: 'fa-file-invoice', permission: 'purchase-read' },
          // { title: 'Bons de livraison', path: '/purchase/deliveryForms', icon: 'fa-file-lines', permission: 'purchase-read' },
          // { title: 'Factures', path: '/purchase/invoices', icon: 'fa-file-invoice', permission: 'purchase-read' },
        ]
      } else {
        return []
      }
    },
    salesItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Devis', path: '/sale/quotation', icon: 'fa-receipt', permission: 'sale-read' },
          { title: 'Bon de commandes', path: '/sale/purchaseOrder', icon: 'fa-cart-shopping', permission: 'sale-read' },
          { title: 'Bons de livraison', path: '/sale/deliveryForm', icon: 'fa-file-lines', permission: 'sale-read' },
          { title: 'Factures', path: '/sale/invoice', icon: 'fa-file-invoice', permission: 'sale-read' },
          // { title: 'Ventes', path: '/sales', icon: 'fa-hand-holding-dollar', permission: 'sale-read' },
        ]
      } else {
        return []
      }
    },
    concernsItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'Clients', path: '/clients', icon: 'fa-handshake', permission: 'concern-read' },
          { title: 'Fournisseurs', path: '/providers', icon: 'fa-handshake', permission: 'concern-read' },
          { title: 'Status clients', path: '/clients-status', icon: 'fa-chart-pie', permission: 'concern-read' },
        ]
      } else {
        return []
      }
    },
    accountingItems() {
      if ( this.$store.getters.loggedIn ) {
        return [
          { title: 'B.L / Factures', path: '/deliveryForm', icon: 'fa-file-pen', permission: 'sale-read' },
          { title: 'Factures', path: '/invoice', icon: 'fa-file-invoice', permission: 'sale-read' },
          { title: 'E-Documents', path: '/documents', icon: 'fas fa-file', permission: 'document-read' },
        ]
      } else return []
    }
  },
  data() {
    return {
      appTitle: 'OUSSAMA LLC - Gestion Commercial',
      sidebar: false,
      company: {},
    }
  },
  // created() {
  //   this.axios.get(`${process.env.VUE_APP_API_URL}/company`).then((res) => {
  //     this.company = res.data;
  //   });
  // },
  mounted() {
    this.axios.get(`${process.env.VUE_APP_API_URL}/company`).then((res) => {
      this.company = res.data;
    });
    console.log(this.company);
  }
}
</script>
<style>
/* @media (min-width: 720px) {
  .v-navigation-drawer {
    display: none !important;
  }
} */
.v-list-item__action i {
  width: 30px;
}
.ng-nav-bar .v-list-item {
  /* color: #fff!important; */
  margin: 15px;
}

.ng-nav-bar {
  background-image: url('https://i.pinimg.com/originals/d0/1c/33/d01c33995b809edc770e26355c9bb6ee.jpg');
  background-color: #000000c0!important;
  background-blend-mode: multiply;
}

.ng-nav-divider {
  margin: 0 15px;
}

.ng-nav-bar .v-list-item--active::before {
  border-radius: 5px;
}

#breadcrumb {
  list-style: none;
  display: inline-block;
  transform: translateY(5px);
}
#breadcrumb .icon {
  font-size: 14px;
}
#breadcrumb li {
  float: left;
}
#breadcrumb li a {
  color: #FFF;
  display: block;
  background: #7857d5;
  text-decoration: none;
  position: relative;
  height: 40px;
  line-height: 40px;
  padding: 0 10px 0 5px;
  text-align: center;
  margin-right: 23px;
}
#breadcrumb li:nth-child(even) a {
  background-color: #7857d5;
}
#breadcrumb li:nth-child(even) a:before {
  border-color: #7857d5;
  border-left-color: transparent;
}
#breadcrumb li:nth-child(even) a:after {
  border-left-color: #7857d5;
}
#breadcrumb li:first-child a {
  padding-left: 15px;
  -moz-border-radius: 4px 0 0 4px;
  -webkit-border-radius: 4px;
  border-radius: 4px 0 0 4px;
}
#breadcrumb li:first-child a:before {
  border: none;
}
#breadcrumb li:last-child a {
  padding-right: 15px;
  -moz-border-radius: 0 4px 4px 0;
  -webkit-border-radius: 0;
  border-radius: 0 4px 4px 0;
}
#breadcrumb li:last-child a:after {
  border: none;
}
#breadcrumb li a:before, #breadcrumb li a:after {
  content: "";
  position: absolute;
  top: 0;
  border: 0 solid #7857d5;
  border-width: 20px 10px;
  width: 0;
  height: 0;
}
#breadcrumb li a:before {
  left: -20px;
  border-left-color: transparent;
}
#breadcrumb li a:after {
  left: 100%;
  border-color: transparent;
  border-left-color: #7857d5;
}
#breadcrumb li a:hover {
  background-color: #7857d5c7;
}
#breadcrumb li a:hover:before {
  border-color: #7857d5c7;
  border-left-color: transparent;
}
#breadcrumb li a:hover:after {
  border-left-color: #7857d5c7;
}
#breadcrumb li a:active {
  background-color: #7857d5c7;
}
#breadcrumb li a:active:before {
  border-color: #7857d5c7;
  border-left-color: transparent;
}
#breadcrumb li a:active:after {
  border-left-color: #7857d5c7;
}
.left {
  text-align: left;
}
</style>
