# Unirivo

**Unirivo** is a Next.js-powered collaboration platform built for university students and early-stage teams to manage projects, verify skills, and build credible, professional portfolios. It combines modern project management workflows with AI-driven screening and blockchain-backed credentials to create a trustworthy collaboration ecosystem.

---

## Platform Preview

### Landing Experience
<img width="1919" height="865" alt="image" src="https://github.com/user-attachments/assets/8e37baea-9ef7-415e-a8cd-12f88a90f0b4" />


A minimal, dark-themed landing interface designed to communicate focus, collaboration, and convergence of ideas.

---

## Overview

Student teams often struggle with fragmented collaboration, unverifiable contributions, and a lack of credible proof of work. Unirivo addresses this gap by merging:

- Structured project and task management  
- AI-powered skill and candidate verification  
- On-chain certificates as immutable proof of contribution  

The result is a platform where collaboration is not only efficient, but also verifiable.

---

## Key Features

### Project & Task Management
<img width="1902" height="867" alt="image" src="https://github.com/user-attachments/assets/38fda8b8-b45a-44ae-973e-937f80b98d83" />


- Kanban-style task board with drag-and-drop workflow  
- Clear task states: **To Do**, **In Progress**, **Completed**, and **Verified**  
- Role-based access control for admins, project owners, and contributors  
- Structured milestones and task ownership  

---

### Team & Role System

- Create projects with clearly defined roles and required skill sets  
- Accept and manage applications from potential collaborators  
- Project owners verify tasks before final approval  

---

### AI-Powered Screening

- Automated interview sessions for candidate evaluation  
- Timed, dynamically generated skill-verification quizzes  
- Ensures authenticity and reduces bias during onboarding  

---

### Blockchain-Based Credentials
<img width="1918" height="872" alt="image" src="https://github.com/user-attachments/assets/575e3781-de64-4eac-8452-1d763da98292" />


- Mint **on-chain certificates on Solana** for verified contributions  
- Certificates remain locked until officially minted  
- Immutable, wallet-owned proof of contribution  
- Publicly verifiable using transaction signatures  

---

### Profiles & Community

- User profiles showcasing verified contributions  
- Public gallery for projects and collaborations  
- Real-time notifications for task updates and verifications  

---

## Technology Stack

### Frontend
- **Next.js / React 18**
- **Framer Motion** for animations and transitions
- Dark-first UI optimized for focus and clarity

### Backend & Infrastructure
- **MongoDB** for data persistence  
- **NextAuth** for authentication and session handling  
- **Mastra** for AI orchestration and workflows  

### Web3
- **Solana** blockchain for certificate minting  
- Wallet integration for ownership and verification  
- On-chain hashes and transaction signatures for trust  

---

## Certificate Flow (High Level)

1. A contributor completes a task  
2. Project owner verifies the contribution  
3. A certificate is generated and locked  
4. User connects a Solana wallet  
5. Certificate metadata hash is minted on-chain  
6. The transaction becomes a permanent proof of contribution  

---

## Why Unirivo

- **Trust-first collaboration** — contributions are verified, not claimed  
- **Skill-driven teams** — AI ensures merit-based onboarding  
- **Portable credentials** — achievements exist beyond the platform  
- **Student-focused by design** — built for academic and early-career teams  

Unirivo bridges traditional project management with Web3 credentialing, creating a system where work, skill, and effort are transparently recognized.

---

## Local Development

```bash
git clone https://github.com/your-username/unirivo.git
cd unirivo
npm install
npm run dev
