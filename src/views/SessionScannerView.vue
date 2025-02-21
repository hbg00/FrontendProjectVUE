<template>
  <div class="scanner-container">
    <h2>Skanowanie obecności</h2>
    <div class="info">
        Zbliż kod QR do kamery, aby zarejestrować obecność.
    </div>

    <div class="scanner-wrapper">
      <qrcode-stream 
        camera="user" 
        @detect="onDetect" 
        @error="onError" 
        class="qr-scanner"
        :track="paintBoundingBox"
      />
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="scanResult" class="scan-result">
      <p v-if="scanSuccess" class="success">{{ scanResult }}</p>
      <p v-else class="error">{{ scanResult }}</p>
    </div>

    <div class="buttons">
      <button class="btn" @click="goBack"> Powrót do szczegółów zajęć</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Backend } from "@/main";
import { QrcodeStream } from "vue-qrcode-reader";

const route = useRoute();
const router = useRouter();
const sessionId = Number(route.params.id);
const isLoading = ref(false);
const scanResult = ref<string | null>(null);
const scanSuccess = ref(false);
const scannerToken = ref<string | null>(null);
const error = ref<string | null>(null);

async function onDetect(detectedCodes: any) {
  scanResult.value = null;
  scanSuccess.value = false;
  isLoading.value = true;

  if (detectedCodes.length > 0) {
    const qrCode = detectedCodes[0]?.rawValue;
    console.log("Zeskanowany kod:", qrCode);

    try {
      const response = await Backend.courseSessionAttendanceRegister(qrCode);
      scanResult.value = `Obecność zapisana: ${response.name} ${response.surname} (${response.student?.albumIdNumber})`;
      scanSuccess.value = true;
      setTimeout(() => {
        scanResult.value = null;
      }, 10000);
    } catch (error) {
      console.error("Błąd rejestracji obecności:", error);
      scanResult.value = "Nieprawidłowy kod lub student już zapisany.";
    } finally {
      isLoading.value = false;
    }
  }
}

const onError = (err: any) => {
  console.error("Błąd skanera:", err)

  if (err.name === "NotAllowedError") {
    error.value = "Musisz udzielić pozwolenia na dostęp do kamery.";
  } else if (err.name === "NotFoundError") {
    error.value = "Brak dostępnej kamery.";
  } else if (err.name === "NotSupportedError") {
    error.value = "Potrzebujesz bezpiecznego kontekstu (HTTPS, localhost).";
  } else if (err.name === "NotReadableError") {
    error.value = "Kamera może być już używana.";
  } else {
    error.value = `Błąd: ${err.message}`;
  }
};

const paintBoundingBox = (detectedCodes: any, ctx: CanvasRenderingContext2D) => {
  if (detectedCodes.length > 0) {
    detectedCodes.forEach(({ boundingBox: { x, y, width, height } }) => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#007bff";
      ctx.strokeRect(x, y, width, height);
    });
  }
};

async function fetchScannerToken() {
  try {
    const tokenResult = await Backend.courseSessionAttendanceScannerTokenGet(sessionId);
    if (tokenResult?.token) {
      Backend.deviceTokenResult = tokenResult;
      scannerToken.value = `${window.location.origin}/scanner/${tokenResult.token}`;
    }
  } catch (error) {
    console.error("Błąd pobierania tokenu skanera:", error);
  }
}

function copyScannerToken() {
  if (scannerToken.value) {
    navigator.clipboard.writeText(scannerToken.value);
    alert("Link do skanera skopiowany!");
  }
}

function goBack() {
  router.push({ name: "sessionDetails", params: { id: sessionId } });
}

onMounted(fetchScannerToken);
</script>

<style scoped>
.scanner-container {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  text-align: center;
}

.info {
  font-size: 1.1em;
  color: var(--color-text, #333);
  margin-bottom: 10px;
}

.loading {
  font-size: 1.2em;
  color: var(--color-secondary, #666);
  margin-bottom: 10px;
}

.scanner-wrapper {
  width: 100%;
  max-width: 600px;
  margin: 20px auto;
  border: 2px solid var(--color-border, #ccc);
  border-radius: 10px;
  overflow: hidden;
}

.qr-scanner {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.scan-result {
  margin-top: 20px;
}

.success {
  color: green;
  font-size: 1.2em;
}

.error {
  color: red;
  font-size: 1.2em;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
}

button.btn {
  padding: 10px 20px;
  background: var(--color-primary, #007bff);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: opacity 0.3s;
}

button.btn:hover {
  opacity: 0.85;
}

@media (max-width: 480px) {
  .qr-scanner {
    height: 200px;
  }
}
</style>
