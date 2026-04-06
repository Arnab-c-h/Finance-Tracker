const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const prisma = require('../utils/prismaClient');
const passwordUtils = require('../utils/passwordUtils');

const users = [
  { name: 'Admin User', email: 'admin@zorvyn.com', password: 'password123', role: 'admin' },
  { name: 'Analyst User', email: 'analyst@zorvyn.com', password: 'password123', role: 'analyst' },
  { name: 'Viewer User', email: 'viewer@zorvyn.com', password: 'password123', role: 'viewer' }
];

const importData = async () => {
  // Clear first to prevent duplicates
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();

  const hashedUsers = await Promise.all(users.map(async (u) => ({
    ...u,
    password: await passwordUtils.hashPassword(u.password)
  })));

  await prisma.user.createMany({ data: hashedUsers });
  
  const allUsers = await prisma.user.findMany();
  const adminId = allUsers.find(u => u.role === 'admin').id;
  const analystId = allUsers.find(u => u.role === 'analyst').id;
  const viewerId = allUsers.find(u => u.role === 'viewer').id;

  const transactions = [
    { amount: 1500.5, type: 'income', category: 'Salary', createdById: adminId },
    { amount: 200.0, type: 'expense', category: 'Groceries', createdById: adminId },
    { amount: 50.0, type: 'expense', category: 'Transport', createdById: analystId },
    { amount: 1000.0, type: 'income', category: 'Bonus', createdById: analystId },
    { amount: 300.0, type: 'expense', category: 'Utilities', createdById: viewerId },
    { amount: 120.0, type: 'expense', category: 'Dining', createdById: adminId },
    { amount: 85.5, type: 'expense', category: 'Entertainment', createdById: analystId },
    { amount: 2500.0, type: 'income', category: 'Freelance', createdById: viewerId },
    { amount: 450.0, type: 'expense', category: 'Rent', createdById: adminId },
    { amount: 60.0, type: 'expense', category: 'Subscriptions', createdById: analystId },
    { amount: 15.0, type: 'expense', category: 'Coffee', createdById: viewerId },
    { amount: 400.0, type: 'income', category: 'Dividends', createdById: adminId },
    { amount: 75.0, type: 'expense', category: 'Healthcare', createdById: analystId },
    { amount: 220.0, type: 'expense', category: 'Shopping', createdById: viewerId },
    { amount: 500.0, type: 'expense', category: 'Travel', createdById: adminId }
  ];

  await prisma.transaction.createMany({ data: transactions });
  console.log('Data successfully loaded!');
  process.exit();
};

const deleteData = async () => {
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
  console.log('Data successfully deleted!');
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
