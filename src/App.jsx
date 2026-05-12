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
  DEFAULT_USERS,
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

export default function App() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(() => {
    const raw = localStorage.getItem(MENU_ITEMS_KEY);
    const parsed = safeParseJSON(raw, null);
    return normalizeMenuItems(parsed || MENU);
  });
  const [savedOrders, setSavedOrders] = useState(() => {
    const raw = localStorage.getItem(SAVED_ORDERS_KEY);
    return safeParseJSON(raw, []);
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return safeParseJSON(raw, null);
  });
  const [managedUsers, setManagedUsers] = useState(() => {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = safeParseJSON(raw, DEFAULT_USERS);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_USERS;
  });
  const [restaurantInfo, setRestaurantInfo] = useState(() => {
    const raw = localStorage.getItem(RESTAURANT_INFO_KEY);
    const parsed = safeParseJSON(raw, {});
    return {
      ...DEFAULT_RESTAURANT_INFO,
      ...parsed,
      email:
        typeof parsed?.email === "string" && parsed.email.trim()
          ? parsed.email
          : DEFAULT_RESTAURANT_INFO.email,
      location:
        typeof parsed?.location === "string" && parsed.location.trim()
          ? parsed.location
          : DEFAULT_RESTAURANT_INFO.location,
    };
  });
  const [paymentSettings, setPaymentSettings] = useState(() => {
    const raw = localStorage.getItem(PAYMENT_SETTINGS_KEY);
    const parsed = safeParseJSON(raw, {});
    return { ...DEFAULT_PAYMENT_SETTINGS, ...parsed };
  });
  const [deliverySettings, setDeliverySettings] = useState(() => {
    const raw = localStorage.getItem(DELIVERY_SETTINGS_KEY);
    const parsed = safeParseJSON(raw, {});
    const normalizedAreas = Array.isArray(parsed.deliveryAreas)
      ? parsed.deliveryAreas
      : DEFAULT_DELIVERY_SETTINGS.deliveryAreas;
    return {
      ...DEFAULT_DELIVERY_SETTINGS,
      ...parsed,
      deliveryAreas: normalizedAreas,
    };
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [category, setCategory] = useState("fast");
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
  const [ordersTypeFilter, setOrdersTypeFilter] = useState("all");
  const [ordersSort, setOrdersSort] = useState("newest");
  const avatarInputRef = useRef(null);

  const menu = useMemo(() => buildMenuSections(menuItems), [menuItems]);
  const taxPerItem = 0.05;
  const visibleItems = menu[category] || menu.fast;
  const normalizedMenuSearch = menuSearch.trim().toLowerCase();
  const filteredMenuItems = visibleItems.filter((item) =>
    item.name.toLowerCase().includes(normalizedMenuSearch)
  );
  const dashboardItems = menu[category] || menu.fast;
  const totalSystemItems = menu.all.length;
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    let isMounted = true;

    api
      .bootstrap()
      .then((data) => {
        if (!isMounted) return;

        const nextUsers =
          Array.isArray(data.users) && data.users.length ? data.users : DEFAULT_USERS;
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

        setManagedUsers(nextUsers);
        setMenuItems(nextMenuItems);
        setSavedOrders(nextSavedOrders);
        setRestaurantInfo(nextRestaurantInfo);
        setPaymentSettings(nextPaymentSettings);
        setDeliverySettings(nextDeliverySettings);

        localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
        localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(nextMenuItems));
        localStorage.setItem(SAVED_ORDERS_KEY, JSON.stringify(nextSavedOrders));
        localStorage.setItem(RESTAURANT_INFO_KEY, JSON.stringify(nextRestaurantInfo));
        localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(nextPaymentSettings));
        localStorage.setItem(DELIVERY_SETTINGS_KEY, JSON.stringify(nextDeliverySettings));
      })
      .catch((error) => {
        console.warn("API bootstrap failed, using local data.", error);
        const usersRaw = localStorage.getItem(USERS_KEY);
        const localUsers = safeParseJSON(usersRaw, null);
        if (!Array.isArray(localUsers) || localUsers.length === 0) {
          localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
          setManagedUsers(DEFAULT_USERS);
          return;
        }
        setManagedUsers(localUsers);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVED_ORDERS_KEY, JSON.stringify(savedOrders));
  }, [savedOrders]);

  useEffect(() => {
    localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(RESTAURANT_INFO_KEY, JSON.stringify(restaurantInfo));
  }, [restaurantInfo]);

  useEffect(() => {
    localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(paymentSettings));
  }, [paymentSettings]);

  useEffect(() => {
    localStorage.setItem(DELIVERY_SETTINGS_KEY, JSON.stringify(deliverySettings));
  }, [deliverySettings]);

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
  const normalizedOrdersSearch = ordersSearch.trim().toLowerCase();
  const filteredSortedOrders = useMemo(() => {
    const filtered = visibleSavedOrders.filter((order) => {
      const type = order.deliveryType || "pickup";
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
  }, [visibleSavedOrders, ordersTypeFilter, normalizedOrdersSearch, ordersSort]);
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
    category === "normalday" ? "Normal Day" : category.charAt(0).toUpperCase() + category.slice(1);
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
    const totalsByUser = userSalesList.reduce((acc, user) => {
      acc[user.username] = user.total;
      return acc;
    }, {});

    return selectedAdminUsers
      .filter(Boolean)
      .map((username) => ({
        username,
        total: totalsByUser[username] || 0,
      }));
  }, [selectedAdminUsers, userSalesList]);
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
      setAlertMessage("Backend not connected. Order saved locally.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    }

    setSavedOrders((prev) => [...prev, savedOrder]);
    setPaidReceiptOrder(savedOrder);
    setOrders([]);
    setDiscount(0);
    setDeliveryType("pickup");
    setDeliveryDistrict("");
    setDeliveryNeighborhood("");

    // Show custom alert
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
    } catch {
      const usersRaw = localStorage.getItem(USERS_KEY);
      const localUsers = safeParseJSON(usersRaw, DEFAULT_USERS);
      foundUser = localUsers.find(
        (u) => u.username === cleanUsername && u.password === passwordInput
      );
    }

    if (!foundUser) {
      setLoginError("Invalid username or password");
      return;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
    setCurrentUser(foundUser);
    setLoginError("");
    setUsernameInput("");
    setPasswordInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
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

  const persistUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    setManagedUsers(users);
    api.saveUsers(users).catch(() => {
      setAlertMessage("Users saved locally. Backend sync failed.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    });
  };

  const persistMenuItems = (updater) => {
    setMenuItems((prev) => {
      const nextItems =
        typeof updater === "function" ? updater(prev) : normalizeMenuItems(updater);
      api.saveMenuItems(nextItems).catch(() => {
        setAlertMessage("Menu saved locally. Backend sync failed.");
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

  const handleAdminUpdateUserCredentials = (
    selectedUsername,
    nextUsername,
    nextPassword
  ) => {
    if (!currentUser || currentUser.role !== "admin") return false;

    const targetUsername = (selectedUsername || "").trim();
    const cleanUsername = (nextUsername || "").trim();
    const cleanPassword = (nextPassword || "").trim();

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
    if (!cleanPassword || cleanPassword.length < 4) {
      setAlertMessage("New password must be at least 4 characters.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    const usersRaw = localStorage.getItem(USERS_KEY);
    const localUsers = safeParseJSON(usersRaw, DEFAULT_USERS);
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

    const updatedUsers = localUsers.map((user) =>
      user.username === targetUsername
        ? { ...user, username: cleanUsername, password: cleanPassword }
        : user
    );
    persistUsers(updatedUsers);

    setAlertMessage("User updated successfully.");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2500);
    return true;
  };

  const handleAdminAddUser = (username, password) => {
    if (!currentUser || currentUser.role !== "admin") return false;

    const cleanUsername = (username || "").trim();
    const cleanPassword = (password || "").trim();

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

    const usersRaw = localStorage.getItem(USERS_KEY);
    const localUsers = safeParseJSON(usersRaw, DEFAULT_USERS);
    if (localUsers.some((user) => user.username === cleanUsername)) {
      setAlertMessage("Username already exists.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return false;
    }

    const updatedUsers = [
      ...localUsers,
      { username: cleanUsername, password: cleanPassword, role: "user" },
    ];
    persistUsers(updatedUsers);

    setAlertMessage("New user added.");
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
    reader.onload = () => {
      const avatar = typeof reader.result === "string" ? reader.result : "";
      if (!avatar || !currentUser) return;

      const usersRaw = localStorage.getItem(USERS_KEY);
      const localUsers = safeParseJSON(usersRaw, DEFAULT_USERS);
      const updatedUsers = localUsers.map((user) =>
        user.username === currentUser.username ? { ...user, avatar } : user
      );

      persistUsers(updatedUsers);
      const updatedCurrentUser = { ...currentUser, avatar };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
      setCurrentUser(updatedCurrentUser);

      setAlertMessage("Profile photo updated.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const printPDF = (order) => {
    const doc = new jsPDF();
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const qtyCount = order.items.reduce((sum, item) => sum + item.qty, 0);
    const tax = qtyCount * taxPerItem;

    doc.setFontSize(16);
    doc.text("TABAN FOOD RECEIPT", 14, 16);
    doc.setFontSize(11);
    doc.text(`Date: ${order.date}`, 14, 24);
    doc.text(`User: ${order.createdBy || "unknown"}`, 14, 30);

    let y = 40;
    doc.text("Item", 14, y);
    doc.text("Qty", 110, y);
    doc.text("Price", 140, y);
    doc.text("Total", 176, y, { align: "right" });
    y += 3;
    doc.line(14, y, 196, y);
    y += 7;

    order.items.forEach((item) => {
      const itemName =
        item.name.length > 24 ? `${item.name.slice(0, 24)}...` : item.name;
      doc.text(itemName, 14, y);
      doc.text(String(item.qty), 110, y);
      doc.text(`$${item.price.toFixed(2)}`, 140, y);
      doc.text(`$${(item.price * item.qty).toFixed(2)}`, 176, y, {
        align: "right",
      });
      y += 7;
    });

    y += 2;
    doc.line(14, y, 196, y);
    y += 8;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`Tax ($0.05/item): $${tax.toFixed(2)}`, 14, y);
    y += 7;
    doc.setFontSize(12);
    doc.text(`Grand Total: $${order.total.toFixed(2)}`, 14, y);
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
            <p className="login-help">Local users: abdi ladiif/1234, saabir2/1234, admin/1234</p>
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
            managedUsers={managedUsers}
            onAdminUpdateUserCredentials={handleAdminUpdateUserCredentials}
            onAdminAddUser={handleAdminAddUser}
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
