const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const APIFeatures = require('./apiFeatures');

exports.deleteOne = delegate =>
  catchAsync(async (req, res, next) => {
    await delegate.delete({
      where: { id: req.params.id }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = delegate =>
  catchAsync(async (req, res, next) => {
    const doc = await delegate.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.createOne = delegate =>
  catchAsync(async (req, res, next) => {
    const doc = await delegate.create({
      data: req.body
    });

    res.status(201).json({
      status: 'success',
      data: doc
    });
  });

exports.getOne = (delegate, includeOptions) =>
  catchAsync(async (req, res, next) => {
    let query = { where: { id: req.params.id } };
    if (includeOptions) query.include = includeOptions;

    const doc = await delegate.findUnique(query);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = delegate =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const args = features.getArgs();
    const docs = await delegate.findMany(args);

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });