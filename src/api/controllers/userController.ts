// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from req.user. No need for database query

import {Request, Response, NextFunction} from 'express';
import {validationResult} from 'express-validator';
import bcrypt from 'bcryptjs';
import CustomError from '../../classes/CustomError';
import {User, UserOutput} from '../../interfaces/User';
import userModel from '../models/userModel';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
const salt = bcrypt.genSaltSync(12);

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userModel.find().select('-password -role');
    if (!users) {
      next(new CustomError('No users found', 404));
    }

    res.json(users);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const user = await userModel
      .findById(req.params.id)
      .select('_id user_name email');
    res.json(user);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
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
    const {password} = req.body;
    req.body.password = bcrypt.hashSync(password, salt);
    const user = await userModel.create(req.body);
    const output: DBMessageResponse = {
      message: 'User created',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userPutCurrent = async (
  req: Request<{id: string}, {}, User>,
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

    const user = await userModel.findByIdAndUpdate(
      (req.user as User)._id,
      req.body,
      {
        new: true,
      }
    );

    if (!user) {
      next(new CustomError('No category found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'User modified',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req.params);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => {
          `${error.msg}: ${error.param}`;
        })
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const user = await userModel.findByIdAndDelete((req.user as User)._id);
    if (!user) {
      next(new CustomError('No user found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'User deleted',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    };
    res.json(output);
  } catch (error) {
    next(error);
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new CustomError('token not valid', 403));
  } else {
    console.log(req.user);
    const newUser: User = req.user as User;
    const output = {
      _id: newUser._id,
      user_name: newUser.user_name,
      email: newUser.email,
    };
    res.json(output);
  }
};

export {
  userListGet,
  userGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
