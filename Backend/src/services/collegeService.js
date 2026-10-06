const College = require('../models/College');
const User = require('../models/User');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/customErrors');

class CollegeService {
  async getAllColleges(filters = {}) {
    const query = {};
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const colleges = await College.find(query).sort({ name: 1 }).lean();

    // Compute live student enrollment count per college
    const enriched = await Promise.all(
      colleges.map(async (col) => {
        const count = await User.countDocuments({
          college: { $regex: new RegExp(`^${col.name.trim()}$`, 'i') },
          accountRole: { $in: ['student', 'employee'] }
        });
        return {
          ...col,
          studentCount: count
        };
      })
    );

    return enriched;
  }

  async getCollegeById(id) {
    const college = await College.findById(id).lean();
    if (!college) {
      throw new NotFoundError('College not found');
    }
    const studentCount = await User.countDocuments({
      college: { $regex: new RegExp(`^${college.name.trim()}$`, 'i') },
      accountRole: { $in: ['student', 'employee'] }
    });
    return { ...college, studentCount };
  }

  async createCollege({ name, location = 'India', website = '', status = 'active' }) {
    if (!name || !name.trim()) {
      throw new BadRequestError('College name is required');
    }

    const trimmedName = name.trim();
    const existing = await College.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });
    if (existing) {
      throw new ConflictError(`College "${trimmedName}" is already registered`);
    }

    const college = await College.create({
      name: trimmedName,
      location: location.trim(),
      website: website.trim(),
      status
    });

    return college;
  }

  async updateCollegeStatus(id, newStatus) {
    if (!['active', 'inactive'].includes(newStatus)) {
      throw new BadRequestError('Status must be either "active" or "inactive"');
    }

    const college = await College.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );
    if (!college) {
      throw new NotFoundError('College not found');
    }

    return college;
  }

  async deleteCollege(id) {
    const college = await College.findByIdAndDelete(id);
    if (!college) {
      throw new NotFoundError('College not found');
    }
    return { message: 'College removed successfully', collegeId: id };
  }

  async seedDefaultColleges() {
    const defaults = [
      { name: 'Parul University', location: 'Vadodara, Gujarat', status: 'active' },
      { name: 'State Engineering College', location: 'Delhi, India', status: 'active' },
      { name: 'National Institute of Technology', location: 'Karnataka, India', status: 'active' },
      { name: 'Indian Institute of Technology', location: 'Mumbai, India', status: 'active' },
      { name: 'Vellore Institute of Technology', location: 'Vellore, Tamil Nadu', status: 'active' }
    ];

    for (const c of defaults) {
      const exists = await College.findOne({ name: c.name });
      if (!exists) {
        await College.create(c);
      }
    }
  }
}

module.exports = new CollegeService();
