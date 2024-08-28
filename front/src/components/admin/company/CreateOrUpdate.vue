<template>
  <v-container fluid>
    <v-card elevation="1">
      <v-tabs v-model="tabIndex" fixed-tabs>
        <!-- tabs -->
        <v-tab>
          <v-icon left>
            fas fa-briefcase
          </v-icon>
          Information
        </v-tab>
        <v-tab>
          <v-icon left>
            fas fa-cog
          </v-icon>
          Settings
        </v-tab>
        <v-tab>
          <v-icon left>
            mdi-attachment
          </v-icon>
          Attachments
        </v-tab>
        <v-tab v-if="company.id > 0">
          <v-icon left>
            fa-solid fa-users
          </v-icon>
          Users
        </v-tab>
        <v-tab v-if="company.id > 0">
          <v-icon left>
            mdi-wrench
          </v-icon>
          Roles
        </v-tab>
        <!-- items -->
        <!-- Information -->
        <v-tab-item >
          <v-card flat>
            <v-card-text>
              <h2 class="text-center text-uppercase my-5">
                Company Name & Number
              </h2>
              <v-row justify="center">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Compane Name"
                    v-model="company.name"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Compane ICE/Number"
                    v-model="company.ICE"
                  ></v-text-field>
                </v-col>
              </v-row>
              <h2 class="text-center my-5">
                Address Information
              </h2>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Country"
                    v-model="company.country"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="City"
                    v-model="company.city"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Address"
                    v-model="company.address"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="ZIP Code"
                    v-model="company.zip"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-tab-item>
        <!-- Settings -->
        <v-tab-item>
          <v-card flat>
            <v-card-text>
              <!-- <h2 class="text-center text-uppercase my-5">
                Company Name & Number
              </h2> -->
              <v-row justify="center">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Default VAT Value"
                    v-model="settings.vat"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="settings.industryType"
                    label="Industry Type"
                    :items="industryTypes"
                    item-text="text"
                    item-value="value"
                  ></v-select>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-tab-item>
        <!-- Attachments -->
        <v-tab-item>
          <v-card flat>
            <v-card-text>
              <!-- Logo -->
              <v-row justify="center">
                <v-col cols="12" md="6">
                  <v-file-input
                    v-model="logoFile"
                    label="Upload Logo"
                    accept="image/*"
                    @change="logoChanged"
                  ></v-file-input>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="company.logoLink"
                    label="Logo link"
                    placeholder="https://example.com/logo.png"
                  ></v-text-field>
                </v-col>
                <v-col class="text-center" v-if="company.logoLink" cols="12">
                  <p> Logo preview </p>
                  <img v-bind:src="company.logoLink" style="max-height: 250px;width:auto;">
                </v-col>
              </v-row>
              <!-- Footer -->
              <v-row justify="center">
                <v-col cols="12" md="6">
                  <v-file-input
                    v-model="footerFile"
                    label="Upload Footer"
                    accept="image/*"
                    @change="footerChanged"
                  ></v-file-input>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="company.footerLink"
                    label="Footer link"
                    placeholder="https://example.com/footer.png"
                  ></v-text-field>
                </v-col>
                <v-col class="text-center" v-if="company.footerLink" cols="12">
                  <p> Footer preview </p>
                  <img v-bind:src="company.footerLink" style="max-height: 250px;width:auto;">
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-tab-item>
        <!-- Users -->
        <v-tab-item
          v-if="company.id > 0"
        >
          <v-card flat>
            <v-card-text>
              <Users :companyId="company.id" class="my-8"/>
            </v-card-text>
          </v-card>
        </v-tab-item>
        <!-- Roles -->
        <v-tab-item
          v-if="company.id > 0"
        >
          <v-card flat>
            <v-card-text>
              <Roles :companyId="company.id" />
            </v-card-text>
          </v-card>
        </v-tab-item>
      </v-tabs>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :loading="loading"
          :disabled="loading"
          color="primary"
          @click="save()"
        >
          Save <v-icon right>fas fa-save</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import Users from "@/components/admin/company/Users.vue";
import Roles from "@/components/admin/company/Roles.vue";
export default {
  components: {Users, Roles},
  computed: {
    userTabSelected() {
      return this.tabIndex === 3
    }
  },
  data: () => {
    return {
      loading: false,
      logoFile: null,
      footerFile: null,
      tabIndex: 0,
      company: { id: 0 },
      settings: { id: 0 },
      industryTypes: [],
    }
  },
  props: {
    _company: Object,
    _settings: Object,
  },
  created() {
    this.axios.get(`${process.env.VUE_APP_API_URL}/company/types`).then((res) => { this.industryTypes = res.data });
    this.company = this._company;
    this.settings = this._settings ?? { id: 0 };
  },
  methods: {
    async uploadFile(file) {
      // const file = this.$refs.fileInput.files[0]
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await this.axios.post(`${process.env.VUE_APP_API_URL}/upload`, formData);
        const link = res.data.url // the response data {success: Boolean, url: String} contains the url
        return link;
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    },
    async logoChanged(file) {
      if ( !file ) return;
      this.loading = true;
      const url = await this.uploadFile(file)
      this.company.logoLink = url;
      this.loading = false;
    },
    async footerChanged(file) {
      if ( !file ) return;
      this.loading = true;
      const url = await this.uploadFile(file)
      this.company.footerLink = url;
      this.loading = false;
    },
    save() {
      // console.log(this.company);
      // console.log(this.settings);
      this.loading = true;
      const method = this.company.id ? 'PUT':'POST';
      const url = this.company.id ? `${process.env.VUE_APP_API_URL}/company/${this.company.id}`:`${process.env.VUE_APP_API_URL}/company/`
      const data = {
        company: this.company,
        settings: this.settings,
      }
      this.axios({
        url: url,
        method: method,
        data: data,
      }).then(() => {
        this.$emit('saved');
        this.loading = false;
        this.$swal( 'Success!', 'Les modifications ont été effectuées avec succès.', 'success' );
      }).catch(() => {
        this.loading = false;
        console.log('error');
        this.$swal( 'Error!', 'An error has occured check logs.', 'warning' );
      })
    }
  }
}
</script>
