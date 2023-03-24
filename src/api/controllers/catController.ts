// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat
// - catPut - only owner can update cat
// - catGet - get cat by id
// - catListGet - get all cats
// - catPost - create new cat
import {validationResult} from 'express-validator';
import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import {Cat} from '../../interfaces/Cat';
import catModel from '../models/catModel';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import rectangleBounds from '../../utils/rectangleBounds';
import {User} from '../../interfaces/User';

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await catModel.find().populate('owner', 'user_name email');
    console.log(cats);
    if (!cats) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cat = await catModel
      .findById(req.params.id)
      .populate('owner', 'user_name email');
    if (!cat) {
      next(new CustomError('No cat found', 404));
      return;
    }
    res.json(cat);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catGetByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cats = await catModel
      .find({
        owner: (req.user as User)._id,
      })
      .populate('owner', 'user_name email');
    if (!cats) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }

    const {topRight, bottomLeft} = req.query;
    const [trLat, trLng] = topRight.split(',');
    const [blLat, blLng] = bottomLeft.split(',');
    const bounds = rectangleBounds(
      {lng: trLat, lat: trLng},
      {lat: blLat, lng: blLng}
    );
    const cats = await catModel.find({
      location: {
        $geoWithin: {
          $geometry: bounds,
        },
      },
    });
    if (!cats) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    if (!req.file) {
      throw new CustomError('file not found', 400);
    }

    req.body.location = res.locals.coords;
    const user = req.user as User;
    req.body.owner = user._id;
    req.body.filename = req.file.filename;
    console.log(req.body);
    const cat = await catModel.create(req.body);
    await cat.populate('owner');
    const output: DBMessageResponse = {
      message: 'Cat created',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {new: true})
      .populate('owner', 'user_name email');
    if (!cat) {
      next(new CustomError('No species found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'Cat updated',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    if ((req.user as User).role === 'admin') {
      const cat = await catModel
        .findByIdAndUpdate(req.params.id, req.body, {new: true})
        .populate('owner', 'user_name email');
      if (!cat) {
        next(new CustomError('No species found', 404));
        return;
      }
      const output: DBMessageResponse = {
        message: 'Cat updated',
        data: cat,
      };
      res.json(output);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cat = await catModel
      .findByIdAndDelete(req.params.id)
      .populate('owner');
    if (!cat) {
      next(new CustomError('No cat found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catDeleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    if ((req.user as User).role === 'admin') {
      const cat = await catModel
        .findByIdAndDelete(req.params.id)
        .populate('owner');
      if (!cat) {
        next(new CustomError('No cat found', 404));
        return;
      }
      const output: DBMessageResponse = {
        message: 'Cat deleted',
        data: cat,
      };
      res.json(output);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
  catDeleteAdmin,
};
