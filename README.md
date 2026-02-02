🚀 Dopals Tech Dashboard
A comprehensive Organization Management System built for Dopals Technologies. This centralized dashboard manages staff, tracks program impacts, handles departmental activities, and visualizes real-time global intelligence data.

✨ Key Features
🔐 Role-Based Access Control (RBAC):

Super Admin: Full system control.

Admin: Department-level management.

Staff: Personal activity tracking and reporting.

📊 Global Intelligence & Analytics:

Unified Activity Feed for all users.

Interactive charts (Impact Growth, Financials, Demographics) using Recharts.

Real-time system audit logs.

📧 Automated Email System:

Powered by Brevo (formerly Sendinblue).

Automated Welcome Emails (with credentials).

Password Reset flows.

🎨 Modern UI/UX:

Dark Mode support (System-wide).

Responsive design for Mobile & Desktop.

Smooth animations with Framer Motion.

📂 Department & Program Management:

Create, track, and approve programs.

Staff migration between departments.

🛠️ Tech Stack
Frontend (Client)
Framework: React (Vite)

Styling: Tailwind CSS

State Management: React Context API

Visualization: Recharts

Icons: Lucide React

Animations: Framer Motion

HTTP Client: Axios

Backend (Server)
Runtime: Node.js

Framework: Express.js

Database: MongoDB (Mongoose)

Authentication: JWT (JSON Web Tokens)

Email Service: @getbrevo/brevo

Security: Bcryptjs, CORS

🚀 Getting Started
Prerequisites
Node.js (v18 or higher)

MongoDB (Local or Atlas)

Brevo Account (for API Key)

1. Clone the Repository
Bash

git clone https://github.com/your-username/dopals-dashboard.git
cd dopals-dashboard
2. Backend Setup
Navigate to the backend folder and install dependencies:

Bash

cd backend
npm install
Create a .env file in the backend folder:

Code snippet

PORT=5000
MONGO_URI=mongodb+srv://<your_db_string>
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# Brevo Email Configuration
BREVO_API_KEY=xkeysib-YOUR_LONG_API_KEY_HERE
BREVO_SENDER_EMAIL=your_verified_sender@dopalstech.com
Start the Server:

Bash

npm run dev
# Server runs on http://localhost:5000
3. Frontend Setup
Open a new terminal, navigate to the client folder, and install dependencies:

Bash

cd client # or whatever your frontend folder is named
npm install
Create a .env file in the client folder:

Code snippet

VITE_API_URL=http://localhost:5000/api
Start the React App:

Bash

npm run dev
# App runs on http://localhost:5173
📧 Email Configuration (Brevo)
This project uses Brevo for transactional emails. To ensure emails are delivered:

Create a free account at Brevo.com.

Go to Senders & IP and verify the email address you act as the sender.

Generate an API Key (v3) from SMTP & API.

Update the backend/.env file with these details.

📂 Project Structure
dopals-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route logic (Auth, User, Reports)
│   │   ├── models/         # Mongoose Schemas
│   │   ├── routes/         # API Routes
│   │   ├── services/       # External services (Brevo, Cloudinary)
│   │   └── utils/          # Helper functions
│   ├── .env
│   └── server.js           # Entry point
│
├── client/
│   ├── src/
│   │   ├── assets/         # Images, Logos
│   │   ├── components/     # Reusable UI (Charts, Cards, Modals)
│   │   ├── context/        # Theme & Auth Context
│   │   ├── pages/          # Main Dashboard Views
│   │   └── services/       # Axios instance
│   └── index.html
└── README.md
🤝 Contributing
Fork the repository.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📝 License
Distributed under the MIT License. See LICENSE for more information.

Developed for Dopals Technologies.