import User from '../models/user.model.js';
import Department from '../models/Department.js'; 
import sendEmail from '../utils/sendEmail.js'; 

// --- 1. INVITE / CREATE USER ---
export const inviteUser = async (req, res) => {
  try {
    const { name, email, password, role, position, departments } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!departments || departments.length === 0) return res.status(400).json({ message: "At least one Department is required" });

    if (role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: "Action Forbidden: You cannot create a Super Admin." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User with this email already exists" });

    if (role === 'ADMIN') {
        const existingAdmin = await User.findOne({
            departments: { $in: departments }, 
            role: 'ADMIN'
        });

        if (existingAdmin) {
            return res.status(400).json({ 
                message: `Action Blocked: ${existingAdmin.name} is already the Admin for one of these departments.` 
            });
        }
    }

    const generatedPassword = Math.random().toString(36).slice(-8) + "1!";
    const finalPassword = password || generatedPassword;

    const user = await User.create({
      name,
      email,
      password: finalPassword, 
      role: role || 'STAFF',
      position: position || 'Staff Member',
      departments: departments, 
      status: 'Pending', 
      isProfileComplete: false
    });

    if (user) {
      const message = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #059669;">Welcome to Dopals Tech Dashboard</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You have been added to the system as a <strong>${position}</strong>.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0 0;"><strong>Temporary Password:</strong> ${finalPassword}</p>
          </div>
          <p>Please login and change your password immediately.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
        </div>
      `;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Your Account Credentials - Dopals Tech',
          html: message, 
          message: `Your password is: ${finalPassword}`
        });

        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          message: "User created and credentials sent to email!"
        });

      } catch (emailError) {
        console.error("Email Sending Failed:", emailError);
        res.status(201).json({
          _id: user._id,
          message: "User created, but email failed. Copy password: " + finalPassword
        });
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }

  } catch (error) {
    console.error("Invite Error:", error);
    res.status(500).json({ message: "Server Error inviting user" });
  }
};

// --- 2. GET ALL USERS ---
export const getAllUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        let query = {};

        if (currentUser.role === 'ADMIN') {
            const adminDeptIds = currentUser.departments.map(d => d._id || d);
            query.departments = { $in: adminDeptIds };
        }

        const users = await User.find(query)
            .populate('departments', 'name') 
            .select('-password'); 

        res.json(users);
    } catch (error) {
        console.error("Get Users Error:", error); 
        res.status(500).json({ message: error.message });
    }
};

// --- 3. GET USER PROFILE ---
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('departments', 'name');
        
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                departments: user.departments, 
                position: user.position,
                profilePicture: user.profilePicture,
                status: user.status,
                isProfileComplete: user.isProfileComplete
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 4. UPDATE USER PROFILE (FIXED) ---
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            
            // Check for unique email if changed
            if (req.body.email && req.body.email !== user.email) {
                const emailExists = await User.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: "This email is already in use by another account." });
                }
                user.email = req.body.email;
            }

            // Update basic fields
            if (req.body.phone) user.phone = req.body.phone;
            if (req.body.gender) user.gender = req.body.gender;
            if (req.body.dob) user.dob = req.body.dob;
            if (req.body.address) user.address = req.body.address;
            if (req.body.nin) user.nin = req.body.nin;
            if (req.body.bio) user.bio = req.body.bio;
            if (req.body.linkedin) user.linkedin = req.body.linkedin;

            // ✅ CRITICAL FIX: Explicitly save status changes
            // This flag comes from your Frontend Modal
            if (req.body.isProfileComplete === true) {
                user.isProfileComplete = true;
                user.status = 'Active'; // <--- THIS WAS MISSING. Activates the user.
            }

            // Update Emergency Contact
            if (req.body.emergencyContact) {
                user.emergencyContact = {
                    name: req.body.emergencyContact.name || user.emergencyContact.name,
                    relationship: req.body.emergencyContact.relationship || user.emergencyContact.relationship,
                    phone: req.body.emergencyContact.phone || user.emergencyContact.phone
                };
            }

            // ✅ Handle Password Change (Merged)
            if (req.body.password && req.body.password.length >= 6) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                departments: updatedUser.departments,
                position: updatedUser.position,
                profilePicture: updatedUser.profilePicture,
                
                // Return updated status to frontend
                isProfileComplete: updatedUser.isProfileComplete, 
                status: updatedUser.status,
                
                phone: updatedUser.phone,
                gender: updatedUser.gender,
                dob: updatedUser.dob,
                address: updatedUser.address,
                emergencyContact: updatedUser.emergencyContact
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- 5. UPDATE PROFILE IMAGE ---
export const updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        const user = await User.findById(req.user._id);
        
        if (user) {
            user.profilePicture = imagePath;
            await user.save();

            res.json({
                message: "Image uploaded successfully",
                profilePicture: imagePath
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error uploading image" });
    }
};

// --- 6. DELETE USER ---
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user.role === 'SUPER_ADMIN') {
                 return res.status(400).json({ message: "Cannot delete Super Admin" });
            }
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 7. REMOVE FROM DEPT ---
export const removeFromDepartment = async (req, res) => {
    try {
        const { userId, departmentId } = req.body;
        await User.findByIdAndUpdate(userId, {
            $pull: { departments: departmentId } 
        });
        res.json({ message: "Staff removed from department" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 8. MIGRATE STAFF ---
export const migrateStaff = async (req, res) => {
    try {
        const { userId, oldDeptId, newDeptId } = req.body;
        const user = await User.findById(userId);
        
        user.departments = user.departments.filter(d => d.toString() !== oldDeptId);
        if (!user.departments.includes(newDeptId)) {
            user.departments.push(newDeptId);
        }
        
        await user.save();
        res.json({ message: "Staff migrated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 9. BULK ADD TO DEPT ---
export const addToDepartment = async (req, res) => {
    try {
        const { userIds, departmentId } = req.body; 
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "No users selected" });
        }
        await User.updateMany(
            { _id: { $in: userIds } },
            { $addToSet: { departments: departmentId } }
        );
        res.json({ message: `${userIds.length} staff members added successfully.` });
    } catch (error) {
        console.error("Bulk Add Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- 10. TOGGLE USER STATUS ---
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userToUpdate = await User.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentUser = req.user;
        
        if (currentUser.role === 'ADMIN') {
            if (userToUpdate.role !== 'STAFF') {
                return res.status(403).json({ message: "Admins cannot suspend other Admins." });
            }
            const adminDepts = currentUser.departments.map(d => (d._id || d).toString());
            const userDepts = userToUpdate.departments.map(d => (d._id || d).toString());
            const hasAccess = adminDepts.some(deptId => userDepts.includes(deptId));

            if (!hasAccess) {
                return res.status(403).json({ message: "You can only manage staff in your department." });
            }
        } else if (currentUser.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: "Access Denied" });
        }

        const newStatus = userToUpdate.status === 'Active' ? 'Suspended' : 'Active';
        userToUpdate.status = newStatus;
        await userToUpdate.save();

        res.json({ 
            message: `User ${newStatus === 'Active' ? 'Activated' : 'Suspended'} successfully`, 
            status: newStatus 
        });

    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- 11. UPDATE PASSWORD ---
export const updateUserPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (currentPassword && !(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error("Password Update Error:", error);
        res.status(500).json({ message: error.message });
    }
};