# Canteen Scan & Serve

Project Name:
Smart Canteen – QR Based Food Ordering System

Objective

Build a full-stack Smart Canteen Web Application that allows students to order food, chefs to prepare orders, and admins to manage operations using a QR-based pickup system with physical food nests.

The system must support three user roles:

Student

Chef

Admin

The application must include authentication, QR code scanning using the device camera, order management, and a unique pickup code system.

User Roles and Functionalities

1. Student (Customer)

Students can:

• Register
• Login
• Browse food menu
• Add items to cart
• Place orders
• Receive a QR Code bill
• Receive a unique pickup code

Example Menu

ItemPriceFried Rice₹120Coke₹40Samosa₹10Noodles₹100

Ordering Flow

Student selects:

Fried Rice (₹120)
Coke (₹40)

Total = ₹160

After placing order the system generates:

Bill QR Code

The QR must contain:

Order ID
Items Ordered
Total Amount
Order Time
Student Name

Below the QR code show a pickup code.

Pickup Code Rules

Generate an 8 digit code.

Example:

49261784

Rule:

First 4 digits → Random number
Last 4 digits → Special identifier used by chef/admin

Example codes:

58213491
72963420
11450987

Student shows this code when picking up food.

Chef Dashboard

The chef sees live incoming orders.

Chef interface should show:

Order ID
Food Items
Order Time
Pickup Code

Chef must be able to:

• Mark order as Preparing
• Mark order as Ready
• Assign a Nest number

Nest System (Important Feature)

There are 16 physical food nests in the canteen.

Nest numbers:

Nest 1
Nest 2
Nest 3
...
Nest 16

Each nest has a QR code sticker placed on it physically.

Chef workflow:

Chef prepares food

Chef scans the Nest QR code using the app camera

The system assigns that order to the scanned nest

Example:

Order #1043
Pickup Code: 49261784
Assigned Nest: 07

Student app shows:

"Your order is ready at Nest 07"

QR Nest System

Each Nest QR contains:

NestID:01
NestID:02
NestID:03
...
NestID:16

Chef scans the QR using the device camera.

The app automatically assigns the order to that nest.

Admin Dashboard

Admin can manage everything.

Admin features:

• View all users
• View all orders
• View revenue
• Monitor nest usage
• Scan order QR codes
• Verify pickup codes

Admin can also override nest assignment if needed.

Camera QR Scanning

The application must use the device built-in camera.

QR scanning should work for:

Chef scanning Nest QR

Admin scanning Order QR

Use browser APIs:

WebRTC
MediaDevices.getUserMedia()

Compatible with:

Mobile browsers
Android
iPhone

System Architecture

Frontend:

React.js or modern JavaScript

Backend:

Node.js
Express.js

Database:

MongoDB

Real-time updates:

Socket.io

QR generation:

qrcode library

QR scanning:

html5-qrcode

UI/UX Requirements

The UI must be simple like food ordering apps.

Student App Layout:

Top section

Profile icon
User name
Search bar

Middle

Food categories
Menu cards

Bottom

Cart button (floating)

Cart screen

Items
Quantity control
Total price
Place order button

Order Success Screen

Show:

Order Successful

Display:

QR Code
8 Digit Pickup Code
Nest Number (after chef assigns)

Example display:

Order ID: 1043
Pickup Code: 49261784
Nest: 07

Real-Time Updates

When chef marks order ready:

Student dashboard updates instantly:

"Your order is ready at Nest 07"

Security

Use JWT authentication.

Each role must only access its dashboard.

Student cannot access admin panel.

Chef cannot access user management.

MVP Requirements

The generated system must be:

• Fully functional
• Mobile responsive
• Error-free navigation
• Real-time order updates
• Camera QR scanning enabled

Sample Workflow



<img width="1254" height="1254" alt="8af01a04-0ac5-4ae9-8921-d35f3510e45a" src="https://github.com/user-attachments/assets/31a9df11-9a29-4156-bcd2-fa84cf71c74c" />









Generate a working MVP web application including:

Frontend
Backend
Database models
Authentication
QR generation
QR scanning
Role based dashboards

The app must run locally using:

npm install
npm start

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3a2b6e62-bf84-4875-9409-1230d7757b40).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
