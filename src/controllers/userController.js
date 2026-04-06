const prisma = require('../utils/prismaClient');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: filteredBody,
    select: userSelectFields
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deactivateMe = catchAsync(async (req, res, next) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { active: false }
  });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const docs = await prisma.user.findMany({
    select: userSelectFields
  });

  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: {
      data: docs
    }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const doc = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: userSelectFields
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: doc
  });
});

// Do NOT update passwords with this!
const ADMIN_ALLOWED_UPDATE_FIELDS = ['name', 'email', 'role', 'active'];

exports.updateUser = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, ...ADMIN_ALLOWED_UPDATE_FIELDS);

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: filteredBody,
    select: userSelectFields
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  await prisma.user.update({
    where: { id: req.params.id },
    data: { active: false }
  });

  res.status(204).json({ status: 'success', data: null });
});