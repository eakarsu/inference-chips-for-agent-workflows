import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import ChipsPage from './pages/ChipsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import StepsPage from './pages/StepsPage';
import BenchmarksPage from './pages/BenchmarksPage';
import DeploymentsPage from './pages/DeploymentsPage';
import ResearchPage from './pages/ResearchPage';
import AICenterPage from './pages/AICenterPage';
import ExportPage from './pages/ExportPage';
import SearchPage from './pages/SearchPage';
import AuditLogPage from './pages/AuditLogPage';
import SampleDataPage from './pages/SampleDataPage';
import Dashboard from './pages/Dashboard';
import KvAllocationPage from './pages/KvAllocationPage';
import MlperfPage from './pages/MlperfPage';
import SpecDecodePage from './pages/SpecDecodePage';
import CompilerPassPage from './pages/CompilerPassPage';
import TracePage from './pages/TracePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chips" element={<ChipsPage />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="steps" element={<StepsPage />} />
          <Route path="benchmarks" element={<BenchmarksPage />} />
          <Route path="deployments" element={<DeploymentsPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="ai" element={<AICenterPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="sample-data" element={<SampleDataPage />} />
          {/* Deep feature pages (audit 2026-05-14) */}
          <Route path="kv-allocation" element={<KvAllocationPage />} />
          <Route path="mlperf" element={<MlperfPage />} />
          <Route path="spec-decode" element={<SpecDecodePage />} />
          <Route path="compiler-pass" element={<CompilerPassPage />} />
          <Route path="trace" element={<TracePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
