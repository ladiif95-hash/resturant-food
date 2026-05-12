const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/taban_food";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DEFAULT_USERS = [
  { username: "abdi ladiif", password: "1234", role: "user" },
  { username: "saabir2", password: "1234", role: "user" },
  { username: "admin", password: "1234", role: "admin" },
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
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    avatar: { type: String, default: "" },
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
    date: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    deliveryType: { type: String, default: "pickup" },
    deliveryDistrict: { type: String, default: "" },
    deliveryNeighborhood: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
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
const Setting = mongoose.model("Setting", settingsSchema);

const publicUser = (user) => ({
  username: user.username,
  password: user.password,
  role: user.role,
  avatar: user.avatar || "",
});

async function seedDatabase() {
  if ((await User.countDocuments()) === 0) {
    await User.insertMany(DEFAULT_USERS);
  }
  if ((await MenuItem.countDocuments()) === 0) {
    await MenuItem.insertMany(DEFAULT_MENU_ITEMS);
  }
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
        getSetting("restaurantInfo", DEFAULT_RESTAURANT_INFO),
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
    const user = await User.findOne({ username, password }).lean();

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json(publicUser(user));
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
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    await MenuItem.deleteMany({});
    if (items.length) {
      await MenuItem.insertMany(items);
    }
    const saved = await MenuItem.find().sort({ id: 1 }).lean();
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

app.put("/api/users", async (req, res, next) => {
  try {
    const users = Array.isArray(req.body.users) ? req.body.users : [];
    await User.deleteMany({});
    if (users.length) {
      await User.insertMany(users);
    }
    const saved = await User.find().sort({ role: 1, username: 1 }).lean();
    res.json(saved.map(publicUser));
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
  res.status(500).json({ message: "Server error", details: error.message });
});

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`TABAN FOOD API running on http://localhost:${PORT}`);
      console.log(`MongoDB connected: ${MONGO_URI}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
