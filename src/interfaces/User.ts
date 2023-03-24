// TODO: user interface
import {Document} from 'mongoose';

interface User extends Document {
  user_name: string;
  email: string;
  role: string;
  password: string;
}

interface UserOutput {
  _id: string;
  user_name: string;
  email: string;
}
interface LoginUser {
  email: string;
  password: string;
}
interface UserTest {
  user_name?: string;
  email?: string;
  role?: string;
  password?: string;
}
export {User, UserOutput, LoginUser, UserTest};
