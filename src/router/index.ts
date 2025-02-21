import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import SessionDetailsView from '../views/TeacherSessionDetailsView.vue';
import SessionScannerView from '../views/SessionScannerView.vue';
import DeviceRegistrationView from '../views/StudentDeviceRegisterView.vue';
import StudentSessionDetailsView from '../views/StudentSessionDetailsView.vue';
import TeacherDashboardView from '../views/TeacherDashboardView.vue';
import StudentDashboardView from '../views/StudentDashboardView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/DashboardWrapper.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/session/:id',
      name: 'sessionDetails',
      component: SessionDetailsView,
      props: true,
    },
    {
      path: '/session/:id/scanner',
      name: 'sessionScanner',
      component: SessionScannerView,
      props: true,
    },
    {
      path: '/register-device',
      name: 'deviceRegistration',
      component: DeviceRegistrationView,
    },
    {
      path: '/student-session/:id',
      name: 'studentSessionDetails',
      component: StudentSessionDetailsView,
      props: true,
    },
    {
      path:'/teacher-dashboard',
      name: 'teacherDashboardView',
      component: TeacherDashboardView,
    },
    {
      path:'/student-dashboard',
      name: 'studentDashboardView',
      component: StudentDashboardView,
    }
  ],
});

export default router;
