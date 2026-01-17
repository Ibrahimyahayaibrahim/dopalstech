import Department from '../models/Department.js';
import User from '../models/user.model.js'; 
import Program from '../models/Program.js';

// @desc    Create a new department
export const createDepartment = async (req, res) => {
  try {
    // 1. Get User ID from the dropdown selection (req.body.headOfDepartment is now an ID)
    const { name, headOfDepartment, description } = req.body; 

    if (!name) return res.status(400).json({ message: 'Name is required' });

    // 2. Create the Department
    const department = await Department.create({
      name,
      headOfDepartment: headOfDepartment || null, // Stores User ID
      description,
    });

    // 3. AUTOMATICALLY ADD USER TO DEPARTMENT
    if (headOfDepartment) {
        await User.findByIdAndUpdate(headOfDepartment, {
            $addToSet: { departments: department._id }, // Add dept ID to user's list
        });
    }

    // Return with programCount: 0 for the frontend list
    res.status(201).json({ ...department._doc, programCount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: "programs",
          localField: "_id",
          foreignField: "department",
          as: "programList"
        }
      },
      {
        $addFields: {
          programCount: { $size: "$programList" }
        }
      },
      {
        $project: {
          programList: 0,
          __v: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    const departmentsWithStats = await Promise.all(departments.map(async (dept) => {
        const existingAdmin = await User.findOne({ 
            departments: dept._id, 
            role: 'ADMIN' 
        });
        const staffCount = await User.countDocuments({ 
            departments: dept._id 
        });
        
        return { 
            ...dept, 
            hasAdmin: !!existingAdmin, 
            staffCount: staffCount || 0 
        };
    }));

    res.json(departmentsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Department by ID + All Staff + All Programs
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id); 
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Fetch Staff
    const staff = await User.find({ departments: id })
      .select('name email role position profilePicture status');

    // Fetch Programs
    const programs = await Program.find({ department: id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      department, 
      staff,      
      programs    
    });

  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({ message: "Server Error fetching department" });
  }
};

// @desc    Delete Department
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const hasStaff = await User.exists({ departments: req.params.id });
    const hasPrograms = await Program.exists({ department: req.params.id });

    if (hasStaff || hasPrograms) {
        return res.status(400).json({ 
            message: `Cannot delete: Department has ${hasStaff ? 'Active Staff' : ''} ${hasStaff && hasPrograms ? 'and' : ''} ${hasPrograms ? 'Programs' : ''}. Move them first.` 
        });
    }

    await department.deleteOne();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};