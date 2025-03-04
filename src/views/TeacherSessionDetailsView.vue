<template>
  <div class="session-details">
    <h2>Szczegóły zajęć</h2>

    <div v-if="isLoading" class="loading">Ładowanie...</div>

    <div v-if="session">
      <h3>{{ session.courseName ?? "Brak nazwy" }} - {{ session.courseGroupName ?? "Brak grupy" }}</h3>
      <p>
        <strong>Termin:</strong>
        {{ formatDate(session.dateStart ?? null) }} - {{ formatDate(session.dateEnd ?? null) }}
      </p>
      <p>
        <strong>Lokalizacja:</strong>
        {{ session.locationName ?? 'Brak lokalizacji' }}
      </p>

      <div class="attendance-section">
        <h3>Lista obecności</h3>

        <div class="button-group d-flex justify-content-end gap-2 mb-3">
          <button class="btn btn-primary" @click="openDeviceRegistrationModal">
            Rejestracja urządzenia
          </button>
          <button class="btn btn-info" @click="goToScanner">Skaner</button>
          <button class="btn btn-secondary" @click="goToLecturerDashboard">
            Pulpit wykładowcy
          </button>
        </div>

        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Imię i nazwisko</th>
              <th>Numer albumu</th>
              <th>Obecność</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in attendanceList" :key="student.attenderUserId">
              <td>{{ student.userName }} {{ student.userSurname }}</td>
              <td>{{ student.studentAlbumIdNumber ?? "Brak nr albumu" }}</td>
              <td
                :class="{
                  'text-success': student.wasUserPresent,
                  'text-danger': !student.wasUserPresent
                }"
              >
                {{ student.wasUserPresent ? "Obecny" : "Nieobecny" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!session && !isLoading" class="no-data">
      Nie znaleziono szczegółów zajęć.
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Lista uczestników i rejestracja urządzeń</h5>
          <button type="button" class="btn-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="isModalLoading" class="loading">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Ładowanie...</span>
            </div>
            Ładowanie listy uczestników...
          </div>
          <div v-if="modalErrorMessage" class="alert alert-danger">
            {{ modalErrorMessage }}
          </div>
          <div
            v-if="!isModalLoading && !modalErrorMessage"
            class="student-container d-flex flex-wrap justify-content-start gap-3"
          >
            <div
              v-for="student in participantDevices"
              :key="student.userId"
              class="student-card card"
            >
              <div class="card-body">
                <h5 class="card-title">
                  {{ student.name }} {{ student.surname }}
                </h5>
                <p class="card-text mb-1">Album: {{ student.albumId }}</p>
                <p class="card-text mb-2">
                  Urządzenie:
                  <strong>{{ student.deviceName ?? "Brak urządzenia" }}</strong>
                </p>
                <button
                  v-if="student.deviceToken"
                  class="btn btn-primary btn-sm"
                  @click="copyToClipboard(getRegistrationLink(student.deviceToken), student.userId)"
                >
                  Link do rejestracji urządzenia
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Backend } from "@/main";
import type {
  CourseSessionListItem,
  CourseSessionAttendanceRecord,
  User,
  TokenResult,
} from "@/backend/AttendMeBackendClientBase";

const route = useRoute();
const router = useRouter();
const session = ref<CourseSessionListItem | null>(null);
const attendanceList = ref<CourseSessionAttendanceRecord[]>([]);
const isLoading = ref(false);
const isModalOpen = ref(false);
const isModalLoading = ref(false);
const modalErrorMessage = ref<string | null>(null);
const participantDevices = ref<
  {
    userId: number;
    name: string;
    surname: string;
    albumId: number;
    deviceName: string | null;
    deviceToken: string | null;
  }[]
>([]);
let refreshInterval: ReturnType<typeof setInterval> | null = null;

async function fetchSessionDetails() {
  isLoading.value = true;
  try {
    const sessionId = Number(route.params.id);
    const response = await Backend.courseTeacherSessionGet(sessionId);
    if (response) {
      session.value = response;
      await fetchAttendance();
    } else {
      session.value = null;
    }
  } catch (error) {
    console.error("Błąd pobierania szczegółów zajęć:", error);
  } finally {
    isLoading.value = false;
  }
}

async function fetchAttendance() {
  try {
    if (session.value && session.value.courseSessionId !== undefined) {
      const response = await Backend.courseSessionAttendanceListGet(
        session.value.courseSessionId
      );
      attendanceList.value = response || [];
    }
  } catch (error) {
    console.error("Błąd pobierania listy obecności:", error);
  }
}

async function openDeviceRegistrationModal() {
  isModalOpen.value = true;
  isModalLoading.value = true;
  modalErrorMessage.value = null;

  try {
    const sessionId = Number(route.params.id);
    const attendanceRecords = await Backend.courseSessionAttendanceListGet(
      sessionId
    );
    const studentIds = attendanceRecords.map(
      (student) => student.attenderUserId
    );

    if (studentIds.length === 0)
      throw new Error("Brak uczestników w tej sesji.");

    const userRequests = studentIds.map((userId) => Backend.userGet(userId));
    const users: User[] = await Promise.all(userRequests);

    const tokenRequests = studentIds.map((userId) =>
      Backend.userDeviceRegisterTokenGet(userId)
    );
    const tokens: TokenResult[] = await Promise.all(tokenRequests);

    participantDevices.value = users.map((user, index) => ({
      userId: user.userId!,
      name: user.name!,
      surname: user.surname!,
      albumId: user.student?.albumIdNumber ?? 0,
      deviceName: user.deviceName ?? "Brak urządzenia",
      deviceToken: tokens[index]?.token ?? null,
    }));
  } catch (error) {
    console.error("Błąd pobierania uczestników:", error);
    modalErrorMessage.value = "Nie udało się załadować listy uczestników.";
  } finally {
    isModalLoading.value = false;
  }
}

function getRegistrationLink(token: string): string {
  return `${window.location.origin}/register-device?token=${token}`;
}

function copyToClipboard(text: string, userId: number) {
  Backend.userDeviceReset(userId);
  navigator.clipboard.writeText(text).then(() => {
    alert("Link skopiowany do schowka!");
  });
}


function goToScanner() {
  if (session.value?.courseSessionId) {
    router.push({
      name: "sessionScanner",
      params: { id: session.value.courseSessionId },
    });
  }
}

function goToLecturerDashboard() {
  router.push({ name: 'teacherDashboardView' });
}

onMounted(() => {
  fetchSessionDetails();
  refreshInterval = setInterval(fetchAttendance, 60000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

function formatDate(dateValue: string | Date | null): string {
  if (!dateValue) return "Brak daty";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) return "Nieprawidłowa data";
  return date.toLocaleString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function closeModal() {
  isModalOpen.value = false;
}
</script>

<style scoped>
.session-details {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}

.loading {
  text-align: center;
  font-size: 1.2em;
  color: #666;
}

.no-data {
  text-align: center;
  font-size: 1.1em;
  color: #999;
}

.attendance-section {
  margin-top: 20px;
}

.table {
  width: 100%;
  margin-top: 20px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 20px;
  z-index: 1000;
  overflow-y: auto;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  max-width: 90%;
  width: 600px;
  max-height: 90vh;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: bold;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #333;
  cursor: pointer;
}

.modal-body {
  padding-top: 15px;
}

.spinner-border {
  margin-right: 10px;
  width: 1.5rem;
  height: 1.5rem;
  border-width: 3px;
}

.alert-danger {
  margin-top: 15px;
  font-size: 1rem;
  padding: 10px;
  border-radius: 5px;
  background-color: #f8d7da;
  color: #721c24;
}

.student-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: flex-start;
}

.student-card {
  flex: 1 1 200px;
  max-width: 220px;
}
</style>
