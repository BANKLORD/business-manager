import Vue from 'vue'
import VueRouter from 'vue-router'
// import Home from '../views/Home.vue'
/** middleware Pipeline for multiple middlewares */
import middlewarePipeline from './middlewarePipeline'
/** Middlewares */
import guest from './middlewares/guest'
import auth from './middlewares/auth'
/** Store */
import store from '../store'
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Connexion',
    meta: {
      middleware: [ guest ]
    },
    component: () => import(/* webpackChunkName: "login" */ '../views/Login.vue')
  },
  {
    path: '/dashboard',
    name: 'Tableau de bord',
    component: () => import(/* webpackChunkName: "dash" */ '../views/Dashboard.vue')
  },
  {
    path: '/login',
    name: 'Connexion',
    meta: {
      middleware: [ guest ]
    },
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "login" */ '../views/Login.vue')
  },
  {
    path: '/logout',
    name: 'Logout',
    // meta: {
    //   middleware: [ auth ]
    // },
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "logout" */ '../views/Logout.vue')
  },
  // {
  //   path: '/role',
  //   name: 'Rôles',
  //   meta: {
  //     middleware: [ auth ],
  //     icon: 'fa-trademark'
  //   },
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "roles" */ '../views/Role.vue')
  // },
  // {
  //   path: '/users',
  //   name: 'Utilisateurs',
  //   meta: {
  //     middleware: [ auth ]
  //   },
  //   component: () => import(/* webpackChunkName: "users" */ '../views/User.vue')
  // },
  {
    path: '/permissions',
    name: 'permissions',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "users" */ '../views/Permission.vue')
  },
  {
    path: '/services',
    name: 'Services',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "brands" */ '../views/Service.vue')
  },
  {
    path: '/brands',
    name: 'Marques',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "brands" */ '../views/Brand.vue')
  },
  {
    path: '/categories',
    name: 'Familles',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "categories" */ '../views/Category.vue')
  },
  {
    path: '/products',
    name: 'Produits',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "products" */ '../views/Product.vue')
  },
  {
    path: '/inventory',
    name: 'Inventory',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "inventory" */ '../views/Inventory.vue')
  },
  {
    path: '/providers',
    name: 'Fournisseurs',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "concerns" */ '../views/Provider.vue')
  },
  {
    path: '/clients',
    name: 'Clients',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "concerns" */ '../views/Client.vue')
  },
  {
    path: '/clients-status',
    name: 'Status client',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "clients status" */ '../views/ClientStatus.vue')
  },
  {
    path: '/concerns',
    name: 'Concern',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "concerns" */ '../views/Concern.vue')
  },
  {
    path: '/purchases',
    name: 'Achats',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "purchases" */ '../views/purchases/purchase.vue')
  },
  {
    path: '/purchase/order',
    name: 'Commandes',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "purchaseOrder" */ '../views/purchases/Order.vue')
  },
  {
    path: '/purchase/purchaseOrder',
    name: 'Bons de commande',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "purchasePurchaseOrders" */ '../views/purchases/purchaseOrder.vue')
  },
  {
    path: '/sales',
    name: 'Sale',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "sales" */ '../views/Sale.vue')
  },
  {
    path: '/invoice',
    name: 'Factures',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "sales" */ '../views/Invoice.vue')
  },
  {
    path: '/deliveryForm',
    name: 'B.L / Factures',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Deliveries" */ '../views/DeliveryForm.vue')
  },
  {
    path: '/company',
    name: 'Company',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "comapnies" */ '../views/Company.vue')
  },
  {
    path: '/inventory-movements',
    name: 'Mouvements',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "InventoryMovements" */ '../views/InventoryMovements.vue')
  },
  {
    path: '/inventory-status',
    name: 'Status',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "InventoryMovements" */ '../views/inventory/Status.vue')
  },
  {
    path: '/documents',
    name: 'E-Documents',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Documents" */ '../views/Documents.vue')
  },
  {
    path: '/sale/quotation',
    name: 'Devis',
    title: '',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Sales Quotations" */ '../views/sales/quotation.vue')
  },
  {
    path: '/sale/purchaseOrder',
    name: 'Bons de commande',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Sales PurchaseOrders" */ '../views/sales/purchaseOrder.vue')
  },
  {
    path: '/sale/deliveryForm',
    name: 'Bons de livraison ',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Sales DeliveryForms" */ '../views/sales/deliveryForm.vue')
  },
  {
    path: '/sale/invoice',
    name: 'Factures',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Sales Invoices" */ '../views/sales/invoice.vue')
  },
  {
    path: '/logs',
    name: 'logs',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "User Logs" */ '../views/UserLogs.vue')
  },
  {
    path: '/companies',
    name: 'Sociétés',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Companies" */ '../views/admin/Company.vue')
  },
  {
    path: '/test',
    name: 'test',
    meta: {
      middleware: [ auth ]
    },
    component: () => import(/* webpackChunkName: "Test Invoices" */ '../views/test/Test.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (!to.meta.middleware) {
    return next()
  }
  const middleware = to.meta.middleware
  const context = {
    to,
    from,
    next,
    store
  }
  return middleware[0]({
      ...context,
      next: middlewarePipeline(context, middleware, 1)
  })
})

export default router
