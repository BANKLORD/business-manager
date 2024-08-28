<template>
<v-container fill-height fluid max-width="1024px">
  <v-row align="center" justify="center" max-width="1024px">
    <v-col class="text-center" cols="12">
      <h2 class="mx-100"> Bienvenue dans votre application! <br> veuillez vous connecter pour accéder à votre tableau de bord </h2>
    </v-col>
    <v-col cols="8" v-if="error.exist">
      <v-alert v-model="error.exist" dismissible color="warning" dark border="left">
        {{ error.message }}
      </v-alert>
    </v-col>
    <v-col cols="12"></v-col>
    <v-card class="elevation-12" max-width="1024px">
      <div>
        <v-tabs v-model="tab" show-arrows background-color="primary" icons-and-text dark grow>
          <v-tabs-slider color="purple darken-4"></v-tabs-slider>
          <v-tab v-for="(i, index) in tabs" :key="`tab_${index}`">
            <v-icon large>{{ i.icon }}</v-icon>
            <div class="caption py-1">{{ i.name }}</div>
          </v-tab>
          <v-tab-item>
            <v-card class="px-4">
              <v-card-text>
                <v-form ref="loginForm" v-model="valid" lazy-validation>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field v-on:keyup.enter="validate" v-model="loginUsername" :rules="[rules.required]" label="Nom d'utilisateur" required></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-on:keyup.enter="validate" v-model="loginPassword" :append-icon="show1?'mdi-eye':'mdi-eye-off'" :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" name="input-10-1" label="Mot de passe" hint="Au moins 8 caractères" counter @click:append="show1 = !show1"></v-text-field>
                    </v-col>
                    <v-col class="d-flex" cols="12" sm="6" xsm="12">
                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col class="d-flex" cols="12" sm="3" xsm="12" align-end>
                      <v-btn block :disabled="!valid" color="primary" @click="validate"> Se connecter</v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item v-if="!isRegisterDisabled">
            <v-card class="px-4">
              <v-card-text>
                <v-form ref="registerForm" v-model="valid" lazy-validation>
                  <v-row>
                    <v-col cols="12" sm="6" md="6">
                      <v-text-field v-model="firstName" :rules="[rules.required]" label="First Name" maxlength="20" required></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="6">
                      <v-text-field v-model="lastName" :rules="[rules.required]" label="Last Name" maxlength="20" required></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="password" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" name="input-10-1" label="Password" hint="At least 8 characters" counter @click:append="show1 = !show1"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field block v-model="verify" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" :rules="[rules.required, passwordMatch]" :type="show1 ? 'text' : 'password'" name="input-10-1" label="Confirm Password" counter @click:append="show1 = !show1"></v-text-field>
                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col class="d-flex ml-auto" cols="12" sm="3" xsm="12">
                      <v-btn
                        block
                        :disabled="!valid"
                        color="primary"
                        @click="validate"
                      >
                        Register
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item v-else>
            <v-card class="px-4">
              <v-card-text>
                <h2> L'inscription est désactivée </h2>
              </v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </div>
    </v-card>
  </v-row>
  <!-- Loading Dialog -->
  <v-dialog
    v-model="loginLoading"
    persistent
    width="300"
  >
    <v-card
      color="primary"
      dark
    >
      <v-card-text>
        Veuillez patienter
        <v-progress-linear
          indeterminate
          color="white"
          class="mb-0"
        ></v-progress-linear>
      </v-card-text>
    </v-card>
  </v-dialog>
</v-container>
</template>

<script>
export default {
  computed: {
    passwordMatch() {
      return () => this.password === this.verify || "Password must match";
    }
  },
  methods: {
    validate() {
      // formData.append('username', this.loginUsername);
      // formData.append('password', this.loginPassword);
      const data = {
        username: this.loginUsername,
        password: this.loginPassword,
      }
      if (this.$refs.loginForm.validate()) {
        this.loginLoading = true;
        this.axios.post(`${process.env.VUE_APP_API_URL}/login`,
          data
        ).then(res => {
          this.$store.commit('changeAuthToken', res.data);
          this.$router.push({ name: 'Tableau de bord' })
          this.loginLoading = false;
        }).catch(err => {
          this.error.exist = true;
          this.error.message = err.response?.data ? err.response?.data:`Erreur de connexion: impossible d'établir une connexion avec le serveur. S'il vous plaît, vérifiez votre connexion à internet et réessayez. Si le problème persiste, veuillez contacter le service client pour obtenir de l'aide.`;
          this.loginLoading = false;
        });
      }
    },
    reset() {
      this.$refs.form.reset();
    },
    resetValidation() {
      this.$refs.form.resetValidation();
    }
  },
  data: () => ({
    loginLoading: false,
    error: { exist: false, message: '' },
    isRegisterDisabled: true,
    dialog: true,
    tab: 0,
    tabs: [
      { name:"Connexion", icon:"mdi-account" },
      { name:"Inscription", icon:"mdi-account-outline" }
    ],
    valid: true,
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    verify: "",
    loginUsername: "",
    loginPassword: "",
    loginEmail: "",
    loginEmailRules: [
      v => !!v || "Required",
      v => /.+@.+\..+/.test(v) || "E-mail must be valid"
    ],
    emailRules: [
      v => !!v || "Required",
      v => /.+@.+\..+/.test(v) || "E-mail must be valid"
    ],
    show1: false,
    rules: {
      required: value => !!value || "Required.",
      min: v => (v && v.length >= 8) || "Min 8 characters"
    }
  })
}
</script>

<style>

</style>