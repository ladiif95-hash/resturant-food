import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { jsPDF } from "jspdf";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrdersMoney from "./pages/OrdersMoney";
import Profile from "./pages/Profile";
import Menu from "./pages/Menu";
import ReceiptModal from "./components/ReceiptModal";
import Settings from "./pages/Settings";
import { api } from "./api";
import {
  CURRENT_USER_KEY,
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_RESTAURANT_INFO,
  MENU_ITEMS_KEY,
  DELIVERY_SETTINGS_KEY,
  MENU,
  MOGADISHU_DISTRICTS,
  PAYMENT_SETTINGS_KEY,
  RESTAURANT_INFO_KEY,
  SAVED_ORDERS_KEY,
  USERS_KEY,
} from "./appConstants";
import "./App.css";
import "./styles/header.css";
import "./styles/sidebar.css";
import "./styles/settings.css";

const safeParseJSON = (raw, fallback) => {
  try {
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const MENU_CATEGORY_KEYS = ["fast", "drinks", "normalday"];

const normalizeCategory = (value, sourceMenu, id) => {
  if (MENU_CATEGORY_KEYS.includes(value)) return value;
  if (
    sourceMenu &&
    MENU_CATEGORY_KEYS.some((key) =>
      (sourceMenu[key] || []).some((item) => item.id === id)
    )
  ) {
    return MENU_CATEGORY_KEYS.find((key) =>
      (sourceMenu[key] || []).some((item) => item.id === id)
    );
  }
  return "normalday";
};

const normalizeMenuItems = (rawMenu) => {
  const sourceMenu = Array.isArray(rawMenu?.all) ? rawMenu : MENU;
  const allItems = Array.isArray(rawMenu)
    ? rawMenu
    : Array.isArray(rawMenu?.all)
      ? rawMenu.all
      : MENU.all;

  const dedup = new Map();

  allItems.forEach((item, index) => {
    const id =
      typeof item?.id === "number" && Number.isFinite(item.id)
        ? item.id
        : index + 1;
    if (dedup.has(id)) return;

    dedup.set(id, {
      id,
      name: String(item?.name || `Item ${id}`),
      price: Number(item?.price) || 0,
      image: String(item?.image || ""),
      category: normalizeCategory(item?.category, sourceMenu, id),
      outOfStock: Boolean(item?.outOfStock),
    });
  });

  return Array.from(dedup.values());
};

const buildMenuSections = (items) => {
  const list = Array.isArray(items) ? items : [];
  return {
    all: list,
    fast: list.filter((item) => item.category === "fast"),
    drinks: list.filter((item) => item.category === "drinks"),
    normalday: list.filter((item) => item.category === "normalday"),
  };
};

const LEGACY_STORAGE_KEYS = [
  CURRENT_USER_KEY,
  USERS_KEY,
  MENU_ITEMS_KEY,
  SAVED_ORDERS_KEY,
  RESTAURANT_INFO_KEY,
  PAYMENT_SETTINGS_KEY,
  DELIVERY_SETTINGS_KEY,
  "taban_ui_settings_v1",
];

const readLegacyStorage = () => ({
  currentUser: safeParseJSON(localStorage.getItem(CURRENT_USER_KEY), null),
  users: safeParseJSON(localStorage.getItem(USERS_KEY), []),
  menuItems: safeParseJSON(localStorage.getItem(MENU_ITEMS_KEY), []),
  savedOrders: safeParseJSON(localStorage.getItem(SAVED_ORDERS_KEY), []),
  restaurantInfo: safeParseJSON(localStorage.getItem(RESTAURANT_INFO_KEY), null),
  paymentSettings: safeParseJSON(localStorage.getItem(PAYMENT_SETTINGS_KEY), null),
  deliverySettings: safeParseJSON(localStorage.getItem(DELIVERY_SETTINGS_KEY), null),
});

const hasLegacyStorageData = (data) =>
  (Array.isArray(data.users) && data.users.length > 0) ||
  (Array.isArray(data.menuItems) && data.menuItems.length > 0) ||
  (Array.isArray(data.savedOrders) && data.savedOrders.length > 0) ||
  Boolean(data.restaurantInfo || data.paymentSettings || data.deliverySettings);

const clearLegacyStorage = () => {
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export default function App() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(() => normalizeMenuItems(MENU));
  const [savedOrders, setSavedOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [managedUsers, setManagedUsers] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(DEFAULT_RESTAURANT_INFO);
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [deliverySettings, setDeliverySettings] = useState(DEFAULT_DELIVERY_SETTINGS);
  const [backendStatus, setBackendStatus] = useState("loading");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState("dashboard");
  const [discount, setDiscount] = useState(0);
  const [menuSearch, setMenuSearch] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryDistrict, setDeliveryDistrict] = useState("");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState("");
  const [paidReceiptOrder, setPaidReceiptOrder] = useState(null);
  const [openAdminDetailUsers, setOpenAdminDetailUsers] = useState([]);
  const [selectedAdminUsers, setSelectedAdminUsers] = useState(["", ""]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [dashboardRange, setDashboardRange] = useState("today");
  const [ordersPageNo, setOrdersPageNo] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(5);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersUserFilter, setOrdersUserFilter] = useState("all");
  const [ordersTypeFilter, setOrdersTypeFilter] = useState("all");
  const [ordersSort, setOrdersSort] = useState("newest");
  const [activeSettingsSection, setActiveSettingsSection] = useState("restaurant");
  const avatarInputRef = useRef(null);

  const menu = useMemo(() => buildMenuSections(menuItems), [menuItems]);
  const taxPerItem = 0.05;
  const visibleItems =
    category === "all"
      ? MENU_CATEGORY_KEYS.flatMap((key) => menu[key] || [])
      : menu[category] || menu.fast;
  const normalizedMenuSearch = menuSearch.trim().toLowerCase();
  const filteredMenuItems = visibleItems.filter((item) =>
    item.name.toLowerCase().includes(normalizedMenuSearch)
  );
  const dashboardItems = visibleItems;
  const totalSystemItems = menu.all.length;
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    let isMounted = true;

    const loadDatabaseData = async () => {
      const legacyData = readLegacyStorage();

      try {
        if (hasLegacyStorageData(legacyData)) {
          await api.migrateLocalStorage(legacyData);
          clearLegacyStorage();
        }

        const data = await api.bootstrap();
        if (!isMounted) return;

        const backendUsers =
          Array.isArray(data.users) && data.users.length ? data.users : [];
        const nextMenuItems = normalizeMenuItems(data.menuItems || MENU);
        const nextSavedOrders = Array.isArray(data.savedOrders)
          ? data.savedOrders
          : [];
        const nextRestaurantInfo = {
          ...DEFAULT_RESTAURANT_INFO,
          ...(data.restaurantInfo || {}),
        };
        const nextPaymentSettings = {
          ...DEFAULT_PAYMENT_SETTINGS,
          ...(data.paymentSettings || {}),
        };
        const nextDeliverySettings = {
          ...DEFAULT_DELIVERY_SETTINGS,
          ...(data.deliverySettings || {}),
          deliveryAreas: Array.isArray(data.deliverySettings?.deliveryAreas)
            ? data.deliverySettings.deliveryAreas
            : DEFAULT_DELIVERY_SETTINGS.deliveryAreas,
        };

        setManagedUsers(backendUsers);
        setMenuItems(nextMenuItems);
        setSavedOrders(nextSavedOrders);
        setRestaurantInfo(nextRestaurantInfo);
        setPaymentSettings(nextPaymentSettings);
        setDeliverySettings(nextDeliverySettings);
        setBackendStatus("ready");

        if (legacyData.currentUser?.username) {
          const activeUser = backendUsers.find(
            (user) => user.username === legacyData.currentUser.username
          );
          if (activeUser) {
            setCurrentUser((prev) => prev || activeUser);
          }
        }
      } catch (error) {
        console.warn("API bootstrap failed.", error);
        if (isMounted) {
          setBackendStatus("error");
        }
      }
    };

    loadDatabaseData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (page === "dashboard") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [page]);

  const addToOrder = (item) => {
    if (item.outOfStock) {
      setAlertMessage(`${item.name} is out of stock.`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }
    if (paidReceiptOrder) {
      setPaidReceiptOrder(null);
    }
    setOrders((prevOrders) => {
      const exist = prevOrders.find((x) => x.id === item.id);
      if (exist) {
        return prevOrders.map((x) =>
          x.id === item.id ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...prevOrders, { ...item, qty: 1 }];
    });
  };

  const removeItem = (id) =>
    setOrders((prevOrders) => prevOrders.filter((item) => item.id !== id));

  const updateQty = (id, delta) => {
    setOrders((prevOrders) =>
      prevOrders.flatMap((item) => {
        if (item.id !== id) return [item];
        const nextQty = item.qty + delta;
        if (nextQty <= 0) return [];
        return [{ ...item, qty: nextQty }];
      })
    );
  };

  const subTotal = orders.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = orders.reduce((sum, item) => sum + item.qty, 0);
  const taxAmount = totalQty * taxPerItem;
  const maxDiscount = subTotal + taxAmount;
  const effectiveDiscount = Math.min(Math.max(discount, 0), maxDiscount);
  const finalTotal = Math.max(subTotal + taxAmount - effectiveDiscount, 0);
  const visibleSavedOrders = isAdmin
    ? savedOrders
    : savedOrders.filter((order) => order.createdBy === currentUser?.username);
  const orderUserOptions = useMemo(() => {
    const names = new Set();
    managedUsers
      .filter((user) => user.role !== "admin")
      .forEach((user) => names.add(user.username));
    savedOrders.forEach((order) => {
      if (order.createdBy) names.add(order.createdBy);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [managedUsers, savedOrders]);
  const normalizedOrdersSearch = ordersSearch.trim().toLowerCase();
  const filteredSortedOrders = useMemo(() => {
    const filtered = visibleSavedOrders.filter((order) => {
      const type = order.deliveryType || "pickup";
      if (ordersUserFilter !== "all" && (order.createdBy || "unknown") !== ordersUserFilter) {
        return false;
      }
      if (ordersTypeFilter !== "all" && type !== ordersTypeFilter) {
        return false;
      }
      if (!normalizedOrdersSearch) {
        return true;
      }

      const inItems = order.items.some((item) =>
        item.name.toLowerCase().includes(normalizedOrdersSearch)
      );
      const inMeta = (
        `${order.createdBy || ""} ${order.date || ""} ${order.deliveryAddress || ""} ${
          order.deliveryDistrict || ""
        } ${order.deliveryNeighborhood || ""}`
      )
        .toLowerCase()
        .includes(normalizedOrdersSearch);

      return inItems || inMeta;
    });

    return filtered.sort((a, b) => {
      const timeA = Number(a.id) || 0;
      const timeB = Number(b.id) || 0;
      if (ordersSort === "oldest") return timeA - timeB;
      if (ordersSort === "highest") return b.total - a.total;
      if (ordersSort === "lowest") return a.total - b.total;
      return timeB - timeA;
    });
  }, [
    visibleSavedOrders,
    ordersUserFilter,
    ordersTypeFilter,
    normalizedOrdersSearch,
    ordersSort,
  ]);
  const totalOrdersPages = Math.max(
    1,
    Math.ceil(filteredSortedOrders.length / ordersPageSize)
  );
  const pagedOrders = filteredSortedOrders.slice(
    (ordersPageNo - 1) * ordersPageSize,
    ordersPageNo * ordersPageSize
  );
  const orderPageButtons = useMemo(() => {
    if (totalOrdersPages <= 7) {
      return Array.from({ length: totalOrdersPages }, (_, i) => i + 1);
    }
    if (ordersPageNo <= 4) {
      return [1, 2, 3, 4, 5, "...", totalOrdersPages];
    }
    if (ordersPageNo >= totalOrdersPages - 3) {
      return [
        1,
        "...",
        totalOrdersPages - 4,
        totalOrdersPages - 3,
        totalOrdersPages - 2,
        totalOrdersPages - 1,
        totalOrdersPages,
      ];
    }
    return [
      1,
      "...",
      ordersPageNo - 1,
      ordersPageNo,
      ordersPageNo + 1,
      "...",
      totalOrdersPages,
    ];
  }, [ordersPageNo, totalOrdersPages]);

  useEffect(() => {
    setOrdersPageNo((prev) => Math.min(prev, totalOrdersPages));
  }, [totalOrdersPages]);

  const getOrderDate = (order) => {
    if (typeof order.id === "number") return new Date(order.id);
    const parsed = new Date(order.date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const dayStart = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const daysDiff = (a, b) =>
    Math.floor((dayStart(a).getTime() - dayStart(b).getTime()) / 86400000);
  const dashboardOrders = visibleSavedOrders.filter((order) => {
    const orderDate = getOrderDate(order) || now;
    const diff = daysDiff(now, orderDate);
    if (dashboardRange === "today") return diff === 0;
    if (dashboardRange === "7d") return diff >= 0 && diff < 7;
    return diff >= 0 && diff < 30;
  });
  const dashboardOrderCount = dashboardOrders.length;
  const dashboardRangeLabel =
    dashboardRange === "today"
      ? "Today"
      : dashboardRange === "7d"
        ? "Last 7 Days"
        : "Last 30 Days";
  const dashboardMoneyTotal = dashboardOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const todayBase = new Date(now);
  todayBase.setHours(0, 0, 0, 0);
  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const todayOrderCount = visibleSavedOrders.filter((order) =>
    isSameDay(getOrderDate(order), todayBase)
  ).length;
  const yesterdayBase = new Date(todayBase);
  yesterdayBase.setDate(yesterdayBase.getDate() - 1);
  const yesterdayOrderCount = visibleSavedOrders.filter((order) =>
    isSameDay(getOrderDate(order), yesterdayBase)
  ).length;
  const orderDeltaPercent =
    yesterdayOrderCount === 0
      ? (todayOrderCount > 0 ? 100 : 0)
      : ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100;
  const avgTicket = dashboardOrders.length
    ? dashboardMoneyTotal / dashboardOrders.length
    : 0;
  const fastIds = new Set(menu.fast.map((item) => item.id));
  const drinkIds = new Set(menu.drinks.map((item) => item.id));
  const categoryTotals = dashboardOrders.reduce(
    (acc, order) => {
      order.items.forEach((item) => {
        const qty = item.qty || 0;
        if (fastIds.has(item.id)) acc.fast += qty;
        else if (drinkIds.has(item.id)) acc.drinks += qty;
        else acc.normalday += qty;
      });
      return acc;
    },
    { fast: 0, drinks: 0, normalday: 0 }
  );
  const categoryChart = [
    { label: "Fast", value: categoryTotals.fast },
    { label: "Drinks", value: categoryTotals.drinks },
    { label: "Normal Day", value: categoryTotals.normalday },
  ];
  const maxCategoryValue = Math.max(...categoryChart.map((c) => c.value), 1);
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    const label = date.toLocaleDateString([], { weekday: "short" });
    const count = dashboardOrders.filter((order) => {
      const orderDate = getOrderDate(order);
      return isSameDay(orderDate, date);
    }).length;
    return { label, value: count };
  });
  const maxWeeklyValue = Math.max(...last7Days.map((d) => d.value), 1);
  const deliveryCount = dashboardOrders.filter(
    (order) => order.deliveryType === "delivery"
  ).length;
  const pickupCount = Math.max(dashboardOrders.length - deliveryCount, 0);
  const donutTotal = Math.max(deliveryCount + pickupCount, 1);
  const deliveryPercent = (deliveryCount / donutTotal) * 100;
  const topItems = Object.entries(
    dashboardOrders.reduce((acc, order) => {
      order.items.forEach((item) => {
        const key = item.name;
        if (!acc[key]) {
          acc[key] = { qty: 0, total: 0 };
        }
        acc[key].qty += item.qty;
        acc[key].total += item.price * item.qty;
      });
      return acc;
    }, {})
  )
    .map(([name, meta]) => ({ name, qty: meta.qty, total: meta.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const selectedCategoryLabel =
    category === "all"
      ? "All"
      : category === "normalday"
        ? "Normal Day"
        : category.charAt(0).toUpperCase() + category.slice(1);
  const dashboardSellerTotals = dashboardOrders.reduce((acc, order) => {
    const owner = order.createdBy || "unknown";
    acc[owner] = (acc[owner] || 0) + order.total;
    return acc;
  }, {});
  const nonAdminUsers = useMemo(
    () => managedUsers.filter((user) => user.role !== "admin"),
    [managedUsers]
  );
  const userSalesList = useMemo(() => {
    const totals = nonAdminUsers.reduce((acc, user) => {
      acc[user.username] = 0;
      return acc;
    }, {});

    savedOrders.forEach((order) => {
      const owner = order.createdBy || "unknown";
      if (owner in totals) {
        totals[owner] += order.total;
      }
    });

    return Object.entries(totals)
      .map(([username, total]) => ({ username, total }))
      .sort((a, b) => b.total - a.total);
  }, [savedOrders, nonAdminUsers]);
  const adminUserOptions = userSalesList.map((user) => user.username);
  const selectedUsersSales = useMemo(() => {
    return userSalesList;
  }, [userSalesList]);
  const getDeliveryLocation = (order) => {
    const district = (order.deliveryDistrict || "").trim();
    const neighborhood = (order.deliveryNeighborhood || "").trim();

    if (district || neighborhood) {
      return {
        district: district || "Unknown",
        neighborhood: neighborhood || "Unknown",
      };
    }

    const raw = (order.deliveryAddress || "").trim();
    if (!raw) {
      return { district: "Unknown", neighborhood: "Unknown" };
    }

    const [rawNeighborhood, ...rest] = raw.split(",");
    const districtPart = rest.join(",").split(" - ")[0];

    return {
      neighborhood: rawNeighborhood?.trim() || "Unknown",
      district: districtPart?.trim() || "Unknown",
    };
  };
  const paidReceiptLocation = paidReceiptOrder
    ? getDeliveryLocation(paidReceiptOrder)
    : null;

  const toggleAdminDetail = (username) => {
    setOpenAdminDetailUsers((prev) =>
      prev.includes(username)
        ? prev.filter((name) => name !== username)
        : [...prev, username]
    );
  };

  const handleAdminUserSelect = (slotIndex, username) => {
    setSelectedAdminUsers((prev) => {
      const next = [...prev];
      next[slotIndex] = username;

      const otherSlot = slotIndex === 0 ? 1 : 0;
      if (username && next[otherSlot] === username) {
        const replacement = adminUserOptions.find(
          (name) => name !== username && !next.includes(name)
        );
        next[otherSlot] = replacement || "";
      }

      return next;
    });
  };

  useEffect(() => {
    if (adminUserOptions.length === 0) {
      setSelectedAdminUsers(["", ""]);
      return;
    }

    setSelectedAdminUsers((prev) => {
      let [first, second] = prev;
      if (!first || !adminUserOptions.includes(first)) {
        first = adminUserOptions[0] || "";
      }
      if (!second || !adminUserOptions.includes(second) || second === first) {
        second = adminUserOptions.find((name) => name !== first) || "";
      }
      return [first, second];
    });
  }, [adminUserOptions]);

  useEffect(() => {
    if (!isAdmin && (page === "orders" || page === "orders MONEY")) {
      setPage("pos");
      return;
    }

    if (!isAdmin) {
      setOpenAdminDetailUsers([]);
      return;
    }

    if (page !== "orders MONEY") {
      setOpenAdminDetailUsers([]);
      return;
    }

    setOpenAdminDetailUsers((prev) =>
      prev.filter((name) => selectedUsersSales.some((user) => user.username === name))
    );
  }, [isAdmin, page, selectedUsersSales]);

  const handlePay = async () => {
    if (orders.length === 0) {
      setAlertMessage("Add items to cart before payment.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }
    if (deliveryType === "delivery" && !deliveryDistrict) {
      setAlertMessage("Fadlan dooro degmada.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }
    if (deliveryType === "delivery" && !deliveryNeighborhood.trim()) {
      setAlertMessage("Fadlan geli xaafada.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }

    const finalDeliveryAddress =
      deliveryType === "delivery"
        ? `${deliveryNeighborhood.trim()}, ${deliveryDistrict}`
        : "";

    const newOrder = {
      id: Date.now(),
      items: orders,
      total: finalTotal,
      date: new Date().toLocaleString(),
      createdBy: currentUser.username,
      deliveryType,
      deliveryDistrict: deliveryType === "delivery" ? deliveryDistrict : "",
      deliveryNeighborhood:
        deliveryType === "delivery" ? deliveryNeighborhood.trim() : "",
      deliveryAddress: finalDeliveryAddress,
    };

    let savedOrder = newOrder;
    try {
      savedOrder = await api.createOrder(newOrder);
    } catch (error) {
      setAlertMessage("Backend not connected. Order was not saved.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }

    setSavedOrders((prev) => [...prev, savedOrder]);
    setPaidReceiptOrder(savedOrder);
    setOrders([]);
    setDiscount(0);
    setDeliveryType("pickup");
    setDeliveryDistrict("");
    setDeliveryNeighborhood("");

    setAlertMessage("ORDER WA LA GUDBIYEY!");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2500);
  };

  const deleteOrder = (id) => {
    const previousOrders = savedOrders;
    setSavedOrders(savedOrders.filter((order) => order.id !== id));
    api.deleteOrder(id).catch(() => {
      setSavedOrders(previousOrders);
      setAlertMessage("Order delete failed on backend.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim();
    let foundUser = null;

    try {
      foundUser = await api.login(cleanUsername, passwordInput);
    } catch (error) {
      const backendDetails = error.details ? ` ${error.details}` : "";
      setLoginError(
        error.status === 401
          ? "Invalid username or password."
          : `Backend/database is not connected.${backendDetails}`
      );
      return;
    }

    if (!foundUser) {
      setLoginError("Invalid username or password");
      return;
    }

    setCurrentUser(foundUser);
    setLoginError("");
    setUsernameInput("");
    setPasswordInput("");
  };

  const handleLogout = () => {
    clearLegacyStorage();
    setCurrentUser(null);
    setPage("pos");
  };

  const handleDownloadDashboardReport = () => {
    const doc = new jsPDF();
    const moneyLabel = isAdmin ? "All Money" : "My Money";
    const ordersLabel = isAdmin ? "All Orders" : "My Orders";
    const reportDate = new Date().toLocaleString();

    doc.setFontSize(18);
    doc.text("TABAN FOOD - DASHBOARD REPORT", 14, 18);
    doc.setFontSize(11);
    doc.text(`Generated: ${reportDate}`, 14, 26);

    let y = 38;
    const rows = [
      ["Range", dashboardRangeLabel],
      ["Total Category", String(dashboardItems.length)],
      ["Total Items", String(totalSystemItems)],
      [ordersLabel, String(dashboardOrderCount)],
      ["Today Orders", String(todayOrderCount)],
      [moneyLabel, `$${dashboardMoneyTotal.toFixed(2)}`],
      ["Average Ticket", `$${avgTicket.toFixed(2)}`],
    ];

    rows.forEach(([label, value]) => {
      doc.setFont(undefined, "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont(undefined, "normal");
      doc.text(value, 72, y);
      y += 8;
    });

    y += 6;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Top Selling Items", 14, y);
    doc.setFont(undefined, "normal");
    y += 8;

    if (topItems.length === 0) {
      doc.text("No sales data yet.", 14, y);
    } else {
      topItems.forEach((item, index) => {
        doc.text(
          `${index + 1}. ${item.name} - ${item.qty} sold - $${item.total.toFixed(2)}`,
          14,
          y
        );
        y += 7;
      });
    }

    doc.save("dashboard-report.pdf");
  };

  const handleAvatarPick = () => {
    avatarInputRef.current?.click();
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const openProfilePopup = () => {
    setShowProfilePopup(true);
  };

  const handleRestaurantInfoChange = (field, value) => {
    setRestaurantInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    const nextInfo = { ...restaurantInfo, [field]: value };
    api.saveSetting("restaurantInfo", nextInfo).catch(() => {});
  };

  const persistMenuItems = (updater) => {
    setMenuItems((prev) => {
      const nextItems =
        typeof updater === "function" ? updater(prev) : normalizeMenuItems(updater);
      api.saveMenuItems(nextItems).catch(() => {
        setAlertMessage("Menu sync failed. Database was not updated.");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2500);
      });
      return nextItems;
    });
  };

  const handleMenuItemCategoryChange = (itemId, nextCategory) => {
    if (!MENU_CATEGORY_KEYS.includes(nextCategory)) return;
    persistMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, category: nextCategory } : item
      )
    );
  };

  const handleMenuItemPriceChange = (itemId, nextPrice) => {
    const parsedPrice = Number(nextPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return;
    persistMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, price: parsedPrice } : item
      )
    );
  };

  const handleMenuItemStockToggle = (itemId) => {
    persistMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, outOfStock: !item.outOfStock } : item
      )
    );
  };

  const handleMenuItemDelete = (itemId) => {
    persistMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    setOrders((prev) => prev.filter((item) => item.id !== itemId));
    setAlertMessage("Product deleted.");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2500);
  };

  const handleMenuItemAdd = (product) => {
    if (!isAdmin) return false;

    const cleanName = String(product?.name || "").trim();
    const cleanCategory = String(product?.category || "fast");
    const parsedPrice = Number(product?.price);
    const cleanImage = String(product?.image || "").trim();

    if (!cleanName) {
      setAlertMessage("Product name is required.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    if (!MENU_CATEGORY_KEYS.includes(cleanCategory)) {
      setAlertMessage("Choose a valid category.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setAlertMessage("Enter a valid product price.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    if (
      menuItems.some(
        (item) => item.name.trim().toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      setAlertMessage("Product name already exists.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    persistMenuItems((prev) => {
      const nextId = prev.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
      return [
        ...prev,
        {
          id: nextId,
          name: cleanName,
          price: parsedPrice,
          image: cleanImage,
          category: cleanCategory,
          outOfStock: Boolean(product?.outOfStock),
        },
      ];
    });

    setAlertMessage("New product added.");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2500);
    return true;
  };

  const handlePaymentSettingsChange = (field, value) => {
    setPaymentSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    const nextPaymentSettings = { ...paymentSettings, [field]: value };
    api.saveSetting("paymentSettings", nextPaymentSettings).catch(() => {});
  };

  const handleDeliverySettingsChange = (field, value) => {
    setDeliverySettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    const nextDeliverySettings = { ...deliverySettings, [field]: value };
    api.saveSetting("deliverySettings", nextDeliverySettings).catch(() => {});
  };

  const handleDeliveryAreaToggle = (area) => {
    setDeliverySettings((prev) => {
      const currentAreas = Array.isArray(prev.deliveryAreas) ? prev.deliveryAreas : [];
      const hasArea = currentAreas.includes(area);
      const nextAreas = hasArea
        ? currentAreas.filter((name) => name !== area)
        : [...currentAreas, area];
      return {
        ...prev,
        deliveryAreas: nextAreas,
      };
    });
    const currentAreas = Array.isArray(deliverySettings.deliveryAreas)
      ? deliverySettings.deliveryAreas
      : [];
    const hasArea = currentAreas.includes(area);
    const nextAreas = hasArea
      ? currentAreas.filter((name) => name !== area)
      : [...currentAreas, area];
    api
      .saveSetting("deliverySettings", {
        ...deliverySettings,
        deliveryAreas: nextAreas,
      })
      .catch(() => {});
  };

  const handleRestaurantLogoUpload = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlertMessage("Please choose an image file.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const logo = typeof reader.result === "string" ? reader.result : "";
      if (!logo) return;
      handleRestaurantInfoChange("logo", logo);
      setAlertMessage("Restaurant logo updated.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    };

    reader.readAsDataURL(file);
  };

  const handleAdminUpdateUserCredentials = async (
    selectedUsername,
    nextUsername,
    nextPassword,
    nextEmail,
    nextPhone
  ) => {
    if (!currentUser || currentUser.role !== "admin") return false;

    const targetUsername = (selectedUsername || "").trim();
    const cleanUsername = (nextUsername || "").trim();
    const cleanPassword = (nextPassword || "").trim();
    const cleanEmail = (nextEmail || "").trim();
    const cleanPhone = (nextPhone || "").trim();
    const localUsers = managedUsers.length ? managedUsers : [];

    if (!targetUsername) {
      setAlertMessage("Select a user first.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }
    if (!cleanUsername) {
      setAlertMessage("New username is required.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }
    if (/\s/.test(cleanUsername)) {
      setAlertMessage("Username cannot contain spaces.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }
    if (cleanPassword && cleanPassword.length < 4) {
      setAlertMessage("New password must be at least 4 characters.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    const targetUser = localUsers.find(
      (user) => user.username === targetUsername && user.role !== "admin"
    );

    if (!targetUser) {
      setAlertMessage("Selected user not found.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    if (
      cleanUsername !== targetUsername &&
      localUsers.some((user) => user.username === cleanUsername)
    ) {
      setAlertMessage("Username already exists.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    try {
      const savedUser = await api.updateUser(targetUsername, {
        username: cleanUsername,
        ...(cleanPassword ? { password: cleanPassword } : {}),
        email: cleanEmail,
        phone: cleanPhone,
      });
      setManagedUsers((prev) =>
        prev.map((user) => (user.username === targetUsername ? savedUser : user))
      );
    } catch (error) {
      setAlertMessage(error.message || "User update failed on database.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    setAlertMessage("User updated successfully.");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2500);
    return true;
  };

  const handleAdminAddUser = async (username, password, email, phone) => {
    if (!currentUser || currentUser.role !== "admin") return false;

    const cleanUsername = (username || "").trim();
    const cleanPassword = (password || "").trim();
    const cleanEmail = (email || "").trim();
    const cleanPhone = (phone || "").trim();

    if (!cleanUsername) {
      setAlertMessage("Username is required.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }
    if (/\s/.test(cleanUsername)) {
      setAlertMessage("Username cannot contain spaces.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setAlertMessage("Password must be at least 4 characters.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }
    if (!cleanEmail) {
      setAlertMessage("Gmail is required.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }
    if (!cleanPhone) {
      setAlertMessage("Phone number is required.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    const localUsers = managedUsers.length ? managedUsers : [];
    if (localUsers.some((user) => user.username === cleanUsername)) {
      setAlertMessage("Username already exists.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    let savedUser = null;
    try {
      savedUser = await api.createUser({
        username: cleanUsername,
        password: cleanPassword,
        email: cleanEmail,
        phone: cleanPhone,
      });
      setManagedUsers((prev) => [...prev, savedUser]);
    } catch (error) {
      setAlertMessage(error.message || "User create failed on database.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    setSelectedAdminUsers((prev) => {
      if (prev.includes(cleanUsername)) return prev;
      const emptyIndex = prev.findIndex((username) => !username);
      if (emptyIndex === -1) return [...prev, cleanUsername];
      const next = [...prev];
      next[emptyIndex] = cleanUsername;
      return next;
    });

    setAlertMessage("New user added.");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2500);
    return true;
  };

  const handleAdminDeleteUser = async (username) => {
    if (!currentUser || currentUser.role !== "admin") return false;

    const targetUsername = (username || "").trim();
    if (!targetUsername) {
      setAlertMessage("Select a user first.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    const localUsers = managedUsers.length ? managedUsers : [];
    const targetUser = localUsers.find(
      (user) => user.username === targetUsername && user.role !== "admin"
    );

    if (!targetUser) {
      setAlertMessage("Selected user not found.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    try {
      await api.deleteUser(targetUsername);
      setManagedUsers((prev) =>
        prev.filter((user) => user.username !== targetUsername)
      );
    } catch (error) {
      setAlertMessage(error.message || "User delete failed on database.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    setSelectedAdminUsers((prev) =>
      prev.map((name) => (name === targetUsername ? "" : name))
    );

    setAlertMessage("User deleted successfully.");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2500);
    return true;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlertMessage("Please choose an image file.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const avatar = typeof reader.result === "string" ? reader.result : "";
      if (!avatar || !currentUser) return;

      let updatedCurrentUser = { ...currentUser, avatar };
      try {
        updatedCurrentUser = await api.updateUser(currentUser.username, { avatar });
        setManagedUsers((prev) =>
          prev.map((user) =>
            user.username === currentUser.username ? updatedCurrentUser : user
          )
        );
      } catch (error) {
        setAlertMessage("Profile photo database update failed.");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2500);
        e.target.value = "";
        return;
      }

      setCurrentUser(updatedCurrentUser);

      setAlertMessage("Profile photo updated.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const printPDF = (order) => {
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const qtyCount = order.items.reduce((sum, item) => sum + item.qty, 0);
    const tax = qtyCount * taxPerItem;
    const isDelivery = order.deliveryType === "delivery";
    const deliveryLocation = getDeliveryLocation(order);
    const estimateLines = order.items.reduce(
      (sum, item) => sum + Math.ceil(String(item.name || "").length / 22),
      0
    );
    const receiptHeight = Math.max(
      95,
      70 + estimateLines * 5 + order.items.length * 3 + (isDelivery ? 14 : 0)
    );
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, receiptHeight],
    });

    const pageWidth = 80;
    const margin = 5;
    const rightEdge = pageWidth - margin;
    const divider = (yPos) => doc.line(margin, yPos, rightEdge, yPos);

    doc.setProperties({ title: `TABAN FOOD RECEIPT ${order.id || ""}` });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TABAN FOOD", pageWidth / 2, 8, { align: "center" });
    doc.setFontSize(9);
    doc.text("RECEIPT", pageWidth / 2, 13, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let y = 20;
    doc.text(`Date: ${order.date}`, margin, y);
    y += 5;
    doc.text(`User: ${order.createdBy || "unknown"}`, margin, y);
    y += 5;
    doc.text(`Type: ${order.deliveryType || "pickup"}`, margin, y);
    y += 5;

    if (isDelivery && deliveryLocation) {
      const locationLines = doc.splitTextToSize(
        `Location: ${deliveryLocation.label}`,
        68
      );
      doc.text(locationLines, margin, y);
      y += locationLines.length * 4 + 2;
    }

    divider(y);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.text("Item", margin, y);
    doc.text("Qty", 47, y);
    doc.text("Price", 58, y, { align: "right" });
    doc.text("Total", rightEdge, y, { align: "right" });
    y += 3;
    divider(y);
    y += 5;

    doc.setFont("helvetica", "normal");
    order.items.forEach((item) => {
      const itemLines = doc.splitTextToSize(String(item.name || "Item"), 38);
      doc.text(itemLines, margin, y);
      doc.text(String(item.qty), 48, y, { align: "center" });
      doc.text(`$${item.price.toFixed(2)}`, 58, y, { align: "right" });
      doc.text(`$${(item.price * item.qty).toFixed(2)}`, rightEdge, y, {
        align: "right",
      });
      y += itemLines.length * 4 + 3;
    });

    divider(y);
    y += 6;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, margin, y);
    y += 5;
    doc.text(`Tax ($0.05/item): $${tax.toFixed(2)}`, margin, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`GRAND TOTAL: $${order.total.toFixed(2)}`, rightEdge, y, {
      align: "right",
    });
    y += 9;
    doc.setFontSize(8);
    doc.text("Thank you!", pageWidth / 2, y, { align: "center" });
    doc.autoPrint();
    const pdfUrl = doc.output("bloburl");
    window.open(pdfUrl, "_blank");
  };

  if (!currentUser) {
    return (
      <div className="container">
        <header className="main-header">
          <div className="brand">
            <span className="taban-text">TABAN</span>
            <span className="food-text">FOOD</span>
          </div>
        </header>

        <div className="login-wrap">
          <form className="login-card" onSubmit={handleLogin}>
            <h2>Local Login</h2>
            <input
              className="search-input"
              placeholder="Username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
            <input
              type="password"
              className="search-input"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="pay-btn">
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header
        currentUser={currentUser}
        onOpenProfile={openProfilePopup}
        onLogout={handleLogout}
        onBrandClick={() => setPage("pos")}
      />

      <div className={`app-shell sidebar-visible ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleSidebarToggle}
          page={page}
          setPage={setPage}
          isAdmin={isAdmin}
          onOpenProfile={openProfilePopup}
          activeSettingsSection={activeSettingsSection}
          setActiveSettingsSection={setActiveSettingsSection}
        />

        <div className="content-area">
          <div className="main-layout">
        {page === "dashboard" && (
          <Dashboard
            dashboardRange={dashboardRange}
            setDashboardRange={setDashboardRange}
            handleDownloadDashboardReport={handleDownloadDashboardReport}
            dashboardItems={dashboardItems}
            totalSystemItems={totalSystemItems}
            isAdmin={isAdmin}
            dashboardOrderCount={dashboardOrderCount}
            orderDeltaPercent={orderDeltaPercent}
            dashboardRangeLabel={dashboardRangeLabel}
            todayOrderCount={todayOrderCount}
            dashboardMoneyTotal={dashboardMoneyTotal}
            avgTicket={avgTicket}
            categoryChart={categoryChart}
            maxCategoryValue={maxCategoryValue}
            last7Days={last7Days}
            maxWeeklyValue={maxWeeklyValue}
            deliveryPercent={deliveryPercent}
            deliveryCount={deliveryCount}
            pickupCount={pickupCount}
            topItems={topItems}
            dashboardSellerTotals={dashboardSellerTotals}
          />
        )}

        {page === "pos" && (
          <Menu
            category={category}
            setCategory={setCategory}
            menuSearch={menuSearch}
            setMenuSearch={setMenuSearch}
            selectedCategoryLabel={selectedCategoryLabel}
            filteredMenuItems={filteredMenuItems}
            visibleItems={visibleItems}
            addToOrder={addToOrder}
            totalQty={totalQty}
            subTotal={subTotal}
            orders={orders}
            updateQty={updateQty}
            removeItem={removeItem}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            setDeliveryDistrict={setDeliveryDistrict}
            setDeliveryNeighborhood={setDeliveryNeighborhood}
            deliveryDistrict={deliveryDistrict}
            deliveryNeighborhood={deliveryNeighborhood}
            MOGADISHU_DISTRICTS={MOGADISHU_DISTRICTS}
            taxAmount={taxAmount}
            maxDiscount={maxDiscount}
            discount={discount}
            setDiscount={setDiscount}
            finalTotal={finalTotal}
            handlePay={handlePay}
          />
        )}
        {isAdmin && page === "orders" && (
          <Orders
            isAdmin={isAdmin}
            ordersSearch={ordersSearch}
            setOrdersSearch={setOrdersSearch}
            setOrdersPageNo={setOrdersPageNo}
            ordersUserFilter={ordersUserFilter}
            setOrdersUserFilter={setOrdersUserFilter}
            orderUserOptions={orderUserOptions}
            ordersTypeFilter={ordersTypeFilter}
            setOrdersTypeFilter={setOrdersTypeFilter}
            ordersSort={ordersSort}
            setOrdersSort={setOrdersSort}
            ordersPageSize={ordersPageSize}
            setOrdersPageSize={setOrdersPageSize}
            pagedOrders={pagedOrders}
            filteredSortedOrders={filteredSortedOrders}
            ordersPageNo={ordersPageNo}
            totalOrdersPages={totalOrdersPages}
            getDeliveryLocation={getDeliveryLocation}
            printPDF={printPDF}
            deleteOrder={deleteOrder}
            orderPageButtons={orderPageButtons}
            setPage={setPage}
          />
        )}

        {isAdmin && page === "orders MONEY" && (
          <OrdersMoney
            savedOrders={savedOrders}
            userSalesList={userSalesList}
            selectedAdminUsers={selectedAdminUsers}
            onSelectAdminUser={handleAdminUserSelect}
            selectedUsersSales={selectedUsersSales}
            openAdminDetailUsers={openAdminDetailUsers}
            toggleAdminDetail={toggleAdminDetail}
            getDeliveryLocation={getDeliveryLocation}
          />
        )}
        {page === "settings" && (
          <Settings
            currentUser={currentUser}
            isAdmin={isAdmin}
            restaurantInfo={restaurantInfo}
            onRestaurantInfoChange={handleRestaurantInfoChange}
            onRestaurantLogoUpload={handleRestaurantLogoUpload}
            paymentSettings={paymentSettings}
            onPaymentSettingsChange={handlePaymentSettingsChange}
            deliverySettings={deliverySettings}
            onDeliverySettingsChange={handleDeliverySettingsChange}
            onDeliveryAreaToggle={handleDeliveryAreaToggle}
            mogadishuDistricts={MOGADISHU_DISTRICTS}
            menuItems={menuItems}
            onMenuItemCategoryChange={handleMenuItemCategoryChange}
            onMenuItemPriceChange={handleMenuItemPriceChange}
            onMenuItemStockToggle={handleMenuItemStockToggle}
            onMenuItemDelete={handleMenuItemDelete}
            onMenuItemAdd={handleMenuItemAdd}
            managedUsers={managedUsers}
            onAdminUpdateUserCredentials={handleAdminUpdateUserCredentials}
            onAdminAddUser={handleAdminAddUser}
            onAdminDeleteUser={handleAdminDeleteUser}
            activeSettingsSection={activeSettingsSection}
            setActiveSettingsSection={setActiveSettingsSection}
          />
        )}

        <ReceiptModal
          paidReceiptOrder={paidReceiptOrder}
          paidReceiptLocation={paidReceiptLocation}
          setPaidReceiptOrder={setPaidReceiptOrder}
          printPDF={printPDF}
        />

        {showProfilePopup && (
          <Profile
            currentUser={currentUser}
            setShowProfilePopup={setShowProfilePopup}
            handleAvatarPick={handleAvatarPick}
            handleLogout={handleLogout}
          />
        )}

        {showAlert && (
          <div className="custom-alert">
            {alertMessage}
          </div>
        )}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="avatar-input"
          onChange={handleAvatarChange}
        />
          </div>
        </div>
      </div>
    </div>
  );
}
