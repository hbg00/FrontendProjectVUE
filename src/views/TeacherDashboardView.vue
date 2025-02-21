<template>
  <div class="container mt-4">
    <h2>Pulpit Wykładowcy</h2>

    <div class="filters mb-3">
      <label for="filterType" style="min-width: 98px;">Filtruj zajęcia:</label>
      <select id="filterType" v-model="filterType" @change="fetchSessions" class="form-select">
        <option value="all">Wszystkie</option>
        <option value="today">Dziś</option>
        <option value="tomorrow">Jutro</option>
        <option value="week">Następny tydzień</option>
        <option value="past">Minione</option>
      </select>

      <input
        v-model="searchQuery"
        placeholder="Wyszukaj zajęcia..."
        @input="debouncedSearch"
        class="form-control mt-2 mt-md-0 ms-md-2" />
    </div>

    <div v-if="isLoading" class="alert alert-info">Ładowanie...</div>

    <div v-if="sessions.length === 0 && !isLoading" class="alert alert-warning">
      Brak zajęć do wyświetlenia.
    </div>

    <div class="table-responsive">
      <table v-if="sessions.length > 0" class="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>Nazwa kursu</th>
            <th>Grupa</th>
            <th>Data</th>
            <th>Godzina</th>
            <th>Lokalizacja</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.courseSessionId" @click="goToSessionDetails(session.courseSessionId)">
            <td>{{ session.courseName }}</td>
            <td>{{ session.courseGroupName }}</td>
            <td>{{ formatDate(session.dateStart) }}</td>
            <td>{{ formatDateToHour(session.dateStart) }} - {{ formatDateToHour(session.dateEnd) }}</td>
            <td>{{ session.locationName }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Backend } from '@/main';
import type { CourseSessionListItem, CourseSessionListFiltersPagedListParams } from '@/backend/AttendMeBackendClientBase';

const router = useRouter();
const sessions = ref<CourseSessionListItem[]>([]);
const isLoading = ref(false);
const filterType = ref<string>('all');
const searchQuery = ref<string>('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchSessions, 500);
}

async function fetchSessions() {
  isLoading.value = true;
  try {
    const now = new Date();
    const filters: CourseSessionListFiltersPagedListParams = {
      pageNumber: 1,
      pageSize: 99999,
      filters: {},
    };

    if (searchQuery.value.trim() !== '') {
      filters.filters!.search = searchQuery.value;
    }

    switch (filterType.value) {
      case 'today':
        filters.filters!.dateStart = new Date(now.setHours(0, 0, 0, 0));
        filters.filters!.dateEnd = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'tomorrow':
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        filters.filters!.dateStart = new Date(tomorrow.setHours(0, 0, 0, 0));
        filters.filters!.dateEnd = new Date(tomorrow.setHours(23, 59, 59, 999));
        break;
      case 'week':
        filters.filters!.dateStart = new Date(now.setHours(0, 0, 0, 0));
        filters.filters!.dateEnd = new Date(now.setDate(now.getDate() + 7));
        break;
      case 'past':
        filters.filters!.dateEnd = new Date(now.setHours(0, 0, 0, 0));
        break;
    }

    const response = await Backend.courseTeacherSessionsGet(filters);
    sessions.value = response.items ?? [];
  } catch (error) {
    console.error('Błąd pobierania zajęć:', error);
  } finally {
    isLoading.value = false;
  }
}

function formatDate(date: Date | undefined): string {
  if (!date) return "Brak daty";
  return new Date(date).toLocaleDateString() + "";
}

function formatDateToHour(date: Date | undefined): string {
  let minutes;
  if (!date) return "Brak daty";
  if (date.getMinutes() === 0) {
    minutes = "00";
  } else {
    minutes = date.getMinutes();
  }
  return new Date(date).getHours() + ":" + minutes;
}

function goToSessionDetails(sessionId: number) {
  router.push({ name: 'sessionDetails', params: { id: sessionId } });
}

watch(filterType, fetchSessions);
watch(searchQuery, debouncedSearch);

onMounted(fetchSessions);
</script>

<style scoped>
.dashboard-container {
  max-width: 1000px;
  margin: auto;
  padding: 20px;
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filters select,
.filters input {
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 5px;
  background: #f8f9fa;
  color: #495057;
}

.table-responsive {
  margin-top: 20px;
}

.table {
  width: 100%;
  margin-bottom: 1rem;
  background-color: #fff;
}

.table th,
.table td {
  vertical-align: middle;
}

.table th {
  background-color: #f1f3f5;
  color: #495057;
}

.table tbody tr {
  cursor: pointer;
}

.table tbody tr:hover {
  background-color: #f1f3f5;
}

.table tbody tr:first-child:hover {
  background-color: #d4edda;
}

.loading {
  text-align: center;
  font-size: 1.2em;
  color: var(--color-secondary);
}

.no-data {
  text-align: center;
  font-size: 1.1em;
  color: var(--color-error);
}
</style>
