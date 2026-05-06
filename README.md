# Sanghathi Frontend

![Sanghathi App Logo](public/logo.jpeg)

Sanghathi Frontend is the user interface layer of the Sanghathi mentoring platform. It enables admins, faculty, mentors, and students to collaborate through one system for academic tracking, communication, and guidance workflows.

## Project Report

### 1. Project Title

Sanghathi: AI-Powered Mentoring Tool (Frontend Module)

### 2. Abstract

This project delivers a role-based web interface for mentoring operations in educational institutions. The frontend is built with React and Vite, and it connects to backend services for authentication, student lifecycle data, reporting, uploads, notifications, and chat. The objective is to provide a unified, user-friendly platform that improves mentor-mentee coordination and academic monitoring.

### 3. Problem Statement

Mentoring and student performance processes are often distributed across spreadsheets, chats, and manual records. This creates delays, data inconsistency, and low visibility for stakeholders. Sanghathi solves this by centralizing workflows into one dashboard-driven application.

### 4. Objectives

- Build secure role-based access and navigation.
- Provide structured forms for student and academic data.
- Support mentor-mentee engagement through communication tools.
- Enable score tracking for IAT, TYL, attendance, and other outcomes.
- Offer responsive and maintainable UI architecture for scale.

### 5. Scope

- Authentication and protected routes.
- Admin and department-level dashboards.
- Student profile and semester data modules.
- Chat, meetings, and notifications.
- Reports and score visualization.
- Bulk upload user journeys integrated with backend APIs.

## Technology Stack

- React
- Vite
- Material UI
- Emotion
- React Router DOM
- React Hook Form
- Yup
- Socket.IO client
- Notistack
- Framer Motion
- FullCalendar
- Google Generative AI
- Vitest
- Testing Library

## Core Modules

1. **Authentication and routing**: JWT-based sign-in, sign-up, forgot-password, and protected role routes.
2. **Role-based dashboards**: Admin, faculty, student, HOD, director, placement, feedback, complaint, and career-review dashboards.
3. **Student data management**: Admission, profile, academics, attendance, guardian, and contact workflows.
4. **Mentor workflows**: Mentor allocation, mentee tracking, and mentorship-linked records.
5. **Communication**: Real-time chat and meeting workflows.
6. **Academic reporting**: IAT, TYL, external marks, attendance, MOOC, and mini-project tracking.
7. **User feedback and alerts**: Snackbar-based notifications and UX feedback flows.
8. **AI assistant**: Gemini-backed assistant integration for guided interactions.

## Project Outcome

The Sanghathi Frontend provides an organized, role-aware experience that reduces manual overhead and improves data visibility across mentoring teams. It serves as the interaction layer for daily institutional mentoring operations.

See [contribute.md](contribute.md) for contribution standards.

## License

This project is licensed under the [MIT License](LICENSE).
