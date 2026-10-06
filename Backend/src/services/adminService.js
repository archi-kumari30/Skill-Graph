const User = require('../models/User');
const Skill = require('../models/Skill');
const Role = require('../models/Role');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const UserSkill = require('../models/UserSkill');
const Assessment = require('../models/Assessment');
const Project = require('../models/Project');
const DailyActivity = require('../models/DailyActivity');
const skillGapService = require('./skillGapService');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');

const getPlatformStats = async () => {
  const [
    totalStudents,
    totalRecruiters,
    totalAdmins,
    totalJobs,
    activeJobs,
    totalApplications,
    totalSkills,
    totalAssessments,
    recentUsers,
    recentApplications
  ] = await Promise.all([
    User.countDocuments({ accountRole: { $in: ['student', 'employee'] } }),
    User.countDocuments({ accountRole: { $in: ['recruiter', 'manager'] } }),
    User.countDocuments({ accountRole: 'admin' }),
    Job.countDocuments(),
    Job.countDocuments({ status: { $in: ['Active', 'active'] } }),
    JobApplication.countDocuments(),
    Skill.countDocuments(),
    Assessment.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email accountRole createdAt isActive company department'),
    JobApplication.find().sort({ createdAt: -1 }).limit(5).populate('jobId', 'title location').lean()
  ]);

  // Aggregate application statuses
  const statusCounts = await JobApplication.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const applicationStatusMap = {
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    rejected: 0
  };
  statusCounts.forEach(s => {
    if (s._id) applicationStatusMap[s._id] = s.count;
  });

  return {
    totalStudents,
    totalRecruiters,
    totalAdmins,
    totalJobs,
    activeJobs,
    totalApplications,
    totalSkills,
    totalAssessments,
    applicationStatusMap,
    recentUsers,
    recentApplications: recentApplications.map(app => ({
      id: app._id,
      candidateName: app.fullName || 'Candidate',
      candidateEmail: app.email,
      jobTitle: app.jobId?.title || 'Position',
      status: app.status,
      matchScore: app.matchScore,
      appliedAt: app.createdAt
    }))
  };
};

const getStudentsList = async () => {
  const students = await User.find({ accountRole: { $in: ['student', 'employee'] } })
    .populate('targetRoleId', 'name department level')
    .sort({ createdAt: -1 })
    .lean();

  const studentIds = students.map(s => s._id);

  // Batch query user skills
  const allUserSkills = await UserSkill.find({ userId: { $in: studentIds } }).lean();
  const skillsByStudent = {};
  allUserSkills.forEach(us => {
    const sId = us.userId.toString();
    if (!skillsByStudent[sId]) skillsByStudent[sId] = [];
    skillsByStudent[sId].push(us);
  });

  // Batch query applications
  const allApps = await JobApplication.find({ userId: { $in: studentIds } }).lean();
  const appsByStudent = {};
  allApps.forEach(a => {
    const sId = a.userId.toString();
    if (!appsByStudent[sId]) appsByStudent[sId] = [];
    appsByStudent[sId].push(a);
  });

  const enrichedStudents = await Promise.all(
    students.map(async (st) => {
      const sId = st._id.toString();
      const mySkills = skillsByStudent[sId] || [];
      const verifiedCount = mySkills.filter(s => s.verified || s.verificationStatus === 'verified').length;
      const myApps = appsByStudent[sId] || [];

      let readinessScore = null;
      if (st.targetRoleId?._id) {
        try {
          const gap = await skillGapService.calculateGap(st._id, st.targetRoleId._id);
          readinessScore = gap.readinessScore;
        } catch (_) {
          readinessScore = mySkills.length > 0 ? Math.min(100, mySkills.length * 15) : 0;
        }
      } else {
        readinessScore = mySkills.length > 0 ? Math.min(100, mySkills.length * 12) : 0;
      }

      return {
        _id: st._id,
        name: st.name,
        email: st.email,
        accountRole: st.accountRole,
        department: st.department || st.branch || '',
        college: st.college || '',
        yearOfStudy: st.yearOfStudy || '',
        experienceLevel: st.experienceLevel || 'beginner',
        targetRole: st.targetRoleId?.name || 'Not Selected',
        targetRoleId: st.targetRoleId?._id || null,
        isActive: st.isActive !== false,
        createdAt: st.createdAt,
        totalSkills: mySkills.length,
        verifiedSkillsCount: verifiedCount,
        applicationsCount: myApps.length,
        readinessScore: readinessScore ?? 0
      };
    })
  );

  return enrichedStudents;
};

