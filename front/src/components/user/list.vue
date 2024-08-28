<template>
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
          <v-icon right dark> mdi-plus </v-icon>
        </v-btn>
      </div>
    </template>
    <template
      v-if="
        $store.getters.hasPerm('user-update') ||
        $store.getters.hasPerm('user-delete')
      "
      v-slot:[`item.actions`]="{ item }"
    >
      <v-btn
        color="primary"
        icon
        v-if="$store.getters.hasPerm('user-update')"
        @click="showEditNewUserCard(item)"
      >
        <v-icon small> mdi-pencil </v-icon>
      </v-btn>
      <v-btn
        color="red"
        class="mr-2"
        icon
        v-if="$store.getters.hasPerm('user-delete')"
        @click="showDeleteConfirm(item)"
      >
        <v-icon small> mdi-delete </v-icon>
      </v-btn>
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: {
    
  }
};
</script>

<style></style>
