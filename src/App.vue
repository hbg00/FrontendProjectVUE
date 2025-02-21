<template>
  <header class="app-header navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">AttendMe</a>

      <div class="d-flex">
        <Logout v-if="isLoggedIn" />
      </div>
    </div>
  </header>

  <main class="container mt-4">
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { isLoggedIn } from '@/stores/authStore';
import Logout from '@/components/Logout.vue';
</script>

<style scoped>
.app-header {
  padding: 10px 20px;
}
</style>
