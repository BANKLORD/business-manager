<template>
  <v-container>
    <!-- <h1 class="text-center"> User logs </h1> -->
    <v-alert 
      type="info" 
      icon="mdi-information-outline" 
      :value="true" 
    >
      <h3 class="headline font-weight-bold mb-2">Présentation de l'activité des utilisateurs</h3>
      <p>
        Restez informé de l'activité des utilisateurs et assurez la sécurité et l'intégrité de vos données.
        Passez en revue un aperçu complet de toutes les actions de l'utilisateur, y compris les opérations de création,
        de lecture, de mise à jour et de suppression dans une vue chronologique.
      </p>
    </v-alert>
    <v-card>
      <v-card-text>
        <v-row class="justify-center text-center">
          <v-col cols="5">
            <DatePicker label="Date de début" v-model="selectedStartDate"></DatePicker>
          </v-col>
          <v-col cols="5">
            <DatePicker label="Date de fin" v-model="selectedEndDate"></DatePicker>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              label="Société"
              v-model="selectedCompany.id"
              :items="companiesSelection"
              item-text="name"
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              label="Utilisateur"
              v-model="selectedUser.id"
              :items="usersSelection"
              item-text="username"
              item-value="id"
            ></v-autocomplete>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card tile>
      <v-card-text>

        <v-timeline align-top dense>
          <template v-for="(yearData, year) in logs">
            <v-timeline-item color="pink" small :key="`log_${year}`">
              <v-row class="pt-1">
                <v-col cols="3">
                  <strong>{{ year }}</strong>
                </v-col>
              </v-row>
            </v-timeline-item>
            <template v-for="(monthData, month) in yearData">
              <v-timeline-item color="pink" small :key="`log_${year}_${month}`">
                <v-row class="pt-1">
                  <v-col cols="3">
                    <strong>{{ month | getMonthName }}</strong>
                  </v-col>
                </v-row>
              </v-timeline-item>
              <template v-for="(dayData, day) in monthData">
                <v-timeline-item color="pink" small :key="`log_${year}_${month}_${day}`">
                  <v-row class="pt-1" v-for="log in dayData" :key="`log_${year}_${month}_${day}_${log.id}`">
                    <v-col cols="3">
                      <strong>{{ log.createdAt | formatDate }}</strong>
                    </v-col>
                    <v-col>
                      <!-- <strong>{{ log.method }}</strong> -->
                      <div class="text-caption">
                        <v-simple-table dense>
                          <thead>
                            <tr>
                              <th>METHODE</th>
                              <th>SOCIÉTÉ</th>
                              <th>UTILISATEUR</th>
                              <th>TABLE</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>CREATE</td>
                              <td>{{ log.company.name }}</td>
                              <td>{{ log.user.username }}</td>
                              <td>{{ log.tableName }}</td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                        <template v-if="log.oldRow">
                          <strong> Old Row</strong>
                          <v-simple-table dense>
                            <thead>
                              <tr>
                                <th v-for="(value, column) in JSON.parse(log.oldRow)" :key="`log-item_${column}_${value}`">
                                  {{ column }}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td v-for="(value, column) in JSON.parse(log.oldRow)" :key="`log-item_${value}_${column}`">
                                  <template v-if="column == 'createdAt' || column == 'updatedAt'">
                                    {{ value | formatDate }}
                                  </template>
                                  <template v-else>{{ value }}</template>
                                </td>
                              </tr>
                            </tbody>
                          </v-simple-table>
                        </template>
                        <template v-if="log.newRow">
                          <strong> New Row</strong>
                          <v-simple-table dense>
                            <thead>
                              <tr>
                                <th v-for="(value, column) in JSON.parse(log.newRow)" :key="`log-item_${column}_${value}`">
                                  {{ column }}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td v-for="(value, column) in JSON.parse(log.newRow)" :key="`log-item_${value}_${column}`">
                                  <template v-if="column == 'createdAt' || column == 'updatedAt'">
                                    {{ value | formatDate }}
                                  </template>
                                  <template v-else>{{ value }}</template>
                                  
                                </td>
                              </tr>
                            </tbody>
                          </v-simple-table>
                        </template>
                        <!-- <table>
                          <tr>
                            <td>Old Row:</td>
                            <td>{{ log.oldRow }}</td>
                          </tr>
                          <tr>
                            <td>New Row:</td>
                            <td>{{ log.newRow }}</td>
                          </tr>
                        </table> -->
                      </div>
                    </v-col>
                  </v-row>
                </v-timeline-item>
              </template>
            </template>
          </template>
        </v-timeline>

      </v-card-text>
    </v-card>
  </v-container>
</template>
<script>
import DatePicker from '../components/DatePicker.vue';

export default {
  components: { DatePicker },
  data() {
    return {
      selectedStartDate: undefined,
      selectedEndDate: new Date().toDateString(),
      selectedCompany: {
        id: -1,
        name: 'Tous'
      },
      companies: [],
      selectedUser: {
        id: -1,
        username: 'Tous'
      },
      users: [],
      logs: [],
    };
  },
  computed: {
    companiesSelection() {
      const companies = this.companies;
      companies.unshift({ id: -1, name: 'Tous' });
      return companies;
    },
    usersSelection() {
      const users = this.users;
      users.unshift({ id: -1, username: 'Tous' });
      return users;
    }
  },
  watch: {
    'selectedCompany.id'() {
      this.loadUsers();
      // Load data if selected user is already -1
      if ( this.selectedUser.id < 0 && this.selectedCompany.id < 0 )
        this.loadLogs();
      // reset current selected user to all users in the current company
      this.selectedUser = Object.assign({}, {
        id: -1,
        username: 'Tous'
      });
    },
    'selectedUser.id'() {
      this.loadLogs();
    }
  },
  methods: {
    loadUsers() {
      const query = {};
      if ( this.selectedCompany.id > 0 )
        query.companyId = this.selectedCompany.id;
      this.axios.get(
        `${process.env.VUE_APP_API_URL}/users`,
        { params: query }
      ).then((res) => {
        this.users = res.data;
      });
    },
    loadLogs() {
      const query = {};
      if ( this.selectedCompany.id > 0 )
        query.companyId = this.selectedCompany.id;
      if ( this.selectedUser.id > 0 )
        query.userId = this.selectedUser.id;
      // Fetch and request data from API
      this.axios.get(
        `${process.env.VUE_APP_API_URL}/logs`,
        { params: query }
      ).then((res) => {
        this.logs = res.data;
      });
    }
  },
  created() {
    this.axios.get(
      `${process.env.VUE_APP_API_URL}/companies`
    ).then((res) => {
      this.companies = res.data;
      this.loadUsers();
    });
    this.loadLogs();
  }

}
</script>