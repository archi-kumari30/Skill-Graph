import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldAlert,
  ArrowUpDown,
  BookOpen,
  Briefcase,
  Sparkles,
  Award,
  X,
  ExternalLink,
  CalendarCheck,
  FolderGit2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      setStudents(res?.data || []);
    } catch (err) {
      toast.error('Failed to load students list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleStatus = async (studentId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      await api.patch(`/admin/users/${studentId}/status`, { isActive: newStatus });
      toast.success(`Student account ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, isActive: newStatus } : s));
      if (selectedStudent?._id === studentId) {
        setSelectedStudent(prev => ({ ...prev, isActive: newStatus }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student status');
    }
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setStudentDetails(null);
    try {
      setStudentDetailsLoading(true);
      const res = await api.get(`/admin/students/${student._id}`);
      setStudentDetails(res?.data || null);
    } catch (err) {
      toast.error('Failed to load full student profile details');
    } finally {
      setStudentDetailsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.targetRole?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || s.targetRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const uniqueRoles = ['All', ...new Set(students.map(s => s.targetRole).filter(Boolean))];

  if (loading) {
    return <LoadingSpinner message="Loading student directory..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Learner Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Student Management & Directory
          </h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Inspect career readiness scores, verified skill assessments, and recruitment applications across all registered students.
          </p>
        </div>

        <div className="bg-[#FAF9F6] border border-zinc-200 rounded-2xl p-4 flex items-center space-x-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
            {students.length}
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Enrolled</p>
            <p className="text-sm font-extrabold text-zinc-900">
              {students.filter(s => s.isActive !== false).length} Active Learners
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, target role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role === 'All' ? 'All Target Careers' : role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Target Career</th>
                <th className="py-3.5 px-4">Readiness</th>
                <th className="py-3.5 px-4">Skills (Verified)</th>
                <th className="py-3.5 px-4">Applications</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <tr key={st._id} className="hover:bg-zinc-50/60 transition-colors">
                    
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">{st.name}</p>
                        <p className="text-zinc-500 text-[11px]">{st.email}</p>
                        {(st.college || st.department) && (
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[200px]">
                            {[st.college, st.department].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Target Career */}
                    <td className="py-3.5 px-4 font-semibold text-zinc-700">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px]">
                        {st.targetRole}
                      </span>
                    </td>

                    {/* Readiness */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-zinc-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st.readinessScore >= 75
                                ? 'bg-emerald-500'
                                : st.readinessScore >= 40
                                ? 'bg-indigo-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${st.readinessScore}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-zinc-900">{st.readinessScore}%</span>
                      </div>
                    </td>

                    {/* Skills */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-zinc-900">{st.totalSkills} total</span>
                        <span className="text-zinc-400">•</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> {st.verifiedSkillsCount} verified
                        </span>
                      </div>
                    </td>

                    {/* Applications */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-800 bg-zinc-100 px-2 py-1 rounded-md">
                        {st.applicationsCount} jobs
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        st.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {st.isActive !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {st.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(st)}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" /> Inspect
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st._id, st.isActive !== false)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            st.isActive !== false
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {st.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Slide-Over Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base">
                  {selectedStudent.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">{selectedStudent.name}</h2>
                  <p className="text-xs text-zinc-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {studentDetailsLoading ? (
                <LoadingSpinner message="Fetching comprehensive student record..." />
              ) : (
                <>
                  {/* Readiness & Profile Card */}
                  <div className="bg-[#FAF9F6] border border-zinc-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Career</span>
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                        {selectedStudent.targetRole}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-200">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Readiness Score</p>
                        <p className="text-xl font-black text-zinc-900 mt-0.5">{selectedStudent.readinessScore}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Total Skills</p>
                        <p className="text-xl font-black text-zinc-900 mt-0.5">{studentDetails?.skills?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Applications</p>
                        <p className="text-xl font-black text-zinc-900 mt-0.5">{studentDetails?.applications?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" /> Demonstrated & Verified Skills
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {studentDetails?.skills && studentDetails.skills.length > 0 ? (
                        studentDetails.skills.map((us) => (
                          <div
                            key={us._id}
                            className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-zinc-900">{us.skillId?.name || 'Skill'}</p>
                              <p className="text-[10px] text-zinc-400">Level {us.proficiency}/5</p>
                            </div>
                            {us.verified ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-400">Self-reported</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 col-span-2 py-2">No skills registered yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Applied Jobs */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-600" /> Application History
                    </h3>
                    <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                      {studentDetails?.applications && studentDetails.applications.length > 0 ? (
                        studentDetails.applications.map((app) => (
                          <div key={app._id} className="p-3 bg-white flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-zinc-900">{app.jobId?.title || 'Applied Position'}</p>
                              <p className="text-[11px] text-zinc-400">{app.jobId?.location || 'Remote'}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {app.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 p-4 text-center">No applications submitted yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-amber-500" /> Study & Verification Activity
                    </h3>
                    <div className="space-y-2">
                      {studentDetails?.activities && studentDetails.activities.length > 0 ? (
                        studentDetails.activities.map((act) => (
                          <div key={act._id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs flex justify-between items-center">
                            <div>
                              <p className="font-bold text-zinc-800">{act.title}</p>
                              <p className="text-[10px] text-zinc-500">{act.details}</p>
                            </div>
                            <span className="text-[10px] text-zinc-400 shrink-0 font-medium">{act.date}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 p-4 text-center">No study activities recorded yet.</p>
                      )}
                    </div>
                  </div>

                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Status: <strong className="text-zinc-900">{selectedStudent.isActive !== false ? 'Active' : 'Disabled'}</strong>
              </span>
              <button
                onClick={() => handleToggleStatus(selectedStudent._id, selectedStudent.isActive !== false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  selectedStudent.isActive !== false
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedStudent.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagement;
