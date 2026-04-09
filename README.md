<div align="center">

# 💸 EXPENSE TRACKER · FINBOT AI

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens)
![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?style=for-the-badge&logo=amazonaws)
![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A full-stack Expense Tracking application with AI-powered Financial Assistant.

*Next.js 16 · MongoDB Atlas · JWT Auth · GROQ AI · AWS EC2 · Jenkins CI/CD · PM2*

[Features](#-features) • [Project Structure](#-project-structure) • [Setup](#-run-locally) • [AWS Deployment](#-aws-ec2-deployment-step-by-step) • [Jenkins CI/CD](#-jenkins-cicd-pipeline-setup) • [API Docs](#-api-endpoints)

</div>

---

## ✨ Features

- ✅ User Registration & Login with JWT Authentication
- ✅ Add, Edit, Delete Expenses
- ✅ Dashboard with Charts & Expense Summary
- ✅ AI-Powered Financial Assistant (FinBot) using GROQ
- ✅ PDF Expense Report Generation
- ✅ Secure httpOnly Cookie-based Auth
- ✅ MongoDB Atlas Cloud Database
- ✅ Production Deployment on AWS EC2
- ✅ PM2 for 24/7 App Uptime
- ✅ CI/CD Pipeline with Jenkins (Auto Deploy on Git Push)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 16 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| Database | MongoDB Atlas, Mongoose ODM |
| Authentication | JWT (jose library), httpOnly Cookies |
| AI Assistant | GROQ API (FinBot) |
| Validation | Zod |
| Process Manager | PM2 |
| CI/CD | Jenkins |
| Cloud | AWS EC2 (Ubuntu 24.04) |
| Version Control | GitHub |

---

## 📁 Project Structure

```
expenseTracker/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts         # POST - User login, sets JWT cookie
│   │   │   ├── logout/route.ts        # POST - Clears JWT cookie
│   │   │   ├── me/route.ts            # GET  - Returns current logged-in user
│   │   │   └── register/route.ts      # POST - Register new user
│   │   ├── expenses/
│   │   │   ├── route.ts               # GET/POST - List & create expenses
│   │   │   ├── [id]/route.ts          # PUT/DELETE - Update & delete expense
│   │   │   ├── report/route.ts        # GET - Download PDF report
│   │   │   └── summary/route.ts       # GET - Expense summary & stats
│   │   └── chat/route.ts              # POST - FinBot AI chat endpoint
│   ├── dashboard/page.tsx             # Dashboard with charts
│   ├── expenses/page.tsx              # All expenses list page
│   ├── assistant/page.tsx             # FinBot AI assistant page
│   ├── login/page.tsx                 # Login page
│   └── register/page.tsx             # Register page
├── components/                        # Reusable React UI components
├── lib/
│   ├── auth.ts                        # JWT create, verify, cookie functions
│   ├── db.ts                          # MongoDB connection handler
│   └── validations.ts                 # Zod input validation schemas
├── models/
│   └── User.ts                        # Mongoose User schema & model
├── public/                            # Static assets (images, icons)
├── .env                               # Environment variables (never push to Git!)
├── .gitignore                         # Git ignore rules
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
└── package.json                       # Project dependencies & scripts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root of your project:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_minimum_32_characters_long
GROQ_API_KEY=your_groq_api_key_from_console.groq.com
PORT=3000
NODE_ENV=production
```

> ⚠️ **WARNING:** Never push `.env` to GitHub. It is already added to `.gitignore`.

---

## 🏃 Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/anmol2517/expense-trackers-with-FinBotAI.git

# 2. Go into project folder
cd expense-trackers-with-FinBotAI

# 3. Install all dependencies
npm install

# 4. Create .env file and add your variables
nano .env

# 5. Run development server
npm run dev

# 6. Open in browser
# http://localhost:3000
```

---

## 🗄️ MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new **free cluster** (M0)
3. Go to **Database Access** → Add a new database user with username & password
4. Go to **Network Access** → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)
5. Go to **Connect** → Connect your application → Copy the connection string
6. Paste the connection string in your `.env` file as `MONGODB_URI`
7. Replace `<password>` with your actual database user password

---

## ☁️ AWS EC2 Deployment (Step by Step)

### Step 1 — Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu 24.04 LTS** AMI
3. Instance type: **t3.micro** (free tier eligible)
4. Create a new **Key Pair** → Download `.pem` file (keep it safe!)
5. Configure Security Group — Add these Inbound Rules:

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| SSH | TCP | 22 | 0.0.0.0/0 |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 |

6. Launch the instance and note the **Public IPv4 address**

---

### Step 2 — Connect to EC2 via SSH

```bash
ssh -i "your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

---

### Step 3 — Install Node.js on EC2

```bash
# Update packages
sudo apt update

# Add Node.js v20 repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install nodejs -y

# Verify installation
node -v
npm -v
```

---

### Step 4 — Add Swap Memory (Prevents build crashes on low RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify swap
free -h
```

---

### Step 5 — Upload Project to EC2

```bash
# Run this on your LOCAL machine (not EC2)
scp -r ./expenseTracker ubuntu@YOUR_EC2_IP:~/
```

---

### Step 6 — Setup Project on EC2

```bash
# Go into project folder
cd expenseTracker

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your environment variables, then Ctrl+X → Y → Enter to save

# Build the production app
npm run build
```

---

### Step 7 — Run App with PM2 (24/7 Uptime)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app
pm2 start npm --name "expense-tracker" -- start

# Setup PM2 to auto-start on server reboot
pm2 startup
# Copy and run the command that PM2 outputs

# Save current PM2 process list
pm2 save

# Check app status
pm2 status
```

---

## 🔧 Jenkins CI/CD Pipeline Setup

### What is CI/CD?
CI/CD (Continuous Integration / Continuous Deployment) means every time you push code to GitHub, Jenkins automatically pulls the new code, installs dependencies, builds the app, and deploys it — without any manual work!

---

### Step 1 — Install Java (Jenkins requires Java)

```bash
sudo apt install fontconfig openjdk-21-jre -y

# Verify
java -version
```

---

### Step 2 — Install Jenkins

```bash
# Add Jenkins GPG key
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo gpg --dearmor -o /usr/share/keyrings/jenkins-keyring.gpg

# Add Jenkins repository
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update and install
sudo apt update
sudo apt install jenkins -y

# Start Jenkins service
sudo systemctl start jenkins

# Enable Jenkins to start on reboot
sudo systemctl enable jenkins

# Check Jenkins status
sudo systemctl status jenkins
```

---

### Step 3 — Access Jenkins UI

1. Open browser: `http://YOUR_EC2_IP:8080`
2. Get initial admin password:
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
3. Paste password in Jenkins UI
4. Click **"Install suggested plugins"**
5. Create your admin user (username, password, email)
6. Click **Save and Finish**

---

### Step 4 — Create Pipeline Job

1. Click **"New Item"**
2. Enter name: `expense-tracker-pipeline`
3. Select **"Pipeline"** → Click **OK**
4. In **"Pipeline"** section, paste this script:

```groovy
pipeline {
    agent any
    stages {
        stage('Clone') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/anmol2517/expense-trackers-with-FinBotAI.git'
            }
        }
        stage('Install') {
            steps {
                sh 'npm install'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Deploy') {
            steps {
                sh 'pm2 restart expense-tracker || pm2 start npm --name "expense-tracker" -- start'
            }
        }
    }
}
```

5. Click **Save**
6. Click **"Build Now"**
7. Check **Console Output** — you will see `Finished: SUCCESS` ✅

---

## 📊 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login & get JWT cookie | ❌ |
| POST | `/api/auth/logout` | Logout & clear cookie | ✅ |
| GET | `/api/auth/me` | Get current user info | ✅ |
| GET | `/api/expenses` | Get all user expenses | ✅ |
| POST | `/api/expenses` | Create new expense | ✅ |
| PUT | `/api/expenses/[id]` | Update an expense | ✅ |
| DELETE | `/api/expenses/[id]` | Delete an expense | ✅ |
| GET | `/api/expenses/summary` | Get expense stats | ✅ |
| GET | `/api/expenses/report` | Download PDF report | ✅ |
| POST | `/api/chat` | Chat with FinBot AI | ✅ |

---

## 🔐 Security Measures

- Passwords hashed using **bcrypt**
- JWT tokens stored in **httpOnly cookies** (not accessible via JavaScript)
- Input validation using **Zod** schemas
- `.env` file added to `.gitignore` — never pushed to GitHub
- MongoDB Atlas Network Access configured per environment

---

## 👨‍💻 Author

**Anmol**
- GitHub: [@anmol2517](https://github.com/anmol2517)
