import Layout from '@/layout';

export default [
  {
    name: 'welcome',
    path: '/welcome',
    component: () => import('@/page/welcome/index.vue'),
    meta: {
      needAuth: false,
    },
  },
  {
    name: 'layout',
    path: '/',
    component: Layout,
    children: [
      {
        name: 'home',
        path: '/',
        component: () => import('@/page/home/index.vue'),
        meta: {},
      },
      {
        name: 'account',
        path: '/account',
        component: () => import('@/page/account/index.vue'),
        meta: {
          needAuth: false,
        },
      },
      {
        name: 'edit',
        path: '/edit',
        component: () => import('@/page/edit/index.vue'),
        meta: {},
      },
      {
        name: 'order',
        path: '/order',
        component: () => import('@/page/order/index.vue'),
        meta: {},
      },
      {
        name: 'connect',
        path: '/connect',
        component: () => import('@/page/connect/index.vue'),
        meta: {},
      },
      {
        name: 'test',
        path: '/test',
        component: () => import('@/page/test/index.vue'),
        meta: {
          needAuth: false,
        },
      },
    ],
  },
  {
    name: 'notFound',
    path: '/:pathMatch(.*)*',
    component: () => import('@/page/notFound/index.vue'),
    meta: {
      needAuth: false,
    },
  },
];
