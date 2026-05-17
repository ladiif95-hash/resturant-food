const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/taban_food";
const PASSWORD_RESET_OTP_MINUTES = 10;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_RATE_LIMIT_WINDOW_MS =
  Number(process.env.OTP_RATE_LIMIT_WINDOW_SECONDS || 60) * 1000;
const PASSWORD_RESET_RATE_LIMIT_MAX = Number(process.env.OTP_RATE_LIMIT_MAX || 20);
const passwordResetRateLimit = new Map();

const getEmailConfig = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  return {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 465),
    secure: String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || "true") !== "false",
    user,
    pass,
    from:
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      (user ? `Taban Food <${user}>` : ""),
  };
};

const redactMongoUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

let databaseConnectionPromise = null;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;

  if ((process.env.VERCEL || process.env.NODE_ENV === "production") && !process.env.MONGO_URI) {
    const error = new Error("MONGO_URI is missing in Vercel Environment Variables.");
    error.statusCode = 503;
    throw error;
  }

  if (!databaseConnectionPromise) {
    databaseConnectionPromise = mongoose
      .connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .then(async () => {
        await seedDatabase();
        console.log(`MongoDB connected: ${redactMongoUri(MONGO_URI)}`);
      })
      .catch((error) => {
        databaseConnectionPromise = null;
        error.statusCode = 503;
        throw error;
      });
  }

  await databaseConnectionPromise;
}

app.use("/api", async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

const DEFAULT_USERS = [
  { username: "abdi ladiif", password: "1234", role: "user", email: "", phone: "" },
  { username: "saabir2", password: "1234", role: "user", email: "", phone: "" },
  { username: "admin", password: "1234", role: "admin", email: "", phone: "" },
];

const DEFAULT_RESTAURANT_INFO = {
  name: "Taban Food",
  logo: "",
  phone: "",
  email: "tabanfod10.gmail.com",
  location: "Taleex",
  description: "",
  openTime: "08:00",
  closeTime: "22:00",
};

const DEFAULT_PAYMENT_SETTINGS = {
  evcPlusNumber: "",
  zaadNumber: "",
  sahalNumber: "",
  bankAccount: "",
  cashOnDelivery: true,
};

const DEFAULT_DELIVERY_SETTINGS = {
  deliveryFee: 1,
  freeDeliveryAbove: 20,
  deliveryTimeMin: 30,
  deliveryTimeMax: 60,
  deliveryAreas: [
    "Hodan",
    "Howlwadaag",
    "Wadajir",
    "Dharkenley",
    "Yaaqshiid",
    "Heliwaa",
    "Karaan",
    "Shibis",
    "Boondheere",
    "Xamar Weyne",
    "Xamar Jajab",
    "Waaberi",
    "Shangaani",
    "Cabdi Casiis",
    "Wardhiigley",
    "Dayniile",
    "Kahda",
    "Garasbaaley",
    "Daarusalaam",
  ],
};

const DEFAULT_MENU_ITEMS = [
  { id: 1, name: "Burger", price: 8, image: "/images/burger.png", category: "fast", outOfStock: false },
  { id: 2, name: "Pizza", price: 9, image: "/images/pizza.png", category: "fast", outOfStock: false },
  { id: 3, name: "Fries", price: 3, image: "/images/fries.png", category: "fast", outOfStock: false },
  { id: 4, name: "Milk Shake", price: 4, image: "/images/milk shake.png", category: "drinks", outOfStock: false },
  { id: 5, name: "Coca Cola", price: 2, image: "/images/cocola.png", category: "drinks", outOfStock: false },
  { id: 6, name: "Mango Juice", price: 3, image: "/images/mango.png", category: "drinks", outOfStock: false },
  { id: 7, name: "Bariis iyo Hilib", price: 10, image: "/images/bariis iyo hilib.png", category: "normalday", outOfStock: false },
  { id: 8, name: "Cambuulo", price: 7, image: "/images/canbuulo.png", category: "normalday", outOfStock: false },
  { id: 9, name: "Sambuus", price: 2, image: "/images/sanbuus.png", category: "normalday", outOfStock: false },
  { id: 10, name: "Subway", price: 5, image: "/images/jibsi.png", category: "normalday", outOfStock: false },
];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, default: "", select: false },
    passwordHash: { type: String, default: "" },
    passwordSalt: { type: String, default: "" },
    passwordResetOtpHash: { type: String, default: "", select: false },
    passwordResetOtpSalt: { type: String, default: "", select: false },
    passwordResetOtpExpiresAt: { type: Date, default: null, select: false },
    passwordResetOtpAttempts: { type: Number, default: 0, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    avatar: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { versionKey: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    image: { type: String, default: "" },
    category: { type: String, default: "normalday" },
    outOfStock: { type: Boolean, default: false },
  },
  { versionKey: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    items: { type: Array, default: [] },
    total: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    date: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    deliveryType: { type: String, default: "pickup" },
    deliveryDistrict: { type: String, default: "" },
    deliveryNeighborhood: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
  },
  { versionKey: false }
);

const restaurantSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, default: "primary" },
    name: { type: String, default: DEFAULT_RESTAURANT_INFO.name },
    logo: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: DEFAULT_RESTAURANT_INFO.email },
    location: { type: String, default: DEFAULT_RESTAURANT_INFO.location },
    description: { type: String, default: "" },
    openTime: { type: String, default: DEFAULT_RESTAURANT_INFO.openTime },
    closeTime: { type: String, default: DEFAULT_RESTAURANT_INFO.closeTime },
  },
  { versionKey: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { versionKey: false }
);

const User = mongoose.model("User", userSchema);
const MenuItem = mongoose.model("MenuItem", menuItemSchema);
const Order = mongoose.model("Order", orderSchema);
const Restaurant = mongoose.model("Restaurant", restaurantSchema);
const Setting = mongoose.model("Setting", settingsSchema);

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
  passwordHash: crypto
    .pbkdf2Sync(String(password), salt, 120000, 64, "sha512")
    .toString("hex"),
  passwordSalt: salt,
});

const verifyPassword = (password, user) => {
  if (!user) return false;
  if (user.passwordHash && user.passwordSalt) {
    const attempted = hashPassword(password, user.passwordSalt).passwordHash;
    const storedBuffer = Buffer.from(user.passwordHash, "hex");
    const attemptedBuffer = Buffer.from(attempted, "hex");
    return (
      storedBuffer.length === attemptedBuffer.length &&
      crypto.timingSafeEqual(storedBuffer, attemptedBuffer)
    );
  }

  return Boolean(user.password) && user.password === password;
};

const verifyHashedSecret = (secret, hash, salt) => {
  if (!secret || !hash || !salt) return false;
  const attempted = hashPassword(secret, salt).passwordHash;
  const storedBuffer = Buffer.from(hash, "hex");
  const attemptedBuffer = Buffer.from(attempted, "hex");
  return (
    storedBuffer.length === attemptedBuffer.length &&
    crypto.timingSafeEqual(storedBuffer, attemptedBuffer)
  );
};

