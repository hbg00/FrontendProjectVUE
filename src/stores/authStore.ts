import { ref } from 'vue';

export const isLoggedIn = ref<boolean>(sessionStorage.getItem('attend-me:userAuthData') !== null);
export const userRole = ref<string | null>(sessionStorage.getItem('attend-me:userRole') || null);

export function setLoggedInStatus(status: boolean) {
  isLoggedIn.value = status;
}

export function setUserRole(role: string | null) {
  userRole.value = role;
  if (role) {
    sessionStorage.setItem('attend-me:userRole', role);
  } else {
    sessionStorage.removeItem('attend-me:userRole');
  }
}
