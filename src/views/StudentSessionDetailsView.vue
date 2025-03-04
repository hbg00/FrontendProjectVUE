<template>
  <div class="container mt-4">
    <h2 class="mb-3">Szczegóły zajęć</h2>

    <div v-if="session">
      <h3>{{ session.courseName ?? 'Brak nazwy' }} - {{ session.courseGroupName ?? 'Brak grupy' }}</h3>
      <p><strong>Termin:</strong> {{ formatDate(session.dateStart ?? null) }} - {{ formatDate(session.dateEnd ?? null) }}</p>
      <p><strong>Lokalizacja:</strong> {{ session.locationName ?? 'Brak lokalizacji' }}</p>
      <p><strong>Sala:</strong> {{ session.roomName ?? 'Brak informacji o sali' }}</p>

      <div class="alert" :class="wasUserPresent ? 'alert-success' : 'alert-danger'">
        <h5>Obecność na tych zajęciach:</h5>
        <span>{{ wasUserPresent ? "Obecny" : "Nieobecny" }}</span>
      </div>

      <div class="mb-3">
        <h5>Frekwencja na kursie:</h5>
        <p>Obecności: {{ totalAttendances }} / {{ totalSessions }} ({{ attendancePercentage }}%)</p>
      </div>

      <div class="progress mb-3">
        <div
          class="progress-bar"
          role="progressbar"
          :style="{ width: `${attendancePercentage}%` }"
          aria-valuenow="attendancePercentage"
          aria-valuemin="0"
          aria-valuemax="100">
          {{ totalAttendances }} / {{ totalSessions }}
        </div>
      </div>

      <button @click="goBack" class="btn btn-primary">Powrót do Panelu Studenta</button>
    </div>

    <div v-if="!session && !isLoading" class="alert alert-warning">
      Brak danych o zajęciach.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Backend } from '@/main';
import type { CourseSessionListItem } from '@/backend/AttendMeBackendClientBase';

interface ExtendedCourseSession extends CourseSessionListItem {
  roomName?: string;
}

const route = useRoute();
const router = useRouter();
const wasUserPresent = ref(false);
const isLoading = ref(false);
const session = ref<ExtendedCourseSession | null>(null);
const errorMessage = ref<string | null>(null);
const totalAttendances = ref(0);
const totalSessions = ref(1);
const attendancePercentage = ref(0);
let refreshInterval: number | null = null;

async function fetchSessionDetails() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const sessionId = Number(route.params.id);
    const sessionResponse = await Backend.courseStudentSessionsGet({ pageNumber: 1, pageSize: 99999 });
    session.value = sessionResponse.items.find(s => s.courseSessionId === sessionId) || null;
    if (!session.value) {
      errorMessage.value = "Nie znaleziono szczegółów sesji.";
      return;
    }
    const courseGroupId = session.value.courseGroupId;
    const allSessions = await Backend.courseStudentGroupSessionsGet(courseGroupId);
    const attendanceRecords = await Backend.courseStudentAttendanceGet(courseGroupId);

    totalSessions.value = allSessions.length;
    totalAttendances.value = attendanceRecords.length;
    attendancePercentage.value = totalSessions.value ? Math.round((totalAttendances.value / totalSessions.value) * 100) : 0;
    wasUserPresent.value = attendanceRecords.some(record => record.courseSessionId === sessionId);
  } catch (err) {
    console.error("Błąd ładowania danych:", err);
    errorMessage.value = "Błąd podczas ładowania danych.";
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
  router.push({ name: "studentDashboardView" });
}

function formatDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return "Brak daty";

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return "Nieprawidłowa data";

  return date.toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}


onMounted(() => {
  fetchSessionDetails();
  refreshInterval = setInterval(fetchSessionDetails, 30000) as unknown as number;
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
</style>
