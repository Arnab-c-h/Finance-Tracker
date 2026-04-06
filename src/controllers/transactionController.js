const prisma = require('../utils/prismaClient');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllTransactions = catchAsync(async (req, res, next) => {
  // If user is not admin, forcefully scope query to their own ID
  if (req.user.role !== 'admin') {
    req.query.createdById = req.user.id;
  }

  const features = new APIFeatures(req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const args = features.getArgs();
  const docs = await prisma.transaction.findMany(args);

  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: {
      data: docs
    }
  });
});

exports.getTransaction = catchAsync(async (req, res, next) => {
  const doc = await prisma.transaction.findFirst({
    where: { id: req.params.id }
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  if (doc.createdById !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to view this record', 403));
  }

  res.status(200).json({
    status: 'success',
    data: { data: doc }
  });
});

exports.createTransaction = catchAsync(async (req, res, next) => {
  // Only allow whitelisted fields to prevent mass assignment
  const filteredBody = filterObj(req.body, 'amount', 'type', 'category', 'date', 'notes');
  filteredBody.createdById = req.user.id;

  const doc = await prisma.transaction.create({
    data: filteredBody
  });

  res.status(201).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.updateTransaction = catchAsync(async (req, res, next) => {
  const doc = await prisma.transaction.findFirst({
    where: { id: req.params.id }
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Check ownership
  if (doc.createdById !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to update this record', 403));
  }

  // Only allow whitelisted fields to prevent mass assignment
  const filteredBody = filterObj(req.body, 'amount', 'type', 'category', 'date', 'notes');

  const updatedDoc = await prisma.transaction.update({
    where: { id: req.params.id },
    data: filteredBody
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedDoc
    }
  });
});

exports.deleteTransaction = catchAsync(async (req, res, next) => {
  const doc = await prisma.transaction.findFirst({
    where: { id: req.params.id }
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Check ownership
  if (doc.createdById !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to delete this record', 403));
  }

  // Soft delete logic
  await prisma.transaction.update({
    where: { id: req.params.id },
    data: { isDeleted: true }
  });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getDashboardSummary = catchAsync(async (req, res, next) => {
  const matchStage = { isDeleted: false };
  if (req.user.role !== 'admin') {
    matchStage.createdById = req.user.id;
  }

  const incomeResult = await prisma.transaction.aggregate({
    _sum: { amount: true },
    _count: true,
    where: { ...matchStage, type: 'income' }
  });

  const expenseResult = await prisma.transaction.aggregate({
    _sum: { amount: true },
    _count: true,
    where: { ...matchStage, type: 'expense' }
  });

  const totalIncome = incomeResult._sum.amount || 0;
  const totalExpenses = expenseResult._sum.amount || 0;
  const netBalance = totalIncome - totalExpenses;
  const totalTransactions = incomeResult._count + expenseResult._count;

  res.status(200).json({
    status: 'success',
    data: {
      totalIncome,
      totalExpenses,
      netBalance,
      totalTransactions
    }
  });
});

exports.getCategoryBreakdown = catchAsync(async (req, res, next) => {
  const matchStage = { isDeleted: false };
  if (req.user.role !== 'admin') {
    matchStage.createdById = req.user.id;
  }

  const breakdown = await prisma.transaction.groupBy({
    by: ['category'],
    _sum: { amount: true },
    _count: true,
    where: matchStage,
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      breakdown
    }
  });
});

exports.getMonthlyTrends = catchAsync(async (req, res, next) => {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  const matchStage = { isDeleted: false };
  
  if (req.user.role !== 'admin') {
    matchStage.createdById = req.user.id;
  }

  // Alternatively, fetch the year's data and reduce it in JS/TS.
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

  const transactions = await prisma.transaction.findMany({
    where: {
      ...matchStage,
      date: {
        gte: startOfYear,
        lte: endOfYear
      }
    },
    select: {
      amount: true,
      type: true,
      date: true
    }
  });

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0
  }));

  transactions.forEach(t => {
    const month = new Date(t.date).getMonth();
    if (t.type === 'income') monthlyData[month].income += t.amount;
    if (t.type === 'expense') monthlyData[month].expense += t.amount;
  });

  res.status(200).json({
    status: 'success',
    data: {
      trends: monthlyData
    }
  });
});

exports.getRecentActivity = catchAsync(async (req, res, next) => {
  const matchStage = { isDeleted: false };
  if (req.user.role !== 'admin') {
    matchStage.createdById = req.user.id;
  }

  const recent = await prisma.transaction.findMany({
    where: matchStage,
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      createdBy: {
        select: { name: true }
      }
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      recent
    }
  });
});