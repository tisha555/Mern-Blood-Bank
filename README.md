# 🩸 Blood Bank System | Full-Stack Web Application  

## 📌 Overview  
The *Blood Bank System* is a full-stack web application designed to bridge the gap between blood donors and recipients. This platform ensures timely and hassle-free blood donations while providing a secure and intuitive user experience. Built using *ReactJS, Node.js, and JavaScript*, the system offers a seamless workflow for both donors and recipients, enhancing accessibility and efficiency in blood donation services.  

## 🚀 Technologies Used  
### 🖥 Languages & Frameworks  
- *JavaScript*  
- *ReactJS*  
- *Node.js*  
- *Express.js*  

### 🗄 Databases  
- *MongoDB* (for NoSQL storage)  
- *MySQL* (for relational storage)  

### 🔐 Authentication & Security  
- *JWT (JSON Web Token)* - Secure user authentication  

### 🌐 Other Tools & Libraries  
- *Redux* (State management)  
- *Axios* (HTTP requests)  
- *MERN Stack* (MongoDB, Express.js, ReactJS, Node.js)  

## ✨ Features  
### 🔹 User Authentication & Authorization  
- Secure *JWT-based authentication* for user login and registration  
- Role-based access control (Admin, Donor, Recipient)  

### 🔹 Donor Registration & Blood Availability  
- Donors can *register and list* their available blood type and location  
- Recipients can *search for available donors* based on blood type and location  

### 🔹 Blood Request & Donation Management  
- Users can *request blood* from available donors  
- Donors receive *notifications/requests* for blood donation  

### 🔹 User Dashboard & Profiles  
- A dedicated *dashboard* for donors and recipients to manage their activities  
- Profile management with donation/request history  

### 🔹 Admin Panel (If Implemented)  
- View and manage donor/recipient requests  
- Monitor blood availability and donation statistics  

### 🔹 Responsive & Intuitive UI  
- Fully *responsive design* for accessibility across devices  
- Clean and *user-friendly interface* built with ReactJS  

---

## 🛠 Installation & Setup  

### 🔹 Prerequisites  
Ensure you have the following installed on your system:  
- *Node.js* (latest LTS version)  
- *npm* or *yarn*  
- *MongoDB / MySQL* (whichever you used)  
- *Git*  




### 🔹 Backend Setup  
1. Navigate to the backend folder:  
   bash
   cd server
   
2. Install dependencies:  
   bash
   npm install
   
3. Create a .env file in the server folder and add the following variables:  
   env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string   # For MongoDB users
   MYSQL_HOST=your_mysql_host                 # For MySQL users
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=your_mysql_database
   JWT_SECRET=your_secret_key
   
4. Start the backend server:  
   bash
   npm start
   

### 🔹 Frontend Setup  
1. Navigate to the frontend folder:  
   bash
   cd ../client
   
2. Install dependencies:  
   bash
   npm install
   
3. Create a .env file in the client folder and add:  
   env
   
   
4. Start the frontend:  
   bash
   npm start
   
   The React app should now be running on https://red-bridge-1.preview.emergentagent.com/

### 🔹 Database Setup  
#### MongoDB Setup (if using MongoDB)  
1. Ensure MongoDB is running locally or use *MongoDB Atlas*.  
2. The MONGO_URI in .env should contain your MongoDB connection string.  

#### MySQL Setup (if using MySQL)  
1. Create a new MySQL database:  
   sql
   CREATE DATABASE blood_bank;
   
2. Import the database schema if available:  
   bash
   mysql -u your_mysql_user -p blood_bank < database.sql
   
3. Make sure the .env file contains correct MySQL credentials.  

---

## 🎯 Impact & Contribution  
This project aims to *simplify blood donation processes, making it easier for people to **find and donate blood in emergencies*. It contributes to community welfare by ensuring that no request goes unanswered.
