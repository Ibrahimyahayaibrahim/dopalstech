import Program from '../models/Program.js';
import Participant from '../models/Participant.js'; 
import { customAlphabet } from 'nanoid';
// import { logActivity } from "../utils/activityLogger.js"; // Uncomment if you have this utility

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 10);

const createSlug = (name, suffix = '') => {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const cleanSuffix = suffix ? `-${suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';
  return `${cleanName}${cleanSuffix}-${nanoid()}`; 
};

// --- 1. CREATE PROGRAM (With Cloudinary & Version Logic) ---
export const createProgram = async (req, res) => {
  try {
    const { 
      name, type, date, description, cost, departmentId, 
      frequency, courseTitle, venue, 
      startupsCount, participantsCount,
      structure, parentId, customSuffix, formFields 
    } = req.body;

    // ✅ Handle Cloudinary Files
    const flyer = req.files?.flyer?.[0]?.path || ''; 
    const proposal = req.files?.proposal?.[0]?.path || '';

    if (!req.user) return res.status(401).json({ message: "Not Authorized" });

    // ✅ Parse Form Fields
    let parsedFormFields = [];
    if (typeof formFields === 'string') {
        try { parsedFormFields = JSON.parse(formFields); } catch (e) { parsedFormFields = []; }
    } else { parsedFormFields = formFields || []; }

    // ✅ Build Data Object
    let programData = {
      name, type, structure: structure || 'One-Time', 
      description, cost, frequency, department: departmentId, createdBy: req.user._id,
      flyer, proposal, courseTitle, venue, startupsCount, participantsCount,
      status: req.user.role === 'SUPER_ADMIN' ? 'Approved' : 'Pending',
      registration: { isOpen: true, formFields: parsedFormFields }
    };

    // --- Logic for Blueprints vs Instances ---
    if (!parentId && (structure === 'Recurring' || structure === 'Numerical')) {
        programData.date = null;
        programData.registration.linkSlug = null; 
    } 
    else if (!parentId && structure === 'One-Time') {
        programData.date = date ? new Date(date) : new Date();
        programData.registration.linkSlug = createSlug(name);
    }
    else if (parentId) {
      const parent = await Program.findById(parentId);
      if (!parent) return res.status(404).json({ message: "Parent program not found" });
      
      programData.parentProgram = parent._id;
      programData.structure = parent.structure;
      programData.date = date ? new Date(date) : new Date();
      if (!venue) programData.venue = parent.venue;
      if (!cost) programData.cost = parent.cost;

      if (parent.structure === 'Numerical') {
        const lastChild = await Program.findOne({ parentProgram: parent._id }).sort({ batchNumber: -1 });
        const nextBatch = (lastChild?.batchNumber || 0) + 1;
        programData.batchNumber = nextBatch;
        const suffix = customSuffix || `Batch ${nextBatch}`;
        programData.name = `${parent.name} - ${suffix}`;
        programData.customSuffix = suffix;
        programData.registration.linkSlug = createSlug(parent.name, suffix);
      } else {
        const suffix = customSuffix || new Date(programData.date).toLocaleDateString();
        programData.versionLabel = suffix;
        programData.name = `${parent.name} - ${suffix}`;
        programData.customSuffix = suffix;
        programData.registration.linkSlug = createSlug(parent.name, suffix);
      }
    }

    const program = new Program(programData);
    const createdProgram = await program.save(); 

    // await logActivity(req.user._id, "CREATE_PROGRAM", `Created: ${program.name}`, program.department);

    res.status(201).json(createdProgram);

  } catch (error) {
    console.error("Create Program Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// --- 2. GET ALL PROGRAMS ---
export const getAllPrograms = async (req, res) => {
    try {
        const { department, parentOnly } = req.query;
        const filter = {};
        
        if (department) filter.department = department;
        if (parentOnly === 'true') filter.parentProgram = null;

        const programs = await Program.find(filter)
            .populate('department', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
            
        res.json(programs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 3. GET PROGRAMS BY DEPARTMENT ---
export const getProgramsByDepartment = async (req, res) => {
    try {
        const programs = await Program.find({ department: req.params.departmentId })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json(programs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 4. GET SINGLE PROGRAM ---
export const getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('department', 'name')
      .populate('createdBy', 'name email')
      .populate('participants')
      .populate({
          path: 'updates.user',
          select: 'name fullName email' 
      });

    if (!program) return res.status(404).json({ message: 'Program not found' });

    let children = [];
    if (program.structure !== 'One-Time' && !program.parentProgram) {
      children = await Program.find({ parentProgram: program._id }).sort({ createdAt: -1 });
    }

    res.json({ ...program.toObject(), children });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 5. UPDATE PROGRAM ---
export const updateProgram = async (req, res) => {
    try {
        const { date, registrationDeadline, registrationOpen, ...rest } = req.body;
        const program = await Program.findById(req.params.id);
        
        if (!program) return res.status(404).json({ message: "Program not found" });

        const updateData = { ...rest };
        
        if (date) updateData.date = new Date(date);
        if (typeof registrationOpen !== 'undefined') updateData['registration.isOpen'] = registrationOpen;
        if (registrationDeadline !== undefined) {
            updateData['registration.deadline'] = registrationDeadline ? new Date(registrationDeadline) : null;
        }

        const updatedProgram = await Program.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedProgram);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 6. UPDATE STATUS ---
export const updateProgramStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const program = await Program.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        ).populate('createdBy', 'email name');
        
        // if (program) { await logActivity(req.user._id, "UPDATE_STATUS", `Changed status to ${status}`, program.department); }
        
        res.json(program);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 7. COMPLETE PROGRAM ---
export const markProgramComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { actualAttendance, startDate, endDate, driveLink, completionComment } = req.body;
        
        // Handle Cloudinary file for final report
        const finalDocument = req.file ? req.file.path : null;

        const program = await Program.findById(id);
        if (!program) return res.status(404).json({ message: "Program not found" });

        program.status = 'Completed';
        program.actualAttendance = actualAttendance || 0;
        program.actualDate = { 
            start: startDate ? new Date(startDate) : program.date, 
            end: endDate ? new Date(endDate) : program.date 
        };
        program.driveLink = driveLink || '';
        
        if (finalDocument) program.finalDocument = finalDocument;
        
        if (completionComment) {
            program.updates.push({ 
                text: `PROGRAM COMPLETED: ${completionComment}`, 
                user: req.user._id, 
                date: new Date() 
            });
        }

        await program.save();
        res.json(program);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// --- 8. CHAT / UPDATES ---
export const addProgramUpdate = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!req.user) return res.status(401).json({ message: "You must be logged in to post." });

    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    program.updates.push({ 
        text, 
        user: req.user._id, 
        date: new Date() 
    });
    
    await program.save();

    const updatedProgram = await Program.findById(req.params.id)
        .populate({
            path: 'updates.user',
            select: 'name fullName email'
        });

    res.json(updatedProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 9. MANAGE PARTICIPANTS ---
export const addParticipantManually = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, gender, organization, state, ageGroup, ...otherData } = req.body;

        if (!email && !phone) return res.status(400).json({ message: "Email or Phone is required" });

        let query = [];
        if (email) query.push({ email });
        if (phone) query.push({ phone });

        let participant = await Participant.findOne({ $or: query });

        if (participant) {
            if (!participant.programs.includes(id)) {
                participant.programs.push(id);
                // Update basic fields if provided
                if (fullName) participant.fullName = fullName;
                await participant.save();
            }
        } else {
            participant = await Participant.create({
                fullName: fullName || 'Unknown',
                email, phone, gender, organization, state, ageGroup,
                consent: true,
                programs: [id],
                referralSource: 'Admin Manual Add',
                data: otherData
            });
        }

        await Program.findByIdAndUpdate(id, { $addToSet: { participants: participant._id } });
        res.status(200).json({ message: "Participant added successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const importParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const { participants } = req.body;
        
        if (!Array.isArray(participants)) return res.status(400).json({ message: "Invalid data format" });

        let addedCount = 0;
        for (const p of participants) {
            if (!p.email && !p.phone) continue;

            let query = [];
            if (p.email) query.push({ email: p.email });
            if (p.phone) query.push({ phone: p.phone });

            let participant = await Participant.findOne({ $or: query });

            if (participant) {
                if (!participant.programs.includes(id)) {
                    participant.programs.push(id);
                    await participant.save();
                }
            } else {
                participant = await Participant.create({
                    fullName: p.fullName || 'Unknown',
                    email: p.email, phone: p.phone, gender: p.gender,
                    organization: p.organization, state: p.state,
                    consent: true, programs: [id],
                    referralSource: 'Admin Bulk Import'
                });
            }
            await Program.findByIdAndUpdate(id, { $addToSet: { participants: participant._id } });
            addedCount++;
        }
        res.status(200).json({ message: `Successfully processed ${addedCount} participants.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removeParticipant = async (req, res) => {
    try {
        const { id, participantId } = req.params;
        await Program.findByIdAndUpdate(id, { $pull: { participants: participantId } });
        await Participant.findByIdAndUpdate(participantId, { $pull: { programs: id } });
        res.status(200).json({ message: "Participant removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 10. PUBLIC REGISTRATION ---
export const getPublicProgram = async (req, res) => {
    try {
        const { id } = req.params;
        // Try to find by slug first
        let program = await Program.findOne({ 'registration.linkSlug': id })
            .select('name description date venue flyer registration status type department')
            .populate('department', 'name');

        // Fallback to ID if slug fails
        if (!program && id.match(/^[0-9a-fA-F]{24}$/)) {
            program = await Program.findById(id)
                .select('name description date venue flyer registration status type department')
                .populate('department', 'name');
        }

        if (!program) return res.status(404).json({ message: 'Program not found' });
        res.json(program);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const registerParticipant = async (req, res) => {
    try {
        const { programId } = req.params;
        const data = req.body;

        let program = await Program.findOne({ 'registration.linkSlug': programId });
        if (!program && programId.match(/^[0-9a-fA-F]{24}$/)) {
            program = await Program.findById(programId);
        }

        if (!program) return res.status(404).json({ message: "Program not found" });
        if (program.registration?.isOpen === false) {
            return res.status(400).json({ message: "Registration is closed." });
        }

        let participant = await Participant.findOne({ 
            $or: [{ email: data.email }, { phone: data.phone }] 
        });

        if (!participant) {
            participant = await Participant.create({ ...data, programs: [program._id] });
        } else {
            if (!participant.programs.includes(program._id)) {
                participant.programs.push(program._id);
                if(data.fullName) participant.fullName = data.fullName;
                await participant.save();
            } else {
                return res.status(400).json({ message: "You are already registered." });
            }
        }

        await Program.findByIdAndUpdate(program._id, { $addToSet: { participants: participant._id } });
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};