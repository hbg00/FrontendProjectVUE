<template>
  <div class="container mt-5">
    <h2 class="text-center">Rejestracja urządzenia</h2>

    <div v-if="isLoading" class="alert alert-info text-center">Rejestrowanie...</div>
    <div v-if="errorMessage" class="alert alert-danger text-center">{{ errorMessage }}</div>

    <form v-if="!isRegistered && !isLoading" @submit.prevent="registerDevice" class="card p-4 shadow-sm">
      <div class="mb-3">
        <label for="deviceName" class="form-label">Nazwa urządzenia:</label>
        <input id="deviceName" v-model="deviceData.deviceName" class="form-control" placeholder="Telefon" required />
      </div>
      <div class="mb-3">
        <label for="studentName" class="form-label">Imię:</label>
        <input id="studentName" v-model="deviceData.studentName" class="form-control" placeholder="Imię" required />
      </div>
      <div class="mb-3">
        <label for="studentSurname" class="form-label">Nazwisko:</label>
        <input id="studentSurname" v-model="deviceData.studentSurname" class="form-control" placeholder="Nazwisko" required />
      </div>
      <div class="mb-3">
        <label for="albumIdNumber" class="form-label">Numer albumu:</label>
        <input id="albumIdNumber" v-model.number="deviceData.albumIdNumber" type="number" class="form-control" placeholder="55555" required />
      </div>
      <button type="submit" class="btn btn-primary w-100">Zarejestruj urządzenie</button>
    </form>

    <div v-if="isRegistered" class="alert alert-success text-center mt-4">
      <p>Urządzenie zostało zarejestrowane!</p>
      <button @click="showQrCode = true" class="btn btn-success">Wyświetl QR Code</button>
    </div>

    <div v-if="showQrCode" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Obecność - Kod QR</h5>
            <button type="button" class="btn-close" @click="showQrCode = false"></button>
          </div>
          <div class="modal-body text-center">
            <qrcode-vue :value="ticket" :size="200" level="M" v-if="ticket" />
            <p v-if="lastAttendance" class="text-success">Twoja obecność została już zarejestrowana.</p>
            <p>Zbliż telefon do skanera</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showQrCode = false">Zamknij</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Backend } from "@/main";
import type { TokenResult, DeviceRegisterDTO } from "@/backend/AttendMeBackendClientBase";
import QrcodeVue from "qrcode.vue";

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const isRegistered = ref(false);
const errorMessage = ref<string | null>(null);
const tempToken = ref<string | null>(null);
const showQrCode = ref(false);
const ticket = ref<string | null>(null);
const lastAttendance = ref<boolean>(false);
let ticketInterval: number | null = null;

const deviceData = ref<DeviceRegisterDTO>({
  deviceName: "",
  studentName: "",
  studentSurname: "",
  albumIdNumber: 0,
});

function getTokenFromUrl() {
  tempToken.value = route.query.token as string;
  if (!tempToken.value) {
    errorMessage.value = "Brak tokenu rejestracji!";
  }
}

async function registerDevice() {
  if (!tempToken.value) return;

  isLoading.value = true;
  errorMessage.value = null;
  try {
    const response: TokenResult = await Backend.userDeviceRegisterWithToken(tempToken.value, deviceData.value);
    localStorage.setItem("deviceToken", response.token!);
    isRegistered.value = true;
    fetchAttendanceTicket();
  } catch (error) {
    errorMessage.value = "Nie udało się zarejestrować urządzenia. Sprawdź poprawność danych.";
  } finally {
    isLoading.value = false;
  }
}

const fetchAttendanceTicket = async () => {
  try {
    const response = await Backend.userAttendanceTicketGet();
    ticket.value = response.token || "";
  } catch (error) {
    console.error(error);
  }
};

const startQrCode = () => {
  fetchAttendanceTicket();
  ticketInterval = setInterval(fetchAttendanceTicket, 2000);
};

const stopQrCode = () => {
  if (ticketInterval) {
    clearInterval(ticketInterval);
    ticketInterval = null;
  }
};

watch(showQrCode, (newValue) => {
  if (newValue) {
    startQrCode();
  } else {
    stopQrCode();
  }
});

onMounted(getTokenFromUrl);
</script>
