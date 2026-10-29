# Full-Stack Deployment Guide: Cloud & Production

**System:** Event Ticket Booking & Reservation System  
**Backend:** Render / Railway / Docker (Java 21 LTS + Spring Boot 3.4)  
**Frontend:** Vercel / Netlify (React + Vite)  
**Database:** MongoDB Atlas (Shared or Dedicated Cluster with Replica Set)

---

## 1. MongoDB Atlas Configuration

MongoDB Atlas provides a fully managed, 3-node replica set out of the box, supporting multi-document ACID transactions.

### Step 1: Create a Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 (Free)** or **M10 (Dedicated)** cluster in your target region.
3. Ensure the cluster is configured as a **Replica Set** (default in Atlas).

### Step 2: Database User Security
1. Navigate to **Database Access** $\rightarrow$ **Add New Database User**.
2. Authentication Method: **Password**.
3. Built-in Roles: `readWriteAnyDatabase` or `readWrite@ticket_booking`.
4. Securely store the password.

### Step 3: Network Access
1. Navigate to **Network Access** $\rightarrow$ **Add IP Address**.
2. For cloud hosting (Render/Vercel): Add `0.0.0.0/0` (Allow access from anywhere).
3. For restricted access: Add your server's static outbound IP.

### Step 4: Obtain Connection String
1. Click **Connect** $\rightarrow$ **Drivers** (Java).
2. Copy the connection string format:
```text
mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/ticket_booking?retryWrites=true&w=majority
```

---

## 2. Spring Boot Backend Deployment (Render Example)

Render provides native Docker and Web Service hosting for Java.

### Option A: Direct Web Service
1. In Render Dashboard, click **New Web Service** and connect your GitHub repository.
2. Root Directory: `backend`
3. Runtime: **Docker** or **Java**
4. Build Command:
```bash
./mvnw clean package -DskipTests
```
5. Start Command:
```bash
java -jar target/event-ticket-booking-backend-1.0.0.jar
```
6. Add Environment Variables:
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/ticket_booking?retryWrites=true&w=majority`
   - `MONGODB_DATABASE`: `ticket_booking`
   - `JWT_SECRET`: `4c8b2f91a03e456d8c9b2f91a03e456d8c9b2f91a03e456d8c9b2f91a03e456d`
   - `CLIENT_ORIGIN`: `https://your-frontend.vercel.app`
   - `PORT`: `8080`

### Option B: Dockerfile
A portable Dockerfile for cloud deployment:
```dockerfile
# Build Stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 3. React Frontend Deployment (Vercel Example)

Vercel provides edge hosting and automatic continuous deployment for Vite apps.

1. In Vercel Dashboard, click **Add New Project** and import the repository.
2. Root Directory: `frontend`
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com` (Your deployed Spring Boot backend URL)
7. Click **Deploy**.

---

## 4. Production Environment Checklist

| Component | Variable Name | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| **Backend** | `MONGODB_URI` | Atlas Replica Set Connection | `mongodb+srv://user:pass@cluster...` |
| **Backend** | `JWT_SECRET` | 256-bit Token Signing Key | `4c8b2f91a03e456d8c...` |
| **Backend** | `CLIENT_ORIGIN` | Allowed Frontend CORS Origins | `https://ticket-app.vercel.app` |
| **Backend** | `PORT` | Web Server Port | `8080` |
| **Frontend** | `VITE_API_URL` | Backend Endpoint Base URL | `https://ticket-api.onrender.com` |

---

## 5. Troubleshooting Guide

### Issue 1: `MongoCommandException: Transaction numbers are only allowed on a replica set`
- **Cause:** Backend was pointed to a standalone MongoDB instance that lacks replica set configuration.
- **Solution:** Ensure your local mongod was started with `--replSet rs0` and `rs.initiate()` was run, or use MongoDB Atlas.

### Issue 2: CORS Header 'Access-Control-Allow-Origin' Missing
- **Cause:** The frontend origin URL is not listed in `CLIENT_ORIGIN`.
- **Solution:** Add the exact Vercel frontend URL (including `https://`) to the `CLIENT_ORIGIN` environment variable on the backend host.

### Issue 3: DNS Lookup Failure on Atlas URI (`mongodb+srv://`)
- **Cause:** Corporate firewall or VPN blocking SRV DNS queries (UDP port 53).
- **Solution:** Use the standard non-SRV connection string provided in MongoDB Atlas under "Drivers" $\rightarrow$ "I am using driver version 3.4 or earlier".

