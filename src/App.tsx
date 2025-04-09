
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';
import Projects from '@/pages/Projects';
import ProjectDetailsPage from '@/pages/ProjectDetails';
import Templates from '@/pages/Templates';
import NewTemplate from '@/pages/NewTemplate';
import TemplateDetails from '@/pages/TemplateDetails';
import Clients from '@/pages/Clients';
import Contacts from '@/pages/Contacts';
import ContactDetails from '@/pages/ContactDetails';
import NotFound from '@/pages/NotFound';
import ClientDetails from '@/pages/ClientDetails';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Routes definition
const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/projects',
    element: <Projects />,
  },
  {
    path: '/projects/:projectId',
    element: <ProjectDetailsPage />,
  },
  {
    path: '/templates',
    element: <Templates />,
  },
  {
    path: '/templates/new',
    element: <NewTemplate />,
  },
  {
    path: '/templates/:templateId',
    element: <TemplateDetails />,
  },
  {
    path: '/clients',
    element: <Clients />,
  },
  {
    path: '/clients/:clientId',
    element: <ClientDetails />,
  },
  {
    path: '/contacts',
    element: <Contacts />,
  },
  {
    path: '/contacts/:contactId',
    element: <ContactDetails />,
  },
  {
    path: '/my-work',
    element: <Index />, // Temporarily using Index component for My Work route
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
