import Department from '../models/Department.js';
import User from '../models/user.model.js'; 
import Program from '../models/Program.js';

// @desc    Create a new department
export const createDepartment = async (req, res) => {
  try {
    const { name, headOfDepartment, description } = req.body; 

    if (!name) return res.status(400).json({ message: 'Name is required' });

    // Create the Department
    const department = await Department.create({
      name,
      headOfDepartment: headOfDepartment || null, 
      description,
    });

    // If a Head is selected during creation, add this department to their profile
    // AND upgrade their role to ADMIN automatically
    if (headOfDepartment) {
        await User.findByIdAndUpdate(headOfDepartment, {
            $addToSet: { departments: department._id },
            role: 'ADMIN' 
        });
    }

    res.status(201).json({ ...department._doc, programCount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all departments (With Stats)
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
        // Check if there is a designated Head of Department
        const hasHead = dept.headOfDepartment ? true : false;
        
        const staffCount = await User.countDocuments({ 
            departments: dept._id 
        });
        
        return { 
            ...dept, 
            hasAdmin: hasHead, 
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

    const department = await Department.findById(id).populate('headOfDepartment', 'name email profilePicture'); 
    
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

// ---------------------------------------------------------
// ✅ 1. REMOVE USER FROM DEPARTMENT (Logic Fixed)
// ---------------------------------------------------------
export const removeFromDepartment = async (req, res) => {
    try {
        const { userId, departmentId } = req.body;

        const department = await Department.findById(departmentId);
        
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // 1. Remove Department from User's Profile
        // Note: We do NOT change their role here automatically. 
        // If they are an Admin elsewhere, they keep the role.
        await User.findByIdAndUpdate(userId, {
            $pull: { departments: departmentId }
        });

        // 2. Check if this user was the Head of Department
        if (department.headOfDepartment && department.headOfDepartment.toString() === userId) {
            // ✅ Fix: Just remove them. Do NOT auto-assign anyone else.
            // Also downgrade them since they are no longer leading this dept.
            department.headOfDepartment = null;
            await department.save();

            // Optional: Downgrade role to STAFF if they aren't leading other depts
            // For safety, we can just set them to STAFF here.
            await User.findByIdAndUpdate(userId, { role: 'STAFF' });
        }

        res.json({ message: 'User removed from department successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------
// ✅ 2. ASSIGN ADMIN (Promote, Upgrade Role, Swap Old Admin)
// ---------------------------------------------------------
export const assignDepartmentAdmin = async (req, res) => {
    try {
        const { userId, departmentId } = req.body;

        const department = await Department.findById(departmentId);
        const user = await User.findById(userId);

        if (!department || !user) {
            return res.status(404).json({ message: "User or Department not found" });
        }

        // 1. Handle Existing Admin (Downgrade them)
        if (department.headOfDepartment) {
            const oldAdmin = await User.findById(department.headOfDepartment);
            if (oldAdmin && oldAdmin._id.toString() !== userId) {
                oldAdmin.role = 'STAFF'; // Downgrade old admin
                await oldAdmin.save();
            }
        }

        // 2. Assign NEW Admin
        department.headOfDepartment = userId;
        await department.save();

        // 3. Update User: Add to Dept List & Upgrade Role
        await User.findByIdAndUpdate(userId, {
            $addToSet: { departments: departmentId },
            role: 'ADMIN' // ✅ Force upgrade
        });

        res.json({ 
            message: `Success! ${user.name} is now the Head of ${department.name}`,
            department 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------
// ✅ 3. REVOKE ADMIN (Demote to Staff, Keep in Dept)
// ---------------------------------------------------------
export const revokeDepartmentAdmin = async (req, res) => {
    try {
        const { departmentId } = req.body;

        const department = await Department.findById(departmentId);

        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }

        if (!department.headOfDepartment) {
             return res.status(400).json({ message: "This department has no admin to remove." });
        }

        // 1. Find the current admin
        const currentAdminId = department.headOfDepartment;
        
        // 2. Downgrade Role to STAFF
        await User.findByIdAndUpdate(currentAdminId, {
            role: 'STAFF' 
        });

        // 3. Remove from Department Head slot
        department.headOfDepartment = null;
        await department.save();

        res.json({ message: "Department Admin removed. User is now regular Staff." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};