export const USERS_KEY = "taban_users";
export const CURRENT_USER_KEY = "taban_current_user";
export const SAVED_ORDERS_KEY = "taban_saved_orders";
export const MENU_ITEMS_KEY = "taban_menu_items";
export const RESTAURANT_INFO_KEY = "taban_restaurant_info";
export const PAYMENT_SETTINGS_KEY = "taban_payment_settings";
export const DELIVERY_SETTINGS_KEY = "taban_delivery_settings";

export const DEFAULT_RESTAURANT_INFO = {
  name: "Taban Food",
  logo: "",
  phone: "",
  email: "tabanfod10.gmail.com",
  location: "Taleex",
  description: "",
  openTime: "08:00",
  closeTime: "22:00",
};

export const DEFAULT_PAYMENT_SETTINGS = {
  evcPlusNumber: "",
  zaadNumber: "",
  sahalNumber: "",
  bankAccount: "",
  cashOnDelivery: true,
};

export const DEFAULT_USERS = [
  { username: "abdi ladiif", password: "1234", role: "user" },
  { username: "saabir2", password: "1234", role: "user" },
  { username: "admin", password: "1234", role: "admin" },
];

export const MOGADISHU_DISTRICTS = [
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
];

export const DEFAULT_DELIVERY_SETTINGS = {
  deliveryFee: 1,
  freeDeliveryAbove: 20,
  deliveryTimeMin: 30,
  deliveryTimeMax: 60,
  deliveryAreas: [...MOGADISHU_DISTRICTS],
};

export const MENU = {
  all: [
    {
      id: 1,
      name: "Burger",
      price: 8,
      image: `${process.env.PUBLIC_URL}/images/burger.png`,
    },
    {
      id: 2,
      name: "Pizza",
      price: 9,
      image: `${process.env.PUBLIC_URL}/images/pizza.png`,
    },
    {
      id: 3,
      name: "Fries",
      price: 3,
      image: `${process.env.PUBLIC_URL}/images/fries.png`,
    },
    {
      id: 4,
      name: "Milk Shake",
      price: 4,
      image: `${process.env.PUBLIC_URL}/images/milk shake.png`,
    },
    {
      id: 5,
      name: "Coca Cola",
      price: 2,
      image: `${process.env.PUBLIC_URL}/images/cocola.png`,
    },
    {
      id: 6,
      name: "Mango Juice",
      price: 3,
      image: `${process.env.PUBLIC_URL}/images/mango.png`,
    },
    {
      id: 7,
      name: "Bariis iyo Hilib",
      price: 10,
      image: `${process.env.PUBLIC_URL}/images/bariis iyo hilib.png`,
    },
    {
      id: 8,
      name: "Cambuulo",
      price: 7,
      image: `${process.env.PUBLIC_URL}/images/canbuulo.png`,
    },
    {
      id: 9,
      name: "Sambuus",
      price: 2,
      image: `${process.env.PUBLIC_URL}/images/sanbuus.png`,
    },
    {
      id: 10,
      name: "Subway",
      price: 5,
      image: `${process.env.PUBLIC_URL}/images/jibsi.png`,
    },
  ],
  fast: [
    {
      id: 1,
      name: "Burger",
      price: 8,
      image: `${process.env.PUBLIC_URL}/images/burger.png`,
    },
    {
      id: 2,
      name: "Pizza",
      price: 9,
      image: `${process.env.PUBLIC_URL}/images/pizza.png`,
    },
    {
      id: 3,
      name: "Fries",
      price: 3,
      image: `${process.env.PUBLIC_URL}/images/fries.png`,
    },
  ],
  drinks: [
    {
      id: 4,
      name: "Milk Shake",
      price: 4,
      image: `${process.env.PUBLIC_URL}/images/milk shake.png`,
    },
    {
      id: 5,
      name: "Coca Cola",
      price: 2,
      image: `${process.env.PUBLIC_URL}/images/cocola.png`,
    },
    {
      id: 6,
      name: "Mango Juice",
      price: 3,
      image: `${process.env.PUBLIC_URL}/images/mango.png`,
    },
  ],
  normalday: [
    {
      id: 7,
      name: "Bariis iyo Hilib",
      price: 10,
      image: `${process.env.PUBLIC_URL}/images/bariis iyo hilib.png`,
    },
    {
      id: 8,
      name: "Cambuulo",
      price: 7,
      image: `${process.env.PUBLIC_URL}/images/canbuulo.png`,
    },
    {
      id: 9,
      name: "Sambuus",
      price: 2,
      image: `${process.env.PUBLIC_URL}/images/sanbuus.png`,
    },
    {
      id: 10,
      name: "Subway",
      price: 5,
      image: `${process.env.PUBLIC_URL}/images/jibsi.png`,
    },
  ],
};
