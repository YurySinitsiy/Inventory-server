import {
  checkToken,
  checkUser,
  checkUserProfile,
} from '../services/userService.js';

const checkAuth = async (req, res, next) => {
  try {
    const token = await checkToken(req);
    const user = await checkUser(token);
    const profile = await checkUserProfile(user.id);

    req.user = user;
    req.profile = profile;

    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
  }
};

export default checkAuth;
