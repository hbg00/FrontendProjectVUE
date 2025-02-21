<template>
    <component :is="dashboardComponent" v-if="isLoggedIn" />
  </template>

  <script setup lang="ts">
  import { computed, watchEffect } from 'vue';
  import { useRouter } from 'vue-router';
  import { isLoggedIn, userRole } from '@/stores/authStore';
  import TeacherDashboardView from '@/views/TeacherDashboardView.vue';
  import StudentDashboardView from '@/views/StudentDashboardView.vue';

  const router = useRouter();

  const dashboardComponent = computed(() =>
    userRole.value === 'teacher' ? TeacherDashboardView : StudentDashboardView
  );

  watchEffect(() => {
    if (!isLoggedIn.value) {
      router.push('/login');
    }
  });
  </script>