const getRecruitersList = async () => {
  const recruiters = await User.find({ accountRole: { $in: ['recruiter', 'manager'] } })
    .sort({ createdAt: -1 })
    .lean();

  const recruiterIds = recruiters.map(r => r._id);

  // Find all jobs for these recruiters
  const jobs = await Job.find({ recruiterId: { $in: recruiterIds } }).lean();
  const jobsByRecruiter = {};
  jobs.forEach(j => {
    const rId = j.recruiterId.toString();
    if (!jobsByRecruiter[rId]) jobsByRecruiter[rId] = [];
    jobsByRecruiter[rId].push(j);
  });

  // Find all job applications for these jobs
  const jobIds = jobs.map(j => j._id);
  const applications = await JobApplication.find({ jobId: { $in: jobIds } }).lean();
  const applicantsByJob = {};
  applications.forEach(a => {
    const jId = a.jobId.toString();
    applicantsByJob[jId] = (applicantsByJob[jId] || 0) + 1;
  });

  const enrichedRecruiters = recruiters.map(rec => {
    const rId = rec._id.toString();
    const myJobs = jobsByRecruiter[rId] || [];
    const activeJobsCount = myJobs.filter(j => j.status === 'Active' || j.status === 'active').length;
    let totalApplicants = 0;
    myJobs.forEach(j => {
      totalApplicants += (applicantsByJob[j._id.toString()] || 0);
    });

    return {
      _id: rec._id,
      name: rec.name,
      email: rec.email,
      accountRole: rec.accountRole,
      company: rec.company || 'Direct Recruiter',
      phone: rec.phone || '',
      department: rec.department || 'Recruitment',
      isActive: rec.isActive !== false,
      createdAt: rec.createdAt,
      totalJobsCount: myJobs.length,
      activeJobsCount,
      totalApplicantsReceived: totalApplicants
    };
  });

  return enrichedRecruiters;
};

const toggleUserStatus = async (adminUserId, targetUserId, isActive) => {
  if (adminUserId.toString() === targetUserId.toString()) {
    throw new BadRequestError('Admin cannot deactivate their own account');
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.isActive = Boolean(isActive);
  await user.save();
  return user;
};

const getStudentDetails = async (studentId) => {
  const student = await User.findById(studentId).populate('targetRoleId').populate('savedRoleIds').lean();
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const [skills, applications, projects, activities] = await Promise.all([
    UserSkill.find({ userId: studentId }).populate('skillId').lean(),
    JobApplication.find({ userId: studentId }).populate('jobId', 'title companyId location').lean(),
    Project.find({ userId: studentId }).populate('skillsUsed').lean(),
    DailyActivity.find({ userId: studentId }).sort({ createdAt: -1 }).limit(10).lean()
  ]);

  let gapData = null;
  if (student.targetRoleId?._id) {
    try {
      gapData = await skillGapService.calculateGap(studentId, student.targetRoleId._id);
    } catch (_) {}
  }

  return {
    student: {
      ...student,
      password: undefined
    },
    skills,
    applications,
    projects,
    activities,
    gapData
  };
};

module.exports = {
  getPlatformStats,
  getStudentsList,
  getRecruitersList,
  toggleUserStatus,
  getStudentDetails
};
