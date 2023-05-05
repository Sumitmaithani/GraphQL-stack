import mongoose from "mongoose";
import { quotes, users } from "./fakedb.js";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.js";

const User = mongoose.model("User");
const Quote = mongoose.model("Quote");

const resolvers = {
  Query: {
    users: async () => {
      return await User.find({});
    },
    user: async (_, { _id }) => {
      return await User.findOne({ _id });
    },
    quotes: async () => {
      return await Quote.find({}).populate("by", "_id firstName");
    },
    iquote: async (_, { by }) => {
      return await Quote.find({ by });
    }
  },
  User: {
    quotes: async (ur) => await Quote.find({ by: ur._id })
  },
  Mutation: {
    signupUser: async (_, { userNew }) => {
      const user = await User.findOne({ email: userNew.email });
      if (user) {
        throw new Error("User already exists with that email");
      }
      const hashedPassword = await bcrypt.hash(userNew.password, 12);

      const newUser = new User({
        ...userNew,
        password: hashedPassword
      });

      return await newUser.save();
    },
    signinUser: async (_, { userSignin }) => {
      const user = await User.findOne({ email: userSignin.email });
      if (!user) {
        throw new Error("User doesnt exists with that email");
      }
      const doMatch = await bcrypt.compare(userSignin.password, user.password);
      if (!doMatch) {
        throw new Error("email or password is invalid");
      }
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      return { token };
    },
    createQuote: async (_, { name }, { userId }) => {
      if (!userId) {
        throw new Error("You must be logged in");
      }
      const newQuote = new Quote({
        name,
        by: userId
      });
      await newQuote.save();
      return "Quote saved successfully";
    }
  }
};

export default resolvers;