const maskEmail = (email = "") => {
  const [name, domain] = String(email).split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 3))}@${domain}`;
};

const findUserByLogin = (value) => {
  const identifier = String(value || "").trim();
  return User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
};

const checkPasswordResetRateLimit = (identifier, ip) => {
  const key = `${String(identifier || "").trim().toLowerCase()}|${ip || ""}`;
  const now = Date.now();
  const existing = passwordResetRateLimit.get(key);

  if (!existing || existing.resetAt <= now) {
    passwordResetRateLimit.set(key, {
      count: 1,
      resetAt: now + PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (existing.count >= PASSWORD_RESET_RATE_LIMIT_MAX) {
    const waitSeconds = Math.ceil((existing.resetAt - now) / 1000);
    const error = new Error(`Too many OTP requests. Try again in ${waitSeconds} seconds.`);
    error.statusCode = 429;
    error.publicMessage = `OTP badan ayaad codsatay. Sug ${waitSeconds} ilbiriqsi kadib mar kale isku day.`;
    throw error;
  }

  existing.count += 1;
  passwordResetRateLimit.set(key, existing);
  return null;
};

const clearPasswordResetOtpFields = {
  passwordResetOtpHash: "",
  passwordResetOtpSalt: "",
  passwordResetOtpExpiresAt: "",
  passwordResetOtpAttempts: "",
};

const findUserWithPasswordResetOtp = (usernameOrEmail) =>
  findUserByLogin(usernameOrEmail)
    .select(
      "+passwordResetOtpHash +passwordResetOtpSalt +passwordResetOtpExpiresAt +passwordResetOtpAttempts"
    )
    .lean();

const validatePasswordResetOtp = async (user, otp) => {
  if (!user) {
    return { ok: false, status: 404, message: "User was not found" };
  }
  if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    return { ok: false, status: 400, message: "Request a new OTP first" };
  }
  if (new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()) {
    await User.updateOne(
      { _id: user._id },
      { $unset: clearPasswordResetOtpFields }
    );
    return { ok: false, status: 400, message: "OTP expired. Request a new OTP." };
  }
  if (
    verifyHashedSecret(
      otp,
      user.passwordResetOtpHash,
      user.passwordResetOtpSalt
    )
  ) {
    return { ok: true };
  }

  const attempts = Number(user.passwordResetOtpAttempts || 0) + 1;
  if (attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
    await User.updateOne(
      { _id: user._id },
      { $unset: clearPasswordResetOtpFields }
    );
    return {
      ok: false,
      status: 400,
      message: "Too many invalid OTP attempts. Request a new OTP.",
    };
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { passwordResetOtpAttempts: attempts } }
  );
  return { ok: false, status: 400, message: "Invalid OTP code" };
};

const createMailTransport = () => {
  const { host, port, secure, user, pass } = getEmailConfig();
  if (!user) {
    const error = new Error("EMAIL_USER is required to send OTP email.");
    error.statusCode = 503;
    error.publicMessage = "EMAIL_USER kuma jiro .env.";
    throw error;
  }
  if (!pass) {
    const error = new Error("EMAIL_PASS is required to send OTP email.");
    error.statusCode = 503;
    error.publicMessage =
      "EMAIL_PASS kuma jiro .env. Geli Google App Password-ka Gmail-ka.";
    throw error;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

const sendPasswordResetOtp = async (user, otp) => {
  const appName = process.env.APP_NAME || "Taban Food";
  const emailConfig = getEmailConfig();
  const transport = createMailTransport();
  await transport.sendMail({
    from: emailConfig.from,
    to: user.email,
    subject: `Ku soo dhowaw ${appName}! Koodhkaaga xaqiijinta waa kan`,
    text: `Macaamilka Sharafta leh,\n\nAad baad uga mahadsan tahay inaad dooratay ${appName}! Aad ayaan ugu faraxsanahay inaad nala soo biirto si aad u hesho cuntada ugu macaan ee magaalada.\n\nSi aad u bilowdo safarkaaga macaan, fadlan isticmaal koodhka hoos ku xusan si aad u xaqiijiso iimaylkaaga:\n\n${otp}\n\nOgeysiis: Koodhkani wuxuu firfircoonaan doonaa muddo ${PASSWORD_RESET_OTP_MINUTES} daqiiqo ah oo kaliya, si loo sugo ammaanka akoonkaaga.\n\nHaddii aadan adigu codsan koodhkan, walwal ha muujin, si ammaan ah ayaad iska indho-tiri kartaa iimaylkan.\n\nCunto macaan iyo maalin wanaagsan!\n\nLeh tixgelin iyo jacayl,\nKooxda ${appName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.65;color:#0f172a;background:#f0fdfa;padding:24px">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #b7efe4;border-radius:14px;padding:28px">
          <h2 style="margin:0 0 16px;color:#0f766e">Ku soo dhowaw ${appName}!</h2>
          <p>Macaamilka Sharafta leh,</p>
          <p>Aad baad uga mahadsan tahay inaad dooratay ${appName}! Aad ayaan ugu faraxsanahay inaad nala soo biirto si aad u hesho cuntada ugu macaan ee magaalada.</p>
          <p>Si aad u bilowdo safarkaaga macaan, fadlan isticmaal koodhka hoos ku xusan si aad u xaqiijiso iimaylkaaga:</p>
          <p style="margin:22px 0;padding:18px;border-radius:12px;background:#ecfeff;color:#0f766e;font-size:34px;font-weight:900;letter-spacing:8px;text-align:center">${otp}</p>
          <p><strong>Ogeysiis:</strong> Koodhkani wuxuu firfircoonaan doonaa muddo ${PASSWORD_RESET_OTP_MINUTES} daqiiqo ah oo kaliya, si loo sugo ammaanka akoonkaaga.</p>
          <p>Haddii aadan adigu codsan koodhkan, walwal ha muujin, si ammaan ah ayaad iska indho-tiri kartaa iimaylkan.</p>
          <p>Cunto macaan iyo maalin wanaagsan!</p>
          <p style="margin-bottom:0">Leh tixgelin iyo jacayl,<br /><strong>Kooxda ${appName}</strong></p>
        </div>
      </div>
    `,
  });

  return { delivered: true };
};

const cleanUserPayload = (user = {}) => ({
  username: String(user.username || "").trim(),
  role: user.role === "admin" ? "admin" : "user",
  avatar: String(user.avatar || ""),
  email: String(user.email || "").trim(),
  phone: String(user.phone || "").trim(),
});

const cleanRestaurantPayload = (restaurant = {}) => ({
  slug: "primary",
  name: String(restaurant.name || DEFAULT_RESTAURANT_INFO.name).trim(),
  logo: String(restaurant.logo || ""),
  phone: String(restaurant.phone || ""),
  email: String(restaurant.email || DEFAULT_RESTAURANT_INFO.email).trim(),
  location: String(restaurant.location || DEFAULT_RESTAURANT_INFO.location).trim(),
  description: String(restaurant.description || ""),
  openTime: String(restaurant.openTime || DEFAULT_RESTAURANT_INFO.openTime),
  closeTime: String(restaurant.closeTime || DEFAULT_RESTAURANT_INFO.closeTime),
});

const makeUserRecord = (user = {}, existingUser = null) => {
  const cleanUser = cleanUserPayload(user);
  const cleanPassword = String(user.password || "").trim();
  const passwordFields = cleanPassword
    ? hashPassword(cleanPassword)
    : existingUser?.passwordHash && existingUser?.passwordSalt
      ? {
          passwordHash: existingUser.passwordHash,
          passwordSalt: existingUser.passwordSalt,
        }
      : existingUser?.password
        ? hashPassword(existingUser.password)
        : {};

  return {
    ...cleanUser,
    ...passwordFields,
  };
};

const publicUser = (user) => ({
  username: user.username,
  role: user.role,
  avatar: user.avatar || "",
  email: user.email || "",
  phone: user.phone || "",
});

async function saveUserList(users) {
  const incomingUsers = Array.isArray(users) ? users : [];
  const existingUsers = await User.find().select("+password").lean();
  const existingByUsername = new Map(
    existingUsers.map((user) => [user.username, user])
  );
  const nextUsernames = incomingUsers
    .map((user) => String(user?.username || "").trim())
    .filter(Boolean);

  await User.deleteMany({ username: { $nin: nextUsernames } });

  for (const user of incomingUsers) {
    const cleanUser = cleanUserPayload(user);
    if (!cleanUser.username) continue;

    const existingUser = existingByUsername.get(cleanUser.username);
    const nextRecord = makeUserRecord(user, existingUser);
    if (!nextRecord.passwordHash || !nextRecord.passwordSalt) {
      throw new Error(`Password is required for ${cleanUser.username}`);
    }

    await User.updateOne(
      { username: cleanUser.username },
      { $set: nextRecord, $unset: { password: "" } },
      { upsert: true }
    );
  }

  const saved = await User.find().sort({ role: 1, username: 1 }).lean();
  return saved.map(publicUser);
}

async function saveMenuItems(items) {
  const nextItems = Array.isArray(items)
    ? items
        .map((item, index) => ({
          id:
            typeof item?.id === "number" && Number.isFinite(item.id)
              ? item.id
              : index + 1,
          name: String(item?.name || `Item ${index + 1}`).trim(),
          price: Number(item?.price) || 0,
          image: String(item?.image || ""),
          category: String(item?.category || "normalday"),
          outOfStock: Boolean(item?.outOfStock),
        }))
        .filter((item) => item.name)
    : [];

  await MenuItem.deleteMany({});
  if (nextItems.length) {
    await MenuItem.insertMany(nextItems);
  }
  return MenuItem.find().sort({ id: 1 }).lean();
}

async function upsertOrders(orders) {
  const nextOrders = Array.isArray(orders) ? orders : [];
  if (!nextOrders.length) return Order.find().sort({ id: 1 }).lean();

  await Order.bulkWrite(
    nextOrders
      .filter((order) => Number.isFinite(Number(order?.id)))
      .map((order) => ({
        updateOne: {
          filter: { id: Number(order.id) },
          update: {
            $set: {
              id: Number(order.id),
              items: Array.isArray(order.items) ? order.items : [],
              total: Number(order.total) || 0,
              deliveryFee: Number(order.deliveryFee) || 0,
              date: String(order.date || ""),
              createdBy: String(order.createdBy || ""),
              deliveryType: String(order.deliveryType || "pickup"),
              deliveryDistrict: String(order.deliveryDistrict || ""),
              deliveryNeighborhood: String(order.deliveryNeighborhood || ""),
              deliveryAddress: String(order.deliveryAddress || ""),
            },
          },
          upsert: true,
        },
      }))
  );

  return Order.find().sort({ id: 1 }).lean();
}

async function migrateLegacyPasswords() {
  const users = await User.find().select("+password").lean();
  await Promise.all(
    users.map((user) => {
      if (user.passwordHash && user.passwordSalt) return null;
      if (!user.password) return null;
      const passwordFields = hashPassword(user.password);
      return User.updateOne(
        { _id: user._id },
        { $set: passwordFields, $unset: { password: "" } }
      );
    })
  );
}

async function seedDatabase() {
  if ((await User.countDocuments()) === 0) {
    await User.insertMany(DEFAULT_USERS.map((user) => makeUserRecord(user)));
  }
  await migrateLegacyPasswords();
  if ((await MenuItem.countDocuments()) === 0) {
    await MenuItem.insertMany(DEFAULT_MENU_ITEMS);
  }
  const legacyRestaurantInfo = await getSetting(
    "restaurantInfo",
    DEFAULT_RESTAURANT_INFO
  );
  await Restaurant.updateOne(
    { slug: "primary" },
    { $setOnInsert: cleanRestaurantPayload(legacyRestaurantInfo) },
    { upsert: true }
  );
  const defaults = {
    restaurantInfo: DEFAULT_RESTAURANT_INFO,
    paymentSettings: DEFAULT_PAYMENT_SETTINGS,
    deliverySettings: DEFAULT_DELIVERY_SETTINGS,
  };
  await Promise.all(
    Object.entries(defaults).map(([key, value]) =>
      Setting.updateOne({ key }, { $setOnInsert: { value } }, { upsert: true })
    )
  );
}

async function getSetting(key, fallback) {
  const setting = await Setting.findOne({ key }).lean();
  return setting?.value || fallback;
}

async function getRestaurantInfo() {
  const restaurant = await Restaurant.findOne({ slug: "primary" }).lean();
  if (restaurant) {
    const { _id, ...cleanRestaurant } = restaurant;
    return cleanRestaurant;
  }

  const legacyRestaurantInfo = await getSetting(
    "restaurantInfo",
    DEFAULT_RESTAURANT_INFO
  );
  const saved = await Restaurant.findOneAndUpdate(
    { slug: "primary" },
    cleanRestaurantPayload(legacyRestaurantInfo),
    { new: true, upsert: true }
  ).lean();
  const { _id, ...cleanRestaurant } = saved;
  return cleanRestaurant;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, database: mongoose.connection.name });
});

app.get("/api/bootstrap", async (req, res, next) => {
  try {
    const [users, menuItems, orders, restaurantInfo, paymentSettings, deliverySettings] =
      await Promise.all([
        User.find().sort({ role: 1, username: 1 }).lean(),
        MenuItem.find().sort({ id: 1 }).lean(),
        Order.find().sort({ id: 1 }).lean(),
        getRestaurantInfo(),
        getSetting("paymentSettings", DEFAULT_PAYMENT_SETTINGS),
        getSetting("deliverySettings", DEFAULT_DELIVERY_SETTINGS),
      ]);

    res.json({
      users: users.map(publicUser),
      menuItems,
      savedOrders: orders,
      restaurantInfo,
      paymentSettings,
      deliverySettings,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const user = await findUserByLogin(username).select("+password").lean();

    if (!verifyPassword(password, user)) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (user.password && (!user.passwordHash || !user.passwordSalt)) {
      const passwordFields = hashPassword(password);
      await User.updateOne(
        { _id: user._id },
        { $set: passwordFields, $unset: { password: "" } }
      );
    }

    res.json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/password-reset/request", async (req, res, next) => {
  try {
    const usernameOrEmail = String(req.body.usernameOrEmail || "").trim();
    if (!usernameOrEmail) {
      return res.status(400).json({ message: "Username or email is required" });
    }
    checkPasswordResetRateLimit(usernameOrEmail, req.ip);

    const user = await findUserByLogin(usernameOrEmail).lean();
    if (!user) {
      return res.status(404).json({ message: "User was not found" });
    }
    if (!user.email) {
      return res.status(400).json({ message: "This user does not have an email address" });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpFields = hashPassword(otp);
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetOtpHash: otpFields.passwordHash,
          passwordResetOtpSalt: otpFields.passwordSalt,
          passwordResetOtpExpiresAt: new Date(
            Date.now() + PASSWORD_RESET_OTP_MINUTES * 60 * 1000
          ),
          passwordResetOtpAttempts: 0,
        },
      }
    );

    try {
      await sendPasswordResetOtp(user, otp);
    } catch (error) {
      await User.updateOne(
        { _id: user._id },
        {
          $unset: clearPasswordResetOtpFields,
        }
      );
      throw error;
    }

    res.json({
      message: `OTP sent to ${maskEmail(user.email)}`,
      email: maskEmail(user.email),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/password-reset/verify", async (req, res, next) => {
  try {
    const usernameOrEmail = String(req.body.usernameOrEmail || "").trim();
    const otp = String(req.body.otp || "").trim();

    if (!usernameOrEmail || !otp) {
      return res.status(400).json({ message: "Gmail and OTP are required" });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be 6 digits" });
    }

    const user = await findUserWithPasswordResetOtp(usernameOrEmail);
    const otpValidation = await validatePasswordResetOtp(user, otp);
    if (!otpValidation.ok) {
      return res
        .status(otpValidation.status)
        .json({ message: otpValidation.message });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/password-reset/confirm", async (req, res, next) => {
  try {
    const usernameOrEmail = String(req.body.usernameOrEmail || "").trim();
    const otp = String(req.body.otp || "").trim();
    const password = String(req.body.password || "").trim();

    if (!usernameOrEmail || !otp || !password) {
      return res.status(400).json({ message: "Username, OTP, and new password are required" });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be 6 digits" });
    }
    if (password.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }

    const user = await findUserWithPasswordResetOtp(usernameOrEmail);
    const otpValidation = await validatePasswordResetOtp(user, otp);
    if (!otpValidation.ok) {
      return res
        .status(otpValidation.status)
        .json({ message: otpValidation.message });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: hashPassword(password),
        $unset: {
          password: "",
          ...clearPasswordResetOtpFields,
        },
      }
    );

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order.toObject());
  } catch (error) {
    next(error);
  }
});

app.delete("/api/orders/:id", async (req, res, next) => {
  try {
    await Order.deleteOne({ id: Number(req.params.id) });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.put("/api/menu-items", async (req, res, next) => {
  try {
    const saved = await saveMenuItems(req.body.items);
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", async (req, res, next) => {
  try {
    const cleanUser = cleanUserPayload(req.body);
    const cleanPassword = String(req.body.password || "").trim();

    if (!cleanUser.username) {
      return res.status(400).json({ message: "Username is required" });
    }
    if (await User.exists({ username: cleanUser.username })) {
      return res.status(409).json({ message: "Username already exists" });
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }

    const user = await User.create(makeUserRecord({ ...req.body, role: "user" }));
    res.status(201).json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:username", async (req, res, next) => {
  try {
    const targetUsername = String(req.params.username || "").trim();
    const existingUser = await User.findOne({ username: targetUsername })
      .select("+password")
      .lean();

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const cleanUser = cleanUserPayload({
      ...existingUser,
      ...req.body,
      role: existingUser.role,
    });
    const cleanPassword = String(req.body.password || "").trim();

    if (!cleanUser.username) {
      return res.status(400).json({ message: "Username is required" });
    }
    if (
      cleanUser.username !== targetUsername &&
      (await User.exists({ username: cleanUser.username }))
    ) {
      return res.status(409).json({ message: "Username already exists" });
    }
    if (cleanPassword && cleanPassword.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }

    const nextRecord = makeUserRecord(
      {
        ...existingUser,
        ...req.body,
        username: cleanUser.username,
        role: existingUser.role,
      },
      existingUser
    );
    const saved = await User.findOneAndUpdate(
      { username: targetUsername },
      { $set: nextRecord, $unset: { password: "" } },
      { new: true }
    ).lean();

    res.json(publicUser(saved));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:username", async (req, res, next) => {
  try {
    const targetUsername = String(req.params.username || "").trim();
    const targetUser = await User.findOne({ username: targetUsername }).lean();

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (targetUser.role === "admin") {
      return res.status(400).json({ message: "Admin user cannot be deleted here" });
    }

    await User.deleteOne({ username: targetUsername });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.put("/api/users", async (req, res, next) => {
  try {
    const saved = await saveUserList(req.body.users);
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

app.post("/api/migrate-local-storage", async (req, res, next) => {
  try {
    const data = req.body || {};

    if (Array.isArray(data.users) && data.users.length) {
      const usersByName = new Map();
      [...DEFAULT_USERS, ...data.users].forEach((user) => {
        if (!user?.username) return;
        usersByName.set(user.username, { ...usersByName.get(user.username), ...user });
      });
      await saveUserList(Array.from(usersByName.values()));
    }

    if (Array.isArray(data.menuItems) && data.menuItems.length) {
      await saveMenuItems(data.menuItems);
    }

    if (Array.isArray(data.savedOrders) && data.savedOrders.length) {
      await upsertOrders(data.savedOrders);
    }

    const settings = {
      restaurantInfo: data.restaurantInfo,
      paymentSettings: data.paymentSettings,
      deliverySettings: data.deliverySettings,
    };
    if (settings.restaurantInfo && typeof settings.restaurantInfo === "object") {
      await Restaurant.findOneAndUpdate(
        { slug: "primary" },
        cleanRestaurantPayload(settings.restaurantInfo),
        { new: true, upsert: true }
      );
    }
    await Promise.all(
      Object.entries(settings)
        .filter(([, value]) => value && typeof value === "object")
        .map(([key, value]) =>
          Setting.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true }
          )
        )
    );

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.put("/api/settings/:key", async (req, res, next) => {
  try {
    const allowed = ["restaurantInfo", "paymentSettings", "deliverySettings"];
    if (!allowed.includes(req.params.key)) {
      return res.status(404).json({ message: "Unknown settings key" });
    }
    if (req.params.key === "restaurantInfo") {
      const restaurantInfo = cleanRestaurantPayload(req.body.value || {});
      const restaurant = await Restaurant.findOneAndUpdate(
        { slug: "primary" },
        restaurantInfo,
        { new: true, upsert: true }
      ).lean();
      await Setting.findOneAndUpdate(
        { key: "restaurantInfo" },
        { value: restaurantInfo },
        { new: true, upsert: true }
      );
      const { _id, ...cleanRestaurant } = restaurant;
      return res.json(cleanRestaurant);
    }

    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value || {} },
      { new: true, upsert: true }
    ).lean();
    res.json(setting.value);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message:
      error.publicMessage ||
      (error.statusCode === 503 ? "Service unavailable" : "Server error"),
    details: error.message,
  });
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`TABAN FOOD API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
