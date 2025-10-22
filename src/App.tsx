import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AdminNavigation } from './components/AdminNavigation';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Workshop } from './pages/Workshop';
import { Stories } from './pages/Stories';
import { StoryDetail } from './pages/StoryDetail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminProjects } from './pages/admin/AdminProjects';
import { NewProject } from './pages/admin/NewProject';
import { EditProject } from './pages/admin/EditProject';
import { AdminStories } from './pages/admin/AdminStories';
import { NewStory } from './pages/admin/NewStory';
import { EditStory } from './pages/admin/EditStory';
import { Statistics } from './pages/admin/Statistics';
import { StatisticsCategories } from './pages/admin/StatisticsCategories';
import { StatisticsRecentViews } from './pages/admin/StatisticsRecentViews';
import { StatisticsPerformance } from './pages/admin/StatisticsPerformance';
import { Messages } from './pages/admin/Messages';
import { SiteContent } from './pages/admin/SiteContent';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Admin Login - No Navigation */}
          <Route path="/admin/login" element={<Login />} />
          
          {/* Admin Routes - With Admin Navigation */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <Dashboard />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/projects" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <AdminProjects />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/projects/new" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <NewProject />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/projects/edit/:id" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <EditProject />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/stories" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <AdminStories />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/stories/new" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <NewStory />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/stories/edit/:id" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <EditStory />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/messages" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <Messages />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/statistics" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <Statistics />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/statistics/categories" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <StatisticsCategories />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/statistics/recent-views" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <StatisticsRecentViews />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/statistics/performance" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <StatisticsPerformance />
              </>
            </ProtectedRoute>
          } />
          <Route path="/admin/site-content" element={
            <ProtectedRoute>
              <>
                <AdminNavigation />
                <SiteContent />
              </>
            </ProtectedRoute>
          } />
          
          {/* Public Routes - With Public Navigation and Footer */}
          <Route path="/" element={
            <>
              <Navigation />
              <main className="flex-1">
                <Home />
              </main>
              <Footer />
            </>
          } />
          <Route path="/projects" element={
            <>
              <Navigation />
              <main className="flex-1">
                <Projects />
              </main>
              <Footer />
            </>
          } />
          <Route path="/projects/:id" element={
            <>
              <Navigation />
              <main className="flex-1">
                <ProjectDetail />
              </main>
              <Footer />
            </>
          } />
          <Route path="/workshop" element={
            <>
              <Navigation />
              <main className="flex-1">
                <Workshop />
              </main>
              <Footer />
            </>
          } />
          <Route path="/stories" element={
            <>
              <Navigation />
              <main className="flex-1">
                <Stories />
              </main>
              <Footer />
            </>
          } />
          <Route path="/stories/:id" element={
            <>
              <Navigation />
              <main className="flex-1">
                <StoryDetail />
              </main>
              <Footer />
            </>
          } />
          <Route path="/about" element={
            <>
              <Navigation />
              <main className="flex-1">
                <About />
              </main>
              <Footer />
            </>
          } />
          <Route path="/contact" element={
            <>
              <Navigation />
              <main className="flex-1">
                <Contact />
              </main>
              <Footer />
            </>
          } />
          
          {/* Catch-all route for preview and unmatched paths */}
          <Route path="*" element={
            <>
              <Navigation />
              <main className="flex-1">
                <Home />
              </main>
              <Footer />
            </>
          } />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}
