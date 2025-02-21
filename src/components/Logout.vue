<template>
  <button @click="logout" class="btn btn-danger">Wyloguj</button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Backend } from '@/main';
import { setLoggedInStatus, setUserRole } from '@/stores/authStore';

const router = useRouter();

function logout() {
  sessionStorage.removeItem('attend-me:userAuthData');
  sessionStorage.removeItem('attend-me:userRole');
  Backend.userTokenResult = undefined;
  setLoggedInStatus(false);
  setUserRole(null);
  router.push('/login');
}
</script>
