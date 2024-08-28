import Vue from 'vue'
import axios from './plugins/axios'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
// Moment for date format
import moment from 'moment'
// Sweet Alert
import VueSweetalert2 from 'vue-sweetalert2';
Vue.use(VueSweetalert2);
// If you don't need the styles, do not connect
import './assets/sweetalert2.min.css';
import './assets/styles.css'
import store from './store';
import { NumberToLetter } from './plugins/num2Letter';

Vue.config.productionTip = false

Vue.filter('numToDirhams', function(value) {
  if (value) {
    var isFloat = value.toString().includes('.');
    if (!isFloat)
      return `${NumberToLetter(String(value))} DIRHAMS`;

    let numbers = value.toString().split('.')[0];
    let decimals = parseFloat(value.toFixed(2)).toString().split('.')[1];
    return `${NumberToLetter(numbers)} DIRHAMS ET ${NumberToLetter(decimals)} CENTIMES`;
  }
})

Vue.filter('numToLetter', function(value) {
  if (value) {
    var isFloat = value.toString().includes('.');
    if (!isFloat)
      return NumberToLetter(String(value));

    let numbers = value.toString().split('.')[0];
    return NumberToLetter(numbers);
  }
})

Vue.filter('formatDate', function(value) {
  if (value) {
    return moment(String(value)).format('DD/MM/YYYY')
  }
})

Vue.filter('formatDateForDatePicker', function(value) {
  if (value) {
    return moment(String(value)).format('yyyy-MM-DD')
  }
})
function getMonthNameInFrench(monthNumber) {
  switch (parseInt(monthNumber)) {
    case 1:
      return "Janvier";
    case 2:
      return "Février";
    case 3:
      return "Mars";
    case 4:
      return "Avril";
    case 5:
      return "Mai";
    case 6:
      return "Juin";
    case 7:
      return "Juillet";
    case 8:
      return "Août";
    case 9:
      return "Septembre";
    case 10:
      return "Octobre";
    case 11:
      return "Novembre";
    case 12:
      return "Décembre";
    default:
      return "Invalid Month";
  }
}

Vue.filter('getMonthName', function(month) {
  if (month) {
    return getMonthNameInFrench(month);
  }
  return month;
})

Vue.filter('formatQuantity', function(value) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value) {
    return formatter.format(value).replace(/,/g, ' ');
  } else return '0.00'; 
})

Vue.filter('formatPriceWithoutCurrency', function(value) {
  const formatter = new Intl.NumberFormat('it-IT', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value) {
    return formatter.format(value);
  } else return '0.00'; 
})

// Vue.filter('formatPriceWithoutCurrency', function(value) {
//   if (value) {
//     return new Intl.NumberFormat('de-DE', {
//       style: 'currency',
//       currency: 'EUR',
//     }).formatToParts(value).map(
//         p => p.type != 'literal' && p.type != 'currency' ? p.value : ''
//     ).join('')
//     // return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', currencyDisplay: "none" }).format(value);
//   } else return '0,00'; 
// })

Vue.filter('formatPrice', function(value) {
  if (value) {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'MAD' }).format(value);
  } else return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'MAD' }).format(0.00); 
})

Vue.filter('formatPaidPrice', function(value) {
  if (value) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(value);
  } else
    return 'N/P'
})

Vue.filter('formatNumber', function(value) {
  if (value) {
    return new Intl.NumberFormat('fr-FR').format(value);
  } else
    return 0;
});

Vue.filter('formatPaymentMethod', function(method) {
  switch (method) {
    case "PromissoryNote":
      return "Effet";
    case "BankTransfer":
      return "Virement";
    case "Check":
      return "Chèque";
    case "Cash":
      return "Espèces";
    default:
      return method;
  }
});

// import dotEnv from 'dotenv'
// dotEnv.config();
new Vue({
  axios,
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')