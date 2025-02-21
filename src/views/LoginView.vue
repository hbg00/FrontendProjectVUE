<template>
  <div class="login container">
    <h1 class="mb-4 text-center">Logowanie</h1>
    <div class="card p-4 shadow-sm mx-auto" style="max-width: 400px;">
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="username" class="form-label">Login:</label>
          <input id="username" v-model="username" type="text" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Hasło:</label>
          <input id="password" v-model="password" type="password" class="form-control" required />
        </div>
        <button type="submit" class="btn btn-dark w-100">Zaloguj</button>
      </form>
      <div v-if="errorMessage" class="alert alert-danger mt-3">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Backend } from '@/main'
import { setLoggedInStatus, setUserRole } from '@/stores/authStore'

const username = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const router = useRouter()

const handleLogin = async () => {
  errorMessage.value = null

  try {
    const response = await Backend.userLogin(username.value, password.value)

    if (!response || !response.token) {
      errorMessage.value = 'Błąd logowania: Brak tokena w odpowiedzi.'
      return
    }

    sessionStorage.setItem('attend-me:userAuthData', JSON.stringify(response))
    setLoggedInStatus(true)

    const user = await Backend.userGet(undefined)

    if (user.isTeacher) {
      setUserRole('teacher')
      router.push('/')
    } else if (user.isStudent) {
      setUserRole('student')
      router.push('/')
    } else {
      errorMessage.value = 'Nieznana rola użytkownika.'
    }
  } catch (error) {
    console.error('Błąd logowania:', error)
    errorMessage.value = 'Błędny login lub hasło!'
  }
}
</script>

<style scoped>
.login {
  padding-top: 50px;
}
</style>
