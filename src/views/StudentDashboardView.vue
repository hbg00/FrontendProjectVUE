<template>
  <div class="student-dashboard container mt-4">
    <h1>Pulpit studenta</h1>
    <div class="filters row mb-4">
      <div class="col-md-6">
        <input
          v-model="searchQuery"
          placeholder="Nazwa kursu, sala"
          @input="debouncedSearch"
          class="form-control"
        />
      </div>
      <div class="col-md-6">
        <select v-model="filterType" @change="fetchSessions" class="form-select">
          <option value="all">Wszystkie</option>
          <option value="today">Dziś</option>
          <option value="week">Najbliższy tydzień</option>
          <option value="past">Minione</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="text-center">Ładowanie...</div>

    <div v-if="sessions.length === 0 && !isLoading" class="text-center text-danger">
      Brak zajęć do wyświetlenia.
    </div>

    <div class="session-list">
      <template v-for="session in sessions" :key="session.courseSessionId">
        <div
          @click="goToSessionDetails(session.courseSessionId!, session.courseGroupId)"
          class="session-item row mb-3"
        >
          <div class="session-time-range col-md-3">
            {{ formatDate(session.dateStart) }} {{ formatDateToHour(session.dateStart) }} -
            {{ formatDateToHour(session.dateEnd) }}
          </div>
          <div class="session-details col-md-9">
            <div class="session-title">
              {{ session.courseName }}
            </div>
            <div class="session-info text-muted">
              {{ session.courseGroupName }} | {{ session.locationName }}
            </div>
          </div>
        </div>
      </template>
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
      case 'week':
        filters.filters!.dateStart = new Date(now.setHours(0, 0, 0, 0));
        filters.filters!.dateEnd = new Date(now.setDate(now.getDate() + 7));
        break;
      case 'past':
        filters.filters!.dateEnd = new Date(now.setHours(0, 0, 0, 0));
        break;
    }

    const response = await Backend.courseStudentSessionsGet(filters);
    sessions.value = response.items ?? [];
  } catch (error) {
    console.error('Błąd pobierania zajęć:', error);
  } finally {
    isLoading.value = false;
  }
}

function formatDate(date: Date | undefined): string {
  if (!date) return 'Brak daty';
  return new Date(date).toLocaleDateString() + '';
}

function formatDateToHour(date: Date | undefined): string {
  let minutes;
  if (!date) return 'Brak daty';
  if (date.getMinutes() == 0) {
    minutes = '00';
  } else {
    minutes = date.getMinutes();
  }
  return new Date(date).getHours() + ':' + minutes;
}

function goToSessionDetails(courseSessionId: number | undefined, courseSessionGroup: number | undefined) {
  if (courseSessionId !== undefined) {
    router.push({ name: 'studentSessionDetails', params: { id: courseSessionId, groupId: courseSessionGroup } });
  }
}

watch(filterType, fetchSessions);
watch(searchQuery, debouncedSearch);

onMounted(fetchSessions);
</script>

<style scoped>
.student-dashboard {
  padding: 20px;
}

.session-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
  transition: background-color 0.3s, transform 0.3s;
  border-radius: 5px;
}

.session-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.session-time-range {
  background-color: #f8f9fa;
  padding: 5px 10px;
  margin-right: 10px;
  border-radius: 5px;
  font-size: 14px;
  white-space: nowrap;
}

.session-details {
  flex: 1;
}

.session-title {
  font-weight: bold;
}

.session-info {
  color: #6c757d;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

@media screen and (max-width: 700px) {
  .filters {
    flex-wrap: wrap;
  }
}
</style>
