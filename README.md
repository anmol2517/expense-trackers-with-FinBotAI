---

## 🚀 Features

- ✅ User Authentication (Register/Login/Logout)
- ✅ Add, Edit, Delete Expenses
- ✅ Dashboard with Charts & Summary
- ✅ AI Financial Assistant (FinBot)
- ✅ PDF Report Generation
- ✅ JWT Cookie-based Auth
- ✅ MongoDB Atlas Database
- ✅ Production Deployment on AWS EC2
- ✅ CI/CD Pipeline with Jenkins

---

## ⚙️ Environment Variables

Create `.env` file in root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker
JWT_SECRET=your_jwt_secret_minimum_32_characters
GROQ_API_KEY=your_groq_api_key
PORT=3000
NODE_ENV=production
```

---

## 🏃 Run Locally

```bash
# Clone the repo
git clone https://github.com/anmol2517/expense-trackers-with-FinBotAI.git

# Go to project folder
cd expense-trackers-with-FinBotAI

# Install dependencies
npm install

# Create .env file and fill variables
nano .env

# Run development server
npm run dev

# Open browser at
http://localhost:3000
```

---

## ☁️ AWS EC2 Deployment

### 1. Launch EC2 Instance
- AMI: Ubuntu 24.04 LTS
- Instance Type: t3.micro
- Key Pair: Create new .pem file
- Security Group Inbound Rules:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 3000 (Next.js App)
  - Port 8080 (Jenkins)

### 2. Connect to EC2
```bash
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP
```

### 3. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
node -v
npm -v
```

### 4. Add Swap Memory
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 5. Upload Project
```bash
# On local machine
scp -r ./expenseTracker ubuntu@YOUR_EC2_IP:~/
```

### 6. Install & Build
```bash
cd expenseTracker
npm install
nano .env        # Add environment variables
npm run build
```

### 7. Run with PM2
```bash
sudo npm install -g pm2
pm2 start npm --name "expense-tracker" -- start
pm2 startup
pm2 save
```

---

## 🔧 Jenkins CI/CD Pipeline

### Install Jenkins

```bash
# Install Java
sudo apt install fontconfig openjdk-21-jre -y

# Add Jenkins key
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo gpg --dearmor -o /usr/share/keyrings/jenkins-keyring.gpg

# Add Jenkins repository
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install
sudo apt update
sudo apt install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Jenkins Setup Steps
1. Open `http://YOUR_IP:8080`
2. Enter initial admin password
3. Install suggested plugins
4. Create admin user
5. New Item → Pipeline → Name: `expense-tracker-pipeline`

### Jenkinsfile (Pipeline Script)

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

---

## 🗄️ MongoDB Atlas Setup

1. Create account at mongodb.com
2. Create free cluster
3. Database Access → Add user with password
4. Network Access → Add IP `0.0.0.0/0`
5. Connect → Copy connection string to `.env`

---

## 🔐 Security

- JWT tokens stored in httpOnly cookies
- Passwords hashed with bcrypt
- Environment variables never pushed to Git
- `.env` added to `.gitignore`

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/[id]` | Update expense |
| DELETE | `/api/expenses/[id]` | Delete expense |
| GET | `/api/expenses/summary` | Get summary |
| GET | `/api/expenses/report` | Download PDF |
| POST | `/api/chat` | FinBot AI chat |

---

## 👨‍💻 Author

**anmoL**
